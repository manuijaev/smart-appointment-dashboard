import requests
import logging
from django.conf import settings
from django.core.mail import get_connection
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def _build_email_connection():
    # Keep SMTP failures bounded so web workers do not hang.
    return get_connection(timeout=getattr(settings, 'EMAIL_TIMEOUT', 8))


def send_appointment_email(staff_email, visitor_name, appointment_date, message):
    if not staff_email:
        logger.warning('send_appointment_email skipped: no staff_email provided')
        return

    subject = 'New Appointment Request'
    body = (
        f'Visitor Name: {visitor_name}\n'
        f'Date: {appointment_date}\n'
        f'Message: {message or "No message provided."}\n'
    )

    try:
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [staff_email],
            fail_silently=False,
            connection=_build_email_connection(),
        )
        logger.info(f'Appointment email sent successfully to {staff_email}')
    except Exception as e:
        logger.error(f'Failed to send email to {staff_email}: {str(e)}')
        raise


def send_appointment_response_email(visitor_email, visitor_name, status, response_note, appointment_date, staff_name):
    if not visitor_email:
        return

    subject = f'Update on Your Appointment Request ({status})'
    body = (
        f'Hello {visitor_name},\n\n'
        f'Your appointment request has been updated to: {status}\n'
        f'Date: {appointment_date}\n'
        f'Staff: {staff_name}\n\n'
        f'Staff response:\n{response_note}\n\n'
        'Thank you.'
    )
    send_mail(
        subject,
        body,
        settings.DEFAULT_FROM_EMAIL,
        [visitor_email],
        fail_silently=True,
        connection=_build_email_connection(),
    )


def send_fcm_push_notification(fcm_token, title, body):
    if not fcm_token:
        return {'sent': False, 'reason': 'missing_staff_fcm_token'}

    # Legacy server-key auth only (Google auth disabled).
    if not settings.FIREBASE_SERVER_KEY:
        return {'sent': False, 'reason': 'missing_firebase_credentials'}

    headers = {
        'Authorization': f'key={settings.FIREBASE_SERVER_KEY}',
        'Content-Type': 'application/json',
    }
    payload = {
        'to': fcm_token,
        'priority': 'high',
        'content_available': True,
        'notification': {
            'title': title,
            'body': body,
        },
        'data': {
            'title': title,
            'body': body,
            'click_action': '/staff/dashboard',
            'url': '/staff/dashboard',
        },
    }

    try:
        response = requests.post('https://fcm.googleapis.com/fcm/send', json=payload, headers=headers, timeout=10)
        if response.ok:
            return {'sent': True, 'status_code': response.status_code}
        body_text = response.text[:500]
        return {
            'sent': False,
            'reason': 'firebase_send_failed',
            'status_code': response.status_code,
            'body': body_text,
            'invalid_token': 'NotRegistered' in body_text or 'InvalidRegistration' in body_text,
        }
    except requests.RequestException as exc:
        return {'sent': False, 'reason': 'firebase_request_exception', 'error': str(exc)[:300]}

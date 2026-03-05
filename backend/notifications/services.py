import requests
import logging
from django.conf import settings
from django.core.mail import get_connection
from django.core.mail import send_mail
from google.auth.transport.requests import Request
from google.oauth2 import service_account

logger = logging.getLogger(__name__)


def _build_email_connection():
    # Keep SMTP failures bounded so web workers do not hang.
    return get_connection(timeout=getattr(settings, 'EMAIL_TIMEOUT', 8))


def send_appointment_email(staff_email, visitor_name, appointment_date, message):
    if not staff_email:
        return

    subject = 'New Appointment Request'
    body = (
        f'Visitor Name: {visitor_name}\n'
        f'Date: {appointment_date}\n'
        f'Message: {message or "No message provided."}\n'
    )

    send_mail(
        subject,
        body,
        settings.DEFAULT_FROM_EMAIL,
        [staff_email],
        fail_silently=True,
        connection=_build_email_connection(),
    )


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

    # Prefer modern FCM HTTP v1 when service-account credentials are configured.
    if settings.FIREBASE_PROJECT_ID and settings.FIREBASE_CLIENT_EMAIL and settings.FIREBASE_PRIVATE_KEY:
        try:
            v1_result = _send_fcm_push_notification_v1(fcm_token, title, body)
            if v1_result.get('sent'):
                return v1_result
            if not settings.FIREBASE_SERVER_KEY:
                return v1_result
            logger.warning('FCM v1 send failed; falling back to legacy API. reason=%s', v1_result.get('reason'))
        except Exception as exc:
            if not settings.FIREBASE_SERVER_KEY:
                return {
                    'sent': False,
                    'reason': 'firebase_v1_exception',
                    'error': str(exc)[:300],
                    'api': 'fcm_v1',
                }
            logger.exception('FCM v1 send raised exception; falling back to legacy API')

    # Fallback to legacy server-key auth if still configured.
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


def _send_fcm_push_notification_v1(fcm_token, title, body):
    credentials_info = {
        'type': 'service_account',
        'project_id': settings.FIREBASE_PROJECT_ID,
        'private_key': settings.FIREBASE_PRIVATE_KEY,
        'client_email': settings.FIREBASE_CLIENT_EMAIL,
        'token_uri': 'https://oauth2.googleapis.com/token',
    }

    credentials = service_account.Credentials.from_service_account_info(
        credentials_info,
        scopes=['https://www.googleapis.com/auth/firebase.messaging'],
    )
    credentials.refresh(Request())

    headers = {
        'Authorization': f'Bearer {credentials.token}',
        'Content-Type': 'application/json; charset=UTF-8',
    }
    payload = {
        'message': {
            'token': fcm_token,
            'notification': {
                'title': title,
                'body': body,
            },
            'webpush': {
                'headers': {
                    'Urgency': 'high',
                    'TTL': '300',
                },
                'fcm_options': {
                    'link': '/staff/dashboard',
                },
                'notification': {
                    'title': title,
                    'body': body,
                    'icon': '/favicon.ico',
                    'requireInteraction': True,
                    'tag': 'appointment-update',
                },
            },
            'data': {
                'title': title,
                'body': body,
                'click_action': '/staff/dashboard',
                'url': '/staff/dashboard',
            },
        }
    }

    url = f'https://fcm.googleapis.com/v1/projects/{settings.FIREBASE_PROJECT_ID}/messages:send'
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.ok:
            return {'sent': True, 'status_code': response.status_code, 'api': 'fcm_v1'}
        body_text = response.text[:500]
        return {
            'sent': False,
            'reason': 'firebase_send_failed',
            'status_code': response.status_code,
            'body': body_text,
            'invalid_token': 'UNREGISTERED' in body_text or 'registration-token-not-registered' in body_text,
            'api': 'fcm_v1',
        }
    except requests.RequestException as exc:
        return {'sent': False, 'reason': 'firebase_request_exception', 'error': str(exc)[:300], 'api': 'fcm_v1'}

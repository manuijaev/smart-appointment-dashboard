import logging
import threading

from rest_framework import generics, permissions
from rest_framework.response import Response
from django.utils import timezone

from notifications.services import send_fcm_push_notification
from notifications.emailjs_service import (
    REQUEST_TEMPLATE_ID,
    RESPONSE_TEMPLATE_ID,
    send_emailjs,
)
from notifications.sms_service import send_visitor_sms
from users.models import UserDeviceToken

from .models import Appointment
from .serializers import AppointmentCreateSerializer, AppointmentListSerializer, AppointmentUpdateSerializer, AppointmentReassignSerializer

logger = logging.getLogger(__name__)


def _format_local_time(dt):
    return timezone.localtime(dt).strftime("%b %d, %Y at %I:%M %p")


def _notify_new_appointment(appointment):
    logger.info(f'Starting notification for appointment_id={appointment.id}, staff_member={appointment.staff_member}')
    
    try:
        staff_email = appointment.staff_member.email
        logger.info(f'Sending email to staff: {staff_email}')
        formatted_date = _format_local_time(appointment.appointment_date)
        send_emailjs(
            REQUEST_TEMPLATE_ID,
            {
                "to_email": staff_email,
                "to_name": appointment.staff_member.full_name or appointment.staff_member.first_name or "Staff",
                "visitor_name": appointment.visitor_name,
                "visitor_email": appointment.visitor_email,
                "department_name": appointment.department.name if appointment.department else "",
                "division_name": appointment.division.name if appointment.division else "",
                "appointment_date": formatted_date,
                "message": appointment.message or "",
                "staff_name": appointment.staff_member.full_name or appointment.staff_member.first_name or "Staff",
            },
        )
        logger.info(f'EmailJS request email queued for staff {staff_email}')
    except Exception as e:
        logger.exception('Failed to send appointment request email for appointment_id=%s: %s', appointment.id, str(e))

    try:
        token_set = set(
            UserDeviceToken.objects.filter(user=appointment.staff_member, is_active=True).values_list('token', flat=True)
        )
        if appointment.staff_member.fcm_token:
            token_set.add(appointment.staff_member.fcm_token)

        if not token_set:
            logger.info('Push skipped for appointment_id=%s reason=no_registered_device_tokens', appointment.id)
            return

        sent_count = 0
        failed_count = 0
        for token in token_set:
            local_appt_time = timezone.localtime(appointment.appointment_date).strftime('%b %d, %Y at %I:%M %p')
            push_result = send_fcm_push_notification(
                fcm_token=token,
                title='Visitor Waiting',
                body=f'You have a visitor: {appointment.visitor_name} is here for you',
            )
            if push_result.get('sent'):
                sent_count += 1
            else:
                failed_count += 1
            if push_result.get('invalid_token'):
                UserDeviceToken.objects.filter(token=token).update(is_active=False)
                if token == appointment.staff_member.fcm_token:
                    appointment.staff_member.fcm_token = ''
                    appointment.staff_member.save(update_fields=['fcm_token'])
                logger.warning(
                    'Deactivated stale FCM token for staff_id=%s appointment_id=%s',
                    appointment.staff_member_id,
                    appointment.id,
                )
            logger.info(
                'Push dispatch result appointment_id=%s staff_id=%s token_prefix=%s result=%s',
                appointment.id,
                appointment.staff_member_id,
                token[:12],
                push_result,
            )
        logger.info(
            'Push fanout summary appointment_id=%s sent=%s failed=%s total_tokens=%s',
            appointment.id,
            sent_count,
            failed_count,
            len(token_set),
        )
    except Exception:
        logger.exception('Failed to send FCM push for appointment_id=%s', appointment.id)


def _notify_appointment_response(appointment, staff_name=None):
    try:
        formatted_date = _format_local_time(appointment.appointment_date)
        send_emailjs(
            RESPONSE_TEMPLATE_ID,
            {
                "visitor_name": appointment.visitor_name,
                "visitor_email": appointment.visitor_email,
                "status": appointment.status,
                "response_note": appointment.response_note or "",
                "appointment_date": formatted_date,
                "staff_name": staff_name or appointment.staff_member.full_name or "Staff",
            },
        )
        send_visitor_sms(
            phone_number=appointment.visitor_phone,
            visitor_name=appointment.visitor_name,
            staff_name=staff_name or appointment.staff_member.full_name,
            status=appointment.status,
            response_note=appointment.response_note or '',
        )
    except Exception:
        logger.exception('Failed to send appointment response notifications for appointment_id=%s', appointment.id)


class AppointmentCreateView(generics.CreateAPIView):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentCreateSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data = {
            'message': 'Appointment request created',
            'data': response.data,
            'push': getattr(self, '_push_result', {'sent': False, 'reason': 'unknown'}),
            'email': getattr(self, '_email_result', {'sent': False, 'reason': 'unknown'}),
        }
        return response

    def perform_create(self, serializer):
        appointment = serializer.save()
        # Send email and push synchronously to ensure delivery
        self._email_result = {'sent': False, 'reason': 'unknown'}
        self._push_result = {'sent': False, 'reason': 'unknown'}
        
        # Send email immediately (synchronously)
        try:
            staff_email = appointment.staff_member.email
            formatted_date = _format_local_time(appointment.appointment_date)
            success = send_emailjs(
                REQUEST_TEMPLATE_ID,
                {
                    "to_email": staff_email,
                    "to_name": appointment.staff_member.full_name or appointment.staff_member.first_name or "Staff",
                    "visitor_name": appointment.visitor_name,
                    "visitor_email": appointment.visitor_email,
                    "department_name": appointment.department.name if appointment.department else "",
                    "division_name": appointment.division.name if appointment.division else "",
                    "appointment_date": formatted_date,
                    "message": appointment.message or "",
                    "staff_name": appointment.staff_member.full_name or appointment.staff_member.first_name or "Staff",
                },
            )
            self._email_result = {'sent': success, 'reason': 'sent' if success else 'failed'}
        except Exception as e:
            logger.exception('Failed to send appointment email: %s', str(e))
            self._email_result = {'sent': False, 'reason': str(e)[:100]}
        
        # Send push notification
        try:
            token_set = set(
                UserDeviceToken.objects.filter(user=appointment.staff_member, is_active=True).values_list('token', flat=True)
            )
            if appointment.staff_member.fcm_token:
                token_set.add(appointment.staff_member.fcm_token)

            if token_set:
                local_appt_time = timezone.localtime(appointment.appointment_date).strftime('%b %d, %Y at %I:%M %p')
                push_result = send_fcm_push_notification(
                    fcm_token=list(token_set)[0],  # Send to first token
                    title='Visitor Waiting',
                    body=f'You have a visitor: {appointment.visitor_name} is here for you',
                )
                self._push_result = push_result
        except Exception as e:
            logger.exception('Failed to send push notification: %s', str(e))
            self._push_result = {'sent': False, 'reason': str(e)[:100]}


class MyAppointmentsView(generics.ListAPIView):
    serializer_class = AppointmentListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) == 'Admin':
            return Appointment.objects.select_related('department', 'division', 'staff_member').all()
        return Appointment.objects.select_related('department', 'division', 'staff_member').filter(staff_member=user)


class AppointmentUpdateView(generics.UpdateAPIView):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = 'id'

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) == 'Admin':
            return Appointment.objects.all()
        return Appointment.objects.filter(staff_member=user)

    def perform_update(self, serializer):
        appointment = serializer.save()
        threading.Thread(
            target=_notify_appointment_response,
            args=(appointment, getattr(self.request.user, 'full_name', None)),
            daemon=True,
        ).start()

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        return Response({'message': 'Appointment updated', 'data': response.data})


class AppointmentDeleteView(generics.DestroyAPIView):
    queryset = Appointment.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = 'id'

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) == 'Admin':
            return Appointment.objects.all()
        return Appointment.objects.filter(staff_member=user)


class AppointmentReassignView(generics.UpdateAPIView):
    """
    Admin-only endpoint to reassign appointments to different staff members.
    """
    queryset = Appointment.objects.all()
    serializer_class = AppointmentReassignSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = 'id'

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) == 'Admin':
            return Appointment.objects.all()
        return Appointment.objects.none()

    def update(self, request, *args, **kwargs):
        appointment = self.get_object()
        old_staff = appointment.staff_member
        response = super().update(request, *args, **kwargs)
        appointment.refresh_from_db()
        new_staff = appointment.staff_member
        # TODO: Notify new staff member of reassignment
        return Response({
            'message': f'Appointment reassigned from {old_staff.full_name} to {new_staff.full_name}',
            'data': response.data
        })

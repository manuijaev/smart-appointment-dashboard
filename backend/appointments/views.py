import logging
import threading

from rest_framework import generics, permissions
from rest_framework.response import Response

from notifications.services import send_appointment_email, send_appointment_response_email, send_fcm_push_notification

from .models import Appointment
from .serializers import AppointmentCreateSerializer, AppointmentListSerializer, AppointmentUpdateSerializer

logger = logging.getLogger(__name__)


def _notify_new_appointment(appointment):
    try:
        send_appointment_email(
            staff_email=appointment.staff_member.email,
            visitor_name=appointment.visitor_name,
            appointment_date=appointment.appointment_date,
            message=appointment.message,
        )
    except Exception:
        logger.exception('Failed to send appointment request email for appointment_id=%s', appointment.id)

    try:
        send_fcm_push_notification(
            fcm_token=appointment.staff_member.fcm_token,
            title='New Appointment Request',
            body=f'You have a new appointment from {appointment.visitor_name}',
        )
    except Exception:
        logger.exception('Failed to send FCM push for appointment_id=%s', appointment.id)


def _notify_appointment_response(appointment):
    try:
        send_appointment_response_email(
            visitor_email=appointment.visitor_email,
            visitor_name=appointment.visitor_name,
            status=appointment.status,
            response_note=appointment.response_note,
            appointment_date=appointment.appointment_date,
            staff_name=appointment.staff_member.full_name,
        )
    except Exception:
        logger.exception('Failed to send appointment response email for appointment_id=%s', appointment.id)


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
        }
        return response

    def perform_create(self, serializer):
        appointment = serializer.save()
        self._push_result = {'sent': False, 'reason': 'deferred_to_async_worker'}
        threading.Thread(target=_notify_new_appointment, args=(appointment,), daemon=True).start()


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
        threading.Thread(target=_notify_appointment_response, args=(appointment,), daemon=True).start()

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

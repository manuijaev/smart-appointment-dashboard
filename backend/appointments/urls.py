from django.urls import path

from .views import AppointmentCreateView, AppointmentDeleteView, AppointmentUpdateView, MyAppointmentsView

urlpatterns = [
    path('appointments/create/', AppointmentCreateView.as_view(), name='appointment-create'),
    path('appointments/my/', MyAppointmentsView.as_view(), name='my-appointments'),
    path('appointments/update/<int:id>/', AppointmentUpdateView.as_view(), name='appointment-update'),
    path('appointments/delete/<int:id>/', AppointmentDeleteView.as_view(), name='appointment-delete'),
]

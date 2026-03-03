from django.contrib import admin

from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'visitor_name', 'visitor_email', 'staff_member', 'department', 'division', 'appointment_date', 'status')
    list_filter = ('status', 'department', 'division')
    search_fields = ('visitor_name', 'visitor_email', 'staff_member__full_name')

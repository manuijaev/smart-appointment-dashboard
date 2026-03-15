from rest_framework import serializers

from .models import Appointment


class AppointmentCreateSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        department = attrs.get('department')
        division = attrs.get('division')
        staff = attrs.get('staff_member')

        if not division:
            raise serializers.ValidationError({'division': 'Division is required.'})
        if division and department and division.department_id != department.id:
            raise serializers.ValidationError({'division': 'Selected division does not belong to this department.'})
        if staff and department and staff.department_id != department.id:
            raise serializers.ValidationError({'staff_member': 'Selected staff does not belong to this department.'})
        if staff and division and staff.division_id != division.id:
            raise serializers.ValidationError({'staff_member': 'Selected staff does not belong to this division.'})
        return attrs

    class Meta:
        model = Appointment
        fields = [
            'id',
            'visitor_name',
            'visitor_email',
            'department',
            'division',
            'staff_member',
            'appointment_date',
            'message',
            'status',
            'response_note',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'response_note', 'created_at']


class AppointmentListSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)
    staff_name = serializers.CharField(source='staff_member.full_name', read_only=True)
    staff_email = serializers.CharField(source='staff_member.email', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id',
            'visitor_name',
            'visitor_email',
            'department',
            'department_name',
            'division',
            'division_name',
            'staff_member',
            'staff_name',
            'staff_email',
            'appointment_date',
            'message',
            'status',
            'response_note',
            'created_at',
        ]


class AppointmentUpdateSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        status = attrs.get('status', getattr(self.instance, 'status', None))
        response_note = attrs.get('response_note', getattr(self.instance, 'response_note', ''))
        if status in ('Accepted', 'Rescheduled', 'Declined') and not str(response_note or '').strip():
            raise serializers.ValidationError({'response_note': 'Response note is required when updating appointment status.'})
        return attrs

    class Meta:
        model = Appointment
        fields = ['status', 'response_note', 'appointment_date', 'staff_member']


class AppointmentReassignSerializer(serializers.ModelSerializer):
    """Serializer for admin to reassign appointments to different staff."""
    class Meta:
        model = Appointment
        fields = ['staff_member']

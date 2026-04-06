from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import secrets

from .models import User


class StaffListSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'phone', 'department', 'department_name', 'division', 'division_name', 'role', 'is_active', 'is_available', 'availability_reason']



class StaffAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['is_available', 'availability_reason']


class StaffRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'phone', 'department', 'division', 'role', 'password', 'fcm_token']
        read_only_fields = ['id']

    def validate(self, attrs):
        department = attrs.get('department')
        division = attrs.get('division')
        if department and division and division.department_id != department.id:
            raise serializers.ValidationError({'division': 'Selected division does not belong to this department.'})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.get('role', User.Role.STAFF)
        is_staff_flag = role == User.Role.ADMIN
        return User.objects.create_user(password=password, is_staff=is_staff_flag, **validated_data)


class StaffManageSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id',
            'full_name',
            'email',
            'phone',
            'department',
            'department_name',
            'division',
            'division_name',
            'role',
            'is_active',
            'is_available',
            'availability_reason',
            'password',
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        department = attrs.get('department', getattr(self.instance, 'department', None))
        division = attrs.get('division', getattr(self.instance, 'division', None))
        if department and division and division.department_id != department.id:
            raise serializers.ValidationError({'division': 'Selected division does not belong to this department.'})
        return attrs

    def validate_password(self, value):
        if value and len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters.')
        return value

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save(update_fields=['password'])
        return user


class StaffCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for admin to create staff accounts.
    Generates a temporary password and can send welcome email.
    """
    password = serializers.CharField(write_only=True, min_length=8, required=False)
    send_welcome_email = serializers.BooleanField(default=False, write_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'full_name',
            'email',
            'phone',
            'department',
            'division',
            'role',
            'password',
            'send_welcome_email',
        ]
        read_only_fields = ['id']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._temp_password = None

    def get_temp_password(self):
        return self._temp_password

    def validate(self, attrs):
        department = attrs.get('department')
        division = attrs.get('division')
        if department and division and division.department_id != department.id:
            raise serializers.ValidationError({'division': 'Selected division does not belong to this department.'})
        # Generate temp password if not provided
        if not attrs.get('password'):
            self._temp_password = self._generate_temp_password()
            attrs['password'] = self._temp_password
        return attrs

    def _generate_temp_password(self):
        """Generate a secure temporary password."""
        chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
        return ''.join(secrets.choice(chars) for _ in range(10))

    def create(self, validated_data):
        send_welcome = validated_data.pop('send_welcome_email', False)
        password = validated_data.pop('password')
        role = validated_data.get('role', User.Role.STAFF)
        is_staff_flag = role == User.Role.ADMIN

        user = User.objects.create_user(
            password=password,
            is_staff=is_staff_flag,
            **validated_data
        )

        # TODO: Send welcome email if send_welcome is True
        # This would integrate with the notification service

        return user


class PasswordResetSerializer(serializers.Serializer):
    """
    Serializer for admin to reset staff password.
    Generates a new temporary password.
    """
    password = serializers.CharField(write_only=True, min_length=8, required=False)

    class Meta:
        fields = ['password']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._temp_password = None

    def get_temp_password(self):
        return self._temp_password

    def validate(self, attrs):
        if not attrs.get('password'):
            self._temp_password = self._generate_temp_password()
            attrs['password'] = self._temp_password
        return attrs

    def _generate_temp_password(self):
        """Generate a secure temporary password."""
        chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
        return ''.join(secrets.choice(chars) for _ in range(10))

    def save(self):
        user = self.instance
        user.set_password(self._temp_password)
        user.save(update_fields=['password'])
        return user


class StaffLoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['full_name'] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'full_name': self.user.full_name,
            'role': self.user.role,
            'department': self.user.department_id,
            'division': self.user.division_id,
            'is_available': self.user.is_available,
            'availability_reason': self.user.availability_reason,
        }
        return data


class FCMTokenUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['fcm_token']

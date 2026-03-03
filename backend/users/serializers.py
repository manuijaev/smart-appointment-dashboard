from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class StaffListSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'department', 'department_name', 'division', 'division_name', 'role', 'is_active']


class StaffRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'department', 'division', 'role', 'password', 'fcm_token']
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

    class Meta:
        model = User
        fields = [
            'id',
            'full_name',
            'email',
            'department',
            'department_name',
            'division',
            'division_name',
            'role',
            'is_active',
        ]
        read_only_fields = ['id', 'email']

    def validate(self, attrs):
        department = attrs.get('department', getattr(self.instance, 'department', None))
        division = attrs.get('division', getattr(self.instance, 'division', None))
        if department and division and division.department_id != department.id:
            raise serializers.ValidationError({'division': 'Selected division does not belong to this department.'})
        return attrs


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
        }
        return data


class FCMTokenUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['fcm_token']

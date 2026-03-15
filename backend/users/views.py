from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .models import UserDeviceToken
from .permissions import IsAdminRole
from .serializers import (
    FCMTokenUpdateSerializer,
    StaffListSerializer,
    StaffLoginSerializer,
    StaffManageSerializer,
    StaffRegisterSerializer,
    StaffCreateSerializer,
    PasswordResetSerializer,
)


class StaffByDepartmentListView(generics.ListAPIView):
    serializer_class = StaffListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        department_id = self.request.query_params.get('department_id')
        division_id = self.request.query_params.get('division_id')
        include_inactive = self.request.query_params.get('include_inactive') == '1'
        qs = User.objects.filter(role=User.Role.STAFF)
        if not include_inactive or not self.request.user.is_authenticated or getattr(self.request.user, 'role', '') != User.Role.ADMIN:
            qs = qs.filter(is_active=True)
        if department_id:
            qs = qs.filter(department_id=department_id)
        if division_id:
            qs = qs.filter(division_id=division_id)
        return qs.order_by('full_name')


class StaffRegisterView(generics.CreateAPIView):
    """Self-registration is disabled. Use admin-created accounts only."""
    serializer_class = StaffRegisterSerializer
    permission_classes = [IsAdminRole]


class StaffLoginView(TokenObtainPairView):
    serializer_class = StaffLoginSerializer
    permission_classes = [permissions.AllowAny]


class UpdateFCMTokenView(generics.UpdateAPIView):
    serializer_class = FCMTokenUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        token = str(request.data.get('fcm_token', '')).strip()
        if token:
            UserDeviceToken.objects.update_or_create(
                token=token,
                defaults={
                    'user': request.user,
                    'user_agent': request.headers.get('User-Agent', '')[:255],
                    'is_active': True,
                },
            )
        return Response({'message': 'FCM token updated', 'data': response.data})


class StaffDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StaffManageSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return User.objects.filter(role__in=[User.Role.STAFF, User.Role.ADMIN]).order_by('id')

    def perform_destroy(self, instance):
        if instance.id == self.request.user.id:
            raise PermissionDenied('You cannot delete your own account.')
        super().perform_destroy(instance)


class StaffDeactivateView(generics.UpdateAPIView):
    serializer_class = StaffManageSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return User.objects.filter(role__in=[User.Role.STAFF, User.Role.ADMIN])

    def update(self, request, *args, **kwargs):
        staff_user = self.get_object()
        if staff_user.id == request.user.id:
            return Response({'detail': 'You cannot deactivate your own account.'}, status=403)
        staff_user.is_active = False
        staff_user.save(update_fields=['is_active'])
        return Response({'message': 'Staff account deactivated'})


class StaffActivateView(generics.UpdateAPIView):
    """Admin-only endpoint to activate a staff or admin account."""
    serializer_class = StaffManageSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return User.objects.filter(role__in=[User.Role.STAFF, User.Role.ADMIN])

    def update(self, request, *args, **kwargs):
        staff_user = self.get_object()
        staff_user.is_active = True
        staff_user.save(update_fields=['is_active'])
        return Response({'message': 'Staff account activated'})


class StaffCreateView(generics.CreateAPIView):
    """
    Admin-only endpoint to create staff or admin accounts.
    Generates a temporary password that must be changed on first login.
    """
    serializer_class = StaffCreateSerializer
    permission_classes = [IsAdminRole]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        staff_user = serializer.save()
        return Response({
            'message': 'Staff account created successfully',
            'staff': StaffManageSerializer(staff_user).data,
            'temp_password': serializer.get_temp_password()
        }, status=status.HTTP_201_CREATED)


class StaffResetPasswordView(generics.UpdateAPIView):
    """
    Admin-only endpoint to reset a staff member's password.
    Generates a new temporary password.
    """
    serializer_class = PasswordResetSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return User.objects.filter(role__in=[User.Role.STAFF, User.Role.ADMIN])

    def update(self, request, *args, **kwargs):
        staff_user = self.get_object()
        if staff_user.id == request.user.id:
            return Response({'detail': 'You cannot reset your own password through this endpoint.'}, status=403)
        serializer = self.get_serializer(staff_user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'message': 'Password reset successfully',
            'temp_password': serializer.get_temp_password()
        })

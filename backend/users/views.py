from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .permissions import IsAdminRole
from .serializers import (
    FCMTokenUpdateSerializer,
    StaffListSerializer,
    StaffLoginSerializer,
    StaffManageSerializer,
    StaffRegisterSerializer,
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
    serializer_class = StaffRegisterSerializer
    permission_classes = [permissions.AllowAny]


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
        return Response({'message': 'FCM token updated', 'data': response.data})


class StaffDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StaffManageSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return User.objects.filter(role=User.Role.STAFF).order_by('id')

    def perform_destroy(self, instance):
        if instance.id == self.request.user.id:
            raise PermissionDenied('You cannot delete your own account.')
        super().perform_destroy(instance)


class StaffDeactivateView(generics.UpdateAPIView):
    serializer_class = StaffManageSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return User.objects.filter(role=User.Role.STAFF)

    def update(self, request, *args, **kwargs):
        staff_user = self.get_object()
        if staff_user.id == request.user.id:
            return Response({'detail': 'You cannot deactivate your own account.'}, status=403)
        staff_user.is_active = False
        staff_user.save(update_fields=['is_active'])
        return Response({'message': 'Staff account deactivated'})

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    StaffByDepartmentListView,
    StaffDeactivateView,
    StaffDetailView,
    StaffLoginView,
    StaffRegisterView,
    UpdateFCMTokenView,
)

urlpatterns = [
    path('staff/', StaffByDepartmentListView.as_view(), name='staff-list-by-department'),
    path('staff/register/', StaffRegisterView.as_view(), name='staff-register'),
    path('staff/login/', StaffLoginView.as_view(), name='staff-login'),
    path('staff/<int:pk>/', StaffDetailView.as_view(), name='staff-detail'),
    path('staff/<int:pk>/deactivate/', StaffDeactivateView.as_view(), name='staff-deactivate'),
    path('staff/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('staff/me/fcm-token/', UpdateFCMTokenView.as_view(), name='update-fcm-token'),
]

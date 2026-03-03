from django.urls import path

from .views import DepartmentDetailView, DepartmentListCreateView, DivisionDetailView, DivisionListCreateView

urlpatterns = [
    path('departments/', DepartmentListCreateView.as_view(), name='departments-list-create'),
    path('departments/<int:pk>/', DepartmentDetailView.as_view(), name='departments-detail'),
    path('divisions/', DivisionListCreateView.as_view(), name='divisions-list-create'),
    path('divisions/<int:pk>/', DivisionDetailView.as_view(), name='divisions-detail'),
]

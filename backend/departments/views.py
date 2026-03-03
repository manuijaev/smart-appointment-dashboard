from rest_framework import generics, permissions

from .models import Department, Division
from .permissions import IsAdminRole
from .serializers import DepartmentSerializer, DivisionSerializer


class DepartmentListCreateView(generics.ListCreateAPIView):
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [permissions.AllowAny()]


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsAdminRole()]
        return [permissions.AllowAny()]


class DivisionListCreateView(generics.ListCreateAPIView):
    serializer_class = DivisionSerializer

    def get_queryset(self):
        department_id = self.request.query_params.get('department_id')
        queryset = Division.objects.select_related('department').all()
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        return queryset.order_by('name')

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [permissions.AllowAny()]


class DivisionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Division.objects.select_related('department').all()
    serializer_class = DivisionSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsAdminRole()]
        return [permissions.AllowAny()]

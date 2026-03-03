from rest_framework import serializers

from .models import Department, Division


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']


class DivisionSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Division
        fields = ['id', 'name', 'department', 'department_name']

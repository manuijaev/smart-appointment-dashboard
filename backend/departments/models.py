from django.db import models


class Department(models.Model):
    name = models.CharField(max_length=120, unique=True)

    def __str__(self):
        return self.name


class Division(models.Model):
    name = models.CharField(max_length=120)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='divisions')

    class Meta:
        unique_together = ('name', 'department')
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.department.name})'

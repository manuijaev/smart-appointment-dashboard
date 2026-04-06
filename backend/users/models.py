from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)
        return self.create_user(email, full_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = 'Admin', 'Admin'
        STAFF = 'Staff', 'Staff'

    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    department = models.ForeignKey('departments.Department', on_delete=models.SET_NULL, null=True, blank=True)
    division = models.ForeignKey('departments.Division', on_delete=models.SET_NULL, null=True, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STAFF)
    fcm_token = models.TextField(blank=True, default='')
    phone_number = models.CharField(max_length=20, blank=True, default='')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    def __str__(self):
        return f'{self.full_name} ({self.email})'


class UserDeviceToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='device_tokens')
    token = models.TextField(unique=True)
    user_agent = models.CharField(max_length=255, blank=True, default='')
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.user_id}:{self.token[:24]}'

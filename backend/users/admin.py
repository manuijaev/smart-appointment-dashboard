from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, UserDeviceToken


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('id', 'full_name', 'email', 'role', 'department', 'division', 'is_staff')
    ordering = ('id',)
    search_fields = ('email', 'full_name')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'department', 'division', 'role', 'fcm_token')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email',
                'full_name',
                'password1',
                'password2',
                'role',
                'department',
                'division',
                'is_staff',
                'is_superuser',
            ),
        }),
    )


@admin.register(UserDeviceToken)
class UserDeviceTokenAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'is_active', 'updated_at', 'created_at')
    search_fields = ('user__email', 'user__full_name', 'token')
    list_filter = ('is_active',)

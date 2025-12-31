from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(DjangoUserAdmin):
    model = CustomUser

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ("Personal info", {'fields': ('first_name', 'last_name', 'email', 'bio', 'gender', 'date_of_birth')}),
        ("Identifiers", {'fields': ('role', 'student_id', 'staff_id', 'department')}),
        ("Permissions", {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ("Important dates", {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'gender', 'date_of_birth', 'student_id', 'staff_id')
        }),
    )

    list_display = ('username', 'email', 'role', 'student_id', 'staff_id', 'gender', 'date_of_birth', 'is_staff')
    search_fields = ('username', 'email', 'student_id', 'staff_id')
    ordering = ('username',)
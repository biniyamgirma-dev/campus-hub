from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            "Personal Information",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "email",
                    "gender",
                    "date_of_birth",
                    "bio",
                )
            },
        ),
        (
            "Academic Information",
            {
                "fields": (
                    "role",
                    "student_id",
                    "staff_id",
                    "department",
                )
            },
        ),
    )

    # Used when ADDING a new user
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "first_name",
                    "last_name",
                    "gender",
                    "date_of_birth",
                    "email",
                    "password1",
                    "password2",
                    "role",
                    "student_id",
                    "staff_id",
                    "department",
                    "bio",
                ),
            },
        ),
    )

    list_display = ("first_name", "last_name", "email", "role")
    list_filter = ("role",)
    search_fields = ("username", "email", "student_id", "staff_id")
    ordering = ("username",)
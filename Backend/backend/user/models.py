from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from academic.models import Department


# ============================================================
# ROLE CHOICES
# Defines system-level user roles
# ============================================================
class RoleChoices(models.TextChoices):
    STUDENT = "STUDENT", "Student"
    TEACHER = "TEACHER", "Teacher"
    ADMIN = "ADMIN", "Admin"


# ============================================================
# GENDER CHOICES
# Optional demographic information
# ============================================================
class GenderChoice(models.TextChoices):
    MALE = "MALE", "Male"
    FEMALE = "FEMALE", "Female"


# ============================================================
# CUSTOM USER MODEL
# Extends Django's AbstractUser to support academic roles
# ============================================================
class CustomUser(AbstractUser):
    gender = models.CharField(max_length=10, choices=GenderChoice.choices, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    role = models.CharField(max_length=20, choices=RoleChoices.choices, default=RoleChoices.STUDENT)
    student_id = models.CharField(max_length=30, blank=True, null=True, unique=True) 
    staff_id = models.CharField(max_length=30, blank=True, null=True, unique=True) 
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    bio = models.TextField(blank=True)

    # Fields required when creating a superuser via CLI
    REQUIRED_FIELDS = ["first_name", "last_name", "email"]

    # --------------------------------------------------------
    # USER VALIDATION RULES & BUSINESS LOGIC
    # --------------------------------------------------------
    def clean(self):
        super().clean()

        # 1️ First and last name are mandatory
        if not self.first_name or not self.last_name:
            raise ValidationError("Both first name and last name are required.")

        # 2️ Admin users bypass academic constraints
        if self.role == RoleChoices.ADMIN:
            return

        # 3️ A user cannot be both student and teacher
        if self.student_id and self.staff_id:
            raise ValidationError(
                "A user cannot have both student_id and staff_id set."
            )

        # 4️ Student-specific validation
        if self.role == RoleChoices.STUDENT:
            if not self.student_id:
                raise ValidationError("A student must have a student_id.")
            if self.staff_id:
                raise ValidationError("A student cannot have a staff_id.")

        # 5️ Teacher-specific validation
        elif self.role == RoleChoices.TEACHER:
            if not self.staff_id:
                raise ValidationError("A teacher must have a staff_id.")
            if self.student_id:
                raise ValidationError("A teacher cannot have a student_id.")

        # 6️ Department is mandatory for students and teachers
        if self.role in (RoleChoices.STUDENT, RoleChoices.TEACHER):
            if not self.department:
                raise ValidationError(
                    "Department is required for students and teachers."
                )

    # --------------------------------------------------------
    # SAVE METHOD OVERRIDE
    # Enforces role consistency for superusers
    # --------------------------------------------------------
    def save(self, *args, **kwargs):

        # Superusers are always admins
        if self.is_superuser:
            self.role = RoleChoices.ADMIN
            self.student_id = None
            self.staff_id = None
            self.department = None

        # Enforce validation before saving
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name} | ({self.get_role_display()})"
# registration/models.py
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

from academic.models import Course, Semester, Enrollment, AcademicStatus


class RegistrationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    CANCELLED = "CANCELLED", "Cancelled"


class Registration(models.Model):
    """
    Represents a student's official course registration request
    for a given semester.
    NOTE: no section here — section is assigned later via AcademicStatus.assign_section_for_student_semester(...)
    """

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="registrations",
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name="registrations",
    )
    courses = models.ManyToManyField(
        Course,
        related_name="registrations",
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=RegistrationStatus.choices,
        default=RegistrationStatus.PENDING,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("student", "semester")
        ordering = ("-created_at",)

    # -------------------------
    # Validation Rules
    # -------------------------
    def clean(self):
        # 1) Only students can register
        if getattr(self.student, "role", None) != "STUDENT":
            raise ValidationError("Only students can register for courses.")

        # 2) Semester must be active
        if not self.semester.is_active:
            raise ValidationError("Registration is only allowed for an active semester.")

        # 3) Prevent dismissed students from registering
        latest_status = (
            self.student.academic_statuses
            .order_by("-semester__start_date")
            .first()
        )
        if latest_status and latest_status.status == "DISMISSED":
            raise ValidationError("Dismissed students are not allowed to register.")

        # IMPORTANT: avoid touching M2M (self.courses) here when the instance is new (no PK).
        # If this instance is new, skip M2M-dependent validations -- they are performed in the ModelForm.
        if not self.pk:
            return

        # 4) Course must belong to student's department (if defined)
        student_dept = getattr(self.student, "department", None)
        if student_dept:
            for course in self.courses.all():
                if course.department != student_dept:
                    raise ValidationError(f"Course {course.code} does not belong to student's department.")

    def save(self, *args, **kwargs):
        # Use model full_clean to run validations above
        self.full_clean()
        super().save(*args, **kwargs)

    # -------------------------
    # Business Logic
    # -------------------------
    def approve(self):
        """
        Approve registration and create enrollments.
        This function ensures the registration is saved (so PK exists) before using M2M.
        """
        if self.status != RegistrationStatus.PENDING:
            raise ValidationError("Only pending registrations can be approved.")

        # Ensure PK exists before using courses M2M
        if not self.pk:
            self.save()

        for course in self.courses.all():
            Enrollment.objects.get_or_create(
                student=self.student,
                semester=self.semester,
                course=course,
            )

        # Update academic snapshot (section assignment happens later)
        AcademicStatus.update_for_student_and_semester(self.student, self.semester)

        self.status = RegistrationStatus.APPROVED
        self.save(update_fields=["status", "updated_at"])

    def reject(self, reason=None):
        self.status = RegistrationStatus.REJECTED
        self.save(update_fields=["status", "updated_at"])

    def __str__(self):
        return (
            f"{self.student.first_name} {self.student.last_name} | "
            f"{self.semester.year} {self.semester.name} | "
            f"{self.status}"
        )
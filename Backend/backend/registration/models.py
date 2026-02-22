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

    def clean(self):
        if getattr(self.student, "role", None) != "STUDENT":
            raise ValidationError("Only students can register for courses.")

        if not self.semester.is_active:
            raise ValidationError("Registration is only allowed for an active semester.")

        latest_status = (
            self.student.academic_statuses
            .order_by("-semester__start_date")
            .first()
        )
        
        if latest_status and latest_status.status == "DISMISSED":
            raise ValidationError("Dismissed students are not allowed to register.")

        if not self.pk:
            return

        student_dept = getattr(self.student, "department", None)
        if student_dept:
            for course in self.courses.all():
                if course.department != student_dept:
                    raise ValidationError(f"Course {course.code} does not belong to student's department.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def approve(self):
        if self.status != RegistrationStatus.PENDING:
            raise ValidationError("Only pending registrations can be approved.")

        if not self.pk:
            self.save()

        for course in self.courses.all():
            Enrollment.objects.get_or_create(
                student=self.student,
                semester=self.semester,
                course=course,
            )

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
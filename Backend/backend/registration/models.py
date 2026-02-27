from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from academic.models import Course, Semester, Enrollment, AcademicStatus


# ============================================================
# REGISTRATION STATUS CHOICES
# Defines lifecycle of a course registration request
# ============================================================
class RegistrationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"        # Waiting for approval
    APPROVED = "APPROVED", "Approved"     # Accepted and enrolled
    REJECTED = "REJECTED", "Rejected"     # Explicitly denied
    CANCELLED = "CANCELLED", "Cancelled"  # Withdrawn by student/admin


# ============================================================
# REGISTRATION MODEL
# Represents a student's semester course registration request
# ============================================================
class Registration(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="registrations")  
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name="registrations")  
    courses = models.ManyToManyField(Course, related_name="registrations", blank=True) 
    status = models.CharField(max_length=20, choices=RegistrationStatus.choices, default=RegistrationStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("student", "semester")  
        ordering = ("-created_at",)

    # --------------------------------------------------------
    # REGISTRATION VALIDATION RULES
    # --------------------------------------------------------
    def clean(self):

        # 1️ Only students can register
        if getattr(self.student, "role", None) != "STUDENT":
            raise ValidationError("Only students can register for courses.")

        # 2️ Registration allowed only in active semester
        if not self.semester.is_active:
            raise ValidationError("Registration is only allowed for an active semester.")

        # 3️ Dismissed students are blocked from registration
        latest_status = (self.student.academic_statuses.order_by("-semester__start_date").first())

        if latest_status and latest_status.status == "DISMISSED":
            raise ValidationError("Dismissed students are not allowed to register.")

        # 4️ Skip course validation before first save
        if not self.pk:
            return

        # 5️ Department consistency check
        student_dept = getattr(self.student, "department", None)
        if student_dept:
            for course in self.courses.all():
                if course.department != student_dept:
                    raise ValidationError(
                        f"Course {course.code} does not belong to student's department."
                    )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    # --------------------------------------------------------
    # APPROVE REGISTRATION
    # Creates enrollments and updates academic status
    # --------------------------------------------------------
    def approve(self):

        # Only pending registrations can be approved
        if self.status != RegistrationStatus.PENDING:
            raise ValidationError("Only pending registrations can be approved.")

        # Ensure registration is persisted
        if not self.pk:
            self.save()

        # Create enrollments for each approved course
        for course in self.courses.all():
            Enrollment.objects.get_or_create(
                student=self.student,
                semester=self.semester,
                course=course,
            )

        # Update academic status after enrollment
        AcademicStatus.update_for_student_and_semester(self.student, self.semester)

        # Mark registration as approved
        self.status = RegistrationStatus.APPROVED
        self.save(update_fields=["status", "updated_at"])

    # --------------------------------------------------------
    # REJECT REGISTRATION
    # Does NOT create enrollments
    # --------------------------------------------------------
    def reject(self, reason=None):
        self.status = RegistrationStatus.REJECTED
        self.save(update_fields=["status", "updated_at"])

    def __str__(self):
        return (
            f"{self.student.first_name} {self.student.last_name} | "
            f"{self.semester.year} {self.semester.name} | "
            f"{self.status}"
        )
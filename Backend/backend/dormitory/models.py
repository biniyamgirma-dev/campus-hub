from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from academic.models import Department, Semester


# ============================================================
# DORMITORY GENDER CHOICES
# Restricts dormitory allocation by gender
# ============================================================
class DormitoryGender(models.TextChoices):
    MALE = "MALE", "Male"
    FEMALE = "FEMALE", "Female"


# ============================================================
# DORMITORY MODEL
# Represents a physical dormitory room
# ============================================================
class Dormitory(models.Model):
    block = models.PositiveSmallIntegerField()   
    room = models.PositiveSmallIntegerField()   
    gender = models.CharField(max_length=10, choices=DormitoryGender.choices) 
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="dormitories", help_text="Optional: restrict dormitory to a department")  
    capacity = models.PositiveSmallIntegerField(default=4)  
    is_active = models.BooleanField(default=True)         

    class Meta:
        unique_together = ("block", "room", "gender")        # Prevent duplicates
        ordering = ("gender", "block", "room")

    def __str__(self):
        return f"Block {self.block}, Room {self.room} ({self.gender})"

    # --------------------------------------------------------
    # COUNT ASSIGNED STUDENTS FOR A SEMESTER
    # --------------------------------------------------------
    def assigned_count(self, semester):
        return self.assignments.filter(semester=semester).count()

    # --------------------------------------------------------
    # CALCULATE AVAILABLE SLOTS FOR A SEMESTER
    # --------------------------------------------------------
    def available_slots(self, semester):
        return self.capacity - self.assigned_count(semester)


# ============================================================
# DORMITORY ASSIGNMENT MODEL
# Links a student to a dormitory for a semester
# ============================================================
class DormitoryAssignment(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="dormitory_assignments")  
    dormitory = models.ForeignKey(Dormitory, on_delete=models.CASCADE, related_name="assignments") 
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name="dormitory_assignments")  
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "semester")            # One dorm per semester
        ordering = ("-semester__start_date",)

    # --------------------------------------------------------
    # DORMITORY ASSIGNMENT RULES & VALIDATIONS
    # --------------------------------------------------------
    def clean(self):

        # 1️ Only students can be assigned to dormitories
        if getattr(self.student, "role", None) != "STUDENT":
            raise ValidationError("Only students can be assigned to dormitories.")

        # 2️ Dormitory must be active
        if not self.dormitory.is_active:
            raise ValidationError("Dormitory is not active.")

        # 3️ Gender restriction enforcement
        if self.student.gender != self.dormitory.gender:
            raise ValidationError(
                f"{self.student.gender} students cannot be assigned to "
                f"{self.dormitory.gender} dormitories."
            )

        # 4️ Capacity enforcement
        if self.dormitory.available_slots(self.semester) <= 0:
            raise ValidationError("Dormitory room is full for this semester.")

        # 5️ Department restriction (if applicable)
        student_dept = getattr(self.student, "department", None)
        if self.dormitory.department and student_dept != self.dormitory.department:
            raise ValidationError("Dormitory does not belong to the student's department.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.student.first_name} {self.student.last_name} | "
            f"{self.semester} | Block {self.dormitory.block}, "
            f"Room {self.dormitory.room}"
        )
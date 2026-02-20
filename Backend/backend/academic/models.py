from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

# Grade points as Decimals (keep your original mapping)
GRADE_POINTS = {
    "A+": Decimal("4.0"),
    "A": Decimal("4.0"),
    "A-": Decimal("3.75"),
    "B+": Decimal("3.5"),
    "B": Decimal("3.0"),
    "B-": Decimal("2.75"),
    "C+": Decimal("2.5"),
    "C": Decimal("2.0"),
    "C-": Decimal("1.75"),
    "D": Decimal("1.0"),
    "F": Decimal("0.0"),
}


class Department(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Course(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="courses")
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    credit_hours = models.PositiveSmallIntegerField(default=3)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Semester(models.Model):
    name = models.CharField(max_length=50)
    year = models.CharField(max_length=20)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.year} | {self.name}"

    def get_student_gpa(self, student):
        """
        Compute semester GPA for a student (Decimal rounded to 2 places) or None.
        Accepts either user instance or user pk.
        """
        student_id = getattr(student, "pk", student)
        enrollments = self.enrollments.filter(student_id=student_id, grade__isnull=False).select_related("course")

        if not enrollments.exists():
            return None

        total_quality_points = Decimal("0.00")
        total_credits = 0

        for enrollment in enrollments:
            gp = GRADE_POINTS.get(enrollment.grade)
            if gp is None:
                continue
            credits = int(enrollment.course.credit_hours or 0)
            total_quality_points += gp * credits
            total_credits += credits

        if total_credits == 0:
            return None

        raw = total_quality_points / Decimal(total_credits)
        return raw.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class CourseAssignment(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="assignments")
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assignments")
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name="assignments")
    teaching_role = models.CharField(max_length=30, default="Lecturer")

    class Meta:
        unique_together = ("course", "teacher", "semester")

    def clean(self):
        if getattr(self.teacher, "role", None) != "TEACHER":
            raise ValidationError("Only users with TEACHER role can be assigned to courses.")

    def __str__(self):
        return f"{self.teacher.first_name} {self.teacher.last_name} | {self.course.name} | {self.semester.year} {self.semester.name}"


class Enrollment(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="enrollments")
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name="enrollments")
    enrolled_at = models.DateTimeField(auto_now_add=True)
    grade = models.CharField(max_length=2, null=True, blank=True)

    class Meta:
        unique_together = ("student", "course", "semester")

    def clean(self):
        # 1) Only students can be enrolled
        if getattr(self.student, "role", None) != "STUDENT":
            raise ValidationError("Only users with STUDENT role can be enrolled.")

        # 2) Prevent dismissed students from enrolling (check latest academic status)
        latest_status = (
            getattr(self.student, "academic_statuses", None)
            and self.student.academic_statuses.order_by("-semester__start_date").first()
        )
        if latest_status and latest_status.status == "DISMISSED":
            raise ValidationError("Dismissed students are not allowed to enroll.")

        # 3) Semester must be active for NEW enrollments
        if not self.pk and not self.semester.is_active:
            raise ValidationError("Enrollment is only allowed in an active semester.")

        # 4) Course must be active for NEW enrollments
        if not self.pk and not self.course.is_active:
            raise ValidationError("Cannot enroll in an inactive course.")

        # 5) Department consistency (only enforce if student has department)
        student_dept = getattr(self.student, "department", None)
        if student_dept and self.course.department and student_dept != self.course.department:
            raise ValidationError("Student can only enroll in courses from their department.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @classmethod
    def calculate_cumulative_gpa(cls, student):
        """
        Calculate cumulative GPA (CGPA) across ALL graded enrollments for the student.
        Returns Decimal rounded to 2 places, or None if no graded enrollments.
        """
        enrollments = cls.objects.filter(student=student, grade__isnull=False).select_related("course")
        if not enrollments.exists():
            return None

        total_quality_points = Decimal("0.00")
        total_credits = 0

        for e in enrollments:
            gp = GRADE_POINTS.get(e.grade)
            if gp is None:
                continue
            credits = int(e.course.credit_hours or 0)
            total_quality_points += gp * credits
            total_credits += credits

        if total_credits == 0:
            return None

        raw = total_quality_points / Decimal(total_credits)
        return raw.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def __str__(self):
        return f"{self.student.first_name} {self.student.last_name} | {self.semester.year} {self.semester.name} | {self.course.name}"


class GradeSubmission(models.Model):
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name="gradesubmission")
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="submitted_grades")
    mark = models.DecimalField(max_digits=5, decimal_places=3, validators=[MinValueValidator(0), MaxValueValidator(100)])
    grade = models.CharField(max_length=2, blank=True)
    submitted_date = models.DateTimeField(auto_now_add=True)

    def clean(self):
        teacher = self.submitted_by
        enrollment = self.enrollment

        if getattr(teacher, "role", None) != "TEACHER":
            raise ValidationError("Only teachers can submit grades.")

        is_assigned = enrollment.course.assignments.filter(teacher=teacher, semester=enrollment.semester).exists()
        if not is_assigned:
            raise ValidationError("Teacher is not assigned to this course in this semester.")

        # Only allow new submissions while semester active
        if not self.pk and not enrollment.semester.is_active:
            raise ValidationError("Grades can only be submitted in an active semester.")

        # Do not allow submissions that would overwrite a finalized enrollment.
        # (We don't have is_final field here; we avoid overwrite if Enrollment.grade already exists.)
        if enrollment.grade:
            raise ValidationError("This enrollment already has a grade. Submissions cannot overwrite an existing grade.")

    def calculate_grade(self):
        m = float(self.mark)
        if m >= 90:
            return "A+"
        if 85 <= m < 90:
            return "A"
        if 80 <= m < 85:
            return "A-"
        if 75 <= m < 80:
            return "B+"
        if 70 <= m < 75:
            return "B"
        if 65 <= m < 70:
            return "B-"
        if 60 <= m < 65:
            return "C+"
        if 50 <= m < 60:
            return "C"
        if 45 <= m < 50:
            return "C-"
        if 40 <= m < 45:
            return "D"
        return "F"

    def save(self, *args, **kwargs):
        # Validate and compute derived grade
        self.full_clean()
        self.grade = self.calculate_grade()
        super().save(*args, **kwargs)

        # Only set enrollment.grade if not already set (prevent overwriting).
        enrollment = self.enrollment
        if not enrollment.grade:
            enrollment.grade = self.grade
            enrollment.save(update_fields=["grade"])

        # After grade is recorded, update AcademicStatus for this student & semester
        AcademicStatus.update_for_student_and_semester(enrollment.student, enrollment.semester)

    def __str__(self):
        return f"{self.enrollment} | {self.grade}"


# ---------------------------
# Section & AcademicStatus
# ---------------------------

class Section(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="sections")
    name = models.CharField(max_length=20)  # e.g. "A"
    entry_year = models.PositiveIntegerField()  # e.g. 2025
    program_year = models.PositiveSmallIntegerField()  # e.g. 1,2,3
    capacity = models.PositiveSmallIntegerField(default=40)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("department", "name", "entry_year", "program_year")
        ordering = ("department", "program_year", "name")

    def __str__(self):
        return f" Department - {self.department.name} | Entry Year - {self.entry_year} | Current Year - {self.program_year} | Section {self.name}"


class AcademicStatusChoices(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    PROBATION = "PROBATION", "Probation"
    DISMISSED = "DISMISSED", "Dismissed"
    GRADUATED = "GRADUATED", "Graduated"


class AcademicStatus(models.Model):
    """
    Snapshot of a student's academic standing for a semester.
    - student + semester unique
    - stores semester_gpa and cumulative_gpa (CGPA)
    - stores section (where student is assigned for that semester)
    """
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="academic_statuses")
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name="academic_statuses")
    section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, blank=True, related_name="academic_statuses")
    semester_gpa = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    cumulative_gpa = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)  # CGPA
    status = models.CharField(max_length=20, choices=AcademicStatusChoices.choices, default=AcademicStatusChoices.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # track auto updates

    class Meta:
        unique_together = ("student", "semester")
        ordering = ("-semester__start_date",)

    def clean(self):
        if getattr(self.student, "role", None) != "STUDENT":
            raise ValidationError("Academic status can only be assigned to students.")

    def determine_status_from_gpa(self, semester_gpa, cumulative_gpa):
        """
        Determine status using example rules:
        - semester_gpa >= 2.00 -> ACTIVE
        - 1.75 <= semester_gpa < 2.00 -> PROBATION
        - semester_gpa < 1.75 -> DISMISSED
        If semester_gpa is None, fallback to cumulative_gpa rules (similar thresholds).
        """
        ref = semester_gpa if semester_gpa is not None else cumulative_gpa
        if ref is None:
            return AcademicStatusChoices.ACTIVE
        if ref >= Decimal("2.00"):
            return AcademicStatusChoices.ACTIVE
        if ref >= Decimal("1.75"):
            return AcademicStatusChoices.PROBATION
        return AcademicStatusChoices.DISMISSED

    def save(self, *args, **kwargs):
        # Ensure GPA fields are computed when saving (so admin-created rows are correct)
        self.semester_gpa = self.semester.get_student_gpa(self.student)
        self.cumulative_gpa = Enrollment.calculate_cumulative_gpa(self.student)
        self.status = self.determine_status_from_gpa(self.semester_gpa, self.cumulative_gpa)
        super().save(*args, **kwargs)

    @classmethod
    def update_for_student_and_semester(cls, student, semester):
        """
        Called automatically (e.g. after GradeSubmission.save).
        Creates or updates the AcademicStatus snapshot for the given student+semester.
        """
        sem_gpa = semester.get_student_gpa(student)
        cum_gpa = Enrollment.calculate_cumulative_gpa(student)
        status = cls().determine_status_from_gpa(sem_gpa, cum_gpa)

        obj, created = cls.objects.update_or_create(
            student=student,
            semester=semester,
            defaults={
                "semester_gpa": sem_gpa,
                "cumulative_gpa": cum_gpa,
                "status": status,
            },
        )
        return obj

    def __str__(self):
        return f"{self.student.first_name} {self.student.last_name} | {self.semester.year} {self.semester.name} | {self.status}"
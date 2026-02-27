from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


# ============================================================
# GRADE → GRADE POINT MAPPING
# Used consistently for GPA and CGPA calculations
# ============================================================
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


# ============================================================
# DEPARTMENT MODEL
# Represents an academic department (e.g., CS, IT, SE)
# ============================================================
class Department(models.Model):
    name = models.CharField(max_length=100)                 
    code = models.CharField(max_length=20, unique=True)     
    description = models.TextField(blank=True)  

    def __str__(self):
        return self.name


# ============================================================
# COURSE MODEL
# Represents a course offered by a department
# ============================================================
class Course(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="courses")
    name = models.CharField(max_length=100)                 
    code = models.CharField(max_length=20, unique=True)     
    credit_hours = models.PositiveSmallIntegerField(default=3)
    is_active = models.BooleanField(default=True)           

    def __str__(self):
        return self.name


# ============================================================
# SEMESTER MODEL
# Represents an academic semester
# ============================================================
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

    # --------------------------------------------------------
    # Calculate GPA for a specific student in THIS semester
    # --------------------------------------------------------
    def get_student_gpa(self, student):
        student_id = getattr(student, "pk", student)

        # Fetch only graded enrollments for this semester
        enrollments = self.enrollments.filter(student_id=student_id, grade__isnull=False).select_related("course")

        if not enrollments.exists():
            return None

        total_quality_points = Decimal("0.00")
        total_credits = 0

        # GPA formula implementation
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


# ============================================================
# COURSE ASSIGNMENT MODEL
# Links teachers to courses per semester
# ============================================================
class CourseAssignment(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="assignments")
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assignments")
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name="assignments")
    teaching_role = models.CharField(max_length=30, default="Lecturer")

    class Meta:
        unique_together = ("course", "teacher", "semester")

    # Ensure only teachers are assigned to courses
    def clean(self):
        if getattr(self.teacher, "role", None) != "TEACHER":
            raise ValidationError("Only users with TEACHER role can be assigned to courses.")

    def __str__(self):
        return f"{self.teacher.first_name} {self.teacher.last_name} | {self.course.name} | {self.semester.year} {self.semester.name}"


# ============================================================
# ENROLLMENT MODEL
# Links students to courses within a semester
# ============================================================
class Enrollment(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="enrollments")
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name="enrollments")
    enrolled_at = models.DateTimeField(auto_now_add=True)
    grade = models.CharField(max_length=2, null=True, blank=True)  # Final letter grade

    class Meta:
        unique_together = ("student", "course", "semester")

    # --------------------------------------------------------
    # ENROLLMENT RULES & VALIDATIONS
    # --------------------------------------------------------
    def clean(self):

        # 1️ Only students can enroll
        if getattr(self.student, "role", None) != "STUDENT":
            raise ValidationError("Only users with STUDENT role can be enrolled.")

        # 2️ Prevent dismissed students from enrolling
        latest_status = (
            getattr(self.student, "academic_statuses", None)
            and self.student.academic_statuses.order_by("-semester__start_date").first()
        )
        if latest_status and latest_status.status == "DISMISSED":
            raise ValidationError("Dismissed students are not allowed to enroll.")

        # 3️ Enrollment allowed only in active semester
        if not self.pk and not self.semester.is_active:
            raise ValidationError("Enrollment is only allowed in an active semester.")

        # 4️ Course must be active
        if not self.pk and not self.course.is_active:
            raise ValidationError("Cannot enroll in an inactive course.")

        # 5️ Department consistency rule
        student_dept = getattr(self.student, "department", None)
        if student_dept and self.course.department and student_dept != self.course.department:
            raise ValidationError("Student can only enroll in courses from their department.")

        # 6️ Approved registration is mandatory
        from registration.models import Registration, RegistrationStatus
        approved = Registration.objects.filter(
            student=self.student,
            semester=self.semester,
            status=RegistrationStatus.APPROVED,
        ).exists()

        if not approved:
            raise ValidationError("Student must have an approved registration before enrollment.")

        # 7️ Student must be assigned to a section
        from academic.models import SectionAssignment
        if not SectionAssignment.objects.filter(student=self.student, semester=self.semester).exists():
            raise ValidationError("Student must be assigned to a section before enrollment.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    # --------------------------------------------------------
    # Calculate cumulative GPA across ALL semesters
    # --------------------------------------------------------
    @classmethod
    def calculate_cumulative_gpa(cls, student):
        enrollments = cls.objects.filter(
            student=student,
            grade__isnull=False
        ).select_related("course")

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
    
# ============================================================
# GRADE SUBMISSION MODEL
# Handles grade entry by teachers for enrolled students
# ============================================================
class GradeSubmission(models.Model):
    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.CASCADE,
        related_name="gradesubmission"
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submitted_grades"
    )
    mark = models.DecimalField(
        max_digits=5,
        decimal_places=3,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )  # Raw numerical mark (0–100)

    grade = models.CharField(max_length=2, blank=True)       # Derived letter grade
    submitted_date = models.DateTimeField(auto_now_add=True) # Submission timestamp

    # --------------------------------------------------------
    # GRADE SUBMISSION RULES & VALIDATIONS
    # --------------------------------------------------------
    def clean(self):
        teacher = self.submitted_by
        enrollment = self.enrollment

        # 1️ Only teachers can submit grades
        if getattr(teacher, "role", None) != "TEACHER":
            raise ValidationError("Only teachers can submit grades.")

        # 2️ Teacher must be assigned to this course in this semester
        is_assigned = enrollment.course.assignments.filter(
            teacher=teacher,
            semester=enrollment.semester
        ).exists()

        if not is_assigned:
            raise ValidationError("Teacher is not assigned to this course in this semester.")

        # 3️ Grades can only be submitted in an active semester
        if not self.pk and not enrollment.semester.is_active:
            raise ValidationError("Grades can only be submitted in an active semester.")

        # 4️ Prevent overwriting existing grades
        if enrollment.grade:
            raise ValidationError(
                "This enrollment already has a grade. Submissions cannot overwrite an existing grade."
            )

    # --------------------------------------------------------
    # Convert numerical mark to letter grade
    # --------------------------------------------------------
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

    # --------------------------------------------------------
    # Save grade submission and sync enrollment + academic status
    # --------------------------------------------------------
    def save(self, *args, **kwargs):
        self.full_clean()

        # Calculate and assign letter grade
        self.grade = self.calculate_grade()
        super().save(*args, **kwargs)

        # Update enrollment grade if not already set
        enrollment = self.enrollment
        if not enrollment.grade:
            enrollment.grade = self.grade
            enrollment.save(update_fields=["grade"])

        # Trigger academic status recalculation
        AcademicStatus.update_for_student_and_semester(
            enrollment.student,
            enrollment.semester
        )

    def __str__(self):
        return f"{self.enrollment} | {self.grade}"


# ============================================================
# SECTION MODEL
# Represents a physical/academic class grouping
# ============================================================
class Section(models.Model):
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="sections"
    )
    name = models.CharField(max_length=20)                   # Section name (A, B, C…)
    entry_year = models.PositiveIntegerField()               # Student intake year
    program_year = models.PositiveSmallIntegerField()        # Year of study (1–5)
    capacity = models.PositiveSmallIntegerField(default=40)  # Max students
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("department", "name", "entry_year", "program_year")
        ordering = ("department", "program_year", "name")

    def __str__(self):
        return (
            f"Department - {self.department.name} | "
            f"Entry Year - {self.entry_year} | "
            f"Year - {self.program_year} | "
            f"Section {self.name}"
        )


# ============================================================
# SECTION ASSIGNMENT MODEL
# Assigns students to sections per semester
# ============================================================
class SectionAssignment(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="section_assignments"
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name="section_assignments"
    )
    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        related_name="section_assignments"
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "semester")

    # --------------------------------------------------------
    # SECTION ASSIGNMENT RULES
    # --------------------------------------------------------
    def clean(self):
        # Only students can be assigned to sections
        if getattr(self.student, "role", None) != "STUDENT":
            raise ValidationError("Only students can be assigned to sections.")

        # Section must be active
        if not self.section.is_active:
            raise ValidationError("Section is not active.")

    def __str__(self):
        return (
            f"{self.student.first_name} {self.student.last_name} | "
            f"{self.semester} | Section {self.section.name}"
        )


# ============================================================
# ACADEMIC STATUS CHOICES
# ============================================================
class AcademicStatusChoices(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    PROBATION = "PROBATION", "Probation"
    DISMISSED = "DISMISSED", "Dismissed"
    GRADUATED = "GRADUATED", "Graduated"


# ============================================================
# ACADEMIC STATUS MODEL
# Tracks student performance and standing per semester
# ============================================================
class AcademicStatus(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="academic_statuses"
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name="academic_statuses"
    )
    section = models.ForeignKey(
        Section,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="academic_statuses"
    )

    semester_gpa = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True
    )
    cumulative_gpa = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=AcademicStatusChoices.choices,
        default=AcademicStatusChoices.ACTIVE
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("student", "semester")
        ordering = ("-semester__start_date",)

    # --------------------------------------------------------
    # Validation: academic status applies only to students
    # --------------------------------------------------------
    def clean(self):
        if getattr(self.student, "role", None) != "STUDENT":
            raise ValidationError("Academic status can only be assigned to students.")

    # --------------------------------------------------------
    # Determine academic standing from GPA values
    # --------------------------------------------------------
    @staticmethod
    def determine_status_from_gpa(semester_gpa, cumulative_gpa):
        reference = semester_gpa if semester_gpa is not None else cumulative_gpa

        if reference is None:
            return AcademicStatusChoices.ACTIVE
        if reference >= Decimal("2.00"):
            return AcademicStatusChoices.ACTIVE
        if reference >= Decimal("1.75"):
            return AcademicStatusChoices.PROBATION
        return AcademicStatusChoices.DISMISSED

    # --------------------------------------------------------
    # Auto-update GPA and status on save
    # --------------------------------------------------------
    def save(self, *args, **kwargs):
        self.semester_gpa = self.semester.get_student_gpa(self.student)
        self.cumulative_gpa = Enrollment.calculate_cumulative_gpa(self.student)
        self.status = self.determine_status_from_gpa(
            self.semester_gpa,
            self.cumulative_gpa
        )
        super().save(*args, **kwargs)

    # --------------------------------------------------------
    # Centralized update method (used by grade submission)
    # --------------------------------------------------------
    @classmethod
    def update_for_student_and_semester(cls, student, semester):
        sem_gpa = semester.get_student_gpa(student)
        cum_gpa = Enrollment.calculate_cumulative_gpa(student)
        status = cls.determine_status_from_gpa(sem_gpa, cum_gpa)

        obj, _ = cls.objects.update_or_create(
            student=student,
            semester=semester,
            defaults={
                "semester_gpa": sem_gpa,
                "cumulative_gpa": cum_gpa,
                "status": status,
            },
        )
        return obj

    # --------------------------------------------------------
    # Assign section and sync academic status
    # --------------------------------------------------------
    @classmethod
    def assign_section_for_student_semester(cls, student, semester, section):
        from academic.models import SectionAssignment

        # Ensure section assignment exists
        SectionAssignment.objects.update_or_create(
            student=student,
            semester=semester,
            defaults={"section": section},
        )

        # Update academic status with section info
        obj, _ = cls.objects.update_or_create(
            student=student,
            semester=semester,
            defaults={"section": section},
        )

        obj.semester_gpa = semester.get_student_gpa(student)
        obj.cumulative_gpa = Enrollment.calculate_cumulative_gpa(student)
        obj.status = cls.determine_status_from_gpa(
            obj.semester_gpa,
            obj.cumulative_gpa
        )
        obj.save(
            update_fields=[
                "section",
                "semester_gpa",
                "cumulative_gpa",
                "status",
                "updated_at",
            ]
        )
        return obj

    def __str__(self):
        section_name = self.section.name if self.section else "No Section"
        return (
            f"{self.student.first_name} {self.student.last_name} | "
            f"{self.semester.year} {self.semester.name} | "
            f"{section_name} | {self.status}"
        )     
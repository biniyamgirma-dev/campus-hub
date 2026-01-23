from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from  datetime import datetime

class Department(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
 
    def __str__(self):
        return self.name

class Course(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='courses')
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
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.year} | {self.name}"

class CourseAssignment(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="assignments")
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assignments")
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name="assignments")
    teaching_role = models.CharField(max_length=30, default='Lecturer')

    class Meta:
        unique_together = ('course', 'teacher', 'semester')
    
    def clean(self):
        if self.teacher.role != "TEACHER":
            raise ValidationError("Only users with TEACHER role can be assigned to courses.")

    def __str__(self):
        return f"{self.teacher.first_name} {self.teacher.last_name} | {self.course.name} | {self.semester.year} {self.semester.name}"

class Enrollment(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    grade = models.CharField(max_length=2, null=True, blank=True)

    class Meta:
        unique_together = ('student', 'course', 'semester')
    
    def clean(self):
        # Rule 1: Only students can be enrolled
        if self.student.role != "STUDENT":
            raise ValidationError("Only users with STUDENT role can be enrolled.")

        # Rule 2: Semester must be active
        if not self.semester.is_active:
            raise ValidationError("Enrollment is only allowed in an active semester.")

        # Rule 3: Course must be active
        if not self.course.is_active:
            raise ValidationError("Cannot enroll in an inactive course.")

        # Rule 4: Department consistency
        if self.student.department != self.course.department:
            raise ValidationError("Student can only enroll in courses from their department.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.first_name} {self.student.last_name} | {self.course.name} | {self.semester.year} {self.semester.name}"
    
class GradeSubmission(models.Model):
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name="gradesubmission")
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="submitted_grades")
    mark = models.DecimalField(max_digits=5, decimal_places=3, validators=[MinValueValidator(0), MaxValueValidator(100)])
    grade = models.CharField(max_length=5, blank=True)
    submitted_date = models.DateTimeField(auto_now_add=True)

    def clean(self):
        teacher = self.submitted_by
        enrollment = self.enrollment

        if teacher.role != "TEACHER":
            raise ValidationError("Only teachers can submit grades.")

        is_assigned = enrollment.course.assignments.filter(teacher=teacher, semester=enrollment.semester).exists()

        if not is_assigned:
            raise ValidationError("Teacher is not assigned to this course in this semester.")

        if not enrollment.semester.is_active:
            raise ValidationError("Grades can only be submitted in an active semester.")


    def calculate_grade(self):
        if self.mark >= 90:
            return "A+"
        elif 85 <= self.mark < 90:
            return "A"
        elif 80 <= self.mark < 85:
            return "A-"
        elif 75 <= self.mark < 80:
            return "B+"
        elif 70 <= self.mark < 75:
            return "B"
        elif 65 <= self.mark < 70:
            return "B-"
        elif 60 <= self.mark < 65:
            return "C+"
        elif 50 <= self.mark < 60:
            return "C"
        elif 45 <= self.mark < 50:
            return "C-"
        elif 40 <= self.mark < 45:
            return "D"
        return "F"

    def save(self, *args, **kwargs):
        self.full_clean()
        self.grade = self.calculate_grade()
        super().save(*args, **kwargs)

    # Automatically update the Enrollment grade
        enrollment = self.enrollment
        enrollment.grade = self.grade
        enrollment.save(update_fields=["grade"])

    def __str__(self):
        return f"{self.enrollment.course.name} | {self.grade}"         
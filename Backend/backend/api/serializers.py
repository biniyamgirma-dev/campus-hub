from rest_framework import serializers
from django.contrib.auth import get_user_model
from academic.models import Department, Course, Semester, CourseAssignment, Enrollment, GradeSubmission, GradeChangeRequest, Section, SectionAssignment, AcademicStatus
from dormitory.models import Dormitory, DormitoryAssignment
from registration.models import Registration, RegistrationStatus

User = get_user_model()

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Course
        fields = [
            "id",
            "name",
            "code",
            "department",
            "department_name",
            "credit_hours",
            "is_active",
        ]

class SemesterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semester
        fields = '__all__'

class CourseAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseAssignment
        fields = '__all__'

class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = "__all__"
        read_only_fields = ("student", "semester", "course", "grade", "enrolled_at")

class GradeSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeSubmission
        fields = "__all__"
        read_only_fields = ["grade", "submitted_by"]

class GradeChangeRequestSerializer(serializers.ModelSerializer):
    old_grade = serializers.CharField(read_only=True)   # Cannot be set manually
    new_grade = serializers.CharField(read_only=True)   # Applied only when admin approves

    class Meta:
        model = GradeChangeRequest
        fields = '__all__'
        read_only_fields = ["requested_by", "status", "reviewed_by", "reviewed_at", "created_at"]

class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = '__all__'

class SectionAssignmetSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectionAssignment
        fields = '__all__'

class SectionAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectionAssignment
        fields = '__all__'

from rest_framework import serializers
from academic.models import AcademicStatus


class AcademicStatusSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    section_name = serializers.CharField(source="section.name", read_only=True)
    class Meta:
        model = AcademicStatus
        fields = "__all__"
        read_only_fields = (
            "semester_gpa",
            "cumulative_gpa",
            "status",
            "created_at",
            "updated_at",
        )
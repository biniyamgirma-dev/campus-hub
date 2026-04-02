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
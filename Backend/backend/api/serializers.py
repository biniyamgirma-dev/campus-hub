from rest_framework import serializers
from django.contrib.auth import get_user_model
from academic.models import Department, Course, Semester, CourseAssignment, Enrollment, GradeSubmission, GradeChangeRequest, Section, SectionAssignment, AcademicStatus
from dormitory.models import Dormitory, DormitoryAssignment
from registration.models import Registration, RegistrationStatus

User = get_user_model()

# ------------------------------------------------------------
# Signup SERIALIZER (STUDENT ONLY)
# ------------------------------------------------------------
class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "username",
            "password",
            "first_name",
            "last_name",
            "email",
            "student_id",
            "department",
        )

    def create(self, validated_data):
        # FORCE STUDENT ROLE
        validated_data["role"] = "STUDENT"

        # Ensure no staff_id
        validated_data.pop("staff_id", None)

        return User.objects.create_user(**validated_data)


# ------------------------------------------------------------
# USER SERIALIZER
# ------------------------------------------------------------
class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = "__all__"
        read_only_fields = (
            "is_superuser",
            "is_staff",
        )
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
    course_name = serializers.CharField(source="course.name", read_only=True)
    student_name = serializers.SerializerMethodField()

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip() or obj.student.username

    class Meta:
        model = Enrollment
        fields = "__all__"
        read_only_fields = ["student", "semester", "course", "grade", "enrolled_at"]

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

class SectionAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectionAssignment
        fields = '__all__'
class AcademicStatusSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    section_name = serializers.CharField(source="section.name", read_only=True)
    class Meta:
        model = AcademicStatus
        fields = "__all__"
        read_only_fields = ["semester_gpa", "cumulative_gpa", "status", "created_at", "updated_at"]

class RegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Registration
        fields = '__all__'
        read_only_fields = ["student", "created_at","updated_at"]

class DormitorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Dormitory
        fields = "__all__"
class DormitoryAssignmentSerializer(serializers.ModelSerializer):

    class Meta:
        model = DormitoryAssignment
        fields = "__all__"
        read_only_fields = ["assigned_at"]
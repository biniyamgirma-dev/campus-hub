from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from academic.models import Department, Course, Semester, CourseAssignment, Enrollment, GradeSubmission, Section, SectionAssignment, AcademicStatus
from dormitory.models import Dormitory, DormitoryAssignment
from registration.models import Registration, RegistrationStatus
from .serializers import DepartmentSerializer, CourseSerializer, SemesterSerializer, CourseAssignmentSerializer, EnrollmentSerializer
from .permissions import IsAdminOrReadOnly 


User = get_user_model()

# ============================================================
# DEPARTMENT VIEWSET
# Handles:
# - list
# - retrieve
# - create
# - update
# - delete
# ============================================================
class DepartmentViewSet(ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]

# ============================================================
# COURSE VIEWSET
# Handles course operations with role-based filtering
# ============================================================
class CourseViewSet(ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrReadOnly]

    # --------------------------------------------------------
    # Control what data each user sees
    # --------------------------------------------------------
    def get_queryset(self):
        user = self.request.user

        # Admin → see everything
        if user.is_authenticated and (user.role == "ADMIN" or user.is_superuser):
            return Course.objects.all()

        # Others → see only active courses
        return Course.objects.filter(is_active=True)
    
# ============================================================
# Semester VIEWSET
# Handles Logged-in users can view and Only admin can modify -
# the semester
# ============================================================
class SemesterViewSet(ModelViewSet):
    serializer_class = SemesterSerializer

    def get_queryset(self):
        user = self.request.user

        # Admin sees everything
        if user.is_authenticated and user.role == "ADMIN":
            return Semester.objects.all()

        # Students & teachers → show all but ordered (active first)
        return Semester.objects.all().order_by("-is_active", "-start_date")

    # Permissions logic
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated()]   # Logged-in users can view
        return [IsAdminOrReadOnly()]     # Only admin can modify

# ============================================================
# COURSE ASSIGNMENT VIEWSET
# - Admin → full access
# - Teacher → only their assignments
# - Student → department-based assignments
# ============================================================
class CourseAssignmentViewSet(ModelViewSet):
    serializer_class = CourseAssignmentSerializer

    # --------------------------------------------------------
    # QUERYSET LOGIC (ROLE-BASED DATA CONTROL)
    # --------------------------------------------------------
    def get_queryset(self):
        user = self.request.user

        # Admin → all
        if user.role == "ADMIN":
            return CourseAssignment.objects.select_related("course", "teacher", "semester")

        # Teacher → only their assignments
        if user.role == "TEACHER":
            return CourseAssignment.objects.filter(teacher=user).select_related("course", "semester")

        # Student → courses the student is actually taking
        if user.role == "STUDENT":
            return CourseAssignment.objects.filter(course__enrollments__student=user).select_related("course", "teacher", "semester")

        return CourseAssignment.objects.none()

    # --------------------------------------------------------
    # PERMISSION CONTROL
    # --------------------------------------------------------
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated()]
        return [IsAdminOrReadOnly()]

# ============================================================
# ENROLLMENT VIEWSET
# - Admin → full access
# - Student → only their enrollments
# - Teacher → enrollments in their courses
# ============================================================
class EnrollmentViewSet(ModelViewSet):
    serializer_class = EnrollmentSerializer

    # --------------------------------------------------------
    # QUERYSET (ROLE-BASED ACCESS)
    # --------------------------------------------------------
    def get_queryset(self):
        user = self.request.user

        # Admin → all enrollments
        if user.role == "ADMIN":
            return Enrollment.objects.select_related("student", "course", "semester")

        # Student → only their enrollments
        if user.role == "STUDENT":
            return Enrollment.objects.filter(student=user).select_related("course", "semester")

        # Teacher → enrollments in their assigned courses
        if user.role == "TEACHER":
            return Enrollment.objects.filter(course__assignments__teacher=user).select_related("student", "course", "semester")

        return Enrollment.objects.none()

    # --------------------------------------------------------
    # PERMISSIONS
    # --------------------------------------------------------
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated()]
        return [IsAdminOrReadOnly()]
    
    def perform_create(self, serializer):
        instance = serializer.save()
        instance.full_clean()
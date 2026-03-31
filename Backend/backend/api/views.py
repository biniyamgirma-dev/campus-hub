from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from academic.models import Department, Course, Semester, CourseAssignment, Enrollment, GradeSubmission, Section, SectionAssignment, AcademicStatus
from dormitory.models import Dormitory, DormitoryAssignment
from registration.models import Registration, RegistrationStatus
from .serializers import DepartmentSerializer, CourseSerializer, SemesterSerializer
from .permissions import IsAdminOrReadOnly 


User = get_user_model()

class DepartmentViewSet(ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]

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
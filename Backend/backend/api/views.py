from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet
from django.contrib.auth import get_user_model
from academic.models import Department, Course, Semester, CourseAssignment, Enrollment, GradeSubmission, Section, SectionAssignment, AcademicStatus
from dormitory.models import Dormitory, DormitoryAssignment
from registration.models import Registration, RegistrationStatus
from .serializers import DepartmentSerializer, CourseSerializer
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
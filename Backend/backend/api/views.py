from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet
from django.contrib.auth import get_user_model
from academic.models import Department, Course, Semester, CourseAssignment, Enrollment, GradeSubmission, Section, SectionAssignment, AcademicStatus
from dormitory.models import Dormitory, DormitoryAssignment
from registration.models import Registration, RegistrationStatus
from .serializers import DepartmentSerializer
from .permissions import IsAdminOrReadOnly 

User = get_user_model()

class DepartmentView(ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]
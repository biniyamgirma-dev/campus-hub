from rest_framework import serializer
from django.contrib.auth import get_user_model
from academic.models import Department, Course, Semester, CourseAssignment, Enrollment, GradeSubmission, Section, SectionAssignment, AcademicStatus
from dormitory.models import Dormitory, DormitoryAssignment
from registration.models import Registration, RegistrationStatus

User = get_user_model()
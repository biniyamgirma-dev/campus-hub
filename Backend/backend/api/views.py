from django.shortcuts import render
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from academic.models import (Department, Course, Semester, CourseAssignment, Enrollment, 
                             GradeSubmission, GradeChangeRequest, Section, SectionAssignment, 
                             AcademicStatus)
from dormitory.models import Dormitory, DormitoryAssignment
from registration.models import Registration, RegistrationStatus
from .serializers import (DepartmentSerializer, CourseSerializer, SemesterSerializer, 
                          CourseAssignmentSerializer, EnrollmentSerializer, 
                          GradeSubmissionSerializer, GradeChangeRequestSerializer, SectionSerializer, 
                          SectionAssignmentSerializer, AcademicStatusSerializer, RegistrationSerializer,
                          SignupSerializer, UserSerializer, DormitorySerializer, DormitoryAssignmentSerializer)
from .permissions import IsAdminOrReadOnly, IsTeacherOrReadOnly, IsTeacherOrAdmin
from django.db import transaction
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.exceptions import PermissionDenied

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
    # ROLE-BASED QUERYSET (SECURE VERSION)
    # --------------------------------------------------------
    def get_queryset(self):
        user = self.request.user

        # ADMIN → full access
        if user.is_authenticated and (user.role == "ADMIN" or user.is_superuser):
            return Course.objects.all()

        # STUDENT → only their department + active courses
        if user.role == "STUDENT":
            if not user.department:
                return Course.objects.none()

            return Course.objects.filter(department=user.department, is_active=True)

        # TEACHER → only their department + active courses
        if user.role == "TEACHER":
            if not user.department:
                return Course.objects.none()

            return Course.objects.filter(department=user.department, is_active=True)

        return Course.objects.none()
    
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

    # --------------------------------------------------------
    # PERMISSIONS
    # --------------------------------------------------------
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

# ============================================================
# GRADE SUBMISSION VIEWSET
# - Admin → view all submissions
# - Teacher → submit & view their course grades
# - Student → view only their grades
# ============================================================
class GradeSubmissionViewSet(ModelViewSet):
    serializer_class = GradeSubmissionSerializer
    permission_classes = [IsTeacherOrReadOnly]

    # --------------------------------------------------------
    # QUERYSET (ROLE-BASED ACCESS)
    # --------------------------------------------------------
    def get_queryset(self):
        user = self.request.user

        # ADMIN → see all
        if user.role == "ADMIN":
            return GradeSubmission.objects.all()

        # TEACHER → only their submitted grades
        if user.role == "TEACHER":
            return GradeSubmission.objects.filter(submitted_by=user)

        # STUDENT → only their grades
        if user.role == "STUDENT":
            return GradeSubmission.objects.filter(enrollment__student=user)

        return GradeSubmission.objects.none()

    def perform_create(self, serializer):
        # Automatically set teacher
        serializer.save(submitted_by=self.request.user)

# ============================================================
# GRADE CHANGE REQUEST VIEWSET
# - Admin → approve/reject & view all requests
# - Teacher → create & view their requests
# - Student → view their grade change requests
# - Teachers cannot manually set grades; grade is derived from mark
# ============================================================
class GradeChangeRequestViewSet(ModelViewSet):
    """
    Handles grade change requests.
    Teachers can request changes only for their assigned courses.
    Admin approves/rejects requests.
    Students can view requests relevant to them.
    Grades are not manually set here; system ensures consistency.
    """
    queryset = GradeChangeRequest.objects.all()
    serializer_class = GradeChangeRequestSerializer
    permission_classes = [IsAuthenticated]

    # --------------------------------------------------------
    # ROLE-BASED QUERYSET
    # --------------------------------------------------------
    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return self.queryset

        if user.role == "TEACHER":
            return self.queryset.filter(requested_by=user)

        if user.role == "STUDENT":
            return self.queryset.filter(enrollment__student=user)

        return self.queryset.none()

    # --------------------------------------------------------
    # CREATE REQUEST (TEACHER ONLY + VALIDATION)
    # --------------------------------------------------------
    def perform_create(self, serializer):
        user = self.request.user
        enrollment = serializer.validated_data["enrollment"]

        if user.role != "TEACHER":
            raise ValidationError("Only teachers can request grade changes.")

        # Ensure teacher owns the course
        is_assigned = enrollment.course.assignments.filter(teacher=user, semester=enrollment.semester).exists()

        if not is_assigned:
            raise ValidationError("You are not assigned to this course.")

        # Prevent duplicate pending requests
        if GradeChangeRequest.objects.filter(enrollment=enrollment,status="PENDING").exists():
            raise ValidationError("A pending request already exists.")

        # Automatically take the current grade from enrollment
        serializer.save(
            requested_by=user,
            old_grade=enrollment.grade
        )

    # --------------------------------------------------------
    # ADMIN ACTION: APPROVE
    # --------------------------------------------------------
    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        obj = self.get_object()

        if request.user.role != "ADMIN":
            return Response({"error": "Only admin can approve."}, status=403)

        if obj.status != "PENDING":
            return Response({"error": "Already processed."}, status=400)

        with transaction.atomic():
            obj.status = "APPROVED"
            obj.reviewed_by = request.user
            obj.reviewed_at = timezone.now()
            obj.save()

            # Apply the grade change safely
            obj.apply_change()

        return Response({"status": "Approved and applied"})

    # --------------------------------------------------------
    # ADMIN ACTION: REJECT
    # --------------------------------------------------------
    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        obj = self.get_object()

        if request.user.role != "ADMIN":
            return Response({"error": "Only admin can reject."}, status=403)

        if obj.status != "PENDING":
            return Response({"error": "Already processed."}, status=400)

        obj.status = "REJECTED"
        obj.reviewed_by = request.user
        obj.reviewed_at = timezone.now()
        obj.save()

        return Response({"status": "Rejected"})
    
# ============================================================
# SECTION VIEWSET
# - Admin → full access
# - Student → only their section
# - Teacher → sections of students they teach
# ============================================================
class SectionViewSet(ModelViewSet):
    serializer_class = SectionSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        # ADMIN → see all
        if user.role == "ADMIN":
            return Section.objects.all()

        # STUDENT → only their section(s)
        if user.role == "STUDENT":
            return Section.objects.filter(section_assignments__student=user).distinct()

        # TEACHER → sections of students in their courses
        if user.role == "TEACHER":
            return Section.objects.filter(section_assignments__student__enrollments__course__assignments__teacher=user).distinct()

        return Section.objects.none()
    
# ============================================================
# SECTION ASSIGNMENT VIEWSET
# - Admin → full access (assign students)
# - Student → view only their assignment
# - Teacher → view assignments of students in their courses
# ============================================================
class SectionAssignmentViewSet(ModelViewSet):
    serializer_class = SectionAssignmentSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        # ADMIN → all assignments
        if user.role == "ADMIN":
            return SectionAssignment.objects.all()

        # STUDENT → only their assignment
        if user.role == "STUDENT":
            return SectionAssignment.objects.filter(student=user)

        # TEACHER → students in their courses
        if user.role == "TEACHER":
            return SectionAssignment.objects.filter(student__enrollments__course__assignments__teacher=user).distinct()

        return SectionAssignment.objects.none() 
    
# ============================================================
# ACADEMIC STATUS VIEWSET
# - Admin → full access
# - Student → only their own academic status
# - Teacher → read-only (students in their courses)
# ============================================================
class AcademicStatusViewSet(ModelViewSet):
    queryset = AcademicStatus.objects.select_related("student", "semester", "section")
    serializer_class = AcademicStatusSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    # --------------------------------------------------------
    # ROLE-BASED QUERYSET FILTERING
    # --------------------------------------------------------
    def get_queryset(self):
        user = self.request.user

        # ADMIN → sees everything
        if user.role == "ADMIN":
            return self.queryset

        # STUDENT → only their own records
        if user.role == "STUDENT":
            return self.queryset.filter(student=user)

        # TEACHER → only students in their assigned courses
        if user.role == "TEACHER":
            return self.queryset.filter(student__enrollments__course__assignments__teacher=user).distinct()

        return self.queryset.none()

    # --------------------------------------------------------
    # PREVENT MANUAL CREATION (IMPORTANT)
    # AcademicStatus is SYSTEM GENERATED
    # --------------------------------------------------------
    def create(self, request, *args, **kwargs):
        from rest_framework.response import Response
        from rest_framework import status

        return Response(
            {"detail": "Academic status is auto-generated and cannot be created manually."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # --------------------------------------------------------
    # OPTIONAL: PREVENT DELETE (recommended)
    # --------------------------------------------------------
    def destroy(self, request, *args, **kwargs):
        from rest_framework.response import Response
        from rest_framework import status

        return Response(
            {"detail": "Academic status records cannot be deleted."},
            status=status.HTTP_403_FORBIDDEN,
        )
    
# ============================================================
# REGISTRATION VIEWSET
# - Admin → full access (approve/reject)
# - Student → create & view own registrations
# ============================================================
class RegistrationViewSet(ModelViewSet):
    queryset = Registration.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [IsAuthenticated]

    # --------------------------------------------------------
    # ROLE-BASED QUERYSET
    # --------------------------------------------------------
    def get_queryset(self):
        user = self.request.user

        # ADMIN → all registrations
        if user.role == "ADMIN":
            return self.queryset

        # STUDENT → only their registrations
        if user.role == "STUDENT":
            return self.queryset.filter(student=user)

        return self.queryset.none()

    # --------------------------------------------------------
    # CREATE REGISTRATION (STUDENT ONLY)
    # --------------------------------------------------------
    def perform_create(self, serializer):
        user = self.request.user

        if user.role != "STUDENT":
            raise ValidationError("Only students can create registrations.")

        serializer.save(student=user)

    # def perform_update(self, serializer):
    #     instance = self.get_object()

    #     if instance.status != "PENDING":
    #         raise ValidationError("Only pending registrations can be modified.")

    #     serializer.save()
    def perform_update(self, serializer):
        instance = self.get_object()
    # Allow students to resubmit a rejected registration
        if instance.status == "REJECTED":
            serializer.save(status="PENDING")
        elif instance.status == "PENDING":
            serializer.save()
        else:
            raise ValidationError("Cannot modify an approved or cancelled registration.")      

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.status != "PENDING":
            return Response({"error": "Cannot delete processed registration."},status=400)

        return super().destroy(request, *args, **kwargs)


    # --------------------------------------------------------
    # ADMIN ACTION: APPROVE
    # --------------------------------------------------------
    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        obj = self.get_object()

        if request.user.role != "ADMIN":
            return Response({"error": "Only admin can approve."}, status=403)

        try:
            obj.approve()
        except ValidationError as e:
            return Response({"error": str(e)}, status=400)

        return Response({"status": "Approved and enrollments created"})

    # --------------------------------------------------------
    # ADMIN ACTION: REJECT
    # --------------------------------------------------------
    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        obj = self.get_object()

        if request.user.role != "ADMIN":
            return Response({"error": "Only admin can reject."}, status=403)

        obj.reject()

        return Response({"status": "Rejected"})
    
# ============================================================
# REGISTER VIEW
# - Only students can self-register
# ============================================================
class SignupView(APIView):

    def post(self, request):
        serializer = SignupSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Student registered successfully"}, status=201)

        return Response(serializer.errors, status=400)


# ============================================================
# USER VIEWSET
# - Admin → full access
# - Teacher → view students
# - Student → own profile only
# ============================================================
class UserViewSet(ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    # --------------------------------------------------------
    # QUERYSET (ROLE-BASED)
    # --------------------------------------------------------
    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return User.objects.all()

        if user.role == "TEACHER":
            return User.objects.filter(role="STUDENT")

        return User.objects.filter(id=user.id)

    # --------------------------------------------------------
    # CREATE (ADMIN ONLY)
    # --------------------------------------------------------
    def perform_create(self, serializer):
        if self.request.user.role != "ADMIN":
            raise PermissionDenied("Only admin can create users.")

        serializer.save()

    # --------------------------------------------------------
    # UPDATE RULES
    # --------------------------------------------------------
    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()

        # Student can only update self
        if user.role == "STUDENT" and instance != user:
            raise PermissionDenied("You can only update your own profile.")

        serializer.save()

    # --------------------------------------------------------
    # DELETE (ADMIN ONLY)
    # --------------------------------------------------------
    def destroy(self, request, *args, **kwargs):
        if request.user.role != "ADMIN":
            return Response({"error": "Only admin can delete users."}, status=403)

        return super().destroy(request, *args, **kwargs)

    # --------------------------------------------------------
    # CURRENT USER
    # --------------------------------------------------------
    @action(detail=False, methods=["get"])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
# ============================================================
# DORMITORY VIEWSET
# - Everyone → view
# - Admin → full access
# ============================================================
class DormitoryViewSet(ModelViewSet):
    queryset = Dormitory.objects.all()
    serializer_class = DormitorySerializer
    permission_classes = [IsAdminOrReadOnly]


# ============================================================
# DORMITORY ASSIGNMENT VIEWSET
# - Admin → full access
# - Student → only their dorm
# - Teacher → read-only (optional)
# ============================================================
class DormitoryAssignmentViewSet(ModelViewSet):
    queryset = DormitoryAssignment.objects.select_related("student", "dormitory", "semester")
    serializer_class = DormitoryAssignmentSerializer
    permission_classes = [IsAuthenticated]

    # --------------------------------------------------------
    # ROLE-BASED QUERYSET
    # --------------------------------------------------------
    def get_queryset(self):
        user = self.request.user

        # ADMIN → all
        if user.role == "ADMIN":
            return self.queryset

        # STUDENT → only their dorm
        if user.role == "STUDENT":
            return self.queryset.filter(student=user)

        # TEACHER → view only
        if user.role == "TEACHER":
            return self.queryset

        return self.queryset.none()

    # --------------------------------------------------------
    # ONLY ADMIN CAN CREATE / UPDATE / DELETE
    # --------------------------------------------------------
    def perform_create(self, serializer):
        if self.request.user.role != "ADMIN":
            raise PermissionError("Only admin can assign dormitories.")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role != "ADMIN":
            raise PermissionError("Only admin can update assignments.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        if request.user.role != "ADMIN":
            return Response({"error": "Only admin can delete assignments."}, status=403)
        return super().destroy(request, *args, **kwargs)
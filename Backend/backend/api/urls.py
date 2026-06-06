from django.urls import path, include
from rest_framework.routers import DefaultRouter
from user.views import CustomTokenObtainPairView
from . import views

router = DefaultRouter()

# =========================
# ACADEMIC
# =========================
router.register(r"departments", views.DepartmentViewSet, basename="department")
router.register(r"courses", views.CourseViewSet, basename="course")
router.register(r"semesters", views.SemesterViewSet, basename="semester")
router.register(r"course-assignments", views.CourseAssignmentViewSet, basename="course-assignment")
router.register(r"enrollments", views.EnrollmentViewSet, basename="enrollment")
router.register(r"grade-submissions", views.GradeSubmissionViewSet, basename="grade-submission")
router.register(r"grade-change-requests", views.GradeChangeRequestViewSet, basename="grade-change-request")
router.register(r"sections", views.SectionViewSet, basename="section")
router.register(r"section-assignments", views.SectionAssignmentViewSet, basename="section-assignment")
router.register(r"academic-status", views.AcademicStatusViewSet, basename="academic-status")

# =========================
# REGISTRATION
# =========================
router.register(r"registrations", views.RegistrationViewSet, basename="registration")

# =========================
# USERS
# =========================
router.register(r"users", views.UserViewSet, basename="user")

# =========================
# URL PATTERNS
# =========================
urlpatterns = [
    # AUTH
    path("auth/signup/", views.SignupView.as_view(), name="signup"),
    path('auth/login/', CustomTokenObtainPairView.as_view()),

    # ALL VIEWSETS
    path("", include(router.urls)),
]

# =========================
# DORMITORY
# =========================
router.register(r"dormitories", views.DormitoryViewSet, basename="dormitory")
router.register(r"dormitory-assignments", views.DormitoryAssignmentViewSet, basename="dormitory-assignment")
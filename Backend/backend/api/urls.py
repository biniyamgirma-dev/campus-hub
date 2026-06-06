from django.urls import path, include
from rest_framework.routers import DefaultRouter
from user.views import CustomTokenObtainPairView
from . import views

router = DefaultRouter()

# =========================
# ACADEMIC
# =========================
router.register(r"departments", views.DepartmentViewSet)
router.register(r"courses", views.CourseViewSet)
router.register(r"semesters", views.SemesterViewSet)
router.register(r"course-assignments", views.CourseAssignmentViewSet)
router.register(r"enrollments", views.EnrollmentViewSet)
router.register(r"grade-submissions", views.GradeSubmissionViewSet)
router.register(r"grade-change-requests", views.GradeChangeRequestViewSet)
router.register(r"sections", views.SectionViewSet)
router.register(r"section-assignments", views.SectionAssignmentViewSet)
router.register(r"academic-status", views.AcademicStatusViewSet)
router.register(r"registrations", views.RegistrationViewSet)
router.register(r"users", views.UserViewSet)
router.register(r"dormitories", views.DormitoryViewSet)
router.register(r"dormitory-assignments", views.DormitoryAssignmentViewSet)

urlpatterns = [
    path("auth/signup/", views.SignupView.as_view()),
    path("auth/login/", CustomTokenObtainPairView.as_view()),
    path("", include(router.urls)),
    path("users/me/", views.me),
]
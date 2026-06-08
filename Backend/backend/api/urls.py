from django.urls import path, include
from rest_framework.routers import DefaultRouter
from user.views import CustomTokenObtainPairView
from . import views

router = DefaultRouter()

# =========================
# ACADEMIC
# =========================
router.register(r"departments",          views.DepartmentViewSet)
router.register(r"courses",              views.CourseViewSet,              basename="course")
router.register(r"semesters",            views.SemesterViewSet,            basename="semester")
router.register(r"course-assignments",   views.CourseAssignmentViewSet,    basename="courseassignment")
router.register(r"enrollments",          views.EnrollmentViewSet,          basename="enrollment")
router.register(r"grade-submissions",    views.GradeSubmissionViewSet,     basename="gradesubmission")
router.register(r"grade-change-requests",views.GradeChangeRequestViewSet,  basename="gradechangerequest")
router.register(r"sections",             views.SectionViewSet,             basename="section")
router.register(r"section-assignments",  views.SectionAssignmentViewSet,   basename="sectionassignment")
router.register(r"academic-status",      views.AcademicStatusViewSet,      basename="academicstatus")
router.register(r"registrations",        views.RegistrationViewSet,        basename="registration")
router.register(r"users",               views.UserViewSet,                basename="user")
router.register(r"dormitories",          views.DormitoryViewSet)
router.register(r"dormitory-assignments",views.DormitoryAssignmentViewSet, basename="dormitoryassignment")

urlpatterns = [
    path("auth/signup/", views.SignupView.as_view()),
    path("auth/login/", CustomTokenObtainPairView.as_view()),
    path("", include(router.urls)),
    path("users/me/", views.me),
]
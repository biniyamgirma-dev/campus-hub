# academic/api/urls.py
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"departments", views.DepartmentViewSet, basename="department")
router.register(r"courses", views.CourseViewSet, basename="course")
router.register(r"semesters", views.SemesterViewSet, basename="semester")
router.register(r"course-assignment", views.CourseAssignmentViewSet, basename="course-assignment")
router.register(r"enrollment", views.EnrollmentViewSet, basename="enrollment")

urlpatterns = router.urls
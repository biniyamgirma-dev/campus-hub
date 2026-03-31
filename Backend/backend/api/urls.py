# academic/api/urls.py
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"departments", views.DepartmentView, basename="department")

urlpatterns = router.urls
# academic/api/permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS
# ============================================================
# ADMIN OR READ ONLY PERMISSION
# - Everyone can read (GET, HEAD, OPTIONS)
# - Only ADMIN can create/update/delete
# ============================================================
class IsAdminOrReadOnly(BasePermission):

    def has_permission(self, request, view):
        # Allow read-only requests
        if request.method in SAFE_METHODS:
            return True
        
        # Only ADMIN can modify
        return request.user.is_authenticated and request.user.role == "ADMIN"
from django.contrib import admin
from .models import Dormitory, DormitoryAssignment

@admin.register(Dormitory)
class DormitoryAdmin(admin.ModelAdmin):
    list_display = (
        "block",
        "room",
        "gender",
        "department",
        "capacity",
        "is_active",
    )
    list_filter = ("gender", "department", "is_active")
    search_fields = ("block", "room")
    ordering = ("gender", "block", "room")


@admin.register(DormitoryAssignment)
class DormitoryAssignmentAdmin(admin.ModelAdmin):
    list_display = (
        "student_full_name",
        "semester",
        "dormitory_display",
        "assigned_at",
    )
    list_filter = ("semester", "dormitory__gender")
    search_fields = (
        "student__first_name",
        "student__last_name",
        "student__username",
    )

    def student_full_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"
    student_full_name.short_description = "Student"

    def dormitory_display(self, obj):
        return f"Block {obj.dormitory.block}, Room {obj.dormitory.room}"
    dormitory_display.short_description = "Dormitory"

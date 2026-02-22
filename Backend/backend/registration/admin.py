from django.contrib import admin
from .models import Registration, RegistrationStatus
from academic.models import AcademicStatus

@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = (
        "student_full_name",
        "semester",
        "get_section",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "semester",
    )

    search_fields = (
        "student__first_name",
        "student__last_name",
        "student__username",
        "student__email",
    )

    filter_horizontal = ("courses",)

    readonly_fields = ("created_at", "updated_at")

    actions = ["approve_registrations", "reject_registrations"]

    def get_section(self, obj):
        academic_status = obj.student.academic_statuses.filter(semester=obj.semester).first()
        return academic_status.section.name if academic_status and academic_status.section else "Not Assigned"
    get_section.short_description = "Section"

    def student_full_name(self, obj):
        if obj.student.first_name and obj.student.last_name:
            return f"{obj.student.first_name} {obj.student.last_name}"
        return obj.student.username
    student_full_name.short_description = "Student"
    student_full_name.admin_order_field = "student__first_name"

    @admin.action(description="Approve selected registrations")
    def approve_registrations(self, request, queryset):
        for registration in queryset:
            if registration.status == RegistrationStatus.PENDING:
                registration.approve()

    @admin.action(description="Reject selected registrations")
    def reject_registrations(self, request, queryset):
        queryset.update(status=RegistrationStatus.REJECTED)
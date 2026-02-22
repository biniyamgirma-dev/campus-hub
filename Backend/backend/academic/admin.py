from django.contrib import admin
from .models import (
    Department,
    Course,
    Semester,
    CourseAssignment,
    Enrollment,
    GradeSubmission,
    Section,
    SectionAssignment,
    AcademicStatus,
)

admin.site.register(Department)
admin.site.register(Course)
admin.site.register(Semester)
admin.site.register(CourseAssignment)
admin.site.register(GradeSubmission)

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student_full_name", "semester", "course", "grade", "semester_gpa")
    list_filter = ("semester", "course")
    readonly_fields = ("semester_gpa",)
    search_fields = ("student__first_name", "student__last_name", "course__name")
    ordering = ("student__first_name", "student__last_name", "course__name")

    def _ensure_first_enrollment_cache(self, semester_id):
        if not hasattr(self, "_first_enrollment_cache"):
            self._first_enrollment_cache = {}
        if semester_id not in self._first_enrollment_cache:
            qs = Enrollment.objects.filter(semester_id=semester_id).order_by(
                "student__first_name", "student__last_name", "pk"
            ).values_list("student_id", "pk")
            m = {}
            for student_id, pk in qs:
                if student_id not in m:
                    m[student_id] = pk
            self._first_enrollment_cache[semester_id] = m

    def semester_gpa(self, obj):
        if not obj or not obj.semester_id:
            return "-"
        self._ensure_first_enrollment_cache(obj.semester_id)
        first_pk = self._first_enrollment_cache.get(obj.semester_id, {}).get(obj.student_id)
        if first_pk == obj.pk:
            gpa = obj.semester.get_student_gpa(obj.student)
            return gpa if gpa is not None else "-"
        return ""
    semester_gpa.short_description = "Semester GPA"

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if obj and obj.grade:
            readonly.append("grade")
        return readonly

    def student_full_name(self, obj):
        if obj.student.first_name and obj.student.last_name:
            return f"{obj.student.first_name} {obj.student.last_name}"
        return obj.student.username
    student_full_name.short_description = "Student"
    student_full_name.admin_order_field = "student__first_name"

@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ("department", "name", "program_year", "entry_year", "capacity", "is_active")
    list_filter = ("department", "program_year", "is_active")
    search_fields = ("department__name", "name")

@admin.register(SectionAssignment)
class SectionAssignmentAdmin(admin.ModelAdmin):
    list_display = ("student_full_name", "semester", "section", "assigned_at")
    list_filter = ("semester", "section__department")
    search_fields = ("student__first_name", "student__last_name", "section__name")

    def student_full_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"
    student_full_name.short_description = "Student"

@admin.register(AcademicStatus)
class AcademicStatusAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "semester",
        "get_section",
        "status",
        "semester_gpa",
        "cumulative_gpa",
        "updated_at",
    )
    readonly_fields = (
        "semester_gpa",
        "cumulative_gpa",
        "updated_at",
        "created_at",
    )
    list_filter = ("status", "semester")
    search_fields = (
        "student__first_name",
        "student__last_name",
        "student__username",
    )

    actions = ["assign_section_action"]

    def get_section(self, obj):
        if obj.section:
            return obj.section.name
        return "Not Assigned"
    get_section.short_description = "Section"

    @admin.action(description="Assign section to selected students")
    def assign_section_action(self, request, queryset):
        from academic.models import SectionAssignment  # ensure proper import

        section = Section.objects.filter(is_active=True).first()
        if not section:
            self.message_user(request, "No active section available.", level="error")
            return

        for academic_status in queryset:
            sa, created = SectionAssignment.objects.get_or_create(
                student=academic_status.student,
                semester=academic_status.semester,
                defaults={"section": section},
            )
            
            academic_status.section = sa.section
            academic_status.save(update_fields=["section"])

        self.message_user(request, "Section assigned successfully to selected students.")
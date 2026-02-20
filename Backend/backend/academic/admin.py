from django.contrib import admin
from .models import Department, Course, Semester, CourseAssignment, Enrollment, GradeSubmission, Section, AcademicStatus, AcademicStatusChoices

# Register models normally
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

    # Order enrollments alphabetically by student full name, then course
    ordering = ("student__first_name", "student__last_name", "course__name")

    # cache to track first enrollment per student in a semester
    def _ensure_first_enrollment_cache(self, semester_id):
        if not hasattr(self, "_first_enrollment_cache"):
            self._first_enrollment_cache = {}
        if semester_id not in self._first_enrollment_cache:
            # map student_id -> first enrollment pk in this semester
            qs = Enrollment.objects.filter(semester_id=semester_id).order_by(
                "student__first_name", "student__last_name", "pk"
            ).values_list("student_id", "pk")
            m = {}
            for student_id, pk in qs:
                if student_id not in m:
                    m[student_id] = pk
            self._first_enrollment_cache[semester_id] = m

    # Display semester GPA only once per student
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

    # Make grade readonly once it’s set
    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if obj and obj.grade:
            readonly.append("grade")
        return readonly

    # Show full student name in admin
    def student_full_name(self, obj):
        if obj.student.first_name and obj.student.last_name:
            return f"{obj.student.first_name} {obj.student.last_name}"
        return obj.student.username  # fallback if no name
    student_full_name.short_description = "Student"
    student_full_name.admin_order_field = "student__first_name"

@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ("department", "name", "program_year", "entry_year", "capacity", "is_active")
    list_filter = ("department", "program_year", "is_active")
    search_fields = ("department__name", "name")

@admin.register(AcademicStatus)
class AcademicStatusAdmin(admin.ModelAdmin):
    list_display = ("student", "semester", "section", "status", "semester_gpa", "cumulative_gpa", "updated_at")
    readonly_fields = ("semester_gpa", "cumulative_gpa", "updated_at", "created_at")
    list_filter = ("status", "semester")
    search_fields = ("student__first_name", "student__last_name", "student__username")
from django.contrib import admin
from .models import Department, Course, Semester, CourseAssignment, Enrollment, GradeSubmission
# Register your models here.

admin.site.register(Department)
admin.site.register(Course)
admin.site.register(Semester)
admin.site.register(CourseAssignment)
admin.site.register(Enrollment)
admin.site.register(GradeSubmission)

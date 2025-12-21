from django.contrib import admin
from .models import Project, ProjectImage


class ProjectImageInline(admin.TabularInline):
    model = ProjectImage
    extra = 1


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'target_amount', 'current_amount', 'annual_return_rate', 'is_featured')
    list_filter = ('status', 'is_featured', 'created_at')
    search_fields = ('title', 'location', 'description')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('created_at', 'updated_at', 'current_amount')
    raw_id_fields = ('created_by',)
    inlines = [ProjectImageInline]

    fieldsets = (
        ('Información Básica', {'fields': ('title', 'slug', 'short_description', 'description')}),
        ('Ubicación', {'fields': ('location', 'address')}),
        ('Información Financiera', {
            'fields': ('target_amount', 'minimum_investment', 'current_amount', 'annual_return_rate', 'duration_months')
        }),
        ('Fechas', {'fields': ('funding_start_date', 'funding_end_date', 'project_start_date', 'project_end_date')}),
        ('Estado', {'fields': ('status', 'is_featured')}),
        ('Imagen', {'fields': ('main_image',)}),
        ('Gestión', {'fields': ('created_by', 'created_at', 'updated_at')}),
    )


@admin.register(ProjectImage)
class ProjectImageAdmin(admin.ModelAdmin):
    list_display = ('project', 'caption', 'order')
    list_filter = ('project',)
    raw_id_fields = ('project',)

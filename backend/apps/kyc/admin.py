from django.contrib import admin
from .models import KYCSubmission


@admin.register(KYCSubmission)
class KYCSubmissionAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'status', 'auto_processed', 'created_at', 'reviewed_at')
    list_filter = ('status', 'auto_processed', 'created_at')
    search_fields = ('user__email', 'full_name', 'document_number')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('user', 'reviewed_by')

    fieldsets = (
        ('Usuario', {'fields': ('user',)}),
        ('Documentos', {'fields': ('full_name', 'document_number', 'document_photo')}),
        ('Estado', {'fields': ('status', 'rejection_reason', 'auto_processed')}),
        ('Revisión', {'fields': ('reviewed_by', 'reviewed_at')}),
        ('Fechas', {'fields': ('created_at', 'updated_at')}),
    )

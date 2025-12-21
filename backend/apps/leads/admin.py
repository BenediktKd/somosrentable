from django.contrib import admin
from .models import Lead, LeadInteraction


class LeadInteractionInline(admin.TabularInline):
    model = LeadInteraction
    extra = 0
    readonly_fields = ('created_at',)


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'source', 'status', 'assigned_to', 'created_at')
    list_filter = ('status', 'source', 'assigned_to', 'created_at')
    search_fields = ('email', 'name', 'phone')
    readonly_fields = ('created_at', 'updated_at', 'webhook_data')
    raw_id_fields = ('assigned_to', 'converted_user', 'interested_project')
    inlines = [LeadInteractionInline]

    fieldsets = (
        ('Contacto', {'fields': ('email', 'name', 'phone')}),
        ('Fuente', {'fields': ('source', 'source_detail')}),
        ('Estado', {'fields': ('status', 'notes')}),
        ('Asignación', {'fields': ('assigned_to', 'assigned_at')}),
        ('Conversión', {'fields': ('converted_user', 'converted_at', 'interested_project')}),
        ('Webhook', {'fields': ('webhook_data',), 'classes': ('collapse',)}),
        ('Fechas', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(LeadInteraction)
class LeadInteractionAdmin(admin.ModelAdmin):
    list_display = ('lead', 'interaction_type', 'executive', 'created_at')
    list_filter = ('interaction_type', 'created_at')
    search_fields = ('lead__email', 'description')
    raw_id_fields = ('lead', 'executive')

from django.contrib import admin
from .models import Investment


@admin.register(Investment)
class InvestmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'project', 'amount', 'status', 'activated_at', 'created_at')
    list_filter = ('status', 'project', 'created_at')
    search_fields = ('user__email', 'project__title')
    readonly_fields = ('expected_return', 'created_at', 'updated_at')
    raw_id_fields = ('user', 'project')

    fieldsets = (
        ('Inversión', {'fields': ('user', 'project', 'amount', 'status')}),
        ('Términos', {'fields': ('annual_return_rate_snapshot', 'duration_months_snapshot')}),
        ('Retornos', {'fields': ('expected_return', 'actual_return')}),
        ('Fechas', {'fields': ('activated_at', 'expected_end_date', 'actual_end_date')}),
        ('Notas', {'fields': ('notes',)}),
        ('Auditoría', {'fields': ('created_at', 'updated_at')}),
    )

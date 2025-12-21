from django.contrib import admin
from .models import Reservation


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('email', 'project', 'amount', 'status', 'expires_at', 'created_at')
    list_filter = ('status', 'project', 'created_at')
    search_fields = ('email', 'name', 'phone')
    readonly_fields = ('access_token', 'created_at', 'updated_at')
    raw_id_fields = ('project', 'converted_user', 'converted_investment', 'lead')

    fieldsets = (
        ('Contacto', {'fields': ('email', 'name', 'phone')}),
        ('Reserva', {'fields': ('project', 'amount', 'status')}),
        ('Acceso', {'fields': ('access_token', 'expires_at')}),
        ('Conversión', {'fields': ('converted_user', 'converted_investment', 'lead')}),
        ('Notas', {'fields': ('notes',)}),
        ('Fechas', {'fields': ('created_at', 'updated_at')}),
    )

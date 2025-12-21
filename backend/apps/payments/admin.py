from django.contrib import admin
from .models import PaymentProof


@admin.register(PaymentProof)
class PaymentProofAdmin(admin.ModelAdmin):
    list_display = ('investment', 'amount', 'status', 'bank_name', 'created_at', 'reviewed_at')
    list_filter = ('status', 'bank_name', 'created_at')
    search_fields = ('investment__user__email', 'transaction_reference')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('investment', 'reviewed_by')

    fieldsets = (
        ('Inversión', {'fields': ('investment',)}),
        ('Comprobante', {'fields': ('proof_image', 'amount')}),
        ('Información Bancaria', {'fields': ('bank_name', 'transaction_reference', 'transaction_date')}),
        ('Estado', {'fields': ('status', 'rejection_reason')}),
        ('Revisión', {'fields': ('reviewed_by', 'reviewed_at')}),
        ('Notas', {'fields': ('notes',)}),
        ('Fechas', {'fields': ('created_at', 'updated_at')}),
    )

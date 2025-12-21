"""
Payment models for SomosRentable.
"""
from django.db import models
from core.models import BaseModel


class PaymentProof(BaseModel):
    """
    Comprobante de pago subido por el inversionista.
    El admin debe revisar y aprobar para activar la inversión.
    """

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendiente de Revisión'
        APPROVED = 'approved', 'Aprobado'
        REJECTED = 'rejected', 'Rechazado'

    investment = models.ForeignKey(
        'investments.Investment',
        on_delete=models.CASCADE,
        related_name='payment_proofs',
        verbose_name='Inversión'
    )

    # Archivo del comprobante
    proof_image = models.ImageField(
        upload_to='payment_proofs/%Y/%m/',
        verbose_name='Imagen del comprobante'
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Monto'
    )

    # Información bancaria
    bank_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Banco'
    )
    transaction_reference = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Número de transacción'
    )
    transaction_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha de transacción'
    )

    # Estado
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='Estado'
    )

    # Revisión
    reviewed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_payments',
        verbose_name='Revisado por'
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de revisión'
    )
    rejection_reason = models.TextField(
        blank=True,
        verbose_name='Razón de rechazo'
    )

    notes = models.TextField(
        blank=True,
        verbose_name='Notas'
    )

    class Meta:
        db_table = 'payment_proofs'
        verbose_name = 'Comprobante de Pago'
        verbose_name_plural = 'Comprobantes de Pago'
        ordering = ['-created_at']

    def __str__(self):
        return f"Pago {self.investment.user.email} - ${self.amount}"

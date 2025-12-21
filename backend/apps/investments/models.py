"""
Investment models for SomosRentable.
"""
from django.db import models
from decimal import Decimal
from core.models import BaseModel


class Investment(BaseModel):
    """
    Inversión activa en un proyecto.
    La inversión se activa cuando el admin aprueba el comprobante de pago.
    """

    class Status(models.TextChoices):
        PENDING_PAYMENT = 'pending_payment', 'Pendiente de Pago'
        PAYMENT_REVIEW = 'payment_review', 'Pago en Revisión'
        ACTIVE = 'active', 'Activa'
        COMPLETED = 'completed', 'Completada'
        CANCELLED = 'cancelled', 'Cancelada'

    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='investments',
        verbose_name='Inversionista'
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='investments',
        verbose_name='Proyecto'
    )

    # Monto invertido
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Monto invertido'
    )

    # Estado
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING_PAYMENT,
        verbose_name='Estado'
    )

    # Snapshot de términos al momento de la inversión
    annual_return_rate_snapshot = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='Rentabilidad anual (%)',
        help_text='Tasa de retorno al momento de invertir'
    )
    duration_months_snapshot = models.PositiveIntegerField(
        verbose_name='Duración (meses)',
        help_text='Duración en meses al momento de invertir'
    )

    # Fechas de la inversión
    activated_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de activación'
    )
    expected_end_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha esperada de término'
    )
    actual_end_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fecha real de término'
    )

    # Retornos
    expected_return = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Retorno esperado'
    )
    actual_return = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Retorno real'
    )

    notes = models.TextField(
        blank=True,
        verbose_name='Notas'
    )

    class Meta:
        db_table = 'investments'
        verbose_name = 'Inversión'
        verbose_name_plural = 'Inversiones'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.project.title} - ${self.amount}"

    def calculate_expected_return(self):
        """Calcula el retorno esperado basado en snapshot de términos."""
        annual = self.amount * (self.annual_return_rate_snapshot / 100)
        monthly = annual / 12
        return round(monthly * self.duration_months_snapshot, 2)

    def save(self, *args, **kwargs):
        # Calcular retorno esperado si no existe
        if not self.expected_return or self.expected_return == Decimal('0.00'):
            self.expected_return = self.calculate_expected_return()
        super().save(*args, **kwargs)

    @property
    def total_projected_return(self):
        """Monto total proyectado (inversión + retorno)."""
        return self.amount + self.expected_return

    @property
    def monthly_return(self):
        """Retorno mensual proyectado."""
        if self.duration_months_snapshot == 0:
            return Decimal('0.00')
        return round(self.expected_return / self.duration_months_snapshot, 2)

    def get_projection(self):
        """Retorna proyección completa de la inversión."""
        return {
            'investment_amount': self.amount,
            'annual_return_rate': self.annual_return_rate_snapshot,
            'duration_months': self.duration_months_snapshot,
            'monthly_return': self.monthly_return,
            'total_return': self.expected_return,
            'final_amount': self.total_projected_return,
            'status': self.status,
            'activated_at': self.activated_at,
            'expected_end_date': self.expected_end_date,
        }

"""
Reservation models for SomosRentable.
"""
import secrets
from django.db import models
from django.utils import timezone
from datetime import timedelta
from core.models import BaseModel


class Reservation(BaseModel):
    """
    Reserva de inversión sin registro completo.
    Solo requiere email para reservar cupo mientras el usuario se registra y pasa KYC.
    """

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendiente'
        CONVERTED = 'converted', 'Convertida a Inversión'
        EXPIRED = 'expired', 'Expirada'
        CANCELLED = 'cancelled', 'Cancelada'

    # Datos mínimos del reservante
    email = models.EmailField(
        verbose_name='Correo electrónico'
    )
    name = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Nombre'
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Teléfono'
    )

    # Proyecto y monto
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='reservations',
        verbose_name='Proyecto'
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Monto reservado'
    )

    # Estado
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='Estado'
    )

    # Usuario convertido (cuando se registra y pasa KYC)
    converted_user = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='converted_reservations',
        verbose_name='Usuario convertido'
    )
    converted_investment = models.OneToOneField(
        'investments.Investment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='source_reservation',
        verbose_name='Inversión convertida'
    )

    # Lead generado automáticamente
    lead = models.ForeignKey(
        'leads.Lead',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reservations',
        verbose_name='Lead asociado'
    )

    # Token de acceso para ver/gestionar reserva sin login
    access_token = models.CharField(
        max_length=64,
        unique=True,
        editable=False,
        verbose_name='Token de acceso'
    )

    # Expiración
    expires_at = models.DateTimeField(
        verbose_name='Fecha de expiración'
    )

    notes = models.TextField(
        blank=True,
        verbose_name='Notas'
    )

    class Meta:
        db_table = 'reservations'
        verbose_name = 'Reserva'
        verbose_name_plural = 'Reservas'
        ordering = ['-created_at']

    def __str__(self):
        return f"Reserva {self.email} - {self.project.title}"

    def save(self, *args, **kwargs):
        if not self.access_token:
            self.access_token = secrets.token_urlsafe(32)
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        """Verifica si la reserva ha expirado."""
        return timezone.now() > self.expires_at

    @property
    def can_convert(self):
        """Verifica si la reserva puede ser convertida a inversión."""
        return self.status == self.Status.PENDING and not self.is_expired

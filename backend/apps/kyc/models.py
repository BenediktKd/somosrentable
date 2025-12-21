"""
KYC models for SomosRentable.
"""
from django.db import models
from core.models import BaseModel


class KYCSubmission(BaseModel):
    """
    Solicitud de verificación KYC.
    El usuario debe enviar su nombre y foto de carnet.
    80% de probabilidad de aprobación automática.
    """

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendiente'
        APPROVED = 'approved', 'Aprobado'
        REJECTED = 'rejected', 'Rechazado'

    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='kyc_submissions',
        verbose_name='Usuario'
    )

    # Datos del documento
    full_name = models.CharField(
        max_length=255,
        verbose_name='Nombre completo'
    )
    document_number = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Número de documento'
    )
    document_photo = models.ImageField(
        upload_to='kyc_documents/%Y/%m/',
        verbose_name='Foto del documento'
    )

    # Estado de la verificación
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='Estado'
    )
    rejection_reason = models.TextField(
        blank=True,
        verbose_name='Razón de rechazo'
    )

    # Información de revisión
    reviewed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='kyc_reviews',
        verbose_name='Revisado por'
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de revisión'
    )

    # Flag para indicar si fue procesado automáticamente
    auto_processed = models.BooleanField(
        default=False,
        verbose_name='Procesado automáticamente'
    )

    class Meta:
        db_table = 'kyc_submissions'
        verbose_name = 'Solicitud KYC'
        verbose_name_plural = 'Solicitudes KYC'
        ordering = ['-created_at']

    def __str__(self):
        return f"KYC - {self.user.email} - {self.get_status_display()}"

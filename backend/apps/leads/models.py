"""
Lead models for SomosRentable.
"""
from django.db import models
from core.models import BaseModel


class Lead(BaseModel):
    """
    Lead capturado por la plataforma o webhook externo.
    Cada lead se asigna a un ejecutivo mediante round-robin.
    """

    class Source(models.TextChoices):
        WEBSITE = 'website', 'Sitio Web'
        RESERVATION = 'reservation', 'Reserva'
        WEBHOOK = 'webhook', 'Webhook Externo'
        MANUAL = 'manual', 'Ingreso Manual'
        REFERRAL = 'referral', 'Referido'

    class Status(models.TextChoices):
        NEW = 'new', 'Nuevo'
        CONTACTED = 'contacted', 'Contactado'
        INTERESTED = 'interested', 'Interesado'
        CONVERTED = 'converted', 'Convertido'
        NOT_INTERESTED = 'not_interested', 'No Interesado'
        INVALID = 'invalid', 'Inválido'

    # Información de contacto
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

    # Fuente del lead
    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.WEBSITE,
        verbose_name='Fuente'
    )
    source_detail = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Detalle de fuente',
        help_text='Información adicional sobre la fuente'
    )

    # Estado del lead
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
        verbose_name='Estado'
    )

    # Asignación a ejecutivo
    assigned_to = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_leads',
        limit_choices_to={'role': 'executive'},
        verbose_name='Ejecutivo asignado'
    )
    assigned_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de asignación'
    )

    # Conversión a usuario
    converted_user = models.OneToOneField(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lead_origin',
        verbose_name='Usuario convertido'
    )
    converted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de conversión'
    )

    # Proyecto de interés
    interested_project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='interested_leads',
        verbose_name='Proyecto de interés'
    )

    # Notas y datos adicionales
    notes = models.TextField(
        blank=True,
        verbose_name='Notas'
    )
    webhook_data = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Datos del webhook'
    )

    class Meta:
        db_table = 'leads'
        verbose_name = 'Lead'
        verbose_name_plural = 'Leads'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.email} - {self.get_status_display()}"


class LeadInteraction(BaseModel):
    """
    Registro de interacciones con un lead.
    Permite al ejecutivo documentar llamadas, emails, reuniones, etc.
    """

    class InteractionType(models.TextChoices):
        CALL = 'call', 'Llamada'
        EMAIL = 'email', 'Email'
        MEETING = 'meeting', 'Reunión'
        WHATSAPP = 'whatsapp', 'WhatsApp'
        NOTE = 'note', 'Nota'

    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        related_name='interactions',
        verbose_name='Lead'
    )
    executive = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='lead_interactions',
        verbose_name='Ejecutivo'
    )
    interaction_type = models.CharField(
        max_length=20,
        choices=InteractionType.choices,
        verbose_name='Tipo de interacción'
    )
    description = models.TextField(
        verbose_name='Descripción'
    )
    outcome = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Resultado'
    )

    class Meta:
        db_table = 'lead_interactions'
        verbose_name = 'Interacción con lead'
        verbose_name_plural = 'Interacciones con leads'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.lead.email} - {self.get_interaction_type_display()}"

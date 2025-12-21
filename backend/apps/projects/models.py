"""
Project models for SomosRentable.
"""
from django.db import models
from django.utils.text import slugify
from decimal import Decimal
from core.models import BaseModel


class Project(BaseModel):
    """
    Proyecto de inversión inmobiliaria.
    Los proyectos duran 1 año y tienen una rentabilidad definida.
    """

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Borrador'
        FUNDING = 'funding', 'En Financiación'
        FUNDED = 'funded', 'Financiado'
        IN_PROGRESS = 'in_progress', 'En Ejecución'
        COMPLETED = 'completed', 'Completado'
        CANCELLED = 'cancelled', 'Cancelado'

    # Información básica
    title = models.CharField(
        max_length=255,
        verbose_name='Título'
    )
    slug = models.SlugField(
        unique=True,
        max_length=255,
        verbose_name='Slug'
    )
    description = models.TextField(
        verbose_name='Descripción'
    )
    short_description = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='Descripción corta'
    )

    # Ubicación
    location = models.CharField(
        max_length=255,
        verbose_name='Ubicación'
    )
    address = models.TextField(
        blank=True,
        verbose_name='Dirección'
    )

    # Información financiera
    target_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        verbose_name='Monto objetivo',
        help_text='Monto total a recaudar'
    )
    minimum_investment = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('1000000.00'),
        verbose_name='Inversión mínima',
        help_text='Monto mínimo para invertir'
    )
    current_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Monto recaudado'
    )
    annual_return_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='Rentabilidad anual (%)',
        help_text='Tasa de retorno anual en porcentaje'
    )

    # Duración
    duration_months = models.PositiveIntegerField(
        default=12,
        verbose_name='Duración (meses)',
        help_text='Duración del proyecto en meses'
    )

    # Fechas
    funding_start_date = models.DateField(
        verbose_name='Inicio de financiación'
    )
    funding_end_date = models.DateField(
        verbose_name='Fin de financiación'
    )
    project_start_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Inicio del proyecto'
    )
    project_end_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fin del proyecto'
    )

    # Estado
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name='Estado'
    )

    # Imágenes
    main_image = models.ImageField(
        upload_to='project_images/%Y/%m/',
        blank=True,
        null=True,
        verbose_name='Imagen principal'
    )
    main_image_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='URL de imagen principal',
        help_text='URL externa de la imagen (alternativa a subir archivo)'
    )

    # Gestión
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_projects',
        verbose_name='Creado por'
    )
    is_featured = models.BooleanField(
        default=False,
        verbose_name='Destacado'
    )

    class Meta:
        db_table = 'projects'
        verbose_name = 'Proyecto'
        verbose_name_plural = 'Proyectos'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    @property
    def funding_progress_percentage(self):
        """Porcentaje de financiación alcanzado."""
        if self.target_amount == 0:
            return Decimal('0')
        return (self.current_amount / self.target_amount) * 100

    @property
    def remaining_amount(self):
        """Monto restante para completar financiación."""
        return max(self.target_amount - self.current_amount, Decimal('0.00'))

    @property
    def is_fully_funded(self):
        """Verifica si el proyecto está completamente financiado."""
        return self.current_amount >= self.target_amount

    @property
    def investor_count(self):
        """Número de inversionistas activos."""
        return self.investments.filter(status='active').count()

    def calculate_return(self, investment_amount):
        """
        Calcula el retorno proyectado para un monto de inversión.
        """
        annual_return = investment_amount * (self.annual_return_rate / 100)
        monthly_return = annual_return / 12
        total_return = monthly_return * self.duration_months
        return {
            'investment': investment_amount,
            'annual_return_rate': self.annual_return_rate,
            'monthly_return': round(monthly_return, 2),
            'total_return': round(total_return, 2),
            'final_amount': round(investment_amount + total_return, 2),
            'duration_months': self.duration_months
        }


class ProjectImage(BaseModel):
    """Imágenes adicionales del proyecto."""

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name='Proyecto'
    )
    image = models.ImageField(
        upload_to='project_images/%Y/%m/',
        verbose_name='Imagen'
    )
    caption = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Descripción'
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden'
    )

    class Meta:
        db_table = 'project_images'
        verbose_name = 'Imagen de proyecto'
        verbose_name_plural = 'Imágenes de proyecto'
        ordering = ['order']

    def __str__(self):
        return f"Imagen de {self.project.title}"

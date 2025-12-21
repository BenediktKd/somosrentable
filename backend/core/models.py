"""
Core models for SomosRentable.
"""
import uuid
from django.db import models


class BaseModel(models.Model):
    """
    Modelo base abstracto con campos comunes para auditoría.
    Todos los modelos del proyecto deben heredar de este.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']

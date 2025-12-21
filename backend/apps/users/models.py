"""
User models for SomosRentable.
"""
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from core.models import BaseModel


class UserManager(BaseUserManager):
    """Manager personalizado para el modelo User."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser debe tener is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser, BaseModel):
    """
    Usuario personalizado del sistema.
    Tres roles: Inversionista, Ejecutivo, Administrador.
    """

    class Role(models.TextChoices):
        INVESTOR = 'investor', 'Inversionista'
        EXECUTIVE = 'executive', 'Ejecutivo'
        ADMIN = 'admin', 'Administrador'

    # Usar email como username
    username = None
    email = models.EmailField(
        unique=True,
        verbose_name='Correo electrónico'
    )

    # Información personal
    first_name = models.CharField(
        max_length=150,
        blank=True,
        verbose_name='Nombre'
    )
    last_name = models.CharField(
        max_length=150,
        blank=True,
        verbose_name='Apellido'
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Teléfono'
    )

    # Rol y estado KYC
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.INVESTOR,
        verbose_name='Rol'
    )
    is_kyc_verified = models.BooleanField(
        default=False,
        verbose_name='KYC Verificado'
    )

    # Relación con ejecutivo asignado (para inversionistas)
    assigned_executive = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_investors',
        limit_choices_to={'role': Role.EXECUTIVE},
        verbose_name='Ejecutivo asignado'
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-created_at']

    def __str__(self):
        return self.email

    def get_full_name(self):
        """Retorna nombre completo."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.email

    @property
    def can_invest(self):
        """Solo puede invertir si es inversionista y pasó KYC."""
        return self.role == self.Role.INVESTOR and self.is_kyc_verified

    @property
    def is_executive(self):
        """Verifica si es ejecutivo."""
        return self.role == self.Role.EXECUTIVE

    @property
    def is_admin(self):
        """Verifica si es administrador."""
        return self.role == self.Role.ADMIN

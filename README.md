# SomosRentable - Crowdfunding Inmobiliario

Plataforma de crowdfunding inmobiliario desarrollada con Django, Next.js y PostgreSQL.

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnologico](#stack-tecnologico)
4. [Mapeo de Requerimientos](#mapeo-de-requerimientos)
5. [Modelo de Datos](#modelo-de-datos)
6. [API REST](#api-rest)
7. [Autenticacion y Autorizacion](#autenticacion-y-autorizacion)
8. [Logica de Negocio](#logica-de-negocio)
9. [Frontend](#frontend)
10. [Webhook Service](#webhook-service)
11. [Instalacion y Ejecucion](#instalacion-y-ejecucion)
12. [Guia de Demostracion](#guia-de-demostracion)
13. [Decisiones de Diseno](#decisiones-de-diseno)
14. [Seguridad](#seguridad)

---

## Resumen Ejecutivo

SomosRentable es una plataforma que permite a inversionistas participar en proyectos inmobiliarios mediante crowdfunding. La plataforma gestiona todo el ciclo de vida de una inversion:

```
Visitante -> Reserva -> Registro -> KYC -> Inversion -> Pago -> Rentabilidad
```

### Caracteristicas Principales

- **Reservas sin registro**: Cualquier persona puede reservar cupo con solo un email
- **Verificacion KYC automatizada**: 80% aprobacion / 20% rechazo automatico
- **Gestion de pagos**: Upload de comprobantes con revision administrativa
- **Pipeline de ventas**: Leads asignados automaticamente a ejecutivos
- **Webhook externo**: Servicio independiente que simula leads de terceros
- **Estadisticas en tiempo real**: Metricas de plataforma y ejecutivos

---

## Arquitectura del Sistema

```
+---------------------------------------------------------------------+
|                          DOCKER COMPOSE                              |
+---------------------------------------------------------------------+
|                                                                      |
|  +--------------+     +--------------+     +--------------+         |
|  |   Frontend   |     |   Backend    |     |   Webhook    |         |
|  |   Next.js    |---->|   Django     |<----|   Python     |         |
|  |   :3000      |     |   :8000      |     |   (puro)     |         |
|  +--------------+     +------+-------+     +--------------+         |
|                              |                                       |
|                              v                                       |
|  +--------------+     +--------------+     +--------------+         |
|  |   MailHog    |     |  PostgreSQL  |     |    Redis     |         |
|  |   :8025      |     |   :5432      |     |   :6379      |         |
|  +--------------+     +--------------+     +--------------+         |
|                                                                      |
|  +--------------+                                                    |
|  |   Adminer    |                                                    |
|  |   :8080      |                                                    |
|  +--------------+                                                    |
|                                                                      |
+---------------------------------------------------------------------+
```

### Flujo de Datos

```
Usuario --> Next.js --> Django REST API --> PostgreSQL
                              |
                              v
                         Servicios
                    (KYC, Pagos, Leads)
```

### Comunicacion entre Servicios

| Origen | Destino | Protocolo | Puerto |
|--------|---------|-----------|--------|
| Frontend | Backend | HTTP/REST | 8000 |
| Webhook | Backend | HTTP/REST | 8000 |
| Backend | PostgreSQL | TCP | 5432 |
| Backend | Redis | TCP | 6379 |
| Backend | MailHog | SMTP | 1025 |

---

## Stack Tecnologico

### Backend

| Tecnologia | Version | Uso |
|------------|---------|-----|
| Python | 3.11 | Runtime |
| Django | 5.0 | Framework web |
| Django REST Framework | 3.14 | API REST |
| PostgreSQL | 15 | Base de datos |
| Redis | 7 | Cache (preparado) |
| SimpleJWT | 5.3 | Autenticacion JWT |
| drf-spectacular | 0.27 | Documentacion OpenAPI |
| Pillow | 10.2 | Procesamiento de imagenes |

### Frontend

| Tecnologia | Version | Uso |
|------------|---------|-----|
| Node.js | 20 | Runtime |
| Next.js | 16.1 | Framework React |
| React | 19 | UI Library |
| TypeScript | 5 | Tipado estatico |
| Tailwind CSS | 3.3 | Estilos |
| React Query | 5 | Estado del servidor |
| Zustand | 4.4 | Estado global |
| Axios | 1.6 | Cliente HTTP |
| Radix UI | latest | Componentes accesibles |

### Infraestructura

| Tecnologia | Uso |
|------------|-----|
| Docker | Contenedores |
| Docker Compose | Orquestacion local |
| MailHog | Testing de emails |
| Adminer | Admin de BD |

---

## Mapeo de Requerimientos

### Requerimiento 1: Tipos de Usuarios

> "Hay dos tipos de usuarios: Inversionistas y Administrador (3)"

**Implementacion**: 3 roles en el modelo User

```python
# backend/apps/users/models.py:76-80
class Role(models.TextChoices):
    INVESTOR = 'investor', 'Inversionista'
    EXECUTIVE = 'executive', 'Ejecutivo'
    ADMIN = 'admin', 'Administrador'
```

**Usuarios creados por seed**:

| Email | Rol |
|-------|-----|
| admin@somosrentable.com | Admin |
| ejecutivo1@somosrentable.com | Executive |
| ejecutivo2@somosrentable.com | Executive |
| ejecutivo3@somosrentable.com | Executive |

---

### Requerimiento 2: KYC (Know Your Customer)

> "80% de que pase y un 20% de que no"

**Implementacion**: Probabilidad configurable en servicio

```python
# backend/apps/kyc/services.py:14
APPROVAL_PROBABILITY = 0.8  # 80% aprobacion

# backend/apps/kyc/services.py:17-50
def simulate_verification(self, submission):
    if random.random() < self.APPROVAL_PROBABILITY:
        submission.status = KYCSubmission.Status.APPROVED
        submission.user.is_kyc_verified = True
        submission.user.save()
    else:
        submission.status = KYCSubmission.Status.REJECTED
        submission.rejection_reason = "La verificacion automatica..."
```

**Flujo completo**:
```
Usuario sube documento
        |
        v
KYCSubmission.status = PENDING
        |
        v
simulate_verification() ejecuta
        |
    +---+---+
    |       |
  80%      20%
    |       |
APPROVED  REJECTED
    |       |
user.is_kyc_verified = True   rejection_reason guardado
```

---

### Requerimiento 3: Reservas de Inversion

> "Toda persona o visitante puede hacer una reserva utilizando un correo electronico"

**Implementacion**: Endpoint publico sin autenticacion

```python
# backend/apps/reservations/views.py:28-50
class ReservationCreateView(CreateAPIView):
    permission_classes = [AllowAny]  # Sin autenticacion

    def perform_create(self, serializer):
        reservation = serializer.save()
        # Crear lead automaticamente
        LeadService.create_lead_from_reservation(reservation)
```

**Modelo de Reserva**:
```python
# backend/apps/reservations/models.py:11-129
class Reservation(BaseModel):
    email = models.EmailField()
    name = models.CharField(max_length=200, blank=True)
    project = models.ForeignKey(Project, on_delete=CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(choices=Status.choices, default='pending')
    access_token = models.CharField(max_length=64, unique=True)  # Token unico
    expires_at = models.DateTimeField()  # 7 dias por defecto
    converted_investment = models.OneToOneField(Investment, null=True)
```

**Token de acceso**: Generado automaticamente para acceso sin login
```python
def save(self, *args, **kwargs):
    if not self.access_token:
        self.access_token = secrets.token_urlsafe(32)
    if not self.expires_at:
        self.expires_at = timezone.now() + timedelta(days=7)
```

---

### Requerimiento 4: Conversion Reserva -> Inversion

> "Una vez que el usuario pasa el KYC puede transformar la reserva a inversion"

**Implementacion**: Validacion de KYC antes de convertir

```python
# backend/apps/reservations/views.py:95-140
class ReservationConvertView(APIView):
    def post(self, request, token):
        reservation = get_object_or_404(Reservation, access_token=token)

        # Validar que el usuario tenga KYC aprobado
        if not request.user.is_kyc_verified:
            return Response(
                {"error": "Debe completar la verificacion KYC"},
                status=400
            )

        # Crear inversion desde reserva
        investment = Investment.objects.create(
            user=request.user,
            project=reservation.project,
            amount=reservation.amount,
            status=Investment.Status.PENDING_PAYMENT
        )

        reservation.status = Reservation.Status.CONVERTED
        reservation.converted_investment = investment
        reservation.save()
```

---

### Requerimiento 5: Pagos con Comprobante

> "Los pagos se simularan subiendo un comprobante. Los administradores deben ser capaces de revisarlos"

**Modelo de Comprobante**:
```python
# backend/apps/payments/models.py:8-93
class PaymentProof(BaseModel):
    investment = models.ForeignKey(Investment, on_delete=CASCADE)
    proof_image = models.ImageField(upload_to='payment_proofs/%Y/%m/')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    bank_name = models.CharField(max_length=100)
    transaction_reference = models.CharField(max_length=100)
    transaction_date = models.DateField()
    status = models.CharField(choices=Status.choices, default='pending')
    reviewed_by = models.ForeignKey(User, null=True)
    reviewed_at = models.DateTimeField(null=True)
    rejection_reason = models.TextField(blank=True)
```

**Flujo de Aprobacion**:
```python
# backend/apps/payments/services.py:14-48
def approve_payment(payment_proof, reviewer):
    payment_proof.status = PaymentProof.Status.APPROVED
    payment_proof.reviewed_by = reviewer
    payment_proof.reviewed_at = timezone.now()
    payment_proof.save()

    # Activar inversion
    investment = payment_proof.investment
    investment.status = Investment.Status.ACTIVE
    investment.activated_at = timezone.now()
    investment.expected_end_date = timezone.now() + timedelta(
        days=investment.duration_months_snapshot * 30
    )
    investment.save()

    # Actualizar monto recaudado del proyecto
    project = investment.project
    project.current_amount += investment.amount
    project.save()
```

---

### Requerimiento 6: Proyectos de 1 Ano con Rentabilidad

> "Todos los proyectos duran 1 ano y tienen una rentabilidad definida por el administrador"

**Modelo de Proyecto**:
```python
# backend/apps/projects/models.py:10-192
class Project(BaseModel):
    title = models.CharField(max_length=200)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    minimum_investment = models.DecimalField(max_digits=10, decimal_places=2)
    current_amount = models.DecimalField(default=0)
    annual_return_rate = models.DecimalField(max_digits=5, decimal_places=2)  # Ej: 12.50%
    duration_months = models.IntegerField(default=12)  # Siempre 12
    status = models.CharField(choices=Status.choices, default='draft')
```

**Calculo de Rentabilidad**:
```python
# backend/apps/investments/models.py:107-111
def calculate_expected_return(self):
    """Calcula el retorno esperado al final del periodo"""
    annual_return = self.amount * (self.annual_return_rate_snapshot / 100)
    monthly_return = annual_return / 12
    return monthly_return * self.duration_months_snapshot

# Ejemplo: $1,000,000 al 12% anual por 12 meses
# annual_return = 1,000,000 * 0.12 = 120,000
# monthly_return = 120,000 / 12 = 10,000
# total = 10,000 * 12 = $120,000 de ganancia
```

**Snapshot de tasa**: La tasa se captura al crear la inversion
```python
# backend/apps/investments/models.py:95-101
def save(self, *args, **kwargs):
    if not self.pk:  # Solo al crear
        self.annual_return_rate_snapshot = self.project.annual_return_rate
        self.duration_months_snapshot = self.project.duration_months
        self.expected_return = self.calculate_expected_return()
```

---

### Requerimiento 7: Leads y Ejecutivos

> "Todas las direcciones de correo se deben guardar. Cada uno esta asignado a un administrador que hara de ejecutivo"

**Modelo de Lead**:
```python
# backend/apps/leads/models.py:8-125
class Lead(BaseModel):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    source = models.CharField(choices=Source.choices)  # WEBSITE, RESERVATION, WEBHOOK, etc.
    status = models.CharField(choices=Status.choices, default='new')
    assigned_to = models.ForeignKey(
        User,
        on_delete=SET_NULL,
        null=True,
        limit_choices_to={'role': 'executive'}
    )
    converted_user = models.OneToOneField(User, null=True)  # Cuando se registra
```

**Asignacion Round-Robin**:
```python
# backend/apps/leads/services.py:15-51
def assign_lead_to_executive(lead):
    """Asigna lead al ejecutivo con menos leads activos"""
    executives = User.objects.filter(
        role=User.Role.EXECUTIVE,
        is_active=True
    ).annotate(
        active_leads_count=Count(
            'assigned_leads',
            filter=~Q(status__in=['converted', 'not_interested', 'invalid'])
        )
    ).order_by('active_leads_count')  # Menos leads primero

    if executives.exists():
        lead.assigned_to = executives.first()
        lead.assigned_at = timezone.now()
        lead.save()

    return lead.assigned_to
```

**Interacciones con Leads**:
```python
# backend/apps/leads/models.py:128-175
class LeadInteraction(BaseModel):
    lead = models.ForeignKey(Lead, on_delete=CASCADE)
    executive = models.ForeignKey(User, on_delete=CASCADE)
    interaction_type = models.CharField(choices=Type.choices)  # CALL, EMAIL, MEETING, etc.
    description = models.TextField()
    outcome = models.TextField(blank=True)
```

---

### Requerimiento 8: Webhook de Tercero

> "Simular un webhook de un tercero. La unica condicion es que no puede ser gatillado por Django, Next.js o PostgreSQL"

**Implementacion**: Servicio Python completamente independiente

```python
# webhook-service/main.py (Python puro, solo usa requests)
import requests
import random
import time

API_URL = os.getenv('API_URL', 'http://localhost:8000/api/leads/webhook/')
API_KEY = os.getenv('API_KEY', 'webhook-secret-key')

def generate_random_lead():
    return {
        'email': f"{first_name.lower()}.{last_name.lower()}.{random.randint(100,9999)}@{domain}",
        'name': f"{first_name} {last_name}",
        'phone': f"+56 9 {random.randint(1000,9999)} {random.randint(1000,9999)}",
        'source': random.choice(['facebook_ads', 'google_ads', 'instagram', 'linkedin']),
    }

def send_lead_to_api(lead_data):
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY  # Autenticacion por API Key
    }
    response = requests.post(API_URL, json=lead_data, headers=headers)
    return response.status_code == 201

# Loop principal - genera leads cada 30 segundos (70% probabilidad)
while True:
    if random.random() < 0.7:
        lead = generate_random_lead()
        send_lead_to_api(lead)
    time.sleep(30 + random.randint(-5, 10))
```

**Dockerfile del Webhook**:
```dockerfile
# webhook-service/Dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN pip install requests  # Solo requests, nada de Django
COPY main.py .
CMD ["python", "main.py"]
```

**Endpoint que recibe el webhook**:
```python
# backend/apps/leads/views.py:145-174
class LeadWebhookView(APIView):
    permission_classes = [WebhookAPIKeyPermission]  # Valida X-API-Key

    def post(self, request):
        serializer = LeadWebhookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lead, created = LeadService.create_lead_from_webhook(
            serializer.validated_data
        )

        if created:
            return Response({'lead_id': str(lead.id)}, status=201)
        return Response({'lead_id': str(lead.id), 'message': 'Already exists'}, status=409)
```

---

### Requerimiento 9: Unificacion de Emails

> "Es posible que se utilice un correo para la reserva y el mismo correo para el webhook. Y luego la persona del correo se hace una cuenta"

**Implementacion**: Unificacion por email

```python
# backend/apps/leads/services.py:127-150
def get_or_create_lead_for_email(email, source, **extra_data):
    """Obtiene o crea lead, unificando fuentes"""
    lead, created = Lead.objects.get_or_create(
        email=email,
        defaults={
            'source': source,
            **extra_data
        }
    )

    if not created:
        # Actualizar con nueva info si viene de fuente diferente
        if extra_data.get('name') and not lead.name:
            lead.name = extra_data['name']
        if extra_data.get('phone') and not lead.phone:
            lead.phone = extra_data['phone']
        lead.save()

    return lead, created
```

**Vinculacion al registrarse**:
```python
# backend/apps/users/views.py (RegisterView)
def perform_create(self, serializer):
    user = serializer.save()

    # Buscar lead existente y vincular
    try:
        lead = Lead.objects.get(email=user.email)
        lead.converted_user = user
        lead.status = Lead.Status.CONVERTED
        lead.converted_at = timezone.now()
        lead.save()

        # Heredar ejecutivo asignado
        if lead.assigned_to:
            user.assigned_executive = lead.assigned_to
            user.save()
    except Lead.DoesNotExist:
        pass
```

---

### Requerimiento 10: Estadisticas

> "Es necesario conocer estadisticas de las ejecutivas y de la plataforma"

**Estadisticas de Plataforma**:
```python
# backend/apps/statistics/services.py:17-116
def get_platform_statistics():
    return {
        'users': {
            'total_investors': User.objects.filter(role='investor').count(),
            'verified_investors': User.objects.filter(role='investor', is_kyc_verified=True).count(),
            'new_investors_30d': User.objects.filter(
                role='investor',
                created_at__gte=timezone.now() - timedelta(days=30)
            ).count(),
            'verification_rate': (verified / total) * 100
        },
        'projects': {
            'total': Project.objects.count(),
            'active': Project.objects.filter(status__in=['funding', 'in_progress']).count(),
            'completed': Project.objects.filter(status='completed').count()
        },
        'investments': {
            'total_amount': Investment.objects.filter(status='active').aggregate(Sum('amount')),
            'total_expected_returns': Investment.objects.aggregate(Sum('expected_return')),
            'new_amount_30d': ...,
        },
        'leads': {
            'total': Lead.objects.count(),
            'converted': Lead.objects.filter(status='converted').count(),
            'conversion_rate': (converted / total) * 100
        }
    }
```

**Estadisticas por Ejecutivo**:
```python
# backend/apps/statistics/services.py:119-182
def get_executive_statistics(executive=None):
    executives = User.objects.filter(role='executive')

    return [{
        'executive_id': exec.id,
        'executive_name': exec.get_full_name(),
        'leads': {
            'total': exec.assigned_leads.count(),
            'new': exec.assigned_leads.filter(status='new').count(),
            'contacted': exec.assigned_leads.filter(status='contacted').count(),
            'converted': exec.assigned_leads.filter(status='converted').count(),
            'conversion_rate': (converted / total) * 100
        },
        'investments': {
            'total_amount': Investment.objects.filter(
                user__assigned_executive=exec,
                status='active'
            ).aggregate(Sum('amount')),
            'count': ...
        }
    } for exec in executives]
```

---

## Modelo de Datos

### Diagrama ER

```
+-----------+       +-----------+       +-----------+
|   User    |       |  Project  |       |   Lead    |
+-----------+       +-----------+       +-----------+
| id (UUID) |       | id (UUID) |       | id (UUID) |
| email     |--+    | title     |    +--| email     |
| first_name|  |    | slug      |    |  | name      |
| last_name |  |    | target_amt|    |  | phone     |
| role      |  |    | current_a |    |  | source    |
| is_kyc_ver|  |    | annual_rat|    |  | status    |
| assigned_e|--+-+  | duration_m|    |  | assigned_ |--+
+-----------+  | |  | status    |    |  | converted_|--+-+
               | |  +-----------+    |  +-----------+  | |
               | |        |          |        |        | |
               | |        |          |        |        | |
+-----------+  | |  +-----+-----+    |  +-----+-----+  | |
|KYCSubmissi|  | |  | Investment|    |  |LeadInterac|  | |
+-----------+  | |  +-----------+    |  +-----------+  | |
| id (UUID) |  | |  | id (UUID) |    |  | id (UUID) |  | |
| user      |--+ |  | user      |----+  | lead      |--+ |
| full_name |    |  | project   |-------| executive |----+
| doc_number|    |  | amount    |       | type      |
| doc_photo |    |  | status    |       | descriptio|
| status    |    |  | rate_snap |       +-----------+
| reviewed_b|----+  | duration_s|
+-----------+       | expected_r|       +-----------+
                    | activated_|       | Reservatio|
                    +-----+-----+       +-----------+
                          |             | id (UUID) |
                    +-----+-----+       | email     |
                    |PaymentProo|       | project   |---+
                    +-----------+       | amount    |   |
                    | id (UUID) |       | status    |   |
                    | investment|-------| access_tok|   |
                    | proof_imag|       | expires_at|   |
                    | amount    |       | converted_|---+
                    | status    |       | lead      |   |
                    | reviewed_b|       +-----------+   |
                    +-----------+                       |
                                                        |
                                        +-----------+   |
                                        |ProjectImag|   |
                                        +-----------+   |
                                        | id (UUID) |   |
                                        | project   |---+
                                        | image     |
                                        | caption   |
                                        +-----------+
```

### Tabla de Modelos

| Modelo | App | Campos Clave | Relaciones |
|--------|-----|--------------|------------|
| User | users | email, role, is_kyc_verified | -> assigned_executive (self) |
| KYCSubmission | kyc | full_name, document_photo, status | -> user, -> reviewed_by |
| Project | projects | title, target_amount, annual_return_rate | <- investments, <- reservations |
| ProjectImage | projects | image, caption, order | -> project |
| Investment | investments | amount, status, expected_return | -> user, -> project |
| PaymentProof | payments | proof_image, status | -> investment, -> reviewed_by |
| Lead | leads | email, source, status | -> assigned_to, -> converted_user |
| LeadInteraction | leads | type, description, outcome | -> lead, -> executive |
| Reservation | reservations | email, amount, access_token | -> project, -> converted_investment |

### Estados (State Machines)

**Investment Status**:
```
PENDING_PAYMENT --> PAYMENT_REVIEW --> ACTIVE --> COMPLETED
       |                  |
       |                  v
       |              REJECTED --> PENDING_PAYMENT
       |
       v
   CANCELLED
```

**Lead Status**:
```
NEW --> CONTACTED --> INTERESTED --> CONVERTED
                          |
                          v
                    NOT_INTERESTED
                          |
                          v
                       INVALID
```

**KYC Status**:
```
PENDING --> APPROVED
    |
    v
REJECTED
```

---

## API REST

### Base URL

```
http://localhost:8000/api/
```

### Documentacion Interactiva

```
http://localhost:8000/api/docs/  # Swagger UI
http://localhost:8000/api/schema/  # OpenAPI JSON
```

### Endpoints por Modulo

#### Autenticacion (`/api/auth/`)

| Metodo | Endpoint | Permiso | Descripcion |
|--------|----------|---------|-------------|
| POST | `/auth/register/` | Public | Registro de usuario |
| POST | `/auth/login/` | Public | Login (retorna JWT) |
| POST | `/auth/refresh/` | Public | Refresh token |
| POST | `/auth/logout/` | Auth | Invalidar refresh token |
| GET | `/auth/me/` | Auth | Perfil del usuario |
| PATCH | `/auth/me/` | Auth | Actualizar perfil |
| GET | `/auth/users/` | Admin/Exec | Listar usuarios |
| GET | `/auth/investors/` | Admin/Exec | Listar inversores |
| GET | `/auth/executives/` | Admin | Listar ejecutivos |

#### Proyectos (`/api/projects/`)

| Metodo | Endpoint | Permiso | Descripcion |
|--------|----------|---------|-------------|
| GET | `/projects/` | Public | Listar proyectos |
| GET | `/projects/{slug}/` | Public | Detalle de proyecto |
| POST | `/projects/{slug}/calculate-return/` | Public | Calcular rentabilidad |
| GET | `/projects/admin/list/` | Admin | Lista admin |
| POST | `/projects/` | Admin | Crear proyecto |
| PATCH | `/projects/admin/{slug}/` | Admin | Editar proyecto |
| POST | `/projects/{slug}/images/` | Admin | Subir imagenes |

#### KYC (`/api/kyc/`)

| Metodo | Endpoint | Permiso | Descripcion |
|--------|----------|---------|-------------|
| GET | `/kyc/status/` | Auth | Estado KYC del usuario |
| POST | `/kyc/submit/` | Auth | Enviar documentos |
| GET | `/kyc/submissions/` | Admin/Exec | Listar pendientes |
| POST | `/kyc/submissions/{id}/review/` | Admin/Exec | Aprobar/Rechazar |

#### Inversiones (`/api/investments/`)

| Metodo | Endpoint | Permiso | Descripcion |
|--------|----------|---------|-------------|
| GET | `/investments/` | Auth | Mis inversiones |
| POST | `/investments/create/` | KYC Verified | Crear inversion |
| GET | `/investments/{id}/` | Auth | Detalle inversion |
| GET | `/investments/{id}/projection/` | Auth | Proyeccion retorno |

#### Pagos (`/api/payments/`)

| Metodo | Endpoint | Permiso | Descripcion |
|--------|----------|---------|-------------|
| POST | `/payments/proof/` | Auth | Subir comprobante |
| GET | `/payments/pending/` | Admin/Exec | Pagos pendientes |
| GET | `/payments/{id}/` | Auth | Detalle pago |
| POST | `/payments/{id}/review/` | Admin/Exec | Aprobar/Rechazar |

#### Reservas (`/api/reservations/`)

| Metodo | Endpoint | Permiso | Descripcion |
|--------|----------|---------|-------------|
| POST | `/reservations/` | Public | Crear reserva |
| GET | `/reservations/{token}/` | Public | Ver por token |
| GET | `/reservations/my/` | Auth | Mis reservas |
| POST | `/reservations/{token}/convert/` | KYC Verified | Convertir a inversion |
| POST | `/reservations/{token}/cancel/` | Public | Cancelar |

#### Leads (`/api/leads/`)

| Metodo | Endpoint | Permiso | Descripcion |
|--------|----------|---------|-------------|
| GET | `/leads/` | Admin/Exec | Listar leads |
| GET | `/leads/my/` | Admin/Exec | Mis leads |
| GET | `/leads/{id}/` | Admin/Exec | Detalle lead |
| PATCH | `/leads/{id}/` | Admin/Exec | Actualizar lead |
| POST | `/leads/{id}/assign/` | Admin | Asignar a ejecutivo |
| POST | `/leads/{id}/interactions/add/` | Admin/Exec | Agregar interaccion |
| POST | `/leads/webhook/` | API Key | Webhook externo |

#### Estadisticas (`/api/statistics/`)

| Metodo | Endpoint | Permiso | Descripcion |
|--------|----------|---------|-------------|
| GET | `/statistics/platform/` | Admin | Stats plataforma |
| GET | `/statistics/executives/` | Admin | Stats ejecutivos |
| GET | `/statistics/executives/{id}/` | Admin/Exec | Stats de un ejecutivo |
| GET | `/statistics/my/` | Admin/Exec | Mis stats |
| GET | `/statistics/projects/` | Admin | Stats proyectos |
| GET | `/statistics/lead-sources/` | Admin | Stats por fuente |

### Ejemplos de Request/Response

#### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@somosrentable.com", "password": "admin123"}'
```
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Crear Reserva
```bash
curl -X POST http://localhost:8000/api/reservations/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@investor.com",
    "name": "Juan Perez",
    "project": "uuid-del-proyecto",
    "amount": 5000000
  }'
```
```json
{
  "id": "uuid",
  "email": "nuevo@investor.com",
  "access_token": "abc123xyz...",
  "expires_at": "2025-01-07T12:00:00Z",
  "status": "pending"
}
```

#### Webhook de Lead
```bash
curl -X POST http://localhost:8000/api/leads/webhook/ \
  -H "Content-Type: application/json" \
  -H "X-API-Key: webhook-secret-key" \
  -d '{
    "email": "lead@facebook.com",
    "name": "Maria Gonzalez",
    "phone": "+56 9 1234 5678",
    "source": "facebook_ads"
  }'
```
```json
{
  "lead_id": "uuid",
  "message": "Lead created successfully"
}
```

---

## Autenticacion y Autorizacion

### JWT (JSON Web Tokens)

**Configuracion**:
```python
# backend/config/settings/base.py:140-146
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

### Flujo de Autenticacion

```
+---------+         +---------+         +---------+
| Cliente |         | Next.js |         | Django  |
+----+----+         +----+----+         +----+----+
     |                   |                   |
     |  Login Form       |                   |
     |------------------>|                   |
     |                   |  POST /auth/login |
     |                   |------------------>|
     |                   |                   |
     |                   |  access + refresh |
     |                   |<------------------|
     |                   |                   |
     |   Store cookies   |                   |
     |<------------------|                   |
     |                   |                   |
     |  Request /api/*   |                   |
     |------------------>|                   |
     |                   |  Bearer token     |
     |                   |------------------>|
     |                   |                   |
     |                   |  Response         |
     |                   |<------------------|
     |  Data             |                   |
     |<------------------|                   |
```

### Token Refresh (Automatico)

```typescript
// frontend/src/lib/api.ts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get('refresh_token');
      const response = await axios.post('/auth/refresh/', {
        refresh: refreshToken
      });

      Cookies.set('access_token', response.data.access);
      return api(originalRequest);  // Retry original request
    }
  }
);
```

### Permisos Personalizados

```python
# backend/apps/users/permissions.py
class IsAdminOrExecutive(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [User.Role.ADMIN, User.Role.EXECUTIVE]

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == User.Role.ADMIN

class VerifiedInvestorPermission(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.role == User.Role.INVESTOR and
            request.user.is_kyc_verified
        )

class WebhookAPIKeyPermission(BasePermission):
    def has_permission(self, request, view):
        api_key = request.headers.get('X-API-Key')
        return api_key == settings.WEBHOOK_API_KEY
```

---

## Logica de Negocio

### Flujo Completo de Inversion

```
+----------------------------------------------------------------+
|                     FLUJO DE INVERSION                          |
+----------------------------------------------------------------+
|                                                                  |
|  1. CAPTACION                                                   |
|     +-- Visitante ve proyecto                                   |
|     +-- Crea reserva con email -----------------------+         |
|     |   (access_token generado)                       |         |
|     |                                                 |         |
|     +-- O recibimos lead por webhook ----------------+|         |
|                                                       |         |
|  2. ASIGNACION AUTOMATICA                             v         |
|     +-- Round-robin a ejecutivo <------ Lead creado            |
|         (menor carga de leads)                                  |
|                                                                  |
|  3. REGISTRO                                                    |
|     +-- Usuario se registra con mismo email                    |
|     +-- Lead se vincula automaticamente                        |
|     +-- Hereda ejecutivo asignado                              |
|                                                                  |
|  4. VERIFICACION KYC                                            |
|     +-- Sube foto de documento + nombre                        |
|     +-- Sistema procesa (80% pasa, 20% falla)                  |
|     +-- Si pasa: user.is_kyc_verified = True                   |
|     +-- Si falla: Puede reintentar                             |
|                                                                  |
|  5. INVERSION                                                   |
|     +-- Convierte reserva O crea nueva inversion               |
|     +-- Valida: KYC aprobado + monto >= minimo                 |
|     +-- Status: PENDING_PAYMENT                                |
|     +-- Captura snapshot de tasa y duracion                    |
|                                                                  |
|  6. PAGO                                                        |
|     +-- Sube comprobante de transferencia                      |
|     +-- Status: PAYMENT_REVIEW                                 |
|     +-- Admin/Ejecutivo revisa                                 |
|                                                                  |
|  7. ACTIVACION                                                  |
|     +-- Admin aprueba pago                                     |
|     +-- Status: ACTIVE                                         |
|     +-- activated_at = now()                                   |
|     +-- expected_end_date = now + 12 meses                     |
|     +-- project.current_amount += amount                       |
|                                                                  |
|  8. MADURACION                                                  |
|     +-- Inversor ve proyeccion de rentabilidad                 |
|     +-- Al cumplir plazo: Status -> COMPLETED                  |
|     +-- actual_return calculado                                |
|                                                                  |
+----------------------------------------------------------------+
```

### Calculos Financieros

```python
# Ejemplo: Inversion de $10,000,000 al 12% anual por 12 meses

amount = 10_000_000
annual_rate = 12.0  # 12%
duration = 12  # meses

# Calculo
annual_return = amount * (annual_rate / 100)  # 1,200,000
monthly_return = annual_return / 12  # 100,000
expected_return = monthly_return * duration  # 1,200,000

# Resultado
total_al_final = amount + expected_return  # 11,200,000
```

### Proyeccion Mensual

```python
# backend/apps/investments/models.py:119-135
def get_projection(self):
    """Genera proyeccion mes a mes"""
    projections = []
    monthly_return = self.expected_return / self.duration_months_snapshot
    accumulated = 0

    for month in range(1, self.duration_months_snapshot + 1):
        accumulated += monthly_return
        projections.append({
            'month': month,
            'return': monthly_return,
            'accumulated': accumulated,
            'total': self.amount + accumulated
        })

    return projections
```

---

## Frontend

### Estructura de Paginas

```
frontend/src/app/
+-- page.tsx                    # Landing (/)
+-- login/page.tsx              # Login (/login)
+-- registro/page.tsx           # Registro (/registro)
+-- proyectos/
|   +-- page.tsx                # Lista proyectos (/proyectos)
|   +-- [slug]/page.tsx         # Detalle (/proyectos/torre-santiago)
+-- (investor)/                 # Layout protegido inversor
|   +-- layout.tsx
|   +-- dashboard/page.tsx      # Dashboard (/dashboard)
|   +-- inversiones/
|   |   +-- page.tsx            # Lista (/inversiones)
|   |   +-- [id]/page.tsx       # Detalle (/inversiones/uuid)
|   +-- reservas/page.tsx       # Reservas (/reservas)
|   +-- kyc/page.tsx            # KYC (/kyc)
+-- (admin)/                    # Layout protegido admin
    +-- admin/
        +-- page.tsx            # Dashboard admin (/admin)
        +-- proyectos/page.tsx  # CRUD proyectos
        +-- kyc/page.tsx        # Review KYC
        +-- pagos/page.tsx      # Review pagos
        +-- leads/page.tsx      # Gestion leads
        +-- estadisticas/page.tsx # Stats
```

### Estado Global (Zustand)

```typescript
// frontend/src/lib/auth.ts
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await authApi.login(email, password);
    Cookies.set('access_token', data.access, { expires: 1 });
    Cookies.set('refresh_token', data.refresh, { expires: 7 });
    await get().fetchUser();
  },

  fetchUser: async () => {
    const { data } = await authApi.getMe();
    set({ user: data, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await authApi.logout();
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    set({ user: null, isAuthenticated: false });
  },
}));
```

### Proteccion de Rutas

```typescript
// frontend/src/app/(investor)/layout.tsx
export default function InvestorLayout({ children }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return null;

  return (
    <div className="flex">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

```typescript
// frontend/src/app/(admin)/layout.tsx
export default function AdminLayout({ children }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'admin' && user?.role !== 'executive') {
        router.push('/dashboard');  // Redirigir inversores
      }
    }
  }, [isLoading, isAuthenticated, user]);

  // ...
}
```

### Componentes Clave

| Componente | Ubicacion | Uso |
|------------|-----------|-----|
| Button | `components/ui/button.tsx` | Botones con variantes |
| Toast | `components/ui/toast.tsx` | Notificaciones |
| Skeleton | `components/ui/skeleton.tsx` | Loading states |
| ConfirmDialog | `components/ui/confirm-dialog.tsx` | Modales de confirmacion |
| PasswordStrength | `components/form/PasswordStrength.tsx` | Indicador de fortaleza |
| MobileMenu | `components/layout/MobileMenu.tsx` | Menu hamburguesa |

---

## Webhook Service

### Proposito

Simular un servicio externo (CRM, formulario de Facebook, etc.) que envia leads a la plataforma.

### Caracteristicas

- **Completamente independiente**: No usa Django, Next.js ni PostgreSQL
- **Python puro**: Solo usa la libreria `requests`
- **Contenedor separado**: Su propio Dockerfile y container
- **Autenticacion**: API Key en header `X-API-Key`

### Codigo Completo

```python
# webhook-service/main.py
import os
import time
import random
import requests
from datetime import datetime

API_URL = os.getenv('API_URL', 'http://backend:8000/api/leads/webhook/')
API_KEY = os.getenv('API_KEY', 'webhook-secret-key')
INTERVAL = int(os.getenv('INTERVAL_SECONDS', '30'))

FIRST_NAMES = ['Juan', 'Maria', 'Carlos', 'Ana', ...]
LAST_NAMES = ['Garcia', 'Rodriguez', 'Martinez', ...]
SOURCES = ['facebook_ads', 'google_ads', 'instagram', 'linkedin']

def generate_lead():
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    return {
        'email': f"{first.lower()}.{last.lower()}.{random.randint(100,9999)}@gmail.com",
        'name': f"{first} {last}",
        'phone': f"+56 9 {random.randint(1000,9999)} {random.randint(1000,9999)}",
        'source': random.choice(SOURCES),
    }

def send_lead(lead):
    response = requests.post(
        API_URL,
        json=lead,
        headers={'X-API-Key': API_KEY, 'Content-Type': 'application/json'}
    )
    return response.status_code

while True:
    if random.random() < 0.7:  # 70% de probabilidad
        lead = generate_lead()
        status = send_lead(lead)
        print(f"Lead {lead['email']}: {status}")
    time.sleep(INTERVAL + random.randint(-5, 10))
```

### Verificar Funcionamiento

```bash
# Ver logs del webhook
docker compose logs -f webhook-service

# Output esperado:
# 2024-01-15 10:30:15 - INFO - Generando lead: juan.garcia.1234@gmail.com
# 2024-01-15 10:30:15 - INFO - Lead enviado exitosamente
# 2024-01-15 10:30:15 - INFO - Esperando 32 segundos...
```

---

## Instalacion y Ejecucion

### Prerrequisitos

- Docker Desktop
- Git

### Pasos

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd somosrentable

# 2. Iniciar todos los servicios
docker compose up -d

# 3. Esperar a que todo inicie (~30 segundos)
docker compose ps

# 4. Acceder a la aplicacion
open http://localhost:3000
```

### URLs de Acceso

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| Frontend | http://localhost:3000 | - |
| Backend API | http://localhost:8000/api/ | - |
| API Docs | http://localhost:8000/api/docs/ | - |
| Django Admin | http://localhost:8000/admin/ | admin@somosrentable.com / admin123 |
| Adminer (BD) | http://localhost:8080 | db / somosrentable / somosrentable_secret |
| MailHog | http://localhost:8025 | - |

### Usuarios de Prueba

| Email | Password | Rol |
|-------|----------|-----|
| admin@somosrentable.com | admin123 | Admin |
| ejecutivo1@somosrentable.com | ejecutivo123 | Ejecutivo |
| ejecutivo2@somosrentable.com | ejecutivo123 | Ejecutivo |
| ejecutivo3@somosrentable.com | ejecutivo123 | Ejecutivo |
| inversionista1@somosrentable.com | inversionista123 | Inversor (KYC aprobado) |

### Comandos Utiles

```bash
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio especifico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f webhook-service

# Reiniciar un servicio
docker compose restart backend

# Detener todo
docker compose down

# Detener y eliminar volumenes (reset completo)
docker compose down -v

# Reconstruir imagenes
docker compose build --no-cache

# Ejecutar comando en backend
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py shell
```

---

## Guia de Demostracion

### Script de Demo (10 minutos)

#### 1. Mostrar Arquitectura (1 min)
```bash
# Mostrar contenedores corriendo
docker compose ps

# Destacar que webhook es independiente
docker compose logs webhook-service --tail 5
```

#### 2. Flujo Publico - Reserva (2 min)
1. Ir a http://localhost:3000
2. Click en "Ver Proyectos"
3. Elegir un proyecto
4. Click "Reservar sin cuenta"
5. Ingresar email: demo@test.com
6. Mostrar que se creo un lead automaticamente

#### 3. Registro con mismo email (1 min)
1. Ir a http://localhost:3000/registro
2. Usar el mismo email: demo@test.com
3. Completar registro
4. Mostrar que llega al dashboard

#### 4. KYC 80/20 (2 min)
1. En dashboard, click "Verificar Identidad"
2. Subir cualquier imagen como documento
3. Mostrar resultado automatico
4. Si rechaza, mostrar que se puede reintentar
5. Explicar: `random.random() < 0.8`

#### 5. Convertir Reserva (1 min)
1. Ir a "Mis Reservas"
2. Click "Convertir a Inversion"
3. Mostrar inversion creada con status "Pendiente de Pago"

#### 6. Panel Admin (2 min)
1. Logout
2. Login como admin@somosrentable.com
3. Mostrar:
   - Dashboard con estadisticas
   - KYC pendientes
   - Pagos pendientes
   - Leads y asignaciones
   - Estadisticas de ejecutivos

#### 7. Webhook en accion (1 min)
```bash
# En terminal, mostrar leads llegando
docker compose logs -f webhook-service
```

---

## Decisiones de Diseno

### 1. UUID en lugar de IDs secuenciales

**Razon**: Seguridad
```python
# Evita enumeration attacks
# Malo: /api/users/1, /api/users/2, /api/users/3
# Bueno: /api/users/550e8400-e29b-41d4-a716-446655440000
```

### 2. Tokens de acceso para reservas

**Razon**: Permitir acceso sin autenticacion
```python
# El token permite:
# - Ver la reserva
# - Convertirla a inversion (si tiene cuenta + KYC)
# - Cancelarla
access_token = secrets.token_urlsafe(32)  # 43 caracteres
```

### 3. Snapshots en inversiones

**Razon**: La tasa no debe cambiar si el proyecto cambia
```python
# Al crear inversion, se captura:
annual_return_rate_snapshot = project.annual_return_rate  # Ej: 12%
duration_months_snapshot = project.duration_months  # Ej: 12

# Si el admin cambia la tasa del proyecto a 15%,
# las inversiones existentes mantienen su 12%
```

### 4. Round-robin para leads

**Razon**: Distribucion equitativa automatica
```python
# No requiere intervencion manual
# Ejecutivo con menos leads activos recibe el siguiente
executives.annotate(active_leads_count=Count(...)).order_by('active_leads_count')
```

### 5. JWT con refresh token

**Razon**: Sesiones seguras sin estado
```
Access Token:  60 minutos (corto, en memoria)
Refresh Token: 7 dias (largo, en cookie httpOnly)

Si roban access token: solo 60 min de exposicion
Si roban refresh token: se puede blacklistear
```

### 6. Radix UI para componentes

**Razon**: Accesibilidad garantizada
```
- WAI-ARIA compliant
- Keyboard navigation
- Focus management
- Screen reader support
```

### 7. React Query para estado del servidor

**Razon**: Cache inteligente y sincronizacion
```typescript
// Automaticamente:
// - Cachea respuestas
// - Refetch en focus
// - Retry en error
// - Invalidacion de cache
useQuery({ queryKey: ['projects'], queryFn: projectsApi.getAll })
```

### 8. Servicio de Webhook separado

**Razon**: Cumplir requisito de independencia
```
No puede ser gatillado por Django, Next.js o PostgreSQL
-> Python puro con solo `requests`
-> Container Docker separado
-> Comunicacion solo por HTTP
```

---

## Seguridad

### Autenticacion

| Mecanismo | Implementacion |
|-----------|----------------|
| Passwords | bcrypt hashing (Django default) |
| Tokens | JWT con firma HS256 |
| Refresh | Rotacion + blacklist |
| API Key | Header X-API-Key para webhook |

### Autorizacion

| Recurso | Publico | Auth | KYC | Admin |
|---------|---------|------|-----|-------|
| Ver proyectos | Si | Si | Si | Si |
| Crear reserva | Si | Si | Si | Si |
| Ver dashboard | No | Si | Si | Si |
| Crear inversion | No | No | Si | Si |
| Panel admin | No | No | No | Si |

### Validaciones

```python
# Inversion minima
if amount < project.minimum_investment:
    raise ValidationError("Monto inferior al minimo")

# KYC requerido
if not user.is_kyc_verified:
    raise PermissionDenied("Debe verificar KYC")

# Proyecto en financiacion
if project.status != 'funding':
    raise ValidationError("Proyecto no disponible")
```

### Proteccion de Archivos

```python
# Documentos KYC: solo el usuario y admins
MEDIA_URL = '/media/'
# En produccion: servir con nginx + autenticacion

# Imagenes de proyecto: publicas
# Comprobantes de pago: solo usuario y admins
```

### CORS

```python
# Solo frontend permitido
CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
```

---

## Posibles Preguntas del CTO

### Tecnicas

**P: Por que Django y no FastAPI?**
```
- Django tiene ORM maduro con migraciones
- Admin panel incluido
- DRF tiene ecosistema probado (JWT, docs, permisos)
- Mas rapido de desarrollar para CRUD
```

**P: Por que Next.js App Router?**
```
- Server Components para SEO
- File-based routing intuitivo
- Optimizaciones automaticas (code splitting, prefetch)
- Mejor DX con React 19
```

**P: Como escalarias esto?**
```
- Redis ya esta preparado para cache
- PostgreSQL soporta read replicas
- Stateless: horizontal scaling con load balancer
- CDN para assets estaticos
- Separar webhook en Lambda/Cloud Function
```

### Negocio

**P: Que pasa si el KYC siempre rechaza?**
```
- Usuario puede reintentar ilimitadamente
- En produccion: limite de intentos
- O: revision manual tras N rechazos
```

**P: Como manejarias pagos reales?**
```
- Integracion con pasarela (Transbank, MercadoPago)
- Webhook de confirmacion de pago
- Mantener comprobante como backup
```

**P: Que metricas agregarias?**
```
- Tiempo promedio de conversion
- Tasa de abandono en KYC
- ROI por campana de ads
- NPS de inversores
```

---

## Estructura de Archivos

```
somosrentable/
|-- docker-compose.yml
|-- README.md
|-- .env.example
|
|-- backend/
|   |-- Dockerfile
|   |-- requirements.txt
|   |-- manage.py
|   |-- config/
|   |   |-- settings/
|   |   |   |-- base.py
|   |   |   |-- development.py
|   |   |   +-- production.py
|   |   |-- urls.py
|   |   +-- wsgi.py
|   |-- core/
|   |   +-- models.py              # BaseModel con UUID
|   +-- apps/
|       |-- users/
|       |   |-- models.py          # User, roles
|       |   |-- views.py           # Auth views
|       |   |-- serializers.py
|       |   +-- urls.py
|       |-- kyc/
|       |   |-- models.py          # KYCSubmission
|       |   |-- services.py        # 80/20 logic
|       |   +-- views.py
|       |-- projects/
|       |   |-- models.py          # Project, ProjectImage
|       |   +-- views.py
|       |-- investments/
|       |   |-- models.py          # Investment, calculo retorno
|       |   +-- views.py
|       |-- payments/
|       |   |-- models.py          # PaymentProof
|       |   |-- services.py        # approve/reject
|       |   +-- views.py
|       |-- reservations/
|       |   |-- models.py          # Reservation, token
|       |   +-- views.py
|       |-- leads/
|       |   |-- models.py          # Lead, LeadInteraction
|       |   |-- services.py        # Round-robin, webhook
|       |   +-- views.py
|       +-- statistics/
|           |-- services.py        # Calculos en tiempo real
|           +-- views.py
|
|-- frontend/
|   |-- Dockerfile
|   |-- package.json
|   |-- tailwind.config.js
|   |-- tsconfig.json
|   +-- src/
|       |-- app/
|       |   |-- page.tsx           # Landing
|       |   |-- login/
|       |   |-- registro/
|       |   |-- proyectos/
|       |   |-- (investor)/
|       |   |   |-- layout.tsx
|       |   |   |-- dashboard/
|       |   |   |-- inversiones/
|       |   |   |-- reservas/
|       |   |   +-- kyc/
|       |   +-- (admin)/
|       |       +-- admin/
|       |-- components/
|       |   |-- ui/
|       |   |   |-- button.tsx
|       |   |   |-- toast.tsx
|       |   |   |-- skeleton.tsx
|       |   |   +-- confirm-dialog.tsx
|       |   |-- form/
|       |   +-- layout/
|       |-- lib/
|       |   |-- api.ts             # Axios + endpoints
|       |   |-- auth.ts            # Zustand store
|       |   +-- utils.ts
|       +-- types/
|           +-- index.ts
|
+-- webhook-service/
    |-- Dockerfile
    |-- requirements.txt
    +-- main.py                    # Python puro
```

---

## Contacto

Desarrollado como prueba tecnica para SomosRentable.

```
Stack: Django 5 + Next.js 16 + PostgreSQL 15
Fecha: Diciembre 2024
```

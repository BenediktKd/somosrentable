# SomosRentable - Plataforma de Crowdfunding Inmobiliario

Plataforma de crowdfunding inmobiliario desarrollada con Django (backend), Next.js (frontend) y PostgreSQL.

## Stack Tecnologico

- **Backend:** Django 5 + Django REST Framework
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Base de datos:** PostgreSQL 15
- **Contenedores:** Docker Compose
- **Emails:** MailHog (desarrollo)

## Requisitos

- Docker y Docker Compose
- Git

## Inicio Rapido

### 1. Clonar el repositorio

```bash
git clone https://github.com/BenediktKd/somosrentable.git
cd somosrentable
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

### 3. Levantar los servicios

```bash
docker-compose up --build
```

Esto levantara:
- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/api/docs/
- **Admin Django:** http://localhost:8000/admin/
- **Adminer (DB):** http://localhost:8080
- **MailHog (Emails):** http://localhost:8025

### 4. Crear datos iniciales

En otra terminal:

```bash
docker-compose exec backend python manage.py seed_data
```

Esto crea:
- 3 ejecutivos con credenciales:
  - `ejecutivo1@somosrentable.com` / `ejecutivo123`
  - `ejecutivo2@somosrentable.com` / `ejecutivo123`
  - `ejecutivo3@somosrentable.com` / `ejecutivo123`
- 1 admin:
  - `admin@somosrentable.com` / `admin123`
- 4 proyectos de ejemplo

## Estructura del Proyecto

```
somosrentable/
├── docker-compose.yml
├── .env.example
├── backend/                 # Django REST API
│   ├── apps/
│   │   ├── users/          # Usuarios y autenticacion
│   │   ├── kyc/            # Verificacion KYC
│   │   ├── projects/       # Proyectos inmobiliarios
│   │   ├── leads/          # Gestion de leads
│   │   ├── reservations/   # Reservas sin registro
│   │   ├── investments/    # Inversiones activas
│   │   ├── payments/       # Comprobantes de pago
│   │   └── statistics/     # Estadisticas
│   └── config/             # Configuracion Django
├── frontend/               # Next.js App
│   └── src/
│       ├── app/           # Paginas (App Router)
│       ├── components/    # Componentes React
│       ├── lib/           # Utilidades y API
│       └── types/         # TypeScript types
└── webhook-service/        # Servicio webhook independiente
```

## Funcionalidades

### Usuarios

- **Inversionistas:** Pueden invertir despues de pasar KYC
- **Ejecutivos:** Gestionan leads y atienden inversionistas (3 fijos)
- **Administradores:** Gestionan proyectos y aprueban pagos

### Flujo de Inversion

1. Visitante crea **reserva** (solo email requerido)
2. Sistema crea **lead** y lo asigna a ejecutivo (round-robin)
3. Visitante se registra y completa **KYC**
4. KYC se aprueba automaticamente (80% probabilidad)
5. Usuario convierte reserva en **inversion**
6. Usuario sube **comprobante de pago**
7. Admin aprueba pago → Inversion activada

### KYC (Know Your Customer)

- Requiere: nombre completo + foto de documento
- Simulacion automatica: 80% aprobacion, 20% rechazo
- Admin puede aprobar/rechazar manualmente

### Webhook Externo

El servicio `webhook-service` simula un tercero enviando leads:
- Completamente independiente de Django/Next.js
- Envia leads cada ~30 segundos
- Usa API key para autenticacion

## API Endpoints

### Autenticacion
- `POST /api/auth/register/` - Registro
- `POST /api/auth/login/` - Login (JWT)
- `POST /api/auth/refresh/` - Refresh token
- `GET /api/auth/me/` - Perfil del usuario

### Proyectos
- `GET /api/projects/` - Lista de proyectos
- `GET /api/projects/{slug}/` - Detalle de proyecto
- `POST /api/projects/{slug}/calculate-return/` - Calcular rentabilidad

### Reservas
- `POST /api/reservations/` - Crear reserva (publico)
- `GET /api/reservations/{token}/` - Ver reserva por token
- `POST /api/reservations/{token}/convert/` - Convertir a inversion

### KYC
- `GET /api/kyc/status/` - Estado de KYC
- `POST /api/kyc/submit/` - Enviar documentos

### Inversiones
- `GET /api/investments/` - Mis inversiones
- `POST /api/investments/create/` - Crear inversion
- `GET /api/investments/{id}/projection/` - Proyeccion de rentabilidad

### Pagos
- `POST /api/payments/proof/` - Subir comprobante
- `POST /api/payments/{id}/review/` - Aprobar/rechazar (admin)

### Leads (Webhook)
- `POST /api/leads/webhook/` - Recibir lead externo (API key)

### Estadisticas (Admin)
- `GET /api/statistics/platform/` - Stats generales
- `GET /api/statistics/executives/` - Stats por ejecutivo

## Desarrollo

### Backend (Django)

```bash
# Entrar al contenedor
docker-compose exec backend bash

# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Tests
python manage.py test
```

### Frontend (Next.js)

```bash
# Entrar al contenedor
docker-compose exec frontend sh

# Instalar dependencias
npm install

# Build
npm run build
```

## Credenciales por Defecto

| Rol | Email | Contrasena |
|-----|-------|------------|
| Admin | admin@somosrentable.com | admin123 |
| Ejecutivo 1 | ejecutivo1@somosrentable.com | ejecutivo123 |
| Ejecutivo 2 | ejecutivo2@somosrentable.com | ejecutivo123 |
| Ejecutivo 3 | ejecutivo3@somosrentable.com | ejecutivo123 |

## Notas Tecnicas

- Los proyectos duran 12 meses
- La rentabilidad se define por proyecto (11-16% anual tipico)
- Inversion minima desde $5.000.000 CLP
- Reservas expiran en 7 dias
- Emails se capturan en MailHog (no se envian realmente)

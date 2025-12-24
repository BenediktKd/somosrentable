# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SomosRentable is a real estate crowdfunding platform built with Django REST Framework (backend), Next.js 16 with App Router (frontend), and PostgreSQL. The platform allows investors to fund real estate projects after KYC verification.

## Development Commands

### Local Development (Docker)
```bash
docker compose up -d          # Start all services
docker compose down           # Stop services
docker compose down -v        # Stop and remove volumes (full reset)
docker compose logs -f backend   # View backend logs
docker compose logs -f webhook-service  # View webhook logs
```

### Backend (Django)
```bash
# Inside container or with venv activated
cd backend
python manage.py migrate
python manage.py seed_data              # Create test users and projects
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000

# Testing
pytest                                   # Run all tests
pytest apps/users/tests.py              # Run specific test file
pytest -k "test_login"                  # Run tests matching pattern
```

### Frontend (Next.js)
```bash
cd frontend
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint
npx tsc          # TypeScript check
```

## Architecture

### Backend Structure (`backend/`)
Django REST Framework with modular apps under `apps/`:

| App | Purpose |
|-----|---------|
| `users` | Custom User model with roles (investor/executive/admin), JWT auth |
| `kyc` | KYC submissions with 80/20 auto-approval in `services.py` |
| `projects` | Real estate projects with funding targets |
| `investments` | Investment records with return rate snapshots |
| `payments` | Payment proof uploads and admin review |
| `reservations` | Pre-registration reservations with access tokens |
| `leads` | Lead management with round-robin assignment to executives |
| `statistics` | Platform and executive statistics |

Settings: `config/settings/{base,development,production}.py`

### Frontend Structure (`frontend/src/`)
Next.js 16 App Router with route groups:

- `app/(investor)/` - Protected investor routes (dashboard, investments, kyc)
- `app/(admin)/admin/` - Protected admin routes (leads, payments, statistics)
- `app/proyectos/` - Public project listing and detail
- `lib/api.ts` - Axios client with JWT interceptors
- `lib/auth.ts` - Zustand auth store

### Webhook Service (`webhook-service/`)
Standalone Python service (no Django dependency) that simulates external lead sources. Sends leads to `/api/leads/webhook/` with API key auth every ~30 seconds.

## Key Business Logic

- **KYC Approval**: 80% auto-approve, 20% reject (`apps/kyc/services.py:14`)
- **Lead Assignment**: Round-robin to executive with fewest active leads (`apps/leads/services.py`)
- **Investment Snapshots**: Rate and duration captured at investment creation
- **Reservations**: Generate unique access token, expire in 7 days, convertible to investment post-KYC

## Local URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api |
| API Docs (Swagger) | http://localhost:8000/api/docs |
| Django Admin | http://localhost:8000/admin |
| Adminer (DB) | http://localhost:8080 |
| MailHog | http://localhost:8025 |

## Test Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@somosrentable.com | admin123 | Admin |
| ejecutivo1@somosrentable.com | ejecutivo123 | Executive |

## Production Deployment

- **Frontend**: Vercel (https://somosrentable.vercel.app)
- **Backend**: Render (https://somosrentable.onrender.com)
- **Database**: Render PostgreSQL

Backend build: `backend/build.sh` runs migrations and seed_data.

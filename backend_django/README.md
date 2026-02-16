# CostPilot Django Backend (Incremental Migration)

This service is an incremental Django + DRF backend for CostPilot. It runs alongside the existing Next.js frontend.

## 1) Setup

```bash
cd backend_django
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## 2) Run

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

## 3) API Endpoints

- `GET /api/v1/health/`
- `GET|POST /api/v1/restaurants/`
- `GET|POST /api/v1/ingredients/`
- `GET|POST /api/v1/dishes/`
- `GET|POST /api/v1/recipes/`
- `GET|POST /api/v1/purchases/`
- `GET|POST /api/v1/sales-records/`
- `GET|POST /api/v1/receipts/`
- `GET|POST /api/v1/alerts/`
- `GET|POST /api/v1/dashboard-kpis/`
- `GET|POST /api/v1/analytics-data/`
- `GET|POST /api/v1/dishes-over-target/`

## 4) Incremental Migration Plan

1. Move read endpoints from Next hooks to Django API calls.
2. Move write endpoints (dish, ingredient, recipe, purchases) to Django.
3. Keep Next.js frontend while replacing Node server logic gradually.
4. Deploy this service separately on Render and point frontend to it.

## 5) Frontend Toggle + Rollback

Set in Next.js `.env.local`:

```bash
NEXT_PUBLIC_BACKEND_PROVIDER=django
NEXT_PUBLIC_DJANGO_API_URL=http://127.0.0.1:8000
```

Rollback to current stack instantly:

```bash
NEXT_PUBLIC_BACKEND_PROVIDER=supabase
```

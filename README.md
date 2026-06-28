# Sinop Personal Finance App

Sinop is a personal finance web app with a React frontend and a Django REST backend. The current foundation includes account registration and login, a user dashboard, transaction management, categories, budgets, savings goals, bill reminders, notifications, and user settings.

New accounts start with an empty finance workspace. Users manually create their own accounts, categories, and transactions instead of receiving demo finance records.

## Tech Stack

- Frontend
  - React 19
  - Vite 8
  - React Router v7
  - Tailwind CSS 4
  - `lucide-react` for icon components
- Backend
  - Django 6.0.3
  - Django REST Framework
  - DRF Token Authentication (`rest_framework.authtoken`)
  - `django-cors-headers` for frontend/backend local development
- Database
  - SQLite for local development
  - Clean schema structure for future PostgreSQL migration

## Project structure

- `frontend/src/components/` - shared layout and auth modal
- `frontend/src/pages/` - home, dashboard, transactions, settings, marketing pages
- `frontend/src/lib/` - auth and finance API clients
- `backend/api/models.py` - finance domain schema
- `backend/api/views.py` - auth endpoints, dashboard summary, and REST resource viewsets
- `backend/api/services.py` - profile/settings bootstrap and default finance data provisioning

## Finance schema

The backend currently models these core entities:

- `UserProfile`
- `UserSettings`
- `FinancialAccount`
- `Category`
- `Transaction`
- `RecurringTransaction`
- `Budget`
- `IncomeSource`
- `BillReminder`
- `SavingsGoal`
- `Notification`
- `DashboardWidget`

## API overview

Auth endpoints:

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `GET /api/auth/me/`
- `PATCH /api/auth/me/`
- `POST /api/auth/logout/`

Dashboard and settings:

- `GET /api/health/`
- `GET /api/dashboard/`
- `GET /api/settings/`
- `PATCH /api/settings/`

REST resources:

- `/api/accounts/`
- `/api/categories/`
- `/api/transactions/`
- `/api/budgets/`
- `/api/income-sources/`
- `/api/bills/`
- `/api/goals/`
- `/api/notifications/`
- `/api/recurring-transactions/`
- `/api/dashboard-widgets/`

All finance resource endpoints are token-protected and scoped to the authenticated user.

## Local run instructions

### 1. Apply migrations

```powershell
Set-Location backend
& "c:/Users/Aimee/OneDrive/ドキュメント/Sinop/.venv/Scripts/python.exe" manage.py migrate
```

### 2. Start the backend

```powershell
Set-Location backend
& "c:/Users/Aimee/OneDrive/ドキュメント/Sinop/.venv/Scripts/python.exe" manage.py runserver
```

### 3. Start the frontend

```powershell
Set-Location frontend
npm run dev
```

## Validation commands

Backend tests:

```powershell
Set-Location backend
& "c:/Users/Aimee/OneDrive/ドキュメント/Sinop/.venv/Scripts/python.exe" manage.py test
```

Frontend production build:

```powershell
Set-Location frontend
npm run build
```

## Local URLs

- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:8000`

The Vite dev server proxies `/api` to the Django backend, so the frontend uses relative API requests such as `fetch('/api/dashboard/')`.

## Deployment

Sinop is designed as a static frontend on Vercel and a Django backend on Render. The frontend uses `VITE_API_BASE` to connect to the backend in production.

### Frontend deployment on Vercel

1. Push the repo to GitHub.
2. Create a Vercel project and connect the repo.
3. Configure the project settings:
   - Root directory: `frontend`
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Output directory: `dist`
4. Set environment variables in Vercel:
   - `VITE_API_BASE=https://<your-backend-domain>/api`
5. Deploy.

### Backend deployment on Render

1. Create a new Render web service.
2. Connect the repo and choose `backend` as the root directory.
3. Set the service type to `Web Service`.
4. Use these settings:
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn config.wsgi:application --workers 2 --bind 0.0.0.0:$PORT`
   - Environment: `Python 3.14`
5. Set environment variables:
   - `DJANGO_SECRET_KEY` - a secure secret key
   - `DJANGO_DEBUG=False`
   - `DJANGO_ALLOWED_HOSTS=<your-backend-domain>`
   - `CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>`

### Required files

- `backend/requirements.txt`
- `backend/Procfile`
- `backend/runtime.txt`
- `frontend/.env.example`

### Environment variable notes

- `VITE_API_BASE` should point to the backend API root, for example `https://sinop-backend.onrender.com/api`.
- `DJANGO_ALLOWED_HOSTS` can be a comma-separated list of hostnames.
- `CORS_ALLOWED_ORIGINS` can be a comma-separated list of allowed frontend origins.

### Production setup summary

- Build the frontend in `frontend` with `npm run build`.
- Serve the backend from `backend` with Gunicorn.
- Use Vercel for the frontend static site and Render for the Django API.

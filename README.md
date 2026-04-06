# Sinop Personal Finance App

Sinop is a personal finance web app with a React frontend and a Django REST backend. The current foundation includes account registration and login, a user dashboard, transaction management, categories, budgets, savings goals, bill reminders, notifications, and user settings.

New accounts start with an empty finance workspace. Users manually create their own accounts, categories, and transactions instead of receiving demo finance records.

## Stack

- `frontend/` - React 19, React Router, Vite, Tailwind CSS
- `backend/` - Django, Django REST Framework, DRF token auth, CORS
- Database schema currently runs on SQLite in local development and is structured to translate cleanly to PostgreSQL

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

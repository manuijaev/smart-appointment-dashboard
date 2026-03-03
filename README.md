# Smart Appointment Booking System (PWA)

Full-stack appointment booking system with Django REST backend and React PWA frontend.

## Project Structure

- `backend/`: Django + DRF + PostgreSQL + JWT auth
- `frontend/`: React (Vite) + Router + Axios + PWA scaffold

## Backend Features

- Custom user model (`Admin` / `Staff`) with department and `fcm_token`
- Department list/create API
- Staff register/login/list APIs
- Appointment create/list/update APIs
- Email notification on appointment creation
- Firebase push notification hook on appointment creation

## Frontend Features

- Visitor appointment booking page
- Staff login page
- Staff dashboard (accept/reschedule/decline + response note)
- Admin dashboard (add department, list staff)
- PWA manifest + service worker cache/push scaffold
- Context API for auth/appointments/notifications

## API Endpoints

- `GET /api/departments/`
- `POST /api/departments/`
- `GET /api/staff/?department_id=<id>`
- `POST /api/staff/register/`
- `POST /api/staff/login/`
- `POST /api/staff/token/refresh/`
- `PUT /api/staff/me/fcm-token/`
- `POST /api/appointments/create/`
- `GET /api/appointments/my/`
- `PUT /api/appointments/update/<id>/`

## Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `.env` values via your environment (example names):

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `DB_ENGINE`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `EMAIL_HOST_USER`
- `EMAIL_HOST_PASSWORD`
- `DEFAULT_FROM_EMAIL`
- `FIREBASE_SERVER_KEY`

Then run:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Set frontend env vars in `.env`:

- `VITE_API_BASE_URL=http://localhost:8000/api`
- Firebase keys (`VITE_FIREBASE_*`, `VITE_FIREBASE_VAPID_KEY`)

## Notes

- Add PWA icons in `frontend/public/icons/icon-192.png` and `frontend/public/icons/icon-512.png`.
- For production, lock CORS to known frontend origins.
- For production push notifications, migrate from legacy FCM server key approach to HTTP v1 API with service account.

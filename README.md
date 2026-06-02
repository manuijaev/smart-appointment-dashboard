# Smart Appointment Booking System (PWA Website)

A modern Progressive Web App that guides visitors through a multi-step appointment booking journey while giving staff and administrators highly interactive dashboards to manage requests, resources, and notifications in real time. The frontend is built with React + Vite, the backend runs on Django + Django REST Framework, and the two communicate over JWT-protected REST APIs with push/email notification support.

## Table of Contents

1. [High-Level Experience](#high-level-experience)
2. [System Architecture & Data Flow](#system-architecture--data-flow)
3. [Core Feature Breakdown](#core-feature-breakdown)
   - [Visitor Flow](#visitor-flow)
   - [Staff Workspace](#staff-workspace)
   - [Admin Control Center](#admin-control-center)
4. [Technology Stack](#technology-stack)
5. [Visual Design System](#visual-design-system)
   - [Color Palette](#color-palette)
   - [Animations & Motions](#animations--motions)
   - [Visual Effects](#visual-effects)
6. [Data Models & API Contracts](#data-models--api-contracts)
7. [Notifications & Communication](#notifications--communication)
8. [Security & Authorization](#security--authorization)
9. [Developer Setup](#developer-setup)
   - [Backend](#backend)
   - [Frontend](#frontend)
10. [Testing & Quality](#testing--quality)
11. [Operational Considerations](#operational-considerations)
12. [Troubleshooting & FAQs](#troubleshooting--faqs)
13. [Contribution Guidelines](#contribution-guidelines)

---

## High-Level Experience

Visitors land on a friendly home page that explains the appointment flow, highlights the value propositions (fast routing, response transparency, and push/email notifications), and immediately lets them start a 7-step booking assistant. Staff members receive real-time appointment alerts, manage requests through status tabs, and stay aware of their availability and session state. Administrators orchestrate the entire hierarchy—departments, divisions, staff accounts, and appointment assignments—via one consolidated dashboard with analytics and notifications.

The application feels like a native app thanks to:

- **PWA capabilities**: service worker caching, offline-friendly shell, install prompt, and manifest definitions
- **Role-aware routing**: Protected routes redirect unauthorized visitors, staff, or admin users to login flows
- **Responsive UI**: Layouts adapt to phones, tablets, and desktops automatically
- **Live communications**: Firebase Cloud Messaging + EmailJS keep everyone in-sync without refreshes

---

## System Architecture & Data Flow

```
Visitor Browser ↔ Frontend React PWA ↔ (Axios) ↔ Django REST API ↔ PostgreSQL
                                   |                              |
                                 EmailJS                        Firebase FCM
                                   |                              |
                        Staff / Admin Email Alert             Staff Push Alert
```

1. Visitor submits booking request → frontend validates each step → sends request to `/api/appointments/create/`
2. Backend stores appointment, ties it to department/division/staff, and returns confirmation
3. Staff receives email + push notification + dashboard badge
4. Staff responds via dashboard (accept/reschedule/decline) and optionally adds response note
5. Response triggers notification back to visitor and updates appointment status
6. Admin can reassign appointments, manage staff, and monitor analytics from `/admin/dashboard`

Data flows prioritize eventual consistency: dashboards poll every 8–10 seconds but rely on push notifications for instant updates.

---

## Core Feature Breakdown

### Visitor Flow

Visitors traverse a guided 7-step form that enforces validation before moving to each subsequent question.

| Step | Input | Purpose | Validation |
|------|-------|---------|------------|
| 1 | Full Name | Identify visitor | Required, text only, max length 120
| 2 | Email Address | Contact channel | Required, must be valid email
| 3 | Department | Routing category | Required, options pulled from `/api/departments/`
| 4 | Division | Narrow team | Required after department selection, filtered via `/api/divisions/?department_id=`
| 5 | Staff Member | Assignee | Required, filters by department/division
| 6 | Appointment Date & Time | Scheduling | Required, future date/time; rejects past dates
| 7 | Note | Optional context | Text area (max 600 chars) for visitor message

- Each step shows progress with a header/badge and prevents rollback without explicit "Back" clicks
- On submit, an animation confirms delivery and invites another request
- Visitors see automated emails that summarize their request and eventual staff response (accept/reschedule/decline)

### Staff Workspace

Accessible at `/staff/login` and `/staff/dashboard`, staff see:

- **Profile + availability**: Displays name, avatar initials, department/division, and a toggle for "Available / Busy" status
- **Stats overview**: Pending appointment count, total responses this week, acceptance ratio, and current session time remaining
- **Tabbed list**: Pending, Accepted, Declined, All (with color-coded badges and overdue chips for pending requests older than 24 hours)
- **Search bar**: Type-ahead filtering on visitor name, email, or service
- **Response cards**: Each appointment card shows visitor details, requested date/time, message, and actions
- **Actions for pending appointments**
  - Accept → status updates immediately
  - Reschedule → opens date/time picker and response note field
  - Decline → sends polite decline with optional explanation
- **Toast + audio cues** triggered on new appointments or action outcomes
- **Session & security controls**: Automatic 30-minute timeout, 2-minute warning modal, extend button, and forced logout after inactivity
- **Export to CSV**: Current filter state (tab + search) is respected so staff can export the same subset they see

### Admin Control Center

The admin dashboard (`/admin/login`, `/admin/dashboard`) is where organizational controls live.

#### Department & Division Management

- Create, rename, and delete departments with inline edit modals
- Divisions are tied to departments during creation; editing allows reassignments
- Delete operations prompt a danger modal requiring keyword confirmation

#### Staff Management

- Admins create staff (admin or staff role) via a dedicated form that sets department/division, role, and temporary password
- The staff table displays role, status, assigned team, and activation toggle (soft deactivates without deleting data)
- Inline edits let admins change departments, divisions, or toggle `is_active`
- Delete permanently removes accounts with confirmation

#### Appointment Administration

- Global appointment view with filters by status
- Reassignment modal to move any request to another staff member (filters to active users within the selected department/division)
- Action log to audit who reassigned or edited appointments (future scope)

#### Analytics & Notifications

- Metric cards: total appointments, pending, accepted, declined, monthly bookings, active staff count
- Notification bell with unread counts, dropdown preview, and "mark all as read" action
- Full notifications page with filters (All, Unread, Appointment, Staff) and timestamps

#### Security

- All routes guarded by role checks; admins cannot be impersonated by staff
- Deactivated staff cannot log in even with valid tokens
- Confirmations protect destructive actions (delete, deactivate, reassign)

---

## Technology Stack

| Area | Technology | Notes |
|------|------------|-------|
| Backend Framework | Django 4.x (Python) | Django REST Framework, Celery-ready settings, custom user model |
| API Layer | Django REST Framework | ViewSets + serializers, JWT auth via `djangorestframework-simplejwt` |
| Database | PostgreSQL | Configurable via env vars, migrations managed through Django |
| Frontend | React 18, Vite | Vite dev server, React Router v6, Context API for state |
| API Client | Axios | Central `services/` folder with interceptors and JWT refresh |
| Auth | JWT + Refresh | Access tokens in `localStorage`, refresh handled transparently |
| Notifications | EmailJS, Firebase Cloud Messaging | Email templates stored in `frontend/services/emailjs`, FCM tokens stored per-user |
| PWA | Service worker + manifest | Custom caching strategies inside `public/sw.js` and `manifest.json` |
| Styling | CSS Modules / global styles | Modular components with BEM-alike naming conventions |

---

## Visual Design System

### Color Palette

The application uses a carefully crafted color system with CSS custom properties for consistent theming across all pages.

#### Dark Theme (Default)

| Variable | Value | Usage |
|---------|-------|-------|
| `--bg` | `#050505` | Primary background |
| `--bg-soft` | `#101010` | Secondary background areas |
| `--surface` | `rgba(255, 255, 255, 0.06)` | Card backgrounds |
| `--surface-hover` | `rgba(255, 255, 255, 0.1)` | Interactive hover states |
| `--line` | `rgba(255, 255, 255, 0.15)` | Borders and dividers |
| `--text` | `#f7f7f8` | Primary text |
| `--muted` | `#b8bcc2` | Secondary/muted text |
| `--button` | `#8e949e` | Default button state |
| `--button-hover` | `#a2a8b1` | Button hover state |
| `--button-text` | `#0a0a0a` | Button text |
| `--danger` | `#da4b4b` | Error/danger states |
| `--danger-hover` | `#f26262` | Danger hover state |

#### Light Theme (Home & Staff Dashboard)

| Variable | Value | Usage |
|---------|-------|-------|
| `--ink` | `#1a1714` | Primary text on light backgrounds |
| `--ink-mid` | `#3d3832` | Secondary text |
| `--ink-light` | `#6b6560` | Muted text |
| `--ink-faint` | `#a39d96` | Faint/disabled text |
| `--gold` | `#c9922a` | Accent color (buttons, highlights) |
| `--gold-light` | `#fdf3e3` | Gold tint backgrounds |
| `--gold-mid` | `#e8b96a` | Gold intermediate |
| `--gold-dark` | `#8a6018` | Gold dark variant |
| `--teal` | `#1a7a72` | Success/positive actions |
| `--teal-light` | `#e6f4f2` | Teal tint backgrounds |
| `--teal-mid` | `#4aada4` | Teal intermediate |
| `--red` | `#c0392b` | Error states |
| `--red-light` | `#fdecea` | Red tint backgrounds |
| `--red-mid` | `#e74c3c` | Red intermediate |
| `--red-dark` | `#922b21` | Red dark variant |
| `--green` | `#1e7e4a` | Success/confirmation |
| `--green-light` | `#e8f5ee` | Green tint backgrounds |
| `--green-mid` | `#3da86a` | Green intermediate |
| `--green-dark` | `#156534` | Green dark variant |

#### Status Colors

| Status | Color | CSS Variable |
|--------|-------|--------------|
| Pending | Amber | `--amber: #c9922a` |
| Accepted | Green | `--green: #1e7e4a` |
| Declined | Red | `--red: #c0392b` |
| Rescheduled | Teal | `--teal: #1a7a72` |

### Animations & Motions

The application features smooth, purposeful animations that enhance the user experience without being distracting.

#### Page Transitions

| Animation | Duration | Description |
|-----------|----------|-------------|
| `heroFade` | 0.6s | Hero section entrance animation |
| `cardIn` | 0.55s | Staggered card entrance with fade and slide |
| `authIn` | 0.6s | Authentication panel entrance |
| `heroFloat` | 6s infinite | Subtle floating animation for hero elements |
| `riseIn` | 0.35s | Modal and panel rise-in effect |
| `fadeUp` | 0.3s-0.5s | Content fade-up for lists and sections |

#### Interactive Animations

| Animation | Trigger | Description |
|-----------|---------|-------------|
| `nav-link` hover | Hover | Translate Y(-2px) with glow effect |
| `card` hover | Hover | Enhanced shadow and border transition |
| `confirmPulse` | Click | Button press feedback |
| `badgePop` | New notification | Notification badge pop-in |
| `slideIn` | Sidebar/modal | Horizontal slide for drawers |
| `slideUp` | Toast | Toast notification entrance |
| `pulse` | Status indicator | Breathing pulse for active states |
| `homeSubmitPulse` | Form submit | Submit button loading pulse |
| `homeIconPop` | Success state | Checkmark icon pop animation |
| `availabilityPulseHeader` | Availability toggle | Header pulse when available |

#### Loading & Feedback Animations

| Animation | Usage |
|-----------|-------|
| `dotBlink` | Loading indicator dots |
| `drawCircle` | SVG circle drawing effect |
| `drawCheck` | SVG checkmark drawing |
| `homeLoadingDots` | Step loading dots |
| `heroCursor` | Typing cursor blink |
| `homeBlink` | Status indicator pulse |

### Visual Effects

#### Background Effects

- **Radial Gradients**: Subtle light spots create depth on dark backgrounds
- **Linear Gradients**: Smooth color transitions for hero sections
- **Blur Filters**: Background images use 2.2-2.5px blur for depth
- **Overlay Gradients**: Dark overlays on background images for text readability
- **SVG Patterns**: Subtle dot patterns for texture without distraction

#### Glassmorphism

- **Backdrop Filters**: `blur(8px)` to `blur(16px)` for frosted glass effect
- **Translucent Surfaces**: `rgba(255, 255, 255, 0.06)` to `rgba(255, 255, 255, 0.09)` for cards
- **Border Highlights**: Subtle borders with `rgba(255, 255, 255, 0.15)` opacity

#### Shadow System

| Variable | Usage |
|---------|-------|
| `--shadow-sm` | Small elements, inputs |
| `--shadow-md` | Cards, panels |
| `--shadow-lg` | Modals, hero sections |

#### Transitions

- **Standard**: `0.25s ease` for most interactive elements
- **Smooth**: `0.35s ease` for panel transitions
- **Emphasis**: `0.5s ease` for page content
- **Cubic Bezier**: `cubic-bezier(0.16, 1, 0.3, 1)` for natural motion

---

## Data Models & API Contracts

### Data Models (simplified)

- **Department**: `name` (unique)
- **Division**: `name`, `department` (FK), `is_active`
- **User**: Custom user with `full_name`, `email`, `department`, `division`, `role` (Staff/Admin), `fcm_token`, `is_active` flag
- **Appointment**: visitor fields, `department`, `division`, `staff_member`, `appointment_date`, `message`, `status` enum (`Pending`, `Accepted`, `Rescheduled`, `Declined`), `response_note`, `created_at`

### API Contract Highlights

Authentication endpoints use JWT (`/api/staff/login/`, `/api/staff/token/refresh/`, `/api/staff/me/`). Staff CRUD, department/division CRUD, and appointments endpoints are namespaced under `/api/`.

Refer to the old README tables for full endpoint docs (this repo keeps consistent naming conventions across HTTP verbs). Ensure POST/PUT/PATCH payloads follow serializer validation: `appointment_date` must be ISO 8601, department/division IDs must exist, and `staff_member` must belong to the selected division.

---

## Notifications & Communication

- **Email**: EmailJS templates for request and response flows. Backend orchestrates webhook calls.
- **Push**: Clients register FCM tokens via `/api/staff/me/fcm-token/`. Firebase service accounts can send high-priority messages to staff devices.
- **In-app**: Toast messages and notification badges are triggered by both polling and Web Push.

Service worker intercepts push payloads and shows notifications even when the app is closed.

---

## Security & Authorization

- **JWT authentication**: Short-lived access tokens plus refresh tokens to minimize risk
- **Role guards**: `<ProtectedRoute>` component ensures `/staff` paths require `Staff` or `Admin`, `/admin` paths strictly require `Admin`
- **CORS**: Configure `backend/config/settings.py` to sync `DJANGO_ALLOWED_HOSTS` with deployed `frontend` origins
- **Session timeout**: Staff sessions auto-logout after 30 minutes of inactivity
- **Action confirmations**: All delete/activation flows go through danger modals with explicit confirmation text

---

## Developer Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` (use `.env.example` as reference):

```env
DJANGO_SECRET_KEY=... (required for cryptographic signing)
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DB_ENGINE=django.db.backends.postgresql
DB_NAME=appointment_db
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
EMAIL_HOST_USER=your-emailjs-service-id
EMAIL_HOST_PASSWORD=your-emailjs-public-key
DEFAULT_FROM_EMAIL=noreply@example.com
FIREBASE_SERVER_KEY=server-key
```

Then run migrations and start server:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser      # optional but helpful for admin panel
python manage.py runserver           # listens on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
```

Create `.env.local` (refer to `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

Start the dev server:

```bash
npm run dev              # runs on http://localhost:5173 by default
```

Use `npm run lint` or other npm scripts if configured.

---

## Testing & Quality

- **Backend tests**: Use Django's `manage.py test` when available. Focus on appointment serializer validation, viewset permissions, and notification dispatch logic.
- **Frontend tests**: Add Jest/React Testing Library tests for components, if introduced. (Currently the repo relies on manual QA.)
- **Linting**: Run `npm run lint` for frontend and adopt `ruff` or `flake8` for backend if added later.

Automated CI pipelines should run both backend and frontend suites along with formatting checks.

---

## Operational Considerations

- **Deployment**: Serve frontend build via CDN or static hosting and proxy API requests to the Django REST API. Use Gunicorn/Uvicorn behind Nginx for backend.
- **Database**: Back PostgreSQL with daily backups and connection pooling.
- **Caching**: Use Redis to cache department/division lookup tables and reduce DB load.
- **Monitoring**: Integrate Sentry (or equivalent) for backend error tracking and React error boundaries for the frontend.
- **PWA**: Ensure HTTPS + valid manifest + service worker for installability. Sync `start_url` and `scope` with production base path.

---

## Troubleshooting & FAQs

- **Visitor form fails on submit**: Check console for validation errors (missing fields or invalid email). Backend response includes detail of failed field.
- **FCM tokens not updating**: Confirm `/api/staff/me/fcm-token/` receives POST with `token`. Frontend stores tokens in localStorage after login.
- **EmailJS not sending**: Verify service ID and template ID in `.env`. EmailJS logs show errors when payloads misalign.
- **Staff cannot log in**: Ensure staff account is active (`is_active=True`) and refreshing tokens (`/api/staff/token/refresh/`) in case access token expired.
- **Admin deletes department by mistake**: Recreate department/division via dashboard; appointments linked to old records need manual update.

---

## Contribution Guidelines

1. Branch from `master` into a descriptive feature/bugfix branch.
2. Keep backend changes within `backend/` and frontend within `frontend/`; shared docs or infra may touch both.
3. Run formatters (`black`, `npm run format`) before submitting.
4. Include tests for new API views or components.
5. Describe manual steps to verify features in your PR description.
6. For large refactors, open a design discussion issue first.

---

By following this README you can run the PWA locally, understand core flows, and safely extend the Smart Appointment Booking System with new functionality.

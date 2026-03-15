# Smart Appointment Booking System (PWA)

A full-stack appointment booking system with a Django REST Framework backend and React PWA frontend. The system enables visitors to book appointments with staff members through a guided multi-step process, while staff and administrators can manage appointments and organizational structure through dedicated dashboards.

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Data Models](#data-models)
- [Dashboard Overview](#dashboard-overview)
  - [Visitor Home Page](#visitor-home-page)
  - [Staff Dashboard](#staff-dashboard)
  - [Admin Dashboard](#admin-dashboard)
- [API Endpoints](#api-endpoints)
- [Authentication & Authorization](#authentication--authorization)
- [Notifications](#notifications)
- [Project Structure](#project-structure)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Production Considerations](#production-considerations)

---

## Project Overview

The Smart Appointment Booking System is designed to streamline the appointment scheduling process between visitors and staff members within an organization. It provides a clean, guided interface for visitors to submit appointment requests and robust management tools for staff and administrators.

### Key Features

- **Multi-step Booking Flow**: Visitors go through a guided 7-step process to book appointments
- **Department & Division Routing**: Appointments are routed to the correct team based on department and division selection
- **Real-time Status Updates**: Staff can Accept, Reschedule, or Decline appointments with response notes
- **Email Notifications**: Automated email notifications via EmailJS for appointment requests and responses
- **Push Notifications**: Firebase Cloud Messaging support for real-time push notifications
- **Role-based Access Control**: Separate dashboards for Visitors, Staff, and Administrators
- **PWA Support**: Progressive Web App capabilities with offline caching

---

## Technology Stack

### Backend

| Technology | Purpose |
|------------|---------|
| Django 4.x | Web framework |
| Django REST Framework | RESTful API |
| PostgreSQL | Primary database |
| JWT (djangorestframework-simplejwt) | Authentication |
| EmailJS | Transactional emails |
| Firebase Cloud Messaging | Push notifications |

### Frontend

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| React Router | Navigation |
| Axios | HTTP client |
| Context API | State management |
| Service Worker | PWA offline support |

---

## Architecture

```
                    +------------------+
                    |   Visitor User   |
                    |   (Home Page)    |
                    +--------+---------+
                             |
                             v
                    +------------------+
                    |   Appointment    |
                    |   Request        |
                    +--------+---------+
                             |
                             v
         +-------------------+-------------------+
         |                                       |
         v                                       v
+------------------+                   +------------------+
|   Staff Member   |                   |    Admin User    |
|   (Dashboard)    |                   |   (Dashboard)   |
+------------------+                   +------------------+
```

---

## Data Models

### Department

Represents a department within the organization.

```python
class Department(models.Model):
    name = models.CharField(max_length=120, unique=True)
```

### Division

Represents a subdivision within a department.

```python
class Division(models.Model):
    name = models.CharField(max_length=120)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
```

### User

Custom user model supporting two roles: Admin and Staff.

```python
class User(AbstractBaseUser):
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    department = models.ForeignKey(Department, null=True, blank=True)
    division = models.ForeignKey(Division, null=True, blank=True)
    role = models.CharField(choices=['Admin', 'Staff'])
    fcm_token = models.TextField()  # Firebase token for push notifications
    is_active = models.BooleanField(default=True)
```

### Appointment

Represents an appointment request from a visitor.

```python
class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'Pending'
        ACCEPTED = 'Accepted'
        RESCHEDULED = 'Rescheduled'
        DECLINED = 'Declined'
    
    visitor_name = models.CharField(max_length=120)
    visitor_email = models.EmailField()
    department = models.ForeignKey(Department)
    division = models.ForeignKey(Division, null=True)
    staff_member = models.ForeignKey(User)
    appointment_date = models.DateTimeField()
    message = models.TextField()  # Visitor's message
    status = models.CharField(choices=Status, default=Status.PENDING)
    response_note = models.TextField()  # Staff's response note
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## Dashboard Overview

### Visitor Home Page

The visitor-facing booking interface accessible at the root URL (`/`). This is the entry point for visitors who want to book appointments.

#### Features

**1. Landing Section**
- Welcome message explaining the appointment booking process
- Feature highlights: Instant Request Delivery, Email Response Updates, Department + Division Routing
- Step-by-step explanation of how the booking process works

**2. Guided Booking Flow (7 Steps)**

| Step | Question | Field Type | Description |
|------|----------|------------|-------------|
| 1 | "What's your name?" | Text Input | Visitor's full name |
| 2 | "What's your email address?" | Email Input | Visitor's contact email |
| 3 | "Which department do you want to visit?" | Dropdown | Select from available departments |
| 4 | "Choose a division in that department." | Dropdown | Filtered by selected department |
| 5 | "Select the staff member you want to meet." | Dropdown | Filtered by department and division |
| 6 | "When should the appointment happen?" | DateTime Picker | Future date/time selection |
| 7 | "Any note for the staff member?" | Textarea | Optional message |

**3. Form Validation**
- Real-time validation at each step
- Prevents proceeding without valid input
- Validates that appointment date is in the future

**4. Submission**
- Sends appointment request to the backend
- Triggers email notification to selected staff member
- Displays success confirmation with option to submit another request

#### User Flow

```
Landing Page → Start Booking → Step 1 (Name) → Step 2 (Email) 
→ Step 3 (Department) → Step 4 (Division) → Step 5 (Staff) 
→ Step 6 (Date/Time) → Step 7 (Message) → Submit → Success
```

---

### Staff Dashboard

Accessible at `/staff/dashboard` for authenticated users with the Staff or Admin role.

#### Features

**1. Dashboard Overview**
- Staff profile card showing name, department, division
- Stats dashboard: Pending count, Total appointments, Accept rate
- Today's date and greeting

**2. Appointment List View**
- Displays all appointments assigned to the logged-in staff member
- Auto-refreshes every 8 seconds to show new appointments
- Tabbed interface: Pending, Accepted, Declined, All
- Shows appointment status with color-coded badges:
  - **Pending** (yellow) - Awaiting response
  - **Accepted** (green) - Confirmed
  - **Rescheduled** (blue) - Date changed
  - **Declined** (red) - Rejected

**3. Search & Filter**
- Search bar to find appointments by:
  - Visitor name
  - Visitor email
  - Service name
- Real-time filtering as you type
- Combined with status tab filters

**4. Appointment Card Information**
- Visitor's name and initials (avatar)
- Visitor's email
- Requested appointment date/time
- Visitor's message
- Status badge
- Overdue indicator for pending appointments >24h

**5. Response Actions (for Pending Appointments)**
- **Accept**: Approves the appointment request
- **Reschedule**: Opens response area for date changes
- **Decline**: Rejects the appointment request
- Response note textarea for adding context to the response
- Email notification sent to visitor on action

**6. Staff Availability Status**
- Toggle between Available / Busy status
- Visible in topbar for quick reference
- API integration to update status in real-time
- Helps visitors know staff availability

**7. Session Management**
- 30-minute session timeout
- 2-minute warning modal before expiration
- "Extend Session" button to continue working
- "Log Out" button to end session
- Activity tracking (mouse, keyboard, scroll, touch)
- Automatic logout when session expires

**8. Export to CSV**
- Export appointments to CSV file
- Includes: ID, Visitor Name, Email, Service, Date, Time, Status, Notes
- Filters apply to export (current tab + search)
- Auto-named with current date

**9. Real-time Updates**
- Firebase push notification support
- Toast notifications for new updates
- Automatic refresh on notification receipt
- Unread notification indicator in sidebar

**10. Response Loop Feature**
- Toggle to enable visual response loop
- Cycles between visual state and response details
- Provides visual feedback on submitted responses

#### User Flow

```
Login → Dashboard → View Appointments → Select Action 
→ Add Response Note → Confirm → Email Sent to Visitor → Status Updated
```

#### Session Timeout Flow

```
Active Use → 30 min inactivity → Warning Modal (2 min left) 
→ Extend Session OR Log Out → Continue OR Session Ends
```

---

### Admin Dashboard

Accessible at `/admin/dashboard` for authenticated users with the Admin role. This is the most comprehensive dashboard for managing the entire appointment system.

#### Features

**1. Department Management**

| Action | Description |
|--------|-------------|
| Create | Add new departments with a name |
| Read | View list of all departments |
| Update | Edit department name inline |
| Delete | Remove departments with confirmation |

- Department creation form at the top of the dashboard
- Inline editing by clicking Edit button
- Delete confirmation modal to prevent accidental deletion

**2. Division Management**

| Action | Description |
|--------|-------------|
| Create | Add divisions linked to departments |
| Read | View all divisions with their parent department |
| Update | Edit division name and parent department |
| Delete | Remove divisions with confirmation |

- Division creation form requiring:
  - Division name
  - Parent department selection
- Displays division name and associated department
- Inline editing with department reassignment

**3. Staff Management**

The staff management section provides comprehensive user account controls:

| Action | Description |
|--------|-------------|
| Create | Register new staff via signup page |
| Read | View all staff members with details |
| Update | Edit staff profile, role, department, division |
| Activate/Deactivate | Toggle account active status |
| Delete | Permanently remove staff account |

**Staff List Display:**
- Staff member's full name and email
- Assigned department and division
- Account status (Active/Inactive)
- Role (Staff or Admin)

**Staff Editing Capabilities:**
- Change full name
- Change role (Staff/Admin)
- Assign/change department
- Assign/change division
- Toggle active status

**Staff Account Actions:**
- **Edit**: Modify staff member details
- **Activate**: Enable login access for deactivated accounts
- **Deactivate**: Disable login access while preserving account
- **Delete**: Permanently remove staff account

**4. Real-time Data Refresh**
- Auto-refreshes every 10 seconds
- Ensures admin sees latest organizational changes

**5. Confirmation Modals**
- All destructive actions require confirmation
- Different modal tones:
  - Default (blue) for standard confirmations
  - Danger (red) for destructive actions (delete, deactivate)

**6. Navigation**
- Header with logout button
- Subtitle explaining dashboard purpose

#### Admin Dashboard Sections (Top to Bottom)

1. **Header**: Admin Dashboard title with logout button
2. **Add Department Form**: Create new departments
3. **Add Division Form**: Create divisions linked to departments
4. **Departments List**: View, edit, delete departments
5. **Divisions List**: View, edit, delete divisions
6. **Staff List**: View, edit, activate/deactivate, delete staff

#### User Flow

```
Admin Login → Dashboard → Manage Departments 
→ Manage Divisions → Manage Staff → Logout
```

#### Security Considerations

- Admin dashboard only accessible to users with `role='Admin'`
- Protected route checks user role before rendering
- Deactivated staff cannot log in even with valid credentials
- All delete operations require explicit confirmation

---

### Admin Dashboard - Extended Features

The admin dashboard includes additional features for comprehensive system management:

#### 7. Notifications System

| Component | Description |
|-----------|-------------|
| Bell Icon | Shows notification count badge in header |
| Dropdown Panel | Quick view of recent notifications |
| Full Notifications Page | Complete notification history with filters |
| Mark as Read | Click to mark individual notifications as read |
| Mark All Read | Bulk action to clear unread count |
| Notification Types | Appointment created, status updates, staff actions |

**Notification Bell Features:**
- Red badge showing unread count
- Dropdown preview of 5 most recent notifications
- Click to navigate to full notifications page
- Visual indicators for read/unread status

**Notifications Page Features:**
- Filter by: All, Unread, Appointment, Staff
- Chronological list with timestamps
- Click to view full notification details
- "Mark all as read" button

#### 8. Analytics Panel

The admin dashboard includes an analytics section showing key metrics:

| Metric | Description |
|--------|-------------|
| Total Appointments | All appointments in the system |
| Pending | Appointments awaiting staff response |
| Accepted | Successfully booked appointments |
| Declined | Rejected appointments |
| This Month | Appointments from current month |
| Staff Count | Total active staff members |

**Analytics Cards:**
- Visual cards with icons for each metric
- Color-coded status indicators
- Real-time updates when data changes

#### 9. Appointment Management & Reassignment

Admin has full visibility and control over all appointments:

| Feature | Description |
|---------|-------------|
| Global View | See all appointments across all staff |
| Filter by Status | View Pending, Accepted, Declined, or All |
| Search | Search by visitor name or email |
| Reassign | Transfer appointments between staff members |
| View Details | See full appointment information |

**Reassignment Workflow:**
1. Click on an appointment to view details
2. Click "Reassign" button
3. Select new staff member from dropdown
4. Confirm reassignment
5. Visitor and new staff receive notifications

**Staff Dropdown:**
- Shows only active staff members
- Groups by department/division
- Searchable list for large organizations

#### 10. Admin-Controlled Staff Creation

Security enhancement - only admins can create staff accounts:

| Feature | Description |
|---------|-------------|
| Admin-Only Creation | Staff cannot self-register |
| Create Form | Admin fills in all staff details |
| Temporary Password | System generates or admin sets password |
| Email Invitation | Staff receives login credentials via email |
| Role Assignment | Assign Staff or Admin role during creation |

**Staff Creation Form Fields:**
- Full Name (required)
- Email (required, must be unique)
- Department (required)
- Division (required)
- Role (Staff/Admin, required)
- Initial Password (admin-set or auto-generated)

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/staff/login/` | Staff login (returns JWT tokens) |
| POST | `/api/staff/register/` | Staff self-registration (Admin only) |
| POST | `/api/staff/token/refresh/` | Refresh access token |
| GET | `/api/staff/me/` | Get current staff profile |
| PATCH | `/api/staff/me/` | Update current staff profile (including availability status) |
| PUT | `/api/staff/me/fcm-token/` | Update user's FCM token |
| POST | `/api/staff/create/` | Admin-only staff account creation |
| POST | `/api/staff/{id}/reset-password/` | Admin password reset for staff |
| PATCH | `/api/staff/{id}/activate/` | Activate staff account |

### Staff

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/staff/` | List staff members |
| GET | `/api/staff/?department_id={id}` | Filter staff by department |
| GET | `/api/staff/?division_id={id}` | Filter staff by division |
| GET | `/api/staff/?include_inactive=1` | Include inactive staff |
| GET | `/api/staff/{id}/` | Get staff member details |
| PATCH | `/api/staff/{id}/` | Update staff member |
| PATCH | `/api/staff/{id}/deactivate/` | Deactivate staff account |
| PATCH | `/api/staff/{id}/activate/` | Activate staff account |
| DELETE | `/api/staff/{id}/` | Delete staff account |

### Departments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments/` | List all departments |
| POST | `/api/departments/` | Create new department |
| GET | `/api/departments/{id}/` | Get department details |
| PATCH | `/api/departments/{id}/` | Update department |
| DELETE | `/api/departments/{id}/` | Delete department |

### Divisions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/divisions/` | List all divisions |
| POST | `/api/divisions/` | Create new division |
| GET | `/api/divisions/?department_id={id}` | Filter divisions by department |
| PATCH | `/api/divisions/{id}/` | Update division |
| DELETE | `/api/divisions/{id}/` | Delete division |

### Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/appointments/create/` | Create new appointment |
| GET | `/api/appointments/my/` | Get staff's appointments |
| GET | `/api/appointments/all/` | Admin: Get all appointments |
| PUT | `/api/appointments/update/{id}/` | Update appointment status |
| PATCH | `/api/appointments/reassign/{id}/` | Reassign appointment to different staff |
| DELETE | `/api/appointments/{id}/` | Delete appointment |

---

## Authentication & Authorization

### JWT Authentication

The system uses JSON Web Tokens for authentication:

- **Access Token**: Short-lived token for API requests
- **Refresh Token**: Longer-lived token for obtaining new access tokens
- Tokens stored in localStorage on the frontend

### Role-based Access Control

| Role | Access Level |
|------|--------------|
| Visitor | Home page only, no authentication required |
| Staff | Staff dashboard, manage own appointments |
| Admin | Admin dashboard, full system management |

### Protected Routes

```javascript
// Staff routes - accessible by Staff and Admin
<ProtectedRoute roles={['Staff', 'Admin']}>
  <StaffDashboardPage />
</ProtectedRoute>

// Admin routes - accessible only by Admin
<ProtectedRoute roles={['Admin']} loginPath="/admin/login">
  <AdminDashboardPage />
</ProtectedRoute>
```

---

## Notifications

### Email Notifications (EmailJS)

**Appointment Request Email**
- Sent to staff when visitor submits appointment request
- Contains: visitor name, email, department, division, requested date, message

**Appointment Response Email**
- Sent to visitor when staff responds to appointment
- Contains: staff response (Accepted/Rescheduled/Declined), response note

### Push Notifications (Firebase Cloud Messaging)

- Staff can register device tokens for push notifications
- Admin panel includes FCM token update functionality
- Real-time updates when new appointments arrive
- Service worker handles background push events

---

## Project Structure

```
smart-appointment-booking-system/
├── backend/
│   ├── config/              # Django project settings
│   ├── appointments/        # Appointment models, views, serializers
│   ├── departments/         # Department and Division models
│   ├── users/               # Custom User model and authentication
│   ├── notifications/       # Email and push notification services
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   ├── icons/           # PWA icons
│   │   ├── images/         # Static images
│   │   ├── sounds/         # Notification sounds
│   │   ├── manifest.json   # PWA manifest
│   │   └── sw.js          # Service worker
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── context/        # React Context (Auth, Appointments, Notifications)
│   │   ├── pages/          # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── StaffLoginPage.jsx
│   │   │   ├── StaffDashboardPage.jsx
│   │   │   ├── AdminLoginPage.jsx
│   │   │   ├── AdminSignupPage.jsx
│   │   │   └── AdminDashboardPage.jsx
│   │   ├── services/       # API, EmailJS, Firebase services
│   │   ├── styles.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── README.md
└── .gitignore
```

---

## Backend Setup

### 1. Create Virtual Environment

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=appointment_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Email (EmailJS)
EMAIL_HOST_USER=your-emailjs-service-id
EMAIL_HOST_PASSWORD=your-emailjs-public-key
DEFAULT_FROM_EMAIL=noreply@example.com

# Firebase
FIREBASE_SERVER_KEY=your-firebase-server-key
```

### 4. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser

```bash
python manage.py createsuperuser
```

### 6. Run Development Server

```bash
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_VAPID_KEY=your-vapid-key
```

### 3. Run Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

## Environment Variables Reference

### Backend

| Variable | Description |
|----------|-------------|
| `DJANGO_SECRET_KEY` | Django secret key for cryptographic signing |
| `DJANGO_DEBUG` | Enable debug mode (True/False) |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed hostnames |
| `DB_ENGINE` | Database engine (postgresql) |
| `DB_NAME` | Database name |
| `DB_USER` | Database username |
| `DB_PASSWORD` | Database password |
| `DB_HOST` | Database host |
| `DB_PORT` | Database port |
| `EMAIL_HOST_USER` | EmailJS Service ID |
| `EMAIL_HOST_PASSWORD` | EmailJS Public Key |
| `DEFAULT_FROM_EMAIL` | Default sender email address |
| `FIREBASE_SERVER_KEY` | Firebase Cloud Messaging server key |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_VAPID_KEY` | Firebase VAPID key for push notifications |

---

## Production Considerations

### Security

1. **CORS**: Lock CORS to known frontend origins in production
2. **HTTPS**: Enable HTTPS for secure communication
3. **Environment Variables**: Use secure environment variable management
4. **Token Expiry**: Adjust JWT token expiry times for production
5. **Admin Access**: Restrict admin dashboard access to trusted users

### PWA Optimization

1. **Icons**: Add proper PWA icons in `frontend/public/icons/`
2. **Service Worker**: Update caching strategies for production
3. **Manifest**: Customize app name, theme color, and icons

### Push Notifications

1. **FCM Migration**: Migrate from legacy FCM to HTTP v1 API
2. **Service Account**: Use Firebase service account for authentication
3. **Token Management**: Implement proper token refresh handling

### Performance

1. **Database Indexing**: Add indexes on frequently queried fields
2. **Caching**: Implement Redis or similar for API response caching
3. **Static Files**: Use CDN for static file delivery
4. **Pagination**: Add pagination to list endpoints

---

## License

This project is available for personal and commercial use.

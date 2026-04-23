# Smart Campus Operations Hub

**IT3030 – Programming Applications and Frameworks | Assignment 2026 (Semester 1)**  
**Group 105 (WE 4.1) | SLIIT Faculty of Computing**

A production-inspired web platform for managing university facility bookings and maintenance incident handling. Built with Spring Boot REST API and React.

---

## Team & Module Allocation

| Member | Module | Responsibility |
|---|---|---|
| Member 1 | Module A | Facilities & Assets Catalogue — resource CRUD, search, filtering |
| Member 2 | Module B | Booking Management — workflow, conflict checking, approval/rejection |
| Member 3 | Module C | Incident Ticketing — tickets, attachments, technician assignment, comments |
| Member 4 | Module D & E | Notifications + Auth — OAuth 2.0, JWT, role management, notification panel |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 3.x, Spring Security, JWT |
| Database | MongoDB (NoSQL) |
| Frontend | React 18, React Router v6, Axios, TailwindCSS |
| Auth | JWT (local) + OAuth 2.0 (Google Sign-In) |
| Testing | JUnit 5 + Mockito (backend), Cypress (frontend E2E) |
| CI/CD | GitHub Actions |

---

## Prerequisites

- Java 17+
- Node.js 18+
- MongoDB (local or Atlas)
- Maven (or use the included `mvnw` wrapper)

---

## Setup & Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/SLIIT-Group4/it3030-paf-2026-smart-campus-group4.git
cd it3030-paf-2026-smart-campus-group4
```

### 2. Configure the backend

Edit `backend/src/main/resources/application.properties`:

```properties
spring.data.mongodb.uri=mongodb://localhost:27017/smartcampus
jwt.secret=your-secret-key-here
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
```

### 3. Run the backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend runs on **http://localhost:8081**

### 4. Run the frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on **http://localhost:3000**

---

## REST API Endpoints

### Module A — Resources (Member 1)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/resources` | Public | List all resources (filterable by type, brand, location, status, capacity) |
| GET | `/api/resources/{id}` | Public | Get resource by ID |
| GET | `/api/resources/types` | Public | List all resource types |
| POST | `/api/resources` | ADMIN | Create new resource |
| PUT | `/api/resources/{id}` | ADMIN | Update resource |
| PATCH | `/api/resources/{id}/status` | ADMIN | Toggle ACTIVE / OUT_OF_SERVICE |
| DELETE | `/api/resources/{id}` | ADMIN | Delete resource |

### Module B — Bookings (Member 2)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/bookings/my` | USER | Get own bookings |
| GET | `/api/bookings` | ADMIN | Get all bookings (filterable) |
| GET | `/api/bookings/availability` | USER | Check slot availability |
| POST | `/api/bookings` | USER | Create booking request |
| PUT | `/api/bookings/{id}/reschedule` | USER | Reschedule booking |
| PATCH | `/api/bookings/{id}/cancel` | USER | Cancel booking |
| PATCH | `/api/bookings/{id}/approve` | ADMIN | Approve booking |
| PATCH | `/api/bookings/{id}/reject` | ADMIN | Reject booking with reason |

### Module C — Incidents (Member 3)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/incidents` | USER | Get visible incidents |
| GET | `/api/incidents/{id}` | USER | Get incident by ID |
| GET | `/api/incidents/assignees` | ADMIN/STAFF | Get assignable users |
| POST | `/api/incidents` | USER | Create incident ticket (with attachments) |
| PATCH | `/api/incidents/{id}/assign` | ADMIN/STAFF | Assign technician |
| PATCH | `/api/incidents/{id}/status` | USER/STAFF | Update ticket status |
| POST | `/api/incidents/{id}/comments` | USER | Add comment |
| PUT | `/api/incidents/{id}/comments/{cid}` | USER | Edit own comment |
| DELETE | `/api/incidents/{id}/comments/{cid}` | USER | Delete own comment |

### Module D & E — Notifications & Auth (Member 4)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login with email/password |
| GET | `/api/users/me` | USER | Get own profile |
| PUT | `/api/users/me` | USER | Update own profile |
| GET | `/api/users` | ADMIN | List all users |
| PUT | `/api/users/{id}/roles` | ADMIN | Update user roles |
| DELETE | `/api/users/{id}` | ADMIN | Delete user |
| POST | `/api/admin/create` | ADMIN | Create admin account |
| GET | `/api/notifications` | USER | Get notifications |
| GET | `/api/notifications/count` | USER | Get unread count |
| PATCH | `/api/notifications/{id}/read` | USER | Mark as read |
| PATCH | `/api/notifications/read-all` | USER | Mark all as read |
| DELETE | `/api/notifications/{id}` | USER | Delete notification |

---

## User Roles

| Role | Access |
|---|---|
| `ROLE_USER` | Browse resources, create bookings, create incidents, view own data |
| `ROLE_ADMIN` | Full system access — approve/reject bookings, manage resources, manage users |
| `ROLE_STAFF` | Manage incidents, assign technicians |
| `ROLE_TECHNICIAN` | Update assigned incident status and add resolution notes |

---

## Running Tests

### Backend (JUnit)

```bash
cd backend
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"   # Windows only if JAVA_HOME not set
./mvnw test
```

Expected: **67 tests, 0 failures**

### Frontend (Cypress E2E)

```bash
cd frontend
npm install
npm run cypress:open    # interactive mode
# or
npm run cypress:run     # headless mode
```

> Requires the React dev server to be running (`npm start`) before launching Cypress.

---

## GitHub Actions CI

The repository includes a GitHub Actions workflow (`.github/workflows/`) that:
- Builds the Spring Boot backend
- Runs all JUnit tests
- Reports build status on every push and pull request

---

## Key Features

- **Resource Catalogue** — browse, search and filter campus facilities and equipment
- **Booking Workflow** — PENDING → APPROVED/REJECTED → CANCELLED with conflict detection
- **Incident Ticketing** — OPEN → IN_PROGRESS → RESOLVED → CLOSED with image attachments
- **Role-Based Access Control** — JWT + Spring Security with 4 roles
- **OAuth 2.0** — Google Sign-In integration
- **Real-time Notifications** — booking and ticket status updates via notification panel
- **Admin Dashboard** — resource management, booking approval, user role management

---

## Project Structure

```
├── backend/                    # Spring Boot REST API
│   ├── src/main/java/
│   │   └── com/sliit/paf/backend/
│   │       ├── controllers/    # REST controllers
│   │       ├── services/       # Business logic
│   │       ├── repository/     # MongoDB repositories
│   │       ├── models/         # Domain entities
│   │       ├── dto/            # Data transfer objects
│   │       ├── config/         # Security, JWT config
│   │       └── exception/      # Global error handling
│   └── src/test/               # JUnit unit tests
│
├── frontend/                   # React web application
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable UI components
│   │   ├── api/                # Axios API calls
│   │   ├── context/            # Auth context
│   │   ├── hooks/              # Custom hooks
│   │   └── routes/             # Protected route wrappers
│   └── cypress/                # Cypress E2E tests
│
└── README.md
```

---

## Default Admin Account

```
Email:    admin@smartcampus.com
Password: admin123
```

> Change this immediately in production.

---

*IT3030 PAF Assignment 2026 — SLIIT Faculty of Computing*

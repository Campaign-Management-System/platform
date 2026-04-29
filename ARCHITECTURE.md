# 🧱 System Architecture

## 🎯 Purpose

This document defines the architectural structure of the system, including:
- Separation of concerns
- Layer responsibilities
- Folder structure
- Communication flow between frontend and backend

The system follows **Clean Architecture principles** to ensure scalability, maintainability, and clear boundaries between components.

---

## 🧩 High-Level Architecture

The system is divided into two main parts:


Frontend (BASE44) ←→ Backend (FastAPI API) ←→ Database (PostgreSQL)


- The **frontend** is responsible for UI and user interaction
- The **backend** handles business logic, authentication, and data access
- The **database** stores persistent data (users, campaigns, etc.)

---

## ⚙️ Backend Architecture (Clean Architecture)

The backend is structured into clear layers:


api → services → repositories → database
↓
schemas


### 🔹 1. API Layer (`api/`)
**Responsibility:**
- Define HTTP endpoints
- Handle request/response
- Use dependency injection
- Call service layer only

**Rules:**
- ❌ No business logic
- ❌ No direct DB access

---

### 🔹 2. Service Layer (`services/`)
**Responsibility:**
- Core business logic
- Validation beyond schema level
- Orchestrating operations

**Examples:**
- Register user
- Login + JWT creation
- Campaign creation rules

**Rules:**
- ❌ No HTTP logic
- ❌ No direct DB queries

---

### 🔹 3. Repository Layer (`repositories/`)
**Responsibility:**
- Database interaction
- CRUD operations

**Examples:**
- get_user_by_email
- create_campaign
- get_campaign_by_id

**Rules:**
- ❌ No business logic
- Only data access

---

### 🔹 4. Models (`models/`)
**Responsibility:**
- SQLAlchemy ORM models
- Map Python objects to DB tables

---

### 🔹 5. Schemas (`schemas/`)
**Responsibility:**
- Request validation (input)
- Response shaping (output)

**Rules:**
- Never expose sensitive fields (e.g. hashed_password)

---

### 🔹 6. Core (`core/`)
**Responsibility:**
- Cross-cutting concerns:
  - Security (JWT, hashing)
  - Dependencies (get_db, get_current_user)
  - Configuration (.env)

---

## 📁 Backend Folder Structure


backend/app/

├── api/ # Routes (controllers)
├── core/ # Security, config, dependencies
├── models/ # ORM models
├── repositories/ # Data access layer
├── services/ # Business logic
├── schemas/ # Validation schemas
├── main.py # Entry point


---

## 🎨 Frontend Architecture (BASE44)

The frontend is structured around UI components and pages.

### Responsibilities:
- Display campaigns
- Navigate between pages
- Call backend APIs
- Handle user interactions

### Structure (conceptual):


frontend/

├── pages/ # Page-level components
├── components/ # Reusable UI components
├── services/ # API calls to backend


---

## 🔗 Frontend ↔ Backend Communication

### Communication Type:
- REST API over HTTP
- JSON-based requests/responses

---

### 📦 Campaign Flow (Example)

1. Frontend requests all campaigns:

GET /campaigns


2. Backend:
- API → Service → Repository → DB
- Returns list of campaigns

---

### 🔗 Hyperlink Navigation (Critical Requirement)

Each campaign must support a **unique route**:


/campaigns/{id}


#### Flow:
1. User clicks a campaign in the UI
2. Frontend navigates to `/campaigns/{id}`
3. Frontend sends:

GET /campaigns/{id}

4. Backend returns campaign details

---

## 🔐 Authentication Flow

1. User logs in:

POST /auth/login


2. Backend returns JWT token

3. Frontend stores token

4. For protected routes:

Authorization: Bearer <token>


5. Backend:
- Decodes token
- Extracts user (via `sub`)
- Injects `current_user`

---

## 🚧 Layer Separation Rules (Critical)

### ✅ Allowed Flow:

API → Service → Repository → DB


### ❌ Forbidden:
- API → DB directly
- Service → HTTP layer
- Repository → business logic

---

## 🧠 Design Principles

- Single Responsibility per layer
- Dependency Injection (FastAPI Depends)
- Stateless backend (JWT-based auth)
- Clear contract between frontend and backend
- Scalable and testable structure

---

## 🚀 Future Extensions (Architecture Ready)

- Role-based authorization (RBAC)
- Middleware (logging, rate limiting)
- Background tasks (e.g. campaign scheduling)
- Microservices separation (if needed)

---

## ⚠️ Notes for AI / Cursor

- Always respect layer boundaries
- Never mix responsibilities
- Prefer adding new services over modifying API logic
- Keep code modular and reusable
- Follow existing patterns in the project
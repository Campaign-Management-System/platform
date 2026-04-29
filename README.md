
# 📊 Campaign Management System

## 🎯 Project Overview

The Campaign Management System is a full-stack application designed to manage and display campaigns for schools in an organized, scalable, and user-friendly way.

The system solves the problem of:
- Managing multiple campaigns with structured data
- Presenting campaigns dynamically in the frontend
- Allowing users to view detailed information per campaign
- Enabling future expansion (authentication, permissions, analytics)

---

## 🚀 Core Features

### 🔐 Authentication (Backend)
- User registration
- Secure login with hashed passwords
- JWT-based authentication
- Protected routes (in progress)

### 📦 Campaign Management
- Store campaigns in the backend database
- Each campaign includes:
  - Title / Name
  - Description
  - Dates / validity
  - Additional metadata

### 🔗 Dynamic Routing (Frontend ↔ Backend)
- Each campaign has a **unique link (hyperlink)**
- Clicking a campaign navigates to a **dedicated page**
- Backend must support:
  - Fetching all campaigns
  - Fetching a single campaign by ID

Example:

/campaigns → list of campaigns
/campaigns/{id} → specific campaign details


---

## 🖥️ Frontend

- Built using **BASE44**
- Focus on UI/UX and dynamic rendering
- Communicates with backend via API
- Displays:
  - Campaign list
  - Campaign details page (via hyperlink navigation)

---

## ⚙️ Backend

Built with:
- **FastAPI**
- **PostgreSQL**
- **SQLAlchemy**
- **Pydantic v2**
- **JWT Authentication**
- **Clean Architecture**

### Architecture Layers:
- `api/` → routes (controllers)
- `services/` → business logic
- `repositories/` → database access
- `models/` → ORM models
- `schemas/` → request/response validation
- `core/` → security, config, dependencies

---

## 🧱 Project Structure


backend/
│
├── app/
│ ├── api/ # FastAPI routes
│ ├── core/ # security, config, dependencies
│ ├── models/ # SQLAlchemy models
│ ├── repositories/ # DB access layer
│ ├── services/ # business logic
│ ├── schemas/ # Pydantic schemas
│ └── main.py # app entry point
│
├── .env # environment variables
├── requirements.txt

frontend/
│
├── BASE44 project files
├── components/
├── pages/
└── services/ (API calls)


---

## ▶️ Getting Started

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
2. Environment Variables

Create .env file:

DATABASE_URL=postgresql://user:password@localhost/db_name
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
3. Run Server
uvicorn app.main:app --reload

Swagger UI:

http://127.0.0.1:8000/docs
🔄 API Overview
Auth
POST /auth/register
POST /auth/login
Users
GET /users/me (protected)
Campaigns (planned)
GET /campaigns
GET /campaigns/{id}
POST /campaigns
PUT /campaigns/{id}
DELETE /campaigns/{id}
🔮 Future Enhancements
Role-based authorization (Admin/User)
Campaign analytics
Image uploads
Scheduling campaigns
Dashboard metrics
🧠 Notes for AI / Cursor
Follow Clean Architecture strictly
Never mix business logic inside routes
Always validate using schemas
Keep responses secure (no sensitive fields)
Maintain separation between frontend expectations and backend implementation

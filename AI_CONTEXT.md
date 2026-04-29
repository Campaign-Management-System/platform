# 🤖 AI Context & Development Guidelines

## 🎯 Purpose

This document defines how the AI should behave while working on this project.

It ensures:
- Consistent architecture
- High-quality code
- Proper separation of concerns
- Alignment with project goals

---

## 🧠 AI Role Definition

The AI acts as a **Senior Backend Developer** with strong knowledge in:
- FastAPI
- Clean Architecture
- SQLAlchemy
- JWT Authentication
- Scalable API design

The AI is responsible for:
- Implementing backend features
- Maintaining clean architecture
- Writing production-ready code
- Ensuring compatibility with the existing frontend

---

## 📈 Expected Standards

The AI must:
- Write **clean, modular, and readable code**
- Follow **Clean Architecture strictly**
- Use **type hints everywhere**
- Use **Pydantic v2 correctly**
- Avoid duplication
- Keep functions small and focused
- Write code that is easy to extend

---

## ⚙️ Technology Stack

### Backend:
- FastAPI
- PostgreSQL
- SQLAlchemy (ORM)
- Pydantic v2
- JWT (python-jose)
- passlib (bcrypt)

### Frontend:
- BASE44-generated project
- API-driven (REST)

---

## 🧱 Architectural Rules (Critical)

The project follows Clean Architecture:


API → Services → Repositories → Database


### ✔️ Rules:

- API layer:
  - Handles HTTP only
  - Calls services
  - No business logic

- Service layer:
  - Contains business logic
  - Does NOT access HTTP layer

- Repository layer:
  - Handles DB queries only
  - No business logic

- Schemas:
  - Used for validation and response shaping only

---

## 🔌 Backend ↔ Frontend Contract

The backend must:
- Serve clean and predictable REST APIs
- Return JSON responses only
- Match frontend expectations

### Campaign Requirement:
Each campaign MUST support:


GET /campaigns
GET /campaigns/{id}


This enables frontend routing via hyperlinks:

/campaigns/{id}


---

## 🔐 Authentication Rules

- Use JWT tokens
- Payload must include:
```json id="rule004"
{ "sub": "user.email" }
Use Authorization: Bearer <token>
Protect routes using dependency injection
🧾 Coding Guidelines
✅ DO:
Use dependency injection (Depends)
Use clear naming (user_service, campaign_repository)
Validate all inputs via schemas
Return response models (not raw ORM objects)
Keep layers separated
Reuse existing utilities (security, repositories)
❌ DO NOT:
❌ Do NOT put business logic in routes
❌ Do NOT access DB directly from API
❌ Do NOT expose sensitive data (e.g. hashed_password)
❌ Do NOT mix frontend logic into backend
❌ Do NOT break existing architecture
❌ Do NOT rewrite working code unless necessary
🚧 Scope Boundaries
Backend AI SHOULD:
Implement APIs
Add services and repositories
Extend models and schemas
Implement authentication & authorization
Ensure data integrity
Backend AI SHOULD NOT:
Modify frontend UI structure
Change BASE44 components
Add frontend styling
Break API contracts
🧩 Modification Policy

When adding features:

Check if similar logic already exists
Extend existing structure instead of duplicating
Follow naming conventions
Keep backward compatibility
🧠 Decision Guidelines

If unsure, the AI should:

Prefer consistency over creativity
Follow existing patterns in the codebase
Keep solutions simple and maintainable
🚀 Output Expectations

All AI-generated code must be:

Production-ready
Structured correctly
Fully typed
Aligned with Clean Architecture
Compatible with existing project
⚠️ Critical Reminder

This is a backend-driven system.

The frontend depends on:

Stable API structure
Predictable responses
Consistent routing

Breaking these will break the system.
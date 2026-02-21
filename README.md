# Project Management System

A full-stack Project Management System developed as part of an internship evaluation task simulating an enterprise software rebuild initiative. The application demonstrates structured backend architecture, role-based access control (RBAC), secure authentication, modular services, and AI-powered task assistance.

---

## Overview

This system allows teams to manage projects and tasks securely with proper server-side enforcement.

The application demonstrates:

- Modular backend architecture
- JWT-based authentication
- Role-Based Access Control (Admin and Member)
- Project and Task management (CRUD)
- AI-powered task suggestions
- Production-ready frontend structure
- Deployment on Render and Vercel

---

## Authentication

JWT-based authentication is implemented with bcrypt password hashing and middleware-based token verification. All protected routes require a valid `Authorization: Bearer <token>` header. Authentication is enforced at the backend.

---

## Role-Based Access Control (RBAC)

Two roles are supported: **Admin** and **Member**.

- **Admin**: Full project, task, and user management access.
- **Member**: Can view assigned projects and create/update tasks within permitted scope.

All role restrictions are enforced at the server level via middleware validation.

---

## Project Module

Each project includes:

- Title
- Description
- CreatedBy
- AssignedMembers
- Status (Active / Completed)
- CreatedAt

Full CRUD operations are available to Admin users.

---

## Task Module

Each task includes:

- Title
- Description
- Priority (Low / Medium / High)
- Status (Todo / InProgress / Done)
- AssignedTo
- DueDate

Members can create tasks within assigned projects.  
All permissions are validated at the backend.

---

## AI Integration

- AI-powered task suggestions
- Project analysis functionality
- Modular AI service layer
- Easily replaceable AI provider

---

## Tech Stack

### Frontend
- React (Vite)
- TypeScript
- TailwindCSS
- React Router DOM
- Axios (with interceptor)

### Backend
- Node.js
- Express 5
- TypeScript
- MongoDB (Atlas)
- Mongoose
- JWT
- bcryptjs
- Google GenAI
- dotenv

---

## Architecture

### Backend Structure

```
backend/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── server.ts
└── tsconfig.json
```

- Controllers handle request logic
- Middleware enforces JWT and RBAC
- Services contain business logic (AI integration)
- Routes define REST API endpoints
- Models define MongoDB schemas

---

### Frontend Structure

```
frontend/
└── src/
    ├── components/
    ├── context/
    ├── hooks/
    ├── pages/
    ├── services/
    ├── App.tsx
    └── main.tsx
```

- Context manages authentication state
- Services handle API communication
- Pages represent route-level components
- Components are reusable UI elements

---

## Environment Variables

### Backend (.env)

Create a `.env` file inside the `backend/` directory:

```
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_secure_secret
PORT=5000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure_password
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend (.env)

For local development:

```
VITE_API_URL=http://localhost:5000/api
```

For production deployment:

```
VITE_API_URL=https://projectmanagement-2-7pb6.onrender.com/api
```

Do not commit `.env` files to version control.

---

## Local Development Setup

### Clone Repository

```
git clone https://github.com/suryakamal03/ProjectManagement.git
cd ProjectManagement
```

---

### Backend Setup

```
cd backend
npm install

For development:
npm run dev

For production build:
npm run build
npm run start
```

Backend runs at:

```
http://localhost:5000
```

---

### Frontend Setup

```
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

## API Endpoints

### Authentication
- POST `/api/user/register`
- POST `/api/user/login`
- GET `/api/user/me`

### Projects
- GET `/api/project`
- GET `/api/project/:id`
- POST `/api/project` (Admin Only)
- PUT `/api/project/:id` (Admin Only)
- DELETE `/api/project/:id` (Admin Only)

### Tasks
- GET `/api/project/:projectId/tasks`
- GET `/api/project/tasks/:id`
- POST `/api/project/:projectId/tasks` (Admin and Assigned Members)
- PUT `/api/project/tasks/:id`
- DELETE `/api/project/tasks/:id` (Admin Only)

### AI
- POST `/api/ai/suggest`
- POST `/api/ai/analyze`

---

## Deployment

Frontend (Vercel):  
https://project-management-ruby-five.vercel.app

Backend (Render):  
https://projectmanagement-2-7pb6.onrender.com/api

---

## Security Practices

- Password hashing using bcrypt
- JWT-based authentication
- Server-level RBAC enforcement
- Protected API routes
- Environment variable configuration
- No hardcoded secrets
- Input validation

---

## Evaluation Highlights

This project demonstrates:

- Proper separation of concerns
- Clean modular architecture
- Server-side RBAC enforcement
- Secure authentication flow
- Scalable service layer
- Production deployment setup
- Clear documentation

---

## License

Developed for internship evaluation purposes.

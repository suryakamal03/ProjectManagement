# Project Management System

A full-stack project management application built with React, TypeScript, Node.js, Express, and MongoDB. This system features role-based access control (RBAC), AI-powered task assistance, and a modern responsive UI.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization**: Secure JWT-based authentication with role-based access control
- **Role-Based Access Control (RBAC)**: Two user roles (Admin & Member) with different permission levels
- **Project Management**: Create, update, delete, and manage projects
- **Task Management**: Comprehensive task tracking with status updates and assignments
- **AI Integration**: AI-powered task suggestions and project assistance using Google GenAI
- **Responsive Dashboard**: Modern, intuitive dashboard with statistics and overview cards

### User Roles
- **Admin**: Full access to all features, user management, project/task CRUD operations
- **Member**: Limited access - can view projects/tasks and update assigned tasks

### Security Features
- Password encryption using bcrypt
- JWT token-based authentication
- Protected API routes with middleware validation
- CORS configuration for secure cross-origin requests
- Input validation and sanitization

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **TailwindCSS 4** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client with interceptors
- **html2pdf.js** - PDF generation

### Backend
- **Node.js** - Runtime environment
- **Express 5** - Web application framework
- **TypeScript** - Type-safe backend
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Redis** - Caching and session management
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Google GenAI** - AI integration
- **dotenv** - Environment variable management

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18.x or higher)
- **npm** or **yarn**
- **MongoDB** (v6.x or higher) - Local installation or MongoDB Atlas account
- **Redis** (Optional, for caching features)
- **Git**

## ⚙️ Environment Variables

### Backend (.env)

Create a `.env` file in the `backend` directory with the following variables:

```env
MONGODB_URL=your mongodb url
JWT_SECRET=your jwt secret key
PORT=5000
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
GEMINI_API_KEY=gemini api key
```

### Frontend (.env)

Create a `.env` file in the `frontend` directory:

```env
# API URL
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/suryakamal03/ProjectManagement.git
cd ProjectManagement
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file and add environment variables
# (See Environment Variables section above)

# Run development server
npm run dev

# Or build and run production server
npm run build
npm start
```

The backend server will start on `http://localhost:5000`

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create .env file and add environment variables
# (See Environment Variables section above)

# Run development server
npm run dev

# Or build for production
npm run build
npm run preview
```

The frontend application will start on `http://localhost:5173`

### 4. Database Setup

**Option A: Local MongoDB**
```bash
# Start MongoDB service
# Windows (as Administrator):
net start MongoDB

# Linux/Mac:
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Add it to your `.env` file as `MONGODB_URL`

## 📁 Project Structure

```
project-management/
│
├── backend/                      # Backend application
│   ├── controllers/              # Request handlers
│   │   ├── Ai.controllers.ts     # AI-related operations
│   │   ├── Project.controllers.ts # Project CRUD operations
│   │   ├── Task.controllers.ts   # Task management
│   │   └── User.controllers.ts   # Authentication & user management
│   │
│   ├── middleware/               # Custom middleware
│   │   ├── role.middleware.ts    # RBAC enforcement
│   │   └── user.middleware.ts    # JWT verification
│   │
│   ├── models/                   # Mongoose schemas
│   │   ├── Project.models.ts     # Project schema
│   │   ├── Task.models.ts        # Task schema
│   │   └── User.models.ts        # User schema
│   │
│   ├── routes/                   # API routes
│   │   ├── ai.routes.ts          # AI endpoints
│   │   ├── project.routes.ts     # Project endpoints
│   │   ├── task.routes.ts        # Task endpoints
│   │   └── user.routes.ts        # Auth & user endpoints
│   │
│   ├── services/                 # Business logic
│   │   └── ai.service.ts         # AI integration service
│   │
│   ├── server.ts                 # Application entry point
│   ├── package.json              # Backend dependencies
│   └── tsconfig.json             # TypeScript configuration
│
├── frontend/                     # Frontend application
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── Navbar.tsx        # Navigation bar
│   │   │   ├── ProjectCard.tsx   # Project display card
│   │   │   ├── Sidebar.tsx       # Sidebar navigation
│   │   │   └── StatCard.tsx      # Statistics card
│   │   │
│   │   ├── context/              # React Context
│   │   │   └── AuthContext.tsx   # Authentication state management
│   │   │
│   │   ├── hooks/                # Custom React hooks
│   │   │   └── useAuth.ts        # Authentication hook
│   │   │
│   │   ├── pages/                # Page components
│   │   │   ├── DashboardPage.tsx      # Dashboard overview
│   │   │   ├── LoginPage.tsx          # Login page
│   │   │   ├── RegisterPage.tsx       # Registration page
│   │   │   ├── ProjectsPage.tsx       # Projects list
│   │   │   ├── ProjectDetailsPage.tsx # Project details & tasks
│   │   │   ├── TasksPage.tsx          # Tasks management
│   │   │   └── UsersPage.tsx          # User management (Admin only)
│   │   │
│   │   ├── services/             # API services
│   │   │   └── axios.ts          # Axios configuration & interceptors
│   │   │
│   │   ├── App.tsx               # Main application component
│   │   └── main.tsx              # Application entry point
│   │
│   ├── package.json              # Frontend dependencies
│   └── vite.config.ts            # Vite configuration
│
└── README.md                     # You are here!
```

## 🏗️ Architecture Overview

### System Architecture

The application follows a **three-tier architecture** pattern:

```
┌─────────────────┐
│   Presentation  │
│     Layer       │──────► React Frontend (UI/UX)
│   (Frontend)    │        - React Components
└────────┬────────┘        - Context API
         │                 - React Router
         │ HTTP/REST
         │
┌────────▼────────┐
│   Application   │
│     Layer       │──────► Express Backend (Business Logic)
│   (Backend)     │        - Controllers
└────────┬────────┘        - Middleware (Auth, RBAC)
         │                 - Services (AI Integration)
         │
┌────────▼────────┐
│      Data       │
│     Layer       │──────► MongoDB (Persistence)
│   (Database)    │        - Mongoose Models
└─────────────────┘        - Redis (Caching)
```

### Authentication Flow

```
1. User submits credentials → Frontend
2. Frontend sends POST /api/user/login → Backend
3. Backend validates credentials → Database
4. Backend generates JWT token → Frontend
5. Frontend stores token in localStorage
6. Frontend includes token in Authorization header for subsequent requests
7. Backend middleware verifies token on protected routes
8. Backend checks user role for RBAC enforcement
```

### Key Design Patterns

- **MVC Pattern**: Model-View-Controller separation for backend
- **Repository Pattern**: Data access abstraction through Mongoose models
- **Middleware Pattern**: Authentication and authorization as reusable middleware
- **Context API**: Global state management for user authentication
- **Interceptor Pattern**: Axios interceptors for token injection and error handling

### Security Implementation

1. **Password Security**
   - Passwords hashed using bcrypt with salt rounds
   - Never stored in plain text

2. **Token-Based Authentication**
   - JWT tokens with expiration
   - Token verification on protected routes
   - Automatic logout on token expiration

3. **Role-Based Access Control**
   - Middleware checks user role before granting access
   - Admin-only endpoints protected at server level
   - Frontend also respects roles for UI rendering

4. **Input Validation**
   - Request body validation in controllers
   - MongoDB schema validation
   - Type safety with TypeScript

5. **CORS Configuration**
   - Whitelist of allowed origins
   - Credentials support for cookie-based auth

## 🔌 API Endpoints

### Authentication & Users

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/user/register` | Public | Register new user |
| POST | `/api/user/login` | Public | User login |
| GET | `/api/user/me` | Protected | Get current user |
| GET | `/api/user/all` | Admin Only | Get all users |
| PUT | `/api/user/:id/role` | Admin Only | Update user role |
| DELETE | `/api/user/:id` | Admin Only | Delete user |

### Projects

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/project` | Protected | Get all projects |
| GET | `/api/project/:id` | Protected | Get project by ID |
| POST | `/api/project` | Admin Only | Create new project |
| PUT | `/api/project/:id` | Admin Only | Update project |
| DELETE | `/api/project/:id` | Admin Only | Delete project |

### Tasks

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/project/:projectId/tasks` | Protected | Get tasks for a project |
| GET | `/api/project/tasks/:id` | Protected | Get task by ID |
| POST | `/api/project/:projectId/tasks` | Admin Only | Create new task |
| PUT | `/api/project/tasks/:id` | Protected | Update task |
| DELETE | `/api/project/tasks/:id` | Admin Only | Delete task |

### AI Features

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/ai/suggest` | Protected | Get AI suggestions for tasks |
| POST | `/api/ai/analyze` | Protected | Analyze project data |

## 👤 Default User Credentials

For testing purposes, you can create an admin user by setting the admin credentials in your backend `.env` file:

```env
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
```

The application will automatically create this admin user on first startup if it doesn't exist.

Alternatively, register a new user and manually update their role in MongoDB:
```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "Admin" } }
)
```

## 🚀 Deployment

### Backend Deployment (Example: Railway/Render/Heroku)

1. Set environment variables in hosting platform
2. Ensure MongoDB Atlas is used (or deploy MongoDB separately)
3. Build command: `npm run build`
4. Start command: `npm start`

### Frontend Deployment (Example: Vercel/Netlify)

1. Set `VITE_API_URL` to production backend URL
2. Build command: `npm run build`
3. Output directory: `dist`

### Environment Variables in Production

Ensure all production environment variables are set:
- Use strong JWT secrets
- Use MongoDB Atlas connection string
- Configure proper CORS origins
- Set `NODE_ENV=production`

## 📄 License

This project is developed as part of an internship evaluation task.

## 👨‍💻 Developer

**Surya Kamal**
- GitHub: [@suryakamal03](https://github.com/suryakamal03)

## 🙏 Acknowledgments

This project demonstrates:
- Clean code architecture
- Production-ready security practices
- Proper RBAC implementation
- Modern full-stack development practices
- RESTful API design
- Responsive UI/UX design

---

**Note**: This is a demonstration project for internship evaluation. All sensitive data and API keys should be kept secure and never committed to version control.

For any questions or issues, please open an issue in the GitHub repository.


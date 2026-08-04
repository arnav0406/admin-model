# e-Office Document Management CMS — Admin Interface

A secure, full-stack administrative content management system for e-Office documents. Built with **Node.js (Express)**, **PostgreSQL**, and **React (Vite)**, with built-in **Docker** support for seamless multi-device deployment.

---

## 🚀 Features

- **🔐 Admin Authentication**: Secure login using JWT stored in `HttpOnly` cookies, bcrypt password hashing, and rate limiting on auth endpoints.
- **📄 Document Management**: Secure upload, viewing, and organization of documents.
- **🛡️ Enterprise Security**: Protected against common web vulnerabilities with **Helmet security headers**, **CSRF validation**, strict **CORS policies**, and **Express Rate Limiter**.
- **🐳 Docker Ready**: Full containerization for both the Express server and PostgreSQL database with persistent volume storage.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express 5, `pg` (PostgreSQL client), `jsonwebtoken`, `bcrypt`, `helmet`, `express-rate-limit`, `cookie-parser`
- **Frontend**: React, Vite
- **Database**: PostgreSQL 16
- **DevOps**: Docker, Docker Compose

---

## 📁 Repository Structure

```text
admin-model/
├── client/                  # React (Vite) frontend application
│   ├── src/                 # React components and styling
│   ├── vite.config.js       # Vite server configuration (Port 5175)
│   └── package.json
├── controllers/             # Express route controllers
├── middleware/              # CSRF, auth verification & rate limiting middleware
├── models/                  # Database models & queries
├── routes/                  # API endpoint definitions
├── db.js                    # PostgreSQL connection pool configuration
├── server.js                # Express application entry point (Port 5002)
├── setup.sql                # Database schema & initial setup script
├── Dockerfile               # Docker blueprint for backend container
├── docker-compose.yml       # Multi-container orchestration (Backend + Postgres)
├── .dockerignore            # Excludes node_modules & temp files from Docker build
├── .env                     # Backend environment variables (git-ignored)
└── README.md                # Project documentation
```

---

## 📋 Prerequisites

Before running the application, make sure you have either of the following installed:

- **Option A (Docker - Recommended)**: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Option B (Manual Setup)**: Node.js (v18 or higher) and PostgreSQL (v14 or higher) installed locally.

---

## 🚀 Getting Started

### Method A: Quickstart with Docker (Recommended)

Running with Docker ensures identical configuration across Windows, Mac, and Linux without manually installing PostgreSQL.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/arnav0406/admin-model.git
   cd admin-model
   ```

2. **Start the Backend and Database**:
   ```bash
   docker compose up --build
   ```
   *This command automatically downloads PostgreSQL, initializes the database tables via `setup.sql`, and starts the Express API server on `http://localhost:5002`.*

3. **Start the Frontend**:
   Open a new terminal window inside the `admin-model` directory and run:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   *Open your browser at `http://localhost:5175` to access the Admin UI.*

---

### Method B: Manual Local Setup

If you prefer running PostgreSQL and Node.js directly on your host operating system:

1. **Clone the repository & install dependencies**:
   ```bash
   git clone https://github.com/arnav0406/admin-model.git
   cd admin-model
   npm install
   cd client && npm install && cd ..
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=5002
   DB_USER=your_postgres_user
   DB_HOST=localhost
   DB_NAME=userdir
   DB_PASSWORD=your_postgres_password
   DB_PORT=5432
   ADMIN_JWT_SECRET=your_secure_random_jwt_secret
   UPLOADS_PATH=./uploads
   FRONTEND_URL=http://localhost:5175
   ```

3. **Initialize PostgreSQL Database**:
   Make sure PostgreSQL is running locally, create a database named `userdir`, then execute `setup.sql`:
   ```bash
   npm run setup
   ```

4. **Run the Application**:
   Run both backend and frontend concurrently:
   ```bash
   npm run dev
   ```
   - Backend API: `http://localhost:5002`
   - Frontend UI: `http://localhost:5175`

---

## ⚙️ Environment Variables Reference

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Express server port | `5002` |
| `DB_HOST` | PostgreSQL host (`postgres-db` in Docker, `localhost` locally) | `postgres-db` |
| `DB_USER` | PostgreSQL username | `arnav` |
| `DB_PASSWORD` | PostgreSQL password | `arnavsr` |
| `DB_NAME` | PostgreSQL database name | `userdir` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `ADMIN_JWT_SECRET` | Secret key for signing admin JWT tokens | Cryptographic string |
| `UPLOADS_PATH` | Directory where uploaded files are stored | `./uploads` |
| `FRONTEND_URL` | Allowed origin for CORS validation | `http://localhost:5175` |

---

## 🔌 API Endpoints Summary

### Authentication (`/api/admin/auth`)
- `POST /login` — Admin login (returns JWT cookie & CSRF token)
- `POST /logout` — Clear auth cookies and invalidate session
- `GET /me` — Fetch currently authenticated admin profile

### Document Management (`/api/admin`)
- `GET /docs` — Retrieve document list
- `POST /docs/upload` — Upload a new document
- `DELETE /docs/:id` — Remove a document

---

## 🐳 Useful Docker Commands

- **Stop containers**: `docker compose down`
- **Run in detached mode**: `docker compose up -d`
- **View backend logs**: `docker compose logs -f backend`
- **Reset database (remove volume data)**: `docker compose down -v`

---

## 📄 License

This project is proprietary software for internal e-Office document management.

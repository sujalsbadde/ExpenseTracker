# Personal Expense Tracker

A full-stack financial management web application built as a portfolio and interview project.

## Tech Stack

- **Frontend**: React (v18+), TypeScript, Tailwind CSS, Recharts, Lucide Icons, Vite
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with Refresh Token Rotation
- **Testing**: Jest + Supertest (Backend), Jest + React Testing Library (Frontend)

---

## Project Architecture

This repository is organized as a monorepo containing three workspaces:

```text
expense-tracker/
├── shared/           # Shared TypeScript interfaces, DTOs, and validation schemas
├── backend/          # Express API server with Prisma ORM and PostgreSQL
├── frontend/         # React SPA built with Vite and Tailwind CSS
├── .env.example      # Sample environment variables
├── .eslintrc.cjs     # Monorepo linting setup
└── .prettierrc       # Monorepo code formatting rules
```

---

## Key Design Principles

1. **Integer Currency Storage**:
   All monetary amounts are stored in **integer cents** (e.g., \$15.50 is stored as `1550`) across database models and API payloads. This guarantees absolute arithmetic precision and eliminates IEEE 754 floating-point inaccuracies.
2. **Secure Token Strategy**:
   Short-lived JWT Access Tokens paired with persisted, rotating Refresh Tokens with cryptographic revocation checks.
3. **Shared Contracts**:
   Common DTOs and data models are defined in `shared/` to enforce strict type-safety across client and server.

---

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20+)
- [PostgreSQL](https://www.postgresql.org/) (local instance or hosted e.g. Supabase/Neon/Docker)

### 2. Environment Setup
Copy the environment variables template:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Installation
Install all workspace dependencies from the root:
```bash
npm install
```

### 4. Database Setup
Generate the Prisma Client and run migrations:
```bash
npm run prisma:generate --workspace=backend
npm run prisma:migrate --workspace=backend
```

### 5. Running in Development Mode
Run both backend and frontend concurrently:
```bash
npm run dev
```
- Frontend will be available at: `http://localhost:5173`
- Backend API will be available at: `http://localhost:5000/api/v1`

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts both backend & frontend dev servers |
| `npm run dev:backend` | Starts Express backend with live-reload (tsx/nodemon) |
| `npm run dev:frontend` | Starts Vite dev server for React frontend |
| `npm run build` | Compiles shared types, backend TypeScript, and frontend bundle |
| `npm run lint` | Runs ESLint across all TypeScript code |
| `npm run format` | Formats all code with Prettier |
| `npm run test` | Runs Jest test suites across backend and frontend |

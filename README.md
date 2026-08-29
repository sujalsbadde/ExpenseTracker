# Personal Expense Tracker

[![CI Pipeline](https://github.com/sujalsbadde/ExpenseTracker/actions/workflows/ci.yml/badge.svg)](https://github.com/sujalsbadde/ExpenseTracker/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.10-2D3748.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-grade, full-stack Personal Expense Tracker built as a portfolio and interview project demonstrating clean architecture, strict type safety, secure authentication, database indexing optimizations, and comprehensive automated testing.

---

## Architecture Overview

This repository is structured as an **npm workspaces monorepo** with three decoupled packages:

```text
expense-tracker/
├── shared/           # Shared TypeScript interfaces, DTOs, and API contracts
├── backend/          # Express.js REST API with Prisma ORM & PostgreSQL
├── frontend/         # React SPA built with Vite, TypeScript & Tailwind CSS
├── .github/          # CI pipeline automation workflows
├── .eslintrc.cjs     # Monorepo linting configuration
├── .prettierrc       # Monorepo code formatting configuration
└── package.json      # Workspace orchestrator and unified scripts
```

```mermaid
flowchart TD
    subgraph Client["Frontend (React + Vite + Tailwind)"]
        UI[User Interface & Dashboard]
        Context[React Context State]
        AxiosClient[Axios Client with Auto-Refresh Interceptor]
    end

    subgraph Contracts["@expense-tracker/shared"]
        Types[DTOs & Shared Models]
        Enums[Enums: PaymentMethod, Role]
    end

    subgraph Server["Backend (Express + TypeScript)"]
        Router[Express API Router]
        Zod[Zod Validation Middleware]
        AuthGuard[JWT Auth Guard]
        Services[Business Logic Services]
        Prisma[Prisma Client ORM]
    end

    subgraph Database["PostgreSQL"]
        DB[(Normalized Tables & Composite Indexes)]
    end

    UI --> Context
    Context --> AxiosClient
    AxiosClient -->|JSON REST with JWT| Router
    Router --> Zod
    Zod --> AuthGuard
    AuthGuard --> Services
    Services --> Prisma
    Prisma --> DB

    Client -.-> Contracts
    Server -.-> Contracts
```

---

## Key Architectural Decisions

### 1. Monetary Values Stored Strictly in Integer Cents
* **The Problem**: Standard binary floating-point numbers (`Float` / `Double`) implemented via the IEEE 754 standard cannot accurately represent base-10 decimals. Simple arithmetic operations lead to precision drift (e.g. `0.1 + 0.2 = 0.30000000000000004`). In financial software, cumulative rounding errors cause balance inconsistencies, broken aggregations, and auditing discrepancies.
* **The Solution**: All monetary amounts are stored as **positive integer cents** (e.g., \$49.99 is stored as `4999`) across database models, Zod validation schemas, and API payloads.
* **Presentation Layer**: The frontend uses explicit conversion utilities:
  * `toCents(dollars)`: Converts user input strings/numbers to integer cents (`Math.round(val * 100)`).
  * `formatCurrency(cents)`: Formats cents into localized currency strings (`Intl.NumberFormat`).

---

### 2. JWT Authentication with Refresh Token Rotation
* **Token Strategy**:
  * **Access Token**: Short-lived (15 minutes), signed with `JWT_ACCESS_SECRET`. Contains minimal claims (`userId`, `email`, `role`).
  * **Refresh Token**: Long-lived (7 days), signed with `JWT_REFRESH_SECRET`, and stored as a cryptographic **SHA-256 hash** in the PostgreSQL `refresh_tokens` table.
* **Single-Use Rotation & Replay Protection**:
  * When a client refreshes an access token via `/api/v1/auth/refresh`, the consumed refresh token is immediately marked `revokedAt: new Date()`, and a brand new token pair is issued.
  * If a previously revoked refresh token is presented again (indicating token theft or replay), the backend invalidates all active sessions for that user as a proactive security measure.
* **Storage Choice (`localStorage` vs `httpOnly` Cookies)**:
  * In a decoupled client-server architecture, `localStorage` paired with an Axios response interceptor allows cross-origin resilience without third-party cookie restrictions (Safari ITP / Chrome Privacy Sandbox).
  * The Axios interceptor transparently intercepts `401 Unauthorized` responses, refreshes the token pair, and replays queued requests without disrupting the user experience.

---

### 3. Database Schema & Composite Indexing Strategy
The PostgreSQL database schema is managed via Prisma ORM with relational integrity and composite B-tree indexes:

```prisma
model Expense {
  id            String        @id @default(uuid())
  amount        Int           // Stored in integer cents
  description   String
  date          DateTime      @default(now())
  paymentMethod PaymentMethod @default(CREDIT_CARD)
  receiptUrl    String?
  notes         String?
  userId        String
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  categoryId    String
  category      Category      @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // INDEXING RATIONALE:
  // 1. [userId]: Fast foreign key lookups and multi-tenant isolation.
  // 2. [userId, date]: Composite index for user-scoped date range queries (WHERE userId = ? AND date BETWEEN ? AND ?)
  //    and sorting (ORDER BY date DESC) without requiring sequential table scans or separate sorting passes.
  // 3. [userId, categoryId]: Optimizes category filters and dashboard spending aggregations.
  // 4. [userId, amount]: Accelerates amount range filter lookups.
  @@index([userId])
  @@index([userId, date])
  @@index([userId, categoryId])
  @@index([userId, amount])
  @@map("expenses")
}
```

---

## REST API Route Documentation

All protected endpoints require an `Authorization: Bearer <accessToken>` header.

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Purpose | Request Body | Status Codes |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register user & seed default categories | `{ name, email, password }` | `201`, `400`, `409` |
| `POST` | `/api/v1/auth/login` | Authenticate & issue token pair | `{ email, password }` | `200`, `400`, `401` |
| `POST` | `/api/v1/auth/refresh` | Rotate and issue fresh token pair | `{ refreshToken }` | `200`, `401` |
| `POST` | `/api/v1/auth/logout` | Revoke active refresh token | `{ refreshToken }` | `200` |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | — | `200`, `401` |

### Expenses (`/api/v1/expenses`)
| Method | Endpoint | Purpose | Query / Body | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/v1/expenses` | Paginated listing with multi-filtering | `?page=1&limit=10&startDate=...&categoryId=...&minAmount=...` | `200`, `400`, `401` |
| `GET` | `/api/v1/expenses/summary` | Aggregated category breakdown & trend | `?startDate=...&endDate=...` | `200`, `401` |
| `POST` | `/api/v1/expenses` | Create new expense record | `{ amount, description, categoryId, paymentMethod, date, notes }` | `201`, `400`, `401`, `404` |
| `GET` | `/api/v1/expenses/:id` | Get expense details by ID | — | `200`, `401`, `404` |
| `PUT` | `/api/v1/expenses/:id` | Update expense record | `{ amount?, description?, categoryId?, date?, notes? }` | `200`, `400`, `401`, `404` |
| `DELETE` | `/api/v1/expenses/:id` | Remove expense record | — | `200`, `401`, `404` |

### Categories (`/api/v1/categories`)
| Method | Endpoint | Purpose | Status Codes |
|---|---|---|---|
| `GET` | `/api/v1/categories` | List system default and custom user categories | `200`, `401` |

---

## Getting Started

### 1. Prerequisites
- **Node.js** v18 or v20+
- **PostgreSQL** v14+ (Local instance or cloud provider like Supabase/Neon/Railway)

### 2. Installation
Clone the repository and install all workspace dependencies:
```bash
git clone https://github.com/sujalsbadde/ExpenseTracker.git
cd ExpenseTracker
npm install
```

### 3. Environment Configuration
Create environment files from templates:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Configure your `DATABASE_URL` in `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expense_tracker?schema=public"
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=your_jwt_access_secret_key_change_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_change_in_production
```

### 4. Database Setup
Generate Prisma Client and apply database schema migrations:
```bash
npm run prisma:generate --workspace=backend
npm run prisma:migrate --workspace=backend
```

### 5. Running the Application
Start both backend and frontend development servers concurrently:
```bash
npm run dev
```
* **Frontend**: `http://localhost:5173`
* **Backend API**: `http://localhost:5000/api/v1`

---

## Automated Test Suites

The project includes **32 automated tests** across both backend and frontend workspaces:

```bash
# Run all tests across backend and frontend
npm test

# Run backend tests only (Jest + Supertest)
npm run test:backend

# Run frontend component tests only (Jest + React Testing Library)
npm run test:frontend
```

```text
Backend Test Suites:
PASS src/__tests__/expense.test.ts
PASS src/__tests__/auth.test.ts
Test Suites: 2 passed, 2 total
Tests:       22 passed, 22 total

Frontend Test Suites:
PASS src/__tests__/ExpenseList.test.tsx
PASS src/__tests__/ExpenseModal.test.tsx
Test Suites: 2 passed, 2 total
Tests:       10 passed, 10 total

Total Tests: 32 passed, 32 total
```

---

## What I'd Do Differently at Scale

If scaling this system to handle millions of active users and hundreds of millions of expense transactions:

1. **Distributed Caching & Session Store (Redis)**:
   * Offload refresh token verification, session tracking, and IP rate limiting (using `express-rate-limit` + Redis store) from PostgreSQL to an in-memory Redis cluster.
   * Cache user category lists and monthly metric summaries with cache invalidation upon expense writes.

2. **Database Partitioning & Read Replicas**:
   * Implement **declarative table partitioning** on PostgreSQL for the `expenses` table based on `date` (range partitioning by year and month). Queries with date boundaries will only scan relevant partitions rather than a 100M+ row table.
   * Deploy read replicas with Connection Pooling (e.g. PgBouncer / Prisma Accelerate) to route analytical summary queries away from the primary write database.

3. **Asynchronous Background Processing (BullMQ / RabbitMQ)**:
   * Move heavy operations like PDF invoice generation, batch CSV imports/exports, and receipt OCR processing (e.g. using Gemini Multimodal or AWS Textract) to asynchronous job queues to ensure API endpoints remain sub-50ms.

4. **Elasticsearch / OpenSearch for Full-Text Analytics**:
   * Replace PostgreSQL `ILIKE` pattern matching with Elasticsearch for fuzzy keyword searches across millions of receipts, merchant names, and multi-paragraph notes.

5. **Multi-Currency & FX Snapshotting**:
   * Extend the schema to record transaction currency (`USD`, `EUR`, `INR`, etc.), the user's display currency, and the exact foreign exchange rate snapshot at the transaction timestamp.

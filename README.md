# Node server

Express API with PostgreSQL. It serves auth routes and the applications report used by the React dashboard.

## What you need

Node.js, npm, and a running PostgreSQL database.

## Setup

Copy the environment template and fill in your real values.

```bash
cp .env.example .env
```

Edit `.env` so `DATABASE_URL` points at your database and `JWT_SECRET` is a long random string. If you use the Vite dev server for the frontend, keep `CLIENT_URL` aligned with that origin (for example `http://localhost:5173`).

Install dependencies and create the sample data when you are ready.

```bash
npm install
npm run seed:applications
```

The seed script creates the `applications` table if needed and loads the demo rows.

## Run

```bash
npm run dev
```

The API listens on the port from `PORT` (default 5000). Health check: `GET /api/health`.

Report endpoints live under `/api/reports/applications` (summary and aging). Auth lives under `/api/auth`.

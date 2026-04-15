# Node server

Express API with PostgreSQL. It serves auth routes and the applications report used by the React dashboard.

## What you need

Node.js, npm, and a running PostgreSQL database.

## Setup

Copy the environment template and fill in your real values.

```bash
cp .env.example .env
```

Edit `.env` so `DATABASE_URL` points at your database and `JWT_SECRET` is a long random string.

`CLIENT_URL` is what the API uses for CORS. It must list every browser origin that will call the API, not the API URL itself. Use a comma-separated list with no spaces, for example `http://localhost:5173,https://your-app.vercel.app`. The value must match the site origin exactly (`https`, no path, usually no trailing slash). Putting the Vercel URL only in the frontend env does not fix CORS; the API env must allow that origin too. For a quick test you can set `CLIENT_URL` to `*` (allow any origin).

Serve the API over `https` when the site is on `https`, otherwise the browser may block mixed content before CORS even runs.

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

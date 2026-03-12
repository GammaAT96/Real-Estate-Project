# Real Estate Admin Platform (Frontend)

React admin UI for the **Real Estate Multi-Tenant SaaS** (projects → plots → bookings → sales → analytics).

## Stack

- React + TypeScript + Vite
- Tailwind + Radix UI
- TanStack Query + Zustand
- Recharts

## Run (development)

From `real-estate-frontend/`:

```bash
npm install
npm run dev
```

Frontend dev server: `http://localhost:5173`

## Backend API

The UI expects the backend API at `/api/*` (dev) and behind nginx (prod).

- Health check: `GET /health`
- Swagger docs: `GET /api-docs`

## Build (production)

From `real-estate-frontend/`:

```bash
npm run build
npm run preview
```

## Production (Docker)

Use the repo root compose file:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Then open `http://localhost`.

# Sigverse

Sigverse is a full-stack learning platform with:

- `backend/`: Express, MySQL, MongoDB, GitHub OAuth, email OTP flows
- `frontend/`: React + Vite

## Project Structure

```text
backend/   API server and database integrations
frontend/  React client
render.yaml  Render blueprint for deploying both services
```

## Local Development

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The backend runs on `http://localhost:3000` by default.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend runs on `http://localhost:5173` by default.

## Environment Files

Use the checked-in templates:

- `backend/.env.example`
- `frontend/.env.example`

Important backend variables:

- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
- `MONGO_URI`
- `JWT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`
- `FRONTEND_URL`
- `FRONTEND_URLS`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

Important frontend variable:

- `VITE_API_URL`

## Deployment

This repo is ready to deploy as two services:

1. Backend Node service from `backend/`
2. Frontend static site from `frontend/`

### Render

This repository includes `render.yaml`, so you can create a Render Blueprint and provision both services from the same repo.

Backend settings:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`

Frontend settings:

- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`

Set these production URLs carefully:

- `VITE_API_URL=https://your-backend-domain.com`
- `FRONTEND_URL=https://your-frontend-domain.com`
- `FRONTEND_URLS=https://your-frontend-domain.com`
- `GITHUB_CALLBACK_URL=https://your-backend-domain.com/auth/github/callback`

If you use multiple frontend domains, set `FRONTEND_URLS` as a comma-separated list.

## Database Setup

Run the MySQL schema before using the app:

```bash
cd backend
mysql -u your_user -p < schema.sql
```

Optional sample data:

```bash
cd backend
npm run seed:sample
```

## Production Notes

- The frontend reads `VITE_API_URL` first and falls back to the current origin outside localhost.
- The backend allows multiple frontend origins through `FRONTEND_URLS`.
- GitHub OAuth redirects and instructor approval emails use the configured frontend URL.
- Do not commit real secrets. If any credentials were previously exposed, rotate them before deploying.

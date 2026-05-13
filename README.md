# Jeevika

Finding Work. Finding Workers. Building Trust.

Jeevika is a hackathon-ready marketplace MVP for India's informal, gig, construction, household, and agricultural workforce. It connects workers, equipment owners, material providers, and employers with fast matching, trust badges, chat simulation, and an optional escrow wallet flow.

## Run Locally

```bash
npm install
npm run dev
```

Optional backend:

```bash
cp server/.env.example server/.env
npm run server
```

## Routes

- `/` Landing page
- `/login`
- `/register`
- `/dashboard`
- `/jobs`
- `/post-job`
- `/profile`
- `/wallet`
- `/chat/demo-thread`

## Backend

The `server/` directory contains an Express + Mongoose + JWT scaffold with demo seeding. The frontend uses local demo state so the app is immediately usable without a database.

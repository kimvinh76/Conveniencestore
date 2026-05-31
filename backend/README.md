# Backend API

## Setup
1. Copy `.env.example` to `.env` and update SQL Server credentials/ports.
2. Install dependencies:

```bash
cd backend
npm install
```

## Run

```bash
cd backend
npm run dev
```

Backend listens on `PORT` (default 3001).

## Notes
- `MOCK_MODE` is `false` by default. Set to `true` only if you want mock data.
- Required SQL Server stored procedures are the same as the legacy `code/` server.

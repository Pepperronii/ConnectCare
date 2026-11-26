# ConnectCare

ConnectCare is a customer-support ticketing app. Customers can submit and track tickets, and staff can manage tickets, categories, and customer records.

## Tech stack

- Frontend: React, TypeScript, Vite, Axios
- Backend: NestJS, TypeScript, TypeORM, JWT authentication
- Database: MySQL

## Run locally

Use Node.js 24 with npm and a running MySQL server. Create an empty MySQL database for local development, such as `connectcare`, and make sure your local database user can create and update tables in it. The backend creates or updates the tables automatically when it starts.

In a PowerShell terminal opened at the repository root:

```powershell
cd backend
npm ci
Copy-Item .env.example .env
```

Open `backend/.env` and set `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_DATABASE` for your local database. Set `JWT_SECRET` to a long, random value. Keep `PORT=3000` for the default frontend configuration. If you already have a local `backend/.env`, reuse it and skip the copy command.

From the same terminal, start the API:

```powershell
npm run start:dev
```

In another PowerShell terminal opened at the repository root:

```powershell
cd frontend
npm ci
npm run dev -- --strictPort
```

Open <http://localhost:5173>. The frontend uses the API at <http://localhost:3000>.

# ConnectCare Backend

ConnectCare's NestJS API handles account registration, sign-in, customer profiles, support tickets, categories, and ticket status history. It uses TypeScript, TypeORM, MySQL, and JWT authentication.

## Run locally

Install Node.js 24 and start MySQL. Create an empty database (for example, `connectcare`) and give your local database user access to it. From the repository root, run:

```powershell
cd backend
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Set the values in `backend/.env` for your machine.

| Variable | Local setup |
| --- | --- |
| `DB_HOST`, `DB_PORT` | MySQL address and port. The example uses `localhost:3306`. |
| `DB_USERNAME`, `DB_PASSWORD` | Credentials for your local MySQL user. |
| `DB_DATABASE` | Name of the database you created. |
| `DB_SYNCHRONIZE` | Defaults to `true` for local schema updates. Use `false` when the schema is managed separately. |
| `JWT_SECRET` | A long, random signing secret. Keep it in the local `.env` file. |
| `PORT` | Defaults to `3000`. |
| `FRONTEND_ORIGIN` | Browser origin allowed by the API. Defaults to `http://localhost:5173`. |

Start the API with `npm run start:dev`. Open <http://localhost:3000/> to verify that it responds.

## Last successful login

The backend records `users.lastLoginAt` when sign-in succeeds. Existing accounts start with a blank timestamp until their next successful login. Local schema synchronization adds the column on startup. If schema synchronization is disabled, add the nullable column before starting the updated API.

```sql
ALTER TABLE users ADD COLUMN lastLoginAt DATETIME(3) NULL;
```

## API routes

| Method and path | Purpose |
| --- | --- |
| `POST /auth/register` | Create a customer account. |
| `POST /auth/login` | Sign in and receive an access token. |
| `GET /auth/profile` | Read the signed-in account profile. |
| `GET /tickets/categories` | List ticket categories. |
| `GET /tickets` | List tickets visible to the signed-in user. |
| `POST /tickets` | Submit a support ticket. |
| `GET /tickets/:id/history` | View a ticket's status history. |

For protected routes, send `Authorization: Bearer <access_token>`. Ticket access depends on the user's role and ticket ownership.

## Build and test

Run these commands from `backend`.

```powershell
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

The end-to-end test initializes the app and connects to MySQL. Use a dedicated test database for that command.

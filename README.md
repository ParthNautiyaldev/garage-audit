# Northline Auto Works — Secure Audit Logging

A shop operations app whose main feature is a tamper-evident activity trail: sign-ins, role changes, repair updates, and sensitive customer views.

This is a student project. The accounts and data are fictional. Do not use the development JWT secret outside your machine.

## What you need

- Node.js 20 or newer (you have Node 24)
- Docker Desktop, running

MongoDB is not installed on Windows. The API uses MongoDB 7 in Docker. You do not need to configure Docker yourself.

## Run it

From this folder, in PowerShell:

```powershell
cd C:\Users\allpa\Projects\garage-audit
npm run setup
npm run db
npm run seed
npm run dev
```

Open http://localhost:5173

`npm run db` starts MongoDB. The first time, Docker downloads the image, so give it a minute. `npm run seed` wipes and reloads the demo data. `npm run dev` starts the API on port 4000 and the React app on port 5173.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@northline.shop | Admin123! |
| Manager | manager@northline.shop | Manager123! |
| Technician | sam@northline.shop | Tech123! |
| Technician | riley@northline.shop | Tech123! |

## Roles

- **Admin** — staff roles, all shop records, audit dashboard
- **Manager** — shop records and a read-only audit dashboard
- **Technician** — repair status on jobs assigned to them. Other status changes are denied and logged.

## Audit design

Each event stores the user id and name, action, resource type and id, IP address, timestamp, old and new values when something changed, and success or failure.

A few rules worth mentioning in a presentation:

- The login response always says "Invalid email or password". The log keeps the specific reason.
- Passwords are never written to the log.
- Opening a customer record logs the field names that were revealed, not a second copy of the notes.
- Reading the audit log does not create another audit row.
- If the audit write fails, the shop action fails with it.

Failed logins are highlighted when the same person and the same IP fail 3 or more times within 15 minutes. The seed data includes one burst so the highlight is visible immediately.

# Pharmacy CRM System

A pharmacy operations and customer relationship management dashboard built with **Next.js App Router**, **React**, **TypeScript**, **PostgreSQL**, and **Drizzle ORM**. The interface is Persian-first and includes customer management, medicine inventory, prescriptions, sales, follow-ups, campaigns, and reports.

> **Project status:** This repository is prepared for development and portfolio review. Before deploying it with real customer or patient data, complete a security review, configure authentication/authorization, and disable or protect demo-data endpoints.

## Features

- **Dashboard:** operational KPIs and activity summaries.
- **Customers:** searchable customer directory and customer profiles.
- **Medicine inventory:** stock levels, reorder thresholds, expiry monitoring, and stock adjustments.
- **Prescriptions:** prescription records and dispensing workflow.
- **Sales:** point-of-sale workflow, line items, inventory changes, and loyalty points.
- **Follow-ups:** customer interactions, due dates, and completion status.
- **Campaigns:** campaign management and audience summaries.
- **Reports:** business and customer analytics.
- **Database health check:** `GET /api/health` verifies PostgreSQL connectivity.

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js App Router |
| UI | React, TypeScript, Tailwind CSS |
| Database | PostgreSQL |
| ORM / schema | Drizzle ORM and Drizzle Kit |
| Runtime | Node.js |
| Linting | ESLint with Next.js rules |

## Requirements

- Node.js 20.9 or newer (use a currently supported LTS release)
- npm
- PostgreSQL

## Getting started

1. Clone the repository and enter the project directory:

   ```bash
   git clone <YOUR_REPOSITORY_URL>
   cd pharmacy-crm-system
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file:

   **macOS / Linux**
   ```bash
   cp .env.example .env
   ```

   **Windows PowerShell**
   ```powershell
   Copy-Item .env.example .env
   ```

4. Create a PostgreSQL database named `pharmacy_crm` (or update `DATABASE_URL` in `.env`). Example using `psql`:

   ```sql
   CREATE DATABASE pharmacy_crm;
   ```

5. Push the current Drizzle schema to the configured database:

   ```bash
   npm run db:push
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000).

The demo seed endpoint is `POST /api/seed`. Use it only with a development database. It is not protected by authentication in this project and should be disabled or secured before any public deployment.

## Useful scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |
| `npm run db:generate` | Generate Drizzle SQL migration files |
| `npm run db:push` | Apply the current schema to the configured database |
| `npm run db:studio` | Open Drizzle Studio |

## Project structure

```text
src/
├── app/                         # Next.js routes and route handlers
│   ├── api/                     # REST-style API endpoints
│   ├── campaigns/               # Campaign management page
│   ├── customers/               # Customer directory and profile
│   ├── followups/               # Customer follow-up workflow
│   ├── medicines/               # Inventory page
│   ├── prescriptions/           # Prescription workflow
│   ├── reports/                 # Analytics and reporting
│   ├── sales/                   # Point-of-sale workflow
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root application layout
│   └── page.tsx                 # Dashboard
├── components/
│   ├── dashboard/               # Dashboard/report chart components
│   ├── layout/                  # Shared app layout components, e.g. navigation
│   ├── medicines/               # Inventory-specific interactive components
│   └── shared/                  # Reusable UI primitives
├── db/
│   ├── index.ts                 # Database client and connection pool
│   └── schema.ts                # Drizzle table definitions and inferred types
└── lib/
    ├── services/                # Server-side read/query services
    ├── format.ts                # Locale, date, currency, and status formatting
    └── seed.ts                  # Development/demo data seeding
```

## Architecture notes

- `src/app` follows the Next.js App Router convention. Page files render screens; `route.ts` files expose HTTP endpoints.
- Shared presentation components live in `src/components/shared`; route-specific components should stay near their feature area.
- Database schema definitions are centralized in `src/db/schema.ts`.
- Database access and reporting queries are separated from page presentation.
- `DATABASE_URL` is read from the environment. Do not commit `.env` files or real credentials.

## Security and production checklist

Before using real pharmacy, customer, or patient information:

- Add authentication and role-based authorization to pages and API endpoints.
- Protect or remove `POST /api/seed` from production deployments.
- Validate and normalize all API request bodies on the server.
- Review sale and prescription dispensing flows for database transaction safety and concurrency.
- Configure backups, database access controls, HTTPS, logging, and monitoring.
- Use synthetic data in screenshots, demos, tests, and public issues.
- Confirm applicable privacy and healthcare data-protection requirements.

This repository's presence of an API endpoint or UI control should not be interpreted as proof that the application is production-secure or compliant with healthcare regulations.

## Contributing

1. Create a feature branch.
2. Keep changes focused and avoid committing secrets or real customer data.
3. Run `npm run typecheck`, `npm run lint`, and `npm run build` before opening a pull request.
4. Describe the problem, solution, and manual verification steps in the pull request.

## License

No license has been selected for this repository yet. Add a license file only after confirming that you have the right to publish the code and choosing the intended reuse terms.

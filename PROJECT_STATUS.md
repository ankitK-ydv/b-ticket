# B-Ticket — Project Development Status

## 1. Project Overview

B-Ticket is a private bus digital ticketing platform designed to digitize bus operations, passenger ticket booking, fare management, payments, and conductor-based ticket verification.

## 2. Technology Stack

### Backend

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM 8 RC (contract-based workflow)
- JWT authentication
- bcrypt

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Redux Toolkit
- React Router
- Axios

## 3. Implemented Backend Modules

| Module           | Implementation                                         |
| ---------------- | ------------------------------------------------------ |
| Authentication   | Registration, login, JWT, role-based authorization     |
| Bus Management   | Owner-scoped bus management                            |
| Routes           | Route management                                       |
| Route Directions | Direction management                                   |
| Stops            | Stop catalogue                                         |
| Route Stops      | Route-specific stop assignments and custom names/codes |
| Fares            | Direction-specific fares and fare calculation          |
| Trips            | Search, creation, assignment, cancellation             |
| Payments         | Payment creation and test confirmation workflow        |
| Tickets          | Ticket creation, retrieval and QR verification         |

## 4. Implemented Frontend Modules

- Login and registration
- Authentication state management
- Passenger dashboard
- Owner dashboard
- Conductor dashboard
- Admin dashboard
- Bus management
- Route management
- Route direction management
- Stop management
- Fare management
- Payment page
- Ticket details page
- QR scanner

## 5. Authentication and Authorization

The platform defines four roles:

- PASSENGER
- OWNER
- CONDUCTOR
- ADMIN

Backend security uses JWT authentication, `JwtAuthGuard`, `RolesGuard`, and role decorators.

Frontend route protection uses `ProtectedRoute`.

Owner management pages were grouped under OWNER-only frontend route protection during the GitHub preparation review.

## 6. Database and Prisma

- Database: PostgreSQL
- Prisma version: 8 RC contract-based workflow
- Contract source: `src/prisma/contract.prisma`
- Generated contract artifacts: `contract.json` and `contract.d.ts`
- Runtime database initialization: `src/prisma/db.ts`

Project commands:

```bash
npm run contract:emit
npx prisma db update
```

## 7. Security Improvements

- Replaced hardcoded JWT secret in AuthModule with `JWT_SECRET`.
- Replaced hardcoded JWT secret in BusModule with `JWT_SECRET`.
- Moved Observe credentials to environment variables.
- Added root `.env.example`.
- Added `frontend/.env.example`.
- Updated `.gitignore` to exclude environment files, dependencies, build output, logs, local database files, private keys and local metadata.
- Verified that root `.env` is not tracked by Git and has no history in current Git references.
- Scanned source, frontend source and Postman collection for selected hardcoded secret patterns.

## 8. Build Verification

| Application | Command         | Result     |
| ----------- | --------------- | ---------- |
| Backend     | `npm run build` | Successful |
| Frontend    | `npm run build` | Successful |

Note: Frontend build reports a JavaScript bundle-size warning above 500 kB. Build still completes successfully.

## 9. Known Limitations and Pending Work

- Complete runtime testing of all modules.
- Verify authorization behavior through endpoint-level tests.
- Verify payment amount validation and production payment gateway integration.
- Review transaction safety for payment and ticket operations.
- Review QR verification concurrency behavior.
- Review Prisma dependency compatibility and package versions.
- Run backend and frontend lint checks.
- Run unit and end-to-end test suites.
- Review and finalize API documentation.
- Optimize frontend bundle through code splitting.
- Complete final Git security audit.
- Create GitHub repository and perform first push.

## 10. GitHub Preparation Status

- [x] Existing Git history preserved.
- [x] `.gitignore` reviewed and updated.
- [x] Environment files excluded from Git.
- [x] JWT hardcoded secrets removed from inspected modules.
- [x] Backend production build verified.
- [x] Frontend production build verified.
- [x] Owner frontend route protection corrected.
- [x] README documentation prepared.
- [ ] Final security audit.
- [ ] Final Git staging review.
- [ ] Initial commit.
- [ ] GitHub remote configuration.
- [ ] First push.

## 11. Development Rule

Future development must preserve existing architecture and business logic unless a change is explicitly reviewed and approved.

Before every commit:

1. Review changed files.
2. Check for accidental secrets.
3. Run relevant builds and tests.
4. Review Git diff.
5. Stage only intended files.
6. Commit with a meaningful message.

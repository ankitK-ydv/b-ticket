# B-Ticket - Private Bus Digital Ticketing Platform

B-Ticket is a digital ticket booking platform designed for private bus operators. It aims to simplify passenger ticket booking, bus operations, fare management, online payment workflows, and conductor-based QR ticket verification.

## Project Overview

The platform provides separate interfaces and role-based access for:

- **Passengers:** Search available trips, manage payments, and access tickets.
- **Bus Owners:** Manage buses, routes, directions, stops, fares, and trips.
- **Conductors:** View assigned trips and verify passenger tickets using QR codes.
- **Administrators:** Access the admin dashboard and administrative user management APIs.

## Technology Stack

### Backend

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM 8 RC — contract-based workflow
- JWT authentication
- bcrypt password hashing

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Redux Toolkit
- React Router
- Axios
- html5-qrcode
- qrcode

## Architecture

The project is organized into two applications:

```text
project-zero/
├── src/                  # NestJS backend
│   ├── auth/
│   ├── bus/
│   ├── fares/
│   ├── payments/
│   ├── prisma/
│   ├── route-directions/
│   ├── route-stops/
│   ├── routes/
│   ├── stops/
│   ├── tickets/
│   └── trips/
│
├── frontend/             # React frontend
│   └── src/
│       ├── app/
│       ├── components/
│       ├── features/
│       ├── layouts/
│       ├── pages/
│       ├── routes/
│       └── services/
│
├── migrations/
├── postman/
├── .env.example
└── package.json
```

## Main Features

### Authentication and Authorization

- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Passenger, Owner, Conductor, and Admin roles
- Owner-managed conductor creation

### Bus and Route Management

- Bus creation and management
- Route management
- Route directions
- Stop catalogue
- Route-specific stop assignments
- Custom stop names and codes

### Fare Management

- Direction-specific fare management
- Fare calculation between selected stops
- Adjacent segment fare calculation

### Trip Management

- Available trip search
- Trip creation and management
- Conductor assignment
- Trip cancellation
- Assigned trip listing

### Payments and Tickets

- Payment creation and passenger payment history
- Test payment confirmation endpoint
- Ticket generation and retrieval
- QR-based ticket verification
- Conductor verification history

### Frontend Interfaces

- Passenger dashboard
- Owner dashboard
- Conductor dashboard
- Admin dashboard
- Bus, route, direction, stop, and fare management
- Payment and ticket details pages
- QR scanner interface

## User Roles

| Role      | Main Responsibilities                    |
| --------- | ---------------------------------------- |
| PASSENGER | Search trips, payments, and tickets      |
| OWNER     | Manage buses, routes, fares, and trips   |
| CONDUCTOR | Access assigned trips and verify tickets |
| ADMIN     | Administrative user management           |

The frontend uses protected routes, while the backend enforces authentication and role-based authorization.

## Prerequisites

- Node.js compatible with project dependencies
- npm
- PostgreSQL 15 or later
- Git

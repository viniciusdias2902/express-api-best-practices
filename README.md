# Learning API

**Leia em português: [README.pt-BR.md](./README.pt-BR.md)**

> **Disclaimer:** This is **not** a real-world production project. It is a simple REST API built entirely by artificial intelligence, designed as a hands-on reference for studying modern backend development practices used in the industry.

## Purpose

This project exists solely for **educational purposes**. It demonstrates how to structure a Node.js REST API following widely adopted conventions and best practices — from layered architecture and dependency injection to authentication, input validation, and centralized error handling.

If you are learning backend development, use this codebase as a reference to understand **why** things are organized the way they are, not just **how**.

## Tech Stack

| Technology | Version | Role |
|---|---|---|
| Node.js | 22+ | Runtime (native ES Modules) |
| Express | 5 | HTTP framework |
| Prisma | 7 | ORM / data access |
| PostgreSQL | — | Relational database |
| Zod | 4 | Schema validation |
| Argon2 | — | Password hashing |
| Jose | — | JWT signing and verification |
| Helmet | — | HTTP security headers |
| CORS | — | Cross-Origin Resource Sharing |
| express-rate-limit | — | Rate limiting |
| Vitest | 3 | Testing framework |

## Project Structure

```
src/
├── server.js              # Entry point — starts the HTTP server
├── app.js                 # Express configuration and middleware pipeline
├── lib/
│   └── prisma.js          # PrismaClient singleton
├── errors/
│   └── AppError.js        # Custom error class
├── middlewares/
│   ├── validate.js        # Zod validation middleware
│   ├── authenticate.js    # JWT authentication middleware
│   └── errorHandler.js    # Global error handler
└── modules/
    ├── auth/
    │   ├── auth.schema.js       # Validation schemas (register, login, refresh)
    │   ├── auth.repository.js   # Data access (User + RefreshToken)
    │   ├── auth.service.js      # Business logic (register, login, refresh, logout)
    │   ├── auth.controller.js   # HTTP layer
    │   ├── auth.routes.js       # Routes + dependency wiring
    │   └── __tests__/           # Unit tests
    └── book/
        ├── book.schema.js       # Validation schemas (DTOs)
        ├── book.repository.js   # Data access layer
        ├── book.service.js      # Business logic layer
        ├── book.controller.js   # HTTP layer
        ├── book.routes.js       # Routes + dependency wiring
        └── __tests__/           # Unit tests
```

## API Endpoints

### Health Check

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Returns API status |

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Authenticate and get tokens |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| POST | `/api/auth/logout` | Public | Revoke refresh token |

### Books

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/books` | Required | Create a book |
| GET | `/api/books` | Required | List books (paginated, searchable, filterable) |
| GET | `/api/books/:id` | Required | Get a book by ID |
| PUT | `/api/books/:id` | Required | Update a book |
| DELETE | `/api/books/:id` | Required | Delete a book |

## Authentication Flow

The API uses **access token + refresh token** authentication:

1. **Register** or **Login** to get an `accessToken` (JWT, 15min) and a `refreshToken` (opaque, 7 days)
2. Send the access token in the `Authorization` header for protected routes:
   ```
   Authorization: Bearer <accessToken>
   ```
3. When the access token expires, use the **refresh** endpoint to get a new pair of tokens
4. **Logout** revokes the refresh token (the access token remains valid until it expires)

Refresh tokens use **rotation**: each refresh token can only be used once. After use, a new one is issued and the old one is deleted.

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and JWT secret

# Run database migrations
npm run prisma:migrate

# Generate Prisma Client
npm run prisma:generate

# Start in development mode
npm run dev

# Run tests
npm test
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start with file watching |
| `npm start` | Production start |
| `npm test` | Run unit tests |
| `npm run prisma:generate` | Regenerate Prisma Client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |

## Documentation

- **[PATTERNS.md](./PATTERNS.md)** — Design patterns used in this project
- **[PATTERNS.pt-BR.md](./PATTERNS.pt-BR.md)** — Padroes de projeto (Portugues)
- **[GUIDE.md](./GUIDE.md)** — In-depth educational guide (Portuguese only)

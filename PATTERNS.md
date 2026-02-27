# Design Patterns

**Leia em portugues: [PATTERNS.pt-BR.md](./PATTERNS.pt-BR.md)**

This document describes the design patterns and architectural decisions used in this project, with references to the actual source files.

---

## 1. Layered Architecture (3-Layer)

The application is split into three distinct layers with strict boundaries. Each layer has a single responsibility and only communicates with its immediate neighbor.

```
Controller (HTTP) → Service (Business Logic) → Repository (Data Access) → Database
```

- **Controller** — translates HTTP requests/responses. Knows nothing about the database.
- **Service** — enforces business rules. Knows nothing about HTTP or Prisma.
- **Repository** — wraps database queries. Knows nothing about business rules or HTTP.

**Files:**
- `src/modules/book/book.controller.js`, `src/modules/auth/auth.controller.js`
- `src/modules/book/book.service.js`, `src/modules/auth/auth.service.js`
- `src/modules/book/book.repository.js`, `src/modules/auth/auth.repository.js`

---

## 2. Dependency Injection (Manual / Factory-Based)

Each layer is a **factory function** that receives its dependencies as parameters. No DI container is needed — the wiring is explicit and easy to follow.

```javascript
// src/modules/book/book.routes.js (composition root)
const repository = createBookRepository(prisma);
const service = createBookService(repository);
const controller = createBookController(service);
```

```javascript
// src/modules/auth/auth.routes.js (composition root)
const repository = createAuthRepository(prisma);
const service = createAuthService(repository, { jwtSecret, jwtExpiresIn, refreshTokenExpiresInDays });
const controller = createAuthController(service);
```

This makes every layer independently testable by simply passing mock objects instead of real implementations. The auth service also receives configuration as a dependency, keeping it environment-agnostic.

**Files:**
- `src/modules/book/book.routes.js` (composition root)
- `src/modules/auth/auth.routes.js` (composition root)
- All factory functions across both modules

---

## 3. Repository Pattern

All database access is encapsulated behind a clean interface. The service layer never interacts with Prisma directly — it only calls repository methods.

- **Book Repository:** `create`, `findMany`, `findById`, `findByIsbn`, `update`, `delete`
- **Auth Repository:** `createUser`, `findUserByEmail`, `findUserById`, `createRefreshToken`, `findRefreshToken`, `deleteRefreshToken`, `deleteAllRefreshTokens`

This decouples business logic from the specific ORM or database being used.

**Files:**
- `src/modules/book/book.repository.js`
- `src/modules/auth/auth.repository.js`

---

## 4. Composition Root

The dependency graph is assembled in a single place — the routes file of each module. These are the **only** files that import the Prisma singleton and wire all layers together. Everything else receives its dependencies from the outside.

**Files:**
- `src/modules/book/book.routes.js`
- `src/modules/auth/auth.routes.js`

---

## 5. Singleton Pattern

The `PrismaClient` is instantiated once and shared across the entire application. This prevents creating multiple database connection pools.

**File:** `src/lib/prisma.js`

---

## 6. Factory Function Pattern

Instead of classes, each layer exports a factory function that returns a plain object with methods. This is idiomatic JavaScript and avoids issues with `this` binding while keeping the code simple and functional.

```javascript
export function createBookService(repository) {
  return {
    async create(data) { /* ... */ },
    async findAll(query) { /* ... */ },
    // ...
  };
}
```

**Files:** All files under `src/modules/book/` and `src/modules/auth/`

---

## 7. Middleware Pattern

Express middlewares are used for cross-cutting concerns that should not live inside business logic:

- **Validation middleware** — a factory that takes a Zod schema and returns a middleware function that validates `req.body` before it reaches the controller.
- **Authentication middleware** — a factory that takes a JWT secret and returns a middleware that verifies the `Authorization: Bearer <token>` header and populates `req.userId`.
- **Error handler middleware** — a centralized 4-argument Express middleware that catches all errors and sends appropriate HTTP responses.
- **Security middlewares** — `helmet` (HTTP headers), `cors` (cross-origin), and `express-rate-limit` (brute-force protection) applied globally.

**Files:**
- `src/middlewares/validate.js`
- `src/middlewares/authenticate.js`
- `src/middlewares/errorHandler.js`
- `src/app.js` (security middleware registration)

---

## 8. Centralized Error Handling

All errors flow through `next(error)` to a single error handler. The handler categorizes errors by type and responds accordingly:

| Error Type | HTTP Status | Detection |
|---|---|---|
| Validation error | 400 | Has `details` property |
| Prisma unique constraint (P2002) | 409 | Prisma error code |
| Prisma not found (P2025) | 404 | Prisma error code |
| AppError | Dynamic | Has `statusCode` property |
| Unknown | 500 | Fallback (generic message, no leak) |

This eliminates scattered `try/catch` blocks and ensures consistent error responses.

**Files:**
- `src/errors/AppError.js`
- `src/middlewares/errorHandler.js`

---

## 9. Schema Validation / DTO Pattern

Zod schemas act as Data Transfer Objects (DTOs), defining the exact shape of valid input:

- **Book:** `createBookSchema` (required fields), `updateBookSchema` (partial with refinement), `listBooksQuerySchema` (query params with defaults)
- **Auth:** `registerSchema` (name, email, password with strength rules), `loginSchema` (email, password), `refreshTokenSchema` (refresh token)

The parsed output replaces the raw `req.body`, ensuring validated and sanitized data reaches the controller.

**Files:**
- `src/modules/book/book.schema.js`
- `src/modules/auth/auth.schema.js`

---

## 10. Feature-First Module Organization

Code is organized **by feature** (e.g., `modules/book/`, `modules/auth/`) rather than by technical layer (e.g., `controllers/`, `services/`). Each module is self-contained with its own routes, controller, service, repository, schemas, and tests.

Adding a new feature means creating a new folder under `modules/` — no need to touch multiple top-level directories.

```
src/modules/
├── auth/
│   ├── auth.schema.js
│   ├── auth.repository.js
│   ├── auth.service.js
│   ├── auth.controller.js
│   ├── auth.routes.js
│   └── __tests__/
└── book/
    ├── book.schema.js
    ├── book.repository.js
    ├── book.service.js
    ├── book.controller.js
    ├── book.routes.js
    └── __tests__/
```

---

## 11. App / Server Separation

The Express application configuration (`app.js`) is separated from the HTTP server startup (`server.js`). This allows importing `app` in tests (e.g., with `supertest`) without actually starting the server.

**Files:**
- `src/app.js`
- `src/server.js`

---

## 12. Access Token + Refresh Token Pattern

Authentication uses a dual-token strategy:

- **Access token (JWT):** short-lived (15 minutes), signed with HS256, contains only the user ID (`sub` claim). Verified by the `authenticate` middleware on every protected request.
- **Refresh token (opaque):** long-lived (7 days), a random `crypto.randomBytes(48)` value stored in the database. Used to obtain a new pair of tokens without re-entering credentials.

**Refresh token rotation:** each refresh token can only be used once. When used, the old token is deleted and a new one is created. This limits the damage of a compromised token — if an attacker uses a stolen token, the legitimate user's next refresh will fail, signaling a potential breach.

**Files:**
- `src/modules/auth/auth.service.js` (token generation and rotation)
- `src/middlewares/authenticate.js` (token verification)

---

## 13. Route-Level Authentication Boundary

Protected and public routes are separated by middleware registration order in `app.js`:

```javascript
// Public routes (before authenticate)
app.use("/api/auth", authRoutes);

// Authentication barrier
app.use(authenticate(jwtSecret));

// Protected routes (after authenticate)
app.use("/api/books", bookRoutes);
```

This approach applies authentication to all routes registered after the middleware, without needing to add `authenticate` to each individual route. Adding a new protected module only requires registering it after the barrier.

**File:** `src/app.js`

---

## Pattern Summary

| Pattern | Where | Why |
|---|---|---|
| Layered Architecture | `modules/*/*.js` | Separation of concerns |
| Dependency Injection | Factory functions + routes files | Testability, loose coupling |
| Repository Pattern | `*.repository.js` | Decouple business logic from ORM |
| Composition Root | `*.routes.js` | Single wiring point per module |
| Singleton | `lib/prisma.js` | Shared database connection |
| Factory Functions | All layers | Idiomatic JS, avoids `this` issues |
| Middleware | `middlewares/*.js` | Cross-cutting concerns |
| Centralized Errors | `errorHandler.js` + `AppError.js` | Consistent error responses |
| Schema Validation / DTO | `*.schema.js` + `validate.js` | Input sanitization at the edge |
| Feature-First Modules | `modules/` directory | Scalable organization |
| App / Server Separation | `app.js` + `server.js` | Testability |
| Access + Refresh Tokens | `auth.service.js` + `authenticate.js` | Secure, stateless authentication |
| Route-Level Auth Boundary | `app.js` middleware order | Clean public/protected separation |

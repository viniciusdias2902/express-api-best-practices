# Design Patterns

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
- `src/modules/book/book.controller.js`
- `src/modules/book/book.service.js`
- `src/modules/book/book.repository.js`

---

## 2. Dependency Injection (Manual / Factory-Based)

Each layer is a **factory function** that receives its dependencies as parameters. No DI container is needed — the wiring is explicit and easy to follow.

```javascript
// src/modules/book/book.routes.js (composition root)
const repository = createBookRepository(prisma);
const service = createBookService(repository);
const controller = createBookController(service);
```

This makes every layer independently testable by simply passing mock objects instead of real implementations.

**Files:**
- `src/modules/book/book.routes.js` (composition root)
- All factory functions across the module

---

## 3. Repository Pattern

All database access is encapsulated behind a clean interface (`create`, `findMany`, `findById`, `findByIsbn`, `update`, `delete`). The service layer never interacts with Prisma directly — it only calls repository methods.

This decouples business logic from the specific ORM or database being used.

**File:** `src/modules/book/book.repository.js`

---

## 4. Composition Root

The dependency graph is assembled in a single place — the routes file. This is the **only** file that imports the Prisma singleton and wires all layers together. Everything else receives its dependencies from the outside.

**File:** `src/modules/book/book.routes.js`

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

**Files:** All files under `src/modules/book/`

---

## 7. Middleware Pattern

Express middlewares are used for cross-cutting concerns that should not live inside business logic:

- **Validation middleware** — a factory that takes a Zod schema and returns a middleware function that validates `req.body` before it reaches the controller.
- **Error handler middleware** — a centralized 4-argument Express middleware that catches all errors and sends appropriate HTTP responses.

**Files:**
- `src/middlewares/validate.js`
- `src/middlewares/errorHandler.js`

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

Zod schemas act as Data Transfer Objects (DTOs), defining the exact shape of valid input. The `createBookSchema` defines required fields, while `updateBookSchema` is derived from it using `.partial()` with a refinement that requires at least one field.

This ensures input is validated and sanitized before reaching the controller — the parsed output replaces the raw `req.body`.

**File:** `src/modules/book/book.schema.js`

---

## 10. Feature-First Module Organization

Code is organized **by feature** (e.g., `modules/book/`) rather than by technical layer (e.g., `controllers/`, `services/`). Each module is self-contained with its own routes, controller, service, repository, schemas, and tests.

Adding a new feature means creating a new folder under `modules/` — no need to touch multiple top-level directories.

```
src/modules/
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

## Pattern Summary

| Pattern | Where | Why |
|---|---|---|
| Layered Architecture | `modules/book/*.js` | Separation of concerns |
| Dependency Injection | Factory functions + routes file | Testability, loose coupling |
| Repository Pattern | `book.repository.js` | Decouple business logic from ORM |
| Composition Root | `book.routes.js` | Single wiring point |
| Singleton | `lib/prisma.js` | Shared database connection |
| Factory Functions | All layers | Idiomatic JS, avoids `this` issues |
| Middleware | `middlewares/*.js` | Cross-cutting concerns |
| Centralized Errors | `errorHandler.js` + `AppError.js` | Consistent error responses |
| Schema Validation / DTO | `book.schema.js` + `validate.js` | Input sanitization at the edge |
| Feature-First Modules | `modules/` directory | Scalable organization |
| App / Server Separation | `app.js` + `server.js` | Testability |

---

---

# Padrões de Projeto (Português)

Este documento descreve os padrões de projeto e decisões arquiteturais utilizados neste projeto, com referências aos arquivos reais do código-fonte.

---

## 1. Arquitetura em Camadas (3 Camadas)

A aplicação é dividida em três camadas distintas com fronteiras rígidas. Cada camada tem uma única responsabilidade e só se comunica com sua vizinha imediata.

```
Controller (HTTP) → Service (Lógica de Negócio) → Repository (Acesso a Dados) → Banco de Dados
```

- **Controller** — traduz requisições/respostas HTTP. Não sabe nada sobre o banco de dados.
- **Service** — aplica regras de negócio. Não sabe nada sobre HTTP ou Prisma.
- **Repository** — encapsula queries do banco. Não sabe nada sobre regras de negócio ou HTTP.

**Arquivos:**
- `src/modules/book/book.controller.js`
- `src/modules/book/book.service.js`
- `src/modules/book/book.repository.js`

---

## 2. Injeção de Dependências (Manual / Baseada em Factory)

Cada camada é uma **factory function** que recebe suas dependências como parâmetros. Nenhum container de DI é necessário — a composição é explícita e fácil de seguir.

```javascript
// src/modules/book/book.routes.js (composition root)
const repository = createBookRepository(prisma);
const service = createBookService(repository);
const controller = createBookController(service);
```

Isso torna cada camada testável de forma independente, bastando passar objetos mock no lugar das implementações reais.

**Arquivos:**
- `src/modules/book/book.routes.js` (composition root)
- Todas as factory functions do módulo

---

## 3. Padrão Repository

Todo o acesso ao banco de dados é encapsulado por trás de uma interface limpa (`create`, `findMany`, `findById`, `findByIsbn`, `update`, `delete`). A camada de serviço nunca interage diretamente com o Prisma — ela apenas chama métodos do repository.

Isso desacopla a lógica de negócio do ORM ou banco de dados específico sendo utilizado.

**Arquivo:** `src/modules/book/book.repository.js`

---

## 4. Composition Root

O grafo de dependências é montado em um único lugar — o arquivo de rotas. Este é o **único** arquivo que importa o singleton do Prisma e conecta todas as camadas. Todo o resto recebe suas dependências de fora.

**Arquivo:** `src/modules/book/book.routes.js`

---

## 5. Padrão Singleton

O `PrismaClient` é instanciado uma única vez e compartilhado por toda a aplicação. Isso evita a criação de múltiplos pools de conexão com o banco de dados.

**Arquivo:** `src/lib/prisma.js`

---

## 6. Padrão Factory Function

Em vez de classes, cada camada exporta uma factory function que retorna um objeto simples com métodos. Isso é JavaScript idiomático e evita problemas com `this`, mantendo o código simples e funcional.

```javascript
export function createBookService(repository) {
  return {
    async create(data) { /* ... */ },
    async findAll(query) { /* ... */ },
    // ...
  };
}
```

**Arquivos:** Todos os arquivos em `src/modules/book/`

---

## 7. Padrão Middleware

Middlewares do Express são usados para preocupações transversais que não devem estar dentro da lógica de negócio:

- **Middleware de validação** — uma factory que recebe um schema Zod e retorna um middleware que valida o `req.body` antes de chegar ao controller.
- **Middleware de erro** — um middleware centralizado com 4 argumentos do Express que captura todos os erros e envia respostas HTTP apropriadas.

**Arquivos:**
- `src/middlewares/validate.js`
- `src/middlewares/errorHandler.js`

---

## 8. Tratamento Centralizado de Erros

Todos os erros fluem através do `next(error)` para um único handler de erros. O handler categoriza os erros por tipo e responde adequadamente:

| Tipo de Erro | Status HTTP | Detecção |
|---|---|---|
| Erro de validação | 400 | Possui propriedade `details` |
| Constraint única do Prisma (P2002) | 409 | Código de erro do Prisma |
| Não encontrado do Prisma (P2025) | 404 | Código de erro do Prisma |
| AppError | Dinâmico | Possui propriedade `statusCode` |
| Desconhecido | 500 | Fallback (mensagem genérica, sem vazamento) |

Isso elimina blocos `try/catch` espalhados e garante respostas de erro consistentes.

**Arquivos:**
- `src/errors/AppError.js`
- `src/middlewares/errorHandler.js`

---

## 9. Validação de Schema / Padrão DTO

Schemas Zod atuam como Data Transfer Objects (DTOs), definindo a forma exata de uma entrada válida. O `createBookSchema` define campos obrigatórios, enquanto o `updateBookSchema` é derivado dele usando `.partial()` com um refinamento que exige pelo menos um campo.

Isso garante que a entrada é validada e sanitizada antes de chegar ao controller — o resultado do parse substitui o `req.body` original.

**Arquivo:** `src/modules/book/book.schema.js`

---

## 10. Organização por Feature (Feature-First)

O código é organizado **por funcionalidade** (ex: `modules/book/`) em vez de por camada técnica (ex: `controllers/`, `services/`). Cada módulo é autocontido com suas próprias rotas, controller, service, repository, schemas e testes.

Adicionar uma nova funcionalidade significa criar uma nova pasta em `modules/` — sem precisar mexer em múltiplos diretórios de nível superior.

```
src/modules/
└── book/
    ├── book.schema.js
    ├── book.repository.js
    ├── book.service.js
    ├── book.controller.js
    ├── book.routes.js
    └── __tests__/
```

---

## 11. Separação App / Server

A configuração da aplicação Express (`app.js`) é separada da inicialização do servidor HTTP (`server.js`). Isso permite importar o `app` em testes (ex: com `supertest`) sem realmente iniciar o servidor.

**Arquivos:**
- `src/app.js`
- `src/server.js`

---

## Resumo dos Padrões

| Padrão | Onde | Por quê |
|---|---|---|
| Arquitetura em Camadas | `modules/book/*.js` | Separação de responsabilidades |
| Injeção de Dependências | Factory functions + arquivo de rotas | Testabilidade, baixo acoplamento |
| Padrão Repository | `book.repository.js` | Desacoplar lógica de negócio do ORM |
| Composition Root | `book.routes.js` | Ponto único de composição |
| Singleton | `lib/prisma.js` | Conexão compartilhada com o banco |
| Factory Functions | Todas as camadas | JS idiomático, evita problemas com `this` |
| Middleware | `middlewares/*.js` | Preocupações transversais |
| Erros Centralizados | `errorHandler.js` + `AppError.js` | Respostas de erro consistentes |
| Validação / DTO | `book.schema.js` + `validate.js` | Sanitização de entrada na borda |
| Módulos por Feature | Diretório `modules/` | Organização escalável |
| Separação App / Server | `app.js` + `server.js` | Testabilidade |

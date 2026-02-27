# Learning API

> **Disclaimer:** This is **not** a real-world production project. It is a simple REST API built entirely by artificial intelligence, designed as a hands-on reference for studying modern backend development practices used in the industry.

## Purpose

This project exists solely for **educational purposes**. It demonstrates how to structure a Node.js REST API following widely adopted conventions and best practices — from layered architecture and dependency injection to input validation and centralized error handling.

If you are learning backend development, use this codebase as a reference to understand **why** things are organized the way they are, not just **how**.

## Tech Stack

| Technology | Version | Role |
|---|---|---|
| Node.js | 22+ | Runtime (native ES Modules) |
| Express | 5 | HTTP framework |
| Prisma | 7 | ORM / data access |
| PostgreSQL | — | Relational database |
| Zod | 4 | Schema validation |
| Jest | 30 | Testing framework |
| Argon2 | — | Password hashing (planned) |
| Jose | — | JWT handling (planned) |

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
│   └── errorHandler.js    # Global error handler
└── modules/
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

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Returns API status |

### Books

| Method | Path | Description |
|---|---|---|
| POST | `/api/books` | Create a book |
| GET | `/api/books` | List books (paginated, searchable, filterable) |
| GET | `/api/books/:id` | Get a book by ID |
| PUT | `/api/books/:id` | Update a book |
| DELETE | `/api/books/:id` | Delete a book |

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL

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
- **[GUIDE.md](./GUIDE.md)** — In-depth educational guide (Portuguese)

---

# Leia-me (Português)

> **Aviso:** Este **não** é um projeto real de produção. É uma API REST simples construída inteiramente por inteligência artificial, criada como referência prática para o estudo de práticas modernas de desenvolvimento backend utilizadas no mercado.

## Objetivo

Este projeto existe exclusivamente para **fins educacionais**. Ele demonstra como estruturar uma API REST em Node.js seguindo convenções e boas práticas amplamente adotadas — desde arquitetura em camadas e injeção de dependências até validação de entrada e tratamento centralizado de erros.

Se você está aprendendo desenvolvimento backend, use este código como referência para entender **por que** as coisas são organizadas dessa forma, não apenas **como**.

## Stack Tecnológica

| Tecnologia | Versão | Função |
|---|---|---|
| Node.js | 22+ | Runtime (ES Modules nativo) |
| Express | 5 | Framework HTTP |
| Prisma | 7 | ORM / acesso a dados |
| PostgreSQL | — | Banco de dados relacional |
| Zod | 4 | Validação de schemas |
| Jest | 30 | Framework de testes |
| Argon2 | — | Hash de senhas (planejado) |
| Jose | — | Manipulação de JWT (planejado) |

## Estrutura do Projeto

```
src/
├── server.js              # Ponto de entrada — inicia o servidor HTTP
├── app.js                 # Configuração do Express e pipeline de middlewares
├── lib/
│   └── prisma.js          # Singleton do PrismaClient
├── errors/
│   └── AppError.js        # Classe de erro customizada
├── middlewares/
│   ├── validate.js        # Middleware de validação com Zod
│   └── errorHandler.js    # Handler global de erros
└── modules/
    └── book/
        ├── book.schema.js       # Schemas de validação (DTOs)
        ├── book.repository.js   # Camada de acesso a dados
        ├── book.service.js      # Camada de lógica de negócio
        ├── book.controller.js   # Camada HTTP
        ├── book.routes.js       # Rotas + composição de dependências
        └── __tests__/           # Testes unitários
```

## Endpoints da API

### Health Check

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | Retorna o status da API |

### Livros

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/books` | Criar um livro |
| GET | `/api/books` | Listar livros (paginado, com busca e filtros) |
| GET | `/api/books/:id` | Buscar um livro por ID |
| PUT | `/api/books/:id` | Atualizar um livro |
| DELETE | `/api/books/:id` | Excluir um livro |

## Como Começar

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com a URL do seu banco de dados

# Executar migrações do banco
npm run prisma:migrate

# Gerar o Prisma Client
npm run prisma:generate

# Iniciar em modo de desenvolvimento
npm run dev

# Executar testes
npm test
```

## Documentação

- **[PATTERNS.md](./PATTERNS.md)** — Padrões de projeto utilizados (em inglês e português)
- **[GUIDE.md](./GUIDE.md)** — Guia educacional detalhado (em português)

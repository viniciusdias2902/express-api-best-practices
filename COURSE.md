# Curso: Construindo uma API REST Profissional com Express

> Um curso completo, do zero ao deploy, sobre como construir uma API seguindo as melhores praticas do mercado. Sim, e over engineering proposital - o objetivo e aprender os padroes que voce vai encontrar em projetos reais.

---

## Indice

### Parte 1 - Fundamentos e Setup

1. [Pre-requisitos](#capitulo-1--pre-requisitos)
2. [Iniciando o projeto do zero](#capitulo-2--iniciando-o-projeto-do-zero)
3. [Entendendo ESM vs CommonJS](#capitulo-3--entendendo-esm-vs-commonjs)
4. [Express 5: o servidor HTTP](#capitulo-4--express-5-o-servidor-http)
5. [Separando app.js e server.js](#capitulo-5--separando-appjs-e-serverjs)

### Parte 2 - Banco de Dados com Prisma 7

6. [Configurando o Prisma 7](#capitulo-6--configurando-o-prisma-7)
7. [Criando o schema e as migrations](#capitulo-7--criando-o-schema-e-as-migrations)
8. [O singleton do PrismaClient](#capitulo-8--o-singleton-do-prismaclient)

### Parte 3 - Arquitetura em Camadas

9. [Por que separar em camadas?](#capitulo-9--por-que-separar-em-camadas)
10. [Repository: a camada de dados](#capitulo-10--repository-a-camada-de-dados)
11. [Service: a camada de logica de negocio](#capitulo-11--service-a-camada-de-logica-de-negocio)
12. [Controller: a camada HTTP](#capitulo-12--controller-a-camada-http)
13. [Routes e a Composition Root](#capitulo-13--routes-e-a-composition-root)

### Parte 4 - Validacao e Seguranca

14. [Validacao com Zod](#capitulo-14--validacao-com-zod)
15. [O middleware de validacao](#capitulo-15--o-middleware-de-validacao)
16. [Tratamento centralizado de erros](#capitulo-16--tratamento-centralizado-de-erros)
17. [Middlewares de seguranca (Helmet, CORS, Rate Limit)](#capitulo-17--middlewares-de-seguranca)

### Parte 5 - Autenticacao

18. [Modelando User e RefreshToken no Prisma](#capitulo-18--modelando-user-e-refreshtoken-no-prisma)
19. [O modulo de autenticacao](#capitulo-19--o-modulo-de-autenticacao)
20. [JWT e refresh tokens: a estrategia completa](#capitulo-20--jwt-e-refresh-tokens)
21. [O middleware de autenticacao](#capitulo-21--o-middleware-de-autenticacao)
22. [Protegendo rotas: publicas vs privadas](#capitulo-22--protegendo-rotas)

### Parte 6 - Testes

23. [Configurando o Vitest](#capitulo-23--configurando-o-vitest)
24. [Testando o Repository](#capitulo-24--testando-o-repository)
25. [Testando o Service](#capitulo-25--testando-o-service)
26. [Testando o Controller](#capitulo-26--testando-o-controller)
27. [Mocks de modulos ESM (argon2, jose)](#capitulo-27--mocks-de-modulos-esm)

### Parte 7 - Visao Geral

28. [Recapitulacao: o fluxo completo de uma request](#capitulo-28--recapitulacao)
29. [Proximos passos](#capitulo-29--proximos-passos)

---

# Parte 1 - Fundamentos e Setup

---

## Capitulo 1 — Pre-requisitos

### O que voce precisa ter instalado

| Ferramenta | Versao minima | Para que serve |
|------------|---------------|----------------|
| **Node.js** | 22+ | Runtime JavaScript |
| **npm** | 10+ | Gerenciador de pacotes (vem com o Node) |
| **PostgreSQL** | Qualquer | Banco de dados relacional |

Para o banco de dados, voce pode usar um PostgreSQL local ou um servico em nuvem como [Neon](https://neon.tech) (tem plano gratuito). Neste curso, usaremos uma connection string — nao importa onde o banco esta rodando.

### Ferramentas recomendadas

- **VS Code** com a extensao Prisma (para syntax highlighting do schema)
- **Postman**, **Insomnia** ou **curl** para testar os endpoints
- **Terminal** (qualquer um serve)

### O que voce precisa saber

- JavaScript basico (funcoes, async/await, objetos, arrays)
- O que e HTTP (verbos GET, POST, PUT, DELETE)
- O basico de terminal (criar pastas, rodar comandos)

Nao precisa saber Express, Prisma, Zod ou qualquer outra biblioteca. Vamos aprender tudo do zero.

---

## Capitulo 2 — Iniciando o projeto do zero

### Passo 1: Criar a pasta e inicializar

```bash
mkdir learning-api
cd learning-api
npm init -y
```

O `npm init -y` cria um `package.json` com valores padrao. Vamos edita-lo.

### Passo 2: Configurar o package.json

Abra o `package.json` e deixe-o assim:

```json
{
  "name": "learning-api",
  "version": "1.0.0",
  "description": "API REST educacional para aprender arquitetura em camadas com Prisma 7, Express e Zod",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "test": "vitest run",
    "prisma:generate": "npx prisma generate",
    "prisma:migrate": "npx prisma migrate dev",
    "prisma:studio": "npx prisma studio"
  }
}
```

**O que cada campo faz:**

- `"type": "module"` — ativa ES Modules (ESM). Veremos por que no proximo capitulo.
- `"dev"` — roda o servidor com `--watch`, que reinicia automaticamente quando voce salva um arquivo (recurso nativo do Node 22+, sem precisar do nodemon).
- `"start"` — roda em producao (sem watch).
- `"test"` — roda os testes com Vitest.
- `"prisma:*"` — atalhos para os comandos do Prisma.

### Passo 3: Instalar as dependencias

```bash
# Dependencias de producao
npm install express@5 helmet cors express-rate-limit dotenv zod prisma @prisma/client @prisma/adapter-pg pg argon2 jose

# Dependencias de desenvolvimento
npm install -D vitest prisma
```

**O que cada pacote faz:**

| Pacote | Tipo | Finalidade |
|--------|------|-----------|
| `express@5` | Producao | Framework HTTP (versao 5, a mais recente) |
| `helmet` | Producao | Headers HTTP de seguranca |
| `cors` | Producao | Permite requests cross-origin |
| `express-rate-limit` | Producao | Limita requests por IP |
| `dotenv` | Producao | Carrega variaveis do arquivo `.env` |
| `zod` | Producao | Validacao de dados |
| `@prisma/client` | Producao | ORM para acesso ao banco |
| `@prisma/adapter-pg` | Producao | Adapter do Prisma para o driver `pg` |
| `pg` | Producao | Driver nativo do PostgreSQL para Node.js |
| `argon2` | Producao | Hash de senhas (mais seguro que bcrypt) |
| `jose` | Producao | Criacao e verificacao de JWTs |
| `vitest` | Dev | Framework de testes |
| `prisma` | Dev | CLI do Prisma (migrations, generate) |

### Passo 4: Criar o .env

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
PORT=3000

# JWT
JWT_SECRET="troque-para-um-segredo-forte-em-producao"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN_DAYS=7
```

E um `.env.example` (este vai para o git — serve de modelo para outros devs):

```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
PORT=3000
JWT_SECRET="troque-para-um-segredo-forte-em-producao"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN_DAYS=7
```

### Passo 5: Criar o .gitignore

```gitignore
node_modules/
generated/
.env
```

Tres regras simples:
- `node_modules/` — dependencias (todo mundo roda `npm install`)
- `generated/` — codigo gerado pelo Prisma (sera regenerado com `npx prisma generate`)
- `.env` — segredos (nunca devem ir para o repositorio)

### Passo 6: Criar a estrutura de pastas

```bash
mkdir -p src/lib src/errors src/middlewares src/modules/book src/modules/auth
```

A estrutura final sera:

```
src/
├── app.js                  # Configuracao do Express
├── server.js               # Ponto de entrada (escuta a porta)
├── lib/
│   └── prisma.js           # Instancia singleton do Prisma
├── errors/
│   └── AppError.js         # Classe de erro customizada
├── middlewares/
│   ├── validate.js         # Middleware de validacao Zod
│   ├── authenticate.js     # Middleware de autenticacao JWT
│   └── errorHandler.js     # Middleware global de erros
└── modules/
    ├── auth/               # Tudo sobre autenticacao
    └── book/               # Tudo sobre livros
```

**Por que `modules/` e nao `controllers/`, `services/`, `repositories/`?**

Isso e organizacao **feature-first** vs **layer-first**. Veja a diferenca:

```
# Layer-first (comum em tutoriais)        # Feature-first (usado no mercado)
src/                                       src/
├── controllers/                           └── modules/
│   ├── bookController.js                      ├── book/
│   └── authController.js                      │   ├── book.controller.js
├── services/                                  │   ├── book.service.js
│   ├── bookService.js                         │   ├── book.repository.js
│   └── authService.js                         │   └── book.routes.js
├── repositories/                              └── auth/
│   ├── bookRepository.js                          ├── auth.controller.js
│   └── authRepository.js                          ├── auth.service.js
└── routes/                                        ├── auth.repository.js
    ├── bookRoutes.js                              └── auth.routes.js
    └── authRoutes.js
```

No feature-first, tudo sobre "book" vive em `modules/book/`. Para entender o modulo, voce olha uma pasta so. Para adicionar um novo modulo (`modules/author/`), nenhum arquivo existente e alterado. Frameworks como NestJS usam esse padrao por default.

---

## Capitulo 3 — Entendendo ESM vs CommonJS

Antes de escrever qualquer codigo, precisamos entender o sistema de modulos que vamos usar.

### CommonJS (o antigo)

```javascript
// Importar
const express = require("express");

// Exportar
module.exports = { app };
```

Este era o padrao do Node.js desde sua criacao. Ainda funciona, ainda e usado em milhoes de projetos. Mas nao e mais o padrao da linguagem JavaScript.

### ES Modules (o moderno)

```javascript
// Importar
import express from "express";

// Exportar
export { app };
```

Este e o padrao oficial do JavaScript (ECMAScript). Funciona no browser e no Node.js.

### Por que usamos ESM neste projeto

1. **E o padrao da linguagem** — CommonJS e especifico do Node.js; ESM e universal
2. **O Prisma 7 exige** — o Prisma Client gerado usa `import`/`export`
3. **Top-level await** — ESM permite `await` fora de funcoes async
4. **O mercado esta migrando** — bibliotecas novas sao ESM-first

### Como ativar

A unica coisa necessaria e adicionar `"type": "module"` no `package.json`. Ja fizemos isso no capitulo anterior.

A partir de agora, todos os nossos arquivos `.js` usam `import`/`export`.

---

## Capitulo 4 — Express 5: o servidor HTTP

### O que e o Express

Express e um framework web minimalista para Node.js. Ele recebe requests HTTP e permite que voce defina o que fazer com cada uma.

Sem Express, voce precisaria usar o modulo `http` nativo do Node:

```javascript
// Sem Express — verboso e manual
import http from "node:http";

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(3000);
```

Com Express:

```javascript
import express from "express";
const app = express();

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(3000);
```

Muito mais limpo. O Express cuida do parsing, do roteamento, do content-type, e muito mais.

### Express 5 vs Express 4

Estamos usando o Express 5, a versao mais recente. As principais diferencas em relacao ao Express 4:

- Handlers `async` propagam erros automaticamente para o error handler
- `req.query` retorna um objeto simples (nao herda de `Object.prototype`)
- Remocao de metodos deprecados

Para o nosso caso, a diferenca principal e que erros em funcoes `async` sao capturados automaticamente — nao precisamos de wrappers como `express-async-errors`.

### O conceito de Middleware

Middleware e o conceito mais importante do Express. Um middleware e uma funcao que:

1. Recebe a request (`req`)
2. Pode modificar a request ou response
3. Decide se passa para o proximo middleware (`next()`) ou responde diretamente

```javascript
// Um middleware simples que loga todas as requests
function logger(req, res, next) {
  console.log(`${req.method} ${req.url}`);
  next(); // Passa para o proximo middleware
}

app.use(logger);
```

Middlewares rodam na **ordem em que sao registrados**. Isso e fundamental.

---

## Capitulo 5 — Separando app.js e server.js

Este e o primeiro padrao de boas praticas que vamos aplicar.

### O problema: tudo em um arquivo

Em tutoriais simples, voce ve:

```javascript
// server.js — tudo junto
import express from "express";
const app = express();

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(3000, () => console.log("Rodando na porta 3000"));
```

Funciona. Mas e impossivel importar `app` em testes sem subir o servidor HTTP.

### A solucao: dois arquivos

**`src/app.js`** — configura o Express (middlewares, rotas). Nao escuta porta.

```javascript
import express from "express";

const app = express();

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export { app };
```

**`src/server.js`** — ponto de entrada. Apenas importa o app e escuta a porta.

```javascript
import "dotenv/config";
import { app } from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
```

**Por que `import "dotenv/config"` no server.js?**

Essa linha carrega as variaveis do arquivo `.env` para `process.env`. Colocamos no ponto de entrada para que todas as variaveis estejam disponiveis antes de qualquer modulo ser carregado.

### Testando

Rode o servidor:

```bash
npm run dev
```

Abra o navegador em `http://localhost:3000/api/health`. Voce deve ver:

```json
{
  "status": "ok",
  "timestamp": "2026-02-27T00:00:00.000Z"
}
```

Pronto. Seu servidor Express esta rodando.

---

# Parte 2 - Banco de Dados com Prisma 7

---

## Capitulo 6 — Configurando o Prisma 7

### O que e o Prisma

Prisma e um ORM (Object-Relational Mapping). Ele permite que voce interaja com o banco de dados usando objetos JavaScript ao inves de escrever SQL manualmente:

```javascript
// Sem ORM (SQL puro)
const result = await pool.query(
  'SELECT * FROM "Book" WHERE "isbn" = $1',
  [isbn]
);
const book = result.rows[0];

// Com Prisma
const book = await prisma.book.findUnique({ where: { isbn } });
```

### Por que Prisma 7 e diferente

Se voce ja viu tutoriais com Prisma 5 ou 6, prepare-se: a versao 7 mudou bastante. As diferencas principais:

| Aspecto | Prisma 5/6 | Prisma 7 |
|---------|-----------|----------|
| Engine | Binario Rust (30-50MB) | Driver nativo do Node.js |
| Driver | Interno | Adapter obrigatorio (`@prisma/adapter-pg`) |
| Generator | `prisma-client-js` | `prisma-client` |
| Output | `node_modules/.prisma` | Pasta explicita (ex: `generated/prisma`) |
| Modulos | CJS ou ESM | ESM obrigatorio |
| Config | `env("DATABASE_URL")` no schema | `prisma.config.mjs` em JavaScript |
| Env vars | Carregadas automaticamente | Carregamento manual (`dotenv/config`) |

### Passo 1: Inicializar o Prisma

```bash
npx prisma init
```

Isso cria dois arquivos:
- `prisma/schema.prisma` — o schema do banco
- `.env` — com uma `DATABASE_URL` de exemplo

### Passo 2: Criar o prisma.config.mjs

O Prisma 7 usa um arquivo de configuracao JavaScript. Crie `prisma.config.mjs` na raiz:

```javascript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
```

**Por que `.mjs`?** Garante que o arquivo e tratado como ESM independente do `package.json`.

**Por que a URL saiu do schema?** O schema Prisma (PSL) e uma linguagem propria com limitacoes. Com JavaScript, voce pode usar logica real: ler de diferentes fontes, fazer condicionais por ambiente, etc.

**`import "dotenv/config"`** — no Prisma 7, variaveis de ambiente nao sao carregadas automaticamente. Essa linha e obrigatoria.

### Passo 3: Configurar o schema.prisma

Abra `prisma/schema.prisma` e deixe assim:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

Duas coisas mudaram em relacao ao Prisma 5/6:

1. **`provider = "prisma-client"`** — era `prisma-client-js`. O novo provider gera codigo ESM.
2. **`output = "../generated/prisma"`** — obrigatorio. O client nao vai mais para `node_modules`. Voce sabe exatamente onde esta o codigo gerado.

Note que nao tem `url = env("DATABASE_URL")` no datasource. A URL agora vive no `prisma.config.mjs`.

---

## Capitulo 7 — Criando o schema e as migrations

### O modelo Book

Adicione ao `prisma/schema.prisma`:

```prisma
model Book {
  id          String   @id @default(uuid())
  title       String
  author      String
  isbn        String   @unique
  genre       String
  pages       Int
  publishedAt DateTime
  synopsis    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Vamos entender cada campo:**

| Campo | Tipo | Detalhes |
|-------|------|---------|
| `id` | `String` | Chave primaria. `@default(uuid())` gera um UUID automaticamente. |
| `title` | `String` | Obrigatorio (sem `?`). |
| `isbn` | `String` | `@unique` — o banco rejeita duplicatas. |
| `synopsis` | `String?` | O `?` torna nullable. |
| `createdAt` | `DateTime` | `@default(now())` preenche automaticamente. |
| `updatedAt` | `DateTime` | `@updatedAt` atualiza automaticamente a cada update. |

**Por que UUID ao inves de auto-increment?**
- Nao expoe quantos registros existem (seguranca)
- Pode ser gerado no client-side
- Nao ha conflito em sistemas distribuidos

### Gerando a migration

```bash
npm run prisma:migrate
```

O Prisma vai:
1. Comparar o schema com o estado do banco
2. Gerar um arquivo SQL em `prisma/migrations/`
3. Executar o SQL no banco
4. Gerar o Prisma Client em `generated/prisma/`

De um nome para a migration, como `init`.

Olhe o arquivo gerado em `prisma/migrations/*/migration.sql` — e SQL puro:

```sql
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "pages" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "synopsis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Book_isbn_key" ON "Book"("isbn");
```

O Prisma gerou isso para voce.

---

## Capitulo 8 — O singleton do PrismaClient

### O problema: multiplas conexoes

Cada `PrismaClient` abre um **pool de conexoes** com o banco. Se voce criar uma instancia em cada arquivo:

```javascript
// NÃO faca isso
// book.repository.js
import { PrismaClient } from "../../generated/prisma/client.ts";
const prisma = new PrismaClient({ adapter: new PrismaPg(...) });

// auth.repository.js
import { PrismaClient } from "../../generated/prisma/client.ts";
const prisma = new PrismaClient({ adapter: new PrismaPg(...) }); // OUTRA instancia!
```

Cada instancia abre seu proprio pool. O banco tem um limite de conexoes simultaneas (geralmente 20-100). Com muitos modulos, voce esgota esse limite rapidamente.

### A solucao: singleton

Crie `src/lib/prisma.js`:

```javascript
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export { prisma };
```

**Linha por linha:**

1. `import "dotenv/config"` — carrega as variaveis de ambiente (necessario para `DATABASE_URL`)
2. `PrismaPg` — o adapter que conecta o Prisma ao driver nativo `pg` do PostgreSQL
3. `PrismaClient` — importado do codigo gerado (nao de `@prisma/client`)
4. `new PrismaPg(...)` — cria o adapter com a connection string
5. `new PrismaClient({ adapter })` — cria o client usando o adapter
6. `export { prisma }` — exporta a instancia unica

Agora, todo arquivo que precisar do Prisma importa de `src/lib/prisma.js`:

```javascript
import { prisma } from "../../lib/prisma.js";
```

Uma unica instancia. Um unico pool de conexoes. Problema resolvido.

---

# Parte 3 - Arquitetura em Camadas

---

## Capitulo 9 — Por que separar em camadas?

### O "jeito facil" que nao escala

A maioria dos tutoriais de Express faz assim:

```javascript
// Tudo em um arquivo — NÃO faca isso em projetos reais
app.post("/api/books", async (req, res) => {
  // Validacao
  if (!req.body.title) return res.status(400).json({ error: "Titulo obrigatorio" });

  // Regra de negocio
  const existing = await prisma.book.findUnique({ where: { isbn: req.body.isbn } });
  if (existing) return res.status(409).json({ error: "ISBN ja existe" });

  // Acesso ao banco
  const book = await prisma.book.create({ data: req.body });

  // Resposta
  res.status(201).json(book);
});
```

Funciona? Sim. Problemas:

1. **Impossivel testar** sem subir o Express e ter um banco real
2. **Impossivel reusar** a logica (outro endpoint precisa verificar ISBN?)
3. **Dificil de manter** — uma mudanca no banco pode quebrar a rota, a validacao e a logica
4. **Cresce rapido** — com 10 entidades e CRUD completo, esse arquivo teria centenas de linhas

### A solucao: tres camadas

```
Request HTTP
    |
    v
+-------------------+
|   Controller      |  Recebe req, chama service, envia res
+--------+----------+
         |
         v
+-------------------+
|   Service         |  Logica de negocio (ISBN existe? Livro existe?)
+--------+----------+
         |
         v
+-------------------+
|   Repository      |  Acessa o banco de dados (fala "Prisma")
+--------+----------+
         |
         v
    Banco de Dados
```

Cada camada tem uma **unica responsabilidade** e **ignora** os detalhes das outras:

| Camada | Sabe | Nao sabe |
|--------|------|----------|
| **Controller** | HTTP (req, res, status codes) | Prisma, PostgreSQL, SQL |
| **Service** | Regras de negocio | HTTP, Express, banco de dados |
| **Repository** | Prisma, queries | Regras de negocio, HTTP |

Essa ignorancia e intencional. Se amanha voce trocar o Prisma por Drizzle, **so os repositories mudam**. Services e controllers nem percebem.

### Injecao de dependencia: a cola entre as camadas

Para que cada camada nao conheca os detalhes da outra, usamos **injecao de dependencia**: ao inves de um modulo criar sua propria dependencia, ele a recebe de fora.

```javascript
// SEM injecao — acoplamento direto
import { prisma } from "../lib/prisma.js";

export const bookService = {
  async create(data) {
    return prisma.book.create({ data }); // Preso ao Prisma para sempre
  }
};
```

```javascript
// COM injecao — desacoplamento
export function createBookService(repository) {
  return {
    async create(data) {
      return repository.create(data); // Nao sabe se e Prisma, mock ou outro ORM
    }
  };
}
```

A versao com injecao:
- Nos testes, recebe um mock
- Na aplicacao real, recebe o repository com Prisma
- Se trocar o ORM, so o repository muda

Vamos construir cada camada agora.

---

## Capitulo 10 — Repository: a camada de dados

O repository e a camada mais simples. Ele apenas traduz operacoes para a linguagem do Prisma.

### Criando o Book Repository

Crie `src/modules/book/book.repository.js`:

```javascript
export function createBookRepository(prisma) {
  return {
    async create(data) {
      return prisma.book.create({ data });
    },

    async findMany({ skip, take, where, orderBy }) {
      const [books, total] = await prisma.$transaction([
        prisma.book.findMany({ skip, take, where, orderBy }),
        prisma.book.count({ where }),
      ]);

      return [books, total];
    },

    async findById(id) {
      return prisma.book.findUnique({ where: { id } });
    },

    async findByIsbn(isbn) {
      return prisma.book.findUnique({ where: { isbn } });
    },

    async update(id, data) {
      return prisma.book.update({ where: { id }, data });
    },

    async delete(id) {
      return prisma.book.delete({ where: { id } });
    },
  };
}
```

**Pontos importantes:**

1. **Factory function** — `createBookRepository(prisma)` recebe o Prisma por parametro (injecao de dependencia).

2. **`$transaction`** no `findMany` — executa `findMany` e `count` em paralelo dentro de uma transacao. Isso garante que o total corresponde aos dados retornados. Sem a transacao, outro usuario poderia criar um livro entre as duas queries, fazendo o total nao bater com os dados.

3. **Retorna tupla `[books, total]`** — o service precisa de ambos para calcular a paginacao.

4. **Nenhuma logica de negocio** — o repository nao verifica se ISBN ja existe. Isso e trabalho do service.

### O que o repository NAO faz

- Nao valida dados (trabalho do Zod)
- Nao verifica regras de negocio (trabalho do service)
- Nao formata respostas HTTP (trabalho do controller)

Se voce se pegar escrevendo `if` no repository, provavelmente essa logica pertence ao service.

---

## Capitulo 11 — Service: a camada de logica de negocio

O service e o coracao da aplicacao. Ele aplica as regras de negocio.

### Criando a classe AppError

Antes do service, precisamos de uma forma padronizada de representar erros da aplicacao. Crie `src/errors/AppError.js`:

```javascript
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}
```

O `AppError` estende o `Error` nativo e adiciona um `statusCode`. Quando o service detecta uma violacao de regra (ISBN duplicado, livro nao encontrado), ele lanca um `AppError` com o status HTTP adequado. O error handler (que criaremos depois) sabe como tratar isso.

### Criando o Book Service

Crie `src/modules/book/book.service.js`:

```javascript
import { AppError } from "../../errors/AppError.js";

export function createBookService(repository) {
  return {
    async create(data) {
      const existingBook = await repository.findByIsbn(data.isbn);
      if (existingBook) {
        throw new AppError("Ja existe um livro com este ISBN.", 409);
      }

      return repository.create(data);
    },

    async findAll(query) {
      const { page, limit, search, genre, sortBy, order } = query;

      // Calcula o offset para paginacao
      const skip = (page - 1) * limit;

      // Monta os filtros dinamicamente
      const where = {};

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { author: { contains: search, mode: "insensitive" } },
        ];
      }

      if (genre) {
        where.genre = { equals: genre, mode: "insensitive" };
      }

      const orderBy = { [sortBy]: order };

      const [books, total] = await repository.findMany({
        skip,
        take: limit,
        where,
        orderBy,
      });

      return {
        data: books,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },

    async findById(id) {
      const book = await repository.findById(id);
      if (!book) {
        throw new AppError("Livro nao encontrado.", 404);
      }
      return book;
    },

    async update(id, data) {
      const existingBook = await repository.findById(id);
      if (!existingBook) {
        throw new AppError("Livro nao encontrado.", 404);
      }

      // Se esta alterando o ISBN, verifica duplicidade
      if (data.isbn && data.isbn !== existingBook.isbn) {
        const bookWithIsbn = await repository.findByIsbn(data.isbn);
        if (bookWithIsbn) {
          throw new AppError("Ja existe um livro com este ISBN.", 409);
        }
      }

      return repository.update(id, data);
    },

    async delete(id) {
      const existingBook = await repository.findById(id);
      if (!existingBook) {
        throw new AppError("Livro nao encontrado.", 404);
      }

      return repository.delete(id);
    },
  };
}
```

### Analise detalhada de cada metodo

**`create`**: Antes de criar, verifica se ja existe um livro com o mesmo ISBN. Se existir, lanca `AppError` com 409 (Conflict). Se nao, delega a criacao ao repository.

**`findAll`**: Este e o metodo mais complexo. Ele:
1. Calcula o `skip` (offset) a partir de `page` e `limit`. Pagina 3 com 10 por pagina = pula 20.
2. Monta o `where` dinamicamente — so adiciona filtros se eles foram fornecidos.
3. A busca por `search` e case-insensitive e procura em titulo E autor usando `OR`.
4. Retorna os dados E a paginacao (total, totalPages).

**`findById`**: Busca e valida existencia. Se nao encontrar, lanca 404.

**`update`**: Verifica duas coisas:
1. O livro com esse `id` existe?
2. Se o ISBN esta sendo alterado, o novo ISBN ja pertence a outro livro?

Note a verificacao `data.isbn !== existingBook.isbn` — se o usuario enviar o mesmo ISBN que o livro ja tem, nao ha conflito.

**`delete`**: Verifica existencia antes de deletar.

### O que o service NAO faz

- Nao sabe que existe `req` ou `res` (nao importa o Express)
- Nao sabe que o Prisma existe (usa o repository)
- Nao valida formato de dados (o Zod ja fez isso antes)

---

## Capitulo 12 — Controller: a camada HTTP

O controller e o "tradutor" entre HTTP e logica de negocio.

### Criando o Book Controller

Crie `src/modules/book/book.controller.js`:

```javascript
import { listBooksQuerySchema } from "./book.schema.js";

export function createBookController(service) {
  return {
    async create(req, res, next) {
      try {
        const book = await service.create(req.body);
        return res.status(201).json(book);
      } catch (error) {
        next(error);
      }
    },

    async findAll(req, res, next) {
      try {
        const query = listBooksQuerySchema.parse(req.query);
        const result = await service.findAll(query);
        return res.json(result);
      } catch (error) {
        next(error);
      }
    },

    async findById(req, res, next) {
      try {
        const book = await service.findById(req.params.id);
        return res.json(book);
      } catch (error) {
        next(error);
      }
    },

    async update(req, res, next) {
      try {
        const book = await service.update(req.params.id, req.body);
        return res.json(book);
      } catch (error) {
        next(error);
      }
    },

    async delete(req, res, next) {
      try {
        await service.delete(req.params.id);
        return res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  };
}
```

### Padrao do controller

Todo metodo segue o mesmo padrao:

```javascript
async metodo(req, res, next) {
  try {
    // 1. Extrair dados de req (body, params, query)
    // 2. Chamar o service
    // 3. Enviar a response com o status code correto
  } catch (error) {
    next(error); // 4. Repassar erros para o errorHandler
  }
}
```

### Status codes usados

| Operacao | Status | Body |
|----------|--------|------|
| Criar | `201 Created` | O recurso criado |
| Listar | `200 OK` | Lista paginada |
| Buscar por ID | `200 OK` | O recurso |
| Atualizar | `200 OK` | O recurso atualizado |
| Deletar | `204 No Content` | Vazio |

### `next(error)`: o segredo do Express

Quando um erro acontece (o service lanca um `AppError`, por exemplo), o controller nao trata. Ele chama `next(error)`, que e a forma do Express dizer: "nao consigo lidar com isso, passe para o proximo middleware de erro".

Esse erro vai cair no `errorHandler` global, que veremos no capitulo 16.

### O que o controller NAO faz

- Nao acessa o banco
- Nao verifica regras de negocio
- Nao formata erros (o errorHandler faz isso)

---

## Capitulo 13 — Routes e a Composition Root

### O que e a Composition Root

A "composition root" e o lugar onde todas as pecas sao montadas. E o unico arquivo que:
- Importa o Prisma real
- Cria o repository real
- Cria o service real
- Cria o controller real
- Conecta tudo nas rotas

### Criando o Book Routes

Crie `src/modules/book/book.routes.js`:

```javascript
import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { createBookSchema, updateBookSchema } from "./book.schema.js";
import { createBookRepository } from "./book.repository.js";
import { createBookService } from "./book.service.js";
import { createBookController } from "./book.controller.js";
import { prisma } from "../../lib/prisma.js";

// Composicao: monta a cadeia de dependencias
const repository = createBookRepository(prisma);
const service = createBookService(repository);
const controller = createBookController(service);

const router = Router();

router.post("/", validate(createBookSchema), (req, res, next) =>
  controller.create(req, res, next)
);

router.get("/", (req, res, next) => controller.findAll(req, res, next));

router.get("/:id", (req, res, next) => controller.findById(req, res, next));

router.put("/:id", validate(updateBookSchema), (req, res, next) =>
  controller.update(req, res, next)
);

router.delete("/:id", (req, res, next) => controller.delete(req, res, next));

export { router as bookRoutes };
```

### A composicao acontece em tres linhas

```javascript
const repository = createBookRepository(prisma);    // Prisma real
const service = createBookService(repository);       // Repository real
const controller = createBookController(service);    // Service real
```

Essa cadeia e o que conecta todas as camadas. Nos testes, a mesma cadeia usa mocks:

```javascript
const repository = { create: vi.fn(), findByIsbn: vi.fn() }; // Mock
const service = createBookService(repository);                 // Repository mock
```

### O middleware validate() nas rotas

Algumas rotas usam `validate(schema)` antes do controller:

```javascript
router.post("/", validate(createBookSchema), (req, res, next) =>
  controller.create(req, res, next)
);
```

Isso garante que `req.body` ja esta validado e sanitizado quando chega ao controller. Criaremos esse middleware no capitulo 15.

### Registrando as rotas no app.js

Atualize `src/app.js` para incluir as rotas de livros:

```javascript
import { bookRoutes } from "./modules/book/book.routes.js";

app.use("/api/books", bookRoutes);
```

Todas as rotas definidas no `bookRoutes` ficam prefixadas com `/api/books`:
- `router.post("/")` → `POST /api/books`
- `router.get("/:id")` → `GET /api/books/:id`

---

# Parte 4 - Validacao e Seguranca

---

## Capitulo 14 — Validacao com Zod

### Por que validar?

Qualquer dado que vem de fora da aplicacao e **nao confiavel**. Um cliente pode enviar:

```json
{
  "title": "",
  "pages": -5,
  "isbn": "abc",
  "publishedAt": "nao e uma data"
}
```

Sem validacao, esses dados chegam ao banco e causam erros obscuros do PostgreSQL. Ou pior: sao salvos e corrompem seus dados.

### Onde validar?

A validacao acontece na **borda da aplicacao** — o mais cedo possivel:

```
Request → [VALIDACAO] → Controller → Service → Repository → Banco
              ^
         Se invalido, para aqui
```

### Criando os schemas do Book

Crie `src/modules/book/book.schema.js`:

```javascript
import { z } from "zod";

export const createBookSchema = z.object({
  title: z
    .string({ required_error: "O titulo e obrigatorio." })
    .trim()
    .min(1, "O titulo nao pode estar vazio.")
    .max(255, "O titulo pode ter no maximo 255 caracteres."),

  author: z
    .string({ required_error: "O autor e obrigatorio." })
    .trim()
    .min(1, "O autor nao pode estar vazio.")
    .max(255, "O autor pode ter no maximo 255 caracteres."),

  isbn: z
    .string({ required_error: "O ISBN e obrigatorio." })
    .trim()
    .regex(
      /^(?:\d{10}|\d{13})$/,
      "O ISBN deve conter exatamente 10 ou 13 digitos numericos."
    ),

  genre: z
    .string({ required_error: "O genero e obrigatorio." })
    .trim()
    .min(1, "O genero nao pode estar vazio.")
    .max(100, "O genero pode ter no maximo 100 caracteres."),

  pages: z
    .number({ required_error: "O numero de paginas e obrigatorio." })
    .int("O numero de paginas deve ser inteiro.")
    .positive("O numero de paginas deve ser positivo."),

  publishedAt: z.coerce.date({
    required_error: "A data de publicacao e obrigatoria.",
    invalid_type_error: "A data de publicacao deve ser uma data valida.",
  }),

  synopsis: z
    .string()
    .trim()
    .max(2000, "A sinopse pode ter no maximo 2000 caracteres.")
    .nullish(),
});
```

**Cada metodo e uma regra encadeada:**
- `z.string()` — deve ser string
- `.trim()` — remove espacos do inicio/fim
- `.min(1)` — pelo menos 1 caractere
- `.max(255)` — no maximo 255
- `.regex(...)` — deve corresponder ao padrao
- `z.coerce.date()` — aceita string e converte para Date
- `.nullish()` — aceita null ou undefined

### Schema de atualizacao (reutilizando o de criacao)

```javascript
export const updateBookSchema = createBookSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Pelo menos um campo deve ser fornecido para atualizacao." }
);
```

O `.partial()` torna todos os campos opcionais. O `.refine()` adiciona uma regra extra: pelo menos um campo deve existir (nao faz sentido enviar um PUT vazio).

### Schema de query params para listagem

```javascript
export const listBooksQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  genre: z.string().trim().optional(),
  sortBy: z.enum(["title", "author", "publishedAt", "createdAt", "pages"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
```

`z.coerce.number()` converte strings para numeros — necessario porque query params sempre chegam como strings (`?page=2` → `"2"` → `2`).

---

## Capitulo 15 — O middleware de validacao

### Criando o middleware

Crie `src/middlewares/validate.js`:

```javascript
export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.details = errors;
      return next(error);
    }

    req.body = result.data;
    next();
  };
}
```

### Como funciona

1. **E uma factory** — `validate(schema)` recebe um schema e retorna um middleware.
2. **`safeParse`** — valida sem lancar excecao. Retorna `{ success, data, error }`.
3. **Se invalido** — formata os erros em `{ field, message }` e chama `next(error)`.
4. **Se valido** — **substitui** `req.body` pelos dados parseados (com coercoes e transformacoes aplicadas) e chama `next()`.

### Por que `safeParse` e nao `parse`?

```javascript
// parse — lanca excecao se invalido
const data = schema.parse(input); // Pode throw ZodError

// safeParse — retorna resultado sem lancar excecao
const result = schema.safeParse(input);
if (!result.success) {
  console.log(result.error.issues); // Array de erros
}
```

Usamos `safeParse` porque queremos **formatar** os erros antes de envia-los, nao deixar uma excecao explodir.

### Por que substituir `req.body`?

```javascript
req.body = result.data;
```

O Zod aplica transformacoes: `.trim()` remove espacos, `.coerce.date()` converte string para Date, `.transform()` pode alterar valores. Se nao substituirmos, o controller receberia os dados originais (sujos), nao os dados limpos.

### Exemplo de resposta de erro

Se o cliente enviar dados invalidos:

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "isbn", "message": "O ISBN deve conter exatamente 10 ou 13 digitos numericos." },
    { "field": "pages", "message": "O numero de paginas deve ser positivo." }
  ]
}
```

O cliente sabe exatamente o que corrigir.

---

## Capitulo 16 — Tratamento centralizado de erros

### O problema: try/catch duplicado

Sem uma estrategia, cada rota teria seu proprio tratamento:

```javascript
// NÃO faca isso — tratamento de erro duplicado em cada rota
app.post("/api/books", async (req, res) => {
  try {
    // ...
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Duplicado" });
    }
    return res.status(500).json({ error: "Erro interno" });
  }
});
```

Com 20 rotas, sao 20 blocos catch identicos.

### A solucao: errorHandler global

Crie `src/middlewares/errorHandler.js`:

```javascript
export function errorHandler(err, _req, res, _next) {
  // Erro de validacao (do middleware validate.js)
  if (err.details) {
    return res.status(err.statusCode || 400).json({
      error: err.message,
      details: err.details,
    });
  }

  // Prisma: unique constraint violation
  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "campo";
    return res.status(409).json({
      error: `Ja existe um registro com este ${field}.`,
    });
  }

  // Prisma: record not found
  if (err.code === "P2025") {
    return res.status(404).json({
      error: "Registro nao encontrado.",
    });
  }

  // AppError ou qualquer erro com statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Erro inesperado — NUNCA expoe detalhes ao cliente
  console.error("Unexpected error:", err);
  return res.status(500).json({
    error: "Erro interno do servidor.",
  });
}
```

### Como funciona o error handler no Express

Um middleware de erro no Express e identificado por ter **4 parametros**: `(err, req, res, next)`. O Express so chama esse middleware quando `next(error)` e invocado com um argumento.

### O fluxo de erros

```
Qualquer camada lanca erro (throw)
    |
    v
Controller captura no try/catch → next(error)
    |
    v
errorHandler categoriza:
    |
    +--> tem .details?    → 400 + detalhes da validacao
    +--> codigo "P2002"?  → 409 + conflito
    +--> codigo "P2025"?  → 404 + nao encontrado
    +--> tem .statusCode? → status dinamico + mensagem
    +--> fallback         → 500 + "Erro interno do servidor."
```

### Seguranca: erros 500 nunca expoe detalhes

```javascript
// O cliente recebe apenas isso:
{ "error": "Erro interno do servidor." }

// Os detalhes ficam no log do servidor:
console.error("Unexpected error:", err);
```

Nunca exponha stack traces, nomes de tabelas ou detalhes de queries ao cliente. Isso e uma vulnerabilidade.

### Registrando o errorHandler no app.js

O errorHandler **deve** ser o ultimo middleware registrado:

```javascript
// app.js
app.use(errorHandler); // ULTIMA linha
```

---

## Capitulo 17 — Middlewares de seguranca

### Atualizando o app.js completo

Agora temos todas as pecas para montar o `app.js` completo:

```javascript
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { bookRoutes } from "./modules/book/book.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// Seguranca
app.use(helmet());
app.use(cors());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Muitas requisicoes. Tente novamente mais tarde." },
  })
);

// Body parsing
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Rotas
app.use("/api/books", bookRoutes);

// Error handler (DEVE ser o ultimo)
app.use(errorHandler);

export { app };
```

### O que cada middleware de seguranca faz

**Helmet** — define headers HTTP de seguranca automaticamente:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 0
Strict-Transport-Security: max-age=15552000; includeSubDomains
...
```

Protege contra clickjacking, sniffing de MIME type, e outros ataques.

**CORS** — habilita Cross-Origin Resource Sharing. Sem CORS, um frontend em `http://localhost:5173` nao consegue chamar sua API em `http://localhost:3000`. Em producao, configure a opcao `origin` para aceitar apenas dominios confiaveis:

```javascript
app.use(cors({ origin: "https://meusite.com" }));
```

**Rate Limit** — limita 100 requests a cada 15 minutos por IP. Protege contra:
- Ataques de forca bruta (tentativas de login)
- Abuso de API (scraping, DoS)
- Consumo excessivo de recursos

### A ordem dos middlewares importa

```
helmet → cors → rateLimit → express.json() → rotas → errorHandler
```

1. Seguranca roda PRIMEIRO (antes de qualquer processamento)
2. `express.json()` transforma o body em objeto
3. Rotas processam a request
4. `errorHandler` captura qualquer erro

Se voce colocar o `errorHandler` antes das rotas, ele nao vai capturar os erros das rotas.

---

# Parte 5 - Autenticacao

---

## Capitulo 18 — Modelando User e RefreshToken no Prisma

### Adicionando os models ao schema

Atualize `prisma/schema.prisma`:

```prisma
model User {
  id             String         @id @default(uuid())
  name           String
  email          String         @unique
  password       String
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  refreshTokens  RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([expiresAt])
}
```

### Detalhes dos modelos

**User:**
- `email @unique` — o banco impede emails duplicados
- `password` — armazena o hash (nunca a senha em texto puro)
- `refreshTokens RefreshToken[]` — relacao 1:N (um usuario pode ter varios tokens)

**RefreshToken:**
- `token @unique` — o valor do token (opaco, aleatorio)
- `userId` — foreign key para User
- `onDelete: Cascade` — se o usuario for deletado, todos os seus tokens sao deletados automaticamente
- `@@index([userId])` — indice para buscar tokens por usuario (performance)
- `@@index([expiresAt])` — indice para limpar tokens expirados (futuro cron job)

### Rodando a migration

```bash
npm run prisma:migrate
```

De o nome `add_auth_models`. O Prisma gera o SQL:

```sql
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

ALTER TABLE "RefreshToken"
  ADD CONSTRAINT "RefreshToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## Capitulo 19 — O modulo de autenticacao

O modulo de autenticacao segue a mesma arquitetura de tres camadas do modulo de livros: schema, repository, service, controller, routes.

### Auth Schema

Crie `src/modules/auth/auth.schema.js`:

```javascript
import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string({ required_error: "O nome e obrigatorio." })
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(100, "O nome pode ter no maximo 100 caracteres."),

  email: z
    .string({ required_error: "O email e obrigatorio." })
    .trim()
    .email("O email deve ser um endereco valido.")
    .max(255, "O email pode ter no maximo 255 caracteres.")
    .transform((val) => val.toLowerCase()),

  password: z
    .string({ required_error: "A senha e obrigatoria." })
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .max(128, "A senha pode ter no maximo 128 caracteres.")
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      "A senha deve conter pelo menos uma letra e um numero."
    ),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "O email e obrigatorio." })
    .trim()
    .email("O email deve ser um endereco valido.")
    .transform((val) => val.toLowerCase()),

  password: z
    .string({ required_error: "A senha e obrigatoria." })
    .min(1, "A senha e obrigatoria."),
});

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: "O refresh token e obrigatorio." })
    .min(1, "O refresh token e obrigatorio."),
});
```

**Pontos notaveis:**
- `.transform((val) => val.toLowerCase())` — normaliza emails para minusculo (evita "Maria@Email.com" e "maria@email.com" como usuarios diferentes)
- Regex na senha exige pelo menos uma letra e um numero
- O `loginSchema` nao repete as validacoes completas da senha — no login, so queremos saber se a senha foi enviada

### Auth Repository

Crie `src/modules/auth/auth.repository.js`:

```javascript
export function createAuthRepository(prisma) {
  return {
    async createUser(data) {
      const user = await prisma.user.create({ data });
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    },

    async findUserByEmail(email) {
      return prisma.user.findUnique({ where: { email } });
    },

    async findUserById(id) {
      return prisma.user.findUnique({
        where: { id },
        omit: { password: true },
      });
    },

    async createRefreshToken(data) {
      return prisma.refreshToken.create({ data });
    },

    async findRefreshToken(token) {
      return prisma.refreshToken.findUnique({ where: { token } });
    },

    async deleteRefreshToken(token) {
      return prisma.refreshToken.delete({ where: { token } });
    },

    async deleteAllRefreshTokens(userId) {
      return prisma.refreshToken.deleteMany({ where: { userId } });
    },
  };
}
```

**Detalhes importantes:**

- `createUser` remove o password do retorno usando destructuring: `const { password: _, ...userWithoutPassword } = user;`. O `_` e uma convencao para "variavel descartada".
- `findUserByEmail` retorna **com** password (necessario para o login comparar o hash).
- `findUserById` usa `omit: { password: true }` — recurso do Prisma 7 que exclui campos do resultado.

---

## Capitulo 20 — JWT e refresh tokens

### A estrategia de autenticacao

Usamos o padrao **access token + refresh token**:

| Token | Tipo | Duracao | Onde fica | Finalidade |
|-------|------|---------|-----------|-----------|
| Access token | JWT (assinado) | 15 minutos | Header `Authorization` | Autenticar requests |
| Refresh token | Opaco (aleatorio) | 7 dias | Body da request + banco | Renovar o access token |

**Por que dois tokens?**

- O access token e **curto** (15min). Se for roubado, o dano e limitado.
- O refresh token e **longo** (7 dias). Permite que o usuario nao precise fazer login constantemente.
- O refresh token fica no banco, permitindo **revogacao** (logout).

**Por que o access token e JWT e o refresh token nao?**

- JWT e auto-contido (nao precisa ir ao banco para validar) → ideal para requests frequentes
- O refresh token e usado raramente (a cada 15min) → pode ir ao banco
- Revogar um JWT exige uma blacklist (complexo). Revogar um token opaco e so deletar do banco (simples).

### Auth Service

Crie `src/modules/auth/auth.service.js`:

```javascript
import { SignJWT } from "jose";
import * as argon2 from "argon2";
import crypto from "node:crypto";
import { AppError } from "../../errors/AppError.js";

export function createAuthService(repository, config) {
  async function generateAccessToken(userId) {
    return new SignJWT({ sub: userId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(config.jwtExpiresIn)
      .sign(config.jwtSecret);
  }

  async function generateRefreshToken(userId) {
    const token = crypto.randomBytes(48).toString("base64url");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.refreshTokenExpiresInDays);

    await repository.createRefreshToken({ token, userId, expiresAt });

    return token;
  }

  return {
    async register(data) {
      const existingUser = await repository.findUserByEmail(data.email);
      if (existingUser) {
        throw new AppError("Ja existe um usuario com este email.", 409);
      }

      const hashedPassword = await argon2.hash(data.password);
      const user = await repository.createUser({
        name: data.name,
        email: data.email,
        password: hashedPassword,
      });

      const accessToken = await generateAccessToken(user.id);
      const refreshToken = await generateRefreshToken(user.id);

      return { user, accessToken, refreshToken };
    },

    async login(data) {
      const user = await repository.findUserByEmail(data.email);
      if (!user) {
        throw new AppError("Credenciais invalidas.", 401);
      }

      const isPasswordValid = await argon2.verify(user.password, data.password);
      if (!isPasswordValid) {
        throw new AppError("Credenciais invalidas.", 401);
      }

      const accessToken = await generateAccessToken(user.id);
      const refreshToken = await generateRefreshToken(user.id);

      const { password: _, ...userWithoutPassword } = user;

      return { user: userWithoutPassword, accessToken, refreshToken };
    },

    async refresh(token) {
      const storedToken = await repository.findRefreshToken(token);
      if (!storedToken) {
        throw new AppError("Refresh token invalido.", 401);
      }

      if (new Date() > storedToken.expiresAt) {
        await repository.deleteRefreshToken(token);
        throw new AppError("Refresh token expirado.", 401);
      }

      // Rotacao: deleta o antigo, gera um novo
      await repository.deleteRefreshToken(token);

      const accessToken = await generateAccessToken(storedToken.userId);
      const refreshToken = await generateRefreshToken(storedToken.userId);

      return { accessToken, refreshToken };
    },

    async logout(token) {
      const storedToken = await repository.findRefreshToken(token);
      if (!storedToken) {
        return; // Idempotente — nao lanca erro
      }

      await repository.deleteRefreshToken(token);
    },
  };
}
```

### Analise detalhada

**Registro:**
1. Verifica se o email ja esta em uso → 409
2. Faz hash da senha com Argon2 (`argon2.hash`)
3. Cria o usuario no banco (com o hash, nunca a senha em texto)
4. Gera ambos os tokens
5. Retorna o usuario (sem password) + tokens

**Login:**
1. Busca pelo email. Se nao encontrar → "Credenciais invalidas"
2. Compara o hash com `argon2.verify`. Se nao bater → "Credenciais invalidas"
3. Gera ambos os tokens
4. Remove o password do objeto antes de retornar

**Mensagem generica no login:** tanto para email inexistente quanto para senha errada, a mensagem e a mesma: "Credenciais invalidas". Isso **impede enumeracao de usuarios** — um atacante nao consegue descobrir quais emails estao cadastrados.

**Refresh (rotacao de tokens):**
1. Busca o token no banco
2. Verifica se nao expirou
3. **Deleta** o token antigo (uso unico!)
4. Gera um novo par

A rotacao e uma medida de seguranca: se um refresh token for comprometido, ele so pode ser usado uma vez. Quando o usuario legitimo tentar usar o token, falhara — sinalizando um vazamento.

**Logout (idempotente):**
O logout nao lanca erro se o token nao existir. Isso e intencional — se o usuario clicar "sair" duas vezes, nao deve receber um erro.

### Por que Argon2 e nao bcrypt?

O Argon2 e o vencedor da Password Hashing Competition (2015). E mais resistente a ataques de GPU e tem parametros configuraveis de memoria, tempo e paralelismo. O bcrypt e seguro, mas o Argon2 e o estado da arte.

### Auth Controller

Crie `src/modules/auth/auth.controller.js`:

```javascript
export function createAuthController(service) {
  return {
    async register(req, res, next) {
      try {
        const result = await service.register(req.body);
        return res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },

    async login(req, res, next) {
      try {
        const result = await service.login(req.body);
        return res.json(result);
      } catch (error) {
        next(error);
      }
    },

    async refresh(req, res, next) {
      try {
        const { refreshToken } = req.body;
        const result = await service.refresh(refreshToken);
        return res.json(result);
      } catch (error) {
        next(error);
      }
    },

    async logout(req, res, next) {
      try {
        const { refreshToken } = req.body;
        await service.logout(refreshToken);
        return res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  };
}
```

### Auth Routes (Composition Root)

Crie `src/modules/auth/auth.routes.js`:

```javascript
import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { registerSchema, loginSchema, refreshTokenSchema } from "./auth.schema.js";
import { createAuthRepository } from "./auth.repository.js";
import { createAuthService } from "./auth.service.js";
import { createAuthController } from "./auth.controller.js";
import { prisma } from "../../lib/prisma.js";

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "15m";
const refreshTokenExpiresInDays = Number(
  process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || 7
);

const repository = createAuthRepository(prisma);
const service = createAuthService(repository, {
  jwtSecret,
  jwtExpiresIn,
  refreshTokenExpiresInDays,
});
const controller = createAuthController(service);

const router = Router();

router.post("/register", validate(registerSchema), (req, res, next) =>
  controller.register(req, res, next)
);

router.post("/login", validate(loginSchema), (req, res, next) =>
  controller.login(req, res, next)
);

router.post("/refresh", validate(refreshTokenSchema), (req, res, next) =>
  controller.refresh(req, res, next)
);

router.post("/logout", validate(refreshTokenSchema), (req, res, next) =>
  controller.logout(req, res, next)
);

export { router as authRoutes };
```

**`new TextEncoder().encode(process.env.JWT_SECRET)`** — a biblioteca `jose` exige que o segredo seja um `Uint8Array`. O `TextEncoder` converte a string para esse formato.

---

## Capitulo 21 — O middleware de autenticacao

### Criando o authenticate middleware

Crie `src/middlewares/authenticate.js`:

```javascript
import { jwtVerify } from "jose";

export function authenticate(jwtSecret) {
  return async (req, _res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        const error = new Error("Token de autenticacao nao fornecido.");
        error.statusCode = 401;
        return next(error);
      }

      const token = authHeader.slice(7);

      const { payload } = await jwtVerify(token, jwtSecret);

      req.userId = payload.sub;

      next();
    } catch (error) {
      const authError = new Error("Token invalido ou expirado.");
      authError.statusCode = 401;
      next(authError);
    }
  };
}
```

### Como funciona

1. **Extrai o token** do header `Authorization: Bearer <token>`
2. **Verifica a assinatura e expiracao** com `jwtVerify` (biblioteca jose)
3. **Se valido:** extrai o `sub` (user ID) e coloca em `req.userId`
4. **Se invalido:** retorna 401 via `next(error)`

### Por que e uma factory?

`authenticate(jwtSecret)` recebe o segredo e retorna o middleware. Isso e importante por dois motivos:

1. **Testabilidade** — nos testes, podemos injetar um segredo diferente
2. **Configuracao explicita** — o segredo vem do ambiente, nao de um import global

---

## Capitulo 22 — Protegendo rotas

### A barreira de autenticacao no app.js

Atualize `src/app.js` para a versao final:

```javascript
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { bookRoutes } from "./modules/book/book.routes.js";
import { authenticate } from "./middlewares/authenticate.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// Seguranca
app.use(helmet());
app.use(cors());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Muitas requisicoes. Tente novamente mais tarde." },
  })
);

// Body parsing
app.use(express.json());

// Health check (publico)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Rotas PUBLICAS (antes do authenticate)
app.use("/api/auth", authRoutes);

// ─── BARREIRA DE AUTENTICACAO ────────────────────────────────────
const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);
app.use(authenticate(jwtSecret));

// Rotas PROTEGIDAS (depois do authenticate)
app.use("/api/books", bookRoutes);

// Error handler (ultimo)
app.use(errorHandler);

export { app };
```

### O truque esta na ordem

```
Middlewares de seguranca
    |
    v
express.json()
    |
    v
Health check (publico)
    |
    v
Auth routes (publico) ← registro, login, refresh, logout
    |
    v
authenticate() ← ─── BARREIRA ─── qualquer request sem token para aqui
    |
    v
Book routes (protegido) ← so chega quem tem token valido
    |
    v
errorHandler
```

Rotas registradas **antes** do `authenticate()` sao publicas. Rotas registradas **depois** sao protegidas. Nao precisamos decorar cada rota individualmente.

### Testando com Postman/curl

**1. Registrar um usuario:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Maria","email":"maria@email.com","password":"MinhaSenh4"}'
```

Resposta:
```json
{
  "user": { "id": "uuid", "name": "Maria", "email": "maria@email.com" },
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "abc123..."
}
```

**2. Tentar acessar livros sem token:**

```bash
curl http://localhost:3000/api/books
```

Resposta:
```json
{ "error": "Token de autenticacao nao fornecido." }
```

**3. Acessar livros com token:**

```bash
curl http://localhost:3000/api/books \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

Funciona.

---

# Parte 6 - Testes

---

## Capitulo 23 — Configurando o Vitest

### Por que Vitest e nao Jest?

O Jest e o framework de testes mais popular, mas tem um problema serio com ESM: requer flags experimentais (`--experimental-vm-modules`), e o mocking de modulos ESM e complicado (`jest.unstable_mockModule` + `await import`).

O Vitest suporta ESM **nativamente**. A API e quase identica ao Jest:

| Jest | Vitest |
|------|--------|
| `jest.fn()` | `vi.fn()` |
| `jest.mock()` | `vi.mock()` |
| `describe`, `it`, `expect` | `describe`, `it`, `expect` |

### Criando a configuracao

Crie `vitest.config.js`:

```javascript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/__tests__/**/*.test.js"],
    clearMocks: true,
  },
});
```

- **`include`** — procura testes em pastas `__tests__/` (co-localizados com o codigo)
- **`clearMocks: true`** — reseta todos os mocks entre cada teste automaticamente. Sem isso, um mock configurado no teste 1 poderia vazar para o teste 2.

### Estrutura dos testes

Os testes ficam dentro do modulo, em pastas `__tests__/`:

```
src/modules/book/
├── book.schema.js
├── book.repository.js
├── book.service.js
├── book.controller.js
├── book.routes.js
└── __tests__/
    ├── book.repository.test.js
    ├── book.service.test.js
    └── book.controller.test.js
```

Isso segue o principio feature-first: testes sobre livros ficam junto dos arquivos de livros.

### Rodando os testes

```bash
npm test
```

---

## Capitulo 24 — Testando o Repository

Os testes do repository verificam se ele chama o Prisma corretamente.

### A estrategia

O repository recebe o Prisma por injecao de dependencia. Nos testes, injetamos um **mock** do Prisma:

```javascript
import { vi, describe, it, expect } from "vitest";
import { createBookRepository } from "../book.repository.js";

// Mock do PrismaClient
const prismaMock = {
  book: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
};

const repository = createBookRepository(prismaMock);
```

### Exemplo: testando o create

```javascript
describe("BookRepository", () => {
  describe("create", () => {
    it("deve chamar prisma.book.create com os dados corretos", async () => {
      const bookData = { title: "O Hobbit", isbn: "1234567890" };
      const expected = { id: "uuid", ...bookData };

      prismaMock.book.create.mockResolvedValue(expected);

      const result = await repository.create(bookData);

      expect(prismaMock.book.create).toHaveBeenCalledWith({
        data: bookData,
      });
      expect(result).toEqual(expected);
    });
  });
});
```

**O que esse teste valida:**
1. O repository chama `prisma.book.create` (nao outra funcao)
2. Passa `{ data: bookData }` (o formato que o Prisma espera)
3. Retorna o que o Prisma retornou

### Exemplo: testando o findMany com $transaction

```javascript
describe("findMany", () => {
  it("deve usar $transaction para buscar dados e contagem", async () => {
    const books = [{ id: "1", title: "Livro" }];
    prismaMock.$transaction.mockResolvedValue([books, 1]);

    const result = await repository.findMany({
      skip: 0,
      take: 10,
      where: {},
      orderBy: { createdAt: "desc" },
    });

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(result).toEqual([books, 1]);
  });
});
```

---

## Capitulo 25 — Testando o Service

Os testes do service sao os mais importantes — eles verificam a **logica de negocio**.

### A estrategia

O service recebe o repository por injecao de dependencia. Nos testes, injetamos um mock:

```javascript
import { vi, describe, it, expect } from "vitest";
import { createBookService } from "../book.service.js";

const repositoryMock = {
  create: vi.fn(),
  findMany: vi.fn(),
  findById: vi.fn(),
  findByIsbn: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const service = createBookService(repositoryMock);
```

### Testando a regra de ISBN duplicado

```javascript
describe("create", () => {
  it("deve criar um livro quando o ISBN nao existe", async () => {
    const bookData = { title: "O Hobbit", isbn: "9780547928227" };
    const created = { id: "uuid", ...bookData };

    repositoryMock.findByIsbn.mockResolvedValue(null);     // ISBN nao existe
    repositoryMock.create.mockResolvedValue(created);

    const result = await service.create(bookData);

    expect(repositoryMock.findByIsbn).toHaveBeenCalledWith("9780547928227");
    expect(repositoryMock.create).toHaveBeenCalledWith(bookData);
    expect(result).toEqual(created);
  });

  it("deve lancar AppError 409 quando o ISBN ja existe", async () => {
    repositoryMock.findByIsbn.mockResolvedValue({ id: "abc", isbn: "9780547928227" });

    await expect(
      service.create({ isbn: "9780547928227" })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Ja existe um livro com este ISBN.",
    });

    // O create NUNCA deve ser chamado se o ISBN ja existe
    expect(repositoryMock.create).not.toHaveBeenCalled();
  });
});
```

**O que esses testes validam:**

1. Quando ISBN nao existe: o service verifica (`findByIsbn`), cria (`create`) e retorna o livro
2. Quando ISBN ja existe: lanca `AppError` com status 409 e **nao tenta criar**

### Testando a paginacao

```javascript
describe("findAll", () => {
  it("deve calcular o offset correto", async () => {
    repositoryMock.findMany.mockResolvedValue([[], 0]);

    await service.findAll({
      page: 3,
      limit: 5,
      sortBy: "createdAt",
      order: "desc",
    });

    // page 3, limit 5 → skip = (3-1) * 5 = 10
    expect(repositoryMock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 5 })
    );
  });
});
```

### Testando o 404

```javascript
describe("findById", () => {
  it("deve lancar AppError 404 quando o livro nao existe", async () => {
    repositoryMock.findById.mockResolvedValue(null);

    await expect(service.findById("nao-existe")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
```

---

## Capitulo 26 — Testando o Controller

Os testes do controller verificam se ele traduz HTTP corretamente.

### A estrategia

O controller recebe o service por injecao de dependencia. Nos testes, mockamos o service e os objetos `req`, `res`, `next`:

```javascript
import { vi, describe, it, expect } from "vitest";
import { createBookController } from "../book.controller.js";

const serviceMock = {
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const controller = createBookController(serviceMock);

// Helper para criar mocks de req/res/next
function createMocks(overrides = {}) {
  return {
    req: { body: {}, params: {}, query: {}, ...overrides },
    res: {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    },
    next: vi.fn(),
  };
}
```

### Testando o create (201)

```javascript
describe("create", () => {
  it("deve retornar 201 com o livro criado", async () => {
    const book = { id: "uuid", title: "O Hobbit" };
    serviceMock.create.mockResolvedValue(book);

    const { req, res, next } = createMocks({ body: { title: "O Hobbit" } });

    await controller.create(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(book);
    expect(next).not.toHaveBeenCalled();
  });

  it("deve chamar next(error) quando o service lanca erro", async () => {
    const error = new Error("ISBN duplicado");
    serviceMock.create.mockRejectedValue(error);

    const { req, res, next } = createMocks({ body: {} });

    await controller.create(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
```

### Testando o delete (204 sem body)

```javascript
describe("delete", () => {
  it("deve retornar 204 sem body", async () => {
    serviceMock.delete.mockResolvedValue({});

    const { req, res, next } = createMocks({ params: { id: "abc" } });

    await controller.delete(req, res, next);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled(); // 204 nao tem body
  });
});
```

---

## Capitulo 27 — Mocks de modulos ESM (argon2, jose)

Os testes do Auth Service sao mais complexos porque precisam mockar **modulos externos** (argon2 e jose).

### O desafio com ESM

Em CommonJS, `jest.mock("argon2")` funciona simplesmente. Em ESM, e mais complicado porque imports sao estaticos e imutaveis.

O Vitest resolve isso com **hoisting automatico**: `vi.mock()` e movido para o topo do arquivo antes da execucao.

### O padrao vi.hoisted + vi.mock

```javascript
import { vi, describe, it, expect, beforeEach } from "vitest";

// Passo 1: Criar os mocks ANTES do hoisting
const { mockHash, mockVerify, mockSignJWT } = vi.hoisted(() => ({
  mockHash: vi.fn(),
  mockVerify: vi.fn(),
  mockSignJWT: vi.fn(),
}));

// Passo 2: Substituir os modulos pelos mocks
vi.mock("argon2", () => ({
  hash: mockHash,
  verify: mockVerify,
}));

vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: mockSignJWT,
  })),
}));

// Passo 3: Imports normais (funcionam porque vi.mock tem hoisting)
import { createAuthService } from "../auth.service.js";
```

### Por que `vi.hoisted`?

Quando o Vitest move `vi.mock()` para o topo do arquivo, as variaveis `mockHash`, `mockVerify`, etc. ainda nao existiriam (porque estao declaradas depois). O `vi.hoisted()` resolve isso: ele cria valores que existem **antes** do hoisting.

### Mockando o SignJWT (builder pattern)

O `SignJWT` do jose usa um builder pattern:

```javascript
new SignJWT({ sub: userId })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("15m")
  .sign(secret);
```

Cada metodo retorna `this` (para permitir o encadeamento). O mock reproduz isso com `mockReturnThis()`:

```javascript
SignJWT: vi.fn().mockImplementation(() => ({
  setProtectedHeader: vi.fn().mockReturnThis(),  // retorna this
  setIssuedAt: vi.fn().mockReturnThis(),          // retorna this
  setExpirationTime: vi.fn().mockReturnThis(),    // retorna this
  sign: mockSignJWT,                               // retorna o valor final
})),
```

### Exemplo: testando o login com credenciais invalidas

```javascript
describe("login", () => {
  it("deve lancar 401 quando o email nao existe", async () => {
    repositoryMock.findUserByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: "naoexiste@email.com", password: "Qualquer1" })
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Credenciais invalidas.",
    });
  });

  it("deve lancar 401 quando a senha esta errada", async () => {
    repositoryMock.findUserByEmail.mockResolvedValue(mockUser);
    mockVerify.mockResolvedValue(false); // Senha nao confere

    await expect(
      service.login({ email: "maria@email.com", password: "SenhaErrada1" })
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Credenciais invalidas.",
    });
  });
});
```

Note que **ambos os testes esperam a mesma mensagem** ("Credenciais invalidas."). O service nunca revela se foi o email ou a senha que estava errado.

### Exemplo: testando a rotacao de refresh token

```javascript
describe("refresh", () => {
  it("deve gerar novos tokens e deletar o antigo", async () => {
    const storedToken = {
      token: "valid-refresh-token",
      userId: "user-123",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
    repositoryMock.findRefreshToken.mockResolvedValue(storedToken);
    repositoryMock.deleteRefreshToken.mockResolvedValue(storedToken);

    const result = await service.refresh("valid-refresh-token");

    expect(repositoryMock.deleteRefreshToken).toHaveBeenCalledWith(
      "valid-refresh-token"
    );
    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
  });
});
```

### Executando todos os testes

```bash
npm test
```

Voce deve ver algo como:

```
 ✓ src/modules/book/__tests__/book.repository.test.js (6 tests)
 ✓ src/modules/book/__tests__/book.service.test.js (11 tests)
 ✓ src/modules/book/__tests__/book.controller.test.js (10 tests)
 ✓ src/modules/auth/__tests__/auth.repository.test.js (8 tests)
 ✓ src/modules/auth/__tests__/auth.service.test.js (10 tests)
 ✓ src/modules/auth/__tests__/auth.controller.test.js (8 tests)

 Test Files  6 passed
      Tests  53 passed
```

Todos os testes rodam em **milissegundos**, sem banco de dados, sem rede, sem servidor HTTP.

---

# Parte 7 - Visao Geral

---

## Capitulo 28 — Recapitulacao

### O fluxo completo de uma request

Vamos rastrear uma request real: `POST /api/books` com um livro no body.

```
1. Cliente envia: POST /api/books
   Headers: Authorization: Bearer eyJhbG...
   Body: { "title": "O Hobbit", "isbn": "9780547928227", ... }

2. Express recebe e passa pelos middlewares na ordem:

   helmet()        → define headers de seguranca
   cors()          → permite cross-origin
   rateLimit()     → verifica se o IP nao excedeu 100 req/15min
   express.json()  → transforma body de texto para objeto JS

3. NÃO bate nas rotas de auth (e POST /api/books, nao /api/auth/*)

4. authenticate() → extrai token do header, verifica com jose
   → req.userId = "user-123"

5. bookRoutes → Router encontra POST /
   → validate(createBookSchema) roda primeiro
   → req.body e parseado pelo Zod (trim, coerce, etc.)
   → Se invalido: next(error) → errorHandler → 400

6. controller.create(req, res, next)
   → Extrai req.body
   → Chama service.create(req.body)

7. service.create(data)
   → Chama repository.findByIsbn(data.isbn)
   → Se existir: throw AppError("ISBN duplicado", 409)
   → Se nao: chama repository.create(data)

8. repository.create(data)
   → prisma.book.create({ data })
   → Prisma gera SQL INSERT e envia ao PostgreSQL

9. Resposta volta:
   PostgreSQL → Prisma → repository → service → controller
   → res.status(201).json(book)

10. Cliente recebe:
    Status: 201 Created
    Body: { "id": "uuid", "title": "O Hobbit", ... }
```

### Se algo der errado:

```
Se o ISBN ja existe:
  service lanca AppError(409) → controller.catch → next(error)
  → errorHandler detecta err.statusCode → res.status(409).json(...)

Se o token e invalido:
  authenticate() → jose.jwtVerify falha → next(error 401)
  → errorHandler → res.status(401).json(...)

Se o banco cai:
  Prisma lanca erro → repository propaga → service propaga
  → controller.catch → next(error) → errorHandler
  → console.error(err) + res.status(500).json("Erro interno")
```

### Mapa completo de endpoints

| Metodo | Caminho | Autenticacao | Validacao | Descricao |
|--------|---------|-------------|-----------|-----------|
| `GET` | `/api/health` | Nao | Nao | Health check |
| `POST` | `/api/auth/register` | Nao | `registerSchema` | Registrar usuario |
| `POST` | `/api/auth/login` | Nao | `loginSchema` | Login |
| `POST` | `/api/auth/refresh` | Nao | `refreshTokenSchema` | Renovar tokens |
| `POST` | `/api/auth/logout` | Nao | `refreshTokenSchema` | Logout |
| `POST` | `/api/books` | Sim | `createBookSchema` | Criar livro |
| `GET` | `/api/books` | Sim | `listBooksQuerySchema` | Listar livros |
| `GET` | `/api/books/:id` | Sim | Nao | Buscar livro |
| `PUT` | `/api/books/:id` | Sim | `updateBookSchema` | Atualizar livro |
| `DELETE` | `/api/books/:id` | Sim | Nao | Deletar livro |

### Stack tecnologica

| Camada | Tecnologia | Finalidade |
|--------|-----------|-----------|
| HTTP | Express 5 | Roteamento e middlewares |
| Validacao | Zod 4 | Schemas de validacao |
| ORM | Prisma 7 | Acesso ao banco |
| Banco | PostgreSQL | Persistencia |
| Auth | Jose + Argon2 | JWT + hash de senhas |
| Seguranca | Helmet + CORS + Rate Limit | Protecao HTTP |
| Testes | Vitest 3 | Testes unitarios |
| Modulos | ESM | Sistema de modulos nativo |

### Padroes aplicados

| Padrao | Onde |
|--------|------|
| Arquitetura em 3 camadas | Controller → Service → Repository |
| Feature-first | `modules/book/`, `modules/auth/` |
| Injecao de dependencia (factory) | Todo `create*()` recebe deps por parametro |
| Composition root | `*.routes.js` monta a cadeia |
| Singleton | `src/lib/prisma.js` |
| Middleware (Express) | validate, authenticate, errorHandler |
| Error handler centralizado | Um unico ponto trata todos os erros |
| Separacao app/server | Testabilidade |
| Repository pattern | Prisma encapsulado nos repositories |
| DTO/Schema validation | Zod valida na borda |
| Token rotation | Refresh tokens de uso unico |

---

## Capitulo 29 — Proximos passos

Voce construiu uma API com arquitetura profissional. Aqui esta o que vem depois:

### Proximo passo imediato

- **TypeScript** — este projeto e JavaScript puro. O mercado Node.js usa TypeScript massivamente. O Prisma brilha com TypeScript (autocomplete e type safety para queries).

### Evolucao da API

- **Autorizacao (RBAC)** — adicionar roles (admin, user) e middleware de autorizacao por rota
- **Relacionamentos no Prisma** — adicionar entidade `Author` com relacao 1:N para `Book`
- **Testes de integracao** — usar `supertest` para testar o fluxo HTTP completo (request → response)
- **Docker** — containerizar a aplicacao para deploy consistente

### Arquitetura

- **NestJS** — framework Node.js que implementa tudo que fizemos aqui (e mais) com decorators e convencoes. A arquitetura feature-first deste projeto e exatamente o que o NestJS faz
- **Domain-Driven Design (DDD)** — quando a logica de negocio e complexa, organizar por dominio
- **Clean Architecture** — levar a separacao de responsabilidades ao extremo

### Banco de dados

- **Migrations avancadas** — rename de colunas, migracao de dados, rollback
- **Indices** — otimizacao de queries com indices compostos
- **Transactions** — operacoes atomicas envolvendo multiplas tabelas

---

*Este curso foi escrito para ser seguido com o codigo aberto ao lado. Cada capitulo constroi sobre o anterior — o resultado final e exatamente o projeto que voce esta lendo.*

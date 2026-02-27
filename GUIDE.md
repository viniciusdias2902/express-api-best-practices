# Guia Educacional: Entendendo a Arquitetura de uma API REST

> **This guide is available in Portuguese only.** Se precisar de uma referência em inglês, consulte os comentários no próprio código-fonte e o [PATTERNS.md](./PATTERNS.md).

Este documento não é um README. Ele foi escrito como se fosse uma aula — com calma, com analogias, e com a intenção de que você termine a leitura entendendo **por que** cada decisão foi tomada, não apenas **o que** foi feito.

Leia na ordem. Cada seção constrói sobre a anterior.

---

## Sumário

1. [O que é uma API REST](#1-o-que-é-uma-api-rest)
2. [A estrutura do projeto](#2-a-estrutura-do-projeto)
3. [Arquitetura em camadas: por que separar responsabilidades](#3-arquitetura-em-camadas-por-que-separar-responsabilidades)
4. [O fluxo completo de uma request](#4-o-fluxo-completo-de-uma-request)
5. [O Prisma e como ele se encaixa na arquitetura](#5-o-prisma-e-como-ele-se-encaixa-na-arquitetura)
6. [Prisma 7: o que mudou e por quê](#6-prisma-7-o-que-mudou-e-por-quê)
7. [Validação com Zod: protegendo a borda da aplicação](#7-validação-com-zod-protegendo-a-borda-da-aplicação)
8. [Tratamento de erros: uma estratégia centralizada](#8-tratamento-de-erros-uma-estratégia-centralizada)
9. [Testes unitários: testando cada camada isoladamente](#9-testes-unitários-testando-cada-camada-isoladamente)
10. [Injeção de dependência: o padrão que conecta tudo](#10-injeção-de-dependência-o-padrão-que-conecta-tudo)
11. [ESM: o sistema de módulos moderno do JavaScript](#11-esm-o-sistema-de-módulos-moderno-do-javascript)
12. [Boas práticas aplicadas neste projeto](#12-boas-práticas-aplicadas-neste-projeto)
13. [O que estudar depois](#13-o-que-estudar-depois)

---

## 1. O que é uma API REST

### O conceito em uma frase

Uma API REST é um programa que **recebe pedidos HTTP** e **retorna respostas estruturadas** (geralmente em JSON), seguindo um conjunto de convenções.

### A analogia do restaurante

Imagine um restaurante:

- O **cliente** (aplicação frontend, app mobile, Postman) faz um pedido
- O **garçom** (servidor HTTP / Express) recebe o pedido e leva para a cozinha
- A **cozinha** (lógica da aplicação) prepara o pedido
- O **estoque** (banco de dados) fornece os ingredientes
- O garçom traz o prato pronto de volta ao cliente

Nessa analogia, a API é o garçom. Ela não é o frontend. Ela não é o banco de dados. Ela é o **meio de campo** que conecta quem pede com quem produz.

### Os verbos HTTP

REST usa os verbos HTTP para indicar a **intenção** do pedido:

| Verbo | Intenção | Exemplo neste projeto |
|-------|----------|-----------------------|
| `GET` | Ler dados | Buscar livros |
| `POST` | Criar dados | Cadastrar novo livro |
| `PUT` | Atualizar dados | Editar um livro |
| `DELETE` | Remover dados | Excluir um livro |

### Os status codes

A resposta de uma API sempre inclui um **código de status** que indica o resultado:

| Código | Significado | Quando usamos |
|--------|-------------|---------------|
| `200` | OK | Busca ou atualização bem-sucedida |
| `201` | Created | Recurso criado com sucesso |
| `204` | No Content | Deleção bem-sucedida (sem body) |
| `400` | Bad Request | Dados inválidos |
| `404` | Not Found | Recurso não existe |
| `409` | Conflict | Conflito (ex: ISBN duplicado) |
| `500` | Internal Server Error | Erro inesperado no servidor |

---

## 2. A estrutura do projeto

```
learning-api/
├── prisma/                          # Tudo relacionado ao Prisma (schema + migrations)
│   ├── schema.prisma                # O "contrato" com o banco de dados
│   └── migrations/                  # Histórico de alterações no banco
├── generated/                       # Código gerado pelo Prisma (não editar)
│   └── prisma/
├── src/                             # Código-fonte da aplicação
│   ├── app.js                       # Configuração do Express (rotas, middlewares, segurança)
│   ├── server.js                    # Ponto de entrada (só escuta a porta)
│   ├── lib/
│   │   └── prisma.js                # Instância singleton do Prisma
│   ├── modules/
│   │   ├── auth/                    # Tudo sobre autenticação vive aqui
│   │   │   ├── auth.schema.js       # Validações Zod (registro, login, refresh)
│   │   │   ├── auth.repository.js   # Acesso ao banco (User + RefreshToken)
│   │   │   ├── auth.service.js      # Lógica de negócio (registro, login, refresh, logout)
│   │   │   ├── auth.controller.js   # Traduz HTTP ↔ lógica
│   │   │   ├── auth.routes.js       # Define as rotas e monta as camadas
│   │   │   └── __tests__/           # Testes unitários do módulo
│   │   └── book/                    # Tudo sobre livros vive aqui
│   │       ├── book.schema.js       # Validações Zod
│   │       ├── book.repository.js   # Acesso ao banco de dados
│   │       ├── book.service.js      # Lógica de negócio
│   │       ├── book.controller.js   # Traduz HTTP ↔ lógica
│   │       ├── book.routes.js       # Define as rotas e monta as camadas
│   │       └── __tests__/           # Testes unitários do módulo
│   ├── middlewares/
│   │   ├── validate.js              # Middleware de validação Zod
│   │   ├── authenticate.js          # Middleware de autenticação JWT
│   │   └── errorHandler.js          # Middleware global de erros
│   └── errors/
│       └── AppError.js              # Classe de erro customizada
├── prisma.config.mjs                # Configuração do CLI do Prisma
├── vitest.config.js                 # Configuração dos testes
├── package.json                     # Dependências e scripts
├── .env                             # Variáveis de ambiente (NÃO vai pro git)
└── .env.example                     # Template do .env (vai pro git)
```

### Por que feature-first?

Existem duas formas populares de organizar um projeto:

**Layer-first** (por camada): pastas `controllers/`, `services/`, `repositories/` na raiz, cada uma com arquivos de todas as entidades.

**Feature-first** (por módulo): uma pasta por entidade (`modules/book/`), contendo todas as suas camadas.

Usamos **feature-first** porque:

1. **Coesão**: tudo sobre "book" está em `modules/book/`. Se quiser entender o módulo, olha uma pasta só.
2. **Escalabilidade**: para adicionar `modules/author/`, é só criar a pasta. Nenhum arquivo existente é alterado.
3. **Mercado**: frameworks como NestJS, que domina o mercado Node.js em empresas, usam essa abordagem por padrão.
4. **Equipes**: duas pessoas trabalhando em módulos diferentes raramente geram conflitos de merge.

Com uma única entidade (como neste projeto), a vantagem não é tão visível. Mas o objetivo aqui é aprender o padrão que você vai encontrar no mundo real.

---

## 3. Arquitetura em camadas: por que separar responsabilidades

### O problema de colocar tudo junto

Imagine um controller assim:

```javascript
// NÃO faça isso — exemplo de código "tudo junto"
app.post("/api/books", async (req, res) => {
  // Validação
  if (!req.body.title) return res.status(400).json({ error: "Título obrigatório" });
  if (!req.body.isbn) return res.status(400).json({ error: "ISBN obrigatório" });
  
  // Regra de negócio
  const existing = await prisma.book.findUnique({ where: { isbn: req.body.isbn } });
  if (existing) return res.status(409).json({ error: "ISBN já existe" });
  
  // Acesso ao banco
  const book = await prisma.book.create({ data: req.body });
  
  res.status(201).json(book);
});
```

Funciona? Sim. Mas tem problemas sérios:

1. **Impossível testar** sem subir o Express e ter um banco real
2. **Impossível reusar** a lógica (e se outro endpoint precisar verificar ISBN duplicado?)
3. **Difícil de manter** — uma mudança no banco pode quebrar a rota, a validação e a lógica
4. **Cresce rápido** — com 10 entidades, esse arquivo teria centenas de linhas

### A solução: separar em camadas

Cada camada tem uma **única responsabilidade**:

```
Request HTTP
    │
    ▼
┌─────────────────┐
│   Controller     │  Traduz HTTP para dados da aplicação
│                  │  Recebe req, chama service, envia res
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Service        │  Contém a lógica de negócio
│                  │  "ISBN duplicado? Livro existe?"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Repository     │  Acessa o banco de dados
│                  │  Sabe falar "Prisma"
└────────┬────────┘
         │
         ▼
    Banco de Dados
```

### Vamos ver com um exemplo concreto

**Quero criar um livro. O que acontece?**

1. O **controller** recebe `req.body` e chama `service.create(req.body)`
2. O **service** verifica se o ISBN já existe chamando `repository.findByIsbn(isbn)`
3. Se existir, o service **lança um erro** (`throw new AppError(...)`)
4. Se não existir, o service chama `repository.create(data)`
5. O **repository** chama `prisma.book.create({ data })`
6. O Prisma executa o SQL no banco
7. A resposta volta: repository → service → controller → `res.status(201).json(book)`

### O que cada camada SABE e NÃO SABE

| Camada | Sabe | Não sabe |
|--------|------|----------|
| **Controller** | Que existe HTTP (req, res, status codes) | Que o Prisma existe, que há um banco PostgreSQL |
| **Service** | As regras de negócio (ISBN único, livro deve existir) | Que existe HTTP, que existe Express, qual banco é usado |
| **Repository** | Como falar com o Prisma/banco | Regras de negócio, HTTP, validação |

Essa ignorância é intencional. Se amanhã o Prisma for substituído por outro ORM, **só o repository muda**. O service e o controller nem percebem.

---

## 4. O fluxo completo de uma request

Vamos rastrear uma request real: `POST /api/books` com um JSON no body.

### Passo 1: Express recebe a request

O Express recebe a conexão HTTP e passa por seus middlewares na ordem em que foram registrados:

```
helmet() → cors() → rateLimit() → express.json() → authRoutes (público) → authenticate() → bookRoutes (protegido) → errorHandler
```

Os middlewares de segurança (`helmet`, `cors`, `rateLimit`) rodam primeiro. O `express.json()` transforma o body da request (que chega como texto) em um objeto JavaScript. As rotas de autenticação são públicas. Depois vem o middleware `authenticate()` que protege todas as rotas seguintes.

### Passo 2: O Router encontra a rota

Em `book.routes.js`, a rota `POST /` foi registrada com dois handlers:

```javascript
router.post("/", validate(createBookSchema), (req, res, next) =>
  controller.create(req, res, next)
);
```

### Passo 3: Middleware de validação (Zod)

Antes do controller, o middleware `validate(createBookSchema)` roda:

1. Pega `req.body`
2. Passa pelo schema Zod
3. Se inválido → cria um erro e chama `next(error)` (pula direto para o errorHandler)
4. Se válido → substitui `req.body` com os dados limpos e chama `next()`

### Passo 4: Controller

```javascript
async create(req, res, next) {
  try {
    const book = await service.create(req.body);
    return res.status(201).json(book);
  } catch (error) {
    next(error);  // Qualquer erro vai para o errorHandler
  }
}
```

O controller:
- Extrai os dados de `req.body`
- Chama o service
- Se deu certo: responde com 201
- Se deu erro: repassa para o `errorHandler` via `next(error)`

### Passo 5: Service

```javascript
async create(data) {
  const existingBook = await repository.findByIsbn(data.isbn);
  if (existingBook) {
    throw new AppError("Já existe um livro com este ISBN.", 409);
  }
  return repository.create(data);
}
```

O service:
- Verifica a regra de negócio (ISBN único)
- Se violada: **lança um erro** que será capturado pelo `try/catch` do controller
- Se OK: delega a criação ao repository

### Passo 6: Repository

```javascript
async create(data) {
  return prisma.book.create({ data });
}
```

O repository simplesmente traduz a operação para a linguagem do Prisma.

### Passo 7: Prisma → Banco

O Prisma converte `prisma.book.create({ data })` em:

```sql
INSERT INTO "Book" ("id", "title", "author", "isbn", ...) VALUES ($1, $2, $3, $4, ...)
```

E envia para o PostgreSQL no Neon.

### Passo 8: Resposta volta

```
PostgreSQL → Prisma (objeto JS) → Repository → Service → Controller → res.json()
```

O cliente recebe:

```json
{
  "id": "uuid-gerado",
  "title": "O Hobbit",
  "author": "J.R.R. Tolkien",
  "isbn": "9780547928227",
  ...
}
```

---

## 5. O Prisma e como ele se encaixa na arquitetura

### O que é um ORM

ORM (Object-Relational Mapping) é uma ferramenta que mapeia **tabelas do banco** para **objetos no código**. Ao invés de escrever SQL manualmente, você usa métodos de uma API:

```javascript
// Sem ORM (SQL puro)
const result = await pool.query(
  'SELECT * FROM "Book" WHERE "isbn" = $1', 
  [isbn]
);
const book = result.rows[0];

// Com Prisma (ORM)
const book = await prisma.book.findUnique({ where: { isbn } });
```

Ambos fazem a mesma coisa. O Prisma gera o SQL para você.

### As três partes do Prisma

O Prisma é composto por três componentes que trabalham juntos:

#### 1. Prisma Schema (`prisma/schema.prisma`)

O schema é o **contrato entre o código e o banco**. Ele define:

- Quais tabelas existem (models)
- Quais colunas cada tabela tem (fields)
- Tipos de dados, restrições e valores padrão

```prisma
model Book {
  id          String   @id @default(uuid())    // Chave primária, UUID automático
  title       String                            // Coluna de texto, obrigatória
  isbn        String   @unique                  // Texto com restrição de unicidade
  pages       Int                               // Inteiro
  synopsis    String?                           // Texto OPCIONAL (o ? indica nullable)
  createdAt   DateTime @default(now())          // Data automática na criação
  updatedAt   DateTime @updatedAt               // Data automática na atualização
}
```

#### 2. Prisma Migrate

O Migrate lê o schema e gera **arquivos SQL de migração** que alteram o banco para ficar igual ao schema.

Quando você roda `npx prisma migrate dev`:

1. O Prisma compara o schema atual com o estado do banco
2. Gera um arquivo `.sql` com as diferenças
3. Executa esse SQL no banco
4. Registra a migração como "aplicada"

Olhe o arquivo `prisma/migrations/*/migration.sql` — é SQL puro. O Prisma o gerou para você.

#### 3. Prisma Client

O Client é **código gerado automaticamente** a partir do schema. Quando você roda `npx prisma generate`, ele cria arquivos na pasta `generated/prisma/` com todos os métodos para manipular suas tabelas.

É por isso que `prisma.book.create()`, `prisma.book.findMany()`, etc., existem — eles foram gerados com base no `model Book` do schema.

### Onde o Prisma vive na arquitetura

O Prisma vive **exclusivamente no repository**. Essa é uma regra importante:

```
Controller  → não sabe que o Prisma existe
Service     → não sabe que o Prisma existe
Repository  → ÚNICO lugar que fala com o Prisma
```

Se amanhã você trocar o Prisma por Drizzle, Knex ou SQL puro, **só os repositories precisam mudar**. Os services continuam funcionando, os controllers continuam funcionando, os testes dos services continuam passando.

### O Prisma Client como singleton

Em `src/lib/prisma.js`, criamos UMA instância do PrismaClient e exportamos ela:

```javascript
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export { prisma };
```

Isso é o **padrão singleton**: uma única instância compartilhada por toda a aplicação.

Por que não criar uma instância em cada repository? Porque cada PrismaClient abre um **pool de conexões** com o banco. Se cada repository criasse o seu, você teria múltiplos pools competindo por conexões — e o banco tem um limite de conexões simultâneas.

---

## 6. Prisma 7: o que mudou e por quê

O Prisma 7 trouxe mudanças estruturais importantes. Se você ler tutoriais mais antigos, vai encontrar código diferente. Vamos entender o que mudou.

### Mudança 1: Driver Adapters são obrigatórios

**Antes (Prisma 5/6):**
```javascript
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
// O Prisma usava seu próprio engine em Rust para se conectar ao banco
```

**Agora (Prisma 7):**
```javascript
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

**Por quê?** Nas versões anteriores, o Prisma usava um "query engine" escrito em Rust que rodava como um binário. Isso funcionava, mas trazia problemas:

- Binários grandes (30-50MB) no deploy
- Incompatibilidade com algumas plataformas (ARM, Alpine Linux)
- Cold starts lentos em serverless

No Prisma 7, o engine em Rust foi removido. O Prisma agora usa **drivers nativos do Node.js** (como o `pg` para PostgreSQL). O `@prisma/adapter-pg` é a "ponte" que conecta o Prisma ao driver `pg`.

### Mudança 2: O generator mudou

**Antes:**
```prisma
generator client {
  provider = "prisma-client-js"
}
```

**Agora:**
```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}
```

Duas diferenças:
1. O provider mudou de `prisma-client-js` para `prisma-client`
2. O `output` agora é **obrigatório** — o client não vai mais para `node_modules`

**Por quê?** Gerar código dentro de `node_modules` era problemático: `npm install` podia sobrescrever o client gerado, causando erros difíceis de diagnosticar. Com um output explícito, você sabe exatamente onde o código gerado está.

### Mudança 3: ESM obrigatório

O Prisma 7 gera código ESM (ES Modules). Isso significa:

- `"type": "module"` no `package.json`
- `import`/`export` ao invés de `require`/`module.exports`
- Extensões de arquivo nos imports (`.js` ou `.ts`)

### Mudança 4: `prisma.config.mjs`

**Antes:** a URL do banco ficava no `schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Agora:** a URL do banco fica no `prisma.config.mjs`:
```javascript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
```

**Por quê?** O schema é uma linguagem própria do Prisma (PSL) com limitações. Mover a configuração para JavaScript/TypeScript permite usar lógica real: ler de diferentes fontes, fazer condicionais por ambiente, etc.

### Mudança 5: Variáveis de ambiente não são carregadas automaticamente

No Prisma 6, as variáveis do `.env` eram carregadas automaticamente. No Prisma 7, você precisa carregar explicitamente:

```javascript
import "dotenv/config"; // Esta linha no topo do prisma.config.mjs
```

E na aplicação:
```javascript
import "dotenv/config"; // No topo do src/lib/prisma.js
```

---

## 7. Validação com Zod: protegendo a borda da aplicação

### Por que validar?

Qualquer dado que vem de fora da aplicação é **não confiável**. Um cliente pode enviar:

```json
{
  "title": "",
  "pages": -5,
  "isbn": "abc",
  "publishedAt": "não é uma data"
}
```

Sem validação, esses dados chegariam ao banco e causariam erros obscuros do PostgreSQL. Ou pior: seriam salvos e corromperiam seus dados.

### Onde validar?

A validação acontece na **borda da aplicação** — o mais cedo possível, antes de qualquer lógica de negócio:

```
Request → [VALIDAÇÃO] → Controller → Service → Repository → Banco
                ↑
          Se inválido, para aqui
```

Neste projeto, a validação acontece no middleware `validate.js`, que roda ANTES do controller.

### Como o Zod funciona

O Zod permite definir schemas que descrevem o formato esperado:

```javascript
const createBookSchema = z.object({
  title: z.string().trim().min(1).max(255),
  pages: z.number().int().positive(),
  isbn: z.string().regex(/^(?:\d{10}|\d{13})$/),
  publishedAt: z.coerce.date(),
  synopsis: z.string().nullish(),
});
```

Cada método é uma **regra de validação** encadeada:

- `z.string()` → deve ser uma string
- `.trim()` → remove espaços do início e fim
- `.min(1)` → pelo menos 1 caractere
- `.max(255)` → no máximo 255 caracteres
- `z.number().int().positive()` → número inteiro positivo
- `z.coerce.date()` → aceita string e converte para Date
- `.nullish()` → aceita null ou undefined

### safeParse vs parse

Existem duas formas de usar o schema:

```javascript
// parse — lança exceção se inválido
const data = schema.parse(input); // Pode throw ZodError

// safeParse — retorna resultado sem lançar exceção
const result = schema.safeParse(input);
if (!result.success) {
  console.log(result.error.issues); // Array de erros
} else {
  console.log(result.data); // Dados validados
}
```

No middleware `validate.js`, usamos `safeParse` porque queremos **capturar** os erros e formatá-los para o cliente, não deixar uma exceção explodir.

### Schema de criação vs. atualização

Para criação, todos os campos são obrigatórios:

```javascript
export const createBookSchema = z.object({ ... });
```

Para atualização, todos os campos são opcionais (mas pelo menos um deve existir):

```javascript
export const updateBookSchema = createBookSchema
  .partial()                // Torna todos os campos opcionais
  .refine(                  // Adiciona uma regra customizada
    (data) => Object.keys(data).length > 0,
    { message: "Pelo menos um campo deve ser fornecido." }
  );
```

O `.partial()` é um método poderoso do Zod: ele pega um schema existente e transforma todos os campos em opcionais. Isso evita duplicação — não precisamos reescrever todas as regras.

---

## 8. Tratamento de erros: uma estratégia centralizada

### O problema dos try/catch espalhados

Sem uma estratégia, cada rota teria seu próprio tratamento de erro:

```javascript
// NÃO faça isso
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

Com 20 rotas, você teria 20 blocos catch duplicados.

### A solução: AppError + errorHandler

#### 1. Classe AppError

```javascript
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}
```

Qualquer camada pode lançar um `AppError`:

```javascript
throw new AppError("Livro não encontrado.", 404);
throw new AppError("ISBN já cadastrado.", 409);
```

#### 2. Controller repassa erros via `next(error)`

```javascript
async create(req, res, next) {
  try {
    const book = await service.create(req.body);
    return res.status(201).json(book);
  } catch (error) {
    next(error); // Repassa para o errorHandler
  }
}
```

O `next(error)` é a forma do Express de dizer: "não consigo lidar com isso, passe adiante".

#### 3. errorHandler centralizado

O middleware `errorHandler` é registrado por **último** no Express e captura TODOS os erros:

```javascript
app.use(errorHandler); // Última linha antes de app.listen
```

Ele categoriza cada erro e retorna a resposta HTTP adequada:

- `AppError` → usa o statusCode e message definidos
- Erro de validação (com `details`) → retorna 400 com os campos inválidos
- Erro do Prisma `P2002` → retorna 409 (unique constraint violation)
- Erro do Prisma `P2025` → retorna 404 (record not found)
- Qualquer outro erro → retorna 500 com mensagem genérica

**Importante:** erros 500 NUNCA expõem detalhes ao cliente. O `console.error` loga no servidor para debug, mas o cliente recebe apenas "Erro interno do servidor."

---

## 9. Testes unitários: testando cada camada isoladamente

### O que são testes unitários

Um teste unitário verifica se uma **unidade isolada** de código funciona corretamente. "Isolada" é a palavra-chave: cada teste roda sem depender de banco de dados, rede, ou outras camadas.

### O que são mocks

Mocks são **objetos falsos** que simulam o comportamento de dependências reais. No Vitest:

```javascript
const repository = {
  findByIsbn: vi.fn(),  // Função "espiã" — registra chamadas
  create: vi.fn(),
};
```

Uma `vi.fn()`:
- Registra **se** foi chamada
- Registra **quantas vezes** foi chamada
- Registra **com quais argumentos** foi chamada
- Pode **retornar um valor pré-definido**: `vi.fn().mockResolvedValue(livro)`

### A estratégia de mock por camada

Cada camada mock a camada imediatamente abaixo:

```
Controller tests → mockam o Service
Service tests    → mockam o Repository
Repository tests → mockam o PrismaClient
```

Isso significa que:

- **Testes do repository** verificam se ele chama o Prisma corretamente
- **Testes do service** verificam se a lógica de negócio funciona (ISBN duplicado, livro não encontrado)
- **Testes do controller** verificam se ele traduz HTTP corretamente (status codes, formato de resposta)

### Exemplo prático: testando o service

```javascript
// Mock do repository
const repositoryMock = {
  findByIsbn: vi.fn(),
  create: vi.fn(),
};

// Cria o service com o mock injetado
const service = createBookService(repositoryMock);

it("deve lançar erro 409 quando ISBN já existe", async () => {
  // Configura o mock: simula que findByIsbn encontrou um livro
  repositoryMock.findByIsbn.mockResolvedValue({ id: "abc", isbn: "123" });

  // Tenta criar um livro com ISBN duplicado
  await expect(service.create({ isbn: "123", ... }))
    .rejects.toMatchObject({ statusCode: 409 });

  // Verifica que create NUNCA foi chamado (a regra impediu)
  expect(repositoryMock.create).not.toHaveBeenCalled();
});
```

O que esse teste valida:
1. O service **verificou** o ISBN antes de criar
2. Ao encontrar duplicata, **lançou um AppError com status 409**
3. **Não tentou criar** o livro no banco

Tudo isso sem banco de dados, sem rede, sem Express. O teste roda em milissegundos.

### Por que não testar com o banco real?

Testes com banco real são **testes de integração**, não unitários. Eles são úteis, mas:

- São lentos (conectar ao banco, criar dados, limpar depois)
- São frágeis (banco fora do ar = testes falhando)
- Testam muita coisa ao mesmo tempo (difícil saber o que quebrou)

Testes unitários com mocks são rápidos, estáveis e específicos. Em projetos reais, você tem **ambos**: unitários para cada camada e de integração para o fluxo completo.

---

## 10. Injeção de dependência: o padrão que conecta tudo

### O que é

Injeção de dependência (DI) significa: ao invés de uma camada **criar** sua dependência internamente, ela **recebe** a dependência de fora.

### Sem injeção de dependência

```javascript
// O service cria sua própria dependência — ACOPLAMENTO
import { prisma } from "../lib/prisma.js";

export const bookService = {
  async create(data) {
    return prisma.book.create({ data }); // Preso ao Prisma para sempre
  }
};
```

Problema: como testar isso? Você não consegue substituir o `prisma` por um mock sem gambiarras.

### Com injeção de dependência

```javascript
// O service RECEBE sua dependência — DESACOPLAMENTO
export function createBookService(repository) {
  return {
    async create(data) {
      return repository.create(data); // Não sabe se é Prisma, mock ou outra coisa
    }
  };
}
```

Agora podemos usar de duas formas:

```javascript
// Na aplicação real
const repository = createBookRepository(prisma);
const service = createBookService(repository);

// Nos testes
const mockRepository = { create: vi.fn() };
const service = createBookService(mockRepository);
```

### A composição acontece no routes

Em `book.routes.js`, montamos toda a cadeia:

```javascript
const repository = createBookRepository(prisma);   // Prisma real
const service = createBookService(repository);       // Repository real
const controller = createBookController(service);    // Service real
```

Essa é a **composição root** — o único lugar que conhece todas as implementações reais. Todas as outras camadas trabalham com abstrações (interfaces implícitas).

---

## 11. ESM: o sistema de módulos moderno do JavaScript

### CJS vs ESM

O JavaScript tem dois sistemas de módulos:

**CommonJS (CJS)** — o antigo padrão do Node.js:
```javascript
const express = require("express");
module.exports = { app };
```

**ES Modules (ESM)** — o padrão moderno (nativo da linguagem):
```javascript
import express from "express";
export { app };
```

### Por que usamos ESM

1. **É o padrão da linguagem** — funciona no browser e no Node.js
2. **O Prisma 7 exige ESM** — gera código ESM
3. **Top-level await** — ESM permite `await` fora de funções async
4. **Imports estáticos** — ferramentas de build conseguem otimizar melhor

### Como ativar ESM

Basta adicionar no `package.json`:

```json
{
  "type": "module"
}
```

A partir daí, todos os `.js` são tratados como ESM. Se precisar de um arquivo CJS, use a extensão `.cjs`.

---

## 12. Boas práticas aplicadas neste projeto

### 1. Separação app.js / server.js

O `app.js` configura o Express (rotas, middlewares). O `server.js` apenas chama `app.listen()`.

Por quê? Nos testes, você pode importar o `app` sem subir o servidor. Ferramentas como `supertest` usam exatamente isso para testes de integração.

### 2. UUID como chave primária

```prisma
id String @id @default(uuid())
```

Ao invés de IDs sequenciais (1, 2, 3...), usamos UUIDs. Vantagens:

- Não expõem quantos registros existem
- Podem ser gerados no client-side (útil em sistemas distribuídos)
- Não há conflito ao mergear dados de múltiplas fontes

### 3. Campos de auditoria automáticos

```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

Cada registro sabe quando foi criado e quando foi atualizado pela última vez, sem código extra.

### 4. Paginação por padrão

O endpoint `GET /api/books` nunca retorna todos os livros. Sempre retorna uma página:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

Sem paginação, uma tabela com 1 milhão de registros derrubaria o servidor ao serializar tudo em JSON.

### 5. Error handler global

Um único ponto que trata TODOS os erros da aplicação. Consistência na resposta de erro e sem código duplicado.

### 6. Validação na borda

Dados são validados ANTES de chegarem à lógica de negócio. Se inválidos, a request é rejeitada imediatamente, sem desperdício de processamento.

### 7. Mensagens de erro descritivas

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "isbn", "message": "O ISBN deve conter exatamente 10 ou 13 dígitos." },
    { "field": "pages", "message": "O número de páginas deve ser positivo." }
  ]
}
```

O cliente sabe exatamente o que corrigir.

---

## 13. O que estudar depois

Este projeto cobre os fundamentos. Aqui está o que vem depois, em ordem de prioridade:

### Próximo passo imediato
- **TypeScript** — este projeto é JavaScript, mas o mercado Node.js usa TypeScript massivamente. O Prisma brilha com TypeScript (autocomplete e type safety para queries)

### Evolução da API
- **Autorização (RBAC)** — adicionar roles (admin, user) e middleware de autorização por rota
- **Relacionamentos no Prisma** — adicionar entidade `Author` com relação 1:N para `Book`
- **Testes de integração** — usar `supertest` para testar o fluxo HTTP completo
- **Docker** — containerizar a aplicação para deploy consistente

### Arquitetura
- **NestJS** — framework Node.js que implementa tudo que fizemos aqui (e mais) com decorators e convenções. A arquitetura feature-first deste projeto é exatamente o que o NestJS faz
- **Domain-Driven Design (DDD)** — quando a lógica de negócio é complexa, organizar por domínio ao invés de camadas técnicas
- **Clean Architecture** — levar a separação de responsabilidades ao extremo

### Banco de dados
- **Migrations avançadas** — rename de colunas, migração de dados, rollback
- **Índices** — otimização de queries com índices compostos
- **Transactions** — operações atômicas que envolvem múltiplas tabelas

---

*Este documento foi escrito para acompanhar o código do projeto `learning-api`. Leia-o com o código aberto ao lado — cada seção referencia arquivos e trechos reais do projeto.*

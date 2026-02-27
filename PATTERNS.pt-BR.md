# Padrões de Projeto

**Read in English: [PATTERNS.md](./PATTERNS.md)**

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
- `src/modules/book/book.controller.js`, `src/modules/auth/auth.controller.js`
- `src/modules/book/book.service.js`, `src/modules/auth/auth.service.js`
- `src/modules/book/book.repository.js`, `src/modules/auth/auth.repository.js`

---

## 2. Injeção de Dependências (Manual / Baseada em Factory)

Cada camada é uma **factory function** que recebe suas dependências como parâmetros. Nenhum container de DI é necessário — a composição é explícita e fácil de seguir.

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

Isso torna cada camada testável de forma independente, bastando passar objetos mock no lugar das implementações reais. O service de auth também recebe a configuração como dependência, mantendo-o independente do ambiente.

**Arquivos:**
- `src/modules/book/book.routes.js` (composition root)
- `src/modules/auth/auth.routes.js` (composition root)
- Todas as factory functions de ambos os módulos

---

## 3. Padrão Repository

Todo o acesso ao banco de dados é encapsulado por trás de uma interface limpa. A camada de service nunca interage diretamente com o Prisma — ela apenas chama métodos do repository.

- **Book Repository:** `create`, `findMany`, `findById`, `findByIsbn`, `update`, `delete`
- **Auth Repository:** `createUser`, `findUserByEmail`, `findUserById`, `createRefreshToken`, `findRefreshToken`, `deleteRefreshToken`, `deleteAllRefreshTokens`

Isso desacopla a lógica de negócio do ORM ou banco de dados específico sendo utilizado.

**Arquivos:**
- `src/modules/book/book.repository.js`
- `src/modules/auth/auth.repository.js`

---

## 4. Composition Root

O grafo de dependências é montado em um único lugar — o arquivo de rotas de cada módulo. Estes são os **únicos** arquivos que importam o singleton do Prisma e conectam todas as camadas. Todo o resto recebe suas dependências de fora.

**Arquivos:**
- `src/modules/book/book.routes.js`
- `src/modules/auth/auth.routes.js`

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

**Arquivos:** Todos os arquivos em `src/modules/book/` e `src/modules/auth/`

---

## 7. Padrão Middleware

Middlewares do Express são usados para preocupações transversais que não devem estar dentro da lógica de negócio:

- **Middleware de validação** — uma factory que recebe um schema Zod e retorna um middleware que valida o `req.body` antes de chegar ao controller.
- **Middleware de autenticação** — uma factory que recebe o segredo JWT e retorna um middleware que verifica o header `Authorization: Bearer <token>` e popula `req.userId`.
- **Middleware de erro** — um middleware centralizado com 4 argumentos do Express que captura todos os erros e envia respostas HTTP apropriadas.
- **Middlewares de segurança** — `helmet` (headers HTTP), `cors` (cross-origin) e `express-rate-limit` (proteção contra força bruta) aplicados globalmente.

**Arquivos:**
- `src/middlewares/validate.js`
- `src/middlewares/authenticate.js`
- `src/middlewares/errorHandler.js`
- `src/app.js` (registro dos middlewares de segurança)

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

Schemas Zod atuam como Data Transfer Objects (DTOs), definindo a forma exata de uma entrada válida:

- **Book:** `createBookSchema` (campos obrigatórios), `updateBookSchema` (parcial com refinamento), `listBooksQuerySchema` (query params com valores padrão)
- **Auth:** `registerSchema` (nome, email, senha com regras de força), `loginSchema` (email, senha), `refreshTokenSchema` (refresh token)

O resultado do parse substitui o `req.body` original, garantindo que dados validados e sanitizados cheguem ao controller.

**Arquivos:**
- `src/modules/book/book.schema.js`
- `src/modules/auth/auth.schema.js`

---

## 10. Organização por Feature (Feature-First)

O código é organizado **por funcionalidade** (ex: `modules/book/`, `modules/auth/`) em vez de por camada técnica (ex: `controllers/`, `services/`). Cada módulo é autocontido com suas próprias rotas, controller, service, repository, schemas e testes.

Adicionar uma nova funcionalidade significa criar uma nova pasta em `modules/` — sem precisar mexer em múltiplos diretórios de nível superior.

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

## 11. Separação App / Server

A configuração da aplicação Express (`app.js`) é separada da inicialização do servidor HTTP (`server.js`). Isso permite importar o `app` em testes (ex: com `supertest`) sem realmente iniciar o servidor.

**Arquivos:**
- `src/app.js`
- `src/server.js`

---

## 12. Padrão Access Token + Refresh Token

A autenticação usa uma estratégia de token duplo:

- **Access token (JWT):** curta duração (15 minutos), assinado com HS256, contém apenas o ID do usuário (claim `sub`). Verificado pelo middleware `authenticate` em cada requisição protegida.
- **Refresh token (opaco):** longa duração (7 dias), um valor aleatório gerado com `crypto.randomBytes(48)` e armazenado no banco de dados. Usado para obter um novo par de tokens sem precisar digitar as credenciais novamente.

**Rotação de refresh tokens:** cada refresh token só pode ser usado uma vez. Ao ser usado, o token antigo é deletado e um novo é criado. Isso limita o dano de um token comprometido — se um atacante usar um token roubado, a próxima tentativa de refresh do usuário legítimo falhará, sinalizando um possível vazamento.

**Arquivos:**
- `src/modules/auth/auth.service.js` (geração e rotação de tokens)
- `src/middlewares/authenticate.js` (verificação de token)

---

## 13. Barreira de Autenticação por Rota

Rotas públicas e protegidas são separadas pela ordem de registro dos middlewares no `app.js`:

```javascript
// Rotas públicas (antes do authenticate)
app.use("/api/auth", authRoutes);

// Barreira de autenticação
app.use(authenticate(jwtSecret));

// Rotas protegidas (depois do authenticate)
app.use("/api/books", bookRoutes);
```

Essa abordagem aplica autenticação a todas as rotas registradas após o middleware, sem precisar adicionar `authenticate` a cada rota individual. Adicionar um novo módulo protegido requer apenas registrá-lo após a barreira.

**Arquivo:** `src/app.js`

---

## Resumo dos Padrões

| Padrão | Onde | Por quê |
|---|---|---|
| Arquitetura em Camadas | `modules/*/*.js` | Separação de responsabilidades |
| Injeção de Dependências | Factory functions + arquivos de rotas | Testabilidade, baixo acoplamento |
| Padrão Repository | `*.repository.js` | Desacoplar lógica de negócio do ORM |
| Composition Root | `*.routes.js` | Ponto único de composição por módulo |
| Singleton | `lib/prisma.js` | Conexão compartilhada com o banco |
| Factory Functions | Todas as camadas | JS idiomático, evita problemas com `this` |
| Middleware | `middlewares/*.js` | Preocupações transversais |
| Erros Centralizados | `errorHandler.js` + `AppError.js` | Respostas de erro consistentes |
| Validação / DTO | `*.schema.js` + `validate.js` | Sanitização de entrada na borda |
| Módulos por Feature | Diretório `modules/` | Organização escalável |
| Separação App / Server | `app.js` + `server.js` | Testabilidade |
| Access + Refresh Tokens | `auth.service.js` + `authenticate.js` | Autenticação segura e stateless |
| Barreira de Auth por Rota | Ordem dos middlewares no `app.js` | Separação limpa público/protegido |

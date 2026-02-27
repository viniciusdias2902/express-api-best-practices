# Padroes de Projeto

**Read in English: [PATTERNS.md](./PATTERNS.md)**

Este documento descreve os padroes de projeto e decisoes arquiteturais utilizados neste projeto, com referencias aos arquivos reais do codigo-fonte.

---

## 1. Arquitetura em Camadas (3 Camadas)

A aplicacao e dividida em tres camadas distintas com fronteiras rigidas. Cada camada tem uma unica responsabilidade e so se comunica com sua vizinha imediata.

```
Controller (HTTP) → Service (Logica de Negocio) → Repository (Acesso a Dados) → Banco de Dados
```

- **Controller** — traduz requisicoes/respostas HTTP. Nao sabe nada sobre o banco de dados.
- **Service** — aplica regras de negocio. Nao sabe nada sobre HTTP ou Prisma.
- **Repository** — encapsula queries do banco. Nao sabe nada sobre regras de negocio ou HTTP.

**Arquivos:**
- `src/modules/book/book.controller.js`, `src/modules/auth/auth.controller.js`
- `src/modules/book/book.service.js`, `src/modules/auth/auth.service.js`
- `src/modules/book/book.repository.js`, `src/modules/auth/auth.repository.js`

---

## 2. Injecao de Dependencias (Manual / Baseada em Factory)

Cada camada e uma **factory function** que recebe suas dependencias como parametros. Nenhum container de DI e necessario — a composicao e explicita e facil de seguir.

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

Isso torna cada camada testavel de forma independente, bastando passar objetos mock no lugar das implementacoes reais. O service de auth tambem recebe a configuracao como dependencia, mantendo-o independente do ambiente.

**Arquivos:**
- `src/modules/book/book.routes.js` (composition root)
- `src/modules/auth/auth.routes.js` (composition root)
- Todas as factory functions de ambos os modulos

---

## 3. Padrao Repository

Todo o acesso ao banco de dados e encapsulado por tras de uma interface limpa. A camada de service nunca interage diretamente com o Prisma — ela apenas chama metodos do repository.

- **Book Repository:** `create`, `findMany`, `findById`, `findByIsbn`, `update`, `delete`
- **Auth Repository:** `createUser`, `findUserByEmail`, `findUserById`, `createRefreshToken`, `findRefreshToken`, `deleteRefreshToken`, `deleteAllRefreshTokens`

Isso desacopla a logica de negocio do ORM ou banco de dados especifico sendo utilizado.

**Arquivos:**
- `src/modules/book/book.repository.js`
- `src/modules/auth/auth.repository.js`

---

## 4. Composition Root

O grafo de dependencias e montado em um unico lugar — o arquivo de rotas de cada modulo. Estes sao os **unicos** arquivos que importam o singleton do Prisma e conectam todas as camadas. Todo o resto recebe suas dependencias de fora.

**Arquivos:**
- `src/modules/book/book.routes.js`
- `src/modules/auth/auth.routes.js`

---

## 5. Padrao Singleton

O `PrismaClient` e instanciado uma unica vez e compartilhado por toda a aplicacao. Isso evita a criacao de multiplos pools de conexao com o banco de dados.

**Arquivo:** `src/lib/prisma.js`

---

## 6. Padrao Factory Function

Em vez de classes, cada camada exporta uma factory function que retorna um objeto simples com metodos. Isso e JavaScript idiomatico e evita problemas com `this`, mantendo o codigo simples e funcional.

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

## 7. Padrao Middleware

Middlewares do Express sao usados para preocupacoes transversais que nao devem estar dentro da logica de negocio:

- **Middleware de validacao** — uma factory que recebe um schema Zod e retorna um middleware que valida o `req.body` antes de chegar ao controller.
- **Middleware de autenticacao** — uma factory que recebe o segredo JWT e retorna um middleware que verifica o header `Authorization: Bearer <token>` e popula `req.userId`.
- **Middleware de erro** — um middleware centralizado com 4 argumentos do Express que captura todos os erros e envia respostas HTTP apropriadas.
- **Middlewares de seguranca** — `helmet` (headers HTTP), `cors` (cross-origin) e `express-rate-limit` (protecao contra forca bruta) aplicados globalmente.

**Arquivos:**
- `src/middlewares/validate.js`
- `src/middlewares/authenticate.js`
- `src/middlewares/errorHandler.js`
- `src/app.js` (registro dos middlewares de seguranca)

---

## 8. Tratamento Centralizado de Erros

Todos os erros fluem atraves do `next(error)` para um unico handler de erros. O handler categoriza os erros por tipo e responde adequadamente:

| Tipo de Erro | Status HTTP | Deteccao |
|---|---|---|
| Erro de validacao | 400 | Possui propriedade `details` |
| Constraint unica do Prisma (P2002) | 409 | Codigo de erro do Prisma |
| Nao encontrado do Prisma (P2025) | 404 | Codigo de erro do Prisma |
| AppError | Dinamico | Possui propriedade `statusCode` |
| Desconhecido | 500 | Fallback (mensagem generica, sem vazamento) |

Isso elimina blocos `try/catch` espalhados e garante respostas de erro consistentes.

**Arquivos:**
- `src/errors/AppError.js`
- `src/middlewares/errorHandler.js`

---

## 9. Validacao de Schema / Padrao DTO

Schemas Zod atuam como Data Transfer Objects (DTOs), definindo a forma exata de uma entrada valida:

- **Book:** `createBookSchema` (campos obrigatorios), `updateBookSchema` (parcial com refinamento), `listBooksQuerySchema` (query params com valores padrao)
- **Auth:** `registerSchema` (nome, email, senha com regras de forca), `loginSchema` (email, senha), `refreshTokenSchema` (refresh token)

O resultado do parse substitui o `req.body` original, garantindo que dados validados e sanitizados cheguem ao controller.

**Arquivos:**
- `src/modules/book/book.schema.js`
- `src/modules/auth/auth.schema.js`

---

## 10. Organizacao por Feature (Feature-First)

O codigo e organizado **por funcionalidade** (ex: `modules/book/`, `modules/auth/`) em vez de por camada tecnica (ex: `controllers/`, `services/`). Cada modulo e autocontido com suas proprias rotas, controller, service, repository, schemas e testes.

Adicionar uma nova funcionalidade significa criar uma nova pasta em `modules/` — sem precisar mexer em multiplos diretorios de nivel superior.

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

## 11. Separacao App / Server

A configuracao da aplicacao Express (`app.js`) e separada da inicializacao do servidor HTTP (`server.js`). Isso permite importar o `app` em testes (ex: com `supertest`) sem realmente iniciar o servidor.

**Arquivos:**
- `src/app.js`
- `src/server.js`

---

## 12. Padrao Access Token + Refresh Token

A autenticacao usa uma estrategia de token duplo:

- **Access token (JWT):** curta duracao (15 minutos), assinado com HS256, contem apenas o ID do usuario (claim `sub`). Verificado pelo middleware `authenticate` em cada requisicao protegida.
- **Refresh token (opaco):** longa duracao (7 dias), um valor aleatorio gerado com `crypto.randomBytes(48)` e armazenado no banco de dados. Usado para obter um novo par de tokens sem precisar digitar as credenciais novamente.

**Rotacao de refresh tokens:** cada refresh token so pode ser usado uma vez. Ao ser usado, o token antigo e deletado e um novo e criado. Isso limita o dano de um token comprometido — se um atacante usar um token roubado, a proxima tentativa de refresh do usuario legitimo falhara, sinalizando um possivel vazamento.

**Arquivos:**
- `src/modules/auth/auth.service.js` (geracao e rotacao de tokens)
- `src/middlewares/authenticate.js` (verificacao de token)

---

## 13. Barreira de Autenticacao por Rota

Rotas publicas e protegidas sao separadas pela ordem de registro dos middlewares no `app.js`:

```javascript
// Rotas publicas (antes do authenticate)
app.use("/api/auth", authRoutes);

// Barreira de autenticacao
app.use(authenticate(jwtSecret));

// Rotas protegidas (depois do authenticate)
app.use("/api/books", bookRoutes);
```

Essa abordagem aplica autenticacao a todas as rotas registradas apos o middleware, sem precisar adicionar `authenticate` a cada rota individual. Adicionar um novo modulo protegido requer apenas registra-lo apos a barreira.

**Arquivo:** `src/app.js`

---

## Resumo dos Padroes

| Padrao | Onde | Por que |
|---|---|---|
| Arquitetura em Camadas | `modules/*/*.js` | Separacao de responsabilidades |
| Injecao de Dependencias | Factory functions + arquivos de rotas | Testabilidade, baixo acoplamento |
| Padrao Repository | `*.repository.js` | Desacoplar logica de negocio do ORM |
| Composition Root | `*.routes.js` | Ponto unico de composicao por modulo |
| Singleton | `lib/prisma.js` | Conexao compartilhada com o banco |
| Factory Functions | Todas as camadas | JS idiomatico, evita problemas com `this` |
| Middleware | `middlewares/*.js` | Preocupacoes transversais |
| Erros Centralizados | `errorHandler.js` + `AppError.js` | Respostas de erro consistentes |
| Validacao / DTO | `*.schema.js` + `validate.js` | Sanitizacao de entrada na borda |
| Modulos por Feature | Diretorio `modules/` | Organizacao escalavel |
| Separacao App / Server | `app.js` + `server.js` | Testabilidade |
| Access + Refresh Tokens | `auth.service.js` + `authenticate.js` | Autenticacao segura e stateless |
| Barreira de Auth por Rota | Ordem dos middlewares no `app.js` | Separacao limpa publico/protegido |

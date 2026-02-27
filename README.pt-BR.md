# Learning API

**Read in English: [README.md](./README.md)**

> **Aviso:** Este **nao** e um projeto real de producao. E uma API REST simples construida inteiramente por inteligencia artificial, criada como referencia pratica para o estudo de praticas modernas de desenvolvimento backend utilizadas no mercado.

## Objetivo

Este projeto existe exclusivamente para **fins educacionais**. Ele demonstra como estruturar uma API REST em Node.js seguindo convencoes e boas praticas amplamente adotadas — desde arquitetura em camadas e injecao de dependencias ate autenticacao, validacao de entrada e tratamento centralizado de erros.

Se voce esta aprendendo desenvolvimento backend, use este codigo como referencia para entender **por que** as coisas sao organizadas dessa forma, nao apenas **como**.

## Stack Tecnologica

| Tecnologia | Versao | Funcao |
|---|---|---|
| Node.js | 22+ | Runtime (ES Modules nativo) |
| Express | 5 | Framework HTTP |
| Prisma | 7 | ORM / acesso a dados |
| PostgreSQL | — | Banco de dados relacional |
| Zod | 4 | Validacao de schemas |
| Argon2 | — | Hash de senhas |
| Jose | — | Assinatura e verificacao de JWT |
| Helmet | — | Headers HTTP de seguranca |
| CORS | — | Cross-Origin Resource Sharing |
| express-rate-limit | — | Limitacao de requisicoes |
| Jest | 30 | Framework de testes |

## Estrutura do Projeto

```
src/
├── server.js              # Ponto de entrada — inicia o servidor HTTP
├── app.js                 # Configuracao do Express e pipeline de middlewares
├── lib/
│   └── prisma.js          # Singleton do PrismaClient
├── errors/
│   └── AppError.js        # Classe de erro customizada
├── middlewares/
│   ├── validate.js        # Middleware de validacao com Zod
│   ├── authenticate.js    # Middleware de autenticacao JWT
│   └── errorHandler.js    # Handler global de erros
└── modules/
    ├── auth/
    │   ├── auth.schema.js       # Schemas de validacao (registro, login, refresh)
    │   ├── auth.repository.js   # Acesso a dados (User + RefreshToken)
    │   ├── auth.service.js      # Logica de negocio (registro, login, refresh, logout)
    │   ├── auth.controller.js   # Camada HTTP
    │   ├── auth.routes.js       # Rotas + composicao de dependencias
    │   └── __tests__/           # Testes unitarios
    └── book/
        ├── book.schema.js       # Schemas de validacao (DTOs)
        ├── book.repository.js   # Camada de acesso a dados
        ├── book.service.js      # Camada de logica de negocio
        ├── book.controller.js   # Camada HTTP
        ├── book.routes.js       # Rotas + composicao de dependencias
        └── __tests__/           # Testes unitarios
```

## Endpoints da API

### Health Check

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| GET | `/api/health` | Publica | Retorna o status da API |

### Autenticacao

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| POST | `/api/auth/register` | Publica | Registrar novo usuario |
| POST | `/api/auth/login` | Publica | Autenticar e obter tokens |
| POST | `/api/auth/refresh` | Publica | Renovar access token |
| POST | `/api/auth/logout` | Publica | Revogar refresh token |

### Livros

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| POST | `/api/books` | Requerida | Criar um livro |
| GET | `/api/books` | Requerida | Listar livros (paginado, com busca e filtros) |
| GET | `/api/books/:id` | Requerida | Buscar um livro por ID |
| PUT | `/api/books/:id` | Requerida | Atualizar um livro |
| DELETE | `/api/books/:id` | Requerida | Excluir um livro |

## Fluxo de Autenticacao

A API usa autenticacao por **access token + refresh token**:

1. **Registre-se** ou faca **Login** para obter um `accessToken` (JWT, 15min) e um `refreshToken` (opaco, 7 dias)
2. Envie o access token no header `Authorization` nas rotas protegidas:
   ```
   Authorization: Bearer <accessToken>
   ```
3. Quando o access token expirar, use o endpoint **refresh** para obter um novo par de tokens
4. O **Logout** revoga o refresh token (o access token permanece valido ate expirar)

Os refresh tokens usam **rotacao**: cada refresh token so pode ser usado uma vez. Apos o uso, um novo e emitido e o antigo e deletado.

## Como Comecar

```bash
# Instalar dependencias
npm install

# Configurar variaveis de ambiente
cp .env.example .env
# Edite o .env com a URL do seu banco de dados e o segredo JWT

# Executar migracoes do banco
npm run prisma:migrate

# Gerar o Prisma Client
npm run prisma:generate

# Iniciar em modo de desenvolvimento
npm run dev

# Executar testes
npm test
```

## Scripts Disponiveis

| Script | Descricao |
|---|---|
| `npm run dev` | Inicia com observacao de arquivos |
| `npm start` | Inicio em producao |
| `npm test` | Executa testes unitarios |
| `npm run prisma:generate` | Regenera o Prisma Client |
| `npm run prisma:migrate` | Executa migracoes do banco |
| `npm run prisma:studio` | Abre o Prisma Studio |

## Documentacao

- **[PATTERNS.pt-BR.md](./PATTERNS.pt-BR.md)** — Padroes de projeto utilizados
- **[PATTERNS.md](./PATTERNS.md)** — Design patterns (English)
- **[GUIDE.md](./GUIDE.md)** — Guia educacional detalhado

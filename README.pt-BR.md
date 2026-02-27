# Learning API

**Read in English: [README.md](./README.md)**

> **Aviso:** Este **não** é um projeto real de produção. É uma API REST simples construída inteiramente por inteligência artificial, criada como referência prática para o estudo de práticas modernas de desenvolvimento backend utilizadas no mercado.

## Objetivo

Este projeto existe exclusivamente para **fins educacionais**. Ele demonstra como estruturar uma API REST em Node.js seguindo convenções e boas práticas amplamente adotadas — desde arquitetura em camadas e injeção de dependências até autenticação, validação de entrada e tratamento centralizado de erros.

Se você está aprendendo desenvolvimento backend, use este código como referência para entender **por que** as coisas são organizadas dessa forma, não apenas **como**.

## Stack Tecnológica

| Tecnologia | Versão | Função |
|---|---|---|
| Node.js | 22+ | Runtime (ES Modules nativo) |
| Express | 5 | Framework HTTP |
| Prisma | 7 | ORM / acesso a dados |
| PostgreSQL | — | Banco de dados relacional |
| Zod | 4 | Validação de schemas |
| Argon2 | — | Hash de senhas |
| Jose | — | Assinatura e verificação de JWT |
| Helmet | — | Headers HTTP de segurança |
| CORS | — | Cross-Origin Resource Sharing |
| express-rate-limit | — | Limitação de requisições |
| Vitest | 3 | Framework de testes |

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
│   ├── authenticate.js    # Middleware de autenticação JWT
│   └── errorHandler.js    # Handler global de erros
└── modules/
    ├── auth/
    │   ├── auth.schema.js       # Schemas de validação (registro, login, refresh)
    │   ├── auth.repository.js   # Acesso a dados (User + RefreshToken)
    │   ├── auth.service.js      # Lógica de negócio (registro, login, refresh, logout)
    │   ├── auth.controller.js   # Camada HTTP
    │   ├── auth.routes.js       # Rotas + composição de dependências
    │   └── __tests__/           # Testes unitários
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

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/health` | Pública | Retorna o status da API |

### Autenticação

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/auth/register` | Pública | Registrar novo usuário |
| POST | `/api/auth/login` | Pública | Autenticar e obter tokens |
| POST | `/api/auth/refresh` | Pública | Renovar access token |
| POST | `/api/auth/logout` | Pública | Revogar refresh token |

### Livros

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/books` | Requerida | Criar um livro |
| GET | `/api/books` | Requerida | Listar livros (paginado, com busca e filtros) |
| GET | `/api/books/:id` | Requerida | Buscar um livro por ID |
| PUT | `/api/books/:id` | Requerida | Atualizar um livro |
| DELETE | `/api/books/:id` | Requerida | Excluir um livro |

## Fluxo de Autenticação

A API usa autenticação por **access token + refresh token**:

1. **Registre-se** ou faça **Login** para obter um `accessToken` (JWT, 15min) e um `refreshToken` (opaco, 7 dias)
2. Envie o access token no header `Authorization` nas rotas protegidas:
   ```
   Authorization: Bearer <accessToken>
   ```
3. Quando o access token expirar, use o endpoint **refresh** para obter um novo par de tokens
4. O **Logout** revoga o refresh token (o access token permanece válido até expirar)

Os refresh tokens usam **rotação**: cada refresh token só pode ser usado uma vez. Após o uso, um novo é emitido e o antigo é deletado.

## Como Começar

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com a URL do seu banco de dados e o segredo JWT

# Executar migrações do banco
npm run prisma:migrate

# Gerar o Prisma Client
npm run prisma:generate

# Iniciar em modo de desenvolvimento
npm run dev

# Executar testes
npm test
```

## Scripts Disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia com observação de arquivos |
| `npm start` | Início em produção |
| `npm test` | Executa testes unitários |
| `npm run prisma:generate` | Regenera o Prisma Client |
| `npm run prisma:migrate` | Executa migrações do banco |
| `npm run prisma:studio` | Abre o Prisma Studio |

## Documentação

- **[PATTERNS.pt-BR.md](./PATTERNS.pt-BR.md)** — Padrões de projeto utilizados
- **[PATTERNS.md](./PATTERNS.md)** — Design patterns (English)
- **[GUIDE.md](./GUIDE.md)** — Guia educacional detalhado

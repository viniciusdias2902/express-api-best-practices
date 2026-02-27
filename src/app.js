import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { bookRoutes } from "./modules/book/book.routes.js";
import { authenticate } from "./middlewares/authenticate.js";
import { errorHandler } from "./middlewares/errorHandler.js";

/**
 * Configuração da aplicação Express.
 *
 * Separamos a criação do app (app.js) do servidor HTTP (server.js).
 * Isso é uma boa prática porque:
 *
 * 1. Nos testes, importamos só o app (sem subir o servidor)
 * 2. O server.js fica responsável apenas por "ouvir" a porta
 * 3. Facilita testes de integração com supertest no futuro
 */
const app = express();

// ─── Middlewares de Segurança ─────────────────────────────────────

/**
 * Helmet: define headers HTTP de segurança automaticamente.
 * Protege contra ataques como clickjacking, XSS, sniffing de MIME type, etc.
 */
app.use(helmet());

/**
 * CORS: habilita Cross-Origin Resource Sharing.
 * Em produção, configure a opção `origin` para aceitar apenas domínios confiados.
 */
app.use(cors());

/**
 * Rate Limiting: limita o número de requests por IP.
 * Protege contra ataques de força bruta e abuso da API.
 *
 * Configuração padrão: 100 requests a cada 15 minutos por IP.
 * A mensagem segue o padrão de erro da aplicação.
 */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Muitas requisições. Tente novamente mais tarde." },
  })
);

// ─── Middleware de Body Parsing ───────────────────────────────────

app.use(express.json());

// ─── Rota de Health Check ─────────────────────────────────────────

/**
 * GET /api/health
 * Rota pública útil para monitoramento e deploy.
 */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Rotas Públicas ───────────────────────────────────────────────

/**
 * Rotas de autenticação (registro, login, refresh, logout).
 * São públicas — não exigem token de acesso.
 */
app.use("/api/auth", authRoutes);

// ─── Middleware de Autenticação ───────────────────────────────────

/**
 * A partir daqui, todas as rotas exigem autenticação.
 * O middleware authenticate() verifica o JWT no header Authorization
 * e disponibiliza req.userId para os controllers.
 *
 * A ordem de registro importa:
 * 1. Rotas públicas (health, auth) ficam ANTES do authenticate
 * 2. Rotas protegidas (books) ficam DEPOIS
 */
const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);
app.use(authenticate(jwtSecret));

// ─── Rotas Protegidas ─────────────────────────────────────────────

/**
 * Rotas do módulo book — requerem autenticação.
 * O usuário precisa enviar um access token válido no header:
 * Authorization: Bearer <token>
 */
app.use("/api/books", bookRoutes);

// ─── Middleware de Erro ───────────────────────────────────────────

/**
 * Middleware de erro — DEVE ser registrado por último.
 * Captura todos os erros passados via next(error).
 */
app.use(errorHandler);

export { app };

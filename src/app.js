import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { bookRoutes } from "./modules/book/book.routes.js";
import { authenticate } from "./middlewares/authenticate.js";
import { errorHandler } from "./middlewares/errorHandler.js";

/**
 * Configuracao da aplicacao Express.
 *
 * Separamos a criacao do app (app.js) do servidor HTTP (server.js).
 * Isso e uma boa pratica porque:
 *
 * 1. Nos testes, importamos so o app (sem subir o servidor)
 * 2. O server.js fica responsavel apenas por "ouvir" a porta
 * 3. Facilita testes de integracao com supertest no futuro
 */
const app = express();

// ─── Middlewares de Seguranca ─────────────────────────────────────

/**
 * Helmet: define headers HTTP de seguranca automaticamente.
 * Protege contra ataques como clickjacking, XSS, sniffing de MIME type, etc.
 */
app.use(helmet());

/**
 * CORS: habilita Cross-Origin Resource Sharing.
 * Em producao, configure a opcao `origin` para aceitar apenas dominios confiados.
 */
app.use(cors());

/**
 * Rate Limiting: limita o numero de requests por IP.
 * Protege contra ataques de forca bruta e abuso da API.
 *
 * Configuracao padrao: 100 requests a cada 15 minutos por IP.
 * A mensagem segue o padrao de erro da aplicacao.
 */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Muitas requisicoes. Tente novamente mais tarde." },
  })
);

// ─── Middleware de Body Parsing ───────────────────────────────────

app.use(express.json());

// ─── Rota de Health Check ─────────────────────────────────────────

/**
 * GET /api/health
 * Rota publica util para monitoramento e deploy.
 */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Rotas Publicas ───────────────────────────────────────────────

/**
 * Rotas de autenticacao (registro, login, refresh, logout).
 * Sao publicas — nao exigem token de acesso.
 */
app.use("/api/auth", authRoutes);

// ─── Middleware de Autenticacao ───────────────────────────────────

/**
 * A partir daqui, todas as rotas exigem autenticacao.
 * O middleware authenticate() verifica o JWT no header Authorization
 * e disponibiliza req.userId para os controllers.
 *
 * A ordem de registro importa:
 * 1. Rotas publicas (health, auth) ficam ANTES do authenticate
 * 2. Rotas protegidas (books) ficam DEPOIS
 */
const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);
app.use(authenticate(jwtSecret));

// ─── Rotas Protegidas ─────────────────────────────────────────────

/**
 * Rotas do modulo book — requerem autenticacao.
 * O usuario precisa enviar um access token valido no header:
 * Authorization: Bearer <token>
 */
app.use("/api/books", bookRoutes);

// ─── Middleware de Erro ───────────────────────────────────────────

/**
 * Middleware de erro — DEVE ser registrado por ultimo.
 * Captura todos os erros passados via next(error).
 */
app.use(errorHandler);

export { app };

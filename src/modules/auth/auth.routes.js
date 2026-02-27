import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "./auth.schema.js";
import { createAuthRepository } from "./auth.repository.js";
import { createAuthService } from "./auth.service.js";
import { createAuthController } from "./auth.controller.js";
import { prisma } from "../../lib/prisma.js";

/**
 * Auth Routes
 *
 * Ponto de montagem (composition root) do módulo de autenticação.
 * Aqui acontece a composição das camadas:
 *
 *   prisma → repository → service → controller → routes
 *
 * O service recebe também as configurações de JWT, carregadas
 * das variáveis de ambiente. O TextEncoder converte o segredo
 * para Uint8Array, formato exigido pela biblioteca jose.
 */

// ─── Configurações JWT a partir de variáveis de ambiente ──────────

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "15m";
const refreshTokenExpiresInDays = Number(
  process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || 7
);

// ─── Composição das camadas ───────────────────────────────────────

const repository = createAuthRepository(prisma);
const service = createAuthService(repository, {
  jwtSecret,
  jwtExpiresIn,
  refreshTokenExpiresInDays,
});
const controller = createAuthController(service);

const router = Router();

/**
 * POST /api/auth/register
 * Registra um novo usuário.
 * Body: { name, email, password }
 */
router.post("/register", validate(registerSchema), (req, res, next) =>
  controller.register(req, res, next)
);

/**
 * POST /api/auth/login
 * Autentica o usuário.
 * Body: { email, password }
 */
router.post("/login", validate(loginSchema), (req, res, next) =>
  controller.login(req, res, next)
);

/**
 * POST /api/auth/refresh
 * Renova os tokens usando o refresh token.
 * Body: { refreshToken }
 */
router.post("/refresh", validate(refreshTokenSchema), (req, res, next) =>
  controller.refresh(req, res, next)
);

/**
 * POST /api/auth/logout
 * Revoga o refresh token.
 * Body: { refreshToken }
 */
router.post("/logout", validate(refreshTokenSchema), (req, res, next) =>
  controller.logout(req, res, next)
);

export { router as authRoutes };

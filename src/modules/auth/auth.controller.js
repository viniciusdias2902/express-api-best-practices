/**
 * Auth Controller
 *
 * Camada HTTP da autenticação. Segue o mesmo padrão do BookController:
 * - Recebe a request, extrai dados do body
 * - Chama o service adequado
 * - Formata e envia a response
 * - Delega erros via next()
 *
 * Endpoints:
 * - POST /register → cria usuário e retorna tokens
 * - POST /login    → autentica e retorna tokens
 * - POST /refresh  → renova tokens
 * - POST /logout   → revoga refresh token
 *
 * Recebe o service por injeção de dependência.
 */

/**
 * Cria o controller de autenticação.
 *
 * @param {ReturnType<import("./auth.service.js").createAuthService>} service
 * @returns {object} Objeto com métodos handler do Express
 */
export function createAuthController(service) {
  return {
    /**
     * POST /api/auth/register
     * Registra um novo usuário e retorna os tokens de acesso.
     */
    async register(req, res, next) {
      try {
        const result = await service.register(req.body);
        return res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },

    /**
     * POST /api/auth/login
     * Autentica o usuário e retorna os tokens de acesso.
     */
    async login(req, res, next) {
      try {
        const result = await service.login(req.body);
        return res.json(result);
      } catch (error) {
        next(error);
      }
    },

    /**
     * POST /api/auth/refresh
     * Gera novos tokens a partir de um refresh token válido.
     */
    async refresh(req, res, next) {
      try {
        const { refreshToken } = req.body;
        const result = await service.refresh(refreshToken);
        return res.json(result);
      } catch (error) {
        next(error);
      }
    },

    /**
     * POST /api/auth/logout
     * Revoga o refresh token (logout).
     */
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

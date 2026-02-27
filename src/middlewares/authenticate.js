import { jwtVerify } from "jose";

/**
 * Middleware factory de autenticação via JWT.
 *
 * Verifica o access token enviado no header Authorization (formato Bearer).
 * Se o token for válido, extrai o userId do claim `sub` e o disponibiliza
 * em `req.userId` para uso nos controllers downstream.
 *
 * É uma factory (recebe o secret) para manter a testabilidade:
 * nos testes podemos injetar um secret diferente sem depender de env vars.
 *
 * Fluxo:
 * 1. Extrai o token do header "Authorization: Bearer <token>"
 * 2. Verifica assinatura e expiração com jose
 * 3. Se válido: req.userId = payload.sub, chama next()
 * 4. Se inválido/ausente: retorna 401 via next(error)
 *
 * @param {Uint8Array} jwtSecret - Segredo para verificar a assinatura do JWT
 * @returns {import("express").RequestHandler} Middleware do Express
 */
export function authenticate(jwtSecret) {
  return async (req, _res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        const error = new Error("Token de autenticação não fornecido.");
        error.statusCode = 401;
        return next(error);
      }

      // Extrai o token após "Bearer "
      const token = authHeader.slice(7);

      // Verifica assinatura e expiração
      const { payload } = await jwtVerify(token, jwtSecret);

      // Disponibiliza o userId para os controllers
      req.userId = payload.sub;

      next();
    } catch (error) {
      // Erros do jose (token expirado, assinatura inválida, etc.)
      const authError = new Error("Token inválido ou expirado.");
      authError.statusCode = 401;
      next(authError);
    }
  };
}

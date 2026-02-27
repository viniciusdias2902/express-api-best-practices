import { SignJWT } from "jose";
import * as argon2 from "argon2";
import crypto from "node:crypto";
import { AppError } from "../../errors/AppError.js";

/**
 * Auth Service
 *
 * Contém toda a lógica de negócio da autenticação:
 * - Registro: hash da senha com Argon2, verificação de email duplicado
 * - Login: verificação de credenciais, geração de tokens
 * - Refresh: rotação de refresh tokens (o antigo é deletado, um novo é criado)
 * - Logout: revogação do refresh token
 *
 * Usa o padrão de access token + refresh token:
 * - Access token (JWT): curta duração (15min), enviado no header Authorization
 * - Refresh token (opaco): longa duração (7d), armazenado no banco
 *
 * O refresh token é um valor aleatório (não JWT) para simplificar a revogação:
 * basta deletar do banco para invalidá-lo.
 *
 * Recebe o repository e as configurações de JWT por injeção de dependência.
 */

/**
 * Cria o service de autenticação.
 *
 * @param {ReturnType<import("./auth.repository.js").createAuthRepository>} repository
 * @param {object} config - Configurações de JWT
 * @param {Uint8Array} config.jwtSecret - Segredo para assinar JWTs (codificado como Uint8Array)
 * @param {string} config.jwtExpiresIn - Tempo de expiração do access token (ex: "15m")
 * @param {number} config.refreshTokenExpiresInDays - Dias de validade do refresh token
 * @returns {object} Objeto com métodos de autenticação
 */
export function createAuthService(repository, config) {
  /**
   * Gera um access token JWT assinado com HS256.
   * O payload contém apenas o ID do usuário (sub claim).
   * @param {string} userId
   * @returns {Promise<string>} Token JWT assinado
   */
  async function generateAccessToken(userId) {
    return new SignJWT({ sub: userId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(config.jwtExpiresIn)
      .sign(config.jwtSecret);
  }

  /**
   * Gera um refresh token opaco (aleatório) e o persiste no banco.
   * @param {string} userId
   * @returns {Promise<string>} O valor do refresh token
   */
  async function generateRefreshToken(userId) {
    const token = crypto.randomBytes(48).toString("base64url");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.refreshTokenExpiresInDays);

    await repository.createRefreshToken({ token, userId, expiresAt });

    return token;
  }

  return {
    /**
     * Registra um novo usuário.
     *
     * 1. Verifica se o email já está em uso
     * 2. Faz hash da senha com Argon2
     * 3. Cria o usuário no banco
     * 4. Gera o par de tokens (access + refresh)
     *
     * @param {object} data - { name, email, password }
     * @returns {Promise<object>} { user, accessToken, refreshToken }
     */
    async register(data) {
      const existingUser = await repository.findUserByEmail(data.email);
      if (existingUser) {
        throw new AppError("Já existe um usuário com este email.", 409);
      }

      const hashedPassword = await argon2.hash(data.password);
      const user = await repository.createUser({
        name: data.name,
        email: data.email,
        password: hashedPassword,
      });

      const accessToken = await generateAccessToken(user.id);
      const refreshToken = await generateRefreshToken(user.id);

      return { user, accessToken, refreshToken };
    },

    /**
     * Autentica um usuário com email e senha.
     *
     * 1. Busca o usuário pelo email
     * 2. Verifica a senha com Argon2
     * 3. Gera o par de tokens
     *
     * Usa mensagem genérica ("Credenciais inválidas") para não revelar
     * se o email existe ou não (prevenção de enumeração de usuários).
     *
     * @param {object} data - { email, password }
     * @returns {Promise<object>} { user, accessToken, refreshToken }
     */
    async login(data) {
      const user = await repository.findUserByEmail(data.email);
      if (!user) {
        throw new AppError("Credenciais inválidas.", 401);
      }

      const isPasswordValid = await argon2.verify(user.password, data.password);
      if (!isPasswordValid) {
        throw new AppError("Credenciais inválidas.", 401);
      }

      const accessToken = await generateAccessToken(user.id);
      const refreshToken = await generateRefreshToken(user.id);

      // Remove o password do objeto antes de retornar
      const { password: _, ...userWithoutPassword } = user;

      return { user: userWithoutPassword, accessToken, refreshToken };
    },

    /**
     * Gera um novo par de tokens a partir de um refresh token válido.
     *
     * Implementa rotação de refresh tokens:
     * 1. Busca o refresh token no banco
     * 2. Verifica se não está expirado
     * 3. Deleta o token antigo (uso único)
     * 4. Gera novos tokens (access + refresh)
     *
     * A rotação é uma medida de segurança: se um refresh token for
     * comprometido, ele só pode ser usado uma vez. O token legítimo
     * do usuário falhará, sinalizando um possível vazamento.
     *
     * @param {string} token - Refresh token atual
     * @returns {Promise<object>} { accessToken, refreshToken }
     */
    async refresh(token) {
      const storedToken = await repository.findRefreshToken(token);
      if (!storedToken) {
        throw new AppError("Refresh token inválido.", 401);
      }

      // Verifica se o token expirou
      if (new Date() > storedToken.expiresAt) {
        // Remove o token expirado do banco
        await repository.deleteRefreshToken(token);
        throw new AppError("Refresh token expirado.", 401);
      }

      // Rotação: deleta o token antigo e gera um novo par
      await repository.deleteRefreshToken(token);

      const accessToken = await generateAccessToken(storedToken.userId);
      const refreshToken = await generateRefreshToken(storedToken.userId);

      return { accessToken, refreshToken };
    },

    /**
     * Revoga um refresh token (logout).
     * O access token continuará válido até expirar, mas sem o refresh
     * token o cliente não poderá renová-lo.
     *
     * @param {string} token - Refresh token a ser revogado
     */
    async logout(token) {
      const storedToken = await repository.findRefreshToken(token);
      if (!storedToken) {
        // Não lança erro — logout é idempotente
        return;
      }

      await repository.deleteRefreshToken(token);
    },
  };
}

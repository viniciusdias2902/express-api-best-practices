/**
 * Auth Repository
 *
 * Camada de acesso a dados para autenticação.
 * Encapsula as queries do Prisma para as tabelas User e RefreshToken.
 *
 * Segue o mesmo padrão do BookRepository:
 * - Recebe o Prisma por injeção de dependência
 * - Retorna um objeto com métodos de acesso a dados
 * - Não contém lógica de negócio
 *
 * O refresh token é armazenado no banco para permitir:
 * - Revogação individual (logout)
 * - Rotação de tokens (um refresh token só pode ser usado uma vez)
 * - Limpeza de tokens expirados
 */

/**
 * Cria o repositório de autenticação.
 *
 * @param {import("../../../generated/prisma/client.js").PrismaClient} prisma
 * @returns {object} Objeto com métodos de acesso a dados
 */
export function createAuthRepository(prisma) {
  return {
    // ─── Operações de User ────────────────────────────────────

    /**
     * Cria um novo usuário.
     * @param {object} data - { name, email, password (já com hash) }
     * @returns {Promise<object>} Usuário criado (sem o campo password)
     */
    async createUser(data) {
      const user = await prisma.user.create({ data });
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    },

    /**
     * Busca um usuário pelo email.
     * Retorna TODOS os campos, incluindo password (necessário para login).
     * @param {string} email
     * @returns {Promise<object|null>}
     */
    async findUserByEmail(email) {
      return prisma.user.findUnique({ where: { email } });
    },

    /**
     * Busca um usuário pelo ID (sem o password).
     * @param {string} id
     * @returns {Promise<object|null>}
     */
    async findUserById(id) {
      return prisma.user.findUnique({
        where: { id },
        omit: { password: true },
      });
    },

    // ─── Operações de RefreshToken ────────────────────────────

    /**
     * Cria um novo refresh token no banco.
     * @param {object} data - { token, userId, expiresAt }
     * @returns {Promise<object>}
     */
    async createRefreshToken(data) {
      return prisma.refreshToken.create({ data });
    },

    /**
     * Busca um refresh token pelo valor do token.
     * @param {string} token
     * @returns {Promise<object|null>}
     */
    async findRefreshToken(token) {
      return prisma.refreshToken.findUnique({ where: { token } });
    },

    /**
     * Remove um refresh token específico (usado no logout e na rotação).
     * @param {string} token
     * @returns {Promise<object>}
     */
    async deleteRefreshToken(token) {
      return prisma.refreshToken.delete({ where: { token } });
    },

    /**
     * Remove todos os refresh tokens de um usuário (logout de todos os dispositivos).
     * @param {string} userId
     * @returns {Promise<{count: number}>}
     */
    async deleteAllRefreshTokens(userId) {
      return prisma.refreshToken.deleteMany({ where: { userId } });
    },
  };
}

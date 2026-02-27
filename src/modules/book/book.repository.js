/**
 * Book Repository
 *
 * A camada de repositório é responsável EXCLUSIVAMENTE pelo acesso a dados.
 * Ela encapsula todas as queries do Prisma, isolando o restante da aplicação
 * dos detalhes de como os dados são persistidos.
 *
 * Vantagens dessa separação:
 * - Se trocar o Prisma por outro ORM, só muda aqui
 * - Facilita mock nos testes (mocka o repositório, não o Prisma inteiro)
 * - A camada de service não precisa saber SQL/Prisma
 *
 * Recebe a instância do Prisma por parâmetro (injeção de dependência),
 * o que facilita testes e evita acoplamento direto.
 */

/**
 * Cria o repositório de livros com as operações de acesso a dados.
 *
 * @param {import("../../../generated/prisma/client.js").PrismaClient} prisma
 * @returns {object} Objeto com métodos de acesso a dados
 */
export function createBookRepository(prisma) {
  return {
    /**
     * Cria um novo livro no banco de dados.
     * @param {object} data - Dados do livro
     * @returns {Promise<object>} Livro criado
     */
    async create(data) {
      return prisma.book.create({ data });
    },

    /**
     * Busca livros com paginação, filtros e ordenação.
     *
     * @param {object} options - Opções de busca
     * @param {number} options.skip - Quantos registros pular (offset)
     * @param {number} options.take - Quantos registros retornar (limit)
     * @param {object} options.where - Filtros de busca
     * @param {object} options.orderBy - Ordenação
     * @returns {Promise<[object[], number]>} Tupla [livros, total]
     */
    async findMany({ skip, take, where, orderBy }) {
      // Usa $transaction para executar as duas queries em paralelo
      // garantindo consistência entre os dados e a contagem
      const [books, total] = await prisma.$transaction([
        prisma.book.findMany({ skip, take, where, orderBy }),
        prisma.book.count({ where }),
      ]);

      return [books, total];
    },

    /**
     * Busca um livro pelo ID.
     * @param {string} id - UUID do livro
     * @returns {Promise<object|null>} Livro encontrado ou null
     */
    async findById(id) {
      return prisma.book.findUnique({ where: { id } });
    },

    /**
     * Busca um livro pelo ISBN.
     * @param {string} isbn - ISBN do livro
     * @returns {Promise<object|null>} Livro encontrado ou null
     */
    async findByIsbn(isbn) {
      return prisma.book.findUnique({ where: { isbn } });
    },

    /**
     * Atualiza um livro pelo ID.
     * @param {string} id - UUID do livro
     * @param {object} data - Dados a serem atualizados
     * @returns {Promise<object>} Livro atualizado
     */
    async update(id, data) {
      return prisma.book.update({ where: { id }, data });
    },

    /**
     * Remove um livro pelo ID.
     * @param {string} id - UUID do livro
     * @returns {Promise<object>} Livro removido
     */
    async delete(id) {
      return prisma.book.delete({ where: { id } });
    },
  };
}

import { AppError } from "../../errors/AppError.js";

/**
 * Book Service
 *
 * A camada de service contém a LÓGICA DE NEGÓCIO da aplicação.
 * Ela orquestra chamadas ao repositório e aplica regras que não
 * pertencem nem ao controller (que lida com HTTP) nem ao
 * repository (que lida com banco de dados).
 *
 * Exemplos de lógica de negócio:
 * - Verificar se um ISBN já existe antes de criar
 * - Montar os filtros de busca para o repositório
 * - Lançar AppError com status HTTP adequado quando algo viola uma regra
 *
 * Recebe o repositório por parâmetro (injeção de dependência).
 */

/**
 * Cria o service de livros com as regras de negócio.
 *
 * @param {ReturnType<import("./book.repository.js").createBookRepository>} repository
 * @returns {object} Objeto com métodos de lógica de negócio
 */
export function createBookService(repository) {
  return {
    /**
     * Cria um novo livro, verificando se o ISBN já existe.
     * @param {object} data - Dados validados do livro
     * @returns {Promise<object>} Livro criado
     */
    async create(data) {
      const existingBook = await repository.findByIsbn(data.isbn);
      if (existingBook) {
        throw new AppError("Já existe um livro com este ISBN.", 409);
      }

      return repository.create(data);
    },

    /**
     * Lista livros com paginação, filtros e ordenação.
     *
     * @param {object} query - Query params já validados pelo Zod
     * @returns {Promise<object>} Objeto com dados paginados
     */
    async findAll(query) {
      const { page, limit, search, genre, sortBy, order } = query;

      // Calcula o offset para paginação
      const skip = (page - 1) * limit;

      // Monta o objeto de filtros (where) dinamicamente
      const where = {};

      if (search) {
        // Busca em título E autor usando OR + contains (case-insensitive)
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { author: { contains: search, mode: "insensitive" } },
        ];
      }

      if (genre) {
        where.genre = { equals: genre, mode: "insensitive" };
      }

      // Monta a ordenação
      const orderBy = { [sortBy]: order };

      const [books, total] = await repository.findMany({
        skip,
        take: limit,
        where,
        orderBy,
      });

      return {
        data: books,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },

    /**
     * Busca um livro pelo ID.
     * @param {string} id - UUID do livro
     * @returns {Promise<object>} Livro encontrado
     * @throws {AppError} Se o livro não for encontrado (404)
     */
    async findById(id) {
      const book = await repository.findById(id);
      if (!book) {
        throw new AppError("Livro não encontrado.", 404);
      }
      return book;
    },

    /**
     * Atualiza um livro pelo ID.
     *
     * Se o ISBN estiver sendo alterado, verifica se o novo ISBN
     * já pertence a outro livro.
     *
     * @param {string} id - UUID do livro
     * @param {object} data - Dados validados para atualização
     * @returns {Promise<object>} Livro atualizado
     */
    async update(id, data) {
      // Verifica se o livro existe
      const existingBook = await repository.findById(id);
      if (!existingBook) {
        throw new AppError("Livro não encontrado.", 404);
      }

      // Se estiver alterando o ISBN, verifica duplicidade
      if (data.isbn && data.isbn !== existingBook.isbn) {
        const bookWithIsbn = await repository.findByIsbn(data.isbn);
        if (bookWithIsbn) {
          throw new AppError("Já existe um livro com este ISBN.", 409);
        }
      }

      return repository.update(id, data);
    },

    /**
     * Remove um livro pelo ID.
     * @param {string} id - UUID do livro
     * @returns {Promise<object>} Livro removido
     */
    async delete(id) {
      const existingBook = await repository.findById(id);
      if (!existingBook) {
        throw new AppError("Livro não encontrado.", 404);
      }

      return repository.delete(id);
    },
  };
}

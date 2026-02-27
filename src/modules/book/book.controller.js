import { listBooksQuerySchema } from "./book.schema.js";

/**
 * Book Controller
 *
 * A camada de controller é responsável por:
 * 1. Receber a request HTTP (req)
 * 2. Extrair os dados necessários (params, body, query)
 * 3. Chamar o service adequado
 * 4. Formatar e enviar a response HTTP (res)
 *
 * O controller NÃO contém lógica de negócio e NÃO acessa o banco.
 * Ele é o "tradutor" entre o mundo HTTP e a lógica da aplicação.
 *
 * Recebe o service por parâmetro (injeção de dependência).
 */

/**
 * Cria o controller de livros.
 *
 * @param {ReturnType<import("./book.service.js").createBookService>} service
 * @returns {object} Objeto com métodos handler do Express
 */
export function createBookController(service) {
  return {
    /**
     * POST /api/books
     * Cria um novo livro.
     */
    async create(req, res, next) {
      try {
        const book = await service.create(req.body);
        return res.status(201).json(book);
      } catch (error) {
        next(error);
      }
    },

    /**
     * GET /api/books
     * Lista livros com paginação e filtros.
     * Os query params são validados aqui usando o Zod diretamente,
     * pois o middleware validate() é usado para o body.
     */
    async findAll(req, res, next) {
      try {
        const query = listBooksQuerySchema.parse(req.query);
        const result = await service.findAll(query);
        return res.json(result);
      } catch (error) {
        next(error);
      }
    },

    /**
     * GET /api/books/:id
     * Busca um livro pelo ID.
     */
    async findById(req, res, next) {
      try {
        const book = await service.findById(req.params.id);
        return res.json(book);
      } catch (error) {
        next(error);
      }
    },

    /**
     * PUT /api/books/:id
     * Atualiza um livro pelo ID.
     */
    async update(req, res, next) {
      try {
        const book = await service.update(req.params.id, req.body);
        return res.json(book);
      } catch (error) {
        next(error);
      }
    },

    /**
     * DELETE /api/books/:id
     * Remove um livro pelo ID.
     */
    async delete(req, res, next) {
      try {
        await service.delete(req.params.id);
        return res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  };
}

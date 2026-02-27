import { vi, describe, it, expect } from "vitest";
import { createBookController } from "../book.controller.js";
import { AppError } from "../../../errors/AppError.js";

/**
 * Testes unitários do Book Controller.
 *
 * Aqui mockamos o SERVICE (não o repository nem o Prisma).
 * O controller não sabe nada sobre banco de dados.
 *
 * Também mockamos os objetos req, res e next do Express:
 * - req: objeto com body, params e query
 * - res: objeto com métodos status() e json() espiados
 * - next: função para passar erros ao errorHandler
 *
 * Testamos se o controller:
 * - Chama o service corretamente
 * - Retorna o status HTTP correto
 * - Repassa erros via next()
 */

// Mock do service
const serviceMock = {
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

// Cria o controller com o mock do service
const controller = createBookController(serviceMock);

// Dados de exemplo
const mockBook = {
  id: "abc-123",
  title: "O Hobbit",
  author: "J.R.R. Tolkien",
  isbn: "9780547928227",
  genre: "Fantasy",
  pages: 310,
  publishedAt: new Date("1937-09-21").toISOString(),
  synopsis: "Uma aventura inesperada.",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Função helper que cria mocks frescos de req, res e next.
 * Chamada antes de cada teste para garantir isolamento.
 */
function createMocks(overrides = {}) {
  const req = {
    body: {},
    params: {},
    query: {},
    ...overrides,
  };

  const res = {
    status: vi.fn().mockReturnThis(), // Permite encadear: res.status(201).json(data)
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };

  const next = vi.fn();

  return { req, res, next };
}

describe("BookController", () => {
  describe("create", () => {
    it("deve retornar 201 com o livro criado", async () => {
      serviceMock.create.mockResolvedValue(mockBook);
      const { req, res, next } = createMocks({
        body: {
          title: "O Hobbit",
          author: "J.R.R. Tolkien",
          isbn: "9780547928227",
          genre: "Fantasy",
          pages: 310,
          publishedAt: "1937-09-21T00:00:00.000Z",
        },
      });

      await controller.create(req, res, next);

      expect(serviceMock.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockBook);
      expect(next).not.toHaveBeenCalled();
    });

    it("deve chamar next(error) quando o service lança erro", async () => {
      const error = new AppError("Já existe um livro com este ISBN.", 409);
      serviceMock.create.mockRejectedValue(error);
      const { req, res, next } = createMocks({ body: { isbn: "duplicate" } });

      await controller.create(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("findAll", () => {
    it("deve retornar 200 com a lista paginada de livros", async () => {
      const paginatedResult = {
        data: [mockBook],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      serviceMock.findAll.mockResolvedValue(paginatedResult);
      const { req, res, next } = createMocks({ query: {} });

      await controller.findAll(req, res, next);

      expect(serviceMock.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(paginatedResult);
      expect(next).not.toHaveBeenCalled();
    });

    it("deve chamar next(error) quando a validação de query falha", async () => {
      const { req, res, next } = createMocks({
        query: { page: "abc" }, // inválido — não é número
      });

      await controller.findAll(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    it("deve retornar 200 com o livro encontrado", async () => {
      serviceMock.findById.mockResolvedValue(mockBook);
      const { req, res, next } = createMocks({ params: { id: "abc-123" } });

      await controller.findById(req, res, next);

      expect(serviceMock.findById).toHaveBeenCalledWith("abc-123");
      expect(res.json).toHaveBeenCalledWith(mockBook);
    });

    it("deve chamar next(error) quando o livro não é encontrado", async () => {
      const error = new AppError("Livro não encontrado.", 404);
      serviceMock.findById.mockRejectedValue(error);
      const { req, res, next } = createMocks({ params: { id: "nao-existe" } });

      await controller.findById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("update", () => {
    it("deve retornar 200 com o livro atualizado", async () => {
      const updatedBook = { ...mockBook, pages: 320 };
      serviceMock.update.mockResolvedValue(updatedBook);
      const { req, res, next } = createMocks({
        params: { id: "abc-123" },
        body: { pages: 320 },
      });

      await controller.update(req, res, next);

      expect(serviceMock.update).toHaveBeenCalledWith("abc-123", {
        pages: 320,
      });
      expect(res.json).toHaveBeenCalledWith(updatedBook);
    });

    it("deve chamar next(error) quando o service lança erro", async () => {
      const error = new AppError("Livro não encontrado.", 404);
      serviceMock.update.mockRejectedValue(error);
      const { req, res, next } = createMocks({
        params: { id: "nao-existe" },
        body: { pages: 100 },
      });

      await controller.update(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("delete", () => {
    it("deve retornar 204 sem body quando o livro é deletado", async () => {
      serviceMock.delete.mockResolvedValue(mockBook);
      const { req, res, next } = createMocks({ params: { id: "abc-123" } });

      await controller.delete(req, res, next);

      expect(serviceMock.delete).toHaveBeenCalledWith("abc-123");
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("deve chamar next(error) quando o livro não existe", async () => {
      const error = new AppError("Livro não encontrado.", 404);
      serviceMock.delete.mockRejectedValue(error);
      const { req, res, next } = createMocks({ params: { id: "nao-existe" } });

      await controller.delete(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

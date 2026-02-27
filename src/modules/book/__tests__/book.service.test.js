import { vi, describe, it, expect } from "vitest";
import { createBookService } from "../book.service.js";
import { AppError } from "../../../errors/AppError.js";

/**
 * Testes unitarios do Book Service.
 *
 * Aqui mockamos o REPOSITORY (nao o Prisma). O service nao sabe nem
 * precisa saber que o Prisma existe — ele so conhece o repository.
 *
 * Testamos a logica de negocio:
 * - ISBN duplicado na criacao → erro 409
 * - Livro nao encontrado → erro 404
 * - Verificacao de ISBN ao atualizar
 * - Montagem correta dos filtros de busca
 */

// Mock do repository
const repositoryMock = {
  create: vi.fn(),
  findMany: vi.fn(),
  findById: vi.fn(),
  findByIsbn: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

// Cria o service com o mock do repository injetado
const service = createBookService(repositoryMock);

// Dados de exemplo
const mockBook = {
  id: "abc-123",
  title: "O Hobbit",
  author: "J.R.R. Tolkien",
  isbn: "9780547928227",
  genre: "Fantasy",
  pages: 310,
  publishedAt: new Date("1937-09-21"),
  synopsis: "Uma aventura inesperada.",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("BookService", () => {
  describe("create", () => {
    it("deve criar um livro quando o ISBN nao existe", async () => {
      repositoryMock.findByIsbn.mockResolvedValue(null);
      repositoryMock.create.mockResolvedValue(mockBook);

      const data = {
        title: "O Hobbit",
        author: "J.R.R. Tolkien",
        isbn: "9780547928227",
        genre: "Fantasy",
        pages: 310,
        publishedAt: new Date("1937-09-21"),
      };

      const result = await service.create(data);

      expect(repositoryMock.findByIsbn).toHaveBeenCalledWith("9780547928227");
      expect(repositoryMock.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(mockBook);
    });

    it("deve lancar AppError 409 quando o ISBN ja existe", async () => {
      repositoryMock.findByIsbn.mockResolvedValue(mockBook);

      const data = {
        title: "Outro Livro",
        author: "Outro Autor",
        isbn: "9780547928227",
        genre: "Fiction",
        pages: 200,
        publishedAt: new Date(),
      };

      await expect(service.create(data)).rejects.toThrow(AppError);
      await expect(service.create(data)).rejects.toMatchObject({
        statusCode: 409,
        message: "Já existe um livro com este ISBN.",
      });

      expect(repositoryMock.create).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("deve retornar livros paginados com filtros aplicados", async () => {
      const books = [mockBook];
      repositoryMock.findMany.mockResolvedValue([books, 1]);

      const query = {
        page: 1,
        limit: 10,
        search: "tolkien",
        genre: undefined,
        sortBy: "createdAt",
        order: "desc",
      };

      const result = await service.findAll(query);

      expect(repositoryMock.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          OR: [
            { title: { contains: "tolkien", mode: "insensitive" } },
            { author: { contains: "tolkien", mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      expect(result.data).toEqual(books);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it("deve aplicar filtro de genero quando fornecido", async () => {
      repositoryMock.findMany.mockResolvedValue([[], 0]);

      const query = {
        page: 1,
        limit: 10,
        genre: "Fantasy",
        sortBy: "title",
        order: "asc",
      };

      await service.findAll(query);

      expect(repositoryMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            genre: { equals: "Fantasy", mode: "insensitive" },
          }),
        })
      );
    });

    it("deve calcular o offset correto para paginacao", async () => {
      repositoryMock.findMany.mockResolvedValue([[], 0]);

      const query = {
        page: 3,
        limit: 5,
        sortBy: "createdAt",
        order: "desc",
      };

      await service.findAll(query);

      // page 3, limit 5 → skip = (3-1) * 5 = 10
      expect(repositoryMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 })
      );
    });
  });

  describe("findById", () => {
    it("deve retornar o livro quando encontrado", async () => {
      repositoryMock.findById.mockResolvedValue(mockBook);

      const result = await service.findById("abc-123");

      expect(result).toEqual(mockBook);
    });

    it("deve lancar AppError 404 quando o livro nao existe", async () => {
      repositoryMock.findById.mockResolvedValue(null);

      await expect(service.findById("nao-existe")).rejects.toThrow(AppError);
      await expect(service.findById("nao-existe")).rejects.toMatchObject({
        statusCode: 404,
        message: "Livro não encontrado.",
      });
    });
  });

  describe("update", () => {
    it("deve atualizar o livro quando ele existe", async () => {
      const updatedBook = { ...mockBook, pages: 320 };
      repositoryMock.findById.mockResolvedValue(mockBook);
      repositoryMock.update.mockResolvedValue(updatedBook);

      const result = await service.update("abc-123", { pages: 320 });

      expect(repositoryMock.update).toHaveBeenCalledWith("abc-123", {
        pages: 320,
      });
      expect(result.pages).toBe(320);
    });

    it("deve lancar AppError 404 quando o livro nao existe", async () => {
      repositoryMock.findById.mockResolvedValue(null);

      await expect(
        service.update("nao-existe", { pages: 100 })
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("deve lancar AppError 409 ao trocar para um ISBN ja existente", async () => {
      const outroLivro = { ...mockBook, id: "outro-id", isbn: "1234567890123" };
      repositoryMock.findById.mockResolvedValue(mockBook);
      repositoryMock.findByIsbn.mockResolvedValue(outroLivro);

      await expect(
        service.update("abc-123", { isbn: "1234567890123" })
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "Já existe um livro com este ISBN.",
      });
    });

    it("deve permitir atualizar mantendo o mesmo ISBN", async () => {
      repositoryMock.findById.mockResolvedValue(mockBook);
      repositoryMock.update.mockResolvedValue(mockBook);

      // O ISBN e o mesmo do livro atual — nao deve verificar duplicidade
      await service.update("abc-123", { isbn: mockBook.isbn });

      expect(repositoryMock.findByIsbn).not.toHaveBeenCalled();
      expect(repositoryMock.update).toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("deve deletar o livro quando ele existe", async () => {
      repositoryMock.findById.mockResolvedValue(mockBook);
      repositoryMock.delete.mockResolvedValue(mockBook);

      const result = await service.delete("abc-123");

      expect(repositoryMock.delete).toHaveBeenCalledWith("abc-123");
      expect(result).toEqual(mockBook);
    });

    it("deve lancar AppError 404 quando o livro nao existe", async () => {
      repositoryMock.findById.mockResolvedValue(null);

      await expect(service.delete("nao-existe")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});

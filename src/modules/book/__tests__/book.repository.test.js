import { vi, describe, it, expect } from "vitest";
import { createBookRepository } from "../book.repository.js";

/**
 * Testes unitarios do Book Repository.
 *
 * A estrategia aqui e criar um mock do PrismaClient — um objeto falso
 * que simula o Prisma sem realmente acessar o banco de dados.
 *
 * Cada metodo do Prisma (create, findMany, findUnique, update, delete)
 * e substituido por uma vi.fn(), que e uma "funcao espia" que:
 * - Registra se foi chamada
 * - Registra com quais argumentos
 * - Pode retornar um valor pre-definido
 *
 * Isso permite testar se o repository chama o Prisma corretamente,
 * sem depender de um banco real.
 */

// Mock do PrismaClient
const prismaMock = {
  book: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
};

// Cria o repository com o mock injetado
const repository = createBookRepository(prismaMock);

// Dados de exemplo para os testes
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

describe("BookRepository", () => {
  describe("create", () => {
    it("deve chamar prisma.book.create com os dados corretos", async () => {
      prismaMock.book.create.mockResolvedValue(mockBook);

      const data = {
        title: "O Hobbit",
        author: "J.R.R. Tolkien",
        isbn: "9780547928227",
        genre: "Fantasy",
        pages: 310,
        publishedAt: new Date("1937-09-21"),
        synopsis: "Uma aventura inesperada.",
      };

      const result = await repository.create(data);

      expect(prismaMock.book.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(mockBook);
    });
  });

  describe("findMany", () => {
    it("deve chamar $transaction com findMany e count", async () => {
      const books = [mockBook];
      prismaMock.$transaction.mockResolvedValue([books, 1]);

      const options = {
        skip: 0,
        take: 10,
        where: {},
        orderBy: { createdAt: "desc" },
      };

      const [result, total] = await repository.findMany(options);

      expect(prismaMock.$transaction).toHaveBeenCalledWith([
        undefined, // O resultado de findMany (vi.fn chamada retorna undefined na configuracao do mock)
        undefined, // O resultado de count
      ]);
      expect(result).toEqual(books);
      expect(total).toBe(1);
    });
  });

  describe("findById", () => {
    it("deve chamar prisma.book.findUnique com o id correto", async () => {
      prismaMock.book.findUnique.mockResolvedValue(mockBook);

      const result = await repository.findById("abc-123");

      expect(prismaMock.book.findUnique).toHaveBeenCalledWith({
        where: { id: "abc-123" },
      });
      expect(result).toEqual(mockBook);
    });

    it("deve retornar null quando o livro nao existe", async () => {
      prismaMock.book.findUnique.mockResolvedValue(null);

      const result = await repository.findById("nao-existe");

      expect(result).toBeNull();
    });
  });

  describe("findByIsbn", () => {
    it("deve chamar prisma.book.findUnique com o isbn correto", async () => {
      prismaMock.book.findUnique.mockResolvedValue(mockBook);

      const result = await repository.findByIsbn("9780547928227");

      expect(prismaMock.book.findUnique).toHaveBeenCalledWith({
        where: { isbn: "9780547928227" },
      });
      expect(result).toEqual(mockBook);
    });
  });

  describe("update", () => {
    it("deve chamar prisma.book.update com id e dados corretos", async () => {
      const updatedBook = { ...mockBook, pages: 320 };
      prismaMock.book.update.mockResolvedValue(updatedBook);

      const result = await repository.update("abc-123", { pages: 320 });

      expect(prismaMock.book.update).toHaveBeenCalledWith({
        where: { id: "abc-123" },
        data: { pages: 320 },
      });
      expect(result.pages).toBe(320);
    });
  });

  describe("delete", () => {
    it("deve chamar prisma.book.delete com o id correto", async () => {
      prismaMock.book.delete.mockResolvedValue(mockBook);

      const result = await repository.delete("abc-123");

      expect(prismaMock.book.delete).toHaveBeenCalledWith({
        where: { id: "abc-123" },
      });
      expect(result).toEqual(mockBook);
    });
  });
});

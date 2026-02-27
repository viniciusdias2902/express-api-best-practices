import { vi, describe, it, expect } from "vitest";
import { createAuthRepository } from "../auth.repository.js";

/**
 * Testes unitários do Auth Repository.
 *
 * Segue a mesma estratégia do BookRepository:
 * - Cria um mock do PrismaClient
 * - Injeta no repository via factory function
 * - Verifica se os métodos do Prisma são chamados corretamente
 *
 * Testa operações de User e RefreshToken.
 */

// Mock do PrismaClient
const prismaMock = {
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
};

// Cria o repository com o mock injetado
const repository = createAuthRepository(prismaMock);

// Dados de exemplo
const mockUser = {
  id: "user-123",
  name: "Maria Silva",
  email: "maria@email.com",
  password: "$argon2id$hash...",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRefreshToken = {
  id: "token-123",
  token: "abc123refreshtoken",
  userId: "user-123",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
};

describe("AuthRepository", () => {
  describe("createUser", () => {
    it("deve criar o usuário e retornar sem o campo password", async () => {
      prismaMock.user.create.mockResolvedValue(mockUser);

      const data = {
        name: "Maria Silva",
        email: "maria@email.com",
        password: "$argon2id$hash...",
      };

      const result = await repository.createUser(data);

      expect(prismaMock.user.create).toHaveBeenCalledWith({ data });
      // Não deve conter password no retorno
      expect(result).not.toHaveProperty("password");
      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });
  });

  describe("findUserByEmail", () => {
    it("deve buscar usuário pelo email (com password)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findUserByEmail("maria@email.com");

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: "maria@email.com" },
      });
      // Deve conter password (necessário para login)
      expect(result).toHaveProperty("password");
      expect(result).toEqual(mockUser);
    });

    it("deve retornar null quando o usuário não existe", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await repository.findUserByEmail("naoexiste@email.com");

      expect(result).toBeNull();
    });
  });

  describe("findUserById", () => {
    it("deve buscar usuário pelo ID (sem password)", async () => {
      const { password: _, ...userWithoutPassword } = mockUser;
      prismaMock.user.findUnique.mockResolvedValue(userWithoutPassword);

      const result = await repository.findUserById("user-123");

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
        omit: { password: true },
      });
      expect(result).not.toHaveProperty("password");
    });
  });

  describe("createRefreshToken", () => {
    it("deve criar um refresh token no banco", async () => {
      prismaMock.refreshToken.create.mockResolvedValue(mockRefreshToken);

      const data = {
        token: "abc123refreshtoken",
        userId: "user-123",
        expiresAt: mockRefreshToken.expiresAt,
      };

      const result = await repository.createRefreshToken(data);

      expect(prismaMock.refreshToken.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(mockRefreshToken);
    });
  });

  describe("findRefreshToken", () => {
    it("deve buscar refresh token pelo valor do token", async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);

      const result = await repository.findRefreshToken("abc123refreshtoken");

      expect(prismaMock.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: "abc123refreshtoken" },
      });
      expect(result).toEqual(mockRefreshToken);
    });

    it("deve retornar null quando o token não existe", async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue(null);

      const result = await repository.findRefreshToken("token-inexistente");

      expect(result).toBeNull();
    });
  });

  describe("deleteRefreshToken", () => {
    it("deve deletar o refresh token pelo valor", async () => {
      prismaMock.refreshToken.delete.mockResolvedValue(mockRefreshToken);

      const result = await repository.deleteRefreshToken("abc123refreshtoken");

      expect(prismaMock.refreshToken.delete).toHaveBeenCalledWith({
        where: { token: "abc123refreshtoken" },
      });
      expect(result).toEqual(mockRefreshToken);
    });
  });

  describe("deleteAllRefreshTokens", () => {
    it("deve deletar todos os refresh tokens de um usuário", async () => {
      prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      const result = await repository.deleteAllRefreshTokens("user-123");

      expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-123" },
      });
      expect(result).toEqual({ count: 3 });
    });
  });
});

import { vi, describe, it, expect } from "vitest";
import { createAuthController } from "../auth.controller.js";
import { AppError } from "../../../errors/AppError.js";

/**
 * Testes unitarios do Auth Controller.
 *
 * Segue a mesma estrategia do BookController:
 * - Mocka o SERVICE (nao o repository nem o Prisma)
 * - Mocka req, res e next do Express
 * - Verifica status HTTP e formato da response
 */

// Mock do service
const serviceMock = {
  register: vi.fn(),
  login: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
};

// Cria o controller com o mock do service
const controller = createAuthController(serviceMock);

// Dados de exemplo
const mockUser = {
  id: "user-123",
  name: "Maria Silva",
  email: "maria@email.com",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockTokens = {
  user: mockUser,
  accessToken: "mocked-jwt-token",
  refreshToken: "mocked-refresh-token",
};

/**
 * Helper que cria mocks frescos de req, res e next.
 */
function createMocks(overrides = {}) {
  const req = {
    body: {},
    params: {},
    query: {},
    ...overrides,
  };

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };

  const next = vi.fn();

  return { req, res, next };
}

describe("AuthController", () => {
  describe("register", () => {
    it("deve retornar 201 com usuario e tokens", async () => {
      serviceMock.register.mockResolvedValue(mockTokens);
      const { req, res, next } = createMocks({
        body: {
          name: "Maria Silva",
          email: "maria@email.com",
          password: "MinhaSenh4",
        },
      });

      await controller.register(req, res, next);

      expect(serviceMock.register).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockTokens);
      expect(next).not.toHaveBeenCalled();
    });

    it("deve chamar next(error) quando o service lanca erro", async () => {
      const error = new AppError("Já existe um usuário com este email.", 409);
      serviceMock.register.mockRejectedValue(error);
      const { req, res, next } = createMocks({
        body: { email: "maria@email.com" },
      });

      await controller.register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("login", () => {
    it("deve retornar 200 com usuario e tokens", async () => {
      serviceMock.login.mockResolvedValue(mockTokens);
      const { req, res, next } = createMocks({
        body: { email: "maria@email.com", password: "MinhaSenh4" },
      });

      await controller.login(req, res, next);

      expect(serviceMock.login).toHaveBeenCalledWith(req.body);
      expect(res.json).toHaveBeenCalledWith(mockTokens);
      expect(next).not.toHaveBeenCalled();
    });

    it("deve chamar next(error) quando credenciais sao invalidas", async () => {
      const error = new AppError("Credenciais inválidas.", 401);
      serviceMock.login.mockRejectedValue(error);
      const { req, res, next } = createMocks({
        body: { email: "maria@email.com", password: "errada" },
      });

      await controller.login(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("refresh", () => {
    it("deve retornar 200 com novos tokens", async () => {
      const newTokens = {
        accessToken: "new-jwt-token",
        refreshToken: "new-refresh-token",
      };
      serviceMock.refresh.mockResolvedValue(newTokens);
      const { req, res, next } = createMocks({
        body: { refreshToken: "old-refresh-token" },
      });

      await controller.refresh(req, res, next);

      expect(serviceMock.refresh).toHaveBeenCalledWith("old-refresh-token");
      expect(res.json).toHaveBeenCalledWith(newTokens);
      expect(next).not.toHaveBeenCalled();
    });

    it("deve chamar next(error) quando o refresh token e invalido", async () => {
      const error = new AppError("Refresh token inválido.", 401);
      serviceMock.refresh.mockRejectedValue(error);
      const { req, res, next } = createMocks({
        body: { refreshToken: "invalid-token" },
      });

      await controller.refresh(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("logout", () => {
    it("deve retornar 204 sem body", async () => {
      serviceMock.logout.mockResolvedValue(undefined);
      const { req, res, next } = createMocks({
        body: { refreshToken: "token-to-revoke" },
      });

      await controller.logout(req, res, next);

      expect(serviceMock.logout).toHaveBeenCalledWith("token-to-revoke");
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("deve chamar next(error) em caso de erro inesperado", async () => {
      const error = new Error("Erro inesperado");
      serviceMock.logout.mockRejectedValue(error);
      const { req, res, next } = createMocks({
        body: { refreshToken: "some-token" },
      });

      await controller.logout(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

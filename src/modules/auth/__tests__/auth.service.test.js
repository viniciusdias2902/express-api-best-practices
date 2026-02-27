import { vi, describe, it, expect, beforeEach } from "vitest";

/**
 * Testes unitarios do Auth Service.
 *
 * Mockamos o REPOSITORY e as dependencias externas (argon2 e jose).
 * O service nao sabe que o Prisma existe — so conhece o repository.
 *
 * Testamos a logica de negocio:
 * - Registro: email duplicado, hash de senha, geracao de tokens
 * - Login: credenciais invalidas, verificacao de senha
 * - Refresh: token invalido, expirado, rotacao
 * - Logout: revogacao de token, idempotencia
 *
 * No Vitest, vi.mock() possui hoisting automatico — ele e movido
 * para o topo do arquivo antes da execucao, independente de onde
 * foi escrito. Isso permite usar imports estaticos normais ao
 * inves do pattern jest.unstable_mockModule + await import().
 */

// ─── Mocks de modulos ESM ────────────────────────────────────────
//
// vi.hoisted() retorna valores que existem ANTES do hoisting do vi.mock().
// Isso resolve o problema de "Cannot access before initialization"
// que ocorre quando vi.mock() e movido para o topo do arquivo.

const { mockHash, mockVerify, mockSignJWT } = vi.hoisted(() => ({
  mockHash: vi.fn(),
  mockVerify: vi.fn(),
  mockSignJWT: vi.fn(),
}));

vi.mock("argon2", () => ({
  hash: mockHash,
  verify: mockVerify,
}));

vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: mockSignJWT,
  })),
}));

// Imports estaticos — funcionam porque vi.mock() tem hoisting automatico
import { createAuthService } from "../auth.service.js";
import { AppError } from "../../../errors/AppError.js";

// ─── Setup ───────────────────────────────────────────────────────

const repositoryMock = {
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createRefreshToken: vi.fn(),
  findRefreshToken: vi.fn(),
  deleteRefreshToken: vi.fn(),
  deleteAllRefreshTokens: vi.fn(),
};

const config = {
  jwtSecret: new TextEncoder().encode("test-secret"),
  jwtExpiresIn: "15m",
  refreshTokenExpiresInDays: 7,
};

const service = createAuthService(repositoryMock, config);

// Dados de exemplo
const mockUser = {
  id: "user-123",
  name: "Maria Silva",
  email: "maria@email.com",
  password: "$argon2id$hashedpassword",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUserWithoutPassword = {
  id: mockUser.id,
  name: mockUser.name,
  email: mockUser.email,
  createdAt: mockUser.createdAt,
  updatedAt: mockUser.updatedAt,
};

describe("AuthService", () => {
  beforeEach(() => {
    // Configura retornos padrao dos mocks
    mockSignJWT.mockResolvedValue("mocked-jwt-token");
    repositoryMock.createRefreshToken.mockResolvedValue({});
  });

  describe("register", () => {
    it("deve registrar um usuario e retornar tokens", async () => {
      repositoryMock.findUserByEmail.mockResolvedValue(null);
      mockHash.mockResolvedValue("$argon2id$hashedpassword");
      repositoryMock.createUser.mockResolvedValue(mockUserWithoutPassword);

      const data = {
        name: "Maria Silva",
        email: "maria@email.com",
        password: "MinhaSenh4",
      };

      const result = await service.register(data);

      expect(repositoryMock.findUserByEmail).toHaveBeenCalledWith(
        "maria@email.com"
      );
      expect(mockHash).toHaveBeenCalledWith("MinhaSenh4");
      expect(repositoryMock.createUser).toHaveBeenCalledWith({
        name: "Maria Silva",
        email: "maria@email.com",
        password: "$argon2id$hashedpassword",
      });
      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
    });

    it("deve lancar AppError 409 quando o email ja existe", async () => {
      repositoryMock.findUserByEmail.mockResolvedValue(mockUser);

      const data = {
        name: "Outro Nome",
        email: "maria@email.com",
        password: "OutraSenha1",
      };

      await expect(service.register(data)).rejects.toThrow(AppError);
      await expect(service.register(data)).rejects.toMatchObject({
        statusCode: 409,
        message: "Já existe um usuário com este email.",
      });

      expect(repositoryMock.createUser).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("deve autenticar e retornar tokens com usuario sem password", async () => {
      repositoryMock.findUserByEmail.mockResolvedValue(mockUser);
      mockVerify.mockResolvedValue(true);

      const data = { email: "maria@email.com", password: "MinhaSenh4" };
      const result = await service.login(data);

      expect(repositoryMock.findUserByEmail).toHaveBeenCalledWith(
        "maria@email.com"
      );
      expect(mockVerify).toHaveBeenCalledWith(
        "$argon2id$hashedpassword",
        "MinhaSenh4"
      );
      expect(result.user).not.toHaveProperty("password");
      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
    });

    it("deve lancar AppError 401 quando o email nao existe", async () => {
      repositoryMock.findUserByEmail.mockResolvedValue(null);

      const data = { email: "naoexiste@email.com", password: "Qualquer1" };

      await expect(service.login(data)).rejects.toThrow(AppError);
      await expect(service.login(data)).rejects.toMatchObject({
        statusCode: 401,
        message: "Credenciais inválidas.",
      });
    });

    it("deve lancar AppError 401 quando a senha esta errada", async () => {
      repositoryMock.findUserByEmail.mockResolvedValue(mockUser);
      mockVerify.mockResolvedValue(false);

      const data = { email: "maria@email.com", password: "SenhaErrada1" };

      await expect(service.login(data)).rejects.toThrow(AppError);
      await expect(service.login(data)).rejects.toMatchObject({
        statusCode: 401,
        message: "Credenciais inválidas.",
      });
    });
  });

  describe("refresh", () => {
    const storedToken = {
      id: "token-id",
      token: "valid-refresh-token",
      userId: "user-123",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // futuro
      createdAt: new Date(),
    };

    it("deve gerar novos tokens e deletar o antigo (rotacao)", async () => {
      repositoryMock.findRefreshToken.mockResolvedValue(storedToken);
      repositoryMock.deleteRefreshToken.mockResolvedValue(storedToken);

      const result = await service.refresh("valid-refresh-token");

      expect(repositoryMock.findRefreshToken).toHaveBeenCalledWith(
        "valid-refresh-token"
      );
      expect(repositoryMock.deleteRefreshToken).toHaveBeenCalledWith(
        "valid-refresh-token"
      );
      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
    });

    it("deve lancar AppError 401 quando o refresh token nao existe", async () => {
      repositoryMock.findRefreshToken.mockResolvedValue(null);

      await expect(service.refresh("token-inexistente")).rejects.toThrow(
        AppError
      );
      await expect(
        service.refresh("token-inexistente")
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Refresh token inválido.",
      });
    });

    it("deve lancar AppError 401 quando o refresh token esta expirado", async () => {
      const expiredToken = {
        ...storedToken,
        expiresAt: new Date(Date.now() - 1000), // passado
      };
      repositoryMock.findRefreshToken.mockResolvedValue(expiredToken);
      repositoryMock.deleteRefreshToken.mockResolvedValue(expiredToken);

      await expect(
        service.refresh("valid-refresh-token")
      ).rejects.toThrow(AppError);
      await expect(
        service.refresh("valid-refresh-token")
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Refresh token expirado.",
      });

      // Deve deletar o token expirado do banco
      expect(repositoryMock.deleteRefreshToken).toHaveBeenCalledWith(
        "valid-refresh-token"
      );
    });
  });

  describe("logout", () => {
    it("deve deletar o refresh token quando ele existe", async () => {
      const storedToken = {
        token: "existing-token",
        userId: "user-123",
      };
      repositoryMock.findRefreshToken.mockResolvedValue(storedToken);
      repositoryMock.deleteRefreshToken.mockResolvedValue(storedToken);

      await service.logout("existing-token");

      expect(repositoryMock.findRefreshToken).toHaveBeenCalledWith(
        "existing-token"
      );
      expect(repositoryMock.deleteRefreshToken).toHaveBeenCalledWith(
        "existing-token"
      );
    });

    it("deve ser idempotente — nao lancar erro quando token nao existe", async () => {
      repositoryMock.findRefreshToken.mockResolvedValue(null);

      // Nao deve lancar erro
      await expect(
        service.logout("token-inexistente")
      ).resolves.toBeUndefined();

      expect(repositoryMock.deleteRefreshToken).not.toHaveBeenCalled();
    });
  });
});

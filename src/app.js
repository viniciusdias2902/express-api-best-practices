import express from "express";
import { bookRoutes } from "./modules/book/book.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

/**
 * Configuração da aplicação Express.
 *
 * Separamos a criação do app (app.js) do servidor HTTP (server.js).
 * Isso é uma boa prática porque:
 *
 * 1. Nos testes, importamos só o app (sem subir o servidor)
 * 2. O server.js fica responsável apenas por "ouvir" a porta
 * 3. Facilita testes de integração com supertest no futuro
 */
const app = express();

// Middleware para parsear JSON no body das requests
app.json = express.json();
app.use(express.json());

// Rota de health check — útil para monitoramento e deploy
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Monta as rotas do módulo book no prefixo /api/books
app.use("/api/books", bookRoutes);

// Middleware de erro — DEVE ser registrado por último
app.use(errorHandler);

export { app };

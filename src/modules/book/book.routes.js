import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { createBookSchema, updateBookSchema } from "./book.schema.js";
import { createBookRepository } from "./book.repository.js";
import { createBookService } from "./book.service.js";
import { createBookController } from "./book.controller.js";
import { prisma } from "../../lib/prisma.js";

/**
 * Book Routes
 *
 * Este arquivo é o "ponto de montagem" do módulo book.
 * Aqui acontece a composição das camadas:
 *
 *   prisma → repository → service → controller → routes
 *
 * Cada camada recebe sua dependência por parâmetro (injeção de dependência).
 * Isso cria uma cadeia onde cada peça é independente e testável.
 */

// Composição: monta a cadeia de dependências
const repository = createBookRepository(prisma);
const service = createBookService(repository);
const controller = createBookController(service);

const router = Router();

/**
 * POST /api/books
 * Cria um novo livro.
 * O middleware validate() valida o body antes do controller recebê-lo.
 */
router.post("/", validate(createBookSchema), (req, res, next) =>
  controller.create(req, res, next)
);

/**
 * GET /api/books
 * Lista livros com paginação, busca e filtros.
 * A validação dos query params acontece dentro do controller.
 */
router.get("/", (req, res, next) => controller.findAll(req, res, next));

/**
 * GET /api/books/:id
 * Busca um livro pelo ID (UUID).
 */
router.get("/:id", (req, res, next) => controller.findById(req, res, next));

/**
 * PUT /api/books/:id
 * Atualiza um livro pelo ID.
 * O middleware validate() valida o body de atualização.
 */
router.put("/:id", validate(updateBookSchema), (req, res, next) =>
  controller.update(req, res, next)
);

/**
 * DELETE /api/books/:id
 * Remove um livro pelo ID.
 */
router.delete("/:id", (req, res, next) => controller.delete(req, res, next));

export { router as bookRoutes };

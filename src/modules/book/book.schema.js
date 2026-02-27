import { z } from "zod";

/**
 * Schemas de validação Zod para o módulo Book.
 *
 * O Zod permite definir schemas que descrevem o formato esperado dos dados.
 * Cada schema funciona como um "contrato": se os dados não cumprem o contrato,
 * a validação falha com mensagens de erro descritivas.
 *
 * Usamos .coerce.date() para aceitar strings ISO e convertê-las em Date.
 * Usamos .trim() para remover espaços desnecessários do início/fim.
 * Usamos .int().positive() para garantir números válidos.
 */

/**
 * Schema para criação de livro — todos os campos obrigatórios (exceto synopsis).
 */
export const createBookSchema = z.object({
  title: z
    .string({ required_error: "O título é obrigatório." })
    .trim()
    .min(1, "O título não pode estar vazio.")
    .max(255, "O título pode ter no máximo 255 caracteres."),

  author: z
    .string({ required_error: "O autor é obrigatório." })
    .trim()
    .min(1, "O autor não pode estar vazio.")
    .max(255, "O autor pode ter no máximo 255 caracteres."),

  isbn: z
    .string({ required_error: "O ISBN é obrigatório." })
    .trim()
    .regex(
      /^(?:\d{10}|\d{13})$/,
      "O ISBN deve conter exatamente 10 ou 13 dígitos numéricos."
    ),

  genre: z
    .string({ required_error: "O gênero é obrigatório." })
    .trim()
    .min(1, "O gênero não pode estar vazio.")
    .max(100, "O gênero pode ter no máximo 100 caracteres."),

  pages: z
    .number({ required_error: "O número de páginas é obrigatório." })
    .int("O número de páginas deve ser inteiro.")
    .positive("O número de páginas deve ser positivo."),

  publishedAt: z.coerce.date({
    required_error: "A data de publicação é obrigatória.",
    invalid_type_error: "A data de publicação deve ser uma data válida.",
  }),

  synopsis: z
    .string()
    .trim()
    .max(2000, "A sinopse pode ter no máximo 2000 caracteres.")
    .nullish(),
});

/**
 * Schema para atualização de livro — todos os campos são opcionais,
 * mas pelo menos um deve ser fornecido (.partial() + .refine()).
 */
export const updateBookSchema = createBookSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Pelo menos um campo deve ser fornecido para atualização." }
);

/**
 * Schema para validação de query params na listagem de livros.
 */
export const listBooksQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  genre: z.string().trim().optional(),
  sortBy: z.enum(["title", "author", "publishedAt", "createdAt", "pages"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

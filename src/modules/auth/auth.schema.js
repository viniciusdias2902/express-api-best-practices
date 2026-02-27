import { z } from "zod";

/**
 * Schemas de validação Zod para o módulo Auth.
 *
 * Definem os contratos de dados para registro, login e refresh de tokens.
 * A validação acontece antes do controller via middleware validate().
 */

/**
 * Schema para registro de usuário.
 *
 * - name: obrigatório, 2-100 caracteres
 * - email: obrigatório, formato de email válido
 * - password: obrigatório, mínimo 8 caracteres (com pelo menos 1 letra e 1 número)
 */
export const registerSchema = z.object({
  name: z
    .string({ required_error: "O nome é obrigatório." })
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(100, "O nome pode ter no máximo 100 caracteres."),

  email: z
    .string({ required_error: "O email é obrigatório." })
    .trim()
    .email("O email deve ser um endereço válido.")
    .max(255, "O email pode ter no máximo 255 caracteres.")
    .transform((val) => val.toLowerCase()),

  password: z
    .string({ required_error: "A senha é obrigatória." })
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .max(128, "A senha pode ter no máximo 128 caracteres.")
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      "A senha deve conter pelo menos uma letra e um número."
    ),
});

/**
 * Schema para login — apenas email e password.
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: "O email é obrigatório." })
    .trim()
    .email("O email deve ser um endereço válido.")
    .transform((val) => val.toLowerCase()),

  password: z
    .string({ required_error: "A senha é obrigatória." })
    .min(1, "A senha é obrigatória."),
});

/**
 * Schema para refresh de token — recebe o refresh token no body.
 */
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: "O refresh token é obrigatório." })
    .min(1, "O refresh token é obrigatório."),
});

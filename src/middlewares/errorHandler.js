/**
 * Middleware global de tratamento de erros.
 *
 * No Express, um middleware de erro é identificado por ter 4 parâmetros:
 * (err, req, res, next). Ele captura qualquer erro que seja passado
 * via next(error) em qualquer ponto da cadeia de middlewares/rotas.
 *
 * Categoriza os erros em:
 * - Erros da aplicação (AppError): retorna o status e mensagem definidos
 * - Erros de validação: retorna 400 com detalhes dos campos inválidos
 * - Erros do Prisma: trata erros conhecidos do banco de dados
 * - Erros inesperados: retorna 500 com mensagem genérica
 */
export function errorHandler(err, _req, res, _next) {
  // Erro de validação (vindo do middleware validate.js)
  if (err.details) {
    return res.status(err.statusCode || 400).json({
      error: err.message,
      details: err.details,
    });
  }

  // Erros do Prisma — unique constraint violation
  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "campo";
    return res.status(409).json({
      error: `Já existe um registro com este ${field}.`,
    });
  }

  // Erros do Prisma — record not found
  if (err.code === "P2025") {
    return res.status(404).json({
      error: "Registro não encontrado.",
    });
  }

  // Erros da aplicação (AppError) ou erros com statusCode definido
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Erro inesperado — loga no servidor mas não expõe detalhes ao cliente
  console.error("Unexpected error:", err);
  return res.status(500).json({
    error: "Erro interno do servidor.",
  });
}

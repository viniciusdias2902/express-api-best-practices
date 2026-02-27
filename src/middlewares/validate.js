/**
 * Middleware factory que valida o body da request usando um schema Zod.
 *
 * Recebe um schema Zod e retorna um middleware do Express.
 * Se a validação falhar, retorna 400 com os detalhes dos erros.
 * Se a validação passar, substitui req.body pelos dados parseados
 * (já com coerções e transformações do Zod aplicadas) e chama next().
 *
 * @param {import("zod").ZodSchema} schema - Schema Zod para validação
 * @returns {import("express").RequestHandler} Middleware do Express
 */
export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Formata os erros do Zod para uma estrutura amigável
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      // Passa o erro para o errorHandler ao invés de responder diretamente
      const error = new Error("Validation failed");
      error.statusCode = 400;
      error.details = errors;
      return next(error);
    }

    // Substitui o body com os dados validados e transformados
    req.body = result.data;
    next();
  };
}

/**
 * Classe de erro customizada para a aplicação.
 *
 * Estende a classe nativa Error adicionando um statusCode HTTP,
 * permitindo que o middleware de erro saiba exatamente qual status
 * retornar ao cliente.
 *
 * Exemplos de uso:
 *   throw new AppError("Livro não encontrado", 404);
 *   throw new AppError("ISBN já cadastrado", 409);
 */
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;

    // Preserva o nome correto da classe no stack trace
    this.name = "AppError";
  }
}

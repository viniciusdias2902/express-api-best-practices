import "dotenv/config";
import { app } from "./app.js";

/**
 * Ponto de entrada da aplicação.
 *
 * Este arquivo é responsável apenas por iniciar o servidor HTTP.
 * Toda a configuração do Express (rotas, middlewares) está em app.js.
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

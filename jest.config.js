/**
 * Configuração do Jest para ESM (ES Modules).
 *
 * O Jest não suporta ESM nativamente, então usamos a flag
 * --experimental-vm-modules do Node.js (definida no script "test"
 * do package.json).
 *
 * O transform vazio desativa a transpilação — os arquivos .js
 * são executados diretamente pelo Node como ESM.
 */
export default {
  // Desativa a transpilação (usamos ESM nativo)
  transform: {},

  // Onde o Jest procura os arquivos de teste
  testMatch: ["**/__tests__/**/*.test.js"],

  // Módulos que são mockados automaticamente devem usar extensionless imports
  moduleFileExtensions: ["js", "json"],

  // Reseta mocks automaticamente entre cada teste
  clearMocks: true,
};

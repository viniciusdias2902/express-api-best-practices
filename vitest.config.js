import { defineConfig } from "vitest/config";

/**
 * Configuração do Vitest.
 *
 * O Vitest suporta ESM nativamente — sem flags experimentais,
 * sem transpilação, sem workarounds. Essa é a principal razão
 * da migração do Jest para o Vitest neste projeto.
 *
 * A API é compatível com Jest (describe, it, expect, vi.fn),
 * facilitando a transição. As diferenças principais:
 * - jest.fn() → vi.fn()
 * - jest.mock() → vi.mock() (com hoisting automático)
 * - import { jest } from "@jest/globals" → import { vi } from "vitest"
 * - Não precisa de --experimental-vm-modules
 */
export default defineConfig({
  test: {
    // Onde procurar os arquivos de teste
    include: ["**/__tests__/**/*.test.js"],

    // Reseta mocks automaticamente entre cada teste
    clearMocks: true,
  },
});

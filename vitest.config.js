import { defineConfig } from "vitest/config";

/**
 * Configuracao do Vitest.
 *
 * O Vitest suporta ESM nativamente — sem flags experimentais,
 * sem transpilacao, sem workarounds. Essa e a principal razao
 * da migracao do Jest para o Vitest neste projeto.
 *
 * A API e compativel com Jest (describe, it, expect, vi.fn),
 * facilitando a transicao. As diferencas principais:
 * - jest.fn() → vi.fn()
 * - jest.mock() → vi.mock() (com hoisting automatico)
 * - import { jest } from "@jest/globals" → import { vi } from "vitest"
 * - Nao precisa de --experimental-vm-modules
 */
export default defineConfig({
  test: {
    // Onde procurar os arquivos de teste
    include: ["**/__tests__/**/*.test.js"],

    // Reseta mocks automaticamente entre cada teste
    clearMocks: true,
  },
});

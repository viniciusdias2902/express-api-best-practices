import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.ts";

/**
 * Cria e exporta uma instância singleton do PrismaClient.
 *
 * No Prisma 7, o driver adapter é obrigatório. Usamos o @prisma/adapter-pg
 * que conecta o Prisma ao PostgreSQL via o driver nativo `pg`.
 *
 * O padrão singleton garante que apenas UMA conexão com o banco de dados
 * seja criada durante todo o ciclo de vida da aplicação, evitando
 * o esgotamento do pool de conexões.
 */
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export { prisma };

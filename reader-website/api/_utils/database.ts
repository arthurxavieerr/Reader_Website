import { PrismaClient } from '@prisma/client';

/**
 * Declaração global para evitar múltiplas instâncias do Prisma
 * em desenvolvimento (hot reload do Vercel)
 */
declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Instância singleton do Prisma Client
 * Reutiliza a conexão existente ou cria uma nova
 */
export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Em desenvolvimento, armazena a instância globalmente para evitar reconexões
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

/**
 * Função para desconectar do banco (usar no finally dos endpoints)
 */
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Erro ao desconectar do banco:', error);
  }
}
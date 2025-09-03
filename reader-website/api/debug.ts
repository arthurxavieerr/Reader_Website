// api/debug.ts - Endpoint de diagnóstico
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Configurar CORS básico
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Teste 1: Variáveis de ambiente
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL ? 'CONFIGURADA' : 'NÃO CONFIGURADA',
      JWT_SECRET: !!process.env.JWT_SECRET ? 'CONFIGURADA' : 'NÃO CONFIGURADA',
      NODE_ENV: process.env.NODE_ENV || 'não definido',
      VITE_API_URL: process.env.VITE_API_URL || 'não definido'
    };

    // Teste 2: Dependências básicas
    let prismaStatus = 'NÃO TESTADO';
    try {
      // Só importar prisma se DATABASE_URL existir
      if (process.env.DATABASE_URL) {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.$connect();
        prismaStatus = 'CONECTADO';
        await prisma.$disconnect();
      } else {
        prismaStatus = 'DATABASE_URL NÃO CONFIGURADA';
      }
    } catch (error) {
      prismaStatus = `ERRO: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    }

    // Teste 3: Informações do sistema
    const systemInfo = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage()
    };

    return res.status(200).json({
      success: true,
      message: 'Diagnóstico da API',
      tests: {
        environment: envCheck,
        database: prismaStatus,
        system: systemInfo
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}
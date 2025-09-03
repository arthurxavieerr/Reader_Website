import { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from './_utils/cors';
import { sendError, sendSuccess } from './_utils/response';
import { prisma, disconnectDatabase } from './_utils/database';

/**
 * Health Check Endpoint
 * GET /api/health
 * 
 * Verifica se a API e o banco de dados estão funcionando
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configura CORS
  setCors(res);

  // Responde a requisições OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Só aceita método GET
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Método não permitido');
  }

  try {
    // Testa conexão com o banco de dados
    await prisma.$queryRaw`SELECT 1`;
    
    // Conta total de livros como teste adicional
    const totalBooks = await prisma.book.count();
    
    return sendSuccess(res, {
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      totalBooks
    }, 'API funcionando corretamente');

  } catch (error) {
    console.error('Health check error:', error);
    return sendError(res, 500, 'Erro de conexão com o banco de dados');
  } finally {
    await disconnectDatabase();
  }
}
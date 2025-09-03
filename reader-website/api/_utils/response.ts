import { VercelResponse } from '@vercel/node';

/**
 * Envia uma resposta de erro padronizada
 * @param res - Response object do Vercel
 * @param status - Código HTTP de erro (400, 404, 500, etc.)
 * @param message - Mensagem de erro para o usuário
 */
export function sendError(res: VercelResponse, status: number, message: string) {
  return res.status(status).json({ 
    success: false, 
    error: message 
  });
}

/**
 * Envia uma resposta de sucesso padronizada
 * @param res - Response object do Vercel
 * @param data - Dados a serem retornados (opcional)
 * @param message - Mensagem de sucesso (opcional)
 */
export function sendSuccess(res: VercelResponse, data: any = null, message?: string) {
  const response: any = { 
    success: true
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  if (message) {
    response.message = message;
  }
  
  return res.status(200).json(response);
}
import { VercelResponse } from '@vercel/node';

export function sendError(res: VercelResponse, status: number, message: string) {
  return res.status(status).json({ 
    success: false, 
    error: message 
  });
}

export function sendSuccess(res: VercelResponse, data: any = null, message?: string) {
  return res.status(200).json({ 
    success: true, 
    data, 
    message 
  });
}
import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return res.status(200).json({
    success: true,
    message: 'API básica funcionando!',
    environment: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV
    },
    timestamp: new Date().toISOString()
  });
}
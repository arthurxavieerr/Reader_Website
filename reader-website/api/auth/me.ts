// api/auth/me.ts - VERSÃO SIMPLIFICADA
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido'
      });
    }

    // Por enquanto, retornar usuário mock
    const userData = {
      id: '1',
      name: 'Arthur',
      email: 'arthur@example.com',
      phone: '(11) 99999-9999',
      level: 0,
      points: 0,
      balance: 0,
      planType: 'free',
      isAdmin: false,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      data: { user: userData }
    });

  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}
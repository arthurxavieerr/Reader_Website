// api/auth/me.ts - VERSÃO SIMPLIFICADA
export default async function handler(req: any, res: any) {
  // CORS simples
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Verificar se tem token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido'
      });
    }

    const token = authHeader.substring(7);
    
    // Verificação simples do token
    if (!token.startsWith('test-token-')) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    // Extrair ID do token
    const parts = token.split('-');
    const userId = parts[2];

    // Dados simulados baseados no ID
    let userData;
    if (userId === '2') {
      // Admin
      userData = {
        id: '2',
        name: 'Admin',
        email: 'admin@betareader.com',
        phone: '(11) 88888-8888',
        level: 99,
        points: 10000,
        balance: 100000,
        planType: 'premium',
        isAdmin: true,
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
      };
    } else {
      // Usuário normal
      userData = {
        id: userId || '1',
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
    }

    return res.status(200).json({
      success: true,
      data: { 
        user: userData
      }
    });

  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}
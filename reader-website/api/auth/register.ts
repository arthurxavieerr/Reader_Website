// api/auth/register.ts - VERSÃO SIMPLIFICADA
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'Todos os campos são obrigatórios'
      });
    }

    // Por enquanto, apenas simular registro
    const userData = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      level: 0,
      points: 0,
      balance: 0,
      planType: 'free',
      isAdmin: false,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
    };

    const token = `auth-token-${userData.id}-${Date.now()}`;

    return res.status(201).json({
      success: true,
      data: { user: userData, token }
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

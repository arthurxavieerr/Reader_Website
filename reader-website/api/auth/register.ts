// api/auth/register.ts - VERSÃO SIMPLIFICADA
export default async function handler(req: any, res: any) {
  // CORS simples
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'Todos os campos são obrigatórios'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    // Simular verificação de email existente
    const existingEmails = ['arthur@example.com', 'admin@betareader.com'];
    if (existingEmails.includes(email.toLowerCase())) {
      return res.status(409).json({
        success: false,
        error: 'Email já está em uso'
      });
    }

    // Criar dados do novo usuário
    const userData = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      level: 0,
      points: 0,
      balance: 0,
      planType: 'free',
      isAdmin: false,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
    };

    const token = `test-token-${userData.id}-${Date.now()}`;

    return res.status(201).json({
      success: true,
      data: { 
        user: userData, 
        token 
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}
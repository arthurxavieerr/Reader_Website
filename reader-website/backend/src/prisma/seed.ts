import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário admin
  const adminPassword = 'admin123';
  const adminSalt = await bcrypt.genSalt(12);
  const adminPasswordHash = await bcrypt.hash(adminPassword, adminSalt);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@betareader.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@betareader.com',
      phone: '(11) 99999-9999',
      passwordHash: adminPasswordHash,
      salt: adminSalt,
      level: 99,
      points: 10000,
      balance: 100000, // R$ 1000,00
      planType: 'PREMIUM',
      isAdmin: true,
      onboardingCompleted: true,
      commitment: 'COMMITTED',
      incomeRange: 'HIGH'
    }
  });

  console.log('👑 Admin criado:', admin.email);

  // Criar livros iniciais (os 3 primeiros que dão recompensa)
  const initialBooks = [
    {
      title: 'As Sombras de Eldoria',
      author: 'Marina Silvestre',
      genre: 'Fantasia Épica',
      synopsis: 'Em um reino onde a magia está desaparecendo, uma jovem escriba descobre um antigo segredo que pode salvar ou destruir tudo o que conhece.',
      content: 'O vento sussurrava segredos antigos através das torres de cristal de Eldoria, carregando consigo o aroma de pergaminhos envelhecidos e a promessa de tempestades distantes. Lyra ajustou seus óculos de leitura e mergulhou mais fundo na penumbra da Grande Biblioteca, onde as sombras dançavam entre estantes que se perdiam nas alturas nebulosas do teto abobadado...',
      baseRewardMoney: 500, // R$ 5,00 (para free) / R$ 15,00 (para premium)
      rewardPoints: 50,
      wordCount: 2000,
      pageCount: 8,
      estimatedReadTime: 480, // 8 minutos
      isInitialBook: true
    },
    {
      title: 'Código Vermelho',
      author: 'Alexandre Ferreira',
      genre: 'Thriller Tecnológico',
      synopsis: 'Um thriller envolvente sobre hackers e conspirações corporativas em um mundo digital perigoso.',
      content: 'A tela piscava intermitentemente no porão escuro, refletindo o rosto tenso de Marcus enquanto seus dedos voavam sobre o teclado. Cada linha de código que ele digitava o aproximava mais da verdade, mas também do perigo...',
      baseRewardMoney: 500, // R$ 5,00 (para free) / R$ 15,00 (para premium)
      rewardPoints: 50,
      wordCount: 1800,
      pageCount: 7,
      estimatedReadTime: 420, // 7 minutos
      isInitialBook: true
    },
    {
      title: 'O Jardim das Memórias Perdidas',
      author: 'Clara Monteiro',
      genre: 'Romance Contemporâneo',
      synopsis: 'Uma história tocante sobre amor, perda e a força das lembranças em tempos difíceis.',
      content: 'O perfume das rosas ainda pairava no ar quando Elena encontrou o diário escondido entre os livros da avó. Suas páginas amareladas guardavam segredos de um amor impossível que atravessou décadas...',
      baseRewardMoney: 500, // R$ 5,00 (para free) / R$ 15,00 (para premium)  
      rewardPoints: 50,
      wordCount: 2200,
      pageCount: 9,
      estimatedReadTime: 540, // 9 minutos
      isInitialBook: true
    }
  ];

  for (const bookData of initialBooks) {
    const existingBook = await prisma.book.findFirst({
      where: { title: bookData.title }
    });
    
    if (!existingBook) {
      const book = await prisma.book.create({
        data: bookData
      });
      console.log('📚 Livro criado:', book.title);
    }
  }

  // Criar livros premium (para mostrar o que vem depois)
  const premiumBooks = [
    {
      title: 'O Último Detetive de Baker Street',
      author: 'Eduardo Santos',
      genre: 'Mistério Urbano',
      synopsis: 'Mistérios sombrios nas ruas de Londres com um detetive excepcional.',
      content: 'A névoa londrina envolveu Baker Street como um manto cinzento quando o último detetive da linhagem Holmes recebeu um caso que mudaria tudo...',
      baseRewardMoney: 800, // R$ 8,00 (premium)
      rewardPoints: 80,
      requiredLevel: 1,
      wordCount: 3500,
      pageCount: 15,
      estimatedReadTime: 840,
      isInitialBook: false
    }
  ];

  for (const bookData of premiumBooks) {
    const existingBook = await prisma.book.findFirst({
      where: { title: bookData.title }
    });
    
    if (!existingBook) {
      const book = await prisma.book.create({
        data: bookData
      });
      console.log('🔒 Livro premium criado:', book.title);
    }
  }

  console.log('✅ Seed concluído com sucesso!');
  console.log('👑 Admin: admin@betareader.com / admin123');
  console.log('📚 3 livros iniciais criados');
  console.log('🔒 1 livro premium criado');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
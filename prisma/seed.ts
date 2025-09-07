import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';  // Importando o módulo fs para ler os arquivos .txt

const prisma = new PrismaClient();

// Função para ler o conteúdo de um arquivo .txt
const readBookContent = (filePath: string): Promise<string> => {  // Especificando o tipo Promise<string>
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        reject('Erro ao ler o arquivo: ' + err);
      }
      resolve(data as string);  // Assegurando que o 'data' é uma string
    });
  });
};


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
      title: 'A Caixa de Pandora',
      author: 'Hesíodo',
      genre: 'Mitologia grega',
      synopsis: 'Descubra o conto mitológico de Pandora, que nos revela a origem dos males do mundo e o dom da esperança. A narrativa traz ensinamentos profundos sobre a natureza humana e a eterna busca por consolo e felicidade, destacando a importância da esperança em tempos de adversidade.',
      content: await readBookContent('./src/bookstxt/livro2.txt'),  // Lê o conteúdo do arquivo livro1.txt
      baseRewardMoney: 10000, // R$ 5,00 (para free) / R$ 15,00 (para premium)
      rewardPoints: 500,
      wordCount: 2725,
      pageCount: 1,
      estimatedReadTime: 420, // 8 minutos
      isInitialBook: true
    },
    {
      title: 'O Príncipe e a Gata',
      author: 'Charles Perrault',
      genre: 'Conto de fadas',
      synopsis: 'Era uma vez um rei, pai de três corajosos príncipes, que estava em dúvida sobre qual deles deveria lhe suceder no trono. Por isso, reuniu os filhos e disse a eles que aquele que trouxesse o cão mais bonito no prazo de um ano seria o novo rei.',
      content: await readBookContent('./src/bookstxt/livro3.txt'),  // Lê o conteúdo do arquivo livro1.txt
      baseRewardMoney: 20000, // R$ 5,00 (para free) / R$ 15,00 (para premium)
      rewardPoints: 500,
      wordCount: 5291,
      pageCount: 2,
      estimatedReadTime: 420, // 7 minutos
      isInitialBook: true
    },
    {
      title: 'O Banqueiro Anarquista',
      author: 'Fernando Pessoa',
      genre: 'Ensaio filosófico',
      synopsis: '"O Banqueiro Anarquista" de Fernando Pessoa é um ensaio filosófico em forma de diálogo, onde um banqueiro, defensor do capitalismo e da riqueza, se declara anarquista. Ele tenta justificar a contradição entre suas ações e suas crenças, argumentando que, para ser verdadeiramente anarquista, é necessário agir de forma intelectual e distante das estruturas de poder. A obra critica a hipocrisia humana e questiona a validade das ideologias, refletindo sobre a liberdade e a moralidade.',
      content: await readBookContent('./src/bookstxt/livro1.txt'),  // Lê o conteúdo do arquivo livro1.txt
      baseRewardMoney: 30000, // R$ 5,00 (para free) / R$ 15,00 (para premium)
      rewardPoints: 500,
      wordCount: 64071,
      pageCount: 13,
      estimatedReadTime: 5580, // 8 minutos
      isInitialBook: true
    },
    {
      title: 'De Quanta Terra um Homem Precisa?',
      author: 'Leon Tolstói',
      genre: 'Conto filosófico/moral.',
      synopsis: 'Neste conto clássico de Leon Tolstói, um camponês busca mais terras para alcançar a felicidade. No entanto, sua ambição crescente o leva a um desfecho inesperado. Uma reflexão profunda sobre ganância, simplicidade e os limites do desejo humano.',
      content: await readBookContent('./src/bookstxt/livro4.txt'),  // Lê o conteúdo do arquivo livro1.txt
      baseRewardMoney: 50000, // R$ 5,00 (para free) / R$ 15,00 (para premium)  
      rewardPoints: 50,
      wordCount: 27480,
      pageCount: 9,
      estimatedReadTime: 1.100, // 9 minutos
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
      content: await readBookContent('./src/bookstxt/livro5.txt'),
      baseRewardMoney: 80000, // R$ 8,00 (premium)
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
// fix-status-column.js - Corrigir problema da coluna status
require('dotenv').config();
const { Client } = require('pg');

async function fixStatusColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');

    // Verificar o default atual da coluna status
    console.log('🔍 Verificando default da coluna status...');
    const columnInfo = await client.query(`
      SELECT column_default, data_type
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND column_name = 'status'
    `);

    console.log('📊 Info atual da coluna status:', columnInfo.rows[0]);

    // Primeiro, remover o default
    console.log('🔧 Removendo default da coluna status...');
    await client.query(`
      ALTER TABLE transactions 
      ALTER COLUMN status DROP DEFAULT
    `);
    console.log('✅ Default removido');

    // Agora converter o tipo
    console.log('🔧 Convertendo tipo da coluna status...');
    await client.query(`
      ALTER TABLE transactions 
      ALTER COLUMN status TYPE "TransactionStatus" 
      USING status::"TransactionStatus"
    `);
    console.log('✅ Tipo convertido');

    // Recolocar o default usando o enum
    console.log('🔧 Recolocando default usando enum...');
    await client.query(`
      ALTER TABLE transactions 
      ALTER COLUMN status SET DEFAULT 'PENDING'::"TransactionStatus"
    `);
    console.log('✅ Default recolocado');

    // Verificar resultado final
    const finalCheck = await client.query(`
      SELECT column_default, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND column_name = 'status'
    `);

    console.log('📊 Info final da coluna status:', finalCheck.rows[0]);

    // Teste de inserção
    console.log('🧪 Testando inserção...');
    const testResult = await client.query(`
      SELECT 'PENDING'::"TransactionStatus" as test_status
    `);
    console.log('✅ Teste bem-sucedido:', testResult.rows[0]);

    await client.end();
    console.log('🎉 Correção da coluna status concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    await client.end();
    throw error;
  }
}

fixStatusColumn()
  .then(() => {
    console.log('\n🚀 Agora execute:');
    console.log('   npx prisma db push');
    console.log('   ./start-server.bat');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 FALHA:', error.message);
    process.exit(1);
  });
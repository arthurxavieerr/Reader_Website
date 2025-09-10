// fix-enums.js - Script para criar ENUMs manualmente no PostgreSQL
require('dotenv').config();
const { Client } = require('pg');

async function fixEnums() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');

    // Criar ENUMs se não existirem
    const enumQueries = [
      `DO $$ BEGIN
        CREATE TYPE "public"."TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'REWARD', 'BONUS', 'REFUND');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      
      `DO $$ BEGIN
        CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      
      `DO $$ BEGIN
        CREATE TYPE "public"."PixKeyType" AS ENUM ('CPF', 'EMAIL', 'PHONE', 'RANDOM');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      
      `DO $$ BEGIN
        CREATE TYPE "public"."PlanType" AS ENUM ('FREE', 'PREMIUM');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      
      `DO $$ BEGIN
        CREATE TYPE "public"."Commitment" AS ENUM ('COMMITTED', 'CURIOUS');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      
      `DO $$ BEGIN
        CREATE TYPE "public"."IncomeRange" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'UNEMPLOYED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`
    ];

    for (const query of enumQueries) {
      try {
        await client.query(query);
        console.log('✅ ENUM criado/verificado');
      } catch (error) {
        console.log('⚠️ Erro ao criar ENUM:', error.message);
      }
    }

    // Verificar se os ENUMs foram criados
    const enumCheck = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typname IN ('TransactionType', 'TransactionStatus', 'PixKeyType', 'PlanType', 'Commitment', 'IncomeRange')
      ORDER BY typname
    `);

    console.log('📊 ENUMs encontrados:', enumCheck.rows.map(r => r.typname));

    if (enumCheck.rows.length === 6) {
      console.log('🎉 Todos os ENUMs foram criados com sucesso!');
    } else {
      console.log('⚠️ Alguns ENUMs podem estar faltando');
    }

    await client.end();
    
  } catch (error) {
    console.error('❌ Erro:', error);
    await client.end();
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixEnums()
    .then(() => {
      console.log('\n🚀 Agora execute:');
      console.log('   npx prisma generate');
      console.log('   ./start-server.bat');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 FALHA:', error.message);
      process.exit(1);
    });
}

module.exports = { fixEnums };
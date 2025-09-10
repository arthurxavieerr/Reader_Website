// force-cleanup-and-reset.js - Limpeza forçada e reset do banco
require('dotenv').config();
const { Client } = require('pg');

async function forceCleanupAndReset() {
  let client;
  
  try {
    console.log('🧹 LIMPEZA FORÇADA E RESET DO BANCO');
    console.log('⚠️  Este script vai fazer limpeza completa de prepared statements e conexões');
    
    // Conexão direta sem Prisma para evitar conflitos
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      // Configurações para evitar prepared statements
      statement_timeout: 30000,
      query_timeout: 30000,
    });

    await client.connect();
    console.log('✅ Conectado diretamente ao PostgreSQL');

    // Etapa 1: Finalizar todas as conexões ativas exceto a nossa
    console.log('🔪 Etapa 1: Finalizando conexões ativas...');
    try {
      const activeConnections = await client.query(`
        SELECT pid, application_name, state, query_start
        FROM pg_stat_activity 
        WHERE datname = current_database()
        AND pid <> pg_backend_pid()
        AND application_name ILIKE '%prisma%'
      `);

      console.log(`📊 Encontradas ${activeConnections.rows.length} conexões Prisma ativas`);
      
      for (const conn of activeConnections.rows) {
        try {
          await client.query(`SELECT pg_terminate_backend(${conn.pid})`);
          console.log(`✅ Conexão ${conn.pid} finalizada`);
        } catch (termError) {
          console.log(`⚠️ Erro ao finalizar ${conn.pid}: ${termError.message}`);
        }
      }
    } catch (connError) {
      console.log('⚠️ Erro ao finalizar conexões:', connError.message);
    }

    // Etapa 2: Limpeza total de prepared statements
    console.log('🧹 Etapa 2: Limpeza total de prepared statements...');
    try {
      // Listar todos os prepared statements
      const statements = await client.query('SELECT name FROM pg_prepared_statements');
      console.log(`📊 Encontrados ${statements.rows.length} prepared statements`);
      
      // Limpar TODOS de uma vez
      await client.query('DEALLOCATE ALL');
      console.log('✅ DEALLOCATE ALL executado');
      
      // Verificar se limpou
      const remaining = await client.query('SELECT name FROM pg_prepared_statements');
      console.log(`📊 Prepared statements restantes: ${remaining.rows.length}`);
      
    } catch (deallocateError) {
      console.log('⚠️ Erro no DEALLOCATE ALL:', deallocateError.message);
    }

    // Etapa 3: Verificar e corrigir tipos de colunas
    console.log('🔧 Etapa 3: Verificando tipos de colunas...');
    
    // Verificar se a tabela transactions existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'transactions'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('✅ Tabela transactions encontrada');
      
      // Verificar tipos das colunas
      const columnTypes = await client.query(`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name IN ('type', 'status', 'pixKeyType')
      `);

      console.log('📊 Tipos atuais das colunas:');
      columnTypes.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.udt_name})`);
      });

      // Corrigir tipos se necessário
      const corrections = [
        { column: 'type', enum: 'TransactionType' },
        { column: 'status', enum: 'TransactionStatus' },
        { column: 'pixKeyType', enum: 'PixKeyType' }
      ];

      for (const correction of corrections) {
        try {
          console.log(`🔧 Corrigindo coluna ${correction.column}...`);
          
          if (correction.column === 'pixKeyType') {
            // pixKeyType pode ser NULL
            await client.query(`
              ALTER TABLE transactions 
              ALTER COLUMN "${correction.column}" TYPE "${correction.enum}" 
              USING CASE 
                WHEN "${correction.column}" IS NULL THEN NULL 
                ELSE "${correction.column}"::"${correction.enum}" 
              END
            `);
          } else {
            await client.query(`
              ALTER TABLE transactions 
              ALTER COLUMN ${correction.column} TYPE "${correction.enum}" 
              USING ${correction.column}::"${correction.enum}"
            `);
          }
          
          console.log(`✅ Coluna ${correction.column} corrigida`);
        } catch (columnError) {
          console.log(`⚠️ Erro ao corrigir ${correction.column}:`, columnError.message);
        }
      }
    } else {
      console.log('⚠️ Tabela transactions não existe, será criada pelo Prisma');
    }

    // Etapa 4: Verificação final
    console.log('🧪 Etapa 4: Verificação final...');
    
    // Testar se os ENUMs funcionam
    try {
      await client.query(`
        SELECT 
          'DEPOSIT'::"TransactionType" as test_type,
          'PENDING'::"TransactionStatus" as test_status
      `);
      console.log('✅ Teste de ENUMs bem-sucedido');
    } catch (enumError) {
      console.log('⚠️ Teste de ENUMs falhou:', enumError.message);
    }

    // Verificar se não há mais prepared statements
    const finalCheck = await client.query('SELECT COUNT(*) as count FROM pg_prepared_statements');
    console.log(`📊 Prepared statements finais: ${finalCheck.rows[0].count}`);

    await client.end();
    console.log('🎉 LIMPEZA COMPLETA FINALIZADA!');
    
  } catch (error) {
    console.error('💥 ERRO CRÍTICO:', error);
    if (client) {
      try {
        await client.end();
      } catch (endError) {
        console.error('❌ Erro ao fechar conexão:', endError.message);
      }
    }
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  forceCleanupAndReset()
    .then(() => {
      console.log('\n🚀 PRÓXIMOS PASSOS:');
      console.log('   1. npx prisma generate');
      console.log('   2. npx prisma db push');
      console.log('   3. ./start-server.bat');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 FALHA CRÍTICA:', error.message);
      console.log('\n🆘 SOLUÇÕES ALTERNATIVAS:');
      console.log('   1. Reiniciar o banco de dados no Supabase');
      console.log('   2. Trocar para connection mode "transaction" no Supabase');
      console.log('   3. Criar nova instância do banco');
      process.exit(1);
    });
}

module.exports = { forceCleanupAndReset };
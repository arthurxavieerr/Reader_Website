// emergency-cleanup.js - Script de emergência usando apenas pg nativo
require('dotenv').config();

async function emergencyCleanup() {
  const { Client } = require('pg');
  let client;

  try {
    console.log('🚨 SCRIPT DE EMERGÊNCIA - Limpeza PostgreSQL');
    console.log('⚠️  Este script força a limpeza de prepared statements');
    
    // Conexão direta sem prepared statements
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      // Configurações para evitar prepared statements
      statement_timeout: 10000,
      query_timeout: 10000,
    });

    await client.connect();
    console.log('✅ Conectado diretamente ao PostgreSQL');

    // Etapa 1: Forçar DEALLOCATE ALL em uma transação
    console.log('🧹 Etapa 1: Limpando prepared statements...');
    try {
      await client.query('BEGIN');
      await client.query('DEALLOCATE ALL');
      await client.query('COMMIT');
      console.log('✅ DEALLOCATE ALL executado com sucesso');
    } catch (error) {
      await client.query('ROLLBACK');
      console.log('⚠️ DEALLOCATE ALL falhou:', error.message);
    }

    // Etapa 2: Verificar se ainda existem prepared statements
    console.log('🔍 Etapa 2: Verificando prepared statements restantes...');
    const remainingStatements = await client.query(`
      SELECT name, statement 
      FROM pg_prepared_statements
    `);

    if (remainingStatements.rows.length > 0) {
      console.log(`⚠️ Ainda existem ${remainingStatements.rows.length} prepared statements:`);
      
      for (const stmt of remainingStatements.rows) {
        console.log(`   - ${stmt.name}: ${stmt.statement.substring(0, 50)}...`);
        
        // Tentar deallocar individualmente
        try {
          await client.query(`DEALLOCATE "${stmt.name}"`);
          console.log(`✅ Removido: ${stmt.name}`);
        } catch (deallocateError) {
          console.log(`❌ Falha ao remover ${stmt.name}:`, deallocateError.message);
        }
      }
    } else {
      console.log('✅ Nenhum prepared statement encontrado');
    }

    // Etapa 3: Verificar conexões ativas relacionadas ao Prisma
    console.log('🔍 Etapa 3: Verificando conexões Prisma...');
    const prismaConnections = await client.query(`
      SELECT 
        pid, 
        application_name, 
        state,
        query_start,
        state_change
      FROM pg_stat_activity 
      WHERE datname = current_database()
      AND application_name ILIKE '%prisma%'
      AND pid <> pg_backend_pid()
    `);

    if (prismaConnections.rows.length > 0) {
      console.log(`🔪 Encontradas ${prismaConnections.rows.length} conexões Prisma:`);
      
      for (const conn of prismaConnections.rows) {
        console.log(`   - PID ${conn.pid}: ${conn.application_name} (${conn.state})`);
        
        // Finalizar conexões idle há mais de 1 minuto
        if (conn.state === 'idle') {
          try {
            const result = await client.query(`SELECT pg_terminate_backend(${conn.pid})`);
            console.log(`✅ Conexão ${conn.pid} finalizada`);
          } catch (terminateError) {
            console.log(`⚠️ Erro ao finalizar PID ${conn.pid}:`, terminateError.message);
          }
        }
      }
    } else {
      console.log('✅ Nenhuma conexão Prisma ativa encontrada');
    }

    // Etapa 4: Teste final de conectividade
    console.log('🧪 Etapa 4: Teste final...');
    const testResult = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Teste final bem-sucedido:');
    console.log(`   - Hora: ${testResult.rows[0].current_time}`);
    console.log(`   - PostgreSQL: ${testResult.rows[0].pg_version.split(' ')[0]} ${testResult.rows[0].pg_version.split(' ')[1]}`);

    await client.end();
    console.log('🎉 LIMPEZA DE EMERGÊNCIA CONCLUÍDA!');
    console.log('💡 Agora você pode tentar iniciar o servidor novamente');

  } catch (error) {
    console.error('💥 ERRO CRÍTICO na limpeza de emergência:', error);
    
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
  emergencyCleanup()
    .then(() => {
      console.log('\n🚀 Agora execute:');
      console.log('   1. npx prisma generate --force-reset');
      console.log('   2. npm cache clean --force');
      console.log('   3. ./start-server.bat');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 FALHA CRÍTICA:', error.message);
      console.log('\n🆘 SOLUÇÕES ALTERNATIVAS:');
      console.log('   1. Reiniciar o banco de dados no Supabase');
      console.log('   2. Criar uma nova instância do banco');
      console.log('   3. Usar pooling mode "transaction" no Supabase');
      process.exit(1);
    });
}

module.exports = { emergencyCleanup };
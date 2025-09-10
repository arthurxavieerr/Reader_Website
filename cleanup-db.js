// cleanup-db.js - Script para limpar conexões ativas do PostgreSQL
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function cleanupDatabase() {
  let client;
  
  try {
    console.log('🧹 Iniciando limpeza do banco de dados...');
    
    client = new PrismaClient({
      datasources: { 
        db: { url: process.env.DATABASE_URL }
      },
      log: ['error']
    });

    await client.$connect();
    console.log('✅ Conectado ao banco de dados');

    // 1. Verificar conexões ativas
    const activeConnections = await client.$queryRaw`
      SELECT 
        pid,
        usename,
        application_name,
        client_addr,
        state,
        query_start,
        state_change
      FROM pg_stat_activity 
      WHERE datname = current_database()
      AND pid <> pg_backend_pid()
    `;

    console.log(`📊 Conexões ativas encontradas: ${activeConnections.length}`);
    
    if (activeConnectionsResult.rows.length > 0) {
      console.log('📋 Detalhes das conexões:');
      activeConnectionsResult.rows.forEach((conn, index) => {
        console.log(`  ${index + 1}. PID: ${conn.pid}, User: ${conn.usename}, App: ${conn.application_name}, State: ${conn.state}`);
      });
    }

    // 2. Listar todos os prepared statements
    const preparedStatementsResult = await client.query(`
      SELECT name, statement, parameter_types 
      FROM pg_prepared_statements
    `);

    console.log(`📊 Prepared statements encontrados: ${preparedStatementsResult.rows.length}`);
    
    if (preparedStatementsResult.rows.length > 0) {
      console.log('📋 Lista de prepared statements:');
      preparedStatementsResult.rows.forEach((stmt, index) => {
        console.log(`  ${index + 1}. Name: ${stmt.name}, Statement: ${stmt.statement.substring(0, 50)}...`);
      });

      // 3. Deallocar TODOS os prepared statements
      console.log('🧹 Removendo todos os prepared statements...');
      
      try {
        await client.query('DEALLOCATE ALL');
        console.log('✅ Todos os prepared statements removidos com DEALLOCATE ALL');
      } catch (deallocateAllError) {
        console.log('⚠️ DEALLOCATE ALL falhou, tentando individualmente...');
        
        // Se DEALLOCATE ALL falhar, tentar um por um
        for (const stmt of preparedStatementsResult.rows) {
          try {
            await client.query(`DEALLOCATE "${stmt.name}"`);
            console.log(`✅ Deallocated: ${stmt.name}`);
          } catch (individualError) {
            console.log(`⚠️ Erro ao deallocar ${stmt.name}:`, individualError.message);
          }
        }
      }
    } else {
      console.log('✅ Nenhum prepared statement encontrado');
    }

    // 4. Finalizar conexões problemáticas (se necessário)
    const problematicConnections = await client.query(`
      SELECT pid, application_name
      FROM pg_stat_activity 
      WHERE datname = current_database()
      AND application_name LIKE '%prisma%'
      AND state = 'idle'
      AND pid <> pg_backend_pid()
    `);

    if (problematicConnections.rows.length > 0) {
      console.log(`🔪 Finalizando ${problematicConnections.rows.length} conexões Prisma inativas...`);
      
      for (const conn of problematicConnections.rows) {
        try {
          await client.query(`SELECT pg_terminate_backend(${conn.pid})`);
          console.log(`✅ Conexão ${conn.pid} finalizada`);
        } catch (terminateError) {
          console.log(`⚠️ Erro ao finalizar conexão ${conn.pid}:`, terminateError.message);
        }
      }
    }

    // 5. Verificação final
    const finalCheck = await client.query('SELECT 1 as test');
    console.log('✅ Verificação final bem-sucedida');

    await client.end();
    console.log('✅ Limpeza concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    throw error;
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (endError) {
        console.log('⚠️ Erro ao fechar conexão:', endError.message);
      }
    }
  }
}
}

// Executar limpeza
if (require.main === module) {
  cleanupDatabase()
    .then(() => {
      console.log('🎉 Limpeza finalizada!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na limpeza:', error);
      process.exit(1);
    });
}

module.exports = { cleanupDatabase };
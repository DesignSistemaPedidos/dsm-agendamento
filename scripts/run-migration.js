// Script para rodar a migração no Supabase
// Uso: node scripts/run-migration.js

const fs = require('fs');
const path = require('path');

async function runMigration() {
    const SUPABASE_URL = 'https://ltnfvywkjwnglturkoso.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_KEY) {
        console.log('='.repeat(60));
        console.log('⚠️  ATENÇÃO: Service Role Key necessária para migração');
        console.log('='.repeat(60));
        console.log('');
        console.log('A chave anon NÃO tem permissão para criar tabelas.');
        console.log('Você precisa rodar o SQL manualmente:');
        console.log('');
        console.log('1. Acesse: https://supabase.com/dashboard/project/ltnfvywkjwnglturkoso/sql/new');
        console.log('2. Cole o conteúdo do arquivo: supabase/migrations/001_initial.sql');
        console.log('3. Clique em "Run"');
        console.log('');
        console.log('Ou defina a variável SUPABASE_SERVICE_ROLE_KEY e rode novamente.');
        console.log('='.repeat(60));

        // Imprimir o SQL para facilitar
        const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '001_initial.sql'), 'utf8');
        console.log('\n📋 SQL para copiar:\n');
        console.log(sql);
        return;
    }

    const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '001_initial.sql'), 'utf8');

    // Separar statements
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`🚀 Rodando ${statements.length} statements...`);

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const tableName = stmt.match(/CREATE TABLE (\w+)/)?.[1] || `statement ${i + 1}`;

        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                },
                body: JSON.stringify({ query: stmt + ';' }),
            });

            if (res.ok) {
                console.log(`  ✅ ${tableName}`);
            } else {
                const err = await res.text();
                console.log(`  ❌ ${tableName}: ${err}`);
            }
        } catch (e) {
            console.log(`  ❌ ${tableName}: ${e.message}`);
        }
    }

    console.log('\n✅ Migração concluída!');
}

runMigration();

// 🔍 Debug HTML Content Storage
// Script per diagnosticare il problema di salvataggio HTML nel database

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ai_trainer';

async function debugHTMLContent() {
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log('🔗 Connesso al database');

        // 1. Controlla gli ultimi samples salvati
        const samplesResult = await client.query(`
            SELECT 
                id,
                url,
                LENGTH(html_content) as content_length,
                SUBSTRING(html_content, 1, 200) as content_preview,
                SUBSTRING(html_content, LENGTH(html_content) - 100, 100) as content_ending,
                CASE 
                    WHEN html_content LIKE '%</html>%' THEN 'Complete'
                    WHEN html_content LIKE '%</body>%' THEN 'Partial'
                    ELSE 'Truncated'
                END as content_status,
                created_at
            FROM training_samples 
            ORDER BY created_at DESC 
            LIMIT 3
        `);

        console.log('\n📊 Ultimi samples salvati:');
        samplesResult.rows.forEach((row, index) => {
            console.log(`\n--- Sample ${index + 1} ---`);
            console.log(`ID: ${row.id}`);
            console.log(`URL: ${row.url}`);
            console.log(`Content Length: ${row.content_length} caratteri`);
            console.log(`Status: ${row.content_status}`);
            console.log(`Created: ${row.created_at}`);
            console.log(`Preview (primi 200 char): ${row.content_preview}`);
            console.log(`Ending (ultimi 100 char): ${row.content_ending}`);
        });

        // 2. Statistiche generali
        const statsResult = await client.query(`
            SELECT 
                COUNT(*) as total_samples,
                AVG(LENGTH(html_content)) as avg_content_length,
                MAX(LENGTH(html_content)) as max_content_length,
                MIN(LENGTH(html_content)) as min_content_length,
                COUNT(CASE WHEN html_content LIKE '%</html>%' THEN 1 END) as complete_html,
                COUNT(CASE WHEN LENGTH(html_content) < 1000 THEN 1 END) as potentially_truncated
            FROM training_samples
        `);

        console.log('\n📈 Statistiche database:');
        const stats = statsResult.rows[0];
        console.log(`Samples totali: ${stats.total_samples}`);
        console.log(`Lunghezza media HTML: ${Math.round(stats.avg_content_length)} caratteri`);
        console.log(`HTML più lungo: ${stats.max_content_length} caratteri`);
        console.log(`HTML più corto: ${stats.min_content_length} caratteri`);
        console.log(`HTML completi (con </html>): ${stats.complete_html}`);
        console.log(`Potenzialmente troncati (<1000 char): ${stats.potentially_truncated}`);

        // 3. Controlla se il problema è nel campo TEXT
        const fieldInfoResult = await client.query(`
            SELECT 
                column_name,
                data_type,
                character_maximum_length,
                is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'training_samples' 
            AND column_name = 'html_content'
        `);

        console.log('\n🗃️ Info campo html_content:');
        if (fieldInfoResult.rows.length > 0) {
            const field = fieldInfoResult.rows[0];
            console.log(`Tipo: ${field.data_type}`);
            console.log(`Lunghezza massima: ${field.character_maximum_length || 'Illimitata'}`);
            console.log(`Nullable: ${field.is_nullable}`);
        } else {
            console.log('⚠️ Campo html_content non trovato!');
        }

    } catch (error) {
        console.error('❌ Errore:', error.message);
    } finally {
        await client.end();
        console.log('\n🔒 Connessione chiusa');
    }
}

// Test di inserimento per verificare se il campo può contenere HTML lungo
async function testLongHTMLInsertion() {
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        
        // Crea un HTML di test molto lungo
        const longHTML = '<!DOCTYPE html><html><head><title>Test</title></head><body>' + 
                        'Lorem ipsum '.repeat(10000) + 
                        '</body></html>';
        
        console.log(`\n🧪 Test inserimento HTML lungo (${longHTML.length} caratteri)...`);
        
        const result = await client.query(`
            INSERT INTO training_samples (
                sample_id, 
                url, 
                business_type, 
                collection_method, 
                html_content
            ) VALUES ($1, $2, $3, $4, $5) 
            RETURNING id, LENGTH(html_content) as saved_length
        `, [
            'test-long-html-' + Date.now(),
            'https://test.example.com',
            'test',
            'test',
            longHTML
        ]);

        const saved = result.rows[0];
        console.log(`✅ Inserimento completato:`);
        console.log(`ID: ${saved.id}`);
        console.log(`Lunghezza originale: ${longHTML.length}`);
        console.log(`Lunghezza salvata: ${saved.saved_length}`);
        console.log(`Troncato: ${longHTML.length !== saved.saved_length ? 'SÌ' : 'NO'}`);

        // Pulizia
        await client.query('DELETE FROM training_samples WHERE sample_id = $1', ['test-long-html-' + (Date.now() - 1000)]);

    } catch (error) {
        console.error('❌ Errore nel test:', error.message);
    } finally {
        await client.end();
    }
}

if (require.main === module) {
    console.log('🚀 Avvio debug HTML content...\n');
    debugHTMLContent()
        .then(() => testLongHTMLInsertion())
        .catch(console.error);
}

module.exports = { debugHTMLContent, testLongHTMLInsertion };

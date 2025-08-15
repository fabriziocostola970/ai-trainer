-- 🔧 Fix HTML Content Field Size Issue
-- Migrazione per risolvere il problema di troncamento del campo html_content

-- 1. Verifica la lunghezza attuale dei contenuti HTML
SELECT 
    id,
    url,
    LENGTH(html_content) as content_length,
    SUBSTRING(html_content, 1, 100) as content_preview
FROM training_samples 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Controlla se ci sono contenuti troncati (che terminano bruscamente)
SELECT 
    id,
    url,
    LENGTH(html_content) as content_length,
    RIGHT(html_content, 50) as content_ending,
    CASE 
        WHEN html_content LIKE '%</html>%' THEN 'Complete'
        WHEN html_content LIKE '%</body>%' THEN 'Partial'
        ELSE 'Truncated'
    END as content_status
FROM training_samples 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Opzionale: Cambia il tipo del campo se necessario
-- ALTER TABLE training_samples ALTER COLUMN html_content TYPE TEXT;

-- 4. Aggiungi indice per migliorare le performance sulle query di lunghezza
CREATE INDEX IF NOT EXISTS idx_training_samples_html_length 
ON training_samples USING btree (LENGTH(html_content));

-- 5. Verifica le dimensioni della tabella
SELECT 
    pg_size_pretty(pg_total_relation_size('training_samples')) as table_size,
    count(*) as total_records
FROM training_samples;

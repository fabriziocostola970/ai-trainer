-- 🗄️ DATABASE MIGRATION: Creazione tabella generated_websites
-- Eseguire questo SQL nel database Railway PostgreSQL

-- Crea la tabella per i siti generati
CREATE TABLE IF NOT EXISTS generated_websites (
    id SERIAL PRIMARY KEY,
    website_id VARCHAR(255) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    business_description TEXT,
    html_content TEXT NOT NULL,
    style_preference VARCHAR(100) DEFAULT 'moderno',
    color_mood VARCHAR(100) DEFAULT 'professionale',
    target_audience VARCHAR(100) DEFAULT 'generale',
    generation_metadata JSONB,
    content_length INTEGER,
    images_count INTEGER DEFAULT 0,
    claude_model VARCHAR(50) DEFAULT 'claude-3-sonnet',
    generation_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_generated_websites_business_type ON generated_websites(business_type);
CREATE INDEX IF NOT EXISTS idx_generated_websites_created_at ON generated_websites(created_at);
CREATE INDEX IF NOT EXISTS idx_generated_websites_website_id ON generated_websites(website_id);

-- Funzione per updated_at automatico
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per updated_at
DROP TRIGGER IF EXISTS update_generated_websites_updated_at ON generated_websites;
CREATE TRIGGER update_generated_websites_updated_at 
    BEFORE UPDATE ON generated_websites 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Test di inserimento
INSERT INTO generated_websites (
    website_id, business_name, business_type, html_content, content_length
) VALUES (
    'test_website_' || EXTRACT(EPOCH FROM NOW()),
    'Test Business',
    'test',
    '<!DOCTYPE html><html><body><h1>Test</h1></body></html>',
    54
) ON CONFLICT (website_id) DO NOTHING;

-- Verifica che la tabella sia stata creata
SELECT 'SUCCESS: generated_websites table created' as status, count(*) as records FROM generated_websites;

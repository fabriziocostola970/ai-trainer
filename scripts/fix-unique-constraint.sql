-- 🔧 Fix per UNIQUE constraint su ai_design_patterns
-- Rimuovi il constraint business_type e aggiungi business_type + source_url

-- 1. Rimuovi il constraint UNIQUE(business_type)
ALTER TABLE ai_design_patterns DROP CONSTRAINT IF EXISTS ai_design_patterns_business_type_key;

-- 2. Aggiungi colonna source_url se non esiste già
ALTER TABLE ai_design_patterns ADD COLUMN IF NOT EXISTS source_url VARCHAR(2048);

-- 3. Aggiungi colonne mancanti per il nuovo schema
ALTER TABLE ai_design_patterns ADD COLUMN IF NOT EXISTS html_content TEXT;
ALTER TABLE ai_design_patterns ADD COLUMN IF NOT EXISTS css_content TEXT;
ALTER TABLE ai_design_patterns ADD COLUMN IF NOT EXISTS design_analysis JSONB;
ALTER TABLE ai_design_patterns ADD COLUMN IF NOT EXISTS color_palette JSONB;
ALTER TABLE ai_design_patterns ADD COLUMN IF NOT EXISTS font_families JSONB;
ALTER TABLE ai_design_patterns ADD COLUMN IF NOT EXISTS layout_structure JSONB;
ALTER TABLE ai_design_patterns ADD COLUMN IF NOT EXISTS semantic_analysis JSONB;
ALTER TABLE ai_design_patterns ADD COLUMN IF NOT EXISTS performance_metrics JSONB;
ALTER TABLE ai_design_patterns ADD COLUMN IF NOT EXISTS accessibility_score INTEGER;
ALTER TABLE ai_design_patterns ADD COLUMN IF NOT EXISTS design_score INTEGER;
ALTER TABLE ai_design_patterns ADD COLUMN IF NOT EXISTS mobile_responsive BOOLEAN;
ALTER TABLE ai_design_patterns ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE ai_design_patterns ADD COLUMN IF NOT EXISTS training_priority INTEGER;

-- 4. Converti confidence_score da INTEGER a NUMERIC per decimali
ALTER TABLE ai_design_patterns ALTER COLUMN confidence_score TYPE NUMERIC(5,2);

-- 5. Aggiungi il nuovo constraint UNIQUE(business_type, source_url)
ALTER TABLE ai_design_patterns ADD CONSTRAINT ai_design_patterns_business_type_source_url_unique 
    UNIQUE(business_type, source_url);

-- 6. Crea indici per performance
CREATE INDEX IF NOT EXISTS idx_ai_design_patterns_source_url ON ai_design_patterns(source_url);
CREATE INDEX IF NOT EXISTS idx_ai_design_patterns_confidence ON ai_design_patterns(confidence_score);

-- 7. Log del cambiamento
INSERT INTO training_sessions (training_id, current_step, metadata, created_at) 
VALUES ('schema-fix-unique-constraint', 'completed', '{"action": "fixed_unique_constraint", "old": "business_type", "new": "business_type + source_url"}', CURRENT_TIMESTAMP)
ON CONFLICT (training_id) DO UPDATE SET 
    current_step = 'completed', 
    updated_at = CURRENT_TIMESTAMP,
    metadata = '{"action": "fixed_unique_constraint", "old": "business_type", "new": "business_type + source_url"}';

SELECT 'Constraint fix completed successfully' as status;

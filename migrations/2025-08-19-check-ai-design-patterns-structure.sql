-- Migrazione di verifica struttura tabella ai_design_patterns
-- Mostra le colonne e le constraint attive
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ai_design_patterns';

SELECT conname AS constraint_name, pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ai_design_patterns'::regclass;

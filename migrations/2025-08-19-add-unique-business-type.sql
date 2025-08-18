-- Migrazione: aggiunta UNIQUE constraint su business_type
ALTER TABLE ai_design_patterns
ADD CONSTRAINT ai_design_patterns_business_type_unique UNIQUE (business_type);

-- Migrazione per aggiungere la UNIQUE constraint su business_type e source_url
ALTER TABLE ai_design_patterns
ADD CONSTRAINT ai_design_patterns_business_type_source_url_key UNIQUE (business_type, source_url);

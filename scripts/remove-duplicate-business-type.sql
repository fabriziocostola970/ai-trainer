-- Rimuove i duplicati su business_type mantenendo solo la riga con id minimo
DELETE FROM ai_design_patterns a
USING ai_design_patterns b
WHERE a.business_type = b.business_type
  AND a.id > b.id;

-- Fix HTML content field size for large websites
-- PostgreSQL TEXT field should handle unlimited size, but we need to ensure proper configuration

-- Check current field type
\d ai_training_samples;

-- Alter table to ensure unlimited text storage
-- In PostgreSQL, TEXT type already supports unlimited length
-- The issue might be in the application layer truncation

-- Verify max size currently stored
SELECT 
    url,
    LENGTH(htmlContent) as html_size,
    htmlLength,
    status
FROM ai_training_samples 
ORDER BY LENGTH(htmlContent) DESC 
LIMIT 10;

-- Check if there are any constraints limiting the field
SELECT 
    table_name, 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'ai_training_samples' 
AND column_name = 'htmlContent';

-- Ensure the field can handle large content (PostgreSQL TEXT is unlimited by default)
-- If needed, we can explicitly set it to TEXT without constraints
ALTER TABLE ai_training_samples 
ALTER COLUMN "htmlContent" TYPE TEXT;

-- Add comment for documentation
COMMENT ON COLUMN ai_training_samples."htmlContent" 
IS 'Full HTML content - no size limit (supports multi-MB websites)';

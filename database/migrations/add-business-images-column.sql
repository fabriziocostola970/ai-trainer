-- 🚀 Migration: Add business_images column to ai_design_patterns table
-- Date: 17 Agosto 2025
-- Purpose: Enable database-driven stock images system

DO $$ 
BEGIN
    -- Check if column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_design_patterns' 
        AND column_name = 'business_images'
    ) THEN
        -- Add the column
        ALTER TABLE ai_design_patterns 
        ADD COLUMN business_images JSONB DEFAULT '{}';
        
        RAISE NOTICE 'Column business_images added to ai_design_patterns table';
    ELSE
        RAISE NOTICE 'Column business_images already exists in ai_design_patterns table';
    END IF;
END $$;

-- Update existing records to have empty business_images if null
UPDATE ai_design_patterns 
SET business_images = '{}' 
WHERE business_images IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'ai_design_patterns' 
AND column_name = 'business_images';

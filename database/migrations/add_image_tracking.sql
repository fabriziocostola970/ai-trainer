-- Migration: Add image tracking to PostgreSQL database
-- Data: 7 settembre 2025

-- Tabella per tracciare le immagini scaricate
CREATE TABLE IF NOT EXISTS downloaded_images (
    id SERIAL PRIMARY KEY,
    file_name TEXT NOT NULL UNIQUE,
    original_url TEXT NOT NULL,
    local_path TEXT NOT NULL,
    business_type TEXT NOT NULL,
    business_name TEXT,
    category TEXT NOT NULL, -- hero, service, background
    file_size INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    download_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella per collegare immagini ai siti generati
CREATE TABLE IF NOT EXISTS website_images (
    id SERIAL PRIMARY KEY,
    website_id TEXT NOT NULL, -- ID del sito generato
    image_id INTEGER NOT NULL,
    usage_context TEXT NOT NULL, -- dove viene usata nell'HTML
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (image_id) REFERENCES downloaded_images (id) ON DELETE CASCADE
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_downloaded_images_business ON downloaded_images(business_type, business_name);
CREATE INDEX IF NOT EXISTS idx_downloaded_images_active ON downloaded_images(is_active);
CREATE INDEX IF NOT EXISTS idx_downloaded_images_last_used ON downloaded_images(last_used);
CREATE INDEX IF NOT EXISTS idx_website_images_website ON website_images(website_id);
CREATE INDEX IF NOT EXISTS idx_website_images_image ON website_images(image_id);

-- Vista per statistiche
CREATE OR REPLACE VIEW image_stats AS
SELECT 
    COUNT(*) as total_images,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_images,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_images,
    SUM(file_size) as total_size_bytes,
    SUM(CASE WHEN is_active = true THEN file_size ELSE 0 END) as active_size_bytes,
    COUNT(DISTINCT business_type) as business_types_count,
    COUNT(DISTINCT wi.website_id) as linked_websites_count
FROM downloaded_images di
LEFT JOIN website_images wi ON di.id = wi.image_id;

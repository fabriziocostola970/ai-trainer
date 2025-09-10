-- 🖼️ AI-TRAINER IMAGE TABLES MIGRATION
-- Add downloaded_images and website_images tables for image management

-- 📥 Downloaded Images Table
CREATE TABLE IF NOT EXISTS downloaded_images (
    id SERIAL PRIMARY KEY,
    file_name TEXT NOT NULL UNIQUE,
    original_url TEXT NOT NULL,
    local_path TEXT NOT NULL,
    business_type TEXT NOT NULL,
    business_name TEXT,
    category TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    download_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🔗 Website Images Linking Table
CREATE TABLE IF NOT EXISTS website_images (
    id SERIAL PRIMARY KEY,
    website_id TEXT NOT NULL,
    image_id INTEGER NOT NULL,
    usage_context TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (image_id) REFERENCES downloaded_images (id) ON DELETE CASCADE
);

-- 📊 Performance Indexes
CREATE INDEX IF NOT EXISTS idx_downloaded_images_business ON downloaded_images(business_type, business_name);
CREATE INDEX IF NOT EXISTS idx_downloaded_images_active ON downloaded_images(is_active);
CREATE INDEX IF NOT EXISTS idx_downloaded_images_last_used ON downloaded_images(last_used);
CREATE INDEX IF NOT EXISTS idx_website_images_website ON website_images(website_id);
CREATE INDEX IF NOT EXISTS idx_website_images_image ON website_images(image_id);

-- ✅ Migration Complete

-- 🗄️ AI-Trainer PostgreSQL Schema
-- Database permanente per training data, custom sites, e analytics

-- 🎯 Training Sessions Table
CREATE TABLE IF NOT EXISTS training_sessions (
    id SERIAL PRIMARY KEY,
    training_id VARCHAR(255) UNIQUE NOT NULL,
    is_training BOOLEAN DEFAULT false,
    progress INTEGER DEFAULT 0,
    samples_collected INTEGER DEFAULT 0,
    total_samples INTEGER DEFAULT 0,
    current_step VARCHAR(255) DEFAULT 'idle',
    start_time TIMESTAMP,
    completion_time TIMESTAMP,
    accuracy INTEGER,
    training_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'custom'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🔗 Custom Sites Table
CREATE TABLE IF NOT EXISTS custom_sites (
    id SERIAL PRIMARY KEY,
    url VARCHAR(2048) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    style VARCHAR(100) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processed', 'failed'
    last_collected TIMESTAMP,
    collection_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📊 Training Samples Table
CREATE TABLE IF NOT EXISTS training_samples (
    id SERIAL PRIMARY KEY,
    sample_id VARCHAR(255) UNIQUE NOT NULL,
    training_session_id INTEGER REFERENCES training_sessions(id),
    custom_site_id INTEGER REFERENCES custom_sites(id),
    url VARCHAR(2048) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    collection_method VARCHAR(50) NOT NULL, -- 'puppeteer', 'http', 'mock'
    status VARCHAR(50) DEFAULT 'processing', -- 'processing', 'completed', 'failed'
    html_content TEXT,
    html_length INTEGER,
    screenshot_path VARCHAR(500),
    analysis_data JSONB,
    performance_metrics JSONB,
    error_details TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🤖 AI Models Table
CREATE TABLE IF NOT EXISTS ai_models (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(255) UNIQUE NOT NULL,
    training_session_id INTEGER REFERENCES training_sessions(id),
    model_type VARCHAR(100) NOT NULL, -- 'layout_generator', 'style_analyzer', 'content_optimizer'
    accuracy DECIMAL(5,2),
    training_duration_ms BIGINT,
    sample_count INTEGER,
    business_types_covered TEXT[], -- Array of business types
    model_data JSONB, -- Serialized model weights/parameters
    performance_metrics JSONB,
    status VARCHAR(50) DEFAULT 'training', -- 'training', 'ready', 'deployed', 'deprecated'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🎨 Generated Layouts Table
CREATE TABLE IF NOT EXISTS generated_layouts (
    id SERIAL PRIMARY KEY,
    layout_id VARCHAR(255) UNIQUE NOT NULL,
    ai_model_id INTEGER REFERENCES ai_models(id),
    business_name VARCHAR(255),
    business_type VARCHAR(100) NOT NULL,
    style VARCHAR(100) NOT NULL,
    semantic_score INTEGER,
    suggested_blocks TEXT[], -- Array of block names
    layout_data JSONB, -- Full layout structure
    generation_time_ms INTEGER,
    user_feedback JSONB, -- User ratings/feedback
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📈 Analytics Table
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL, -- 'training_started', 'layout_generated', 'api_call', etc.
    event_data JSONB NOT NULL,
    session_id VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    processing_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🔧 System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📋 Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_training_id ON training_sessions(training_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);
CREATE INDEX IF NOT EXISTS idx_training_sessions_created_at ON training_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_custom_sites_url ON custom_sites(url);
CREATE INDEX IF NOT EXISTS idx_custom_sites_business_type ON custom_sites(business_type);
CREATE INDEX IF NOT EXISTS idx_custom_sites_status ON custom_sites(status);

CREATE INDEX IF NOT EXISTS idx_training_samples_sample_id ON training_samples(sample_id);
CREATE INDEX IF NOT EXISTS idx_training_samples_training_session_id ON training_samples(training_session_id);
CREATE INDEX IF NOT EXISTS idx_training_samples_business_type ON training_samples(business_type);

CREATE INDEX IF NOT EXISTS idx_ai_models_model_id ON ai_models(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_status ON ai_models(status);

CREATE INDEX IF NOT EXISTS idx_generated_layouts_layout_id ON generated_layouts(layout_id);
CREATE INDEX IF NOT EXISTS idx_generated_layouts_business_type ON generated_layouts(business_type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- 🔄 Auto-update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON training_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_sites_updated_at BEFORE UPDATE ON custom_sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_samples_updated_at BEFORE UPDATE ON training_samples FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generated_layouts_updated_at BEFORE UPDATE ON generated_layouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 📊 Sample Data
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('ai_trainer_version', '"1.0.0"', 'Current AI Trainer version'),
('max_training_samples', '50', 'Maximum samples per training session'),
('default_business_types', '["restaurant", "tech-startup", "ecommerce", "portfolio", "wellness", "real-estate"]', 'Supported business types'),
('collection_methods', '["http", "puppeteer", "mock"]', 'Available data collection methods')
ON CONFLICT (setting_key) DO NOTHING;

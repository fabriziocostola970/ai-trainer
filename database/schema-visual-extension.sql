-- 🎨 AI-Trainer Visual Analytics Extension
-- Estensione per gestire dati grafici e di design

-- 🎨 Design Patterns Table
CREATE TABLE IF NOT EXISTS design_patterns (
    id SERIAL PRIMARY KEY,
    business_type VARCHAR(100) NOT NULL,
    source_url VARCHAR(2048),
    pattern_type VARCHAR(50) NOT NULL, -- 'color_palette', 'layout', 'typography', 'imagery'
    
    -- Dati colori
    primary_color VARCHAR(7), -- #hex
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    background_color VARCHAR(7),
    text_color VARCHAR(7),
    color_palette JSONB, -- Array completo colori
    
    -- Dati tipografia
    primary_font VARCHAR(100),
    secondary_font VARCHAR(100),
    font_weights JSONB, -- [400, 600, 700]
    font_sizes JSONB, -- {h1: 48, h2: 36, etc}
    
    -- Dati layout
    layout_style VARCHAR(50), -- 'modern', 'minimal', 'corporate', 'creative'
    grid_system VARCHAR(50), -- '12-col', 'flexbox', 'css-grid'
    spacing_scale JSONB, -- [8, 16, 24, 32, 48, 64]
    
    -- Dati imagery
    image_style VARCHAR(50), -- 'photography', 'illustration', 'icon', 'abstract'
    image_treatment VARCHAR(50), -- 'natural', 'filtered', 'overlaid', 'shaped'
    
    -- Metriche di efficacia
    usage_count INTEGER DEFAULT 0,
    effectiveness_score DECIMAL(3,2) DEFAULT 0.00, -- 0-10 rating
    user_feedback_avg DECIMAL(3,2) DEFAULT 0.00,
    
    -- Metadata
    extraction_method VARCHAR(50) DEFAULT 'automated', -- 'automated', 'manual', 'ai_analyzed'
    confidence_level DECIMAL(3,2) DEFAULT 0.00, -- 0-1 confidence in pattern accuracy
    tags JSONB, -- ['modern', 'professional', 'colorful']
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🌈 Color Harmonies Table
CREATE TABLE IF NOT EXISTS color_harmonies (
    id SERIAL PRIMARY KEY,
    business_type VARCHAR(100) NOT NULL,
    harmony_type VARCHAR(50) NOT NULL, -- 'complementary', 'triadic', 'monochromatic', 'analogous'
    base_color VARCHAR(7) NOT NULL,
    palette JSONB NOT NULL, -- Array of hex colors
    usage_frequency INTEGER DEFAULT 0,
    effectiveness_rating DECIMAL(3,2) DEFAULT 0.00,
    source_pattern_id INTEGER REFERENCES design_patterns(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📊 Visual Analytics Table
CREATE TABLE IF NOT EXISTS visual_analytics (
    id SERIAL PRIMARY KEY,
    business_type VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'color_preference', 'layout_effectiveness', 'font_popularity'
    metric_data JSONB NOT NULL,
    sample_size INTEGER DEFAULT 0,
    confidence_interval DECIMAL(5,2) DEFAULT 95.00,
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Trends temporali
    trend_direction VARCHAR(20), -- 'increasing', 'decreasing', 'stable'
    trend_strength DECIMAL(3,2) DEFAULT 0.00, -- 0-1 strength of trend
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🎯 Design Recommendations Table
CREATE TABLE IF NOT EXISTS design_recommendations (
    id SERIAL PRIMARY KEY,
    business_type VARCHAR(100) NOT NULL,
    recommendation_type VARCHAR(50) NOT NULL, -- 'color_scheme', 'layout_type', 'font_pairing'
    recommendation_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL, -- 0-1 confidence
    evidence_patterns JSONB, -- Array of pattern IDs that support this recommendation
    success_rate DECIMAL(5,2) DEFAULT 0.00, -- Historical success rate %
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- A/B Testing support
    test_group VARCHAR(50) DEFAULT 'control', -- 'control', 'variant_a', 'variant_b'
    conversion_rate DECIMAL(5,2),
    engagement_score DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🔍 Indexes per performance
CREATE INDEX IF NOT EXISTS idx_design_patterns_business_type ON design_patterns(business_type);
CREATE INDEX IF NOT EXISTS idx_design_patterns_pattern_type ON design_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_color_harmonies_business_type ON color_harmonies(business_type);
CREATE INDEX IF NOT EXISTS idx_visual_analytics_business_type ON visual_analytics(business_type);
CREATE INDEX IF NOT EXISTS idx_design_recommendations_business_type ON design_recommendations(business_type);

-- 📈 Views per analytics
CREATE OR REPLACE VIEW popular_color_schemes AS
SELECT 
    business_type,
    primary_color,
    secondary_color,
    accent_color,
    COUNT(*) as usage_count,
    AVG(effectiveness_score) as avg_effectiveness
FROM design_patterns 
WHERE pattern_type = 'color_palette' 
    AND effectiveness_score > 0
GROUP BY business_type, primary_color, secondary_color, accent_color
ORDER BY usage_count DESC, avg_effectiveness DESC;

CREATE OR REPLACE VIEW design_trends AS
SELECT 
    business_type,
    layout_style,
    COUNT(*) as frequency,
    AVG(effectiveness_score) as effectiveness,
    MAX(updated_at) as last_seen
FROM design_patterns 
WHERE layout_style IS NOT NULL
GROUP BY business_type, layout_style
ORDER BY frequency DESC, effectiveness DESC;

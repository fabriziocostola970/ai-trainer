/**
 * 🗄️ Database Setup Endpoint
 * Crea la tabella design_patterns se non esiste
 * Endpoint: POST /api/setup-database
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Pool di connessione PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

router.post('/setup-database', async (req, res) => {
    try {
        console.log('🗄️ Starting database setup...');
        
        // Verifica se la tabella esiste già
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'design_patterns'
            );
        `);
        
        if (tableCheck.rows[0].exists) {
            console.log('✅ Table design_patterns already exists');
            return res.status(200).json({
                success: true,
                message: 'Table design_patterns already exists',
                tableExists: true
            });
        }
        
        console.log('📋 Creating design_patterns table...');
        
        // Crea la tabella design_patterns
        await pool.query(`
            CREATE TABLE design_patterns (
                id SERIAL PRIMARY KEY,
                business_type VARCHAR(100) NOT NULL,
                source_url VARCHAR(2048),
                html_content TEXT,
                css_content TEXT,
                design_analysis JSONB,
                color_palette JSONB,
                font_families JSONB,
                layout_structure JSONB,
                semantic_analysis JSONB,
                performance_metrics JSONB,
                accessibility_score INTEGER,
                design_score INTEGER,
                mobile_responsive BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'active',
                tags TEXT[],
                confidence_score DECIMAL(5,2),
                training_priority INTEGER DEFAULT 1
            );
        `);
        
        // Crea indici per performance
        await pool.query(`
            CREATE INDEX idx_design_patterns_business_type ON design_patterns(business_type);
            CREATE INDEX idx_design_patterns_status ON design_patterns(status);
            CREATE INDEX idx_design_patterns_confidence ON design_patterns(confidence_score);
            CREATE INDEX idx_design_patterns_created_at ON design_patterns(created_at);
        `);
        
        console.log('✅ Design patterns table created successfully');
        
        // Inserisci alcuni dati di esempio
        await pool.query(`
            INSERT INTO design_patterns (business_type, design_analysis, color_palette, font_families, layout_structure, confidence_score) VALUES
            ('restaurant', 
             '{"style": "modern", "theme": "warm"}',
             '{"primary": "#D97706", "secondary": "#DC2626", "accent": "#059669"}',
             '{"primary": "Inter", "secondary": "Poppins"}',
             '["hero", "about", "menu", "gallery", "contact"]',
             0.85),
            ('business',
             '{"style": "professional", "theme": "corporate"}', 
             '{"primary": "#1F2937", "secondary": "#6B7280", "accent": "#3B82F6"}',
             '{"primary": "Roboto", "secondary": "Open Sans"}',
             '["hero", "about", "services", "team", "contact"]',
             0.80),
            ('ecommerce',
             '{"style": "modern", "theme": "vibrant"}',
             '{"primary": "#7C3AED", "secondary": "#EC4899", "accent": "#F59E0B"}',
             '{"primary": "Inter", "secondary": "Nunito"}',
             '["hero", "products", "categories", "about", "contact"]',
             0.82);
        `);
        
        console.log('✅ Sample data inserted');
        
        res.status(200).json({
            success: true,
            message: 'Database setup completed successfully',
            tableCreated: true,
            sampleDataInserted: true
        });
        
    } catch (error) {
        console.error('❌ Database setup error:', error);
        res.status(500).json({
            success: false,
            error: 'Database setup failed',
            details: error.message
        });
    }
});

module.exports = router;

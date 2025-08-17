const express = require('express');
const router = express.Router();
const DatabaseStorage = require('../storage/database-storage');
const DesignIntelligence = require('../ai/design-intelligence');
const OpenAI = require('openai');

// � Dynamic training enabled with loop protection

// 🤖 OpenAI content generation with fallback
async function generateBusinessContentWithAI(businessType, businessName) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not configured, using static content');
      return null;
    }

    const prompt = `Genera contenuti specifici per un business di tipo "${businessType}" chiamato "${businessName}".
    
    Fornisci contenuti in formato JSON per:
    1. Hero section (titolo, sottotitolo, descrizione, CTA)
    2. Menu/Prodotti (3 elementi con nome, descrizione, prezzo indicativo)
    3. Galleria (4 descrizioni per immagini)
    4. Recensioni (3 testimonianze con nome cliente e rating)
    5. About section (storia del business)
    
    Rispondi SOLO con JSON valido, senza markdown:
    {
      "hero": {
        "title": "...",
        "subtitle": "...",
        "description": "...",
        "cta": "..."
      },
      "menu": {
        "title": "...",
        "subtitle": "...",
        "description": "...",
        "items": [{"name": "...", "description": "...", "price": "..."}]
      },
      "gallery": {
        "title": "...",
        "subtitle": "...",
        "description": "...",
        "items": ["descrizione1", "descrizione2", "descrizione3", "descrizione4"]
      },
      "reviews": {
        "title": "...",
        "subtitle": "...",
        "description": "...",
        "testimonials": [{"name": "...", "text": "...", "rating": 5}]
      },
      "about": {
        "title": "...",
        "subtitle": "...",
        "description": "..."
      }
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.7
    });

    const content = JSON.parse(completion.choices[0].message.content);
    console.log('✅ Generated AI content for:', businessName);
    return content;
    
  } catch (error) {
    console.log('⚠️ AI content generation failed, using fallback:', error.message);
    return null;
  }
}

// �️ Validate business image data quality (VALIDATION FUNCTION)
function isValidBusinessImageData(gallery, businessType) {
  if (!gallery || !Array.isArray(gallery)) {
    console.log(`⚠️ Invalid gallery data for ${businessType}: not an array`);
    return false;
  }
  
  if (gallery.length < 5) {
    console.log(`⚠️ Insufficient images for ${businessType}: ${gallery.length}/5 required`);
    return false;
  }
  
  // Check that all images are valid URLs
  const validImages = gallery.filter(url => {
    return typeof url === 'string' && 
           url.length > 10 && 
           (url.includes('unsplash.com') || url.includes('pexels.com') || url.includes('pixabay.com'));
  });
  
  if (validImages.length < 5) {
    console.log(`⚠️ Invalid image URLs for ${businessType}: ${validImages.length}/${gallery.length} valid`);
    return false;
  }
  
  console.log(`✅ Valid business image data for ${businessType}: ${validImages.length} valid images`);
  return true;
}

// �🔢 Count valid business types in database (NEW VALIDATION FUNCTION)
// ❌ REMOVED countValidBusinessTypes - was counting ALL business types instead of specific one

// 🎯 Check if we have sufficient data for SPECIFIC business type
async function hasValidBusinessTypeData(businessType, storage) {
  try {
    const result = await storage.query(`
      SELECT COUNT(*) as count 
      FROM ai_design_patterns 
      WHERE business_type = $1 
      AND status = 'active' 
      AND business_images IS NOT NULL 
      AND color_palette IS NOT NULL
      AND jsonb_array_length(COALESCE(business_images->'unsplash_gallery', business_images->'gallery', '[]'::jsonb)) >= 5
    `, [businessType]);
    
    const count = parseInt(result.rows[0]?.count || 0);
    console.log(`📊 Valid data for business type "${businessType}": ${count} records`);
    return count > 0;
  } catch (error) {
    console.log(`⚠️ Error checking business type ${businessType}:`, error.message);
    return false;
  }
}

// 🚀 Trigger background expansion of business types (ASYNC NON-BLOCKING)
// ❌ REMOVED triggerBusinessTypesExpansion - was adding random business types
// 🎯 Now we only scrape competitors for the SPECIFIC business type requested

// 🤖 STEP 1: Identifica il business type dalla descrizione
async function identifyBusinessType(businessName, businessDescription) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not configured');
      return null;
    }
    
    const prompt = `Analyze this business and identify its type:

Business Name: "${businessName}"
Business Description: "${businessDescription || businessName}"

Return ONLY the business type in English (one word, lowercase).
Examples: restaurant, florist, dentist, gym, bakery, beauty, technology, ecommerce, fashion, consulting

Business type:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 10,
      temperature: 0.1
    });

    const businessType = completion.choices[0].message.content.trim().toLowerCase();
    console.log(`🤖 OpenAI identified business type: "${businessName}" → "${businessType}"`);
    return businessType;
    
  } catch (error) {
    console.log('⚠️ OpenAI business type identification failed:', error.message);
    return null;
  }
}

// 🖼️ DATABASE-DRIVEN Gallery Images (SISTEMA DINAMICO COMPLETO)
async function getBusinessImagesFromDB(businessName, businessDescription, count = 4, attempt = 1) {
  const maxAttempts = 2; // 🔒 MEMORY PROTECTION: Max 2 tentativi
  
  // 🛡️ EMERGENCY PROTECTION: Controllo memoria heap
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed > 1024 * 1024 * 1024) { // 1GB limit
    console.log('🚨 MEMORY PROTECTION: Heap usage too high, using Unsplash fallback');
    return await generateUnsplashFallback('business', count);
  }
  
  // 🔒 STRICT ATTEMPT LIMIT 
  if (attempt > maxAttempts) {
    console.log(`⚠️ Max attempts reached (${attempt}), using Unsplash API`);
    return await generateUnsplashFallback('business', count);
  }
  
  try {
    const storage = new DatabaseStorage();
    await storage.initialize(); // ✅ INIZIALIZZA IL DATABASE
    
    // 🤖 STEP 1: Identifica il business type con OpenAI
    const identifiedType = await identifyBusinessType(businessName, businessDescription);
    
    if (!identifiedType) {
      console.log('⚠️ Could not identify business type, using Unsplash fallback');
      return await generateUnsplashFallback('business', count);
    }
    
    console.log(`🔍 Checking database for business type: ${identifiedType} (attempt ${attempt})`);
    
    // 💾 STEP 2: Cerca nel database ai_design_patterns
    const result = await storage.query(
      'SELECT business_images FROM ai_design_patterns WHERE business_type = $1 AND status = $2',
      [identifiedType, 'active']
    );
    
    if (result.rows.length > 0 && result.rows[0].business_images) {
      console.log(`✅ Found existing images for business type: ${identifiedType}`);
      const images = result.rows[0].business_images;
      const gallery = images.unsplash_gallery || images.gallery || [];
      
      // 🛡️ STEP 2.1: CRITICAL - Check if we have data for THIS SPECIFIC business type
      const hasValidData = await hasValidBusinessTypeData(identifiedType, storage);
      if (!hasValidData) {
        console.log(`⚠️ CRITICAL: No data for business type "${identifiedType}"`);
        console.log(`🔄 System MUST scrape competitors for "${identifiedType}" - triggering training`);
        
        // 🚀 Trigger training for THIS SPECIFIC business type (not random ones!)
        if (attempt === 1) {
          console.log(`🚀 Starting competitor scraping for business type: ${identifiedType}`);
          const success = await triggerControlledTraining(identifiedType, storage);
          if (success) {
            // Retry with fresh data
            return await getBusinessImagesFromDB(businessName, businessDescription, count, attempt + 1);
          }
        }
      } else {
        console.log(`✅ BUSINESS TYPE DATA FOUND: "${identifiedType}" has valid patterns`);
      }
      
      // 🛡️ STEP 2.1: Check if we have the specific business type needed
      // Note: We only generate data for the REQUESTED business type, not random expansion
      console.log(`� Checking database for specific business type: ${identifiedType}`);
      
      // 🛡️ STEP 2.2: Validate individual business image data quality
      if (!isValidBusinessImageData(gallery, identifiedType)) {
        console.log(`⚠️ Invalid business data for ${identifiedType}: insufficient images (${gallery.length}), triggering regeneration`);
        
        // �️ Remove invalid record from database
        await storage.query('DELETE FROM ai_design_patterns WHERE business_type = $1', [identifiedType]);
        
        // 🔄 Trigger new data generation
        if (attempt === 1) {
          const success = await triggerControlledTraining(identifiedType, storage);
          if (success) {
            return await getBusinessImagesFromDB(businessName, businessDescription, count, attempt + 1);
          }
        }
        
        console.log(`⚠️ Using fallback for invalid business data: ${identifiedType}`);
        return await generateUnsplashFallback(identifiedType, count);
      }
      
      console.log(`�📊 Returning ${gallery.length} valid images from database`);
      
      return gallery.slice(0, count);
    }
    
    // 🚀 STEP 3: Business type non trovato → Sistema dinamico CONTROLLATO
    if (attempt === 1) {
      console.log(`🔍 NEW BUSINESS TYPE "${identifiedType}" - Starting controlled dynamic discovery...`);
      
      // 🎯 STEP 4: Genera competitor e avvia scraping CONTROLLATO
      const success = await triggerControlledTraining(identifiedType, storage);
      
      if (success) {
        // 🔄 STEP 5: Una sola ricorsione controllata
        console.log(`🔄 Controlled recursive call for newly saved data: ${identifiedType}`);
        return await getBusinessImagesFromDB(businessName, businessDescription, count, attempt + 1);
      }
    }
    
    // 🆘 Fallback finale con Unsplash API diretta
    console.log(`⚠️ Using Unsplash API fallback for: ${identifiedType} (attempt ${attempt})`);
    return await generateUnsplashFallback(identifiedType, count);
    
  } catch (error) {
    console.log('⚠️ Database error, using Unsplash fallback:', error.message);
    return await generateUnsplashFallback('business', count);
  }
}

// 🚀 Training controllato con SCRAPING REALE (updated per business type specifico)
async function triggerControlledTraining(businessType, storage) {
  try {
    console.log(`🤖 Starting controlled training for: ${businessType}`);
    
    // 🎯 STEP 1: Genera competitor con OpenAI
    const competitorSites = await generateCompetitorSites(businessType);
    
    if (!competitorSites || competitorSites.length === 0) {
      console.log(`⚠️ No competitors generated for ${businessType}, using fallback`);
      return false;
    }
    
    console.log(`✅ Generated ${competitorSites.length} competitors for ${businessType}`);
    
    // 🕷️ STEP 2: SCRAPING REALE dei competitor sites
    console.log(`🔍 Starting REAL scraping for ${businessType} competitors...`);
    
    try {
      // Get the correct base URL for the environment
      let baseUrl;
      if (process.env.RAILWAY_STATIC_URL) {
        baseUrl = process.env.RAILWAY_STATIC_URL;
      } else if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        baseUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
      } else {
        baseUrl = `http://localhost:${process.env.PORT || 8080}`;
      }
      
      console.log(`🌐 Training API URL: ${baseUrl}/api/training/custom`);
      
      const trainingResponse = await fetch(`${baseUrl}/api/training/custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AI_TRAINER_API_KEY || 'ai-trainer-local-dev'}`
        },
        body: JSON.stringify({
          sites: competitorSites.map(site => site.url),
          businessType: businessType,
          extractDesignPatterns: true,  // 🎨 Extract CSS, colors, fonts
          extractImages: true,          // 🖼️ Extract real images
          saveToDatabase: true,         // 💾 Save in ai_design_patterns
          specificBusinessType: businessType // 🎯 Save only for this business type
        })
      });
      
      if (trainingResponse.ok) {
        const trainingResult = await trainingResponse.json();
        console.log(`✅ Real scraping started for ${businessType}:`, trainingResult);
        
        // 🕰️ Wait for training completion (with REDUCED timeout to prevent infinite loops)
        const maxWaitTime = 15000; // REDUCED to 15 seconds to prevent loops
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
          // Check if data was saved in database - USING REAL COLUMNS
          const checkResult = await storage.query(
            'SELECT business_images, color_palette, font_families, css_content FROM ai_design_patterns WHERE business_type = $1 AND status = $2',
            [businessType, 'active']
          );
          
          if (checkResult.rows.length > 0 && checkResult.rows[0].color_palette) {
            console.log(`✅ Real training completed for ${businessType} - data saved in database`);
            return true;
          }
          
          // Wait 3 seconds before next check
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        console.log(`⏰ Training timeout for ${businessType}, using fallback`);
      } else {
        console.log(`⚠️ Training API failed for ${businessType}, using fallback`);
      }
      
    } catch (fetchError) {
      console.log(`⚠️ Training fetch error for ${businessType}:`, fetchError.message);
    }
    
    // 🔄 FALLBACK: If real training fails, use stock images only
    console.log(`🔄 Using stock images fallback for ${businessType}`);
    const stockImages = await generateUnsplashFallback(businessType, 6);
    
    if (stockImages.length > 0) {
      await saveBusinessImagesPattern(businessType, stockImages, storage);
      console.log(`✅ Fallback training completed for: ${businessType}`);
      return true;
    }
    
    return false;
    
    return false;
    
  } catch (error) {
    console.log('❌ Controlled training error:', error.message);
    return false;
  }
}

// 🕷️ SCRAPING DINAMICO - Solo immagini Unsplash/stock dai competitor
async function scrapeUnsplashFromCompetitors(competitorSites, businessType) {
  try {
    console.log(`🕷️ Scraping Unsplash images from ${competitorSites.length} competitor sites for ${businessType}`);
    
    const unsplashImages = [];
    
    for (const site of competitorSites.slice(0, 3)) { // Max 3 sites per evitare timeout
      try {
        console.log(`🌐 Analyzing: ${site.url}`);
        
        // 🌐 Fetch della homepage del competitor con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
        
        const response = await fetch(site.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.log(`⚠️ ${site.url} returned ${response.status}`);
          continue;
        }
        
        const html = await response.text();
        
        // 🔍 Estrai solo immagini Unsplash/stock
        const stockImages = extractStockImages(html, businessType);
        unsplashImages.push(...stockImages);
        
        console.log(`📊 Found ${stockImages.length} stock images from ${site.url}`);
        
        if (unsplashImages.length >= 8) break; // Limite per business type
        
      } catch (siteError) {
        console.log(`⚠️ Failed to scrape ${site.url}:`, siteError.message);
      }
    }
    
    // 🧹 Deduplication
    const uniqueImages = [...new Set(unsplashImages)];
    console.log(`✅ Extracted ${uniqueImages.length} unique stock images for ${businessType}`);
    
    return uniqueImages.slice(0, 6); // Max 6 immagini per business type
    
  } catch (error) {
    console.log('⚠️ Scraping failed:', error.message);
    return [];
  }
}

// 🔍 ESTRAZIONE SOLO IMMAGINI STOCK/UNSPLASH
function extractStockImages(html, businessType) {
  const stockImages = [];
  
  try {
    // Pattern per identificare immagini stock sicure
    const stockPatterns = [
      /https:\/\/images\.unsplash\.com\/[^"'\s)]+/g,
      /https:\/\/unsplash\.com\/photos\/[^"'\s)]+/g,
      /https:\/\/source\.unsplash\.com\/[^"'\s)]+/g,
      /https:\/\/[^"'\s]*\.unsplash\.com\/[^"'\s)]+/g,
      /https:\/\/images\.pexels\.com\/[^"'\s)]+/g
    ];
    
    for (const pattern of stockPatterns) {
      const matches = html.match(pattern) || [];
      for (const match of matches) {
        // Pulizia URL e aggiunta parametri per dimensioni
        const cleanUrl = match.replace(/['">\s)#].*$/, '');
        const optimizedUrl = optimizeImageUrl(cleanUrl, businessType);
        
        if (optimizedUrl && !stockImages.includes(optimizedUrl)) {
          stockImages.push(optimizedUrl);
        }
      }
    }
    
    console.log(`🔍 Extracted ${stockImages.length} stock image URLs`);
    return stockImages;
    
  } catch (error) {
    console.log('⚠️ Error extracting stock images:', error.message);
    return [];
  }
}

// �️ OTTIMIZZAZIONE URL IMMAGINI
function optimizeImageUrl(url, businessType) {
  try {
    if (url.includes('unsplash.com')) {
      // Ottimizza Unsplash per qualità e dimensioni
      const baseUrl = url.split('?')[0];
      return `${baseUrl}?w=800&h=600&fit=crop&crop=entropy&auto=format&q=80`;
    }
    
    if (url.includes('pexels.com')) {
      // Ottimizza Pexels
      return `${url}?auto=compress&cs=tinysrgb&w=800&h=600`;
    }
    
    return url;
  } catch (error) {
    return url;
  }
}

// 💾 SALVATAGGIO PATTERN NEL DATABASE (Fixed Schema)
async function saveBusinessImagesPattern(businessType, images, storage, designPatterns = null) {
  try {
    const imagePattern = {
      unsplash_gallery: images,
      collection_date: new Date().toISOString(),
      source: 'competitor_analysis',
      count: images.length,
      copyright_status: 'free_to_use',
      business_type: businessType
    };
    
    // 🎨 Generate design patterns if not provided from scraping
    const patternData = designPatterns || {
      colors: {
        primary: getBusinessTypeColor(businessType, 'primary'),
        secondary: getBusinessTypeColor(businessType, 'secondary'), 
        accent: getBusinessTypeColor(businessType, 'accent'),
        background: '#FFFFFF',
        text: '#1F2937'
      },
      fonts: {
        heading: getBusinessTypeFont(businessType, 'heading'),
        body: getBusinessTypeFont(businessType, 'body')
      },
      layout: {
        type: 'modern',
        sections: ['hero', 'about', 'services', 'contact'],
        business_type: businessType
      },
      generated_date: new Date().toISOString(),
      source: designPatterns ? 'scraped' : 'generated'
    };
    
    console.log(`💾 Saving ${images.length} images + design patterns for business type: ${businessType}`);
    
    // 🔧 UPSERT with both business_images AND pattern_data
    const existingCheck = await storage.query(
      'SELECT id FROM ai_design_patterns WHERE business_type = $1',
      [businessType]
    );
    
    if (existingCheck.rows.length > 0) {
      // Update existing record with REAL database columns
      await storage.query(`
        UPDATE ai_design_patterns 
        SET business_images = $1, 
            color_palette = $2, 
            font_families = $3, 
            css_content = $4, 
            design_analysis = $5, 
            updated_at = NOW()
        WHERE business_type = $6
      `, [
        JSON.stringify(imagePattern), 
        JSON.stringify(patternData.colors), 
        JSON.stringify(patternData.fonts), 
        patternData.css || '',
        JSON.stringify(patternData.layout), 
        businessType
      ]);
      console.log(`✅ Updated existing data for business type: ${businessType}`);
    } else {
      // Insert new record with REAL database columns
      await storage.query(`
        INSERT INTO ai_design_patterns (
          business_type, 
          business_images, 
          color_palette, 
          font_families, 
          css_content, 
          design_analysis, 
          status, 
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW())
      `, [
        businessType, 
        JSON.stringify(imagePattern), 
        JSON.stringify(patternData.colors), 
        JSON.stringify(patternData.fonts), 
        patternData.css || '',
        JSON.stringify(patternData.layout)
      ]);
      console.log(`✅ Inserted new data for business type: ${businessType}`);
    }
    
  } catch (error) {
    console.log('⚠️ Failed to save business images pattern:', error.message);
    throw error;
  }
}

// 🆘 FALLBACK UNSPLASH API DIRETTA (Fixed API Key)
async function generateUnsplashFallback(businessType, count = 4) {
  try {
    console.log(`🔗 Using Unsplash API fallback for ${businessType}`);
    
    // 🔑 Fixed API key for testing (replace with environment variable)
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY || 'Client-ID-DEMO-REPLACED-WITH-VALID-KEY';
    
    if (!unsplashKey || unsplashKey === 'Client-ID-DEMO-REPLACED-WITH-VALID-KEY') {
      console.log('⚠️ Unsplash API key not configured, using hardcoded stock');
      return getHardcodedStockImages(businessType, count);
    }
    
    // Query di ricerca per business type
    const searchQuery = getUnsplashQuery(businessType);
    console.log(`🔍 Searching Unsplash for: "${searchQuery}"`);
    
    // Chiama Unsplash API direttamente
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=${count}&orientation=landscape&content_filter=high`, {
      headers: {
        'Authorization': `Client-ID ${unsplashKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const images = data.results.map(photo => ({
        url: photo.urls.regular,
        thumb: photo.urls.small,
        alt: photo.alt_description || `${businessType} image`,
        photographer: photo.user.name,
        source: 'unsplash_api',
        unsplash_id: photo.id
      }));
      
      console.log(`✅ Generated ${images.length} Unsplash images for ${businessType}`);
      return images.map(img => img.url); // Return only URLs for compatibility
    }
    
    console.log(`⚠️ No Unsplash results for "${searchQuery}", using hardcoded stock`);
    return getHardcodedStockImages(businessType, count);
    
  } catch (error) {
    console.log('⚠️ Unsplash API failed:', error.message);
    return getHardcodedStockImages(businessType, count);
  }
}

// 🔍 Query ottimizzate per business type (Improved for florists)
function getUnsplashQuery(businessType) {
  const queries = {
    florist: 'flowers bouquet roses orchid tulips beautiful arrangement colorful',
    dentist: 'dental clinic teeth smile healthcare medical professional',
    restaurant: 'restaurant food dining cuisine chef delicious meal',
    gym: 'fitness gym workout exercise health training sports',
    bakery: 'bakery bread pastry cake dessert artisan fresh',
    technology: 'technology computer office modern business innovation',
    fashion: 'fashion clothing style boutique elegant designer',
    beauty: 'beauty salon spa wellness massage relaxing treatment',
    automotive: 'car automotive garage mechanic repair professional',
    real_estate: 'house property real estate home modern architecture',
    business: 'business office professional modern workplace corporate'
  };
  
  return queries[businessType] || queries.business;
}

// 📦 IMMAGINI STOCK HARDCODED (ultima risorsa)
function getHardcodedStockImages(businessType, count = 4) {
  const STOCK_IMAGES = {
    florist: [
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=600&fit=crop", // Rose rosse fresche
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop", // Bouquet misto elegante
      "https://images.unsplash.com/photo-1487070183336-b863922373d4?w=800&h=600&fit=crop", // Tulipani colorati
      "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800&h=600&fit=crop", // Orchidee esotiche
      "https://images.unsplash.com/photo-1478432432450-5e6d70a0e9ce?w=800&h=600&fit=crop", // Negozio fiori
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop", // Composizione floreale
      "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800&h=600&fit=crop", // Girasoli brillanti
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop"  // Peonie delicate
    ],
    dentist: [
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop"
    ],
    restaurant: [
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop"
    ],
    business: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=600&fit=crop"
    ]
  };
  
  const images = STOCK_IMAGES[businessType] || STOCK_IMAGES.business;
  return images.slice(0, count);
}

// 🤖 Chiama OpenAI per generare competitor automaticamente
async function generateCompetitorSites(businessType) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not configured for competitor generation');
      return [];
    }
    
    const prompt = `Find 5 real competitor websites for a "${businessType}" business in Italy.
    
    Return ONLY a JSON array with this exact format:
    [
      {
        "name": "Nome Azienda",
        "url": "https://example.com",
        "description": "Breve descrizione del business"
      }
    ]
    
    Requirements:
    - Real, existing Italian websites only
    - Include local and national competitors  
    - Websites that likely use Unsplash or stock images
    - No major corporations with strict copyright
    - Focus on small to medium businesses`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.3
    });

    const sites = JSON.parse(completion.choices[0].message.content);
    console.log(`✅ Generated ${sites.length} competitor sites for ${businessType}`);
    return sites;
    
  } catch (error) {
    console.log('⚠️ OpenAI competitor generation failed:', error.message);
    return [];
  }
}

// 🚀 Trigger training usando l'endpoint esistente /api/training/start
async function triggerDynamicTraining(businessType, competitorSites) {
  try {
    console.log(`🚀 Starting dynamic training for ${businessType} with ${competitorSites.length} sites`);
    
    // Costruisce il payload per l'endpoint esistente
    const trainingPayload = {
      businessType: businessType,
      sites: competitorSites.map(site => site.url), // Array di URL come si aspetta l'endpoint
      autoGenerated: true,
      extractOptions: {
        images: true,
        colors: true, 
        layouts: true,
        onlyStockImages: true, // 🔒 SOLO IMMAGINI COPYRIGHT-FREE
        maxSites: 5
      }
    };
    
    // Chiama l'endpoint di training esistente tramite HTTP interno
    const response = await fetch(`http://localhost:${process.env.PORT || 4000}/api/training/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_TRAINER_API_KEY}`,
        'User-Agent': 'AI-Trainer-Internal'
      },
      body: JSON.stringify(trainingPayload)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Training started for ${businessType}:`, result.sessionId || 'no-session-id');
      
      // Attendi il completamento del training
      return await waitForTrainingCompletion(businessType, result.sessionId);
    } else {
      const errorText = await response.text();
      console.log(`❌ Training failed for ${businessType}:`, response.status, errorText);
      return false;
    }
    
  } catch (error) {
    console.log('⚠️ Dynamic training trigger failed:', error.message);
    return false;
  }
}

// ⏰ Attende completamento training e verifica salvataggio nel DB
async function waitForTrainingCompletion(businessType, sessionId, maxWait = 120000) {
  const startTime = Date.now();
  const checkInterval = 15000; // 15 secondi
  
  console.log(`⏰ Waiting for training completion for ${businessType}... (max ${maxWait/1000}s)`);
  
  while (Date.now() - startTime < maxWait) {
    try {
      // Controlla se i dati sono stati salvati nel database
      const storage = new DatabaseStorage();
      const result = await storage.query(
        'SELECT business_images, pattern_data FROM ai_design_patterns WHERE business_type = $1 AND status = $2',
        [businessType, 'active']
      );
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        const images = row.business_images;
        const patterns = row.pattern_data;
        
        // Verifica che abbia dati validi
        if (images && images.gallery && images.gallery.length > 0) {
          console.log(`✅ Training completed successfully for ${businessType}`);
          console.log(`📸 Extracted ${images.gallery.length} copyright-free images`);
          console.log(`🎨 Extracted design patterns:`, patterns ? Object.keys(patterns).length : 0);
          return true;
        }
      }
      
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`⏰ Still training ${businessType}... (${elapsed}s elapsed)`);
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      
    } catch (error) {
      console.log('⚠️ Error checking training progress:', error.message);
    }
  }
  
  console.log(`⚠️ Training timeout for ${businessType} after ${maxWait/1000}s`);
  return false;
}

// 🎨 Genera immagini stock sicure per settore specifico
async function generateStockImagesForBusiness(businessType) {
  // 🔍 Mapping intelligente settore → parole chiave Unsplash
  const sectorKeywords = {
    restaurant: ['restaurant', 'food', 'dining', 'chef'],
    ecommerce: ['shopping', 'products', 'retail', 'store'],
    technology: ['technology', 'computer', 'office', 'innovation'],
    fashion: ['fashion', 'clothing', 'style', 'boutique'],
    dentist: ['dental', 'medical', 'healthcare', 'clinic'],
    gym: ['fitness', 'workout', 'gym', 'health'],
    bakery: ['bakery', 'bread', 'pastry', 'oven'],
    lawyer: ['law', 'justice', 'legal', 'office'],
    beauty: ['beauty', 'salon', 'spa', 'wellness'],
    automotive: ['car', 'automotive', 'garage', 'repair'],
    real_estate: ['house', 'property', 'real-estate', 'home'],
    photography: ['camera', 'photography', 'studio', 'portrait'],
    consulting: ['business', 'meeting', 'consulting', 'office'],
    education: ['education', 'school', 'learning', 'classroom'],
    default: ['business', 'professional', 'modern', 'clean']
  };
  
  const keywords = sectorKeywords[businessType] || sectorKeywords.default;
  
  // ✅ Generate Unsplash URLs (copyright-free)
  const businessImages = {
    hero: `https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=1200&h=600&fit=crop&crop=center&q=${keywords[0]}`,
    logo: `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=100&fit=crop&crop=center&q=${keywords[1]}`,
    gallery: keywords.map((keyword, index) => 
      `https://images.unsplash.com/photo-${getUnsplashPhotoId(keyword, index)}?w=800&h=600&fit=crop&crop=center`
    )
  };
  
  return businessImages;
}

// 🎯 Mappa settori specifici a foto Unsplash verificate
function getUnsplashPhotoId(keyword, index) {
  const stockPhotos = {
    restaurant: ['1517248135467-4c7edcad34c4', '1565299624946-b28f40a0ca4b', '1546069901-ba9599a7e63c', '1414235077428-338989a2e8c0'],
    food: ['1546069901-ba9599a7e63c', '1565299624946-b28f40a0ca4b', '1504674900247-0877df9cc836', '1559339352-11d035aa65de'],
    technology: ['1460925895917-afdab827c52f', '1552581234-26160f608093', '1518709268805-4e9042af2176', '1504384308090-c894fdcc538d'],
    shopping: ['1441986300917-64674bd600d8', '1472851294608-062f824d29cc', '1441984904996-e0b6ba687e04', '1556742049-0cfed4f6a45d'],
    medical: ['1559757148-5c350d0d3c56', '1576091160399-112ba8d25d1f', '1582750433449-648ed127bb54', '1559757175-5c350d0d3c56'],
    fitness: ['1571019613454-1cb2f99b2d8b', '1534438327276-14e5300c3a48', '1571019614242-c5c5dee9f50b', '1544367567-0f2fcb009e0b'],
    business: ['1497032628192-86f99bcd76bc', '1552581234-26160f608093', '1507003211169-0a1dd7228f2d', '1554224155-6726b3ff858f'],
    default: ['1497032628192-86f99bcd76bc', '1552581234-26160f608093', '1507003211169-0a1dd7228f2d', '1554224155-6726b3ff858f']
  };
  
  const photos = stockPhotos[keyword] || stockPhotos.default;
  return photos[index % photos.length];
}

// 💾 Salva immagini nel database
async function saveBusinessImages(businessType, businessImages) {
  try {
    const storage = new DatabaseStorage();
    await storage.initialize(); // ✅ INIZIALIZZA IL DATABASE
    
    console.log(`💾 Saving business images for: ${businessType}`);
    
    await storage.query(`
      INSERT INTO ai_design_patterns (business_type, pattern_data, business_images, confidence_score, source)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (business_type) 
      DO UPDATE SET 
        business_images = $3,
        confidence_score = $4,
        updated_at = CURRENT_TIMESTAMP
    `, [
      businessType,
      {}, // pattern_data placeholder
      businessImages,
      85, // confidence score for stock images
      'ai-stock-generated'
    ]);
    
    console.log(`✅ Saved stock images for business type: ${businessType}`);
  } catch (error) {
    console.log('⚠️ Failed to save business images:', error.message);
  }
}

// 🔄 MAPPING BUSINESS TYPES (Italiano → Inglese per training data)
const BUSINESS_TYPE_MAPPING = {
  'alimentare': ['restaurant', 'food', 'catering', 'cafe'],
  'restaurant': ['restaurant', 'food', 'catering'],
  'ristorante': ['restaurant', 'food', 'catering'],
  'cibo': ['restaurant', 'food', 'catering'],
  'tecnologia': ['technology', 'tech', 'software', 'startup'],
  'moda': ['fashion', 'clothing', 'style'],
  'ecommerce': ['ecommerce', 'shop', 'store'],
  'portfolio': ['portfolio', 'personal', 'freelance'],
  'azienda': ['business', 'corporate', 'company'],
  'servizi': ['services', 'consulting', 'professional']
};

// Middleware per autenticazione API
const authenticateAPI = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.AI_TRAINER_API_KEY;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Missing or invalid authorization header'
    });
  }
  
  const token = authHeader.substring(7);
  if (!expectedKey || token !== expectedKey) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key'
    });
  }
  
  next();
};

// 🧠 POST /api/generate/layout - Enhanced with Design Intelligence
router.post('/layout', authenticateAPI, async (req, res) => {
  try {
    console.log('🧠 AI-Enhanced Layout Generation:', {
      businessType: req.body.businessType,
      blocksCount: req.body.currentBlocks?.length || 0,
      timestamp: new Date().toISOString()
    });

    const { businessType, businessName, businessDescription, style = 'modern', currentBlocks = [] } = req.body;
    
    console.log(`📥 RECEIVED REQUEST: businessType="${businessType}", businessName="${businessName}", businessDescription="${businessDescription}"`);
    
    if (!businessName) {
      return res.status(400).json({
        success: false,
        error: 'Business name is required'
      });
    }

    // 🤖 Try to generate content with OpenAI first  
    console.log('🤖 Attempting AI content generation...');
    const aiContent = await generateBusinessContentWithAI(businessName, businessName);
    
    // 🖼️ Generate gallery images with DYNAMIC SYSTEM - OpenAI identification + competitor discovery
    const galleryImages = await getBusinessImagesFromDB(businessName, businessDescription || businessName, 6);
    
    // 🔍 Get the identified business type for other operations
    const detectedBusinessType = await identifyBusinessType(businessName, businessDescription || businessName) || 'business';
    console.log(`🎯 Using detected business type for design operations: ${detectedBusinessType}`);
    
    // 🎨 Initialize Design Intelligence
    const designIntelligence = new DesignIntelligence();
    let designData;
    
    try {
      designData = await designIntelligence.generateCompleteDesignRecommendation(detectedBusinessType, { style });
      console.log('✅ Design Intelligence generated:', {
        colors: designData.design?.colors,
        typography: designData.design?.typography?.primary,
        confidence: designData.confidence
      });
    } catch (designError) {
      console.log('⚠️ Design Intelligence fallback:', designError.message);
      designData = {
        design: {
          colors: { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B' },
          typography: { primary: 'Inter', secondary: 'system-ui' }
        },
        confidence: 70
      };
    }
    
    console.log(`🔄 Dynamic business type detection: "${businessName}" → "${detectedBusinessType}"`);

    // Verifica disponibilità database prima di procedere
    const designAI = new DesignIntelligence();
    
    try {
      // Test rapido per verificare se il database ai_design_patterns esiste
      await designAI.pool.query('SELECT 1 FROM ai_design_patterns LIMIT 1');
    } catch (dbError) {
      console.log(`❌ Database ai_design_patterns not available: ${dbError.message}`);
      await designAI.close();
      
      // Restituisci modalità manutenzione quando il database non è disponibile
      return res.status(503).json({
        success: false,
        error: 'Service temporarily unavailable - database maintenance in progress',
        isFallback: true,
        redirect: '/maintenance'
      });
    }

    // Utilizza Design Intelligence per generare design ottimizzato
    const designRecommendation = await designAI.generateCompleteDesignRecommendation(detectedBusinessType, {
      style,
      contentType: 'layout',
      tone: 'professional'
    });
    
    const layoutSuggestions = await designAI.generateLayoutSuggestions(detectedBusinessType, 'layout');
    await designAI.close();

    // Genera blocchi semantici ottimizzati con contenuto AI
    const semanticBlocks = generateEnhancedBlocks(
      detectedBusinessType, 
      businessName, 
      designRecommendation.design,
      currentBlocks,
      aiContent,
      galleryImages
    );
    
    const response = {
      success: true,
      source: 'ai-design-intelligence',
      layoutData: {
        blocks: semanticBlocks,
        design: designRecommendation.design,
        layout: layoutSuggestions,
        // 🎨 NEW: Include complete CSS for injection
        css: designRecommendation.design.css ? {
          variables: designRecommendation.design.css.rootVariables,
          typography: designRecommendation.design.css.typography,
          components: designRecommendation.design.css.components,
          utilities: designRecommendation.design.css.utilities,
          combined: [
            designRecommendation.design.css.rootVariables,
            designRecommendation.design.css.typography,
            designRecommendation.design.css.components,
            designRecommendation.design.css.utilities
          ].join('\n\n')
        } : null,
        metadata: {
          businessType: detectedBusinessType,
          originalBusinessName: businessName,
          style,
          confidence: designRecommendation.confidence,
          generatedAt: new Date().toISOString(),
          aiEnhanced: true
        }
      },
      businessType: detectedBusinessType,
      semanticScore: calculateSemanticScore(semanticBlocks, detectedBusinessType),
      suggestedBlocks: semanticBlocks.map(block => block.type),
      designConfidence: designRecommendation.confidence
    };
    
    console.log(`✅ AI-enhanced layout generated with ${designRecommendation.confidence}% confidence`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error generating layout:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      fallback: generateFallbackLayout()
    });
  }
});

// POST /api/generate/template
router.post('/template', async (req, res) => {
  try {
    console.log('🎯 Creative template generation request:', req.body);
    
    const { businessData, inspirationDataset, creativityLevel } = req.body;
    
    // Mock creative template response
    const mockTemplate = {
      success: true,
      template: {
        name: `${businessData?.businessType || 'Custom'} Creative Pro`,
        layout: ['navigation-modern', 'hero-animated', 'features-grid', 'testimonials-video', 'cta-prominent'],
        colorPalette: ['#667EEA', '#764BA2', '#F093FB', '#F5F7FA'],
        typography: {
          primary: 'Inter',
          secondary: 'JetBrains Mono'
        },
        customBlocks: [
          'interactive-demo',
          'pricing-calculator',
          'feature-comparison'
        ]
      },
      creativityScore: 89,
      businessAlignment: 92,
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTime: 250
      }
    };
    
    res.json(mockTemplate);
    
  } catch (error) {
    console.error('❌ Template generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Template generation failed',
      details: error.message
    });
  }
});

// 🔄 Fallback per quando non ci sono dati di training
function generateFallbackLayout(businessType) {
  console.log(`🔄 Using fallback layout for ${businessType}`);
  
  const fallbackLayouts = {
    restaurant: [
      'navigation-elegant',
      'hero-restaurant', 
      'menu-showcase',
      'about-story',
      'gallery-food',
      'reviews-customers',
      'contact-reservation',
      'footer-social'
    ],
    ecommerce: [
      'navigation-shop',
      'hero-product',
      'categories-grid',
      'featured-products',
      'testimonials-customers',
      'newsletter-signup',
      'footer-ecommerce'
    ],
    technology: [
      'navigation-tech',
      'hero-tech',
      'features-tech',
      'case-studies',
      'pricing-plans',
      'contact-tech',
      'footer-tech'
    ],
    default: [
      'navigation-standard',
      'hero-default',
      'features-grid',
      'about-section',
      'contact-form',
      'footer-standard'
    ]
  };
  
  return {
    blocks: fallbackLayouts[businessType] || fallbackLayouts.default,
    confidence: 75,
    trainingData: {
      sessionsAnalyzed: 0,
      samplesAnalyzed: 0,
      sitesAnalyzed: 0,
      patternsFound: ['fallback-mode']
    }
  };
}

/**
 * Genera blocchi migliorati utilizzando i pattern di design estratti
 */
function generateEnhancedBlocks(businessType, businessName, designData, currentBlocks = [], aiContent = null, galleryImages = []) {
  console.log(`🧠 Generating enhanced blocks for ${businessType} with AI design data${aiContent ? ' and AI content' : ''}`);
  
  // 🎨 ENHANCED: Working image service function
  const getWorkingImage = (type, businessType) => {
    const businessImages = {
      restaurant: {
        logo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=100&fit=crop&crop=center',
        hero: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=600&fit=crop&crop=center'
      },
      ecommerce: {
        logo: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=100&fit=crop&crop=center',
        hero: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop&crop=center'
      },
      technology: {
        logo: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=100&fit=crop&crop=center',
        hero: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop&crop=center'
      },
      default: {
        logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=100&fit=crop&crop=center',
        hero: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=1200&h=600&fit=crop&crop=center'
      }
    };
    
    const images = businessImages[businessType] || businessImages.default;
    return images[type] || images.hero;
  };

  // 🎨 NEW: Generate complete CSS styles for each block based on design intelligence
  const generateBlockStyles = (blockType, designData) => {
    const colors = designData?.colors || {};
    const typography = designData?.typography || {};
    const css = designData?.css || {};
    
    const baseStyles = {
      backgroundColor: colors.background || '#FFFFFF',
      color: colors.text || '#1F2937',
      fontFamily: typography.primary || 'Inter, sans-serif',
      fontSize: '16px',
      lineHeight: '1.6'
    };

    // Block-specific style overrides
    const blockSpecificStyles = {
      'navigation-modern': {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${colors.accent || '#E5E7EB'}`,
        padding: '1rem 0',
        position: 'sticky',
        top: '0',
        zIndex: '1000'
      },
      'hero-restaurant-showcase': {
        background: colors.primary ? 
          `linear-gradient(135deg, ${colors.primary}, ${colors.secondary || colors.primary})` :
          'linear-gradient(135deg, #D97706, #DC2626)',
        color: '#FFFFFF',
        padding: '5rem 2rem',
        textAlign: 'center',
        borderRadius: '12px',
        marginBottom: '2rem'
      },
      'menu-showcase': {
        backgroundColor: colors.background || '#FFFFFF',
        border: `1px solid ${colors.accent || '#E5E7EB'}`,
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      },
      'gallery-food': {
        backgroundColor: colors.background || '#FFFFFF',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      },
      'reviews-customers': {
        backgroundColor: colors.background || '#F9FAFB',
        border: `1px solid ${colors.accent || '#E5E7EB'}`,
        borderRadius: '12px',
        padding: '2rem'
      }
    };

    return {
      ...baseStyles,
      ...(blockSpecificStyles[blockType] || {}),
      // Add CSS custom properties for dynamic styling
      '--primary-color': colors.primary || '#3B82F6',
      '--secondary-color': colors.secondary || '#8B5CF6',
      '--accent-color': colors.accent || '#F59E0B',
      '--font-primary': typography.primary || 'Inter',
      '--font-secondary': typography.secondary || 'system-ui'
    };
  };
  
  const blocks = [];
  
  // 1. Navigation (sempre ottimizzata con design patterns e logo)
  blocks.push({
    id: `nav-${Date.now()}`,
    type: 'navigation-modern',
    content: {
      title: businessName,
      logo: getWorkingImage('logo', businessType),
      menuItems: ['Home', 'Servizi', 'Chi Siamo', 'Contatti']
    },
    style: generateBlockStyles('navigation-modern', designData),
    cssClass: 'ai-navigation-modern',
    aiEnhanced: true,
    confidence: 95
  });
  
  // 2. Hero Section (personalizzata per business type con immagine e contenuto AI)
  const heroContent = aiContent?.hero ? {
    title: aiContent.hero.title || `Benvenuto in ${businessName}`,
    subtitle: aiContent.hero.subtitle || getBusinessSubtitle(businessType, businessName),
    description: aiContent.hero.description || getBusinessDescription(businessType),
    image: getWorkingImage('hero', businessType),
    cta: aiContent.hero.cta || getBusinessCTA(businessType)
  } : {
    title: `Benvenuto in ${businessName}`,
    subtitle: getBusinessSubtitle(businessType, businessName),
    description: getBusinessDescription(businessType),
    image: getWorkingImage('hero', businessType),
    cta: getBusinessCTA(businessType)
  };

  blocks.push({
    id: `hero-${Date.now()}`,
    type: getOptimalHeroType(businessType),
    content: heroContent,
    style: generateBlockStyles('hero-restaurant-showcase', designData),
    cssClass: 'ai-hero-section',
    aiEnhanced: true,
    confidence: 90
  });
  
  // 3. Content blocks basati sui pattern estratti con stili AI e contenuto personalizzato
  const contentBlocks = generateBusinessSpecificBlocks(businessType, businessName, designData, aiContent, galleryImages);
  
  // Apply AI styles to content blocks
  const styledContentBlocks = contentBlocks.map(block => ({
    ...block,
    style: generateBlockStyles(block.type, designData),
    cssClass: `ai-${block.type.replace('-', '_')}`,
    aiEnhanced: true
  }));
  
  blocks.push(...styledContentBlocks);
  
  return blocks;
}

// 🎯 Helper functions for business-specific content
function getBusinessSubtitle(businessType, businessName) {
  const subtitles = {
    restaurant: `Sapori autentici e tradizione culinaria`,
    ecommerce: `La tua destinazione per lo shopping online`,
    technology: `Innovazione e soluzioni tecnologiche avanzate`,
    default: `Qualità e professionalità al tuo servizio`
  };
  return subtitles[businessType] || subtitles.default;
}

function getBusinessDescription(businessType) {
  const descriptions = {
    restaurant: 'Vieni a scoprire la nostra cucina, dove tradizione e innovazione si incontrano per offrirti un\'esperienza gastronomica indimenticabile.',
    ecommerce: 'Scopri la nostra vasta selezione di prodotti di alta qualità, con spedizioni rapide e un servizio clienti sempre a tua disposizione.',
    technology: 'Trasformiamo le tue idee in soluzioni digitali innovative, utilizzando le tecnologie più avanzate per far crescere il tuo business.',
    default: 'Siamo qui per offrirti il meglio dei nostri servizi, con professionalità e dedizione per soddisfare ogni tua esigenza.'
  };
  return descriptions[businessType] || descriptions.default;
}

function getBusinessCTA(businessType) {
  const ctas = {
    restaurant: 'Prenota un Tavolo',
    ecommerce: 'Inizia a Comprare',
    technology: 'Richiedi Preventivo',
    default: 'Scopri di Più'
  };
  return ctas[businessType] || ctas.default;
}

function getOptimalHeroType(businessType) {
  const heroTypes = {
    restaurant: 'hero-restaurant-showcase',
    ecommerce: 'hero-product-featured',
    technology: 'hero-tech-innovation',
    portfolio: 'hero-creative-showcase',
    default: 'hero-modern-clean'
  };
  return heroTypes[businessType] || heroTypes.default;
}

function generateBusinessSpecificBlocks(businessType, businessName, designData, aiContent = null, galleryImages = []) {
  // 🎨 ENHANCED: Generate structured content with working images and AI content
  const getWorkingImage = (type) => {
    const imageServices = {
      'menu-showcase': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&crop=center',
      'gallery-food': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop&crop=center',
      'reviews-customers': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      'featured-products': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop&crop=center',
      'categories-grid': 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=400&fit=crop&crop=center',
      'testimonials-social': 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
      'features-tech': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&crop=center',
      'case-studies': 'https://images.unsplash.com/photo-1552581234-26160f608093?w=800&h=600&fit=crop&crop=center',
      'pricing-plans': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop&crop=center'
    };
    return imageServices[type] || 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=800&h=600&fit=crop&crop=center';
  };

  // 🤖 Use AI content if available, otherwise fallback to static content
  const getContentWithAI = (blockType, fallbackContent) => {
    if (!aiContent) return fallbackContent;
    
    // Map AI content to specific blocks
    switch (blockType) {
      case 'menu-showcase':
        return {
          ...fallbackContent,
          title: aiContent.menu?.title || fallbackContent.title,
          subtitle: aiContent.menu?.subtitle || fallbackContent.subtitle,
          description: aiContent.menu?.description || fallbackContent.description,
          items: aiContent.menu?.items || []
        };
      case 'gallery-food':
      case 'gallery-tech':
      case 'gallery-products':
        return {
          ...fallbackContent,
          title: aiContent.gallery?.title || fallbackContent.title,
          subtitle: aiContent.gallery?.subtitle || fallbackContent.subtitle,
          description: aiContent.gallery?.description || fallbackContent.description,
          images: galleryImages.slice(0, 4),
          galleryItems: aiContent.gallery?.items || []
        };
      case 'reviews-customers':
      case 'testimonials-social':
        return {
          ...fallbackContent,
          title: aiContent.reviews?.title || fallbackContent.title,
          subtitle: aiContent.reviews?.subtitle || fallbackContent.subtitle,
          description: aiContent.reviews?.description || fallbackContent.description,
          testimonials: aiContent.reviews?.testimonials || []
        };
      default:
        return fallbackContent;
    }
  };

  const businessBlocks = {
    restaurant: [
      {
        type: 'menu-showcase',
        content: getContentWithAI('menu-showcase', {
          title: `Menu ${businessName}`,
          subtitle: 'I nostri piatti più amati dai clienti',
          description: 'Scopri la nostra selezione di specialità culinarie preparate con ingredienti freschi e di alta qualità.',
          image: getWorkingImage('menu-showcase'),
          cta: 'Guarda il Menu'
        }),
        priority: 1
      },
      {
        type: 'gallery-food',
        content: getContentWithAI('gallery-food', {
          title: 'Galleria Gastronomica',
          subtitle: 'Un viaggio visivo nei nostri sapori',
          description: 'Ogni piatto è una piccola opera d\'arte culinaria.',
          image: getWorkingImage('gallery-food'),
          images: galleryImages.slice(0, 4),
          cta: 'Vedi Tutte le Foto'
        }),
        priority: 2
      },
      {
        type: 'reviews-customers',
        content: getContentWithAI('reviews-customers', {
          title: 'Testimonianze',
          subtitle: 'Cosa dicono i nostri clienti',
          description: 'La soddisfazione dei nostri ospiti è la nostra priorità.',
          image: getWorkingImage('reviews-customers'),
          cta: 'Leggi Tutte le Recensioni'
        }),
        priority: 3
      }
    ],
    ecommerce: [
      {
        type: 'featured-products',
        content: getContentWithAI('featured-products', {
          title: `Prodotti in Evidenza - ${businessName}`,
          subtitle: 'I più venduti del mese',
          description: 'Scopri i prodotti che stanno conquistando i nostri clienti.',
          image: getWorkingImage('featured-products'),
          cta: 'Acquista Ora'
        }),
        priority: 1
      },
      {
        type: 'gallery-products',
        content: getContentWithAI('gallery-products', {
          title: 'Galleria Prodotti',
          subtitle: 'La nostra collezione',
          description: 'Esplora la varietà dei nostri prodotti di alta qualità.',
          image: getWorkingImage('categories-grid'),
          images: galleryImages.slice(0, 4),
          cta: 'Esplora Categorie'
        }),
        priority: 2
      },
      {
        type: 'testimonials-social',
        content: getContentWithAI('testimonials-social', {
          title: 'Recensioni Clienti',
          subtitle: 'Fiducia e qualità garantita',
          description: 'Migliaia di clienti soddisfatti che ci hanno scelto.',
          image: getWorkingImage('testimonials-social'),
          cta: 'Leggi le Recensioni'
        }),
        priority: 3
      }
    ],
    technology: [
      {
        type: 'features-tech',
        content: getContentWithAI('features-tech', {
          title: `Funzionalità ${businessName}`,
          subtitle: 'Tecnologia all\'avanguardia',
          description: 'Scopri le caratteristiche innovative che rendono unica la nostra soluzione.',
          image: getWorkingImage('features-tech'),
          cta: 'Scopri di Più'
        }),
        priority: 1
      },
      {
        type: 'gallery-tech',
        content: getContentWithAI('gallery-tech', {
          title: 'Progetti e Innovazioni',
          subtitle: 'Le nostre realizzazioni',
          description: 'Esplora i progetti che abbiamo sviluppato per i nostri clienti.',
          image: getWorkingImage('case-studies'),
          images: galleryImages.slice(0, 4),
          cta: 'Vedi Tutti i Progetti'
        }),
        priority: 2
      },
      {
        type: 'case-studies',
        content: getContentWithAI('case-studies', {
          title: 'Casi di Successo',
          subtitle: 'Risultati che parlano da soli',
          description: 'Scopri come abbiamo aiutato i nostri clienti a raggiungere i loro obiettivi.',
          image: getWorkingImage('case-studies'),
          cta: 'Leggi i Casi Studio'
        }),
        priority: 3
      }
    ]
  };
  
  const blocks = businessBlocks[businessType] || businessBlocks.technology;
  
  return blocks.map((block, index) => ({
    id: `${block.type}-${Date.now()}-${index}`,
    type: block.type,
    content: block.content,
    // Style will be applied by generateBlockStyles in the calling function
    aiEnhanced: true,
    confidence: Math.max(85 - (block.priority * 5), 70),
    priority: block.priority
  }));
}

function calculateSemanticScore(blocks, businessType) {
  if (!blocks || blocks.length === 0) return 50;
  
  const businessRelevantTypes = {
    restaurant: ['menu', 'food', 'gallery', 'reviews', 'reservation'],
    ecommerce: ['product', 'shop', 'cart', 'testimonials', 'categories'],
    technology: ['features', 'tech', 'case-studies', 'pricing', 'demo']
  };
  
  const relevantTypes = businessRelevantTypes[businessType] || businessRelevantTypes.technology;
  
  const relevantBlocks = blocks.filter(block => 
    relevantTypes.some(type => block.type?.includes(type))
  );
  
  const baseScore = Math.min((relevantBlocks.length / blocks.length) * 100, 95);
  const aiBonus = blocks.some(block => block.aiEnhanced) ? 10 : 0;
  
  return Math.round(Math.min(baseScore + aiBonus, 99));
}

// 🎨 Business type specific colors
function getBusinessTypeColor(businessType, colorType) {
  const businessColors = {
    florist: {
      primary: '#E91E63', // Pink
      secondary: '#4CAF50', // Green
      accent: '#FFC107' // Amber
    },
    restaurant: {
      primary: '#FF5722', // Red-Orange
      secondary: '#795548', // Brown
      accent: '#FFC107' // Amber
    },
    dentist: {
      primary: '#2196F3', // Blue
      secondary: '#00BCD4', // Cyan
      accent: '#4CAF50' // Green
    },
    gym: {
      primary: '#FF5722', // Red
      secondary: '#9E9E9E', // Grey
      accent: '#FF9800' // Orange
    },
    bakery: {
      primary: '#FF9800', // Orange
      secondary: '#795548', // Brown
      accent: '#FFEB3B' // Yellow
    },
    default: {
      primary: '#3B82F6',
      secondary: '#1E40AF',
      accent: '#F59E0B'
    }
  };
  
  const colors = businessColors[businessType] || businessColors.default;
  return colors[colorType] || colors.primary;
}

// 📝 Business type specific fonts
function getBusinessTypeFont(businessType, fontType) {
  const businessFonts = {
    florist: {
      heading: 'Dancing Script',
      body: 'Open Sans'
    },
    restaurant: {
      heading: 'Playfair Display',
      body: 'Source Sans Pro'
    },
    dentist: {
      heading: 'Roboto',
      body: 'Roboto'
    },
    gym: {
      heading: 'Oswald',
      body: 'Roboto'
    },
    bakery: {
      heading: 'Fredoka One',
      body: 'Nunito'
    },
    default: {
      heading: 'Inter',
      body: 'Inter'
    }
  };
  
  const fonts = businessFonts[businessType] || businessFonts.default;
  return fonts[fontType] || fonts.heading;
}

module.exports = router;

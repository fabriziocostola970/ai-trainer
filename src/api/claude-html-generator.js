const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const UnifiedImageService = require('../services/unified-image-service.js');
const ImageDownloadService = require('../services/image-download-service.js');
const { Pool } = require('pg');

// CLAUDE SONNET 4 - GENERAZIONE HTML DIRETTA (FIXED AUTH)
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// 🗄️ DATABASE CONNECTION
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * 🎨 NAVBAR TEMPLATE STATICA - Design Perfetto e Responsive (HOMEPAGE)
 * Navbar moderna con menu hamburger funzionante e link dinamici
 */
function generateStaticNavbar(businessName, menuItems = []) {
  console.log(`🎨 [STATIC-NAVBAR-HP] Generazione navbar per: ${businessName} con ${menuItems.length} menu items`);
  
  // ✅ DEFAULT: Solo HOME (altri link solo se esistono nel DB)
  const defaultMenuItems = [
    { name: 'Home', href: '/', isHomepage: true }
  ];
  
  // Se abbiamo menu items dal DB, aggiungiamo alla HOME
  let finalMenuItems = [...defaultMenuItems];
  
  if (menuItems.length > 0) {
    // Aggiungi solo le pagine attive, ordinate per pageOrder
    const activePages = menuItems
      .filter(item => item.isActive && !item.isHomepage) // Escludi homepage (già presente)
      .sort((a, b) => (a.pageOrder || 0) - (b.pageOrder || 0))
      .map(item => ({
        name: item.name,
        href: `/${item.slug}`,
        pageType: item.pageType
      }));
    
    finalMenuItems = [...finalMenuItems, ...activePages];
    console.log(`✅ [NAVBAR-DB] Aggiunte ${activePages.length} pagine dal database`);
  } else {
    console.log(`⚠️ [NAVBAR-DB] Nessuna pagina nel database, usando solo HOME`);
  }
  
  return `
  <!-- 🎨 NAVBAR STATICA PERFETTA - Responsive & Accessibile -->
  <nav class="bg-white shadow-lg fixed w-full z-50 top-0 border-b border-gray-200" role="navigation" aria-label="Main navigation">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        
        <!-- 🏢 LOGO/BRAND -->
        <div class="flex items-center flex-shrink-0">
          <div class="flex items-center">
            <div class="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
              ${businessName}
            </div>
          </div>
        </div>
        
        <!-- 💻 DESKTOP MENU (Hidden on mobile) -->
        <div class="hidden md:flex md:items-center md:space-x-1">
          ${finalMenuItems.map(item => `
            <a href="${item.href}" 
               class="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-105"
               ${item.isHomepage ? 'aria-current="page"' : ''}>
              ${item.name}
            </a>
          `).join('')}
        </div>
        
        <!-- 📱 MOBILE HAMBURGER BUTTON (Hidden on desktop) -->
        <div class="block md:hidden">
          <button id="hamburger-btn" 
                  type="button" 
                  class="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  aria-controls="mobile-menu" 
                  aria-expanded="false"
                  aria-label="Toggle main menu"
                  style="display: block !important;">
          <style>
            @media (min-width: 768px) {
              #hamburger-btn { display: none !important; }
              .hamburger-container { display: none !important; }
            }
          </style>
            <!-- Hamburger Icon -->
            <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 📱 MOBILE MENU (Hidden by default, shown via JS) -->
    <div id="mobileMenu" 
         class="hidden md:hidden bg-white border-t border-gray-200 shadow-lg"
         style="display: none !important;"
         role="menu" 
         aria-orientation="vertical" 
         aria-labelledby="hamburger-btn">
      <style>
        @media (min-width: 768px) {
          #mobileMenu { display: none !important; }
        }
        @media (max-width: 767px) {
          #mobileMenu.show { display: block !important; }
        }
      </style>
      <div class="px-2 pt-2 pb-3 space-y-1">
        ${finalMenuItems.map(item => `
          <a href="${item.href}" 
             class="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-all duration-200 ease-in-out transform hover:translate-x-1"
             role="menuitem"
             ${item.isHomepage ? 'aria-current="page"' : ''}>
            ${item.name}
          </a>
        `).join('')}
      </div>
    </div>
  </nav>
  
  <!-- 📏 SPACER per compensare navbar fixed -->
  <div class="h-16" aria-hidden="true"></div>
  
  <!-- 🎯 JAVASCRIPT HAMBURGER MENU - Sempre Funzionante -->
  <script>
    // Funzione toggle menu mobile con controlli aggiuntivi
    function toggleMobileMenu() {
      const menu = document.getElementById('mobileMenu');
      const button = document.getElementById('hamburger-btn');
      
      if (menu && button) {
        const isHidden = menu.style.display === 'none' || menu.classList.contains('hidden');
        
        if (isHidden) {
          menu.style.display = 'block';
          menu.classList.remove('hidden');
          menu.classList.add('show');
          button.setAttribute('aria-expanded', 'true');
          console.log('✅ [NAVBAR] Mobile menu opened');
        } else {
          menu.style.display = 'none';
          menu.classList.add('hidden');
          menu.classList.remove('show');
          button.setAttribute('aria-expanded', 'false');
          console.log('✅ [NAVBAR] Mobile menu closed');
        }
      }
    }
    
    // Nasconde hamburger su desktop e assicura menu corretto
    function checkScreenSize() {
      const hamburgerBtn = document.getElementById('hamburger-btn');
      const mobileMenu = document.getElementById('mobileMenu');
      const desktopMenu = document.querySelector('.hidden.md\\:flex');
      
      if (window.innerWidth >= 768) {
        // Desktop: nascondi hamburger e mobile menu
        if (hamburgerBtn) hamburgerBtn.style.display = 'none';
        if (mobileMenu) {
          mobileMenu.style.display = 'none';
          mobileMenu.classList.add('hidden');
        }
        if (desktopMenu) desktopMenu.style.display = 'flex';
        console.log('🖥️ [NAVBAR] Desktop mode activated');
      } else {
        // Mobile: mostra hamburger, nascondi desktop menu
        if (hamburgerBtn) hamburgerBtn.style.display = 'block';
        if (mobileMenu) mobileMenu.style.display = 'none';
        if (desktopMenu) desktopMenu.style.display = 'none';
        console.log('📱 [NAVBAR] Mobile mode activated');
      }
    }
    
    // Auto-attach event listener quando DOM è pronto
    document.addEventListener('DOMContentLoaded', function() {
      const hamburgerBtn = document.getElementById('hamburger-btn');
      if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleMobileMenu);
        console.log('✅ [NAVBAR] Static navbar initialized successfully');
      } else {
        console.warn('⚠️ [NAVBAR] Hamburger button not found');
      }
      
      // Controlla dimensioni schermo al caricamento
      checkScreenSize();
      
      // Controlla al resize
      window.addEventListener('resize', checkScreenSize);
      
      // Chiudi menu mobile quando si clicca fuori
      document.addEventListener('click', function(event) {
        const menu = document.getElementById('mobileMenu');
        const button = document.getElementById('hamburger-btn');
        
        if (menu && !menu.classList.contains('hidden') && 
            !menu.contains(event.target) && 
            !button.contains(event.target)) {
          menu.style.display = 'none';
          menu.classList.add('hidden');
          button.setAttribute('aria-expanded', 'false');
        }
      });
    });
  </script>`;
}

/**
 * 🚀 NAVBAR WITH DATABASE INTEGRATION (HOMEPAGE)
 * Genera navbar statica popolata con dati dinamici dal database
 */
async function generateNavbarWithDatabase(websiteId, businessName) {
  try {
    console.log('🔧 [NAVBAR-DEBUG] INIZIO funzione con parametri:');
    console.log('🔧 [NAVBAR-DEBUG] websiteId:', websiteId);
    console.log('🔧 [NAVBAR-DEBUG] businessName:', businessName);
    console.log('🔧 [NAVBAR-DEBUG] websiteId tipo:', typeof websiteId);
    
    let menuItems = [];
    
    // Se abbiamo websiteId, prova a recuperare dal database
    if (websiteId) {
      console.log('✅ [NAVBAR-DEBUG] WebsiteId presente, eseguo query API...');
      const vendionlineUrl = process.env.VENDIONLINE_API_URL || 'http://localhost:3001';
      console.log('🔧 [NAVBAR-DEBUG] URL API:', vendionlineUrl);
      console.log('🔧 [NAVBAR-DEBUG] Costruisco URL completo...');
      
      const fullUrl = `${vendionlineUrl}/api/website/menu-items?websiteId=${websiteId}`;
      console.log('🔧 [NAVBAR-DEBUG] URL finale:', fullUrl);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-AI-Trainer-Key': process.env.AI_TRAINER_API_KEY || '',
        }
      });

      console.log('🔧 [NAVBAR-DEBUG] Response status:', response.status);
      console.log('🔧 [NAVBAR-DEBUG] Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('🔧 [NAVBAR-DEBUG] Response data:', JSON.stringify(data, null, 2));
        if (data.success && data.menuItems) {
          menuItems = data.menuItems;
          console.log(`✅ [NAVBAR-DB-HP] Recuperati ${menuItems.length} menu items dal database`);
        } else {
          console.warn('⚠️ [NAVBAR-DEBUG] Response success=false o menuItems vuoto');
        }
      } else {
        const errorText = await response.text();
        console.warn('⚠️ [NAVBAR-DEBUG] API failed with status:', response.status);
        console.warn('⚠️ [NAVBAR-DEBUG] Error text:', errorText);
        console.warn('⚠️ [NAVBAR-DB-HP] API fallita, usando menu di default');
      }
    } else {
      console.warn('❌ [NAVBAR-DEBUG] WebsiteId è vuoto/null/undefined!');
    }
    
    // Genera navbar statica con i menu items (o default se vuoti)
    return generateStaticNavbar(businessName, menuItems);
    
  } catch (error) {
    console.error('❌ [NAVBAR-DB-HP] Errore:', error.message);
    // In caso di errore, usa navbar statica con menu di default
    return generateStaticNavbar(businessName, []);
  }
}

/**
 * 🚀 NAVBAR TEMPLATE INJECTION - Genera navbar dinamica da database (HOMEPAGE)
 */
async function generateNavbarFromDatabase(websiteId, businessName) {
  try {
    console.log('🔧 [NAVBAR-INJECTION-HP] Generazione navbar per websiteId:', websiteId);
    
    // Se non abbiamo websiteId, generiamo navbar base
    if (!websiteId) {
      console.log('⚠️ [NAVBAR-INJECTION-HP] WebsiteId mancante, usando navbar base');
      return generateBaseNavbar(businessName);
    }

    // 🌐 Chiamata API a VendiOnline-EU per ottenere le pagine
    const vendionlineUrl = process.env.VENDIONLINE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${vendionlineUrl}/api/website/menu-items?websiteId=${websiteId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Trainer-Key': process.env.AI_TRAINER_API_KEY || '',
      }
    });

    if (!response.ok) {
      console.warn('⚠️ [NAVBAR-INJECTION-HP] API fallita, usando navbar base');
      return generateBaseNavbar(businessName);
    }

    const data = await response.json();
    if (!data.success || !data.menuItems) {
      console.warn('⚠️ [NAVBAR-INJECTION-HP] Dati invalidi, usando navbar base');
      return generateBaseNavbar(businessName);
    }

    // 🎯 Genera navbar con menu items dinamici
    const menuItems = data.menuItems;
    const navbarHtml = `
    <nav class="bg-white shadow-lg fixed w-full z-50 top-0">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <h1 class="text-xl font-bold text-gray-900">${businessName}</h1>
            </div>
          </div>
          
          <!-- Desktop Menu (nascosto su mobile) -->
          <div class="hidden md:flex md:items-center md:space-x-8">
            ${menuItems.map(item => `
              <a href="${item.href}" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                ${item.name}
              </a>
            `).join('')}
          </div>
          
          <!-- Mobile hamburger button -->
          <div class="md:hidden flex items-center">
            <button id="hamburger-btn" type="button" class="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600">
              <i class="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Mobile menu -->
      <div id="mobileMenu" class="hidden md:hidden bg-white border-t border-gray-200">
        <div class="px-2 pt-2 pb-3 space-y-1">
          ${menuItems.map(item => `
            <a href="${item.href}" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors">
              ${item.name}
            </a>
          `).join('')}
        </div>
      </div>
    </nav>
    
    <!-- Spacer per compensare navbar fixed -->
    <div class="h-16"></div>`;

    console.log(`✅ [NAVBAR-INJECTION-HP] Navbar generata con ${menuItems.length} menu items`);
    return navbarHtml;

  } catch (error) {
    console.error('❌ [NAVBAR-INJECTION-HP] Errore:', error.message);
    return generateBaseNavbar(businessName);
  }
}

/**
 * 🎯 NAVBAR BASE - Fallback quando non abbiamo dati dal database (HOMEPAGE)
 */
function generateBaseNavbar(businessName) {
  console.log('🔧 [NAVBAR-INJECTION-HP] Generazione navbar base per:', businessName);
  
  return `
  <nav class="bg-white shadow-lg fixed w-full z-50 top-0">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <h1 class="text-xl font-bold text-gray-900">${businessName}</h1>
          </div>
        </div>
        
        <!-- Desktop Menu Base -->
        <div class="hidden md:flex md:items-center md:space-x-8">
          <a href="/" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
            Home
          </a>
          <a href="/chi-siamo" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
            Chi Siamo
          </a>
          <a href="/servizi" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
            Servizi
          </a>
          <a href="/contatti" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
            Contatti
          </a>
        </div>
        
        <!-- Mobile hamburger button -->
        <div class="md:hidden flex items-center">
          <button id="hamburger-btn" type="button" class="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600">
            <i class="fas fa-bars text-xl"></i>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Mobile menu -->
    <div id="mobileMenu" class="hidden md:hidden bg-white border-t border-gray-200">
      <div class="px-2 pt-2 pb-3 space-y-1">
        <a href="/" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors">
          Home
        </a>
        <a href="/chi-siamo" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors">
          Chi Siamo
        </a>
        <a href="/servizi" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors">
          Servizi
        </a>
        <a href="/contatti" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors">
          Contatti
        </a>
      </div>
    </div>
  </nav>
  
  <!-- Spacer per compensare navbar fixed -->
  <div class="h-16"></div>`;
}

/**
 * 🎨 ENDPOINT GENERAZIONE HTML COMPLETA CON CLAUDE
 * POST /api/claude/generate-html
 * 
 * Genera direttamente HTML bellissimo come Claude.ai
 * Segue i prompt ottimali suggeriti dall'utente
 */
router.post('/generate-html', async (req, res) => {
  // Variabili dichiarate all'inizio per essere accessibili ovunque
  let businessId, websiteId, ownerId;

  try {
    // 🔑 API KEY AUTHENTICATION (like other AI-Trainer endpoints)
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

    const {
      ownerId: requestOwnerId, // ← Rename to avoid conflict
      businessName, 
      businessType, 
      businessDescription, 
      stylePreference = 'moderno',
      colorMood = 'professionale',
      targetAudience = 'generale',
      generationMode = 'economico' // 🎛️ Global generation mode
    } = req.body;

    // Assign to the declared variable
    ownerId = requestOwnerId;

    if (!businessName || !businessDescription) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: businessName and businessDescription'
      });
    }

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        error: 'Missing ownerId - required for database save'
      });
    }

    console.log('🎨 CLAUDE HTML GENERATION - Direct Creative Mode');
    console.log('Business:', { businessName, businessType, businessDescription });
    console.log('Style:', { stylePreference, colorMood, targetAudience });

    // 🖼️ OTTIENI IMMAGINI DAL UNIFIED SERVICE
    console.log('🖼️ Fetching images...');
    const businessImages = await UnifiedImageService.getBusinessImages(
      businessName, 
      businessType, 
      businessDescription,
      6
    );
    
    console.log(`✅ Retrieved ${businessImages.total} images`);

    // 🆔 Genera ID univoco per il website
    const websiteId = `${businessName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    console.log(`🆔 Website ID: ${websiteId}`);

    // 🔗 Log immagini locali se disponibili
    if (businessImages.useLocal && businessImages.localImages) {
      try {
        const imageFileNames = [];
        ['hero', 'services', 'backgrounds'].forEach(category => {
          if (businessImages.localImages[category]) {
            businessImages.localImages[category].forEach(img => {
              imageFileNames.push(img.fileName);
            });
          }
        });

        if (imageFileNames.length > 0) {
          console.log(`🔗 Found ${imageFileNames.length} local images for website ${websiteId}`);
          console.log(`� Image files: ${imageFileNames.slice(0, 3).join(', ')}${imageFileNames.length > 3 ? '...' : ''}`);
        }
      } catch (linkError) {
        console.warn('⚠️  Failed to log images:', linkError.message);
      }
    }

    // 🔧 HELPER per URL immagini
    const getImageUrl = (img) => {
      if (businessImages.useLocal && businessImages.localImages) {
        return img.url;
      }
      return img.webformatURL || img.urls?.regular || img.download_url || img.url || 'placeholder.jpg';
    };

    // 🎨 PROMPT CLAUDE OTTIMALE PER HTML DIRETTO
    const claudePrompt = `SEI UN WEB DESIGNER ESPERTO CHE CREA SITI WEB UNICI E MODERNI!

Devi creare una pagina HTML COMPLETA E FUNZIONALE per "${businessName}" (${businessType}), evitando design generici o template standard.

BRIEF DETTAGLIATO:
${businessDescription}

IDENTITÀ BRAND:
- Stile: ${stylePreference}  
- Mood colori: ${colorMood}
- Target: ${targetAudience}

RICHIESTE TECNICHE SPECIFICHE - CREA UN DESIGN CHE INCLUDA:
✅ Layout moderno e responsive con Tailwind CSS
✅ Animazioni fluide e hover effects creativi
✅ Sezioni specifiche con immagini appropriate  
✅ Filtri interattivi FUNZIONANTI con JavaScript
✅ Elementi visuali creativi (gradients, shadows, transforms)
✅ Tipografia accattivante con Google Fonts
✅ Call-to-action evidenti e styled
✅ Micro-interazioni e effects (hover, scale, rotate)
✅ Icons Font Awesome per ogni sezione
✅ Sezioni hero impattanti con gradients

NON LIMITARTI A DESIGN SEMPLICI - SII CREATIVO CON:
🎨 Colori e combinazioni cromatiche audaci
🎨 Layout asimmetrici o creativi  
🎨 Elementi grafici decorativi
🎨 Sezioni alternate con sfondi colorati
🎨 Cards con shadows e transforms
🎨 Animazioni CSS personalizzate

IMMAGINI DISPONIBILI (usa queste URL esatte):
${businessImages.hero?.map((img, i) => `HERO ${i+1}: ${getImageUrl(img)}`).join('\n') || 'Nessuna immagine hero'}
${(businessImages.services || []).map((img, i) => `CONTENT ${i+1}: ${getImageUrl(img)}`).join('\n') || 'Nessuna immagine content'}
${(businessImages.backgrounds || []).map((img, i) => `BACKGROUND ${i+1}: ${getImageUrl(img)}`).join('\n') || 'Nessuna immagine background'}

FRAMEWORK STILISTICO RICHIESTO:
- Gradienti colorati e moderni
- Hover effects e animazioni fluide
- Layout asimmetrico e creativo
- Cards con shadows e transforms  
- Sezioni alternate con sfondi colorati
- Tipografia elegante con font pairing
- Filtri interattivi funzionanti
- Elementi decorativi (forme geometriche, patterns)

🚫 NAVBAR REQUIREMENTS - NON CREARE NAVBAR:
- NON includere tag <nav> o elementi di navigazione
- NON creare menu o link di navigazione  
- NON includere header di navigazione
- Concentrati solo sul contenuto principale della pagina
- Inizia direttamente con sezioni hero/main content



REGOLE ASSOLUTE:
1. NON includere navbar/navigazione - verrà aggiunta automaticamente dal sistema
2. Inizia direttamente con <main> o prima sezione hero dopo <body>
3. Usa SOLO le immagini fornite sopra  
4. Implementa JavaScript per filtri e interazioni
5. Sii ESTREMAMENTE CREATIVO nel design
6. Mantieni alta qualità visiva e UX
7. Adatta colori e stile al tipo di business`;

    console.log('🎨 Calling Claude Sonnet 4 for HTML generation...');
    console.log(`🎛️ Generation mode: ${generationMode}`);
    
    // 🎛️ CONFIGURE CLAUDE BASED ON GENERATION MODE (align with page generation)
    const claudeConfig = generationMode === 'economico' 
      ? {
          max_tokens: 3500,  // Economico: meno token come le pagine
          temperature: 0.3   // Economico: più deterministico come le pagine
        }
      : {
          max_tokens: 6000,  // Sviluppo: più token per contenuti dettagliati
          temperature: 0.6   // Sviluppo: creatività bilanciata
        };
    
    // CHIAMATA A CLAUDE SONNET 4 PER HTML DIRETTO
    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: claudeConfig.max_tokens,
      temperature: claudeConfig.temperature,
      messages: [
        {
          role: 'user',
          content: claudePrompt
        }
      ]
    });

    const htmlContent = claudeResponse.content[0].text;
    console.log('✅ Claude HTML response received');
    console.log(`📄 Generated HTML length: ${htmlContent.length} characters`);

    // 💰 CALCULATE COSTS (Claude Sonnet 4 pricing as of Sept 2025)
    // Input: $3.00 per 1M tokens, Output: $15.00 per 1M tokens
    const usage = claudeResponse.usage;
    const inputTokens = usage?.input_tokens || 0;
    const outputTokens = usage?.output_tokens || 0;
    
    const inputCost = (inputTokens / 1000000) * 3.00;
    const outputCost = (outputTokens / 1000000) * 15.00;
    const totalCost = inputCost + outputCost;
    
    const costInfo = {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      inputCost,
      outputCost,
      totalCost,
      generationMode,
      model: 'claude-sonnet-4-20250514',
      timestamp: new Date().toISOString()
    };

    console.log(`💰 Homepage Cost: $${totalCost.toFixed(4)} (mode: ${generationMode})`);

    // ESTRAI IL CODICE HTML (potrebbe essere wrappato in ```html)
    let cleanHTML = htmlContent;
    
    // Più pattern di pulizia per catturare tutti i casi
    const htmlPatterns = [
      /```html\n([\s\S]*?)\n```/,           // ```html ... ```
      /```html([\s\S]*?)```/,               // ```html...``` (senza newline)
      /```\n([\s\S]*?)\n```/,               // ``` ... ```
      /```([\s\S]*?)```/,                   // ```...``` (senza newline)
      /<html[\s\S]*<\/html>/i               // Direct HTML match
    ];
    
    for (const pattern of htmlPatterns) {
      const match = htmlContent.match(pattern);
      if (match) {
        cleanHTML = match[1] || match[0];
        break;
      }
    }
    
    // Rimuovi eventuali wrapper markdown rimanenti
    cleanHTML = cleanHTML.replace(/^```html\n?/gm, '').replace(/\n?```$/gm, '');

    // 🚀 NAVBAR TEMPLATE INJECTION - Homepage con navbar base
    console.log('🚀 [NAVBAR-INJECTION-HP] Aggiunta navbar statica alla homepage...');
    
    try {
      // Per la homepage usiamo navbar statica con database integration
      const dynamicNavbar = await generateNavbarWithDatabase(websiteId, businessName);
      
      // Metodo 1: Sostituisci navbar esistente se presente
      if (cleanHTML.includes('<nav')) {
        console.log('🔄 [NAVBAR-INJECTION-HP] Sostituzione navbar esistente...');
        cleanHTML = cleanHTML.replace(/<nav[\s\S]*?<\/nav>/gi, dynamicNavbar);
      } 
      // Metodo 2: Inserisci navbar dopo <body> se non presente
      else if (cleanHTML.includes('<body')) {
        console.log('🔧 [NAVBAR-INJECTION-HP] Inserimento navbar dopo <body>...');
        cleanHTML = cleanHTML.replace(/<body([^>]*)>/i, `<body$1>\n${dynamicNavbar}`);
      }
      // Metodo 3: Inserisci all'inizio del contenuto
      else if (cleanHTML.includes('<html')) {
        console.log('🔧 [NAVBAR-INJECTION-HP] Inserimento navbar all\'inizio...');
        const insertPoint = cleanHTML.indexOf('>') + 1;
        cleanHTML = cleanHTML.slice(0, insertPoint) + '\n' + dynamicNavbar + cleanHTML.slice(insertPoint);
      }
      
      console.log('✅ [NAVBAR-INJECTION-HP] Navbar base injection completata');
      
    } catch (navbarError) {
      console.error('❌ [NAVBAR-INJECTION-HP] Errore:', navbarError.message);
      // Continua comunque con l'HTML originale
    }

    // 🔧 POST-PROCESSING: Aggiungi automaticamente toggleMobileMenu se mancante
    if (!cleanHTML.includes('toggleMobileMenu')) {
      console.log('🔧 [POST-PROCESS] Adding missing toggleMobileMenu function...');
      
      const toggleMobileMenuScript = `
    <script>
    function toggleMobileMenu() {
        const menu = document.getElementById('mobileMenu');
        if (menu) {
            menu.classList.toggle('hidden');
        }
    }
    </script>`;
      
      // Inserisci prima della chiusura del body
      if (cleanHTML.includes('</body>')) {
        cleanHTML = cleanHTML.replace('</body>', `${toggleMobileMenuScript}\n</body>`);
      } else {
        // Fallback: aggiungi alla fine
        cleanHTML += toggleMobileMenuScript;
      }
      console.log('✅ [POST-PROCESS] toggleMobileMenu function added automatically');
    }

    // 🔧 SOLUZIONE DEFINITIVA: Forza SEMPRE l'aggiornamento con script corretto
    console.log('🔧 [FORCE-UPDATE] Ensuring toggleMobileMenu is present...');
    
    // Forza sempre la presenza dello script (anche se già presente)
    const forceToggleScript = `
    <script>
    function toggleMobileMenu() {
        const menu = document.getElementById('mobileMenu');
        if (menu) {
            menu.classList.toggle('hidden');
        }
    }
    
    // Auto-attach event listener to hamburger button
    document.addEventListener('DOMContentLoaded', function() {
        const hamburgerBtn = document.getElementById('hamburger-btn') || 
                           document.querySelector('button[onclick*="toggleMobileMenu"]') ||
                           document.querySelector('button i.fa-bars').parentElement;
        if (hamburgerBtn) {
            hamburgerBtn.onclick = toggleMobileMenu;
        }
    });
    </script>`;

    // Rimuovi eventuali script esistenti duplicati e aggiungi quello nuovo
    cleanHTML = cleanHTML.replace(/<script>[\s\S]*?toggleMobileMenu[\s\S]*?<\/script>/g, '');
    
    // Assicurati che il pulsante hamburger abbia almeno un id
    if (!cleanHTML.includes('id="hamburger-btn"') && !cleanHTML.includes('onclick="toggleMobileMenu()"')) {
      cleanHTML = cleanHTML.replace(
        /<button([^>]*class="[^"]*"[^>]*)><i class="fas fa-bars/g,
        '<button$1 id="hamburger-btn"><i class="fas fa-bars'
      );
    }
    
    if (cleanHTML.includes('</body>')) {
      cleanHTML = cleanHTML.replace('</body>', `${forceToggleScript}\n</body>`);
      console.log('✅ [FORCE-UPDATE] toggleMobileMenu script with auto-attach forcibly added before </body>');
    } else {
      cleanHTML += forceToggleScript;
      console.log('✅ [FORCE-UPDATE] toggleMobileMenu script with auto-attach forcibly added at end');
    }
    
    console.log(`🧹 HTML cleaning: Original length: ${htmlContent.length}, Clean length: ${cleanHTML.length}`);

    // VERIFICA CHE SIA HTML VALIDO
    if (!cleanHTML.includes('<!DOCTYPE html>') && !cleanHTML.includes('<html')) {
      throw new Error('Generated content is not valid HTML');
    }

    // 💾 SALVA NELLA TABELLA WEBSITES ESISTENTE
    try {
      // Genera IDs univoci per database (diversi da quelli per preview)
      const dbBusinessId = `biz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const dbWebsiteId = `site_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prima creo/aggiorno il business con l'ownerId reale del token
      const businessQuery = `
        INSERT INTO businesses (id, "ownerId", name, type, description, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          description = EXCLUDED.description,
          "updatedAt" = NOW()
        RETURNING id;
      `;
      
      await pool.query(businessQuery, [
        dbBusinessId,
        ownerId, // ← Usa l'ownerId reale dal token
        businessName,
        businessType || 'general',
        businessDescription || ''
      ]);
      
      console.log(`💼 Business created/updated: ${dbBusinessId} for owner: ${ownerId}`);
      
      // Ora salvo il website nella tabella websites
      
      const websiteQuery = `
        INSERT INTO websites (id, "businessId", content, design, status, version, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content,
          design = EXCLUDED.design,
          "updatedAt" = NOW()
        RETURNING id;
      `;
      
      // Design = metadata e stili completi
      const websiteDesign = {
        taskId: `website_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ownerId: ownerId,
        metadata: {
          website_id: dbWebsiteId,
          generation_type: 'direct_html',
          creative_mode: true,
          style: {
            preference: stylePreference,
            color_mood: colorMood,
            target_audience: targetAudience
          },
          images_used: {
            hero: businessImages.hero?.length || 0,
            content: (businessImages.services || []).length,
            backgrounds: (businessImages.backgrounds || []).length
          },
          content_length: cleanHTML.length,
          claude_system: 'v3.0 - Direct HTML Creative Generation'
        },
        createdAt: new Date().toISOString(),
        generator: 'ai-trainer-claude-html',
        businessType: businessType || 'general',
        generation_type: 'claude_html_direct',
        savedToDatabase: true,
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B'
      };

      const websiteResult = await pool.query(websiteQuery, [
        dbWebsiteId,
        dbBusinessId,
        cleanHTML,  // ← HTML completo di Claude va qui
        JSON.stringify(websiteDesign),
        'generated',
        1
      ]);
      
      console.log(`🌐 Website saved: ${dbWebsiteId} for business: ${dbBusinessId}`);
      
      // Assegna i valori DB alle variabili per la response
      businessId = dbBusinessId;
      websiteId = dbWebsiteId;
      
    } catch (dbError) {
      console.error('❌ Database save error:', dbError.message);
      // Non blocchiamo la response se il DB fallisce
    }

    // 📁 SALVA HOMEPAGE COME FILE STATICO per serving futuro
    const homePageSlug = 'index'; // Homepage = index.html
    const saveResult = savePageToStatic(homePageSlug, cleanHTML, businessName);
    console.log(`📁 [STATIC-SAVE-HP] ${saveResult.success ? '✅ Saved' : '❌ Failed'}: ${homePageSlug}`);

    // RESPONSE CON HTML E METADATA
    res.json({
      success: true,
      html: cleanHTML,
      websiteId: websiteId,
      businessId: businessId,
      savedToDatabase: true,
      staticSaved: saveResult.success, // 🆕 Conferma salvataggio statico
      costInfo: costInfo, // 💰 Include cost information
      metadata: {
        website_id: websiteId,
        generation_type: 'direct_html',
        creative_mode: true,
        style: {
          preference: stylePreference,
          color_mood: colorMood,
          target_audience: targetAudience
        },
        images_used: {
          hero: businessImages.hero?.length || 0,
          content: (businessImages.services || []).length,
          backgrounds: (businessImages.backgrounds || []).length
        },
        content_length: cleanHTML.length,
        claude_system: 'v3.0 - Direct HTML Creative Generation',
        cost_tracking: {
          generation_mode: generationMode,
          temperature: claudeConfig.temperature,
          max_tokens: claudeConfig.max_tokens
        }
      }
    });

  } catch (error) {
    console.error('Claude HTML generation error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate HTML website',
      details: error.message
    });
  }
});

/**
 * 📁 SAVE PAGE TO STATIC FILES (HOMEPAGE)
 * Salva le homepage generate come file statici per il serving
 */
function savePageToStatic(pageSlug, htmlContent, businessName) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Directory per le pagine statiche (organizzate per business)
    const staticDir = path.join(__dirname, '../../static-pages', businessName.toLowerCase().replace(/\s+/g, '-'));
    
    // Crea directory se non esiste
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true });
    }
    
    // Salva il file HTML
    const filePath = path.join(staticDir, `${pageSlug}.html`);
    fs.writeFileSync(filePath, htmlContent, 'utf8');
    
    console.log(`✅ [STATIC-SAVE-HP] Page saved: ${filePath}`);
    return { success: true, filePath };
    
  } catch (error) {
    console.error('❌ [STATIC-SAVE-HP] Failed to save page:', error);
    return { success: false, error: error.message };
  }
}

module.exports = router;

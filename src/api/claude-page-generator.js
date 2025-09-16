const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { Pool } = require('pg');

// CLAUDE SONNET 4 - GENERAZIONE PAGINE SECONDARIE CON STYLE DNA
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// 🗄️ POSTGRESQL CONNECTION POOL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * 🔄 AGGIORNA NAVBAR IN TUTTE LE PAGINE ESISTENTI
 * Quando si crea una nuova pagina, aggiorna anche tutte le esistenti
 */
async function updateAllPagesNavbar(websiteId, businessName, pool) {
  console.log('🔄 [NAVBAR-UPDATE] Aggiornamento navbar in tutte le pagine esistenti...');
  
  try {
    // 1. Genera nuovo navbar dinamico
    const { generateDynamicNavbar } = require('../components/navbar-generator');
    const newNavbar = await generateDynamicNavbar(websiteId, businessName, pool);
    
    console.log('🔍 [NAVBAR-UPDATE] Nuovo navbar generato, lunghezza:', newNavbar.length);
    
    // 2. Trova tutte le pagine del sito
    const pagesQuery = `
      SELECT id, name, content 
      FROM website_pages 
      WHERE "websiteId" = $1 AND "isActive" = true
    `;
    const result = await pool.query(pagesQuery, [websiteId]);
    
    console.log(`📄 [NAVBAR-UPDATE] Trovate ${result.rows.length} pagine da aggiornare`);
    
    // 3. Aggiorna navbar in ogni pagina
    for (const page of result.rows) {
      let updatedContent = page.content;
      let wasUpdated = false;
      
      // Metodo 1: Sostituisci placeholder (preferito)
      if (updatedContent.includes('<!-- DYNAMIC_NAVBAR_PLACEHOLDER -->')) {
        updatedContent = updatedContent.replace('<!-- DYNAMIC_NAVBAR_PLACEHOLDER -->', newNavbar);
        wasUpdated = true;
        console.log(`🔄 [NAVBAR-UPDATE] ${page.name}: Sostituito placeholder`);
      }
      // Metodo 2: Sostituisci <nav>...</nav> (fallback migliorato)
      else if (updatedContent.includes('<nav')) {
        const originalLength = updatedContent.length;
        
        // Prima prova: sostituzione precisa con attributi navbar
        if (updatedContent.includes('role="navigation"') || updatedContent.includes('data-navbar-version')) {
          updatedContent = updatedContent.replace(/<nav[^>]*role="navigation"[\s\S]*?<\/nav>/gi, newNavbar);
          console.log(`🔄 [NAVBAR-UPDATE] ${page.name}: Sostituito nav con role="navigation"`);
        }
        // Fallback: sostituzione generale
        else {
          // Conta quante navbar ci sono
          const navMatches = updatedContent.match(/<nav[\s\S]*?<\/nav>/gi);
          console.log(`🔍 [NAVBAR-DEBUG] ${page.name}: Trovate ${navMatches ? navMatches.length : 0} navbar`);
          
          // Sostituisci TUTTE le navbar (rimuove duplicati)
          updatedContent = updatedContent.replace(/<nav[\s\S]*?<\/nav>/gi, '');
          // Aggiungi la nuova navbar all'inizio del body
          updatedContent = updatedContent.replace(/<body[^>]*>/i, `$&\n${newNavbar}`);
          console.log(`🔄 [NAVBAR-UPDATE] ${page.name}: Rimosse tutte le navbar e aggiunta nuova`);
        }
        
        wasUpdated = updatedContent.length !== originalLength;
        console.log(`🔄 [NAVBAR-UPDATE] ${page.name}: Aggiornamento completato (${originalLength} → ${updatedContent.length})`);
      }
      else {
        console.log(`⚠️ [NAVBAR-UPDATE] ${page.name}: Nessun navbar trovato da sostituire`);
      }
      
      // 4. Salva contenuto aggiornato solo se cambiato
      if (wasUpdated) {
        await pool.query(
          'UPDATE website_pages SET content = $1, "updatedAt" = NOW() WHERE id = $2',
          [updatedContent, page.id]
        );
        console.log(`✅ [NAVBAR-UPDATE] Aggiornata pagina: ${page.name}`);
      }
    }
    
    console.log(`🎯 [NAVBAR-UPDATE] Processo completato - ${result.rows.length} pagine controllate`);
    
  } catch (error) {
    console.error('❌ [NAVBAR-UPDATE] Errore durante aggiornamento:', error);
  }
}

/**
 * 🎨 NAVBAR TEMPLATE STATICA - Design Perfetto e Responsive
 * Navbar moderna con menu hamburger funzionante e link dinamici
 */
function generateStaticNavbar(businessName, menuItems = []) {
  console.log(`🎨 [STATIC-NAVBAR] Generazione navbar per: ${businessName} con ${menuItems.length} menu items`);
  
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
        href: item.slug?.startsWith('/') ? item.slug : `/${item.slug}`, // 🔧 FIX: Gestisci slug con slash
        pageType: item.pageType
      }));
    
    finalMenuItems = [...finalMenuItems, ...activePages];
    console.log(`✅ [NAVBAR-DB] Aggiunte ${activePages.length} pagine dal database`);
  } else {
    console.log(`⚠️ [NAVBAR-DB] Nessuna pagina nel database, usando solo HOME`);
  }
  
  return `
  <!-- � NAVBAR STATICA PERFETTA - Responsive & Accessibile -->
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
 * 🚀 NAVBAR WITH DATABASE INTEGRATION
 * Genera navbar statica popolata con dati dinamici dal database
 */
async function generateNavbarWithDatabase(websiteId, businessName) {
  try {
    console.log('🔧 [NAVBAR-DB] Recupero menu items per websiteId:', websiteId);
    console.log('🔍 [NAVBAR-DB] Pool disponibile:', !!pool);
    console.log('🔍 [NAVBAR-DB] WebsiteId:', websiteId);
    
    let menuItems = [];
    
    // Se abbiamo websiteId, prova a recuperare dal database DIRETTAMENTE
    if (websiteId) {
      const pagesQuery = `
        SELECT id, name, slug, "pageType", "pageOrder", "isHomepage", "isActive"
        FROM website_pages 
        WHERE "websiteId" = $1 AND "isActive" = true
        ORDER BY "pageOrder" ASC, "createdAt" ASC
      `;
      
      console.log('🔍 [NAVBAR-DB] Eseguendo query:', pagesQuery);
      console.log('🔍 [NAVBAR-DB] Con parametro websiteId:', websiteId);
      
      const result = await pool.query(pagesQuery, [websiteId]);
      const pages = result.rows;
      
      console.log('🔍 [NAVBAR-DB] Risultato query - rows:', pages.length);
      console.log('🔍 [NAVBAR-DB] Prime 2 pagine:', pages.slice(0, 2));
      
      if (pages.length > 0) {
        // Trasforma le pagine in menu items
        menuItems = pages.map(page => ({
          name: page.name,
          href: page.slug.startsWith('/') ? page.slug : `/${page.slug}`,
          pageType: page.pageType,
          pageOrder: page.pageOrder,
          isHomepage: page.isHomepage,
          isActive: page.isActive
        }));
        
        console.log(`✅ [NAVBAR-DB] Recuperati ${menuItems.length} menu items dal database`);
        console.log('🔍 [NAVBAR-DB] Menu items:', menuItems.map(m => `${m.name}:${m.href}`).join(', '));
      } else {
        console.log('⚠️ [NAVBAR-DB] Nessuna pagina trovata nel database');
      }
    }
    
    // Genera navbar statica con i menu items (o default se vuoti)
    return generateStaticNavbar(businessName, menuItems);
    
  } catch (error) {
    console.error('❌ [NAVBAR-GENERATOR] Errore database completo:', error);
    console.error('❌ [NAVBAR-GENERATOR] Error message:', error.message);
    console.error('❌ [NAVBAR-GENERATOR] Error stack:', error.stack);
    console.error('❌ [NAVBAR-GENERATOR] Pool status:', !!pool);
    // In caso di errore, usa navbar statica con menu di default
    return generateStaticNavbar(businessName, []);
  }
}

/**
 * 🎨 ENDPOINT GENERAZIONE PAGINE SECONDARIE CON STYLE DNA
 * POST /api/claude/generate-page
 * 
 * Genera pagine specifiche (Chi Siamo, Servizi, Contatti) mantenendo coerenza con Style DNA
 */
router.post('/generate-page', async (req, res) => {
  try {
    // 🔑 API KEY AUTHENTICATION
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
      websiteId, // 🆕 Per Hybrid Smart Menu System
      ownerId,
      businessName, 
      businessType, 
      businessDescription, 
      pageType,
      styleDNA,
      stylePreference = 'moderno',
      colorMood = 'professionale',
      targetAudience = 'generale',
      generationMode = 'economico', // 🆕 Modalità generazione
      designConventions = null // 🆕 Convenzioni di design dalla homepage
    } = req.body;

    if (!businessName || !pageType || !styleDNA) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: businessName, pageType, styleDNA'
      });
    }

    console.log('🎨 CLAUDE PAGE GENERATION - Multi-Page System');
    console.log('Business:', { businessName, businessType, pageType });
    console.log('Style DNA:', { 
      colors: styleDNA.colors?.brandColors?.length || 0,
      fonts: Object.keys(styleDNA.typography?.fonts || {}).length,
      extractionScore: styleDNA.extractionScore 
    });

    // 🎯 PROMPT SPECIFICO PER TIPO DI PAGINA CON DESIGN CONVENTIONS
    const pagePrompts = {
      about: `Crea una bellissima pagina "CHI SIAMO" per ${businessName} mantenendo perfetta coerenza con la homepage esistente.

${designConventions ? `
🎨 CONVENZIONI DI DESIGN DALLA HOMEPAGE:
- NAVBAR HTML: ${designConventions.navbarHtml ? 'Disponibile - usa la stessa struttura esatta' : 'Non disponibile'}
- NAVBAR STYLE: ${designConventions.navbarStyle || 'Standard'}
- LAYOUT PATTERN: ${designConventions.layoutPattern || 'standard'}
- DESIGN STYLE: ${designConventions.designStyle || 'professional'}
- CSS FRAMEWORK: ${designConventions.cssFramework || 'custom'}

🎯 BRAND CONTEXT:
- Brand Personality: ${designConventions.brandPersonality || 'professional'}
- Target Audience: ${designConventions.targetAudience || 'general'}
- Business Context: ${designConventions.businessContext || businessType}

🎨 COLOR SCHEME (da homepage):
${designConventions.colorScheme ? `
- Colori principali: ${Array.isArray(designConventions.colorScheme.colors) ? designConventions.colorScheme.colors.slice(0, 5).join(', ') : 'Da determinare'}
- Colore primario: ${designConventions.colorScheme.primary || 'Da homepage'}
- Colore secondario: ${designConventions.colorScheme.secondary || 'Da homepage'}` : 'Usa colori coerenti con la homepage'}

🔤 TYPOGRAPHY (da homepage):
${designConventions.typography ? `
- Font principale: ${designConventions.typography.headingFont || 'Inter'}
- Font del corpo: ${designConventions.typography.bodyFont || 'Inter'}
- Font aggiuntivi: ${Array.isArray(designConventions.typography.fonts) ? designConventions.typography.fonts.join(', ') : 'Sistema'}` : 'Usa font coerenti con la homepage'}

IMPORTANTE: Mantieni ESATTA coerenza visiva con questi elementi della homepage.
` : ''}

REQUISITI DI COERENZA NAVBAR:
- DESKTOP (≥768px): Mostra SOLO logo e hamburger menu chiuso (nessun link visibile)
- MOBILE (<768px): Mostra logo e hamburger menu chiuso (nessun link visibile)  
- HAMBURGER MENU: Al click mostra dropdown con link di navigazione
- Struttura responsive identica alla homepage per consistenza UX
- NOME ATTIVITÀ: Usa sempre e solo "${businessName}" senza modifiche o interpretazioni
- FOOTER: Mantieni footer identico a quello della homepage (stessi contenuti, link, layout)

OBIETTIVO: Pagina About aziendale professionale e coinvolgente.

CONTENUTO DA INCLUDERE:
- Storia dell'azienda e valori
- Mission e vision  
- Esperienza e competenze
- Team (se appropriato)
- Punti di forza distintivi

STILE DA MANTENERE:
${designConventions ? `
- Design Style: ${designConventions.designStyle}
- Layout Pattern: ${designConventions.layoutPattern}
- CSS Framework: ${designConventions.cssFramework}
- Brand Personality: ${designConventions.brandPersonality}` : `
- Colori primari: ${styleDNA.colors?.primary}, ${styleDNA.colors?.secondary}
- Colori brand: ${styleDNA.colors?.brandColors?.slice(0, 4).join(', ') || 'Moderni'}
- Font principale: ${styleDNA.typography?.primaryFont || 'Inter'}
- Font secondario: ${styleDNA.typography?.secondaryFont || 'Playfair Display'}`}

DESIGN REQUIREMENTS:
- Layout responsive con Tailwind CSS
- Sezioni con sfondi alternati
- Cards eleganti per i contenuti
- Animazioni fluide hover
- Gradients coerenti con i colori brand
- Elementi decorativi geometrici`,

      services: `Crea una bellissima pagina "SERVIZI" per ${businessName} mantenendo perfetta coerenza con la homepage esistente.

${designConventions ? `
🎨 CONVENZIONI DI DESIGN DALLA HOMEPAGE:
- NAVBAR HTML: ${designConventions.navbarHtml ? 'Disponibile - usa la stessa struttura esatta' : 'Non disponibile'}
- LAYOUT PATTERN: ${designConventions.layoutPattern || 'standard'}
- DESIGN STYLE: ${designConventions.designStyle || 'professional'}
- CSS FRAMEWORK: ${designConventions.cssFramework || 'custom'}
- BRAND PERSONALITY: ${designConventions.brandPersonality || 'professional'}

🎨 COLOR SCHEME: ${designConventions.colorScheme ? 
`Usa i colori: ${Array.isArray(designConventions.colorScheme.colors) ? designConventions.colorScheme.colors.slice(0, 5).join(', ') : 'Da homepage'}` : 
'Mantieni coerenza con homepage'}

🔤 TYPOGRAPHY: ${designConventions.typography ? 
`Font: ${designConventions.typography.headingFont || 'Inter'}, ${designConventions.typography.bodyFont || 'Inter'}` : 
'Usa font della homepage'}
` : ''}

REQUISITI DI COERENZA NAVBAR:
- NAVBAR PLACEHOLDER: Usa ESATTAMENTE questo placeholder: <!-- DYNAMIC_NAVBAR_PLACEHOLDER -->
- NON creare navbar hardcoded - usa SOLO il placeholder che verrà sostituito automaticamente
- Il placeholder deve essere posizionato subito dopo <body> prima del contenuto principale
- NOME ATTIVITÀ: Usa sempre e solo "${businessName}" senza modifiche o interpretazioni
- FOOTER: Mantieni footer identico a quello della homepage (stessi contenuti, link, layout)

OBIETTIVO: Showcase professionale dei servizi offerti.

CONTENUTO DA INCLUDERE:
- Lista servizi principali
- Descrizioni dettagliate
- Prezzi (se appropriato)
- Vantaggi e benefici
- Call-to-action per contatti

STILE DA MANTENERE:
${designConventions ? `
- Design Style: ${designConventions.designStyle}
- Layout Pattern: ${designConventions.layoutPattern}
- CSS Framework: ${designConventions.cssFramework}` : `
- Colori primari: ${styleDNA.colors?.primary}, ${styleDNA.colors?.secondary}
- Colori brand: ${styleDNA.colors?.brandColors?.slice(0, 4).join(', ') || 'Moderni'}
- Font principale: ${styleDNA.typography?.primaryFont || 'Inter'}
- Font secondario: ${styleDNA.typography?.secondaryFont || 'Playfair Display'}`}

DESIGN REQUIREMENTS:
- Grid di servizi responsive
- Cards interattive con hover effects
- Icons Font Awesome per ogni servizio
- Sezioni con sfondi colorati alternati
- Buttons styled coerenti`,

      contact: `Crea una bellissima pagina "CONTATTI" per ${businessName} mantenendo perfetta coerenza con la homepage esistente.

${designConventions ? `
🎨 CONVENZIONI DI DESIGN DALLA HOMEPAGE:
- NAVBAR HTML: ${designConventions.navbarHtml ? 'Disponibile - usa la stessa struttura esatta' : 'Non disponibile'}
- LAYOUT PATTERN: ${designConventions.layoutPattern || 'standard'}
- DESIGN STYLE: ${designConventions.designStyle || 'professional'}
- CSS FRAMEWORK: ${designConventions.cssFramework || 'custom'}
- BRAND PERSONALITY: ${designConventions.brandPersonality || 'professional'}

🎨 COLOR SCHEME: ${designConventions.colorScheme ? 
`Usa i colori: ${Array.isArray(designConventions.colorScheme.colors) ? designConventions.colorScheme.colors.slice(0, 5).join(', ') : 'Da homepage'}` : 
'Mantieni coerenza con homepage'}

🔤 TYPOGRAPHY: ${designConventions.typography ? 
`Font: ${designConventions.typography.headingFont || 'Inter'}, ${designConventions.typography.bodyFont || 'Inter'}` : 
'Usa font della homepage'}
` : ''}

REQUISITI DI COERENZA:
- NAVBAR: NON creare navigazione - viene aggiunta automaticamente dal sistema
- NOME ATTIVITÀ: Usa sempre e solo "${businessName}" senza modifiche o interpretazioni
- FOOTER: Mantieni footer identico a quello della homepage (stessi contenuti, link, layout)

OBIETTIVO: Facilitare il contatto con l'azienda.

CONTENUTO DA INCLUDERE:
- Form contatti funzionale
- Informazioni di contatto (telefono, email, indirizzo)
- Mappa (placeholder)
- Orari di apertura
- Link social (se appropriato)

STILE DA MANTENERE:
${designConventions ? `
- Design Style: ${designConventions.designStyle}
- Layout Pattern: ${designConventions.layoutPattern}
- CSS Framework: ${designConventions.cssFramework}` : `
- Colori primari: ${styleDNA.colors?.primary}, ${styleDNA.colors?.secondary}
- Colori brand: ${styleDNA.colors?.brandColors?.slice(0, 4).join(', ') || 'Moderni'}
- Font principale: ${styleDNA.typography?.primaryFont || 'Inter'}`}
- Font secondario: ${styleDNA.typography?.secondaryFont || 'Playfair Display'}

DESIGN REQUIREMENTS:
- Form elegante e accessibile
- Layout a due colonne (form + info)
- Cards per informazioni di contatto
- Animazioni micro-interaction
- Validation JavaScript`,

      portfolio: `Crea una bellissima pagina "PORTFOLIO" per ${businessName} mantenendo perfetta coerenza con la homepage esistente.

REQUISITI DI COERENZA:
- NAVBAR: NON includere navbar/navigazione - verrà aggiunta automaticamente dal sistema
- NOME ATTIVITÀ: Usa sempre e solo "${businessName}" senza modifiche o interpretazioni
- FOOTER: Mantieni footer identico a quello della homepage (stessi contenuti, link, layout)

OBIETTIVO: Showcase dei lavori e progetti realizzati.

CONTENUTO DA INCLUDERE:
- Galleria progetti
- Descrizioni lavori
- Testimonianze clienti
- Risultati ottenuti
- Case studies

STILE DA MANTENERE (Style DNA):
- Colori primari: ${styleDNA.colors?.primary}, ${styleDNA.colors?.secondary}
- Colori brand: ${styleDNA.colors?.brandColors?.slice(0, 4).join(', ') || 'Moderni'}
- Font principale: ${styleDNA.typography?.primaryFont || 'Inter'}
- Font secondario: ${styleDNA.typography?.secondaryFont || 'Playfair Display'}

DESIGN REQUIREMENTS:
- Grid gallery responsive
- Lightbox per immagini
- Filtri per categorie
- Hover effects creativi
- Cards progetti eleganti`,

      blog: `Crea una bellissima pagina "BLOG" per ${businessName} mantenendo perfetta coerenza con la homepage esistente.

REQUISITI DI COERENZA:
- NAVBAR: NON includere navbar/navigazione - verrà aggiunta automaticamente dal sistema
- NOME ATTIVITÀ: Usa sempre e solo "${businessName}" senza modifiche o interpretazioni
- FOOTER: Mantieni footer identico a quello della homepage (stessi contenuti, link, layout)

OBIETTIVO: Sezione news, articoli e aggiornamenti.

CONTENUTO DA INCLUDERE:
- Lista articoli recenti
- Preview contenuti
- Categorie e tags
- Search functionality
- Sidebar con widget

STILE DA MANTENERE (Style DNA):
- Colori primari: ${styleDNA.colors?.primary}, ${styleDNA.colors?.secondary}
- Colori brand: ${styleDNA.colors?.brandColors?.slice(0, 4).join(', ') || 'Moderni'}
- Font principale: ${styleDNA.typography?.primaryFont || 'Inter'}
- Font secondario: ${styleDNA.typography?.secondaryFont || 'Playfair Display'}

DESIGN REQUIREMENTS:
- Layout blog moderno
- Cards articoli responsive
- Typography ottimizzata per lettura
- Sidebar sticky
- Paginazione elegante`,

      testimonials: `Crea una bellissima pagina "RECENSIONI" per ${businessName} mantenendo perfetta coerenza con la homepage esistente.

REQUISITI DI COERENZA:
- NAVBAR: NON includere navbar/navigazione - verrà aggiunta automaticamente dal sistema
- NOME ATTIVITÀ: Usa sempre e solo "${businessName}" senza modifiche o interpretazioni
- FOOTER: Mantieni footer identico a quello della homepage (stessi contenuti, link, layout)

OBIETTIVO: Showcase testimonianze e feedback clienti.

CONTENUTO DA INCLUDERE:
- Testimonianze clienti
- Rating e stelle
- Foto clienti (placeholder)
- Stories di successo
- Form per nuove recensioni

STILE DA MANTENERE (Style DNA):
- Colori primari: ${styleDNA.colors?.primary}, ${styleDNA.colors?.secondary}
- Colori brand: ${styleDNA.colors?.brandColors?.slice(0, 4).join(', ') || 'Moderni'}
- Font principale: ${styleDNA.typography?.primaryFont || 'Inter'}
- Font secondario: ${styleDNA.typography?.secondaryFont || 'Playfair Display'}

DESIGN REQUIREMENTS:
- Cards testimonials eleganti
- Rating stars interattive
- Layout masonry o grid
- Carousel per highlights
- Social proof elements`
    };

    const selectedPrompt = pagePrompts[pageType];
    if (!selectedPrompt) {
      return res.status(400).json({
        success: false,
        error: `Unsupported page type: ${pageType}. Supported: ${Object.keys(pagePrompts).join(', ')}`
      });
    }

    const fullPrompt = `[CONTESTO PROGETTO]
SITO_ID: ${ownerId || 'unknown'}_${businessName?.replace(/[^a-zA-Z0-9]/g, '_') || 'website'}
BUSINESS: ${businessName}
TIPO_BUSINESS: ${businessType}
DESCRIZIONE: ${businessDescription}

[CONVENZIONI STABILITE]
Questo sito mantiene uno stile coerente definito dalla homepage con le seguenti caratteristiche:
- Nome attività: "${businessName}" (MANTIENI SEMPRE QUESTO NOME ESATTO)
- Struttura di navigazione: Navbar coerente con menu principale
- Footer: Layout e contenuti identici per tutte le pagine
- Palette colori: Definita dal Style DNA allegato
- Typography: Font coerenti per tutto il sito

[ISTRUZIONI SPECIFICHE]
${selectedPrompt}

FRAMEWORK TECNICO:
- HTML5 semantico e accessibile
- Tailwind CSS per styling
- Font Awesome per icons
- Google Fonts per typography
- JavaScript per interattività

STRUTTURA HTML RICHIESTA:
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pagina Temporanea</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&display=swap');
        /* Custom styles con i colori Style DNA */
    </style>
</head>
<body>
    <!-- DYNAMIC_NAVBAR_PLACEHOLDER -->
    <!-- CONTENUTO PRINCIPALE DELLA PAGINA -->
    <!-- FOOTER COERENTE: Copia esattamente footer e contenuti della homepage -->
    
    <!-- ============================================ -->
    <!-- QUESTO SCRIPT È OBBLIGATORIO - SEMPRE INCLUDERE -->
    <!-- ============================================ -->
    <script>
    function toggleMobileMenu() {
        const menu = document.getElementById('mobileMenu');
        if (menu) {
            menu.classList.toggle('hidden');
        }
    }
    </script>
</body>
</html>

REGOLE ASSOLUTE:
1. NOME ATTIVITÀ: Usa sempre e solo "${businessName}" - mai modificare o interpretare
2. NAVBAR: NON creare navigazione - viene aggiunta automaticamente dal sistema
3. FOOTER: Copia identicamente footer della homepage
4. COLORI: Usa SOLO i colori specificati nel Style DNA
5. FONT: Mantieni typography coerente
6. CONTENUTO: Crea contenuto realistico e professionale
7. RESPONSIVE: Assicurati che tutto sia mobile-friendly
8. ANIMAZIONI: Include micro-animazioni e hover effects eleganti

JAVASCRIPT AUTOMATICO - AGGIUNTO AUTOMATICAMENTE DAL SISTEMA
</script>

❗ REGOLA: Ogni sito HTML creato DEVE includere questo JavaScript nel tag <script> prima di </body>`;

    console.log('🎨 Calling Claude Sonnet 4 for page generation...');
    console.log(`💰 Generation mode: ${generationMode}`);

    // 🎛️ CONFIGURE CLAUDE BASED ON GENERATION MODE
    const claudeConfig = generationMode === 'economico' 
      ? {
          max_tokens: 3500,  // Economico: meno token
          temperature: 0.3   // Economico: più deterministico
        }
      : {
          max_tokens: 6000,  // Sviluppo: più token per contenuti dettagliati
          temperature: 0.6   // Sviluppo: più creativo
        };
    
    // CHIAMATA A CLAUDE SONNET 4 - CONFIGURAZIONE DINAMICA
    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: claudeConfig.max_tokens,
      temperature: claudeConfig.temperature,
      messages: [
        {
          role: 'user',
          content: fullPrompt
        }
      ]
    });

    const htmlContent = claudeResponse.content[0].text;
    
    // 💰 EXTRACT COST INFORMATION FROM CLAUDE RESPONSE
    const usage = claudeResponse.usage;
    const inputTokens = usage?.input_tokens || 0;
    const outputTokens = usage?.output_tokens || 0;
    
    // 💰 CALCULATE COSTS (Claude Sonnet 4 pricing as of Sept 2025)
    // Input: $3.00 per 1M tokens, Output: $15.00 per 1M tokens
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

    console.log('✅ Claude page response received');
    console.log(`📄 Generated page HTML length: ${htmlContent.length} characters`);
    console.log(`💰 Usage: ${inputTokens} input + ${outputTokens} output = ${inputTokens + outputTokens} total tokens`);
    console.log(`💰 Cost: $${totalCost.toFixed(4)} (mode: ${generationMode})`);

    // ESTRAI IL CODICE HTML
    let cleanHTML = htmlContent;
    
    const htmlPatterns = [
      /```html\n([\s\S]*?)\n```/,
      /```html([\s\S]*?)```/,
      /```\n([\s\S]*?)\n```/,
      /```([\s\S]*?)```/,
      /<html[\s\S]*<\/html>/i
    ];
    
    for (const pattern of htmlPatterns) {
      const match = htmlContent.match(pattern);
      if (match) {
        cleanHTML = match[1] || match[0];
        break;
      }
    }

    // Pulizia finale
    cleanHTML = cleanHTML
      .replace(/^\s*```html\s*/gm, '')
      .replace(/^\s*```\s*/gm, '')
      .trim();

    // 🎯 NAVBAR PLACEHOLDER INJECTION - Stesso sistema della homepage
    console.log('🚀 [NAVBAR-INJECTION] Inizio sostituzione navbar...');
    
    try {
      // Usa la stessa funzione della homepage con pool database
      const { generateDynamicNavbar } = require('../components/navbar-generator');
      const dynamicNavbar = await generateDynamicNavbar(websiteId, businessName, pool);
      
      console.log('🔍 [NAVBAR-INJECTION] Dynamic navbar length:', dynamicNavbar.length);
      console.log('🔍 [NAVBAR-INJECTION] HTML contains placeholder:', cleanHTML.includes('<!-- DYNAMIC_NAVBAR_PLACEHOLDER -->'));
      
      // Sostituisci placeholder con navbar dinamico (stesso sistema homepage)
      if (cleanHTML.includes('<!-- DYNAMIC_NAVBAR_PLACEHOLDER -->')) {
        console.log('🔄 [NAVBAR-INJECTION] Trovato placeholder, sostituisco con navbar dinamica...');
        cleanHTML = cleanHTML.replace('<!-- DYNAMIC_NAVBAR_PLACEHOLDER -->', dynamicNavbar);
        console.log('✅ [NAVBAR-INJECTION] Placeholder sostituito con successo!');
      } 
      // Fallback: se placeholder manca, inserisci dopo body
      else if (cleanHTML.includes('<body')) {
        console.log('🔧 [NAVBAR-INJECTION] Placeholder mancante, inserimento navbar dopo <body>...');
        cleanHTML = cleanHTML.replace(/<body([^>]*)>/i, `<body$1>\n${dynamicNavbar}`);
      }
      else {
        console.warn('⚠️ [NAVBAR-INJECTION] Nessun metodo di injection disponibile');
      }
      
      console.log('✅ [NAVBAR-INJECTION] Navbar injection completata');
      
    } catch (navbarError) {
      console.error('❌ [NAVBAR-INJECTION] Errore:', navbarError.message);
      // Continua comunque con l'HTML originale
    }

    // �🔧 POST-PROCESSING: Aggiungi automaticamente toggleMobileMenu se mancante
    if (!cleanHTML.includes('toggleMobileMenu')) {
      console.log('🔧 [POST-PROCESS-PAGE] Adding missing toggleMobileMenu function...');
      
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
      console.log('✅ [POST-PROCESS-PAGE] toggleMobileMenu function added automatically');
    }

    // 🔧 FORCE-UPDATE: Script semplificato per navbar injection
    console.log('🔧 [FORCE-UPDATE-PAGE] Adding mobile menu toggle script...');
    
    const forceToggleScript = `
    <script>
    function toggleMobileMenu() {
        const menu = document.getElementById('mobileMenu');
        if (menu) {
            menu.classList.toggle('hidden');
        }
    }
    
    // Auto-attach event listener al pulsante hamburger
    document.addEventListener('DOMContentLoaded', function() {
        const hamburgerBtn = document.getElementById('hamburger-btn');
        if (hamburgerBtn) {
            hamburgerBtn.onclick = toggleMobileMenu;
            console.log('✅ [NAVBAR] Hamburger menu collegato correttamente');
        } else {
            console.warn('⚠️ [NAVBAR] Pulsante hamburger non trovato');
        }
    });
    </script>`;

    // Rimuovi eventuali script duplicati e inserisci quello nuovo
    cleanHTML = cleanHTML.replace(/<script>[\s\S]*?toggleMobileMenu[\s\S]*?<\/script>/g, '');
    
    if (cleanHTML.includes('</body>')) {
      cleanHTML = cleanHTML.replace('</body>', `${forceToggleScript}\n</body>`);
      console.log('✅ [FORCE-UPDATE-PAGE] Mobile menu script added before </body>');
    } else {
      cleanHTML += forceToggleScript;
      console.log('✅ [FORCE-UPDATE-PAGE] Mobile menu script added at end');
    }

    console.log('🧹 HTML cleaning: Original length:', htmlContent.length, ', Clean length:', cleanHTML.length);

    // VERIFICA CHE SIA HTML VALIDO
    if (!cleanHTML.includes('<!DOCTYPE html>') && !cleanHTML.includes('<html')) {
      throw new Error('Generated content is not valid HTML');
    }

    // 📁 SALVA PAGINA COME FILE STATICO per serving futuro
    const pageSlug = pageType.toLowerCase().replace(/\s+/g, '-');
    const saveResult = savePageToStatic(pageSlug, cleanHTML, businessName);
    console.log(`📁 [STATIC-SAVE] ${saveResult.success ? '✅ Saved' : '❌ Failed'}: ${pageSlug}`);

    // 🔄 AGGIORNA NAVBAR IN TUTTE LE PAGINE ESISTENTI
    if (websiteId) {
      await updateAllPagesNavbar(websiteId, businessName, pool);
    }

    // RESPONSE OTTIMIZZATA PER VENDIONLINE CON COST TRACKING
    res.json({
      success: true,
      htmlContent: cleanHTML, // ← Campo che si aspetta VendiOnline
      pageType: pageType,
      styleDNA: styleDNA,
      costInfo: costInfo, // 🆕 Informazioni sui costi
      staticSaved: saveResult.success, // 🆕 Conferma salvataggio statico
      metadata: {
        generated_at: new Date().toISOString(),
        page_type: pageType,
        business_name: businessName,
        content_length: cleanHTML.length,
        style_dna_score: styleDNA.extractionScore,
        colors_used: styleDNA.colors?.brandColors?.length || 0,
        fonts_used: Object.keys(styleDNA.typography?.fonts || {}).length,
        claude_model: 'claude-sonnet-4-20250514',
        generation_mode: generationMode,
        temperature: claudeConfig.temperature,
        max_tokens: claudeConfig.max_tokens
      }
    });

  } catch (error) {
    console.error('❌ Claude page generation error:', error);
    
    // 💰 SPECIFIC CLAUDE API ERROR HANDLING
    let errorMessage = error.message;
    let statusCode = 500;
    
    if (error.type === 'invalid_request_error') {
      if (error.error?.code === 'insufficient_quota') {
        errorMessage = 'Claude API credits exhausted. Please check billing.';
        statusCode = 402; // Payment Required
      } else if (error.error?.code === 'rate_limit_exceeded') {
        errorMessage = 'Claude API rate limit exceeded. Try again later.';
        statusCode = 429; // Too Many Requests
      }
    } else if (error.status === 401) {
      errorMessage = 'Claude API authentication failed. Check API key.';
      statusCode = 401;
    } else if (error.status === 403) {
      errorMessage = 'Claude API access forbidden. Check permissions.';
      statusCode = 403;
    }
    
    console.error(`💰 Claude API Error Details:
    - Type: ${error.type}
    - Status: ${error.status}
    - Code: ${error.error?.code}
    - Message: ${errorMessage}`);
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: 'Claude page generation failed',
      error_type: error.type,
      error_code: error.error?.code || 'unknown'
    });
  }
});

/**
 * 📁 SAVE PAGE TO STATIC FILES
 * Salva le pagine generate come file statici per il serving
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
    
    console.log(`✅ [STATIC-SAVE] Page saved: ${filePath}`);
    return { success: true, filePath };
    
  } catch (error) {
    console.error('❌ [STATIC-SAVE] Failed to save page:', error);
    return { success: false, error: error.message };
  }
}

module.exports = router;

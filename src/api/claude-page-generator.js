const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

// CLAUDE SONNET 4 - GENERAZIONE PAGINE SECONDARIE CON STYLE DNA
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

/**
 * 🚀 NAVBAR TEMPLATE INJECTION - Genera navbar dinamica da database
 */
async function generateNavbarFromDatabase(websiteId, businessName) {
  try {
    console.log('🔧 [NAVBAR-INJECTION] Generazione navbar per websiteId:', websiteId);
    
    // Se non abbiamo websiteId, generiamo navbar base
    if (!websiteId) {
      console.log('⚠️ [NAVBAR-INJECTION] WebsiteId mancante, usando navbar base');
      return generateBaseNavbar(businessName);
    }

    // 🌐 Chiamata API a VendiOnline-EU per ottenere le pagine
    const vendionlineUrl = process.env.VENDIONLINE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${vendionlineUrl}/api/website/menu-items?websiteId=${websiteId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Nota: L'autenticazione sarà gestita lato VendiOnline-EU
      }
    });

    if (!response.ok) {
      console.warn('⚠️ [NAVBAR-INJECTION] API fallita, usando navbar base');
      return generateBaseNavbar(businessName);
    }

    const data = await response.json();
    if (!data.success || !data.menuItems) {
      console.warn('⚠️ [NAVBAR-INJECTION] Dati invalidi, usando navbar base');
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

    console.log(`✅ [NAVBAR-INJECTION] Navbar generata con ${menuItems.length} menu items`);
    return navbarHtml;

  } catch (error) {
    console.error('❌ [NAVBAR-INJECTION] Errore:', error.message);
    return generateBaseNavbar(businessName);
  }
}

/**
 * 🎯 NAVBAR BASE - Fallback quando non abbiamo dati dal database
 */
function generateBaseNavbar(businessName) {
  console.log('🔧 [NAVBAR-INJECTION] Generazione navbar base per:', businessName);
  
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

REQUISITI DI COERENZA:
- NAVBAR: ${designConventions?.navbarHtml ? 'Usa ESATTAMENTE la struttura HTML fornita nelle convenzioni' : 'Replica identicamente la struttura di navigazione della homepage con gli stessi link e stile'}
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
- NAVBAR: ${designConventions?.navbarHtml ? 'Usa ESATTAMENTE la struttura HTML fornita nelle convenzioni' : 'Replica identicamente la struttura di navigazione della homepage con gli stessi link e stile'}
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
    <title>${pageType.charAt(0).toUpperCase() + pageType.slice(1)} - ${businessName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&display=swap');
        /* Custom styles con i colori Style DNA */
    </style>
</head>
<body>
    <!-- NAVBAR COERENTE: Mantieni sempre la stessa struttura di navigazione della homepage -->
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
2. NAVBAR: Usa il CODICE NAVBAR STANDARD della homepage (identico)
3. FOOTER: Copia identicamente footer della homepage
4. COLORI: Usa SOLO i colori specificati nel Style DNA
5. FONT: Mantieni typography coerente
6. CONTENUTO: Crea contenuto realistico e professionale
7. RESPONSIVE: Assicurati che tutto sia mobile-friendly
8. ANIMAZIONI: Include micro-animazioni e hover effects eleganti
9. Un solo div mobileMenu con id="mobileMenu" (non duplicare)

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

    // � NAVBAR TEMPLATE INJECTION - Sostituisce/aggiunge navbar dinamica
    console.log('🚀 [NAVBAR-INJECTION] Inizio sostituzione navbar...');
    
    try {
      const dynamicNavbar = await generateNavbarFromDatabase(websiteId, businessName);
      
      // Metodo 1: Sostituisci navbar esistente se presente
      if (cleanHTML.includes('<nav')) {
        console.log('🔄 [NAVBAR-INJECTION] Sostituzione navbar esistente...');
        cleanHTML = cleanHTML.replace(/<nav[\s\S]*?<\/nav>/gi, dynamicNavbar);
      } 
      // Metodo 2: Inserisci navbar dopo <body> se non presente
      else if (cleanHTML.includes('<body')) {
        console.log('🔧 [NAVBAR-INJECTION] Inserimento navbar dopo <body>...');
        cleanHTML = cleanHTML.replace(/<body([^>]*)>/i, `<body$1>\n${dynamicNavbar}`);
      }
      // Metodo 3: Inserisci all'inizio del contenuto
      else if (cleanHTML.includes('<html')) {
        console.log('🔧 [NAVBAR-INJECTION] Inserimento navbar all\'inizio...');
        const insertPoint = cleanHTML.indexOf('>') + 1;
        cleanHTML = cleanHTML.slice(0, insertPoint) + '\n' + dynamicNavbar + cleanHTML.slice(insertPoint);
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

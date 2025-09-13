const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

// CLAUDE SONNET 4 - GENERAZIONE PAGINE SECONDARIE CON STYLE DNA
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

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
- NAVBAR: Replica identicamente la struttura di navigazione della homepage con gli stessi link e stile
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
- NAVBAR: Replica identicamente la struttura di navigazione della homepage con gli stessi link e stile
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
- NAVBAR: Replica identicamente la struttura di navigazione della homepage con gli stessi link e stile
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

    // 🔧 POST-PROCESSING: Aggiungi automaticamente toggleMobileMenu se mancante
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

    // 🔧 SOLUZIONE DEFINITIVA: Forza SEMPRE l'aggiornamento con script corretto
    console.log('🔧 [FORCE-UPDATE-PAGE] Ensuring toggleMobileMenu is present...');
    
    // Forza sempre la presenza dello script (anche se già presente)
    const forceToggleScript = `
    <script>
    function toggleMobileMenu() {
        const menu = document.getElementById('mobileMenu');
        if (menu) {
            menu.classList.toggle('hidden');
        }
    }
    
    // Auto-attach event listener to hamburger button + SMART NAVBAR DETECTION
    document.addEventListener('DOMContentLoaded', function() {
        // 🔧 SMART HAMBURGER DETECTION: Cerca il pulsante in vari modi
        let hamburgerBtn = document.getElementById('hamburger-btn') || 
                          document.querySelector('button[onclick*="toggleMobileMenu"]') ||
                          document.querySelector('button i.fa-bars').parentElement;
        
        // Se non trova il burger button, cerca nelle navbar generiche
        if (!hamburgerBtn) {
            const navbar = document.querySelector('nav') || document.querySelector('header');
            if (navbar) {
                const allButtons = navbar.querySelectorAll('button');
                for (const btn of allButtons) {
                    if (btn.innerHTML.includes('fa-bars') || btn.innerHTML.includes('☰') || btn.innerHTML.includes('menu')) {
                        hamburgerBtn = btn;
                        hamburgerBtn.id = 'hamburger-btn';
                        break;
                    }
                }
            }
        }
        
        // Attach toggle function
        if (hamburgerBtn) {
            hamburgerBtn.onclick = toggleMobileMenu;
        }
        
        // 🔧 SMART MOBILE MENU DETECTION: Se manca il menu mobile, prova a identificarlo
        let mobileMenu = document.getElementById('mobileMenu');
        if (!mobileMenu) {
            // Cerca menu nascosti o con classi simili
            const possibleMenus = document.querySelectorAll('.mobile-menu, .nav-menu, [class*="mobile"], [class*="menu"]');
            for (const menu of possibleMenus) {
                if (menu.style.display === 'none' || menu.classList.contains('hidden')) {
                    menu.id = 'mobileMenu';
                    mobileMenu = menu;
                    break;
                }
            }
        }
        
        // 🎯 HYBRID SMART MENU SYSTEM: Carica menu items dinamicamente
        loadDynamicMenuItems();
    });
    
    // 🚀 HYBRID SMART MENU: Auto-populate menu links da database
    async function loadDynamicMenuItems() {
        console.log('🚀 [SMART-MENU] Inizio caricamento menu dinamico...');
        try {
            // Estrai websiteId dall'URL o da meta tag
            const websiteId = getWebsiteId();
            console.log('🔍 [SMART-MENU] WebsiteId trovato:', websiteId);
            if (!websiteId) {
                console.log('❌ [SMART-MENU] WebsiteId non trovato, usando menu statico');
                return;
            }
            
            console.log('📞 [SMART-MENU] Chiamata API:', \`/api/website/menu-items?websiteId=\${websiteId}\`);
            const response = await fetch(\`/api/website/menu-items?websiteId=\${websiteId}\`);
            console.log('📡 [SMART-MENU] Response status:', response.status);
            if (!response.ok) {
                throw new Error(\`HTTP \${response.status}\`);
            }
            
            const data = await response.json();
            if (!data.success || !data.menuItems) {
                throw new Error('Invalid response format');
            }
            
            // 🔧 Trova i container del menu (desktop e mobile)
            console.log('🔍 [SMART-MENU] Ricerca container menu...');
            const menuContainers = [
                document.querySelector('#mobileMenu ul'),
                document.querySelector('#mobileMenu nav'),
                document.querySelector('nav ul'),
                document.querySelector('.mobile-menu ul'),
                document.querySelector('.nav-menu')
            ].filter(Boolean);
            
            console.log('📋 [SMART-MENU] Container trovati:', menuContainers.length);
            menuContainers.forEach((container, index) => {
                console.log(\`📋 [SMART-MENU] Container \${index}:\`, container.tagName, container.className, container.id);
            });
            
            if (menuContainers.length === 0) {
                console.log('❌ [SMART-MENU] Nessun container menu trovato - elementi disponibili:');
                console.log('- #mobileMenu:', document.querySelector('#mobileMenu'));
                console.log('- nav:', document.querySelector('nav'));
                console.log('- .mobile-menu:', document.querySelector('.mobile-menu'));
                return;
            }
            
            // 🎯 Rimuovi link dinamici esistenti (se presenti)
            menuContainers.forEach(container => {
                const dynamicLinks = container.querySelectorAll('[data-dynamic-menu]');
                dynamicLinks.forEach(link => link.remove());
            });
            
            // 🚀 Aggiungi i nuovi menu items (escludi homepage)
            const secondaryPages = data.menuItems.filter(item => !item.isHomepage);
            
            menuContainers.forEach(container => {
                secondaryPages.forEach(page => {
                    const li = document.createElement('li');
                    li.setAttribute('data-dynamic-menu', 'true');
                    li.innerHTML = \`<a href="\${page.href}" class="menu-link block px-4 py-2 text-gray-700 hover:bg-gray-100">\${page.name}</a>\`;
                    container.appendChild(li);
                });
            });
            
            console.log(\`✅ [SMART-MENU] Caricati \${secondaryPages.length} menu items dinamici\`);
            
        } catch (error) {
            console.log('🔄 [SMART-MENU] Fallback su menu statico:', error.message);
        }
    }
    
    // 🔍 Utility: Estrai websiteId dall'URL o meta tags
    function getWebsiteId() {
        console.log('🔍 [SMART-MENU] Ricerca websiteId...');
        
        // Metodo 1: Da meta tag (se presente)
        const metaWebsiteId = document.querySelector('meta[name="website-id"]');
        console.log('🏷️ [SMART-MENU] Meta tag website-id:', metaWebsiteId);
        if (metaWebsiteId) {
            const id = metaWebsiteId.getAttribute('content');
            console.log('✅ [SMART-MENU] WebsiteId da meta tag:', id);
            return id;
        }
        
        // Metodo 2: Da URL params (se presente)
        const urlParams = new URLSearchParams(window.location.search);
        const websiteId = urlParams.get('websiteId');
        console.log('🔗 [SMART-MENU] WebsiteId da URL params:', websiteId);
        if (websiteId) {
            console.log('✅ [SMART-MENU] WebsiteId da URL:', websiteId);
            return websiteId;
        }
        
        // Metodo 3: Da localStorage (se presente)
        try {
            const stored = localStorage.getItem('currentWebsiteId');
            console.log('💾 [SMART-MENU] WebsiteId da localStorage:', stored);
            if (stored) {
                console.log('✅ [SMART-MENU] WebsiteId da storage:', stored);
                return stored;
            }
        } catch (e) {
            // localStorage non disponibile
        }
        
        return null;
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
    
    // 🎯 HYBRID SMART MENU: Aggiungi meta tag websiteId se presente
    if (websiteId && cleanHTML.includes('<head>')) {
      const websiteMetaTag = `<meta name="website-id" content="${websiteId}">`;
      cleanHTML = cleanHTML.replace('<head>', `<head>\n    ${websiteMetaTag}`);
      console.log('✅ [HYBRID-MENU] WebsiteId meta tag added for smart menu system');
    }
    
    if (cleanHTML.includes('</body>')) {
      cleanHTML = cleanHTML.replace('</body>', `${forceToggleScript}\n</body>`);
      console.log('✅ [FORCE-UPDATE-PAGE] toggleMobileMenu script with auto-attach forcibly added before </body>');
    } else {
      cleanHTML += forceToggleScript;
      console.log('✅ [FORCE-UPDATE-PAGE] toggleMobileMenu script with auto-attach forcibly added at end');
    }

    console.log('🧹 HTML cleaning: Original length:', htmlContent.length, ', Clean length:', cleanHTML.length);

    // VERIFICA CHE SIA HTML VALIDO
    if (!cleanHTML.includes('<!DOCTYPE html>') && !cleanHTML.includes('<html')) {
      throw new Error('Generated content is not valid HTML');
    }

    // RESPONSE OTTIMIZZATA PER VENDIONLINE CON COST TRACKING
    res.json({
      success: true,
      htmlContent: cleanHTML, // ← Campo che si aspetta VendiOnline
      pageType: pageType,
      styleDNA: styleDNA,
      costInfo: costInfo, // 🆕 Informazioni sui costi
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

module.exports = router;

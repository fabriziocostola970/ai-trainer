/**
 * 🚀 NAVBAR GENERATOR - Gestione dinamica menu da database website_pages
 * 
 * Questo modulo genera navbar dinamiche che leggono le pagine reali 
 * dalla tabella website_pages del database PostgreSQL.
 */

/**
 * 🎯 NAVBAR DINAMICA PRINCIPALE - Legge pagine da website_pages
 * @param {string} websiteId - ID del website
 * @param {string} businessName - Nome del business
 * @param {object} pool - Pool PostgreSQL connection
 * @returns {string} HTML navbar completa
 */
async function generateDynamicNavbar(websiteId, businessName, pool) {
  console.log('🚀 [NAVBAR-GENERATOR] Generazione navbar per websiteId:', websiteId);
  
  try {
    // 📊 QUERY PAGINE DAL DATABASE
    const pagesQuery = `
      SELECT id, name, slug, "pageType", "pageOrder", "isHomepage", "isActive"
      FROM website_pages 
      WHERE "websiteId" = $1 AND "isActive" = true
      ORDER BY "pageOrder" ASC, "createdAt" ASC
    `;
    
    const result = await pool.query(pagesQuery, [websiteId]);
    const pages = result.rows;
    
    console.log(`📄 [NAVBAR-GENERATOR] Trovate ${pages.length} pagine attive per navbar`);
    
    if (pages.length === 0) {
      console.log('⚠️ [NAVBAR-GENERATOR] Nessuna pagina trovata, usando navbar base');
      return generateStaticNavbar(businessName, []);
    }
    
    // 🏠 Trova la home page
    const homePage = pages.find(page => page.isHomepage || page.pageType === 'homepage');
    
    // 📄 Pagine secondarie (escludendo la homepage)
    const secondaryPages = pages.filter(page => !page.isHomepage && page.pageType !== 'homepage');
    
    console.log(`🏠 Homepage: ${homePage?.name || 'Non trovata'}`);
    console.log(`📄 Pagine secondarie: ${secondaryPages.map(p => p.name).join(', ')}`);
    
    // 🎨 Costruisci array menu items
    const menuItems = [
      {
        name: 'Home',
        href: '/',
        isHomepage: true,
        pageType: 'homepage'
      }
    ];
    
    // Aggiungi pagine secondarie
    secondaryPages.forEach(page => {
      menuItems.push({
        name: page.name,
        href: `/${page.slug}`,
        pageType: page.pageType,
        pageOrder: page.pageOrder
      });
    });
    
    console.log(`🎯 [NAVBAR-GENERATOR] Menu finale con ${menuItems.length} items:`, 
                menuItems.map(m => m.name).join(', '));
    
    // 🎨 Genera navbar usando la funzione statica
    return generateStaticNavbar(businessName, menuItems);
    
  } catch (error) {
    console.error('❌ [NAVBAR-GENERATOR] Errore database:', error.message);
    // Fallback navbar base
    return generateStaticNavbar(businessName, []);
  }
}

/**
 * 🎨 NAVBAR STATICA RESPONSIVE - Template base per tutte le navbar
 * @param {string} businessName - Nome del business per il logo
 * @param {array} menuItems - Array di oggetti menu item dal database
 * @returns {string} HTML navbar completa con JavaScript
 */
function generateStaticNavbar(businessName, menuItems = []) {
  console.log(`🎨 [NAVBAR-STATIC] Generazione navbar per: ${businessName} con ${menuItems.length} menu items`);
  
  // ✅ DEFAULT: Solo HOME se non ci sono menu items
  const defaultMenuItems = [
    { name: 'Home', href: '/', isHomepage: true }
  ];
  
  // Se abbiamo menu items dal DB, usali, altrimenti usa default
  let finalMenuItems = menuItems.length > 0 ? menuItems : defaultMenuItems;
  
  // Assicurati che ci sia sempre Home come primo elemento
  const hasHome = finalMenuItems.some(item => item.isHomepage);
  if (!hasHome) {
    finalMenuItems = [defaultMenuItems[0], ...finalMenuItems];
  }
  
  return `
  <!-- 🎨 NAVBAR DINAMICA RESPONSIVE -->
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
        
        <!-- 💻 DESKTOP MENU -->
        <div class="hidden md:flex md:items-center md:space-x-1">
          ${finalMenuItems.map(item => `
            <a href="${item.href}" 
               class="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-105"
               ${item.isHomepage ? 'aria-current="page"' : ''}>
              ${item.name}
            </a>
          `).join('')}
        </div>
        
        <!-- 📱 MOBILE HAMBURGER BUTTON -->
        <div class="block md:hidden">
          <button id="hamburger-btn" 
                  type="button" 
                  class="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  aria-controls="mobile-menu" 
                  aria-expanded="false"
                  aria-label="Toggle main menu">
            <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 📱 MOBILE MENU -->
    <div id="mobileMenu" 
         class="hidden md:hidden bg-white border-t border-gray-200 shadow-lg"
         role="menu" 
         aria-orientation="vertical" 
         aria-labelledby="hamburger-btn">
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
  
  <!-- 📏 SPACER per navbar fixed -->
  <div class="h-16" aria-hidden="true"></div>
  
  <!-- 🎯 JAVASCRIPT MOBILE MENU - Sempre Funzionante -->
  <script>
    console.log('🚀 [NAVBAR] Inizializzazione navbar con ${finalMenuItems.length} menu items');
    
    function toggleMobileMenu() {
      const menu = document.getElementById('mobileMenu');
      const button = document.getElementById('hamburger-btn');
      
      if (menu && button) {
        const isHidden = menu.classList.contains('hidden');
        
        if (isHidden) {
          menu.classList.remove('hidden');
          button.setAttribute('aria-expanded', 'true');
          console.log('✅ [NAVBAR] Mobile menu aperto');
        } else {
          menu.classList.add('hidden');
          button.setAttribute('aria-expanded', 'false');
          console.log('✅ [NAVBAR] Mobile menu chiuso');
        }
      }
    }
    
    // Auto-attach al caricamento DOM
    document.addEventListener('DOMContentLoaded', function() {
      const hamburgerBtn = document.getElementById('hamburger-btn');
      if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleMobileMenu);
        console.log('✅ [NAVBAR] Event listener collegato al pulsante hamburger');
      }
      
      // Chiudi menu mobile quando si clicca fuori
      document.addEventListener('click', function(event) {
        const menu = document.getElementById('mobileMenu');
        const button = document.getElementById('hamburger-btn');
        
        if (menu && !menu.classList.contains('hidden') && 
            !menu.contains(event.target) && 
            !button.contains(event.target)) {
          menu.classList.add('hidden');
          button.setAttribute('aria-expanded', 'false');
          console.log('✅ [NAVBAR] Menu mobile chiuso (click esterno)');
        }
      });
      
      console.log('✅ [NAVBAR] Navbar completamente inizializzata');
    });
  </script>`;
}

/**
 * 🎯 NAVBAR BASE FALLBACK - Quando non ci sono pagine nel database
 * @param {string} businessName - Nome del business
 * @returns {string} HTML navbar base con menu standard
 */
function generateBaseNavbar(businessName) {
  console.log('🔧 [NAVBAR-BASE] Generazione navbar fallback per:', businessName);
  
  const defaultMenuItems = [
    { name: 'Home', href: '/', isHomepage: true },
    { name: 'Chi Siamo', href: '/chi-siamo', pageType: 'about' },
    { name: 'Servizi', href: '/servizi', pageType: 'services' },
    { name: 'Contatti', href: '/contatti', pageType: 'contact' }
  ];
  
  return generateStaticNavbar(businessName, defaultMenuItems);
}

// 📤 EXPORTS
module.exports = {
  generateDynamicNavbar,
  generateStaticNavbar,
  generateBaseNavbar
};
// 📚 Training Data Collection Strategy
// Definisce come raccogliere e processare i dati per training

const TRAINING_DATA_SOURCES = {
  
  // 🌟 HIGH-QUALITY SOURCES (Manuale curato)
  premium: {
    awwwards: {
      url: "https://www.awwwards.com/",
      focus: "Design innovation, creatività, UX excellence",
      extraction: "screenshot + HTML inspection",
      categories: ["ecommerce", "portfolio", "corporate", "startup"],
      samplesPerCategory: 25
    },
    
    dribbble: {
      url: "https://dribbble.com/",
      focus: "Design trends, visual patterns, creativity",
      extraction: "screenshot analysis",
      categories: ["web-design", "ui-ux", "landing-page"],
      samplesPerCategory: 50
    },
    
    landingfolio: {
      url: "https://www.landingfolio.com/",
      focus: "Landing page optimization, conversion",
      extraction: "full page analysis",
      categories: ["saas", "ecommerce", "agency", "startup"],
      samplesPerCategory: 30
    }
  },

  // 🏢 BUSINESS-SPECIFIC SOURCES
  businessTypes: {
    restaurants: {
      sources: ["yelp featured", "michelin guide", "local top rated"],
      focusAreas: ["menu showcase", "reservation system", "location", "gallery"]
    },
    
    ecommerce: {
      sources: ["shopify examples", "top converting stores", "amazon layouts"],
      focusAreas: ["product display", "checkout flow", "search", "filters"]
    },
    
    agencies: {
      sources: ["top agencies websites", "award winning portfolios"],
      focusAreas: ["portfolio display", "case studies", "team", "contact"]
    },
    
    startups: {
      sources: ["unicorn company sites", "y-combinator portfolio"],
      focusAreas: ["product demo", "pricing", "features", "testimonials"]
    }
  },

  // 🤖 AUTOMATED COLLECTION
  automated: {
    googleAnalytics: {
      source: "Top performing pages",
      metrics: ["bounce rate", "conversion rate", "time on page"],
      extraction: "performance + design correlation"
    },
    
    competitorAnalysis: {
      source: "Industry leaders",
      approach: "Automated scanning of top 10 in each industry",
      extraction: "pattern recognition"
    }
  }
};

// 📊 DATA STRUCTURE per ogni sample
const TRAINING_SAMPLE_STRUCTURE = {
  id: "unique_identifier",
  
  // 📄 HTML Layer
  html: {
    rawHTML: "complete HTML source",
    semanticStructure: {
      navigation: { type: "horizontal", hasDropdown: true },
      contentSections: ["hero", "features", "testimonials", "contact"],
      interactiveElements: ["forms", "buttons", "sliders"],
      accessibilityFeatures: ["alt-tags", "aria-labels", "semantic-html"]
    },
    performance: {
      loadTime: 2.3,
      lighthouse: { performance: 95, accessibility: 98, seo: 92 },
      coreWebVitals: { lcp: 1.8, fid: 45, cls: 0.02 }
    }
  },

  // 🖼️ Visual Layer  
  visual: {
    screenshots: {
      desktop: "url_to_desktop_screenshot",
      tablet: "url_to_tablet_screenshot", 
      mobile: "url_to_mobile_screenshot"
    },
    designAnalysis: {
      colorPalette: ["#667EEA", "#764BA2", "#F093FB"],
      typography: { primary: "Inter", secondary: "Source Sans Pro" },
      layoutGrid: { type: "12-column", gutters: 24 },
      visualHierarchy: ["hero", "value-proposition", "features", "cta"],
      designStyle: "minimalist-modern"
    }
  },

  // 🏢 Business Layer
  business: {
    type: "restaurant",
    industry: "hospitality", 
    targetAudience: ["food-lovers", "local-diners", "tourists"],
    goals: ["increase-reservations", "showcase-menu", "build-brand"],
    conversionElements: [
      { type: "reservation-button", position: "header", conversion: "high" },
      { type: "menu-cta", position: "hero", conversion: "medium" }
    ]
  },

  // 📈 Performance Metrics
  metrics: {
    designQuality: 92,      // Visual appeal, modern design
    usabilityScore: 88,     // UX, navigation, accessibility  
    conversionRate: 4.2,    // Business goal achievement
    technicalQuality: 95,   // Code quality, performance
    creativityScore: 87,    // Innovation, uniqueness
    overallRating: 91       // Weighted average
  },

  // 🎯 Perfect Template Output
  idealOutput: {
    templateName: "Restaurant Elegant Pro",
    structure: ["navigation-sticky", "hero-image", "menu-showcase", "location-map", "reservation-form"],
    styling: {
      colors: ["#2C3E50", "#E8D5B7", "#8B4513"],
      fonts: ["Playfair Display", "Source Sans Pro"],
      layout: "image-focused-grid"
    },
    customBlocks: ["interactive-menu", "reservation-calendar", "chef-story"],
    businessOptimizations: ["local-seo", "mobile-first", "fast-loading"]
  }
};

// 🔧 DATA COLLECTION WORKFLOW
const COLLECTION_WORKFLOW = {
  
  // Phase 1: Manual High-Quality Collection (Week 1)
  phase1: {
    target: "100 premium examples",
    approach: "Manual curation from Awwwards + Dribbble",
    output: "25 samples per business type (restaurant, ecommerce, portfolio, agency)",
    timeframe: "3-5 days"
  },

  // Phase 2: Business-Specific Deep Dive (Week 2)  
  phase2: {
    target: "200 business-specific examples",
    approach: "Industry leader analysis + competitor research",
    output: "50 samples per major business category",
    timeframe: "5-7 days"
  },

  // Phase 3: Automated Scale (Week 3+)
  phase3: {
    target: "1000+ examples", 
    approach: "Automated crawling + AI analysis",
    output: "Comprehensive training dataset",
    timeframe: "Ongoing"
  }
};

module.exports = {
  TRAINING_DATA_SOURCES,
  TRAINING_SAMPLE_STRUCTURE, 
  COLLECTION_WORKFLOW
};

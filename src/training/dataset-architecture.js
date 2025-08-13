// 🎯 Multi-Modal Training Dataset Architecture
// Combina HTML, Screenshots, Business Data e AI Analysis

const DATASET_ARCHITECTURE = {
  
  // 📁 STRUCTURE
  structure: {
    "data/": {
      "training-samples/": {
        "sample-001-restaurant-elegant/": {
          "metadata.json": "Business type, goals, target audience",
          "source.html": "Complete HTML source code",
          "screenshots/": {
            "desktop-1920.png": "Full page desktop screenshot",
            "tablet-768.png": "Tablet responsive view",
            "mobile-375.png": "Mobile responsive view",
            "sections/": {
              "header.png": "Navigation section",
              "hero.png": "Hero section", 
              "menu.png": "Menu showcase section",
              "footer.png": "Footer section"
            }
          },
          "analysis/": {
            "html-analysis.json": "Automated HTML structure analysis",
            "visual-analysis.json": "AI-generated visual pattern analysis",
            "business-analysis.json": "Business alignment scoring",
            "perfect-template.json": "AI-generated ideal template"
          },
          "performance/": {
            "lighthouse.json": "Performance metrics",
            "accessibility.json": "A11y analysis",
            "seo.json": "SEO evaluation"
          }
        }
      },
      "processed/": {
        "training-vectors.json": "Processed embeddings for AI training",
        "visual-patterns.json": "Extracted visual design patterns", 
        "business-mappings.json": "Business type → design correlations"
      }
    }
  },

  // 🎨 SAMPLE STRUCTURE
  sampleStructure: {
    id: "sample-001-restaurant-elegant",
    
    // 📄 SOURCE DATA
    source: {
      html: "<!DOCTYPE html>...", // Complete HTML
      url: "https://example-restaurant.com",
      collectionDate: "2025-08-13",
      collectionMethod: "manual" // manual, automated, api
    },

    // 🏢 BUSINESS METADATA
    business: {
      type: "restaurant",
      industry: "hospitality",
      style: "elegant-modern", 
      targetAudience: ["food-lovers", "date-night", "business-lunch"],
      geography: "urban-italy",
      priceRange: "mid-to-high",
      businessGoals: ["increase-reservations", "showcase-menu", "build-brand"]
    },

    // 🖼️ VISUAL DATA
    visual: {
      screenshots: {
        desktop: "screenshots/desktop-1920.png",
        tablet: "screenshots/tablet-768.png", 
        mobile: "screenshots/mobile-375.png"
      },
      sections: {
        header: "screenshots/sections/header.png",
        hero: "screenshots/sections/hero.png",
        menu: "screenshots/sections/menu.png", 
        about: "screenshots/sections/about.png",
        contact: "screenshots/sections/contact.png",
        footer: "screenshots/sections/footer.png"
      }
    },

    // 🧠 AI ANALYSIS (Auto-generated)
    analysis: {
      htmlStructure: {
        semanticElements: ["header", "nav", "main", "section", "footer"],
        navigationPattern: "horizontal-sticky",
        contentSections: ["hero", "menu", "about", "location", "contact"],
        interactiveElements: ["reservation-form", "menu-filter", "gallery"],
        accessibilityScore: 92
      },
      
      visualPatterns: {
        colorPalette: ["#2C3E50", "#E8D5B7", "#8B4513", "#F4F4F4"],
        typography: {
          primary: "Playfair Display",
          secondary: "Source Sans Pro",
          fontSizes: [48, 36, 24, 18, 16]
        },
        layoutGrid: {
          type: "12-column",
          gutters: 24,
          breakpoints: [1200, 768, 576]
        },
        designStyle: "elegant-minimal",
        visualHierarchy: ["hero-image", "value-prop", "menu-preview", "cta"]
      },

      businessAlignment: {
        targetAudienceMatch: 94,
        industryStandardsCompliance: 91, 
        conversionOptimization: 88,
        brandConsistency: 95,
        userExperienceScore: 89
      }
    },

    // 🎯 PERFECT TEMPLATE (Training Target)
    perfectTemplate: {
      name: "Restaurant Elegant Pro",
      structure: ["navigation-sticky", "hero-image-large", "menu-interactive", "chef-story", "location-map", "reservation-system"],
      styling: {
        colors: ["#2C3E50", "#E8D5B7", "#8B4513", "#F4F4F4"],
        fonts: ["Playfair Display", "Source Sans Pro"],
        layout: "image-focused-grid"
      },
      customBlocks: [
        "interactive-menu-with-allergens",
        "chef-video-story", 
        "table-reservation-calendar",
        "wine-pairing-suggestions"
      ],
      businessOptimizations: [
        "local-seo-optimization",
        "mobile-reservation-flow",
        "social-media-integration",
        "review-showcase-system"
      ],
      scores: {
        creativity: 87,
        businessAlignment: 94,
        technicalQuality: 91,
        overallRating: 91
      }
    }
  }
};

module.exports = DATASET_ARCHITECTURE;

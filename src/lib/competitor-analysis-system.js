/**
 * 🤖 AI-TRAINER COMPETITOR ANALYSIS SYSTEM
 *
 * Sistema avanzato per l'analisi e raccolta di pattern di design da competitor.
 * Integra OpenAI per generazione competitor, scraping automatico e analisi design.
 *
 * 🎯 CARATTERISTICHE:
 * - Controllo automatico numero competitor per business_type
 * - Generazione competitor con OpenAI se < 30
 * - Scraping completo siti competitor
 * - Analisi design avanzata (colori, font, layout)
 * - Raccolta immagini Unsplash contestuali
 * - Salvataggio pattern nel database ai_design_patterns
 *
 * 🔄 FLUSSO DI LAVORO:
 * 1. Controllo competitor esistenti nel database
 * 2. Generazione competitor con OpenAI se necessario
 * 3. Scraping e analisi design di ogni competitor
 * 4. Raccolta immagini Unsplash per business_type
 * 5. Salvataggio completo nel database
 */

const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');
const puppeteer = require('puppeteer');
// const fetch = require('node-fetch'); // Rimosso - usiamo fetch nativo di Node.js

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class CompetitorAnalysisSystem {

  /**
   * 🔍 CONTROLLA QUANTI COMPETITOR ABBIAMO PER UN BUSINESS TYPE
   */
  static async checkCompetitorCount(businessType) {
    console.log(`🔍 Controllo competitor per: ${businessType}`);

    const result = await prisma.ai_design_patterns.count({
      where: {
        business_type: businessType,
        status: 'active'
      }
    });

    console.log(`📊 Trovati ${result} competitor per ${businessType}`);
    return result;
  }

  /**
   * 🤖 GENERA COMPETITOR CON OPENAI
   */
  static async generateCompetitorsWithOpenAI(businessType, targetCount = 30) {
    console.log(`🤖 Generazione ${targetCount} competitor per ${businessType} con OpenAI`);

    const prompt = `Trova ${targetCount} siti web italiani reali di competitor per un business "${businessType}".

Restituisci SOLO un JSON array nel formato:
[
  {
    "name": "Nome Azienda Reale",
    "url": "https://sito-reale.it",
    "description": "Breve descrizione del business"
  }
]

Requisiti:
- Solo siti italiani esistenti e reali
- Business locali e nazionali
- Siti che probabilmente usano immagini Unsplash/stock
- No grandi corporation con copyright strict
- Focus su piccole-medie imprese
- URLs valide e funzionanti`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      });

      const competitors = JSON.parse(response.choices[0].message.content);
      console.log(`✅ Generati ${competitors.length} competitor con OpenAI`);

      return competitors;
    } catch (error) {
      console.error('❌ Errore generazione competitor con OpenAI:', error);
      throw error;
    }
  }

  /**
   * 🕷️ SCRAPING COMPLETO DI UN SITO COMPETITOR
   */
  static async scrapeCompetitorSite(competitorUrl, businessType) {
    console.log(`🕷️ Scraping sito: ${competitorUrl}`);

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      // Timeout e gestione errori
      await page.goto(competitorUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Estrazione HTML completo
      const htmlContent = await page.content();

      // Estrazione CSS da tutti gli stylesheet
      const cssContent = await page.evaluate(() => {
        const styles = Array.from(document.styleSheets);
        return styles.map(sheet => {
          try {
            return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
          } catch (e) {
            return '';
          }
        }).join('\n');
      });

      // Analisi design completa
      const designData = await this.analyzeDesign(htmlContent, cssContent);

      // Raccolta immagini dal sito
      const siteImages = await this.extractImagesFromSite(page);

      // Raccolta immagini Unsplash contestuali
      const unsplashImages = await this.collectUnsplashImages(businessType);

      await browser.close();

      return {
        htmlContent,
        cssContent,
        designData,
        siteImages,
        unsplashImages
      };

    } catch (error) {
      console.error(`❌ Errore scraping ${competitorUrl}:`, error);
      if (browser) await browser.close();
      throw error;
    }
  }

  /**
   * 🎨 ANALISI DESIGN AVANZATA
   */
  static async analyzeDesign(htmlContent, cssContent) {
    // Estrazione palette colori
    const colorPalette = this.extractColorPalette(cssContent, htmlContent);

    // Estrazione font families
    const fontFamilies = this.extractFontFamilies(cssContent, htmlContent);

    // Analisi struttura layout
    const layoutStructure = this.analyzeLayoutStructure(htmlContent);

    // Analisi semantica
    const semanticAnalysis = this.analyzeSemanticStructure(htmlContent);

    // Metriche performance (simulate)
    const performanceMetrics = this.calculatePerformanceMetrics(htmlContent, cssContent);

    // Score accessibilità
    const accessibilityScore = this.calculateAccessibilityScore(htmlContent);

    // Score design
    const designScore = this.calculateDesignScore(colorPalette, fontFamilies, layoutStructure);

    // Responsive check
    const mobileResponsive = this.checkMobileResponsive(cssContent);

    return {
      colorPalette,
      fontFamilies,
      layoutStructure,
      semanticAnalysis,
      performanceMetrics,
      accessibilityScore,
      designScore,
      mobileResponsive
    };
  }

  /**
   * 🎨 ESTRAZIONE PALETTE COLORI
   */
  static extractColorPalette(cssContent, htmlContent) {
    const colors = new Set();

    // Regex per colori CSS
    const colorRegex = /#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)/g;

    // Estrazione da CSS
    const cssMatches = cssContent.match(colorRegex) || [];
    cssMatches.forEach(match => colors.add(match));

    // Estrazione da HTML inline styles
    const htmlMatches = htmlContent.match(colorRegex) || [];
    htmlMatches.forEach(match => colors.add(match));

    return {
      primary: Array.from(colors).slice(0, 5), // Top 5 colori
      all: Array.from(colors),
      count: colors.size
    };
  }

  /**
   * 🔤 ESTRAZIONE FONT FAMILIES
   */
  static extractFontFamilies(cssContent, htmlContent) {
    const fonts = new Set();

    // Regex per font-family
    const fontRegex = /font-family:\s*([^;]+);?/gi;

    const matches = cssContent.match(fontRegex) || [];
    matches.forEach(match => {
      const fontValue = match.replace(/font-family:\s*/i, '').replace(/;/g, '').trim();
      fonts.add(fontValue);
    });

    return {
      primary: Array.from(fonts).slice(0, 3), // Top 3 font families
      all: Array.from(fonts),
      count: fonts.size
    };
  }

  /**
   * 📐 ANALISI STRUTTURA LAYOUT
   */
  static analyzeLayoutStructure(htmlContent) {
    // Analisi struttura HTML
    const sections = (htmlContent.match(/<section[^>]*>[\s\S]*?<\/section>/gi) || []).length;
    const divs = (htmlContent.match(/<div[^>]*>[\s\S]*?<\/div>/gi) || []).length;
    const headers = (htmlContent.match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi) || []).length;

    return {
      sections,
      divs,
      headers,
      structure: {
        hasHero: htmlContent.includes('hero') || htmlContent.includes('banner'),
        hasNavigation: htmlContent.includes('nav') || htmlContent.includes('menu'),
        hasFooter: htmlContent.includes('footer'),
        hasSidebar: htmlContent.includes('sidebar') || htmlContent.includes('aside'),
        hasGrid: cssContent.includes('grid') || cssContent.includes('flex'),
        hasResponsive: cssContent.includes('@media')
      }
    };
  }

  /**
   * 🧠 ANALISI SEMANTICA
   */
  static analyzeSemanticStructure(htmlContent) {
    const semanticElements = {
      header: (htmlContent.match(/<header[^>]*>/gi) || []).length,
      nav: (htmlContent.match(/<nav[^>]*>/gi) || []).length,
      main: (htmlContent.match(/<main[^>]*>/gi) || []).length,
      article: (htmlContent.match(/<article[^>]*>/gi) || []).length,
      aside: (htmlContent.match(/<aside[^>]*>/gi) || []).length,
      footer: (htmlContent.match(/<footer[^>]*>/gi) || []).length,
      section: (htmlContent.match(/<section[^>]*>/gi) || []).length
    };

    return {
      semanticScore: Object.values(semanticElements).reduce((a, b) => a + b, 0),
      elements: semanticElements,
      hasSemanticStructure: Object.values(semanticElements).some(count => count > 0)
    };
  }

  /**
   * ⚡ CALCOLO METRICHE PERFORMANCE
   */
  static calculatePerformanceMetrics(htmlContent, cssContent) {
    const htmlSize = Buffer.byteLength(htmlContent, 'utf8');
    const cssSize = Buffer.byteLength(cssContent, 'utf8');

    return {
      htmlSizeKB: Math.round(htmlSize / 1024),
      cssSizeKB: Math.round(cssSize / 1024),
      totalSizeKB: Math.round((htmlSize + cssSize) / 1024),
      cssRules: (cssContent.match(/\{[^}]*\}/g) || []).length,
      mediaQueries: (cssContent.match(/@media/gi) || []).length
    };
  }

  /**
   * ♿ CALCOLO SCORE ACCESSIBILITÀ
   */
  static calculateAccessibilityScore(htmlContent) {
    let score = 100;

    // Penalità per mancanza di alt text
    const imagesWithoutAlt = (htmlContent.match(/<img[^>]*>/gi) || [])
      .filter(img => !img.includes('alt=')).length;
    score -= imagesWithoutAlt * 5;

    // Penalità per mancanza di labels
    const inputsWithoutLabels = (htmlContent.match(/<input[^>]*>/gi) || [])
      .filter(input => !htmlContent.includes(`for="${input.match(/id="([^"]*)"/)?.[1]}"`)).length;
    score -= inputsWithoutLabels * 3;

    // Penalità per contrasto colori (semplificato)
    if (!htmlContent.includes('color:')) score -= 10;

    return Math.max(0, score);
  }

  /**
   * 🎨 CALCOLO SCORE DESIGN
   */
  static calculateDesignScore(colorPalette, fontFamilies, layoutStructure) {
    let score = 50; // Base score

    // Bonus per varietà colori
    if (colorPalette.count > 3) score += 15;
    if (colorPalette.count > 5) score += 10;

    // Bonus per font families
    if (fontFamilies.count > 1) score += 10;
    if (fontFamilies.count > 2) score += 5;

    // Bonus per struttura layout
    if (layoutStructure.structure.hasHero) score += 10;
    if (layoutStructure.structure.hasNavigation) score += 5;
    if (layoutStructure.structure.hasFooter) score += 5;
    if (layoutStructure.structure.hasGrid) score += 10;
    if (layoutStructure.structure.hasResponsive) score += 15;

    return Math.min(100, score);
  }

  /**
   * 📱 CHECK RESPONSIVE DESIGN
   */
  static checkMobileResponsive(cssContent) {
    const hasMediaQueries = cssContent.includes('@media');
    const hasFlexbox = cssContent.includes('display: flex') || cssContent.includes('flex');
    const hasGrid = cssContent.includes('display: grid') || cssContent.includes('grid');

    return hasMediaQueries && (hasFlexbox || hasGrid);
  }

  /**
   * 🖼️ ESTRAZIONE IMMAGINI DAL SITO
   */
  static async extractImagesFromSite(page) {
    return await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.map(img => ({
        src: img.src,
        alt: img.alt || '',
        width: img.width || img.naturalWidth,
        height: img.height || img.naturalHeight,
        className: img.className
      })).filter(img => img.src && !img.src.includes('data:'));
    });
  }

  /**
   * 📸 RACCOLTA IMMAGINI UNSPLASH
   */
  static async collectUnsplashImages(businessType) {
    const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

    if (!UNSPLASH_ACCESS_KEY) {
      console.warn('⚠️ UNSPLASH_ACCESS_KEY non configurata');
      return [];
    }

    try {
      // Query per business type
      const queries = {
        'ristorante': 'restaurant food italian cuisine',
        'parrucchiere': 'hair salon beauty hairstyle',
        'fioraio': 'flowers florist bouquet',
        'meccanico': 'car mechanic workshop auto',
        'default': `${businessType} business professional`
      };

      const query = queries[businessType.toLowerCase()] || queries.default;

      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&orientation=landscape`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
          }
        }
      );

      const data = await response.json();

      return data.results.map(photo => ({
        id: photo.id,
        url: photo.urls.regular,
        thumb: photo.urls.thumb,
        description: photo.description || photo.alt_description || '',
        dimensions: {
          width: photo.width,
          height: photo.height
        },
        tags: photo.tags?.map(tag => tag.title) || []
      }));

    } catch (error) {
      console.error('❌ Errore raccolta immagini Unsplash:', error);
      return [];
    }
  }

  /**
   * 💾 SALVATAGGIO NEL DATABASE
   */
  static async saveCompetitorData(businessType, competitorUrl, scrapedData) {
    console.log(`💾 Salvataggio competitor: ${competitorUrl}`);

    try {
      const competitorData = {
        business_type: businessType,
        source_url: competitorUrl,
        html_content: scrapedData.htmlContent,
        css_content: scrapedData.cssContent,
        design_analysis: scrapedData.designData,
        color_palette: scrapedData.designData.colorPalette,
        font_families: scrapedData.designData.fontFamilies,
        layout_structure: scrapedData.designData.layoutStructure,
        semantic_analysis: scrapedData.designData.semanticAnalysis,
        performance_metrics: scrapedData.designData.performanceMetrics,
        accessibility_score: scrapedData.designData.accessibilityScore,
        design_score: scrapedData.designData.designScore,
        mobile_responsive: scrapedData.designData.mobileResponsive,
        business_images: {
          siteImages: scrapedData.siteImages,
          unsplashImages: scrapedData.unsplashImages
        },
        css_themes: this.generateCssThemes(scrapedData.designData),
        quality_score: this.calculateQualityScore(scrapedData.designData),
        tags: this.generateTags(businessType, scrapedData.designData),
        confidence_score: this.calculateConfidenceScore(scrapedData.designData),
        training_priority: this.calculateTrainingPriority(scrapedData.designData)
      };

      const saved = await prisma.ai_design_patterns.create({
        data: competitorData
      });

      console.log(`✅ Competitor salvato con ID: ${saved.id}`);
      return saved;

    } catch (error) {
      console.error('❌ Errore salvataggio competitor:', error);
      throw error;
    }
  }

  /**
   * 🎨 GENERAZIONE CSS THEMES
   */
  static generateCssThemes(designData) {
    const themes = {};

    if (designData.colorPalette.primary.length > 0) {
      themes.primary = designData.colorPalette.primary[0];
      themes.secondary = designData.colorPalette.primary[1] || designData.colorPalette.primary[0];
      themes.accent = designData.colorPalette.primary[2] || designData.colorPalette.primary[0];
    }

    if (designData.fontFamilies.primary.length > 0) {
      themes.fontPrimary = designData.fontFamilies.primary[0];
      themes.fontSecondary = designData.fontFamilies.primary[1] || designData.fontFamilies.primary[0];
    }

    return themes;
  }

  /**
   * ⭐ CALCOLO QUALITY SCORE
   */
  static calculateQualityScore(designData) {
    let score = 50;

    if (designData.designScore > 70) score += 20;
    if (designData.accessibilityScore > 80) score += 15;
    if (designData.mobileResponsive) score += 10;
    if (designData.colorPalette.count > 3) score += 5;

    return Math.min(100, score);
  }

  /**
   * 🏷️ GENERAZIONE TAGS
   */
  static generateTags(businessType, designData) {
    const tags = [businessType];

    if (designData.mobileResponsive) tags.push('responsive');
    if (designData.designScore > 70) tags.push('high-design');
    if (designData.accessibilityScore > 80) tags.push('accessible');
    if (designData.colorPalette.count > 5) tags.push('colorful');

    return tags;
  }

  /**
   * 🎯 CALCOLO CONFIDENCE SCORE
   */
  static calculateConfidenceScore(designData) {
    let confidence = 0.5;

    if (designData.designScore > 70) confidence += 0.2;
    if (designData.accessibilityScore > 80) confidence += 0.15;
    if (designData.mobileResponsive) confidence += 0.1;
    if (designData.colorPalette.count > 3) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  /**
   * 📈 CALCOLO TRAINING PRIORITY
   */
  static calculateTrainingPriority(designData) {
    let priority = 1;

    if (designData.qualityScore > 80) priority = 5;
    else if (designData.qualityScore > 60) priority = 3;
    else if (designData.qualityScore > 40) priority = 2;

    return priority;
  }

  /**
   * 🚀 SISTEMA COMPLETO DI ANALISI COMPETITOR
   */
  static async analyzeAndStoreCompetitors(businessType) {
    console.log(`🚀 Avvio analisi competitor per: ${businessType}`);

    try {
      // 1. Controllo numero competitor esistenti
      const existingCount = await this.checkCompetitorCount(businessType);

      if (existingCount >= 30) {
        console.log(`✅ Già presenti ${existingCount} competitor per ${businessType}`);
        return { success: true, message: 'Competitor sufficienti già presenti' };
      }

      const neededCount = 30 - existingCount;
      console.log(`📊 Necessari ${neededCount} competitor aggiuntivi`);

      // 2. Generazione competitor con OpenAI
      const competitors = await this.generateCompetitorsWithOpenAI(businessType, neededCount);

      // 3. Processamento di ogni competitor
      const results = [];
      for (const competitor of competitors) {
        try {
          console.log(`🔄 Processando: ${competitor.name} (${competitor.url})`);

          // Scraping e analisi
          const scrapedData = await this.scrapeCompetitorSite(competitor.url, businessType);

          // Salvataggio nel database
          const savedData = await this.saveCompetitorData(businessType, competitor.url, scrapedData);

          results.push({
            name: competitor.name,
            url: competitor.url,
            savedId: savedData.id,
            success: true
          });

        } catch (error) {
          console.error(`❌ Errore processamento ${competitor.name}:`, error);
          results.push({
            name: competitor.name,
            url: competitor.url,
            error: error.message,
            success: false
          });
        }

        // Pausa per evitare rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Analisi completata: ${successCount}/${competitors.length} competitor processati`);

      return {
        success: true,
        totalProcessed: competitors.length,
        successCount,
        results
      };

    } catch (error) {
      console.error('❌ Errore sistema analisi competitor:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CompetitorAnalysisSystem;

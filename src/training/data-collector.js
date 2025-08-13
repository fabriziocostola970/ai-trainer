// 🤖 Automated Data Collection System
// Raccoglie HTML + Screenshots + Business Analysis

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class TrainingDataCollector {
  constructor() {
    this.browser = null;
    this.outputDir = path.join(__dirname, '../../data/training-samples');
  }

  // 🚀 MAIN COLLECTION WORKFLOW
  async collectTrainingSample(websiteData) {
    const { url, businessType, metadata } = websiteData;
    
    console.log(`🎯 Starting collection for: ${url}`);
    
    try {
      // 1. Create sample directory
      const sampleId = this.generateSampleId(businessType, metadata.style);
      const sampleDir = path.join(this.outputDir, sampleId);
      await this.createSampleDirectory(sampleDir);

      // 2. Collect HTML source
      const htmlContent = await this.collectHTML(url);
      
      // 3. Take screenshots (multi-device)
      const screenshots = await this.collectScreenshots(url, sampleDir);
      
      // 4. Analyze HTML structure
      const htmlAnalysis = await this.analyzeHTMLStructure(htmlContent);
      
      // 5. Analyze visual patterns (with AI)
      const visualAnalysis = await this.analyzeVisualPatterns(screenshots, htmlContent);
      
      // 6. Generate business analysis
      const businessAnalysis = await this.analyzeBusinessAlignment(
        htmlContent, 
        visualAnalysis, 
        metadata
      );
      
      // 7. Generate perfect template
      const perfectTemplate = await this.generatePerfectTemplate(
        htmlAnalysis,
        visualAnalysis, 
        businessAnalysis,
        metadata
      );

      // 8. Save all data
      await this.saveTrainingSample(sampleDir, {
        source: { html: htmlContent, url, metadata },
        analysis: { htmlAnalysis, visualAnalysis, businessAnalysis },
        perfectTemplate,
        screenshots
      });

      console.log(`✅ Successfully collected sample: ${sampleId}`);
      return { success: true, sampleId, sampleDir };

    } catch (error) {
      console.error(`❌ Collection failed for ${url}:`, error);
      return { success: false, error: error.message };
    }
  }

  // 📸 SCREENSHOT COLLECTION
  async collectScreenshots(url, sampleDir) {
    if (!this.browser) {
      this.browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    const page = await this.browser.newPage();
    const screenshotDir = path.join(sampleDir, 'screenshots');
    await fs.mkdir(screenshotDir, { recursive: true });
    await fs.mkdir(path.join(screenshotDir, 'sections'), { recursive: true });

    const screenshots = {};

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Desktop screenshot
      await page.setViewport({ width: 1920, height: 1080 });
      await page.screenshot({ 
        path: path.join(screenshotDir, 'desktop-1920.png'),
        fullPage: true 
      });
      screenshots.desktop = 'screenshots/desktop-1920.png';

      // Tablet screenshot  
      await page.setViewport({ width: 768, height: 1024 });
      await page.screenshot({ 
        path: path.join(screenshotDir, 'tablet-768.png'),
        fullPage: true 
      });
      screenshots.tablet = 'screenshots/tablet-768.png';

      // Mobile screenshot
      await page.setViewport({ width: 375, height: 667 });
      await page.screenshot({ 
        path: path.join(screenshotDir, 'mobile-375.png'),
        fullPage: true 
      });
      screenshots.mobile = 'screenshots/mobile-375.png';

      // Section-specific screenshots
      await page.setViewport({ width: 1920, height: 1080 });
      
      const sections = ['header', 'nav', 'main', 'footer'];
      for (const section of sections) {
        try {
          const element = await page.$(section);
          if (element) {
            await element.screenshot({ 
              path: path.join(screenshotDir, 'sections', `${section}.png`)
            });
            screenshots[section] = `screenshots/sections/${section}.png`;
          }
        } catch (err) {
          console.warn(`⚠️ Could not capture ${section} section:`, err.message);
        }
      }

    } finally {
      await page.close();
    }

    return screenshots;
  }

  // 📄 HTML ANALYSIS
  async analyzeHTMLStructure(html) {
    return {
      semanticElements: this.extractSemanticElements(html),
      navigationPattern: this.analyzeNavigation(html),
      contentSections: this.identifyContentSections(html),
      interactiveElements: this.findInteractiveElements(html),
      accessibilityFeatures: this.evaluateAccessibility(html),
      performanceHints: this.analyzePerformance(html),
      seoElements: this.analyzeSEO(html)
    };
  }

  extractSemanticElements(html) {
    const semanticTags = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];
    const elements = {};
    
    semanticTags.forEach(tag => {
      const regex = new RegExp(`<${tag}[^>]*>`, 'gi');
      const matches = html.match(regex) || [];
      elements[tag] = {
        count: matches.length,
        hasClasses: matches.some(match => match.includes('class=')),
        hasIds: matches.some(match => match.includes('id='))
      };
    });
    
    return elements;
  }

  analyzeNavigation(html) {
    const navElements = html.match(/<nav[^>]*>[\s\S]*?<\/nav>/gi) || [];
    return {
      count: navElements.length,
      hasDropdown: /<ul[\s\S]*?<ul/i.test(html),
      isMobileOptimized: /hamburger|menu-toggle|mobile-menu|navbar-toggle/i.test(html),
      isSticky: /sticky|fixed|affix/i.test(html),
      hasSearch: /<input[^>]*search|<form[^>]*search/i.test(html)
    };
  }

  findInteractiveElements(html) {
    return {
      forms: (html.match(/<form[^>]*>/gi) || []).length,
      buttons: (html.match(/<button[^>]*>|<input[^>]*type=["\']button/gi) || []).length,
      links: (html.match(/<a[^>]*href/gi) || []).length,
      modals: /modal|popup|dialog/i.test(html),
      sliders: /slider|carousel|swiper/i.test(html),
      animations: /animate|transition|transform/i.test(html)
    };
  }

  // 🎨 VISUAL ANALYSIS (AI-powered)
  async analyzeVisualPatterns(screenshots, html) {
    // In production: use OpenAI Vision API
    return {
      colorPalette: await this.extractColorPalette(screenshots.desktop),
      typography: await this.analyzeTypography(screenshots.desktop, html),
      layoutGrid: await this.detectLayoutGrid(screenshots.desktop),
      designStyle: await this.classifyDesignStyle(screenshots.desktop),
      visualHierarchy: await this.analyzeVisualHierarchy(screenshots.desktop),
      responsiveDesign: await this.evaluateResponsiveDesign(screenshots)
    };
  }

  // 🏢 BUSINESS ANALYSIS
  async analyzeBusinessAlignment(html, visual, metadata) {
    return {
      targetAudienceMatch: this.calculateAudienceMatch(visual, metadata),
      industryStandardsCompliance: this.evaluateIndustryStandards(html, metadata.businessType),
      conversionOptimization: this.analyzeConversionElements(html, visual),
      brandConsistency: this.evaluateBrandConsistency(visual, metadata),
      userExperienceScore: this.calculateUXScore(html, visual),
      competitiveAnalysis: await this.compareWithCompetitors(metadata.businessType)
    };
  }

  // 🎯 PERFECT TEMPLATE GENERATION
  async generatePerfectTemplate(htmlAnalysis, visualAnalysis, businessAnalysis, metadata) {
    // Use AI to generate ideal template based on analysis
    return {
      name: `${metadata.businessType} ${visualAnalysis.designStyle} Pro`,
      structure: this.optimizeStructure(htmlAnalysis, metadata.businessType),
      styling: this.optimizeStyling(visualAnalysis, businessAnalysis),
      customBlocks: this.generateCustomBlocks(metadata.businessType, businessAnalysis),
      businessOptimizations: this.generateBusinessOptimizations(businessAnalysis, metadata),
      scores: {
        creativity: Math.round(85 + Math.random() * 15), // Mock for now
        businessAlignment: businessAnalysis.targetAudienceMatch,
        technicalQuality: htmlAnalysis.accessibilityFeatures.score || 85,
        overallRating: Math.round((85 + businessAnalysis.targetAudienceMatch + 85) / 3)
      }
    };
  }

  // 💾 SAVE SAMPLE DATA
  async saveTrainingSample(sampleDir, data) {
    // Save metadata
    await fs.writeFile(
      path.join(sampleDir, 'metadata.json'),
      JSON.stringify(data.source.metadata, null, 2)
    );

    // Save HTML source
    await fs.writeFile(
      path.join(sampleDir, 'source.html'),
      data.source.html
    );

    // Save analysis results
    const analysisDir = path.join(sampleDir, 'analysis');
    await fs.mkdir(analysisDir, { recursive: true });
    
    await fs.writeFile(
      path.join(analysisDir, 'html-analysis.json'),
      JSON.stringify(data.analysis.htmlAnalysis, null, 2)
    );
    
    await fs.writeFile(
      path.join(analysisDir, 'visual-analysis.json'),
      JSON.stringify(data.analysis.visualAnalysis, null, 2)
    );
    
    await fs.writeFile(
      path.join(analysisDir, 'business-analysis.json'),
      JSON.stringify(data.analysis.businessAnalysis, null, 2)
    );

    // Save perfect template
    await fs.writeFile(
      path.join(sampleDir, 'perfect-template.json'),
      JSON.stringify(data.perfectTemplate, null, 2)
    );
  }

  // 🛠️ UTILITY METHODS
  generateSampleId(businessType, style) {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6);
    return `sample-${timestamp}-${businessType}-${style}-${random}`;
  }

  async createSampleDirectory(sampleDir) {
    await fs.mkdir(sampleDir, { recursive: true });
    await fs.mkdir(path.join(sampleDir, 'screenshots'), { recursive: true });
    await fs.mkdir(path.join(sampleDir, 'analysis'), { recursive: true });
  }

  async collectHTML(url) {
    if (!this.browser) {
      this.browser = await puppeteer.launch({ headless: true });
    }
    
    const page = await this.browser.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      const html = await page.content();
      return html;
    } finally {
      await page.close();
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = TrainingDataCollector;

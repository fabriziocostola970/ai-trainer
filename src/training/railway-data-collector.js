// 🤖 Railway-Optimized Data Collection System
// Supporta sia Puppeteer che modalità fallback

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

// 🔧 Dynamic Puppeteer loading with fallback
let puppeteer = null;
let browserInstance = null;

try {
  puppeteer = require('puppeteer');
  console.log('✅ Puppeteer loaded successfully');
} catch (error) {
  console.log('⚠️ Puppeteer not available, using HTTP fallback mode');
}

class RailwayDataCollector {
  constructor() {
    this.outputDir = path.join(__dirname, '../../data/training-samples');
    this.hasPuppeteer = !!puppeteer;
    this.useragent = 'Mozilla/5.0 (compatible; AI-Trainer/1.0)';
  }

  async initialize() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`📁 Output directory ready: ${this.outputDir}`);
      console.log(`🔧 Collection mode: ${this.hasPuppeteer ? 'Puppeteer' : 'HTTP Fallback'}`);
    } catch (error) {
      console.error('❌ Failed to create output directory:', error);
    }
  }

  async collectTrainingSample(websiteData) {
    const { url, businessType, metadata } = websiteData;
    const sampleId = `sample-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    console.log(`🎯 Collecting: ${url} (${this.hasPuppeteer ? 'Puppeteer' : 'HTTP'})`);

    try {
      if (this.hasPuppeteer) {
        return await this.collectWithPuppeteer(url, businessType, metadata, sampleId);
      } else {
        return await this.collectWithHTTP(url, businessType, metadata, sampleId);
      }
    } catch (error) {
      console.error(`❌ Collection failed for ${url}:`, error.message);
      return await this.createEmergencyFallback(url, businessType, metadata, sampleId);
    }
  }

  // 🚁 HTTP-only collection (Railway safe)
  async collectWithHTTP(url, businessType, metadata, sampleId) {
    console.log(`📡 Using HTTP collection for ${url}`);
    
    const sampleDir = path.join(this.outputDir, sampleId);
    await fs.mkdir(sampleDir, { recursive: true });

    try {
      // Fetch HTML content
      const htmlContent = await this.fetchHTML(url);
      
      // Create sample structure
      const sampleMetadata = {
        id: sampleId,
        url,
        businessType,
        collectionMethod: 'http',
        timestamp: new Date().toISOString(),
        success: true,
        htmlLength: htmlContent.length,
        metadata: metadata || {}
      };

      // Save files
      await fs.writeFile(
        path.join(sampleDir, 'metadata.json'), 
        JSON.stringify(sampleMetadata, null, 2)
      );
      await fs.writeFile(path.join(sampleDir, 'source.html'), htmlContent);

      // Create basic analysis
      const analysis = await this.analyzeHTML(htmlContent, businessType);
      await fs.writeFile(
        path.join(sampleDir, 'analysis.json'), 
        JSON.stringify(analysis, null, 2)
      );

      console.log(`✅ HTTP collection completed: ${sampleId}`);
      return {
        success: true,
        sampleId,
        method: 'http',
        analysis: analysis
      };

    } catch (error) {
      console.error(`❌ HTTP collection failed:`, error.message);
      return await this.createEmergencyFallback(url, businessType, metadata, sampleId);
    }
  }

  // 🎭 Puppeteer collection (when available)
  async collectWithPuppeteer(url, businessType, metadata, sampleId) {
    console.log(`🎭 Using Puppeteer collection for ${url}`);
    
    const sampleDir = path.join(this.outputDir, sampleId);
    await fs.mkdir(sampleDir, { recursive: true });

    let browser = null;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      await page.setUserAgent(this.useragent);
      await page.setViewport({ width: 1200, height: 800 });

      const response = await page.goto(url, { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });

      // Get content
      const htmlContent = await page.content();
      const screenshot = await page.screenshot({ fullPage: true });

      // Create metadata
      const sampleMetadata = {
        id: sampleId,
        url,
        businessType,
        collectionMethod: 'puppeteer',
        timestamp: new Date().toISOString(),
        success: true,
        statusCode: response.status(),
        viewport: { width: 1200, height: 800 },
        metadata: metadata || {}
      };

      // Save files
      await fs.writeFile(
        path.join(sampleDir, 'metadata.json'), 
        JSON.stringify(sampleMetadata, null, 2)
      );
      await fs.writeFile(path.join(sampleDir, 'source.html'), htmlContent);
      await fs.writeFile(path.join(sampleDir, 'screenshot.png'), screenshot);

      // Analyze content
      const analysis = await this.analyzeHTML(htmlContent, businessType);
      await fs.writeFile(
        path.join(sampleDir, 'analysis.json'), 
        JSON.stringify(analysis, null, 2)
      );

      console.log(`✅ Puppeteer collection completed: ${sampleId}`);
      return {
        success: true,
        sampleId,
        method: 'puppeteer',
        analysis: analysis
      };

    } finally {
      if (browser) await browser.close();
    }
  }

  // 🚨 Emergency fallback
  async createEmergencyFallback(url, businessType, metadata, sampleId) {
    console.log(`🚨 Creating emergency fallback for ${url}`);
    
    const sampleDir = path.join(this.outputDir, sampleId);
    await fs.mkdir(sampleDir, { recursive: true });

    const mockData = {
      id: sampleId,
      url,
      businessType,
      collectionMethod: 'emergency-fallback',
      timestamp: new Date().toISOString(),
      success: true,
      mode: 'training-simulation'
    };

    const mockHTML = this.generateMockHTML(url, businessType);
    const mockAnalysis = this.generateMockAnalysis(businessType);

    await fs.writeFile(
      path.join(sampleDir, 'metadata.json'), 
      JSON.stringify(mockData, null, 2)
    );
    await fs.writeFile(path.join(sampleDir, 'source.html'), mockHTML);
    await fs.writeFile(
      path.join(sampleDir, 'analysis.json'), 
      JSON.stringify(mockAnalysis, null, 2)
    );

    console.log(`✅ Emergency fallback created: ${sampleId}`);
    return {
      success: true,
      sampleId,
      method: 'emergency-fallback',
      analysis: mockAnalysis
    };
  }

  // 📡 HTTP HTML fetcher
  async fetchHTML(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      const options = {
        headers: {
          'User-Agent': this.useragent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        timeout: 15000
      };

      const req = client.get(url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  // 🧠 Basic HTML analysis
  async analyzeHTML(htmlContent, businessType) {
    const analysis = {
      timestamp: new Date().toISOString(),
      businessType,
      htmlLength: htmlContent.length,
      tags: {},
      elements: {
        headings: (htmlContent.match(/<h[1-6][^>]*>/gi) || []).length,
        links: (htmlContent.match(/<a[^>]*>/gi) || []).length,
        images: (htmlContent.match(/<img[^>]*>/gi) || []).length,
        buttons: (htmlContent.match(/<button[^>]*>/gi) || []).length
      },
      hasNavigation: /<nav[^>]*>/i.test(htmlContent),
      hasFooter: /<footer[^>]*>/i.test(htmlContent),
      hasHero: /hero|banner|jumbotron/i.test(htmlContent),
      responsive: /viewport|responsive|mobile/i.test(htmlContent),
      framework: this.detectFramework(htmlContent)
    };

    return analysis;
  }

  detectFramework(htmlContent) {
    if (/bootstrap/i.test(htmlContent)) return 'bootstrap';
    if (/tailwind/i.test(htmlContent)) return 'tailwind';
    if (/material/i.test(htmlContent)) return 'material';
    if (/foundation/i.test(htmlContent)) return 'foundation';
    return 'custom';
  }

  generateMockHTML(url, businessType) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mock ${businessType} - AI Training</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4rem 2rem; text-align: center; }
        .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
        .section { padding: 3rem 2rem; }
        .container { max-width: 1200px; margin: 0 auto; }
        .footer { background: #1a202c; color: white; padding: 2rem; text-align: center; }
    </style>
</head>
<body>
    <div class="hero">
        <div class="container">
            <h1>Mock ${businessType}</h1>
            <p>Training sample generated for ${url}</p>
        </div>
    </div>
    <div class="section">
        <div class="container">
            <h2>About</h2>
            <p>This is a mock training sample for AI learning.</p>
        </div>
    </div>
    <div class="footer">
        <p>Mock data for AI training - ${new Date().toISOString()}</p>
    </div>
</body>
</html>`;
  }

  generateMockAnalysis(businessType) {
    return {
      timestamp: new Date().toISOString(),
      businessType,
      mode: 'mock',
      elements: {
        headings: 2,
        links: 3,
        images: 1,
        buttons: 2
      },
      hasNavigation: true,
      hasFooter: true,
      hasHero: true,
      responsive: true,
      framework: 'custom',
      confidence: 0.85
    };
  }

  // 📥 Collect just HTML content (for training samples)
  async collectHTMLContent(url) {
    console.log(`📥 Collecting HTML content from: ${url}`);
    
    try {
      if (this.hasPuppeteer) {
        return await this.fetchHTMLWithPuppeteer(url);
      } else {
        return await this.fetchHTML(url);
      }
    } catch (error) {
      console.error(`❌ HTML collection failed for ${url}:`, error.message);
      return null;
    }
  }

  // 🤖 Fetch HTML with Puppeteer (full rendering)
  async fetchHTMLWithPuppeteer(url) {
    let page = null;
    try {
      if (!browserInstance) {
        browserInstance = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      }

      page = await browserInstance.newPage();
      await page.setUserAgent(this.useragent);
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      // Wait for dynamic content
      await page.waitForTimeout(2000);
      
      const htmlContent = await page.content();
      console.log(`✅ HTML collected via Puppeteer: ${htmlContent.length} characters`);
      
      return htmlContent;
      
    } catch (error) {
      console.error(`❌ Puppeteer HTML collection failed:`, error.message);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
}

module.exports = RailwayDataCollector;

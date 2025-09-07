// 🧠 BUSINESS PRE-PROCESSOR - AI Training & Smart Processing
// Servizio per pre-processare richieste cliente prima di Claude

class BusinessPreProcessor {
  constructor() {
    console.log('🧠 Business Pre-Processor initialized');
  }

  /**
   * 🎯 MAIN PROCESSING FUNCTION
   * Analizza descrizione cliente e crea struttura ottimizzata per Claude
   */
  async processBusinessRequest(businessName, businessType, businessDescription, mode = 'creative') {
    console.log('🔍 Starting business pre-processing...');
    
    const analysis = {
      businessInfo: {
        name: businessName,
        type: businessType,
        description: businessDescription,
        mode: mode
      },
      extractedSections: [],
      imageRequests: [],
      designContext: {},
      claudeInstructions: '',
      trainingData: {}
    };

    // 1️⃣ ESTRAI SEZIONI SPECIFICHE
    analysis.extractedSections = this.extractRequestedSections(businessDescription);
    
    // 2️⃣ ANALIZZA RICHIESTE IMMAGINI  
    analysis.imageRequests = this.extractImageRequests(businessDescription);
    
    // 3️⃣ DETERMINA DESIGN CONTEXT
    analysis.designContext = this.analyzeDesignContext(businessType, businessDescription, mode);
    
    // 4️⃣ GENERA ISTRUZIONI SPECIFICHE PER CLAUDE
    analysis.claudeInstructions = this.generateClaudeInstructions(analysis);
    
    // 5️⃣ PREPARA DATI PER TRAINING FUTURO
    analysis.trainingData = this.prepareTrainingData(analysis);
    
    console.log('✅ Pre-processing completed:', {
      sections: analysis.extractedSections.length,
      images: analysis.imageRequests.length,
      designStyle: analysis.designContext.style
    });
    
    return analysis;
  }

  /**
   * 📋 ESTRAE SEZIONI SPECIFICHE dalla descrizione
   */
  extractRequestedSections(description) {
    if (!description) return [];
    
    const sections = [];
    const text = description.toLowerCase();
    
    // Pattern per sezioni esplicite
    const sectionPatterns = [
      /crea una sezione (con|per|di) ([^,\.;]+)/gi,
      /aggiungi una sezione (con|per|di) ([^,\.;]+)/gi,
      /inserisci una sezione (con|per|di) ([^,\.;]+)/gi,
      /voglio una sezione (con|per|di) ([^,\.;]+)/gi,
      /mi serve una sezione (con|per|di) ([^,\.;]+)/gi,
      /mi occorre una sezione (con|per|di) ([^,\.;]+)/gi
    ];
    
    sectionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const sectionName = match[2].trim();
        if (sectionName && sectionName.length > 3) {
          sections.push({
            name: this.cleanSectionName(sectionName),
            originalText: match[0],
            type: this.categorizeSectionType(sectionName)
          });
        }
      }
    });
    
    console.log('📋 Extracted sections:', sections);
    return sections;
  }

  /**
   * 🖼️ ESTRAE RICHIESTE IMMAGINI SPECIFICHE
   */
  extractImageRequests(description) {
    if (!description) return [];
    
    const imageRequests = [];
    const text = description.toLowerCase();
    
    const patterns = [
      /inserisci un'?immagine (di|con|che mostra) ([^,\.;]+)/gi,
      /con un'?immagine (di|con|che mostra) ([^,\.;]+)/gi,
      /aggiungi un'?immagine (di|con|che mostra) ([^,\.;]+)/gi,
      /voglio foto (di|con) ([^,\.;]+)/gi
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const imageDescription = match[2].trim();
        if (imageDescription && imageDescription.length > 3) {
          imageRequests.push({
            description: imageDescription,
            searchKeywords: this.generateImageKeywords(imageDescription),
            category: this.categorizeImageType(imageDescription)
          });
        }
      }
    });
    
    console.log('🖼️ Extracted image requests:', imageRequests);
    return imageRequests;
  }

  /**
   * 🎨 ANALIZZA DESIGN CONTEXT dal business type e descrizione
   */
  analyzeDesignContext(businessType, description, mode) {
    const context = {
      industry: businessType,
      style: mode === 'professional' ? 'professional' : 'creative',
      colors: [],
      mood: 'modern',
      target: 'general'
    };

    // INDUSTRY-SPECIFIC DESIGN RULES
    const industryRules = {
      'automotive': {
        colors: ['#FF0000', '#000000', '#C0C0C0'],
        mood: 'aggressive',
        style: 'bold'
      },
      'fioraio': {
        colors: ['#4CAF50', '#FFC107', '#FF69B4'],
        mood: 'natural',
        style: 'organic'
      },
      'ristorante': {
        colors: ['#D32F2F', '#FF8F00', '#FFFFFF'],
        mood: 'warm',
        style: 'inviting'
      },
      'tecnologia': {
        colors: ['#2196F3', '#000000', '#FFFFFF'],
        mood: 'clean',
        style: 'minimal'
      }
    };

    const rule = industryRules[businessType?.toLowerCase()] || industryRules['default'];
    if (rule) {
      Object.assign(context, rule);
    }

    // ANALYZE DESCRIPTION FOR STYLE HINTS
    const text = description?.toLowerCase() || '';
    
    if (text.includes('aggressiv') || text.includes('colorat')) {
      context.mood = 'aggressive';
      context.style = 'bold';
    }
    
    if (text.includes('professional') || text.includes('elegante')) {
      context.style = 'professional';
      context.mood = 'clean';
    }

    console.log('🎨 Design context:', context);
    return context;
  }

  /**
   * 📝 GENERA ISTRUZIONI SPECIFICHE E STRUTTURATE PER CLAUDE
   */
  generateClaudeInstructions(analysis) {
    const { extractedSections, imageRequests, designContext, businessInfo } = analysis;
    
    let instructions = `CREA UN SITO WEB SPECIFICO PER: ${businessInfo.name}\n\n`;
    
    // SEZIONI SPECIFICHE
    if (extractedSections.length > 0) {
      instructions += `🎯 SEZIONI OBBLIGATORIE DA CREARE:\n`;
      extractedSections.forEach((section, i) => {
        instructions += `${i + 1}. "${section.name}" - Tipo: ${section.type}\n`;
      });
      instructions += `\n`;
    }
    
    // IMMAGINI SPECIFICHE
    if (imageRequests.length > 0) {
      instructions += `🖼️ IMMAGINI SPECIFICHE RICHIESTE:\n`;
      imageRequests.forEach((img, i) => {
        instructions += `${i + 1}. ${img.description} (categoria: ${img.category})\n`;
      });
      instructions += `\n`;
    }
    
    // DESIGN CONTEXT
    instructions += `🎨 CONTEXT DESIGN:\n`;
    instructions += `- Settore: ${designContext.industry}\n`;
    instructions += `- Stile: ${designContext.style}\n`;
    instructions += `- Mood: ${designContext.mood}\n`;
    instructions += `- Colori suggeriti: ${designContext.colors.join(', ')}\n\n`;
    
    instructions += `🚨 REGOLE FERREE:\n`;
    instructions += `- USA ESATTAMENTE i nomi sezioni richiesti\n`;
    instructions += `- CERCA immagini specifiche per ogni richiesta\n`;
    instructions += `- RISPETTA il design context del settore\n`;
    instructions += `- NON inventare sezioni non richieste\n`;
    
    return instructions;
  }

  /**
   * 📊 PREPARA DATI PER TRAINING AI FUTURO
   */
  prepareTrainingData(analysis) {
    return {
      timestamp: new Date().toISOString(),
      input: {
        business: analysis.businessInfo,
        sections_requested: analysis.extractedSections.length,
        images_requested: analysis.imageRequests.length
      },
      processing: {
        design_context: analysis.designContext,
        instructions_generated: analysis.claudeInstructions.length
      },
      // Qui salveremo anche il risultato di Claude per confronto
      feedback: null
    };
  }

  // UTILITY METHODS
  cleanSectionName(name) {
    return name
      .replace(/degli?|del|della|delle|con|per|in|una?|il|la|i|le/gi, '')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  categorizeSectionType(name) {
    const text = name.toLowerCase();
    
    if (text.includes('prodott') || text.includes('serviz')) return 'services';
    if (text.includes('storia') || text.includes('chi siamo')) return 'about';
    if (text.includes('contatt') || text.includes('dove')) return 'contact';
    if (text.includes('galleria') || text.includes('foto')) return 'gallery';
    
    return 'custom';
  }

  generateImageKeywords(description) {
    return description
      .replace(/degli?|del|della|delle|con|per|in|una?|il|la|i|le/gi, '')
      .trim()
      .split(' ')
      .filter(word => word.length > 2)
      .join(' ');
  }

  categorizeImageType(description) {
    const text = description.toLowerCase();
    
    if (text.includes('alberi') || text.includes('piante')) return 'nature';
    if (text.includes('auto') || text.includes('veicol')) return 'automotive';
    if (text.includes('cibo') || text.includes('ristorante')) return 'food';
    if (text.includes('lavoro') || text.includes('professional')) return 'business';
    
    return 'general';
  }
}

module.exports = new BusinessPreProcessor();

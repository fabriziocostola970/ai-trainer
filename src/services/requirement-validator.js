/**
 * 🎯 REQUIREMENT VALIDATOR
 * Valida se la risposta di Claude soddisfa tutti i requisiti del cliente
 */

class RequirementValidator {
    constructor() {
        console.log('🎯 Requirement Validator initialized');
    }

    /**
     * 🔍 Analizza la richiesta originale del cliente
     */
    extractRequirements(businessDescription) {
        const requirements = {
            sections: [],
            features: [],
            filters: [],
            images: [],
            design: [],
            missing: []
        };

        const text = businessDescription.toLowerCase();

        // SEZIONI RICHIESTE
        if (text.includes('home') || text.includes('homepage')) {
            requirements.sections.push('Homepage');
        }
        if (text.includes('catalogo') || text.includes('vetture') || text.includes('auto')) {
            requirements.sections.push('Catalogo Auto');
        }
        if (text.includes('contatti') || text.includes('contatto')) {
            requirements.sections.push('Contatti');
        }
        if (text.includes('chi siamo') || text.includes('about')) {
            requirements.sections.push('Chi Siamo');
        }

        // FUNZIONALITÀ RICHIESTE
        if (text.includes('filtro') || text.includes('ricerca') || text.includes('filtra')) {
            requirements.features.push('Sistema di filtri');
        }
        if (text.includes('modulo') || text.includes('form') || text.includes('richiesta')) {
            requirements.features.push('Form di contatto');
        }
        if (text.includes('preventivo') || text.includes('preventivi')) {
            requirements.features.push('Richiesta preventivo');
        }

        // FILTRI SPECIFICI
        const filterKeywords = [
            'tipo di macchina', 'tipo macchina', 'categoria',
            'alimentazione', 'carburante', 'benzina', 'diesel', 'elettrica', 'ibrida',
            'commerciale', 'personale', 'uso',
            'cilindrata', 'motore',
            'prezzo', 'costo',
            'anno', 'annata',
            'km', 'chilometri', 'chilometraggio',
            'marca', 'brand', 'modello'
        ];

        filterKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                requirements.filters.push(keyword);
            }
        });

        // TIPI DI IMMAGINI
        const imageTypes = [
            'sportive', 'sport', 'utilitarie', 'utilitaria', 'city car',
            'ibride', 'elettriche', 'suv', 'berlina', 'station wagon',
            'furgoni', 'commerciali', 'ducato', 'cargo', 'van',
            'auto nuove', 'auto usate', 'usato', 'nuovo'
        ];

        imageTypes.forEach(type => {
            if (text.includes(type)) {
                requirements.images.push(type);
            }
        });

        // STILE DESIGN
        if (text.includes('aggressivo') || text.includes('aggressiva')) {
            requirements.design.push('Aggressivo');
        }
        if (text.includes('colorato') || text.includes('colorata')) {
            requirements.design.push('Colorato');
        }
        if (text.includes('professionale')) {
            requirements.design.push('Professionale');
        }
        if (text.includes('elegante')) {
            requirements.design.push('Elegante');
        }
        if (text.includes('moderno')) {
            requirements.design.push('Moderno');
        }

        return requirements;
    }

    /**
     * ✅ Valida se l'HTML generato soddisfa i requisiti
     */
    validateGeneratedHTML(htmlContent, originalRequirements) {
        const validation = {
            satisfied: [],
            missing: [],
            score: 0,
            suggestions: []
        };

        const html = htmlContent.toLowerCase();

        // Verifica SEZIONI
        (originalRequirements.sections || []).forEach(section => {
            let found = false;
            switch(section) {
                case 'Homepage':
                    found = html.includes('home') || html.includes('hero');
                    break;
                case 'Catalogo Auto':
                    found = html.includes('catalogo') || html.includes('auto') || html.includes('veicoli') || html.includes('vetture');
                    break;
                case 'Contatti':
                    found = html.includes('contatti') || html.includes('contact');
                    break;
                case 'Chi Siamo':
                    found = html.includes('chi siamo') || html.includes('about');
                    break;
            }

            if (found) {
                validation.satisfied.push(`Sezione: ${section}`);
            } else {
                validation.missing.push(`Sezione: ${section}`);
            }
        });

        // Verifica FUNZIONALITÀ
        (originalRequirements.features || []).forEach(feature => {
            let found = false;
            switch(feature) {
                case 'Sistema di filtri':
                    found = html.includes('filter') || html.includes('filtro') || 
                            html.includes('select') || html.includes('dropdown');
                    break;
                case 'Form di contatto':
                    found = html.includes('form') || html.includes('input') || 
                            html.includes('contact');
                    break;
                case 'Richiesta preventivo':
                    found = html.includes('preventivo') || html.includes('richiesta');
                    break;
            }

            if (found) {
                validation.satisfied.push(`Funzionalità: ${feature}`);
            } else {
                validation.missing.push(`Funzionalità: ${feature}`);
                
                // Aggiungi suggerimenti specifici
                if (feature === 'Sistema di filtri') {
                    validation.suggestions.push('Aggiungere filtri per tipo auto, alimentazione, prezzo, anno');
                }
            }
        });

        // Verifica FILTRI SPECIFICI
        const hasFilters = html.includes('filter') || html.includes('select') || html.includes('dropdown');
        if (originalRequirements.filters.length > 0) {
            if (hasFilters) {
                validation.satisfied.push('Filtri di ricerca presenti');
            } else {
                validation.missing.push('Filtri di ricerca');
                validation.suggestions.push(`Implementare filtri per: ${originalRequirements.filters.join(', ')}`);
            }
        }

        // Calcola score
        const totalRequirements = originalRequirements.sections.length + 
                                originalRequirements.features.length + 
                                (originalRequirements.filters.length > 0 ? 1 : 0);
        
        validation.score = totalRequirements > 0 ? 
            Math.round((validation.satisfied.length / totalRequirements) * 100) : 100;

        return validation;
    }

    /**
     * 🔧 Genera prompt per implementare requisiti mancanti
     */
    generateCompletionPrompt(missingRequirements, originalDescription) {
        let prompt = `ATTENZIONE: Il sito generato non soddisfa alcuni requisiti del cliente!\n\n`;
        prompt += `REQUISITI MANCANTI:\n`;
        
        missingRequirements = missingRequirements || [];
        missingRequirements.forEach(req => {
            prompt += `- ${req}\n`;
        });

        prompt += `\nRICHIESTA ORIGINALE CLIENTE:\n${originalDescription}\n\n`;
        prompt += `ISTRUZIONI: Modifica il codice HTML per includere TUTTI i requisiti mancanti.\n`;
        prompt += `Mantieni tutto il codice esistente e aggiungi solo le parti mancanti.\n`;
        prompt += `Assicurati che il design rimanga coerente e professionale.`;

        return prompt;
    }

    /**
     * 📊 Genera report di validazione
     */
    generateValidationReport(validation, originalRequirements) {
        const report = {
            score: validation.score,
            status: validation.score >= 80 ? 'COMPLETO' : validation.score >= 60 ? 'PARZIALE' : 'INCOMPLETO',
            summary: {
                total: originalRequirements.sections.length + originalRequirements.features.length + 
                       (originalRequirements.filters.length > 0 ? 1 : 0),
                satisfied: validation.satisfied.length,
                missing: validation.missing.length
            },
            details: {
                satisfied: validation.satisfied,
                missing: validation.missing,
                suggestions: validation.suggestions
            },
            timestamp: new Date().toISOString()
        };

        return report;
    }
}

module.exports = RequirementValidator;

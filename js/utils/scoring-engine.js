/* ================================================================
   Scoring Engine — Shared Analysis Utilities
   Used by all agents for text analysis and scoring
   ================================================================ */

class ScoringEngine {

  /* ---- Keyword Presence Checker ---- */
  static containsKeywords(text, keywords) {
    if (!text) return { found: [], missing: [], score: 0 };
    const lower = text.toLowerCase();
    const found = keywords.filter(k => lower.includes(k.toLowerCase()));
    const missing = keywords.filter(k => !lower.includes(k.toLowerCase()));
    return {
      found,
      missing,
      score: found.length / keywords.length
    };
  }

  /* ---- Text Quality Analyzer ---- */
  static analyzeTextQuality(text) {
    if (!text || text.trim().length === 0) {
      return { wordCount: 0, sentenceCount: 0, score: 0, level: 'empty' };
    }
    const words = text.trim().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const wordCount = words.length;
    const sentenceCount = sentences.length;

    let score = 0;
    if (wordCount >= 5) score += 0.2;
    if (wordCount >= 15) score += 0.2;
    if (wordCount >= 30) score += 0.2;
    if (wordCount >= 50) score += 0.1;
    if (sentenceCount >= 2) score += 0.15;
    if (sentenceCount >= 4) score += 0.15;

    let level = 'poor';
    if (score >= 0.8) level = 'excellent';
    else if (score >= 0.6) level = 'good';
    else if (score >= 0.35) level = 'fair';

    return { wordCount, sentenceCount, score: Math.min(score, 1), level };
  }

  /* ---- Acceptance Criteria Analyzer ---- */
  static analyzeAcceptanceCriteria(text) {
    if (!text || text.trim().length === 0) {
      return { criteriaCount: 0, hasGherkin: false, hasNumbered: false, score: 0, items: [] };
    }

    // Check for Given/When/Then (Gherkin)
    const gherkinPatterns = [/given\s/i, /when\s/i, /then\s/i];
    const hasGherkin = gherkinPatterns.every(p => p.test(text));

    // Check for numbered/bulleted items
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const numberedLines = lines.filter(l => /^\s*(\d+[\.\)]\s|[-*•]\s|AC\s*\d)/i.test(l));
    const hasNumbered = numberedLines.length >= 2;

    // Count criteria
    let criteriaCount = 0;
    if (hasGherkin) {
      criteriaCount = (text.match(/\b(given|scenario|then)\b/gi) || []).length;
    } else if (hasNumbered) {
      criteriaCount = numberedLines.length;
    } else {
      criteriaCount = lines.length;
    }

    let score = 0;
    if (criteriaCount >= 1) score += 0.25;
    if (criteriaCount >= 3) score += 0.25;
    if (criteriaCount >= 5) score += 0.15;
    if (hasGherkin) score += 0.2;
    if (hasNumbered) score += 0.15;

    return {
      criteriaCount,
      hasGherkin,
      hasNumbered,
      score: Math.min(score, 1),
      items: numberedLines.length > 0 ? numberedLines : lines
    };
  }

  /* ---- Edge Case Detection ---- */
  static detectEdgeCases(text) {
    if (!text) return { found: [], score: 0 };
    const lower = text.toLowerCase();
    const edgeCaseKeywords = [
      { keyword: 'error', category: 'Error Handling' },
      { keyword: 'invalid', category: 'Error Handling' },
      { keyword: 'empty', category: 'Boundary' },
      { keyword: 'null', category: 'Boundary' },
      { keyword: 'blank', category: 'Boundary' },
      { keyword: 'maximum', category: 'Boundary' },
      { keyword: 'minimum', category: 'Boundary' },
      { keyword: 'limit', category: 'Boundary' },
      { keyword: 'timeout', category: 'Performance' },
      { keyword: 'concurrent', category: 'Performance' },
      { keyword: 'permission', category: 'Security' },
      { keyword: 'unauthorized', category: 'Security' },
      { keyword: 'role', category: 'Security' },
      { keyword: 'special character', category: 'Input Validation' },
      { keyword: 'duplicate', category: 'Data Integrity' },
      { keyword: 'network', category: 'Connectivity' },
      { keyword: 'offline', category: 'Connectivity' },
      { keyword: 'accessibility', category: 'Accessibility' },
      { keyword: 'screen reader', category: 'Accessibility' },
      { keyword: 'mobile', category: 'Responsiveness' },
      { keyword: 'browser', category: 'Compatibility' }
    ];

    const found = edgeCaseKeywords.filter(ec => lower.includes(ec.keyword));
    const categories = [...new Set(found.map(f => f.category))];
    const score = Math.min(categories.length / 6, 1);

    return { found, categories, score };
  }

  /* ---- User Story Format Checker ---- */
  static checkUserStoryFormat(text) {
    if (!text) return { hasAsA: false, hasIWant: false, hasSoThat: false, score: 0 };
    const lower = text.toLowerCase();
    const hasAsA = /as a\s/.test(lower);
    const hasIWant = /i want\s|i need\s|i should\s/.test(lower);
    const hasSoThat = /so that\s|in order to\s|to be able to\s/.test(lower);

    let score = 0;
    if (hasAsA) score += 0.4;
    if (hasIWant) score += 0.35;
    if (hasSoThat) score += 0.25;

    return { hasAsA, hasIWant, hasSoThat, score };
  }

  /* ---- Weighted Score Calculator ---- */
  static calculateWeightedScore(scores, weights) {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const key of Object.keys(scores)) {
      const weight = weights[key] || 1;
      weightedSum += scores[key] * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /* ---- Score to 10 Scale ---- */
  static toTenScale(score) {
    return Math.round(score * 100) / 10;
  }

  /* ---- Get Score Class ---- */
  static getScoreClass(score10) {
    if (score10 >= 8) return 'excellent';
    if (score10 >= 6) return 'good';
    if (score10 >= 4) return 'fair';
    return 'poor';
  }

  /* ---- Get Score Color ---- */
  static getScoreColor(score10) {
    if (score10 >= 8) return '#10b981';
    if (score10 >= 6) return '#22d3ee';
    if (score10 >= 4) return '#f59e0b';
    return '#f43f5e';
  }

  /* ---- Similarity Check (Jaccard) ---- */
  static textSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

// Export for use by other modules
window.ScoringEngine = ScoringEngine;

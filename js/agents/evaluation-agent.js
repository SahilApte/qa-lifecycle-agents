/* ================================================================
   Agent 2: Evaluation Agent
   Re-evaluates the refined story to confirm readiness
   Checks edge case coverage and validates all gaps are addressed
   ================================================================ */

class EvaluationAgent {
  constructor() {
    this.name = 'Evaluation Agent';
  }

  /* ---- Main Evaluation ---- */
  evaluate(storyText, previousResult = null) {
    if (!storyText || storyText.trim().length === 0) {
      return this._emptyResult();
    }

    const checks = [];
    let totalScore = 0;
    let maxScore = 0;

    // 1. Completeness Check
    const completeness = this._checkCompleteness(storyText);
    checks.push(completeness);
    totalScore += completeness.score;
    maxScore += completeness.maxScore;

    // 2. Acceptance Criteria Quality
    const acQuality = this._checkACQuality(storyText);
    checks.push(acQuality);
    totalScore += acQuality.score;
    maxScore += acQuality.maxScore;

    // 3. Edge Case Coverage
    const edgeCases = this._checkEdgeCases(storyText);
    checks.push(edgeCases);
    totalScore += edgeCases.score;
    maxScore += edgeCases.maxScore;

    // 4. Testability Check
    const testability = this._checkTestability(storyText);
    checks.push(testability);
    totalScore += testability.score;
    maxScore += testability.maxScore;

    // 5. Clarity & Ambiguity Check
    const clarity = this._checkClarity(storyText);
    checks.push(clarity);
    totalScore += clarity.score;
    maxScore += clarity.maxScore;

    // 6. Security Considerations
    const security = this._checkSecurity(storyText);
    checks.push(security);
    totalScore += security.score;
    maxScore += security.maxScore;

    // 7. Performance Considerations
    const performance = this._checkPerformance(storyText);
    checks.push(performance);
    totalScore += performance.score;
    maxScore += performance.maxScore;

    // 8. Error Handling
    const errorHandling = this._checkErrorHandling(storyText);
    checks.push(errorHandling);
    totalScore += errorHandling.score;
    maxScore += errorHandling.maxScore;

    // Calculate overall
    const normalizedScore = maxScore > 0 ? totalScore / maxScore : 0;
    const finalScore = ScoringEngine.toTenScale(normalizedScore);
    const scoreClass = ScoringEngine.getScoreClass(finalScore);

    // Determine readiness
    const passedChecks = checks.filter(c => c.status === 'pass').length;
    const failedChecks = checks.filter(c => c.status === 'fail').length;
    const warnChecks = checks.filter(c => c.status === 'warn').length;

    let readiness = 'NOT_READY';
    let readinessLabel = 'Not Ready';
    let readinessColor = 'var(--color-error)';

    if (failedChecks === 0 && warnChecks <= 1) {
      readiness = 'READY';
      readinessLabel = '✓ Ready for Test Case Generation';
      readinessColor = 'var(--color-success)';
    } else if (failedChecks <= 1 && warnChecks <= 2) {
      readiness = 'ALMOST_READY';
      readinessLabel = '⚠ Almost Ready — Minor Gaps';
      readinessColor = 'var(--color-warning)';
    }

    // Improvement analysis (if previous result provided)
    let improvement = null;
    if (previousResult) {
      const prevScore = previousResult.overallScore || 0;
      improvement = {
        previousScore: prevScore,
        currentScore: finalScore,
        delta: Math.round((finalScore - prevScore) * 10) / 10,
        improved: finalScore > prevScore
      };
    }

    // Missing edge cases to suggest
    const missingEdgeCases = this._suggestMissingEdgeCases(storyText);

    return {
      overallScore: finalScore,
      scoreClass,
      readiness,
      readinessLabel,
      readinessColor,
      checks,
      passedChecks,
      failedChecks,
      warnChecks,
      improvement,
      missingEdgeCases,
      storyText
    };
  }

  /* ---- 1. Completeness Check ---- */
  _checkCompleteness(text) {
    const requiredSections = [
      { name: 'Title', keywords: ['title'] },
      { name: 'Description', keywords: ['description', 'summary'] },
      { name: 'Acceptance Criteria', keywords: ['acceptance criteria', 'given', 'when', 'then', 'AC'] },
      { name: 'Priority', keywords: ['priority', 'P0', 'P1', 'P2', 'P3', 'critical', 'high', 'medium', 'low'] },
      { name: 'Story Points', keywords: ['story point', 'estimation', 'effort', 'SP'] }
    ];

    const quality = ScoringEngine.analyzeTextQuality(text);
    let found = 0;
    const missing = [];

    for (const section of requiredSections) {
      if (section.keywords.some(k => text.toLowerCase().includes(k.toLowerCase()))) {
        found++;
      } else {
        missing.push(section.name);
      }
    }

    const score = (found / requiredSections.length) * 0.7 + (quality.score * 0.3);
    const status = score >= 0.7 ? 'pass' : score >= 0.4 ? 'warn' : 'fail';

    return {
      name: 'Completeness',
      icon: '📋',
      status,
      score,
      maxScore: 1,
      detail: status === 'pass'
        ? `All essential sections present (${found}/${requiredSections.length}).`
        : `Missing sections: ${missing.join(', ')}.`,
      missing
    };
  }

  /* ---- 2. Acceptance Criteria Quality ---- */
  _checkACQuality(text) {
    const ac = ScoringEngine.analyzeAcceptanceCriteria(text);
    let score = ac.score;
    let detail = '';
    let status = 'fail';

    if (ac.criteriaCount >= 5) {
      status = 'pass';
      detail = `Excellent! ${ac.criteriaCount} acceptance criteria defined${ac.hasGherkin ? ' in Gherkin format' : ''}.`;
    } else if (ac.criteriaCount >= 3) {
      status = 'pass';
      detail = `Good — ${ac.criteriaCount} criteria found. Consider adding edge case scenarios.`;
    } else if (ac.criteriaCount >= 1) {
      status = 'warn';
      detail = `Only ${ac.criteriaCount} criteria. Expand to cover happy path, negative, and edge case scenarios.`;
    } else {
      detail = 'No acceptance criteria detected. This is critical for testability.';
    }

    return { name: 'Acceptance Criteria Quality', icon: '✅', status, score, maxScore: 1, detail };
  }

  /* ---- 3. Edge Case Coverage ---- */
  _checkEdgeCases(text) {
    const ec = ScoringEngine.detectEdgeCases(text);
    const categoryCount = ec.categories ? ec.categories.length : 0;
    let score = ec.score;
    let status = 'fail';
    let detail = '';

    if (categoryCount >= 4) {
      status = 'pass';
      detail = `Strong edge case coverage across ${categoryCount} categories: ${ec.categories.join(', ')}.`;
    } else if (categoryCount >= 2) {
      status = 'warn';
      detail = `Partial coverage (${categoryCount} categories). Missing areas may include: ${this._getMissingCategories(ec.categories).join(', ')}.`;
    } else {
      detail = 'Minimal or no edge case coverage. Add scenarios for error handling, boundary values, security, and accessibility.';
    }

    return { name: 'Edge Case Coverage', icon: '🔍', status, score, maxScore: 1, detail };
  }

  /* ---- 4. Testability Check ---- */
  _checkTestability(text) {
    const testableKeywords = ['should', 'must', 'shall', 'expect', 'verify', 'validate', 'assert', 'confirm', 'display', 'show', 'return', 'redirect', 'enable', 'disable'];
    const result = ScoringEngine.containsKeywords(text, testableKeywords);
    const score = Math.min(result.found.length / 4, 1);
    const status = score >= 0.7 ? 'pass' : score >= 0.4 ? 'warn' : 'fail';

    return {
      name: 'Testability',
      icon: '🧪',
      status,
      score,
      maxScore: 1,
      detail: status === 'pass'
        ? `Story uses testable language: ${result.found.slice(0, 4).join(', ')}.`
        : 'Use specific, verifiable language (should, must, verify, display, return) to make criteria testable.'
    };
  }

  /* ---- 5. Clarity Check ---- */
  _checkClarity(text) {
    const ambiguousWords = ['maybe', 'perhaps', 'possibly', 'etc', 'and so on', 'stuff', 'thing', 'somehow', 'some kind of', 'appropriate', 'adequate', 'reasonable', 'soon', 'later'];
    const result = ScoringEngine.containsKeywords(text, ambiguousWords);
    const score = 1 - Math.min(result.found.length / 3, 1);
    const status = score >= 0.7 ? 'pass' : score >= 0.4 ? 'warn' : 'fail';

    return {
      name: 'Clarity & Precision',
      icon: '💎',
      status,
      score,
      maxScore: 1,
      detail: status === 'pass'
        ? 'Language is clear and precise with minimal ambiguity.'
        : `Ambiguous terms detected: ${result.found.join(', ')}. Replace with specific, measurable language.`
    };
  }

  /* ---- 6. Security ---- */
  _checkSecurity(text) {
    const securityKeywords = ['permission', 'role', 'authorization', 'authentication', 'RBAC', 'access control', 'encrypt', 'secure', 'token', 'session', 'CORS', 'XSS', 'CSRF', 'injection', 'sanitize', 'validate input'];
    const result = ScoringEngine.containsKeywords(text, securityKeywords);
    const score = Math.min(result.found.length / 3, 1);
    const status = score >= 0.5 ? 'pass' : score >= 0.2 ? 'warn' : 'fail';

    return {
      name: 'Security Considerations',
      icon: '🔒',
      status,
      score,
      maxScore: 1,
      detail: status !== 'fail'
        ? `Security aspects addressed: ${result.found.slice(0, 3).join(', ')}.`
        : 'No security considerations found. Consider adding: access control, input validation, authentication checks.'
    };
  }

  /* ---- 7. Performance ---- */
  _checkPerformance(text) {
    const perfKeywords = ['performance', 'load time', 'response time', 'latency', 'throughput', 'scalability', 'caching', 'pagination', 'lazy load', 'async', 'concurrent', 'timeout', 'SLA'];
    const result = ScoringEngine.containsKeywords(text, perfKeywords);
    const score = Math.min(result.found.length / 2, 1);
    const status = score >= 0.5 ? 'pass' : score >= 0.2 ? 'warn' : 'fail';

    return {
      name: 'Performance Considerations',
      icon: '⚡',
      status,
      score,
      maxScore: 1,
      detail: status !== 'fail'
        ? `Performance aspects noted: ${result.found.slice(0, 3).join(', ')}.`
        : 'No performance considerations. Consider: response time expectations, data volume, concurrent users.'
    };
  }

  /* ---- 8. Error Handling ---- */
  _checkErrorHandling(text) {
    const errorKeywords = ['error', 'exception', 'failure', 'fallback', 'retry', 'graceful', 'error message', 'validation error', 'user-friendly error', '404', '500', 'unavailable'];
    const result = ScoringEngine.containsKeywords(text, errorKeywords);
    const score = Math.min(result.found.length / 3, 1);
    const status = score >= 0.5 ? 'pass' : score >= 0.2 ? 'warn' : 'fail';

    return {
      name: 'Error Handling',
      icon: '🚨',
      status,
      score,
      maxScore: 1,
      detail: status !== 'fail'
        ? `Error handling addressed: ${result.found.slice(0, 3).join(', ')}.`
        : 'No error handling scenarios. Define what happens when things go wrong: validation errors, network failures, unexpected states.'
    };
  }

  /* ---- Helper: Missing Categories ---- */
  _getMissingCategories(covered) {
    const all = ['Error Handling', 'Boundary', 'Security', 'Performance', 'Input Validation', 'Data Integrity', 'Accessibility', 'Responsiveness', 'Connectivity'];
    return all.filter(c => !covered || !covered.includes(c));
  }

  /* ---- Suggest Missing Edge Cases ---- */
  _suggestMissingEdgeCases(text) {
    const suggestions = [];
    const lower = text.toLowerCase();

    const checks = [
      { condition: !lower.includes('empty') && !lower.includes('blank') && !lower.includes('null'), suggestion: 'Empty/null input handling', category: 'Boundary' },
      { condition: !lower.includes('maximum') && !lower.includes('minimum') && !lower.includes('limit'), suggestion: 'Min/max boundary values', category: 'Boundary' },
      { condition: !lower.includes('special character') && !lower.includes('unicode') && !lower.includes('sql injection'), suggestion: 'Special characters & injection prevention', category: 'Security' },
      { condition: !lower.includes('concurrent') && !lower.includes('parallel') && !lower.includes('simultaneous'), suggestion: 'Concurrent user access', category: 'Performance' },
      { condition: !lower.includes('timeout') && !lower.includes('network') && !lower.includes('offline'), suggestion: 'Network timeout & offline handling', category: 'Connectivity' },
      { condition: !lower.includes('permission') && !lower.includes('unauthorized') && !lower.includes('role'), suggestion: 'Unauthorized access attempts', category: 'Security' },
      { condition: !lower.includes('duplicate') && !lower.includes('unique'), suggestion: 'Duplicate data prevention', category: 'Data Integrity' },
      { condition: !lower.includes('back') && !lower.includes('navigate') && !lower.includes('refresh'), suggestion: 'Browser back/refresh behavior', category: 'UX' },
      { condition: !lower.includes('mobile') && !lower.includes('responsive'), suggestion: 'Mobile/responsive behavior', category: 'Responsiveness' },
      { condition: !lower.includes('accessibility') && !lower.includes('screen reader') && !lower.includes('aria'), suggestion: 'Accessibility (screen reader, keyboard nav)', category: 'Accessibility' }
    ];

    for (const check of checks) {
      if (check.condition) {
        suggestions.push({ suggestion: check.suggestion, category: check.category });
      }
    }

    return suggestions;
  }

  /* ---- Empty Result ---- */
  _emptyResult() {
    return {
      overallScore: 0,
      scoreClass: 'poor',
      readiness: 'NOT_READY',
      readinessLabel: 'Not Ready',
      readinessColor: 'var(--color-error)',
      checks: [],
      passedChecks: 0,
      failedChecks: 0,
      warnChecks: 0,
      improvement: null,
      missingEdgeCases: []
    };
  }

  /* ---- Render Results ---- */
  renderResults(result) {
    const scoreRing = ExportUtils.createScoreRing(result.overallScore);

    // Readiness badge
    const readinessHTML = `
      <div style="text-align:center;margin-bottom:var(--space-xl)">
        <span class="badge ${result.readiness === 'READY' ? 'badge-success' : result.readiness === 'ALMOST_READY' ? 'badge-warning' : 'badge-error'}" style="font-size:var(--text-sm);padding:6px 16px">
          ${result.readinessLabel}
        </span>
      </div>
    `;

    // Improvement delta
    let improvementHTML = '';
    if (result.improvement) {
      const delta = result.improvement.delta;
      const direction = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
      const color = delta > 0 ? 'var(--color-success)' : delta < 0 ? 'var(--color-error)' : 'var(--text-muted)';
      improvementHTML = `
        <div style="text-align:center;margin-bottom:var(--space-lg)">
          <span style="color:${color};font-weight:600">${direction} ${Math.abs(delta)} points ${delta > 0 ? 'improvement' : delta < 0 ? 'regression' : 'no change'}</span>
          <span class="text-muted" style="font-size:var(--text-xs);margin-left:var(--space-sm)">from ${result.improvement.previousScore}</span>
        </div>
      `;
    }

    // Stats
    const statsHTML = `
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-card-value" style="color:var(--color-success)">${result.passedChecks}</div>
          <div class="stat-card-label">Passed</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value" style="color:var(--color-warning)">${result.warnChecks}</div>
          <div class="stat-card-label">Warnings</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value" style="color:var(--color-error)">${result.failedChecks}</div>
          <div class="stat-card-label">Failed</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value">${result.checks.length}</div>
          <div class="stat-card-label">Total Checks</div>
        </div>
      </div>
    `;

    // Checks
    const checksHTML = result.checks.map(c => `
      <div class="finding-item">
        <div class="finding-icon ${c.status}">${c.icon}</div>
        <div class="finding-content">
          <h4>${c.name}</h4>
          <p>${c.detail}</p>
        </div>
        <span class="badge badge-${c.status === 'pass' ? 'success' : c.status === 'warn' ? 'warning' : 'error'}" style="margin-left:auto;align-self:flex-start">${Math.round(c.score * 100)}%</span>
      </div>
    `).join('');

    // Missing edge cases
    const edgeCasesHTML = result.missingEdgeCases.length > 0
      ? `
        <div class="mt-lg">
          <h4 style="font-size:var(--text-base);margin-bottom:var(--space-md)">🔍 Suggested Edge Cases to Add</h4>
          ${result.missingEdgeCases.map(ec => `
            <div class="recommendation-card">
              <h4>${ec.suggestion}</h4>
              <p>Category: ${ec.category}</p>
            </div>
          `).join('')}
        </div>
      `
      : '';

    return `
      <div class="results-container visible" style="animation: fadeSlideIn 0.5s ease">
        ${scoreRing}
        ${readinessHTML}
        ${improvementHTML}
        ${statsHTML}

        <div class="divider"></div>
        <h4 style="font-size:var(--text-base);margin-bottom:var(--space-md)">Evaluation Checks</h4>
        ${checksHTML}

        ${edgeCasesHTML}

        <div class="divider"></div>
        <div class="flex gap-sm">
          <button class="btn btn-secondary btn-sm" onclick="app.exportEvaluationResults()">📋 Export Report</button>
          ${result.readiness !== 'NOT_READY'
            ? '<button class="btn btn-primary btn-sm" onclick="app.sendToTestCaseGenerator()">→ Generate Test Cases</button>'
            : '<button class="btn btn-outline btn-sm" onclick="app.navigateTo(\'grooming\')">← Back to Grooming</button>'
          }
        </div>
      </div>
    `;
  }
}

window.EvaluationAgent = EvaluationAgent;

/* ================================================================
   Agent 9: PME (Production Missed Escape) Analyzer
   Analyzes why a bug escaped to production
   Identifies test plan gaps and suggests sanity/regression additions
   ================================================================ */

class PMEAnalyzer {
  constructor() {
    this.name = 'PME Analyzer';
  }

  /* ---- Main Analysis ---- */
  analyze(testPlanText, pmeBugText) {
    if (!pmeBugText || pmeBugText.trim().length === 0) {
      return this._emptyResult();
    }

    // Parse the PME bug
    const bugAnalysis = this._analyzeBug(pmeBugText);

    // Parse test plan coverage
    const planCoverage = this._analyzeTestPlan(testPlanText || '');

    // Find the gaps
    const gaps = this._identifyGaps(bugAnalysis, planCoverage);

    // Determine root cause category
    const rootCause = this._determineRootCause(bugAnalysis, planCoverage, gaps);

    // Generate recommendations
    const recommendations = this._generateRecommendations(bugAnalysis, gaps, rootCause);

    // Suggested test cases
    const suggestedTestCases = this._suggestTestCases(bugAnalysis, gaps);

    return {
      bugAnalysis,
      planCoverage,
      gaps,
      rootCause,
      recommendations,
      suggestedTestCases,
      impactLevel: this._assessImpact(pmeBugText),
      summary: this._generateSummary(rootCause, gaps.length)
    };
  }

  /* ---- Analyze the PME Bug ---- */
  _analyzeBug(bugText) {
    const lower = bugText.toLowerCase();

    const categories = {
      'Functional': ['does not work', 'broken', 'not functioning', 'incorrect', 'wrong', 'bug', 'defect', 'fails to', 'unable to'],
      'UI/Visual': ['display', 'alignment', 'layout', 'css', 'style', 'color', 'font', 'pixel', 'responsive', 'mobile', 'overlap'],
      'Data': ['data', 'database', 'incorrect value', 'wrong data', 'missing data', 'null', 'empty', 'corrupt', 'mismatch'],
      'Performance': ['slow', 'timeout', 'performance', 'loading', 'lag', 'freeze', 'crash', 'memory', 'CPU'],
      'Security': ['security', 'vulnerability', 'unauthorized', 'permission', 'access', 'injection', 'XSS', 'CSRF', 'token'],
      'Integration': ['API', 'endpoint', 'service', 'third-party', 'integration', 'microservice', 'sync', 'webhook'],
      'Edge Case': ['edge case', 'boundary', 'special character', 'concurrent', 'race condition', 'duplicate', 'overflow']
    };

    const detectedCategories = [];
    for (const [category, keywords] of Object.entries(categories)) {
      const matches = keywords.filter(k => lower.includes(k));
      if (matches.length > 0) {
        detectedCategories.push({ category, matchedKeywords: matches, confidence: Math.min(matches.length / 3, 1) });
      }
    }

    // Detect affected areas
    const areas = ['login', 'dashboard', 'search', 'form', 'table', 'report', 'export', 'import', 'notification', 'profile', 'settings', 'payment', 'checkout', 'registration'];
    const affectedAreas = areas.filter(a => lower.includes(a));

    // Detect severity
    let severity = 'Medium';
    if (lower.includes('critical') || lower.includes('blocker') || lower.includes('production down') || lower.includes('p0') || lower.includes('data loss')) {
      severity = 'Critical';
    } else if (lower.includes('high') || lower.includes('major') || lower.includes('p1')) {
      severity = 'High';
    } else if (lower.includes('low') || lower.includes('minor') || lower.includes('cosmetic') || lower.includes('p3')) {
      severity = 'Low';
    }

    return {
      categories: detectedCategories,
      primaryCategory: detectedCategories.length > 0 ? detectedCategories[0].category : 'Unknown',
      affectedAreas,
      severity,
      wordCount: bugText.split(/\s+/).length
    };
  }

  /* ---- Analyze Test Plan Coverage ---- */
  _analyzeTestPlan(planText) {
    if (!planText || planText.trim().length === 0) {
      return { hasTestPlan: false, coverage: [], totalCases: 0 };
    }

    const lower = planText.toLowerCase();
    const coverageAreas = [];

    const checkAreas = [
      { area: 'Login/Authentication', keywords: ['login', 'authentication', 'logout', 'session'] },
      { area: 'Form Validation', keywords: ['form', 'validation', 'input', 'required field', 'mandatory'] },
      { area: 'CRUD Operations', keywords: ['create', 'update', 'delete', 'edit', 'remove', 'add'] },
      { area: 'Search/Filter', keywords: ['search', 'filter', 'find', 'query'] },
      { area: 'Error Handling', keywords: ['error', 'exception', 'invalid', 'fail'] },
      { area: 'Edge Cases', keywords: ['boundary', 'edge case', 'special character', 'empty', 'null', 'maximum', 'minimum'] },
      { area: 'Security', keywords: ['security', 'permission', 'role', 'unauthorized', 'access control'] },
      { area: 'Performance', keywords: ['performance', 'load', 'response time', 'timeout'] },
      { area: 'UI/UX', keywords: ['ui', 'layout', 'responsive', 'display', 'alignment'] },
      { area: 'Integration', keywords: ['api', 'integration', 'service', 'endpoint', 'third-party'] },
      { area: 'Data Integrity', keywords: ['data', 'database', 'consistency', 'duplicate'] },
      { area: 'Accessibility', keywords: ['accessibility', 'screen reader', 'keyboard', 'aria'] }
    ];

    for (const check of checkAreas) {
      const found = check.keywords.filter(k => lower.includes(k));
      coverageAreas.push({
        area: check.area,
        covered: found.length > 0,
        matchedKeywords: found,
        coverage: found.length / check.keywords.length
      });
    }

    const lines = planText.split('\n').filter(l => l.trim().length > 0);
    const tcLines = lines.filter(l => /^(TC|test case|step|\d+[\.\)])/i.test(l.trim()));

    return {
      hasTestPlan: true,
      coverage: coverageAreas,
      coveredAreas: coverageAreas.filter(c => c.covered),
      uncoveredAreas: coverageAreas.filter(c => !c.covered),
      totalCases: Math.max(tcLines.length, lines.length / 5) // Rough estimate
    };
  }

  /* ---- Identify Gaps ---- */
  _identifyGaps(bugAnalysis, planCoverage) {
    const gaps = [];

    // Check if the bug category was covered in the test plan
    for (const bugCat of bugAnalysis.categories) {
      const areaMapping = {
        'Functional': ['CRUD Operations', 'Form Validation'],
        'UI/Visual': ['UI/UX'],
        'Data': ['Data Integrity', 'CRUD Operations'],
        'Performance': ['Performance'],
        'Security': ['Security'],
        'Integration': ['Integration'],
        'Edge Case': ['Edge Cases', 'Error Handling']
      };

      const relatedAreas = areaMapping[bugCat.category] || [];
      for (const area of relatedAreas) {
        if (planCoverage.hasTestPlan) {
          const coverage = planCoverage.coverage.find(c => c.area === area);
          if (coverage && !coverage.covered) {
            gaps.push({
              gapType: 'Missing Coverage Area',
              area,
              relatedTo: bugCat.category,
              severity: 'High',
              detail: `The test plan does not cover "${area}" which is directly related to the PME category "${bugCat.category}".`
            });
          }
        }
      }
    }

    // Check affected areas
    for (const area of bugAnalysis.affectedAreas) {
      if (planCoverage.hasTestPlan) {
        const combined = planCoverage.coverage.map(c => c.matchedKeywords.join(' ')).join(' ');
        if (!combined.includes(area)) {
          gaps.push({
            gapType: 'Missing Feature Coverage',
            area,
            relatedTo: 'Bug Affected Area',
            severity: 'Medium',
            detail: `The "${area}" feature area where the bug occurred has insufficient test coverage.`
          });
        }
      }
    }

    // General gaps if no test plan
    if (!planCoverage.hasTestPlan) {
      gaps.push({
        gapType: 'No Test Plan',
        area: 'All',
        relatedTo: 'Missing Test Plan',
        severity: 'Critical',
        detail: 'No test plan was provided. The PME may have occurred due to insufficient or absent test planning.'
      });
    }

    return gaps;
  }

  /* ---- Determine Root Cause ---- */
  _determineRootCause(bugAnalysis, planCoverage, gaps) {
    const causes = [];

    if (gaps.some(g => g.gapType === 'No Test Plan')) {
      causes.push({ cause: 'Missing Test Plan', confidence: 'High', detail: 'No structured test plan exists for this feature area.' });
    }

    if (gaps.some(g => g.gapType === 'Missing Coverage Area')) {
      causes.push({ cause: 'Incomplete Test Coverage', confidence: 'High', detail: 'Test plan does not cover the specific area where the bug was found.' });
    }

    if (bugAnalysis.primaryCategory === 'Edge Case') {
      causes.push({ cause: 'Edge Cases Not Tested', confidence: 'High', detail: 'The bug is an edge case scenario that was not anticipated during test planning.' });
    }

    if (bugAnalysis.primaryCategory === 'Integration') {
      causes.push({ cause: 'Integration Testing Gap', confidence: 'Medium', detail: 'Integration/API level testing may not have been performed.' });
    }

    if (bugAnalysis.primaryCategory === 'Data') {
      causes.push({ cause: 'Data Validation Gap', confidence: 'Medium', detail: 'Test data scenarios did not cover the specific data conditions that triggered the bug.' });
    }

    if (bugAnalysis.primaryCategory === 'Performance') {
      causes.push({ cause: 'No Performance Testing', confidence: 'Medium', detail: 'Performance testing was not included in the test plan.' });
    }

    if (bugAnalysis.primaryCategory === 'Security') {
      causes.push({ cause: 'Security Testing Gap', confidence: 'High', detail: 'Security testing scenarios were insufficient or missing.' });
    }

    if (causes.length === 0) {
      causes.push({ cause: 'Insufficient Scenario Coverage', confidence: 'Medium', detail: 'The specific combination of conditions that triggered the bug was not covered in the test plan.' });
    }

    return causes;
  }

  /* ---- Generate Recommendations ---- */
  _generateRecommendations(bugAnalysis, gaps, rootCauses) {
    const recs = [];

    // For Sanity Testing
    recs.push({
      type: 'Sanity',
      icon: '🔥',
      title: 'Add to Sanity Test Suite',
      items: [
        `Add a smoke test for the "${bugAnalysis.primaryCategory}" scenario that caused the PME.`,
        ...bugAnalysis.affectedAreas.map(a => `Include quick validation of "${a}" in the sanity checklist.`),
        'Ensure the exact reproduction steps are covered in quick sanity runs.'
      ]
    });

    // For Regression Testing
    recs.push({
      type: 'Regression',
      icon: '🔄',
      title: 'Add to Regression Test Suite',
      items: [
        ...gaps.map(g => `Add test case(s) covering: ${g.area} — ${g.detail}`),
        `Create detailed regression scenarios for ${bugAnalysis.primaryCategory} category.`,
        'Include positive and negative variants of the PME scenario.'
      ]
    });

    // Process improvement
    recs.push({
      type: 'Process',
      icon: '📋',
      title: 'Process Improvements',
      items: rootCauses.map(rc => `Address root cause: ${rc.cause} — ${rc.detail}`)
    });

    return recs;
  }

  /* ---- Suggest Test Cases ---- */
  _suggestTestCases(bugAnalysis, gaps) {
    const suggestions = [];
    let counter = 1;

    // Direct PME test case
    suggestions.push({
      id: `PME_TC_${counter++}`,
      title: `Verify fix for PME: ${bugAnalysis.primaryCategory} issue in ${bugAnalysis.affectedAreas[0] || 'affected area'}`,
      type: 'Regression',
      priority: 'High',
      target: 'Regression'
    });

    // Negative variant
    suggestions.push({
      id: `PME_TC_${counter++}`,
      title: `Verify negative scenario: ${bugAnalysis.primaryCategory} with invalid/edge inputs`,
      type: 'Negative',
      priority: 'High',
      target: 'Regression'
    });

    // For each gap
    for (const gap of gaps.slice(0, 5)) {
      suggestions.push({
        id: `PME_TC_${counter++}`,
        title: `Cover missing ${gap.area} scenario related to ${gap.relatedTo}`,
        type: 'Gap Coverage',
        priority: gap.severity === 'High' || gap.severity === 'Critical' ? 'High' : 'Medium',
        target: gap.severity === 'High' ? 'Sanity' : 'Regression'
      });
    }

    return suggestions;
  }

  /* ---- Assess Impact ---- */
  _assessImpact(bugText) {
    const lower = bugText.toLowerCase();
    if (lower.includes('data loss') || lower.includes('security breach') || lower.includes('production down') || lower.includes('financial')) return 'Critical';
    if (lower.includes('blocker') || lower.includes('customer facing') || lower.includes('revenue')) return 'High';
    if (lower.includes('workaround') || lower.includes('minor')) return 'Low';
    return 'Medium';
  }

  /* ---- Generate Summary ---- */
  _generateSummary(rootCauses, gapCount) {
    const primary = rootCauses[0];
    return `Root cause identified as "${primary.cause}" (${primary.confidence} confidence). ${gapCount} test plan gap(s) detected.`;
  }

  /* ---- Empty Result ---- */
  _emptyResult() {
    return {
      bugAnalysis: { categories: [], severity: 'Unknown', affectedAreas: [] },
      planCoverage: { hasTestPlan: false },
      gaps: [],
      rootCause: [],
      recommendations: [],
      suggestedTestCases: [],
      impactLevel: 'Unknown',
      summary: 'No PME bug details provided.'
    };
  }

  /* ---- Render Results ---- */
  renderResults(result) {
    // Impact badge
    const impactColors = { Critical: 'error', High: 'warning', Medium: 'info', Low: 'neutral' };
    const impactHTML = `
      <div style="text-align:center;margin-bottom:var(--space-xl)">
        <span class="badge badge-${impactColors[result.impactLevel] || 'neutral'}" style="font-size:var(--text-sm);padding:6px 16px">
          Impact: ${result.impactLevel}
        </span>
        <p style="color:var(--text-secondary);margin-top:var(--space-sm);font-size:var(--text-sm)">${result.summary}</p>
      </div>
    `;

    // Root cause analysis
    const rootCauseHTML = result.rootCause.map(rc => `
      <div class="finding-item">
        <div class="finding-icon ${rc.confidence === 'High' ? 'fail' : 'warn'}">${rc.confidence === 'High' ? '✗' : '!'}</div>
        <div class="finding-content">
          <h4>${rc.cause}</h4>
          <p>${rc.detail}</p>
        </div>
        <span class="badge badge-${rc.confidence === 'High' ? 'error' : 'warning'}">${rc.confidence}</span>
      </div>
    `).join('');

    // Gaps
    const gapsHTML = result.gaps.map(g => `
      <div class="finding-item">
        <div class="finding-icon fail">✗</div>
        <div class="finding-content">
          <h4>${g.area} — ${g.gapType}</h4>
          <p>${g.detail}</p>
        </div>
      </div>
    `).join('') || '<p class="text-muted" style="text-align:center;padding:var(--space-lg)">No specific gaps identified.</p>';

    // Recommendations
    const recsHTML = result.recommendations.map(r => `
      <div class="recommendation-card">
        <h4>${r.icon} ${r.title} (${r.type})</h4>
        <ul style="margin-top:var(--space-sm);padding-left:var(--space-lg);color:var(--text-secondary);font-size:var(--text-xs)">
          ${r.items.map(item => `<li style="margin-bottom:4px">${item}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    // Suggested TCs
    const suggestedTCsHTML = result.suggestedTestCases.map(tc => `
      <div class="checklist-item">
        <span class="checklist-icon">📝</span>
        <span class="checklist-text">${tc.title}</span>
        <span class="badge badge-${tc.priority === 'High' ? 'error' : 'warning'}">${tc.target}</span>
      </div>
    `).join('');

    return `
      <div class="results-container visible" style="animation: fadeSlideIn 0.5s ease">
        ${impactHTML}

        <div class="tabs">
          <button class="tab-btn active" onclick="PMEAnalyzer.switchTab(this,'pme-rootcause')">Root Cause</button>
          <button class="tab-btn" onclick="PMEAnalyzer.switchTab(this,'pme-gaps')">Plan Gaps</button>
          <button class="tab-btn" onclick="PMEAnalyzer.switchTab(this,'pme-recs')">Recommendations</button>
          <button class="tab-btn" onclick="PMEAnalyzer.switchTab(this,'pme-suggested')">Suggested TCs</button>
        </div>

        <div id="pme-rootcause" class="tab-panel active">${rootCauseHTML}</div>
        <div id="pme-gaps" class="tab-panel">${gapsHTML}</div>
        <div id="pme-recs" class="tab-panel">${recsHTML}</div>
        <div id="pme-suggested" class="tab-panel">${suggestedTCsHTML}</div>

        <div class="divider"></div>
        <button class="btn btn-secondary btn-sm" onclick="app.exportPMEReport()">📋 Export PME Report</button>
      </div>
    `;
  }

  static switchTab(btn, panelId) {
    const container = btn.closest('.results-container');
    container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(panelId).classList.add('active');
  }
}

window.PMEAnalyzer = PMEAnalyzer;

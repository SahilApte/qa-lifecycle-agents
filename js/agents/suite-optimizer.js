/* ================================================================
   Agent 6: Suite Optimizer
   Analyzes test plans for duplicates, gaps, and suggests improvements
   ================================================================ */

class SuiteOptimizer {
  constructor() {
    this.name = 'Suite Optimizer';
    this.SIMILARITY_THRESHOLD = 0.55;
  }

  /* ---- Main Optimization ---- */
  optimize(testCases) {
    if (!testCases || testCases.length === 0) {
      return this._emptyResult();
    }

    const duplicates = this._findDuplicates(testCases);
    const gaps = this._identifyGaps(testCases);
    const suggestions = this._generateSuggestions(testCases, duplicates, gaps);
    const coverageAnalysis = this._analyzeCoverage(testCases);
    const priorityDistribution = this._analyzePriority(testCases);

    return {
      totalTestCases: testCases.length,
      duplicates,
      gaps,
      suggestions,
      coverageAnalysis,
      priorityDistribution,
      optimizedCount: testCases.length - duplicates.length,
      healthScore: this._calculateHealthScore(testCases, duplicates, gaps)
    };
  }

  /* ---- Find Duplicate Test Cases ---- */
  _findDuplicates(testCases) {
    const duplicates = [];
    const seen = new Set();

    for (let i = 0; i < testCases.length; i++) {
      if (seen.has(i)) continue;

      for (let j = i + 1; j < testCases.length; j++) {
        if (seen.has(j)) continue;

        const similarity = ScoringEngine.textSimilarity(
          `${testCases[i].title} ${testCases[i].steps?.join(' ') || ''}`,
          `${testCases[j].title} ${testCases[j].steps?.join(' ') || ''}`
        );

        if (similarity >= this.SIMILARITY_THRESHOLD) {
          duplicates.push({
            testCase1: testCases[i],
            testCase2: testCases[j],
            similarity: Math.round(similarity * 100),
            recommendation: similarity >= 0.8 ? 'Remove one' : 'Consider merging'
          });
          seen.add(j);
        }
      }
    }

    return duplicates;
  }

  /* ---- Identify Coverage Gaps ---- */
  _identifyGaps(testCases) {
    const gaps = [];
    const allTypes = new Set(testCases.map(tc => tc.type));
    const allSteps = testCases.map(tc => (tc.steps || []).join(' ').toLowerCase()).join(' ');
    const allTitles = testCases.map(tc => tc.title.toLowerCase()).join(' ');
    const combined = allSteps + ' ' + allTitles;

    // Check for missing test types
    const expectedTypes = ['Positive', 'Negative', 'Edge Case', 'UI/UX', 'Security'];
    for (const type of expectedTypes) {
      if (!allTypes.has(type)) {
        gaps.push({
          category: 'Missing Test Type',
          detail: `No ${type} test cases found.`,
          severity: type === 'Negative' || type === 'Security' ? 'High' : 'Medium',
          suggestion: `Add at least 2-3 ${type} test cases to ensure comprehensive coverage.`
        });
      }
    }

    // Check for common missing scenarios
    const scenarioChecks = [
      { check: !combined.includes('error') && !combined.includes('invalid'), gap: 'Error Handling', suggestion: 'Add test cases for error states, validation failures, and error message display.' },
      { check: !combined.includes('empty') && !combined.includes('blank'), gap: 'Empty/Blank Input', suggestion: 'Add test cases for empty form submissions and blank field handling.' },
      { check: !combined.includes('special character') && !combined.includes('xss') && !combined.includes('injection'), gap: 'Input Sanitization', suggestion: 'Add test cases for XSS prevention and special character handling.' },
      { check: !combined.includes('timeout') && !combined.includes('slow'), gap: 'Timeout Handling', suggestion: 'Add test cases for network timeout and slow response scenarios.' },
      { check: !combined.includes('pagination') && !combined.includes('page'), gap: 'Pagination', suggestion: 'Add test cases for pagination, if data lists are involved.' },
      { check: !combined.includes('sort') && !combined.includes('filter'), gap: 'Sort & Filter', suggestion: 'Add test cases for sorting and filtering functionality.' },
      { check: !combined.includes('permission') && !combined.includes('role') && !combined.includes('unauthorized'), gap: 'Access Control', suggestion: 'Add test cases for role-based access control and unauthorized access.' },
      { check: !combined.includes('concurrent') && !combined.includes('parallel'), gap: 'Concurrency', suggestion: 'Consider test cases for concurrent user actions on the same resource.' },
      { check: !combined.includes('responsive') && !combined.includes('mobile'), gap: 'Responsive Design', suggestion: 'Add test cases for mobile and tablet viewport behavior.' },
      { check: !combined.includes('accessibility') && !combined.includes('screen reader'), gap: 'Accessibility', suggestion: 'Add accessibility test cases (keyboard nav, screen reader, ARIA attributes).' }
    ];

    for (const sc of scenarioChecks) {
      if (sc.check) {
        gaps.push({
          category: sc.gap,
          detail: `No test cases covering ${sc.gap.toLowerCase()}.`,
          severity: 'Medium',
          suggestion: sc.suggestion
        });
      }
    }

    return gaps;
  }

  /* ---- Generate Suggestions ---- */
  _generateSuggestions(testCases, duplicates, gaps) {
    const suggestions = [];

    // Duplicate removal suggestions
    if (duplicates.length > 0) {
      suggestions.push({
        type: 'remove',
        icon: '🗑️',
        title: `Remove ${duplicates.length} duplicate test case(s)`,
        detail: `Found ${duplicates.length} test case pair(s) with high similarity. Removing duplicates will reduce maintenance effort.`,
        items: duplicates.map(d => `${d.testCase2.id}: "${d.testCase2.title}" (${d.similarity}% similar to ${d.testCase1.id})`)
      });
    }

    // Gap filling suggestions
    const highGaps = gaps.filter(g => g.severity === 'High');
    const medGaps = gaps.filter(g => g.severity === 'Medium');

    if (highGaps.length > 0) {
      suggestions.push({
        type: 'add',
        icon: '🔴',
        title: `${highGaps.length} critical coverage gap(s) need attention`,
        detail: 'These gaps represent high-risk areas that should be addressed immediately.',
        items: highGaps.map(g => `${g.category}: ${g.suggestion}`)
      });
    }

    if (medGaps.length > 0) {
      suggestions.push({
        type: 'add',
        icon: '🟡',
        title: `${medGaps.length} recommended improvement(s)`,
        detail: 'Adding these test cases will improve overall test suite quality.',
        items: medGaps.map(g => `${g.category}: ${g.suggestion}`)
      });
    }

    // Priority balance suggestion
    const highPriority = testCases.filter(tc => tc.priority === 'High').length;
    const total = testCases.length;
    if (highPriority / total > 0.7) {
      suggestions.push({
        type: 'rebalance',
        icon: '⚖️',
        title: 'Priority distribution is top-heavy',
        detail: `${Math.round(highPriority / total * 100)}% of test cases are marked High priority. Consider reassessing priorities for a more balanced smoke/regression split.`,
        items: []
      });
    }

    return suggestions;
  }

  /* ---- Coverage Analysis ---- */
  _analyzeCoverage(testCases) {
    const types = {};
    for (const tc of testCases) {
      types[tc.type] = (types[tc.type] || 0) + 1;
    }

    return Object.entries(types).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round(count / testCases.length * 100)
    })).sort((a, b) => b.count - a.count);
  }

  /* ---- Priority Analysis ---- */
  _analyzePriority(testCases) {
    const priorities = { High: 0, Medium: 0, Low: 0 };
    for (const tc of testCases) {
      priorities[tc.priority] = (priorities[tc.priority] || 0) + 1;
    }
    return priorities;
  }

  /* ---- Health Score ---- */
  _calculateHealthScore(testCases, duplicates, gaps) {
    let score = 10;
    score -= duplicates.length * 0.5;
    score -= gaps.filter(g => g.severity === 'High').length * 1.0;
    score -= gaps.filter(g => g.severity === 'Medium').length * 0.3;
    if (testCases.length < 5) score -= 2;
    return Math.max(Math.round(score * 10) / 10, 0);
  }

  /* ---- Empty Result ---- */
  _emptyResult() {
    return {
      totalTestCases: 0,
      duplicates: [],
      gaps: [],
      suggestions: [],
      coverageAnalysis: [],
      priorityDistribution: {},
      optimizedCount: 0,
      healthScore: 0
    };
  }

  /* ---- Render Results ---- */
  renderResults(result) {
    const healthRing = ExportUtils.createScoreRing(result.healthScore);

    const statsHTML = `
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-card-value">${result.totalTestCases}</div>
          <div class="stat-card-label">Total Cases</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value text-error">${result.duplicates.length}</div>
          <div class="stat-card-label">Duplicates</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value text-warning">${result.gaps.length}</div>
          <div class="stat-card-label">Gaps Found</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value text-success">${result.optimizedCount}</div>
          <div class="stat-card-label">After Optimization</div>
        </div>
      </div>
    `;

    // Coverage breakdown
    const coverageHTML = result.coverageAnalysis.map(c => `
      <div class="checklist-item">
        <span class="checklist-icon">📊</span>
        <span class="checklist-text">${c.type}</span>
        <span class="badge badge-neutral">${c.count} (${c.percentage}%)</span>
      </div>
    `).join('');

    // Suggestions
    const suggestionsHTML = result.suggestions.map(s => `
      <div class="recommendation-card">
        <h4>${s.icon} ${s.title}</h4>
        <p>${s.detail}</p>
        ${s.items.length > 0 ? `
          <ul style="margin-top:var(--space-sm);padding-left:var(--space-lg);color:var(--text-secondary);font-size:var(--text-xs)">
            ${s.items.map(item => `<li style="margin-bottom:4px">${item}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `).join('');

    // Duplicates detail
    const duplicatesHTML = result.duplicates.length > 0 ? result.duplicates.map(d => `
      <div class="finding-item">
        <div class="finding-icon warn">⚠</div>
        <div class="finding-content">
          <h4>${d.testCase1.id} ↔ ${d.testCase2.id} (${d.similarity}% similar)</h4>
          <p><strong>${d.recommendation}:</strong> "${d.testCase1.title}" vs "${d.testCase2.title}"</p>
        </div>
      </div>
    `).join('') : '<p class="text-muted" style="text-align:center;padding:var(--space-lg)">No duplicates found — test suite is clean!</p>';

    return `
      <div class="results-container visible" style="animation: fadeSlideIn 0.5s ease">
        ${healthRing}
        <p style="text-align:center;color:var(--text-secondary);margin-bottom:var(--space-xl);font-size:var(--text-sm)">Test Suite Health Score</p>

        ${statsHTML}

        <div class="tabs">
          <button class="tab-btn active" onclick="SuiteOptimizer.switchTab(this,'opt-suggestions')">Suggestions</button>
          <button class="tab-btn" onclick="SuiteOptimizer.switchTab(this,'opt-duplicates')">Duplicates</button>
          <button class="tab-btn" onclick="SuiteOptimizer.switchTab(this,'opt-coverage')">Coverage</button>
          <button class="tab-btn" onclick="SuiteOptimizer.switchTab(this,'opt-gaps')">Gaps</button>
        </div>

        <div id="opt-suggestions" class="tab-panel active">${suggestionsHTML || '<p class="text-muted" style="text-align:center;padding:var(--space-xl)">No suggestions — suite is well-optimized!</p>'}</div>
        <div id="opt-duplicates" class="tab-panel">${duplicatesHTML}</div>
        <div id="opt-coverage" class="tab-panel">${coverageHTML}</div>
        <div id="opt-gaps" class="tab-panel">
          ${result.gaps.map(g => `
            <div class="finding-item">
              <div class="finding-icon ${g.severity === 'High' ? 'fail' : 'warn'}">${g.severity === 'High' ? '✗' : '!'}</div>
              <div class="finding-content">
                <h4>${g.category}</h4>
                <p>${g.suggestion}</p>
              </div>
              <span class="badge badge-${g.severity === 'High' ? 'error' : 'warning'}">${g.severity}</span>
            </div>
          `).join('')}
        </div>

        <div class="divider"></div>
        <div class="flex gap-sm">
          <button class="btn btn-secondary btn-sm" onclick="app.exportOptimizerReport()">📋 Export Report</button>
          <button class="btn btn-primary btn-sm" onclick="app.sendToScriptWriter()">→ Generate Scripts</button>
        </div>
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

window.SuiteOptimizer = SuiteOptimizer;

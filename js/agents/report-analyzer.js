/* ================================================================
   Agent 10: Report Analyzer
   Reads automation execution reports, identifies failure patterns,
   and provides root cause analysis of common failures
   ================================================================ */

class ReportAnalyzer {
  constructor() {
    this.name = 'Report Analyzer';
  }

  /* ---- Main Analysis ---- */
  analyze(reportText) {
    if (!reportText || reportText.trim().length === 0) {
      return this._emptyResult();
    }

    // Parse the report
    const parsed = this._parseReport(reportText);

    // Categorize failures
    const failureCategories = this._categorizeFailures(parsed.failures);

    // Identify common patterns
    const patterns = this._identifyPatterns(parsed.failures);

    // Root cause analysis
    const rootCauses = this._analyzeRootCauses(failureCategories, patterns);

    // Generate recommendations
    const recommendations = this._generateRecommendations(rootCauses, failureCategories);

    // Stability metrics
    const metrics = this._calculateMetrics(parsed);

    return {
      parsed,
      failureCategories,
      patterns,
      rootCauses,
      recommendations,
      metrics,
      summary: this._generateSummary(parsed, rootCauses)
    };
  }

  /* ---- Parse Report Text ---- */
  _parseReport(reportText) {
    const lines = reportText.split('\n').filter(l => l.trim().length > 0);
    const total = [];
    const passed = [];
    const failed = [];
    const skipped = [];
    const failures = [];

    for (const line of lines) {
      const lower = line.toLowerCase().trim();

      // Detect test results
      if (lower.includes('pass') || lower.includes('✓') || lower.includes('success')) {
        passed.push(line.trim());
        total.push({ name: line.trim(), status: 'pass' });
      } else if (lower.includes('fail') || lower.includes('✗') || lower.includes('error') || lower.includes('assert')) {
        failed.push(line.trim());
        total.push({ name: line.trim(), status: 'fail' });

        // Extract failure details
        failures.push({
          testName: line.trim(),
          errorMessage: this._extractErrorMessage(line, lines),
          line: line.trim()
        });
      } else if (lower.includes('skip') || lower.includes('ignore') || lower.includes('pending')) {
        skipped.push(line.trim());
        total.push({ name: line.trim(), status: 'skip' });
      }
    }

    // Try to extract numbers if no individual results found
    let totalCount = total.length;
    let passCount = passed.length;
    let failCount = failed.length;
    let skipCount = skipped.length;

    // Parse summary lines like "Tests run: 50, Failures: 5, Skipped: 2"
    for (const line of lines) {
      const totalMatch = line.match(/(?:tests?\s*(?:run)?|total)\s*[:=]\s*(\d+)/i);
      const passMatch = line.match(/(?:pass(?:ed)?|success)\s*[:=]\s*(\d+)/i);
      const failMatch = line.match(/(?:fail(?:ure|ed)?s?)\s*[:=]\s*(\d+)/i);
      const skipMatch = line.match(/(?:skip(?:ped)?|ignored?)\s*[:=]\s*(\d+)/i);

      if (totalMatch) totalCount = Math.max(totalCount, parseInt(totalMatch[1]));
      if (passMatch) passCount = Math.max(passCount, parseInt(passMatch[1]));
      if (failMatch) failCount = Math.max(failCount, parseInt(failMatch[1]));
      if (skipMatch) skipCount = Math.max(skipCount, parseInt(skipMatch[1]));
    }

    // Estimate if only total found
    if (totalCount > 0 && passCount === 0 && failCount === 0) {
      failCount = failures.length;
      passCount = totalCount - failCount - skipCount;
    }

    return {
      totalCount: Math.max(totalCount, 1),
      passCount,
      failCount,
      skipCount,
      failures,
      rawLines: lines
    };
  }

  /* ---- Extract Error Message from Context ---- */
  _extractErrorMessage(failLine, allLines) {
    const idx = allLines.indexOf(failLine);
    if (idx >= 0 && idx + 1 < allLines.length) {
      const nextLines = allLines.slice(idx, Math.min(idx + 4, allLines.length));
      return nextLines.join(' ').substring(0, 200);
    }
    return failLine;
  }

  /* ---- Categorize Failures ---- */
  _categorizeFailures(failures) {
    const categories = {
      'Element Not Found': { count: 0, items: [], color: '#f43f5e', icon: '🔍' },
      'Timeout / Wait': { count: 0, items: [], color: '#f59e0b', icon: '⏱️' },
      'Assertion Failure': { count: 0, items: [], color: '#8b5cf6', icon: '❌' },
      'Stale Element': { count: 0, items: [], color: '#06b6d4', icon: '🔄' },
      'Network / API': { count: 0, items: [], color: '#3b82f6', icon: '🌐' },
      'Data Issue': { count: 0, items: [], color: '#10b981', icon: '📊' },
      'Configuration': { count: 0, items: [], color: '#f97316', icon: '⚙️' },
      'Other / Unknown': { count: 0, items: [], color: '#64748b', icon: '❓' }
    };

    for (const failure of failures) {
      const msg = (failure.testName + ' ' + failure.errorMessage).toLowerCase();

      if (msg.includes('no such element') || msg.includes('element not found') || msg.includes('nosuchelement') || msg.includes('unable to locate') || msg.includes('not found')) {
        categories['Element Not Found'].count++;
        categories['Element Not Found'].items.push(failure);
      } else if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('wait') || msg.includes('timeoutexception')) {
        categories['Timeout / Wait'].count++;
        categories['Timeout / Wait'].items.push(failure);
      } else if (msg.includes('assert') || msg.includes('expected') || msg.includes('actual') || msg.includes('comparison')) {
        categories['Assertion Failure'].count++;
        categories['Assertion Failure'].items.push(failure);
      } else if (msg.includes('stale') || msg.includes('staleelementreference') || msg.includes('detached')) {
        categories['Stale Element'].count++;
        categories['Stale Element'].items.push(failure);
      } else if (msg.includes('http') || msg.includes('api') || msg.includes('network') || msg.includes('connection') || msg.includes('status code') || msg.includes('502') || msg.includes('500') || msg.includes('404')) {
        categories['Network / API'].count++;
        categories['Network / API'].items.push(failure);
      } else if (msg.includes('data') || msg.includes('null pointer') || msg.includes('nullpointer') || msg.includes('null') || msg.includes('missing')) {
        categories['Data Issue'].count++;
        categories['Data Issue'].items.push(failure);
      } else if (msg.includes('config') || msg.includes('driver') || msg.includes('setup') || msg.includes('browser') || msg.includes('chrome')) {
        categories['Configuration'].count++;
        categories['Configuration'].items.push(failure);
      } else {
        categories['Other / Unknown'].count++;
        categories['Other / Unknown'].items.push(failure);
      }
    }

    // Return only categories with failures, sorted by count
    return Object.entries(categories)
      .filter(([_, v]) => v.count > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data]) => ({ name, ...data }));
  }

  /* ---- Identify Patterns ---- */
  _identifyPatterns(failures) {
    const patterns = [];

    if (failures.length === 0) return patterns;

    // Check for repeated errors
    const errorTypes = {};
    for (const f of failures) {
      const key = f.errorMessage ? f.errorMessage.substring(0, 80) : f.testName.substring(0, 80);
      errorTypes[key] = (errorTypes[key] || 0) + 1;
    }

    const repeated = Object.entries(errorTypes).filter(([_, count]) => count > 1);
    if (repeated.length > 0) {
      patterns.push({
        pattern: 'Repeated Error',
        description: `${repeated.length} error pattern(s) appear multiple times, suggesting a systemic issue.`,
        severity: 'High',
        affected: repeated.map(([msg, count]) => `"${msg.substring(0, 60)}..." (${count}x)`)
      });
    }

    // Check for cluster failures (many failures in same area)
    const moduleFailures = {};
    for (const f of failures) {
      const module = f.testName.split(/[._]/)[0] || 'Unknown';
      moduleFailures[module] = (moduleFailures[module] || 0) + 1;
    }

    const clusterModules = Object.entries(moduleFailures).filter(([_, count]) => count >= 3);
    if (clusterModules.length > 0) {
      patterns.push({
        pattern: 'Module Cluster Failure',
        description: 'Multiple failures concentrated in specific modules, suggesting a module-level issue.',
        severity: 'High',
        affected: clusterModules.map(([module, count]) => `${module} (${count} failures)`)
      });
    }

    // High failure rate
    if (failures.length > 5) {
      patterns.push({
        pattern: 'High Failure Volume',
        description: `${failures.length} test failures detected. This may indicate environment instability or a major regression.`,
        severity: 'Critical',
        affected: [`${failures.length} total failures`]
      });
    }

    return patterns;
  }

  /* ---- Root Cause Analysis ---- */
  _analyzeRootCauses(failureCategories, patterns) {
    const causes = [];

    for (const cat of failureCategories) {
      const causeMap = {
        'Element Not Found': { cause: 'Locator Changes / DOM Updates', fix: 'Update locators in page objects. Check if the application UI was recently changed. Use stable locators (data-testid, aria-label) instead of fragile ones (XPath, CSS index).' },
        'Timeout / Wait': { cause: 'Performance Degradation / Slow Environment', fix: 'Increase wait timeouts, add explicit waits, check environment performance, review network conditions.' },
        'Assertion Failure': { cause: 'Application Behavior Change / Bug', fix: 'Verify if the expected behavior has changed. If it\'s a bug, raise a defect. If behavior changed, update the expected results.' },
        'Stale Element': { cause: 'Page Refresh / DOM Re-render', fix: 'Add re-find logic after page transitions. Use explicit waits for element staleness. Avoid storing element references across actions.' },
        'Network / API': { cause: 'Backend Service Issues / Environment Instability', fix: 'Check API server health, network connectivity, and test environment status. Add API health checks before test execution.' },
        'Data Issue': { cause: 'Test Data Corruption / Missing Prerequisites', fix: 'Reset test data before suite execution. Ensure data setup scripts run successfully. Add data validation pre-checks.' },
        'Configuration': { cause: 'Driver/Environment Setup Issues', fix: 'Verify WebDriver version compatibility, browser version, and test configuration files.' },
        'Other / Unknown': { cause: 'Unclassified Error', fix: 'Manually review the failure logs for specific error details.' }
      };

      const mapped = causeMap[cat.name] || causeMap['Other / Unknown'];
      causes.push({
        category: cat.name,
        failureCount: cat.count,
        rootCause: mapped.cause,
        suggestedFix: mapped.fix,
        icon: cat.icon
      });
    }

    return causes;
  }

  /* ---- Generate Recommendations ---- */
  _generateRecommendations(rootCauses, failureCategories) {
    const recs = [];

    const hasLocatorIssues = failureCategories.some(c => c.name === 'Element Not Found' || c.name === 'Stale Element');
    const hasTimeouts = failureCategories.some(c => c.name === 'Timeout / Wait');
    const hasAssertions = failureCategories.some(c => c.name === 'Assertion Failure');

    if (hasLocatorIssues) {
      recs.push({
        priority: 'High',
        title: '🔍 Locator Strategy Improvement',
        detail: 'Switch to data-testid or aria-label based locators. Avoid XPath with indices. Implement a locator self-healing mechanism. Run the Self-Healer Agent to auto-fix broken locators.'
      });
    }

    if (hasTimeouts) {
      recs.push({
        priority: 'High',
        title: '⏱️ Wait Strategy Optimization',
        detail: 'Replace Thread.sleep with explicit WebDriverWait. Use fluent waits with polling intervals. Add page load complete checks before interactions.'
      });
    }

    if (hasAssertions) {
      recs.push({
        priority: 'Medium',
        title: '❌ Test Assertion Review',
        detail: 'Verify expected results against current application behavior. Check if recent deployments changed functionality. Update baselines if behavior changes are intentional.'
      });
    }

    recs.push({
      priority: 'Medium',
      title: '🔄 Implement Retry Mechanism',
      detail: 'Add retry logic for flaky tests (TestNG retry analyzer). Set max retries to 2 to distinguish real failures from transient issues.'
    });

    recs.push({
      priority: 'Low',
      title: '📊 Add Reporting Dashboard',
      detail: 'Integrate Allure or ExtentReports for historical trend analysis. Track failure rates over time to identify degradation patterns.'
    });

    return recs;
  }

  /* ---- Calculate Metrics ---- */
  _calculateMetrics(parsed) {
    const passRate = parsed.totalCount > 0 ? Math.round(parsed.passCount / parsed.totalCount * 100) : 0;
    const failRate = parsed.totalCount > 0 ? Math.round(parsed.failCount / parsed.totalCount * 100) : 0;

    let stability = 'Stable';
    if (failRate > 30) stability = 'Critical';
    else if (failRate > 15) stability = 'Unstable';
    else if (failRate > 5) stability = 'Moderate';

    return { passRate, failRate, stability };
  }

  /* ---- Generate Summary ---- */
  _generateSummary(parsed, rootCauses) {
    const primary = rootCauses.length > 0 ? rootCauses[0] : null;
    const passRate = parsed.totalCount > 0 ? Math.round(parsed.passCount / parsed.totalCount * 100) : 0;
    return `${passRate}% pass rate (${parsed.passCount}/${parsed.totalCount}). ${parsed.failCount} failures detected.${primary ? ` Primary issue: ${primary.rootCause}.` : ''}`;
  }

  /* ---- Empty Result ---- */
  _emptyResult() {
    return {
      parsed: { totalCount: 0, passCount: 0, failCount: 0, skipCount: 0, failures: [] },
      failureCategories: [],
      patterns: [],
      rootCauses: [],
      recommendations: [],
      metrics: { passRate: 0, failRate: 0, stability: 'Unknown' },
      summary: 'No report data provided.'
    };
  }

  /* ---- Render Results ---- */
  renderResults(result) {
    const { parsed, metrics } = result;

    // Stability badge
    const stabilityColors = { Stable: 'success', Moderate: 'info', Unstable: 'warning', Critical: 'error', Unknown: 'neutral' };

    const metricsHTML = `
      <div style="text-align:center;margin-bottom:var(--space-xl)">
        <span class="badge badge-${stabilityColors[metrics.stability]}" style="font-size:var(--text-sm);padding:6px 16px">
          Suite Stability: ${metrics.stability}
        </span>
        <p style="color:var(--text-secondary);margin-top:var(--space-sm);font-size:var(--text-sm)">${result.summary}</p>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-card-value">${parsed.totalCount}</div>
          <div class="stat-card-label">Total Tests</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value text-success">${parsed.passCount}</div>
          <div class="stat-card-label">Passed (${metrics.passRate}%)</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value text-error">${parsed.failCount}</div>
          <div class="stat-card-label">Failed (${metrics.failRate}%)</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value text-muted">${parsed.skipCount}</div>
          <div class="stat-card-label">Skipped</div>
        </div>
      </div>
    `;

    // Failure categories
    const categoriesHTML = result.failureCategories.map(cat => `
      <div class="finding-item">
        <div class="finding-icon fail">${cat.icon}</div>
        <div class="finding-content">
          <h4>${cat.name}</h4>
          <p>${cat.count} failure(s) in this category</p>
        </div>
        <span class="badge badge-error">${cat.count}</span>
      </div>
    `).join('') || '<p class="text-muted" style="text-align:center;padding:var(--space-lg)">No categorized failures.</p>';

    // Root causes
    const rootCausesHTML = result.rootCauses.map(rc => `
      <div class="recommendation-card">
        <h4>${rc.icon} ${rc.category} (${rc.failureCount} failures)</h4>
        <p><strong>Root Cause:</strong> ${rc.rootCause}</p>
        <p style="margin-top:var(--space-xs)"><strong>Fix:</strong> ${rc.suggestedFix}</p>
      </div>
    `).join('');

    // Patterns
    const patternsHTML = result.patterns.map(p => `
      <div class="finding-item">
        <div class="finding-icon ${p.severity === 'Critical' ? 'fail' : 'warn'}">⚡</div>
        <div class="finding-content">
          <h4>${p.pattern}</h4>
          <p>${p.description}</p>
          ${p.affected.length > 0 ? `<ul style="margin-top:4px;padding-left:var(--space-lg);font-size:var(--text-xs);color:var(--text-muted)">
            ${p.affected.map(a => `<li>${a}</li>`).join('')}
          </ul>` : ''}
        </div>
        <span class="badge badge-${p.severity === 'Critical' ? 'error' : 'warning'}">${p.severity}</span>
      </div>
    `).join('') || '<p class="text-muted" style="text-align:center;padding:var(--space-lg)">No patterns detected.</p>';

    // Recommendations
    const recsHTML = result.recommendations.map(r => `
      <div class="recommendation-card">
        <h4>${r.title}</h4>
        <p>${r.detail}</p>
      </div>
    `).join('');

    return `
      <div class="results-container visible" style="animation: fadeSlideIn 0.5s ease">
        ${metricsHTML}

        <div class="tabs">
          <button class="tab-btn active" onclick="ReportAnalyzer.switchTab(this,'rpt-categories')">Failure Categories</button>
          <button class="tab-btn" onclick="ReportAnalyzer.switchTab(this,'rpt-rootcauses')">Root Causes</button>
          <button class="tab-btn" onclick="ReportAnalyzer.switchTab(this,'rpt-patterns')">Patterns</button>
          <button class="tab-btn" onclick="ReportAnalyzer.switchTab(this,'rpt-recs')">Recommendations</button>
        </div>

        <div id="rpt-categories" class="tab-panel active">${categoriesHTML}</div>
        <div id="rpt-rootcauses" class="tab-panel">${rootCausesHTML}</div>
        <div id="rpt-patterns" class="tab-panel">${patternsHTML}</div>
        <div id="rpt-recs" class="tab-panel">${recsHTML}</div>

        <div class="divider"></div>
        <button class="btn btn-secondary btn-sm" onclick="app.exportReportAnalysis()">📋 Export Analysis</button>
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

window.ReportAnalyzer = ReportAnalyzer;

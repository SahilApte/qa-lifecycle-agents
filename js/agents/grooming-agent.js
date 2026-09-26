/* ================================================================
   Agent 1: Grooming Agent
   Analyzes user stories for completeness and quality
   Gives a score out of 10 with detailed gap analysis
   ================================================================ */

class GroomingAgent {
  constructor() {
    this.name = 'Grooming Agent';
    this.categories = [
      { key: 'title', label: 'Title', weight: 1.0, icon: '📌' },
      { key: 'description', label: 'Description', weight: 1.5, icon: '📝' },
      { key: 'acceptanceCriteria', label: 'Acceptance Criteria', weight: 2.0, icon: '✅' },
      { key: 'storyFormat', label: 'User Story Format', weight: 1.0, icon: '📖' },
      { key: 'priority', label: 'Priority / Severity', weight: 0.8, icon: '🔴' },
      { key: 'storyPoints', label: 'Story Points / Estimation', weight: 0.7, icon: '⏱️' },
      { key: 'dependencies', label: 'Dependencies', weight: 0.8, icon: '🔗' },
      { key: 'assumptions', label: 'Assumptions & Constraints', weight: 0.7, icon: '💡' },
      { key: 'dod', label: 'Definition of Done', weight: 1.0, icon: '🏁' },
      { key: 'uiMockups', label: 'UI/UX Mockups Reference', weight: 0.6, icon: '🎨' },
      { key: 'technicalNotes', label: 'Technical Notes', weight: 0.7, icon: '⚙️' },
      { key: 'edgeCases', label: 'Edge Cases Mentioned', weight: 1.2, icon: '🔍' }
    ];
  }

  /* ---- Main Analysis Method ---- */
  analyze(storyText) {
    if (!storyText || storyText.trim().length === 0) {
      return this._emptyResult();
    }

    const sections = this._parseSections(storyText);
    const scores = {};
    const findings = [];

    // Analyze Title
    const titleResult = this._analyzeTitle(sections.title || storyText);
    scores.title = titleResult.score;
    findings.push(...titleResult.findings);

    // Analyze Description
    const descResult = this._analyzeDescription(sections.description || storyText);
    scores.description = descResult.score;
    findings.push(...descResult.findings);

    // Analyze Acceptance Criteria
    const acResult = this._analyzeAC(sections.acceptanceCriteria || storyText);
    scores.acceptanceCriteria = acResult.score;
    findings.push(...acResult.findings);

    // Check User Story Format
    const formatResult = ScoringEngine.checkUserStoryFormat(storyText);
    scores.storyFormat = formatResult.score;
    if (formatResult.score >= 0.7) {
      findings.push({ type: 'pass', title: 'User Story Format', desc: 'Follows "As a... I want... So that..." format correctly.' });
    } else {
      const missing = [];
      if (!formatResult.hasAsA) missing.push('"As a [role]"');
      if (!formatResult.hasIWant) missing.push('"I want [feature]"');
      if (!formatResult.hasSoThat) missing.push('"So that [benefit]"');
      findings.push({ type: 'warn', title: 'User Story Format', desc: `Missing: ${missing.join(', ')}. Use the standard format for clarity.` });
    }

    // Check Priority
    const priorityResult = this._checkPresence(storyText, ['priority', 'severity', 'critical', 'high', 'medium', 'low', 'P0', 'P1', 'P2', 'P3', 'blocker', 'major', 'minor']);
    scores.priority = priorityResult.score;
    findings.push(priorityResult.finding);

    // Check Story Points
    const spResult = this._checkPresence(storyText, ['story point', 'estimation', 'effort', 'sprint', 'fibonacci', 'complexity', 'points:', 'SP:', 'estimate']);
    scores.storyPoints = spResult.score;
    findings.push(spResult.finding);

    // Check Dependencies
    const depResult = this._checkPresence(storyText, ['depends on', 'dependency', 'blocked by', 'prerequisite', 'requires', 'dependent', 'blocking']);
    scores.dependencies = depResult.score;
    findings.push(depResult.finding);

    // Check Assumptions
    const assumeResult = this._checkPresence(storyText, ['assumption', 'constraint', 'assumes', 'assuming', 'limitation', 'out of scope', 'in scope']);
    scores.assumptions = assumeResult.score;
    findings.push(assumeResult.finding);

    // Check Definition of Done
    const dodResult = this._checkPresence(storyText, ['definition of done', 'DoD', 'done when', 'completed when', 'done criteria', 'completion criteria']);
    scores.dod = dodResult.score;
    findings.push(dodResult.finding);

    // Check UI/UX
    const uiResult = this._checkPresence(storyText, ['mockup', 'wireframe', 'design', 'UI', 'UX', 'figma', 'prototype', 'layout', 'screenshot']);
    scores.uiMockups = uiResult.score;
    findings.push(uiResult.finding);

    // Check Technical Notes
    const techResult = this._checkPresence(storyText, ['API', 'endpoint', 'database', 'schema', 'backend', 'frontend', 'service', 'microservice', 'architecture', 'integration', 'migration']);
    scores.technicalNotes = techResult.score;
    findings.push(techResult.finding);

    // Check Edge Cases
    const edgeResult = ScoringEngine.detectEdgeCases(storyText);
    scores.edgeCases = edgeResult.score;
    if (edgeResult.categories && edgeResult.categories.length > 0) {
      findings.push({ type: 'pass', title: 'Edge Cases', desc: `Covers: ${edgeResult.categories.join(', ')}.` });
    } else {
      findings.push({ type: 'fail', title: 'Edge Cases', desc: 'No edge cases mentioned. Consider error handling, boundary conditions, security, and performance scenarios.' });
    }

    // Calculate overall score
    const weights = {};
    this.categories.forEach(c => { weights[c.key] = c.weight; });
    const overallNormalized = ScoringEngine.calculateWeightedScore(scores, weights);
    const overallScore = ScoringEngine.toTenScale(overallNormalized);
    const scoreClass = ScoringEngine.getScoreClass(overallScore);

    // Build category breakdown
    const breakdown = this.categories.map(cat => ({
      ...cat,
      score: Math.round(scores[cat.key] * 100),
      raw: scores[cat.key]
    }));

    // Generate recommendations
    const recommendations = this._generateRecommendations(scores, breakdown);

    return {
      overallScore,
      scoreClass,
      breakdown,
      findings,
      recommendations,
      summary: this._generateSummary(overallScore, scoreClass),
      rawScores: scores,
      storyText
    };
  }

  /* ---- Parse Sections ---- */
  _parseSections(text) {
    const sections = {};
    const lines = text.split('\n');
    let currentSection = 'description';

    const sectionMap = {
      'title': ['title'],
      'description': ['description', 'summary', 'overview', 'details'],
      'acceptanceCriteria': ['acceptance criteria', 'ac', 'criteria', 'given', 'when', 'then'],
      'dependencies': ['dependencies', 'dependency', 'depends on'],
      'assumptions': ['assumptions', 'constraints'],
      'dod': ['definition of done', 'dod'],
      'technicalNotes': ['technical notes', 'tech notes', 'implementation notes'],
      'uiMockups': ['ui', 'ux', 'mockups', 'design']
    };

    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();

      // Check if line is a section header
      for (const [section, keywords] of Object.entries(sectionMap)) {
        if (keywords.some(k => lowerLine.startsWith(k) || lowerLine.includes(k + ':'))) {
          currentSection = section;
          break;
        }
      }

      if (!sections[currentSection]) sections[currentSection] = '';
      sections[currentSection] += line + '\n';
    }

    // Extract title (first non-empty line if not explicitly marked)
    if (!sections.title) {
      sections.title = lines.find(l => l.trim().length > 0) || '';
    }

    return sections;
  }

  /* ---- Analyze Title ---- */
  _analyzeTitle(titleText) {
    const findings = [];
    const title = titleText.trim().split('\n')[0];
    let score = 0;

    if (title.length > 0) {
      score += 0.3;
      if (title.length >= 10) score += 0.2;
      if (title.length >= 20 && title.length <= 80) score += 0.2;
      if (!/^\d/.test(title)) score += 0.1;
      // Check if title is descriptive (has a verb)
      const verbs = ['create', 'add', 'update', 'delete', 'remove', 'implement', 'fix', 'enable', 'display', 'allow', 'integrate', 'configure', 'validate', 'manage', 'design', 'build'];
      if (verbs.some(v => title.toLowerCase().includes(v))) score += 0.2;

      if (score >= 0.7) {
        findings.push({ type: 'pass', title: 'Title Quality', desc: `Clear and descriptive title (${title.length} chars).` });
      } else {
        findings.push({ type: 'warn', title: 'Title Quality', desc: 'Title could be more descriptive. Include an action verb and context.' });
      }
    } else {
      findings.push({ type: 'fail', title: 'Title Missing', desc: 'No title found. Add a clear, concise title describing the user story.' });
    }

    return { score: Math.min(score, 1), findings };
  }

  /* ---- Analyze Description ---- */
  _analyzeDescription(descText) {
    const findings = [];
    const quality = ScoringEngine.analyzeTextQuality(descText);

    if (quality.level === 'excellent' || quality.level === 'good') {
      findings.push({ type: 'pass', title: 'Description Quality', desc: `Detailed description with ${quality.wordCount} words and ${quality.sentenceCount} sentences.` });
    } else if (quality.level === 'fair') {
      findings.push({ type: 'warn', title: 'Description Quality', desc: `Description has ${quality.wordCount} words. Consider expanding with more context, user journey, and business value.` });
    } else {
      findings.push({ type: 'fail', title: 'Description Quality', desc: 'Description is too brief or missing. A good description should explain the what, why, and context of the feature.' });
    }

    return { score: quality.score, findings };
  }

  /* ---- Analyze Acceptance Criteria ---- */
  _analyzeAC(acText) {
    const findings = [];
    const ac = ScoringEngine.analyzeAcceptanceCriteria(acText);

    if (ac.criteriaCount >= 3) {
      findings.push({ type: 'pass', title: 'Acceptance Criteria', desc: `${ac.criteriaCount} criteria found${ac.hasGherkin ? ' (Gherkin format ✓)' : ''}${ac.hasNumbered ? ' (Numbered list ✓)' : ''}.` });
    } else if (ac.criteriaCount >= 1) {
      findings.push({ type: 'warn', title: 'Acceptance Criteria', desc: `Only ${ac.criteriaCount} criteria found. Aim for at least 3-5 acceptance criteria covering happy path, error scenarios, and edge cases.` });
    } else {
      findings.push({ type: 'fail', title: 'Acceptance Criteria Missing', desc: 'No clear acceptance criteria found. Add specific, testable conditions using Given/When/Then or numbered list format.' });
    }

    return { score: ac.score, findings };
  }

  /* ---- Check Keyword Presence ---- */
  _checkPresence(text, keywords) {
    const result = ScoringEngine.containsKeywords(text, keywords);
    const catName = keywords[0].charAt(0).toUpperCase() + keywords[0].slice(1);

    if (result.score >= 0.3) {
      return {
        score: Math.min(result.score * 2, 1),
        finding: { type: 'pass', title: catName, desc: `Found references: ${result.found.slice(0, 3).join(', ')}.` }
      };
    } else {
      return {
        score: 0,
        finding: { type: 'fail', title: catName, desc: `Not mentioned. Consider adding: ${keywords.slice(0, 3).join(', ')}.` }
      };
    }
  }

  /* ---- Generate Recommendations ---- */
  _generateRecommendations(scores, breakdown) {
    const recs = [];
    const lowScoreItems = breakdown.filter(b => b.raw < 0.5).sort((a, b) => a.raw - b.raw);

    for (const item of lowScoreItems.slice(0, 5)) {
      const rec = this._getRecommendation(item.key);
      if (rec) recs.push(rec);
    }

    return recs;
  }

  _getRecommendation(key) {
    const recommendations = {
      title: {
        title: '📌 Improve Title',
        desc: 'Write a clear, action-oriented title. Example: "Enable user password reset via email verification".'
      },
      description: {
        title: '📝 Expand Description',
        desc: 'Add context about the problem being solved, the user journey, and business value. Include who is affected and why this is important.'
      },
      acceptanceCriteria: {
        title: '✅ Add Acceptance Criteria',
        desc: 'Define 3-5 testable conditions. Use Given/When/Then format:\n• Given I am on the login page\n• When I enter valid credentials\n• Then I should be redirected to the dashboard'
      },
      storyFormat: {
        title: '📖 Use Standard User Story Format',
        desc: 'Format as: "As a [role], I want [feature], so that [benefit]". This clarifies who benefits and why.'
      },
      priority: {
        title: '🔴 Specify Priority',
        desc: 'Assign a priority level (P0-Critical, P1-High, P2-Medium, P3-Low) to help the team prioritize the backlog.'
      },
      storyPoints: {
        title: '⏱️ Add Estimation',
        desc: 'Include story points or effort estimation (1, 2, 3, 5, 8, 13) to help with sprint planning.'
      },
      dependencies: {
        title: '🔗 List Dependencies',
        desc: 'Identify any blockers, related stories, or prerequisite tasks that must be completed first.'
      },
      assumptions: {
        title: '💡 Document Assumptions',
        desc: 'List any assumptions made and constraints. Clarify what is in scope and out of scope.'
      },
      dod: {
        title: '🏁 Define Definition of Done',
        desc: 'Specify completion criteria: code reviewed, tests written, deployed to staging, documentation updated, etc.'
      },
      uiMockups: {
        title: '🎨 Reference UI/UX Designs',
        desc: 'Link to Figma mockups, wireframes, or screenshots. Visual references reduce ambiguity significantly.'
      },
      technicalNotes: {
        title: '⚙️ Add Technical Notes',
        desc: 'Include API endpoints, database schema changes, service dependencies, or architecture decisions.'
      },
      edgeCases: {
        title: '🔍 Consider Edge Cases',
        desc: 'Document edge cases: invalid inputs, empty states, concurrent access, error handling, boundary values, permission checks.'
      }
    };

    return recommendations[key] || null;
  }

  /* ---- Generate Summary ---- */
  _generateSummary(score, scoreClass) {
    if (scoreClass === 'excellent') return 'Excellent! This user story is well-defined and ready for development.';
    if (scoreClass === 'good') return 'Good story with minor gaps. Address the recommendations below for a production-ready story.';
    if (scoreClass === 'fair') return 'Needs improvement. Several key areas are missing or incomplete. Work on the highlighted gaps.';
    return 'Significant gaps found. This story needs substantial refinement before it can move forward.';
  }

  /* ---- Empty Result ---- */
  _emptyResult() {
    return {
      overallScore: 0,
      scoreClass: 'poor',
      breakdown: [],
      findings: [{ type: 'fail', title: 'Empty Input', desc: 'Please paste your user story text to begin analysis.' }],
      recommendations: [],
      summary: 'No user story provided.',
      rawScores: {}
    };
  }

  /* ---- Render Results ---- */
  renderResults(result) {
    const scoreRing = ExportUtils.createScoreRing(result.overallScore);
    const findingsHTML = result.findings.map(f =>
      ExportUtils.createFinding(f.type, f.title, f.desc)
    ).join('');

    const breakdownHTML = result.breakdown.map(b => {
      let status = 'fail';
      if (b.score >= 70) status = 'pass';
      else if (b.score >= 40) status = 'warn';

      return `
        <div class="checklist-item">
          <span class="checklist-icon">${b.icon}</span>
          <span class="checklist-text">${b.label}</span>
          <span class="checklist-score badge-${status === 'pass' ? 'success' : status === 'warn' ? 'warning' : 'error'} badge">${b.score}%</span>
        </div>
      `;
    }).join('');

    const recsHTML = result.recommendations.map(r => `
      <div class="recommendation-card">
        <h4>${r.title}</h4>
        <p>${r.desc}</p>
      </div>
    `).join('');

    return `
      <div class="results-container visible" style="animation: fadeSlideIn 0.5s ease">
        ${scoreRing}
        <p style="text-align:center;color:var(--text-secondary);margin-bottom:var(--space-xl);font-size:var(--text-sm)">${result.summary}</p>

        <div class="tabs">
          <button class="tab-btn active" onclick="GroomingAgent.switchTab(this,'grooming-findings')">Findings</button>
          <button class="tab-btn" onclick="GroomingAgent.switchTab(this,'grooming-breakdown')">Breakdown</button>
          <button class="tab-btn" onclick="GroomingAgent.switchTab(this,'grooming-recs')">Recommendations</button>
        </div>

        <div id="grooming-findings" class="tab-panel active">
          ${findingsHTML}
        </div>

        <div id="grooming-breakdown" class="tab-panel">
          ${breakdownHTML}
        </div>

        <div id="grooming-recs" class="tab-panel">
          ${recsHTML || '<p class="text-muted" style="text-align:center;padding:var(--space-xl)">No recommendations — your story looks great!</p>'}
        </div>

        <div class="divider"></div>
        <div class="flex gap-sm">
          <button class="btn btn-secondary btn-sm" onclick="app.exportGroomingResults()">📋 Export Report</button>
          <button class="btn btn-primary btn-sm" onclick="app.sendToEvaluation()">→ Send to Evaluation Agent</button>
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

window.GroomingAgent = GroomingAgent;

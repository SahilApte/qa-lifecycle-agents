/* ================================================================
   Export Utilities — Download & Format Helpers
   ================================================================ */

class ExportUtils {

  /* ---- Download as JSON ---- */
  static downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    ExportUtils.downloadFile(json, filename, 'application/json');
  }

  /* ---- Download as CSV ---- */
  static downloadCSV(rows, headers, filename) {
    const escape = (val) => {
      const str = String(val || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    let csv = headers.map(escape).join(',') + '\n';
    for (const row of rows) {
      csv += headers.map(h => escape(row[h] || '')).join(',') + '\n';
    }
    ExportUtils.downloadFile(csv, filename, 'text/csv');
  }

  /* ---- Download as Text/Code ---- */
  static downloadText(content, filename, type = 'text/plain') {
    ExportUtils.downloadFile(content, filename, type);
  }

  /* ---- Core Download ---- */
  static downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ---- Format Test Cases for Export ---- */
  static formatTestCasesForCSV(testCases) {
    return testCases.map(tc => ({
      'Test Case ID': tc.id,
      'Title': tc.title,
      'Type': tc.type,
      'Priority': tc.priority,
      'Preconditions': tc.preconditions || '',
      'Steps': tc.steps ? tc.steps.map((s, i) => `${i + 1}. ${s}`).join('\n') : '',
      'Expected Result': tc.expectedResult || '',
      'Status': tc.status || 'Not Run'
    }));
  }

  /* ---- Format Test Cases for Display ---- */
  static formatTestCasesForHTML(testCases) {
    return testCases.map(tc => {
      const priorityClass = (tc.priority || 'medium').toLowerCase();
      const typeLabel = tc.type || 'Functional';
      return `
        <div class="testcase-card" data-id="${tc.id}">
          <div class="testcase-card-header" onclick="this.parentElement.classList.toggle('expanded')">
            <span class="testcase-id">${tc.id}</span>
            <span class="testcase-title">${tc.title}</span>
            <span class="testcase-type">${typeLabel}</span>
            <span class="testcase-priority ${priorityClass}">${tc.priority}</span>
          </div>
          <div class="testcase-card-body">
            ${tc.preconditions ? `
              <div class="testcase-section-label">Preconditions</div>
              <p class="text-secondary" style="font-size:var(--text-sm);margin-bottom:var(--space-md)">${tc.preconditions}</p>
            ` : ''}
            <div class="testcase-section-label">Steps</div>
            <ol class="testcase-steps">
              ${(tc.steps || []).map(s => `<li>${s}</li>`).join('')}
            </ol>
            <div class="testcase-section-label">Expected Result</div>
            <div class="testcase-expected">${tc.expectedResult}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ---- Format Score Ring SVG ---- */
  static createScoreRing(score, maxScore = 10) {
    const pct = score / maxScore;
    const circumference = 2 * Math.PI * 54;
    const offset = circumference * (1 - pct);
    const color = ScoringEngine.getScoreColor(score);
    const scoreClass = ScoringEngine.getScoreClass(score);

    return `
      <div class="score-ring score-${scoreClass}">
        <svg width="140" height="140" viewBox="0 0 120 120">
          <circle class="score-ring-bg" cx="60" cy="60" r="54"/>
          <circle class="score-ring-fill" cx="60" cy="60" r="54"
            stroke="${color}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"/>
        </svg>
        <div class="score-ring-value">
          <span class="score-ring-number" style="color:${color}">${score}</span>
          <span class="score-ring-label">out of ${maxScore}</span>
        </div>
      </div>
    `;
  }

  /* ---- Format Finding Item ---- */
  static createFinding(type, title, description) {
    const iconMap = { pass: '✓', fail: '✗', warn: '!', info: 'i' };
    return `
      <div class="finding-item">
        <div class="finding-icon ${type}">${iconMap[type] || 'i'}</div>
        <div class="finding-content">
          <h4>${title}</h4>
          <p>${description}</p>
        </div>
      </div>
    `;
  }

  /* ---- Copy to Clipboard ---- */
  static async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    }
  }

  /* ---- Show Notification ---- */
  static showNotification(message, type = 'info') {
    const container = document.querySelector('.notification-container') ||
      (() => {
        const c = document.createElement('div');
        c.className = 'notification-container';
        document.body.appendChild(c);
        return c;
      })();

    const iconMap = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `<span>${iconMap[type]}</span><span>${message}</span>`;
    container.appendChild(notif);

    setTimeout(() => {
      notif.remove();
    }, 4000);
  }
}

window.ExportUtils = ExportUtils;

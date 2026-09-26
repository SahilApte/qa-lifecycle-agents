/* ================================================================
   App Controller — Main orchestrator for QA Lifecycle Agents
   Handles routing, agent instantiation, and UI state management
   ================================================================ */

class App {
  constructor() {
    // Agent instances
    this.groomingAgent = new GroomingAgent();
    this.evaluationAgent = new EvaluationAgent();
    this.testCaseGenerator = new TestCaseGenerator();
    this.testCaseUploader = new TestCaseUploader();
    this.executorAgent = new ExecutorAgent();
    this.suiteOptimizer = new SuiteOptimizer();
    this.scriptWriter = new ScriptWriter();
    this.selfHealer = new SelfHealer();
    this.pmeAnalyzer = new PMEAnalyzer();
    this.reportAnalyzer = new ReportAnalyzer();

    // State
    this.currentView = 'dashboard';
    this.groomingResult = null;
    this.evaluationResult = null;
    this.generatedTestCases = null;
    this.generatedFiles = null;
    this.optimizerResult = null;

    this.init();
  }

  init() {
    this._setupNavigation();
    this._setupAgentCards();
    this._setupPipelineNodes();
    this._animateEntrance();
  }

  /* ================================================================
     Navigation
     ================================================================ */

  navigateTo(viewId) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.agent === viewId);
    });

    // Update views
    document.querySelectorAll('.agent-view').forEach(view => {
      view.classList.toggle('active', view.id === viewId + '-view');
    });

    // Update top bar title
    const titles = {
      'dashboard': '🏠 Command Center',
      'grooming': '🔍 Grooming Agent — Requirement Analysis',
      'evaluation': '✅ Evaluation Agent — Story Readiness Check',
      'testcase-generator': '📝 TestCase Generator — Automated Test Design',
      'testcase-uploader': '📤 TestCase Uploader — TFS Integration',
      'executor': '🎮 Executor Agent — Automated Execution',
      'suite-optimizer': '🔧 Suite Optimizer — Test Plan Analysis',
      'script-writer': '💻 Script Writer — Automation Code Generation',
      'self-healer': '🧬 Self-Healer — Locator Auto-Fix',
      'pme-analyzer': '🐛 PME Analyzer — Production Escape Analysis',
      'report-analyzer': '📊 Report Analyzer — Failure Pattern Analysis'
    };

    const topBarTitle = document.querySelector('.top-bar-title');
    if (topBarTitle) topBarTitle.textContent = titles[viewId] || '🏠 Command Center';

    this.currentView = viewId;
    window.scrollTo(0, 0);

    // Scroll content area to top
    const contentArea = document.querySelector('.content-area');
    if (contentArea) contentArea.scrollTop = 0;
  }

  _setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo(item.dataset.agent);
      });
    });
  }

  _setupAgentCards() {
    document.querySelectorAll('.agent-card[data-agent]').forEach(card => {
      card.addEventListener('click', () => {
        this.navigateTo(card.dataset.agent);
      });
    });
  }

  _setupPipelineNodes() {
    document.querySelectorAll('.pipeline-node[data-agent]').forEach(node => {
      node.addEventListener('click', () => {
        this.navigateTo(node.dataset.agent);
      });
    });
  }

  _animateEntrance() {
    const cards = document.querySelectorAll('.agent-card');
    cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 100 + i * 80);
    });
  }

  /* ================================================================
     Agent 1: Grooming Agent Actions
     ================================================================ */

  runGroomingAgent() {
    const input = document.getElementById('grooming-input');
    const output = document.getElementById('grooming-output');
    const btn = document.getElementById('grooming-btn');
    if (!input || !output) return;

    const text = input.value.trim();
    if (!text) {
      ExportUtils.showNotification('Please paste a user story to analyze.', 'warning');
      return;
    }

    btn.classList.add('loading');
    setTimeout(() => {
      this.groomingResult = this.groomingAgent.analyze(text);
      output.innerHTML = this.groomingAgent.renderResults(this.groomingResult);
      btn.classList.remove('loading');
      ExportUtils.showNotification(`Analysis complete — Score: ${this.groomingResult.overallScore}/10`, 'success');
    }, 800);
  }

  exportGroomingResults() {
    if (!this.groomingResult) return;
    ExportUtils.downloadJSON(this.groomingResult, 'grooming-analysis-report.json');
    ExportUtils.showNotification('Report exported!', 'success');
  }

  sendToEvaluation() {
    if (!this.groomingResult) return;
    const evalInput = document.getElementById('evaluation-input');
    if (evalInput) evalInput.value = this.groomingResult.storyText;
    this.navigateTo('evaluation');
    ExportUtils.showNotification('Story sent to Evaluation Agent. Make improvements and re-evaluate.', 'info');
  }

  loadSampleStory() {
    const sample = `Title: Enable Password Reset via Email Verification

Description:
As a registered user, I want to reset my password through email verification, so that I can regain access to my account when I forget my password.

The password reset flow should be secure, user-friendly, and follow industry best practices. Users should receive a time-limited reset link via their registered email.

Acceptance Criteria:
AC1: Given I am on the login page, When I click "Forgot Password", Then I should see a password reset form asking for my email
AC2: Given I enter a valid registered email, When I click "Send Reset Link", Then I should receive an email within 2 minutes with a unique reset link
AC3: Given I click the reset link from my email, When the link is valid and not expired, Then I should see a "Set New Password" form
AC4: Given I enter a new password matching the policy, When I click "Reset Password", Then my password should be updated and I should be redirected to login
AC5: Given I use an expired reset link (older than 24 hours), When I try to access it, Then I should see an error message "Link expired. Please request a new one"

Priority: P1 - High
Story Points: 5

Dependencies:
- Email service must be configured (SMTP)
- User authentication service API must be available

Assumptions:
- Password policy: minimum 8 characters, 1 uppercase, 1 number, 1 special character
- Reset link expires after 24 hours
- Only one active reset link per user at a time

Definition of Done:
- Code reviewed and merged
- Unit tests written (>80% coverage)
- Integration tests passed
- Deployed to staging environment
- QA sign-off received

Technical Notes:
- API endpoint: POST /api/auth/password-reset
- Use JWT token in reset link with 24h expiry
- Rate limit: max 5 reset requests per email per hour
- Store hashed token in database, not plain text

Edge Cases:
- User enters email not registered in the system
- User requests multiple reset links simultaneously
- User tries to reuse an already-used reset link
- Network timeout during email sending
- Special characters in password (SQL injection prevention)
- Mobile browser compatibility for the reset form`;

    document.getElementById('grooming-input').value = sample;
    ExportUtils.showNotification('Sample user story loaded!', 'info');
  }

  /* ================================================================
     Agent 2: Evaluation Agent Actions
     ================================================================ */

  runEvaluationAgent() {
    const input = document.getElementById('evaluation-input');
    const output = document.getElementById('evaluation-output');
    const btn = document.getElementById('evaluation-btn');
    if (!input || !output) return;

    const text = input.value.trim();
    if (!text) {
      ExportUtils.showNotification('Please paste a user story to evaluate.', 'warning');
      return;
    }

    btn.classList.add('loading');
    setTimeout(() => {
      this.evaluationResult = this.evaluationAgent.evaluate(text, this.groomingResult);
      output.innerHTML = this.evaluationAgent.renderResults(this.evaluationResult);
      btn.classList.remove('loading');
      ExportUtils.showNotification(`Evaluation complete — Score: ${this.evaluationResult.overallScore}/10`, 'success');
    }, 800);
  }

  exportEvaluationResults() {
    if (!this.evaluationResult) return;
    ExportUtils.downloadJSON(this.evaluationResult, 'evaluation-report.json');
    ExportUtils.showNotification('Evaluation report exported!', 'success');
  }

  sendToTestCaseGenerator() {
    if (!this.evaluationResult) return;
    const genInput = document.getElementById('generator-input');
    if (genInput) genInput.value = this.evaluationResult.storyText;
    this.navigateTo('testcase-generator');
    ExportUtils.showNotification('Story sent to TestCase Generator!', 'info');
  }

  /* ================================================================
     Agent 3: TestCase Generator Actions
     ================================================================ */

  runTestCaseGenerator() {
    const input = document.getElementById('generator-input');
    const output = document.getElementById('generator-output');
    const btn = document.getElementById('generator-btn');
    if (!input || !output) return;

    const text = input.value.trim();
    if (!text) {
      ExportUtils.showNotification('Please paste a user story to generate test cases.', 'warning');
      return;
    }

    btn.classList.add('loading');
    setTimeout(() => {
      const result = this.testCaseGenerator.generate(text);
      this.generatedTestCases = result.testCases;
      output.innerHTML = this.testCaseGenerator.renderResults(result);
      btn.classList.remove('loading');
      ExportUtils.showNotification(`Generated ${result.testCases.length} test cases!`, 'success');
    }, 1200);
  }

  exportTestCasesJSON() {
    if (!this.generatedTestCases) return;
    ExportUtils.downloadJSON(this.generatedTestCases, 'test-cases.json');
    ExportUtils.showNotification('Test cases exported as JSON!', 'success');
  }

  exportTestCasesCSV() {
    if (!this.generatedTestCases) return;
    const rows = ExportUtils.formatTestCasesForCSV(this.generatedTestCases);
    ExportUtils.downloadCSV(rows, ['Test Case ID', 'Title', 'Type', 'Priority', 'Preconditions', 'Steps', 'Expected Result', 'Status'], 'test-cases.csv');
    ExportUtils.showNotification('Test cases exported as CSV!', 'success');
  }

  sendToSuiteOptimizer() {
    if (!this.generatedTestCases) return;
    this.navigateTo('suite-optimizer');
    setTimeout(() => this.runSuiteOptimizer(), 300);
  }

  expandAllTestCases() {
    document.querySelectorAll('.testcase-card').forEach(c => c.classList.add('expanded'));
  }

  collapseAllTestCases() {
    document.querySelectorAll('.testcase-card').forEach(c => c.classList.remove('expanded'));
  }

  /* ================================================================
     Agent 4: TestCase Uploader Actions
     ================================================================ */

  configureTFS() {
    const org = document.getElementById('tfs-org')?.value;
    const project = document.getElementById('tfs-project')?.value;
    const pat = document.getElementById('tfs-pat')?.value;
    const planId = document.getElementById('tfs-plan-id')?.value;
    const storyId = document.getElementById('tfs-story-id')?.value;

    if (!org || !project || !pat) {
      ExportUtils.showNotification('Please fill in all TFS configuration fields.', 'warning');
      return;
    }

    this.testCaseUploader.configure(org, project, pat);
    ExportUtils.showNotification('TFS connection configured! Ready to upload when test cases are generated.', 'success');
  }

  /* ================================================================
     Agent 6: Suite Optimizer Actions
     ================================================================ */

  runSuiteOptimizer() {
    const output = document.getElementById('optimizer-output');
    if (!output) return;

    const testCases = this.generatedTestCases;
    if (!testCases || testCases.length === 0) {
      // Try to parse from textarea
      const input = document.getElementById('optimizer-input');
      if (input && input.value.trim()) {
        try {
          const parsed = JSON.parse(input.value.trim());
          this.generatedTestCases = parsed;
          this._runOptimizer(parsed, output);
          return;
        } catch {
          ExportUtils.showNotification('Invalid JSON. Generate test cases first or paste valid JSON.', 'warning');
          return;
        }
      }
      ExportUtils.showNotification('No test cases available. Generate test cases first using Agent 3.', 'warning');
      return;
    }

    this._runOptimizer(testCases, output);
  }

  _runOptimizer(testCases, output) {
    const btn = document.getElementById('optimizer-btn');
    if (btn) btn.classList.add('loading');

    setTimeout(() => {
      this.optimizerResult = this.suiteOptimizer.optimize(testCases);
      output.innerHTML = this.suiteOptimizer.renderResults(this.optimizerResult);
      if (btn) btn.classList.remove('loading');
      ExportUtils.showNotification(`Optimization complete — Health: ${this.optimizerResult.healthScore}/10`, 'success');
    }, 800);
  }

  exportOptimizerReport() {
    if (!this.optimizerResult) return;
    ExportUtils.downloadJSON(this.optimizerResult, 'suite-optimizer-report.json');
    ExportUtils.showNotification('Optimizer report exported!', 'success');
  }

  sendToScriptWriter() {
    if (!this.generatedTestCases) return;
    this.navigateTo('script-writer');
    setTimeout(() => this.runScriptWriter(), 300);
  }

  /* ================================================================
     Agent 7: Script Writer Actions
     ================================================================ */

  runScriptWriter() {
    const output = document.getElementById('script-output');
    if (!output) return;

    const testCases = this.generatedTestCases;
    if (!testCases || testCases.length === 0) {
      ExportUtils.showNotification('No test cases available. Generate test cases first using Agent 3.', 'warning');
      return;
    }

    const btn = document.getElementById('script-btn');
    if (btn) btn.classList.add('loading');

    setTimeout(() => {
      const result = this.scriptWriter.generateCode(testCases);
      this.generatedFiles = result.files;
      output.innerHTML = this.scriptWriter.renderResults(result);
      if (btn) btn.classList.remove('loading');
      ExportUtils.showNotification(`Generated ${result.files.length} files with ${result.stats.totalLines} lines of code!`, 'success');
    }, 1500);
  }

  downloadAllScripts() {
    if (!this.generatedFiles) return;
    for (const file of this.generatedFiles) {
      ExportUtils.downloadText(file.code, file.name, 'text/plain');
    }
    ExportUtils.showNotification(`Downloaded ${this.generatedFiles.length} files!`, 'success');
  }

  /* ================================================================
     Agent 9: PME Analyzer Actions
     ================================================================ */

  runPMEAnalyzer() {
    const testPlanInput = document.getElementById('pme-testplan');
    const bugInput = document.getElementById('pme-bug');
    const output = document.getElementById('pme-output');
    const btn = document.getElementById('pme-btn');
    if (!bugInput || !output) return;

    const bugText = bugInput.value.trim();
    const planText = testPlanInput ? testPlanInput.value.trim() : '';

    if (!bugText) {
      ExportUtils.showNotification('Please enter the PME bug details.', 'warning');
      return;
    }

    btn.classList.add('loading');
    setTimeout(() => {
      const result = this.pmeAnalyzer.analyze(planText, bugText);
      output.innerHTML = this.pmeAnalyzer.renderResults(result);
      btn.classList.remove('loading');
      ExportUtils.showNotification(`PME analysis complete — Impact: ${result.impactLevel}`, 'success');
    }, 1000);
  }

  exportPMEReport() {
    ExportUtils.showNotification('PME Report exported!', 'success');
  }

  loadSamplePME() {
    const bugInput = document.getElementById('pme-bug');
    const planInput = document.getElementById('pme-testplan');

    if (bugInput) {
      bugInput.value = `Bug #4521 - Critical Production Issue
Priority: P0 - Blocker
Affected Area: Checkout / Payment

Description:
Users are unable to complete the checkout process when using a credit card with special characters in the cardholder name (e.g., O'Brien, García). The payment form throws a JavaScript error and the transaction fails silently without any error message to the user.

Steps to Reproduce:
1. Login with valid credentials
2. Add any product to cart
3. Proceed to checkout
4. Enter cardholder name with special character (e.g., John O'Brien)
5. Fill in valid card details
6. Click "Pay Now"
7. Observe: Page shows spinner indefinitely, no success or error

Impact: ~15% of transactions are failing due to special characters in names. Revenue impact estimated at $50K/day.

Root Cause (Dev): Input sanitization was not applied to the cardholder name field before sending to the payment gateway API. The apostrophe was being interpreted as a SQL delimiter.`;
    }

    if (planInput) {
      planInput.value = `Test Plan - Checkout Module (Sprint 42)

TC1: Verify successful checkout with valid Visa card - PASS
TC2: Verify successful checkout with MasterCard - PASS
TC3: Verify checkout fails with expired card - PASS
TC4: Verify checkout fails with insufficient balance - PASS
TC5: Verify order confirmation email is sent after purchase - PASS
TC6: Verify cart is cleared after successful checkout - PASS
TC7: Verify checkout with guest user (no login) - PASS
TC8: Verify checkout with applied coupon code - PASS
TC9: Verify total amount calculation with tax - PASS
TC10: Verify checkout with multiple items - PASS`;
    }

    ExportUtils.showNotification('Sample PME data loaded!', 'info');
  }

  /* ================================================================
     Agent 10: Report Analyzer Actions
     ================================================================ */

  runReportAnalyzer() {
    const input = document.getElementById('report-input');
    const output = document.getElementById('report-output');
    const btn = document.getElementById('report-btn');
    if (!input || !output) return;

    const text = input.value.trim();
    if (!text) {
      ExportUtils.showNotification('Please paste automation report data.', 'warning');
      return;
    }

    btn.classList.add('loading');
    setTimeout(() => {
      const result = this.reportAnalyzer.analyze(text);
      output.innerHTML = this.reportAnalyzer.renderResults(result);
      btn.classList.remove('loading');
      ExportUtils.showNotification(`Report analyzed — ${result.metrics.stability} (${result.metrics.passRate}% pass rate)`, 'success');
    }, 800);
  }

  exportReportAnalysis() {
    ExportUtils.showNotification('Report analysis exported!', 'success');
  }

  loadSampleReport() {
    const input = document.getElementById('report-input');
    if (!input) return;

    input.value = `========================================
Automation Test Execution Report
Date: 2024-03-15 | Environment: Staging
========================================

Tests run: 48, Failures: 12, Skipped: 3

PASSED ✓ testLoginWithValidCredentials
PASSED ✓ testDashboardPageLoad
PASSED ✓ testNavigateToUserManagement
PASSED ✓ testCreateNewUser
PASSED ✓ testSearchUserByName
PASSED ✓ testUpdateUserProfile
PASSED ✓ testDeleteUser
PASSED ✓ testLogoutSuccessful
PASSED ✓ testOrderCreation
PASSED ✓ testOrderStatusUpdate

FAILED ✗ testLoginWithExpiredSession
  Error: TimeoutException - Element #session-modal not found within 15s

FAILED ✗ testUserProfileImageUpload
  Error: NoSuchElementException - Unable to locate element: //div[@class='upload-zone']/input[@type='file']

FAILED ✗ testSearchWithSpecialCharacters
  Error: AssertionError - Expected "Showing 1 result" but found "Showing 0 results"

FAILED ✗ testBulkDeleteUsers
  Error: StaleElementReferenceException - Element is no longer attached to the DOM

FAILED ✗ testExportReportToPDF
  Error: TimeoutException - PDF download did not complete within 30s

FAILED ✗ testDashboardWidgetRefresh
  Error: NoSuchElementException - Unable to locate element: [data-testid='widget-refresh-btn']

FAILED ✗ testUserRolePermissions
  Error: AssertionError - Expected "Access Denied" page but found "Dashboard"

FAILED ✗ testPasswordChangeValidation
  Error: NoSuchElementException - Unable to locate element: #password-strength-meter

FAILED ✗ testNotificationMarkAsRead
  Error: TimeoutException - Notification panel did not open within 10s

FAILED ✗ testPaginationOnLargeDataset
  Error: AssertionError - Expected 10 rows but found 25 rows per page

FAILED ✗ testConcurrentUserEdits
  Error: HTTP 500 - Internal Server Error when saving concurrent changes

FAILED ✗ testFileAttachmentDownload
  Error: NoSuchElementException - Unable to locate element: .download-link

SKIPPED ~ testPaymentGatewayIntegration (Requires VPN)
SKIPPED ~ testEmailNotificationDelivery (SMTP not configured)
SKIPPED ~ testThirdPartyAPISync (External service unavailable)

PASSED ✓ testFormValidation_EmptyFields
PASSED ✓ testFormValidation_InvalidEmail
... (23 more passed tests)

========================================
Summary: 48 total | 33 passed | 12 failed | 3 skipped
Pass Rate: 68.75%
Duration: 14m 32s
========================================`;

    ExportUtils.showNotification('Sample automation report loaded!', 'info');
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

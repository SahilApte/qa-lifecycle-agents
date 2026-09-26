/* ================================================================
   Agent 3: TestCase Generator Agent
   Generates detailed test cases from evaluated user stories
   Covers login-to-logout flows, edge cases, positive/negative/boundary
   ================================================================ */

class TestCaseGenerator {
  constructor() {
    this.name = 'TestCase Generator';
    this.counter = 0;
  }

  /* ---- Main Generation ---- */
  generate(storyText, options = {}) {
    if (!storyText || storyText.trim().length === 0) {
      return { testCases: [], stats: { total: 0 } };
    }

    this.counter = 0;
    const testCases = [];
    const storyLower = storyText.toLowerCase();

    // Determine feature context
    const context = this._detectContext(storyText);

    // 1. Pre-condition: Login Test Cases
    if (options.includeLogin !== false) {
      testCases.push(...this._generateLoginTests(context));
    }

    // 2. Feature-specific Positive Test Cases
    testCases.push(...this._generatePositiveTests(storyText, context));

    // 3. Negative Test Cases
    testCases.push(...this._generateNegativeTests(storyText, context));

    // 4. Edge Case / Boundary Tests
    testCases.push(...this._generateEdgeCaseTests(storyText, context));

    // 5. UI/UX Validation Tests
    testCases.push(...this._generateUITests(storyText, context));

    // 6. Security Tests
    if (storyLower.includes('permission') || storyLower.includes('role') || storyLower.includes('auth') || storyLower.includes('access')) {
      testCases.push(...this._generateSecurityTests(context));
    }

    // 7. Post-condition: Logout Test
    if (options.includeLogout !== false) {
      testCases.push(...this._generateLogoutTests(context));
    }

    // Statistics
    const stats = {
      total: testCases.length,
      positive: testCases.filter(tc => tc.type === 'Positive').length,
      negative: testCases.filter(tc => tc.type === 'Negative').length,
      edge: testCases.filter(tc => tc.type === 'Edge Case').length,
      ui: testCases.filter(tc => tc.type === 'UI/UX').length,
      security: testCases.filter(tc => tc.type === 'Security').length,
      high: testCases.filter(tc => tc.priority === 'High').length,
      medium: testCases.filter(tc => tc.priority === 'Medium').length,
      low: testCases.filter(tc => tc.priority === 'Low').length
    };

    return { testCases, stats, context };
  }

  /* ---- Detect Feature Context ---- */
  _detectContext(text) {
    const lower = text.toLowerCase();
    const context = {
      feature: 'Feature',
      module: 'Module',
      actions: [],
      entities: [],
      hasForm: false,
      hasTable: false,
      hasSearch: false,
      hasCRUD: false,
      hasFileUpload: false,
      hasNotification: false,
      hasNavigation: false,
      hasDashboard: false,
      hasReport: false,
      hasSettings: false
    };

    // Detect actions
    const actionKeywords = ['create', 'add', 'update', 'edit', 'delete', 'remove', 'view', 'display', 'search', 'filter', 'sort', 'export', 'import', 'upload', 'download', 'submit', 'approve', 'reject', 'assign', 'transfer'];
    context.actions = actionKeywords.filter(a => lower.includes(a));

    // Detect entities
    const entityKeywords = ['user', 'account', 'order', 'product', 'item', 'report', 'invoice', 'ticket', 'task', 'project', 'document', 'file', 'record', 'entry', 'form', 'payment', 'profile', 'setting', 'notification'];
    context.entities = entityKeywords.filter(e => lower.includes(e));

    // Detect UI patterns
    context.hasForm = lower.includes('form') || lower.includes('input') || lower.includes('field') || lower.includes('submit');
    context.hasTable = lower.includes('table') || lower.includes('list') || lower.includes('grid') || lower.includes('records');
    context.hasSearch = lower.includes('search') || lower.includes('filter') || lower.includes('find');
    context.hasCRUD = context.actions.some(a => ['create', 'add', 'update', 'edit', 'delete', 'remove'].includes(a));
    context.hasFileUpload = lower.includes('upload') || lower.includes('attach') || lower.includes('file');
    context.hasNotification = lower.includes('notification') || lower.includes('alert') || lower.includes('email') || lower.includes('message');
    context.hasNavigation = lower.includes('navigate') || lower.includes('redirect') || lower.includes('menu') || lower.includes('tab');
    context.hasDashboard = lower.includes('dashboard') || lower.includes('overview') || lower.includes('summary');
    context.hasReport = lower.includes('report') || lower.includes('export') || lower.includes('download');
    context.hasSettings = lower.includes('setting') || lower.includes('config') || lower.includes('preference');

    // Set feature name from first entity or action
    if (context.entities.length > 0) {
      context.feature = context.entities[0].charAt(0).toUpperCase() + context.entities[0].slice(1);
      context.module = context.feature + ' Management';
    }

    return context;
  }

  /* ---- Generate Test ID ---- */
  _nextId() {
    this.counter++;
    return `TC_${String(this.counter).padStart(3, '0')}`;
  }

  /* ---- 1. Login Test Cases ---- */
  _generateLoginTests(context) {
    return [
      {
        id: this._nextId(),
        title: 'Verify successful login with valid credentials',
        type: 'Positive',
        priority: 'High',
        preconditions: 'User has a valid registered account. Application is accessible.',
        steps: [
          'Navigate to the application login page',
          'Enter a valid username/email in the username field',
          'Enter the correct password in the password field',
          'Click the "Login" / "Sign In" button',
          'Observe the page redirection'
        ],
        expectedResult: 'User is successfully authenticated and redirected to the home/dashboard page. User session is created.'
      },
      {
        id: this._nextId(),
        title: 'Verify login fails with invalid password',
        type: 'Negative',
        priority: 'High',
        preconditions: 'User has a valid registered account.',
        steps: [
          'Navigate to the application login page',
          'Enter a valid username/email',
          'Enter an incorrect password',
          'Click the "Login" button',
          'Observe the error message displayed'
        ],
        expectedResult: 'Login fails. An appropriate error message is displayed (e.g., "Invalid credentials"). User remains on the login page.'
      },
      {
        id: this._nextId(),
        title: 'Verify login fails with empty credentials',
        type: 'Edge Case',
        priority: 'Medium',
        preconditions: 'Application login page is accessible.',
        steps: [
          'Navigate to the application login page',
          'Leave the username field empty',
          'Leave the password field empty',
          'Click the "Login" button',
          'Observe validation messages'
        ],
        expectedResult: 'Validation error messages are shown for both fields. Login is not attempted. Form highlights the required fields.'
      }
    ];
  }

  /* ---- 2. Positive Test Cases ---- */
  _generatePositiveTests(storyText, context) {
    const tests = [];

    // Navigate to feature
    tests.push({
      id: this._nextId(),
      title: `Verify navigation to ${context.module} page`,
      type: 'Positive',
      priority: 'High',
      preconditions: 'User is logged in with appropriate access rights.',
      steps: [
        'Log into the application with valid credentials',
        `Navigate to the ${context.module} section from the main menu/sidebar`,
        `Verify the ${context.module} page loads successfully`,
        'Check that all page elements are displayed correctly (header, breadcrumb, action buttons)'
      ],
      expectedResult: `${context.module} page loads within acceptable time. All UI elements (title, buttons, tables/forms) are displayed correctly.`
    });

    // Create operation
    if (context.hasCRUD && (context.actions.includes('create') || context.actions.includes('add'))) {
      tests.push({
        id: this._nextId(),
        title: `Verify successful creation of a new ${context.feature}`,
        type: 'Positive',
        priority: 'High',
        preconditions: `User is on the ${context.module} page with create permissions.`,
        steps: [
          `Click the "Add New" / "Create ${context.feature}" button`,
          `Verify the ${context.feature} creation form/dialog appears`,
          'Fill in all mandatory fields with valid data',
          'Fill in optional fields as applicable',
          'Click the "Save" / "Submit" button',
          'Observe the confirmation message',
          `Verify the new ${context.feature} appears in the list/table`
        ],
        expectedResult: `New ${context.feature} is created successfully. A success confirmation message is displayed. The ${context.feature} appears in the list with correct details.`
      });
    }

    // View/Read operation
    if (context.actions.includes('view') || context.actions.includes('display') || context.hasCRUD) {
      tests.push({
        id: this._nextId(),
        title: `Verify viewing ${context.feature} details`,
        type: 'Positive',
        priority: 'High',
        preconditions: `At least one ${context.feature} exists in the system.`,
        steps: [
          `Navigate to the ${context.module} page`,
          `Locate an existing ${context.feature} in the list`,
          `Click on the ${context.feature} name/row or the "View" action`,
          `Verify the ${context.feature} detail page/panel opens`,
          'Confirm all fields display the correct data'
        ],
        expectedResult: `${context.feature} detail view opens showing all associated information correctly formatted and readable.`
      });
    }

    // Update operation
    if (context.hasCRUD && (context.actions.includes('update') || context.actions.includes('edit'))) {
      tests.push({
        id: this._nextId(),
        title: `Verify successful update of an existing ${context.feature}`,
        type: 'Positive',
        priority: 'High',
        preconditions: `An existing ${context.feature} is available for editing. User has edit permissions.`,
        steps: [
          `Navigate to the ${context.module} page`,
          `Select an existing ${context.feature}`,
          'Click the "Edit" button',
          'Modify one or more fields with new valid data',
          'Click the "Save" / "Update" button',
          'Observe the confirmation message',
          `Verify the ${context.feature} now reflects the updated values`
        ],
        expectedResult: `${context.feature} is updated successfully. A success message is shown. Updated values are reflected across all views.`
      });
    }

    // Delete operation
    if (context.hasCRUD && (context.actions.includes('delete') || context.actions.includes('remove'))) {
      tests.push({
        id: this._nextId(),
        title: `Verify successful deletion of a ${context.feature}`,
        type: 'Positive',
        priority: 'High',
        preconditions: `An existing ${context.feature} is available. User has delete permissions.`,
        steps: [
          `Navigate to the ${context.module} page`,
          `Select the ${context.feature} to be deleted`,
          'Click the "Delete" button',
          'Verify a confirmation dialog appears asking "Are you sure?"',
          'Click "Confirm" / "Yes" on the dialog',
          'Observe the success message',
          `Verify the ${context.feature} is removed from the list`
        ],
        expectedResult: `${context.feature} is permanently deleted. It no longer appears in the list. A success message confirms the deletion.`
      });
    }

    // Search
    if (context.hasSearch) {
      tests.push({
        id: this._nextId(),
        title: `Verify search functionality for ${context.feature}`,
        type: 'Positive',
        priority: 'Medium',
        preconditions: `Multiple ${context.feature} records exist in the system.`,
        steps: [
          `Navigate to the ${context.module} page`,
          'Locate the search bar/field',
          `Enter a known ${context.feature} name or keyword`,
          'Press Enter or click the search icon',
          'Observe the filtered results'
        ],
        expectedResult: `Search results display only ${context.feature} records matching the search term. Results are accurate and load promptly.`
      });
    }

    // File Upload
    if (context.hasFileUpload) {
      tests.push({
        id: this._nextId(),
        title: `Verify file upload for ${context.feature}`,
        type: 'Positive',
        priority: 'Medium',
        preconditions: `A valid file (matching accepted format and size) is available for upload.`,
        steps: [
          `Navigate to the ${context.feature} upload section`,
          'Click "Choose File" / "Browse" button',
          'Select a valid file from the local system',
          'Verify the file name and preview appear',
          'Click "Upload" / "Submit"',
          'Wait for the upload progress to complete'
        ],
        expectedResult: 'File is uploaded successfully. A success message is displayed. The file appears in the attachments/documents list.'
      });
    }

    return tests;
  }

  /* ---- 3. Negative Test Cases ---- */
  _generateNegativeTests(storyText, context) {
    const tests = [];

    // Submit form with mandatory fields empty
    if (context.hasForm || context.hasCRUD) {
      tests.push({
        id: this._nextId(),
        title: `Verify form validation — submit with empty mandatory fields`,
        type: 'Negative',
        priority: 'High',
        preconditions: `${context.feature} creation/edit form is open.`,
        steps: [
          `Open the ${context.feature} creation form`,
          'Leave all mandatory fields empty',
          'Click the "Save" / "Submit" button',
          'Observe validation error messages'
        ],
        expectedResult: 'Form is not submitted. Validation messages appear for each mandatory field. Fields are highlighted in red/error state.'
      });

      // Invalid data types
      tests.push({
        id: this._nextId(),
        title: `Verify form validation — enter invalid data formats`,
        type: 'Negative',
        priority: 'Medium',
        preconditions: `${context.feature} form is open.`,
        steps: [
          `Open the ${context.feature} form`,
          'Enter text in numeric fields (if any)',
          'Enter invalid email format in email fields (if any)',
          'Enter future date in past-only date fields (if any)',
          'Click "Save" / "Submit"'
        ],
        expectedResult: 'Validation errors are shown for each invalid field. Form is not submitted. Error messages clearly indicate the expected format.'
      });
    }

    // Delete cancellation
    if (context.hasCRUD && (context.actions.includes('delete') || context.actions.includes('remove'))) {
      tests.push({
        id: this._nextId(),
        title: `Verify cancelling ${context.feature} deletion`,
        type: 'Negative',
        priority: 'Medium',
        preconditions: `An existing ${context.feature} is available.`,
        steps: [
          `Select a ${context.feature} and click "Delete"`,
          'Verify the confirmation dialog appears',
          'Click "Cancel" / "No" on the confirmation dialog',
          `Verify the ${context.feature} still exists in the list`
        ],
        expectedResult: `Deletion is cancelled. The ${context.feature} remains in the list unchanged. No data is lost.`
      });
    }

    // Search with no results
    if (context.hasSearch) {
      tests.push({
        id: this._nextId(),
        title: 'Verify search with non-existent term',
        type: 'Negative',
        priority: 'Low',
        preconditions: `${context.module} page is loaded.`,
        steps: [
          'Navigate to the search field',
          'Enter a random string that does not match any record (e.g., "xyz12345")',
          'Execute the search',
          'Observe the results area'
        ],
        expectedResult: 'No results are displayed. A "No results found" or empty state message is shown. No errors occur.'
      });
    }

    // Invalid file upload
    if (context.hasFileUpload) {
      tests.push({
        id: this._nextId(),
        title: 'Verify file upload with invalid file type',
        type: 'Negative',
        priority: 'Medium',
        preconditions: 'A file with unsupported format is available (e.g., .exe, .bat).',
        steps: [
          'Navigate to the file upload section',
          'Attempt to upload a file with unsupported extension',
          'Observe the system response'
        ],
        expectedResult: 'Upload is rejected. An error message clearly states the allowed file formats. No file is uploaded.'
      });
    }

    return tests;
  }

  /* ---- 4. Edge Case / Boundary Tests ---- */
  _generateEdgeCaseTests(storyText, context) {
    const tests = [];

    // Maximum character limit
    if (context.hasForm || context.hasCRUD) {
      tests.push({
        id: this._nextId(),
        title: 'Verify field maximum character/length limits',
        type: 'Edge Case',
        priority: 'Medium',
        preconditions: `${context.feature} form is accessible.`,
        steps: [
          `Open the ${context.feature} form`,
          'Enter text exceeding the maximum allowed length in a text field',
          'Observe field behavior (truncation or validation)',
          'Attempt to submit the form'
        ],
        expectedResult: 'Input is either truncated at the max length or a validation message indicates the character limit. Data integrity is maintained.'
      });

      // Special characters
      tests.push({
        id: this._nextId(),
        title: 'Verify handling of special characters in input fields',
        type: 'Edge Case',
        priority: 'Medium',
        preconditions: `${context.feature} form is accessible.`,
        steps: [
          `Open the ${context.feature} form`,
          'Enter special characters in text fields: < > & " \' / \\ ; -- /* */',
          'Click "Save" / "Submit"',
          `View the saved ${context.feature} details`
        ],
        expectedResult: 'Special characters are properly escaped/sanitized. No XSS or injection vulnerabilities. Data is displayed correctly after save.'
      });
    }

    // Duplicate entry
    if (context.hasCRUD) {
      tests.push({
        id: this._nextId(),
        title: `Verify duplicate ${context.feature} prevention`,
        type: 'Edge Case',
        priority: 'Medium',
        preconditions: `A ${context.feature} with specific data already exists.`,
        steps: [
          `Create a new ${context.feature} with identical data to an existing one`,
          'Fill all fields with the same values',
          'Click "Save" / "Submit"',
          'Observe the system response'
        ],
        expectedResult: 'System either prevents the duplicate with a clear error message, or handles it gracefully based on business rules.'
      });
    }

    // Concurrent modification
    tests.push({
      id: this._nextId(),
      title: 'Verify behavior on browser back/refresh during operation',
      type: 'Edge Case',
      priority: 'Medium',
      preconditions: `User is in the middle of a ${context.feature} operation.`,
      steps: [
        `Navigate to ${context.feature} creation/edit form`,
        'Fill in some data',
        'Click the browser back button without saving',
        'Verify behavior (unsaved changes warning)',
        'Navigate forward and check if data is retained',
        'Also test: Refresh the page during form fill'
      ],
      expectedResult: 'Browser back shows an unsaved changes confirmation dialog. Data is either preserved or user is warned about loss. No errors or data corruption.'
    });

    // Session timeout
    tests.push({
      id: this._nextId(),
      title: 'Verify session timeout handling',
      type: 'Edge Case',
      priority: 'Low',
      preconditions: 'User is logged in. Session timeout is configured.',
      steps: [
        'Log into the application',
        `Navigate to ${context.module}`,
        'Leave the application idle until session expires',
        'Attempt to perform an action (click, submit)',
        'Observe the system behavior'
      ],
      expectedResult: 'User is redirected to the login page with a "Session expired" message. No error occurs. Unsaved data handling is graceful.'
    });

    return tests;
  }

  /* ---- 5. UI/UX Tests ---- */
  _generateUITests(storyText, context) {
    const tests = [];

    tests.push({
      id: this._nextId(),
      title: `Verify ${context.module} page layout and responsiveness`,
      type: 'UI/UX',
      priority: 'Medium',
      preconditions: 'User is logged in.',
      steps: [
        `Navigate to ${context.module}`,
        'Verify page layout matches the design specifications',
        'Check font sizes, colors, and alignment',
        'Resize browser to test responsive behavior (desktop → tablet → mobile)',
        'Verify all buttons and links are clickable and visible'
      ],
      expectedResult: 'Page layout is consistent with design specs. All elements adapt correctly to different screen sizes. No overflow, overlap, or truncation issues.'
    });

    tests.push({
      id: this._nextId(),
      title: 'Verify loading states and spinners',
      type: 'UI/UX',
      priority: 'Low',
      preconditions: 'User is on a page with data-loading operations.',
      steps: [
        'Trigger a data load operation (page load, search, filter)',
        'Observe loading indicators',
        'Verify skeleton loaders or spinners are shown',
        'Confirm smooth transition when data loads'
      ],
      expectedResult: 'Loading indicators are shown during data fetch. Smooth transition from loading to loaded state. No layout jumps or flicker.'
    });

    // Pagination (for tables/lists)
    if (context.hasTable) {
      tests.push({
        id: this._nextId(),
        title: 'Verify pagination and sorting in data table',
        type: 'UI/UX',
        priority: 'Medium',
        preconditions: `More than one page of ${context.feature} records exist.`,
        steps: [
          `Navigate to ${context.module} list view`,
          'Verify pagination controls are visible',
          'Click "Next Page" and verify new records load',
          'Click "Previous Page" and verify correct records',
          'Click a sortable column header',
          'Verify sorting order changes (ascending ↔ descending)'
        ],
        expectedResult: 'Pagination navigates correctly between pages. Page number indicators update. Sorting reorders data correctly. Record count is accurate.'
      });
    }

    return tests;
  }

  /* ---- 6. Security Tests ---- */
  _generateSecurityTests(context) {
    return [
      {
        id: this._nextId(),
        title: `Verify unauthorized access to ${context.module} is blocked`,
        type: 'Security',
        priority: 'High',
        preconditions: 'User is logged in with a role that does NOT have access to this module.',
        steps: [
          'Log in as a user without the required role/permission',
          `Attempt to navigate to ${context.module} via URL`,
          'Observe the access control response',
          'Also try: Access API endpoints directly via browser dev tools'
        ],
        expectedResult: 'Access is denied. User sees a 403/Unauthorized message or is redirected. No data is exposed. API returns proper error codes.'
      },
      {
        id: this._nextId(),
        title: 'Verify role-based action visibility',
        type: 'Security',
        priority: 'High',
        preconditions: 'Multiple user roles exist (Admin, Editor, Viewer, etc.).',
        steps: [
          'Log in as a read-only/viewer user',
          `Navigate to ${context.module}`,
          'Verify that edit/delete/create buttons are hidden or disabled',
          'Log out and log in as an admin/editor user',
          'Verify all action buttons are visible and functional'
        ],
        expectedResult: 'Action buttons visibility matches the user\'s role permissions. Read-only users cannot see or trigger modify operations.'
      }
    ];
  }

  /* ---- 7. Logout Test Cases ---- */
  _generateLogoutTests(context) {
    return [
      {
        id: this._nextId(),
        title: 'Verify successful logout and session termination',
        type: 'Positive',
        priority: 'High',
        preconditions: 'User is logged in and session is active.',
        steps: [
          'Click the user profile/avatar in the header',
          'Click the "Logout" / "Sign Out" option',
          'Verify redirection to the login page',
          'Attempt to navigate back using browser history',
          'Verify that protected pages are not accessible'
        ],
        expectedResult: 'User is logged out and redirected to login. Session is terminated. Browser back does not expose authenticated content. Cached data is cleared.'
      }
    ];
  }

  /* ---- Render Results ---- */
  renderResults(result) {
    const { testCases, stats } = result;

    const statsHTML = `
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-card-value">${stats.total}</div>
          <div class="stat-card-label">Total</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value text-success">${stats.positive}</div>
          <div class="stat-card-label">Positive</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value text-error">${stats.negative}</div>
          <div class="stat-card-label">Negative</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value text-warning">${stats.edge}</div>
          <div class="stat-card-label">Edge Cases</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value text-info">${stats.ui}</div>
          <div class="stat-card-label">UI/UX</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value" style="color:var(--color-accent)">${stats.security}</div>
          <div class="stat-card-label">Security</div>
        </div>
      </div>
    `;

    const testCasesHTML = ExportUtils.formatTestCasesForHTML(testCases);

    return `
      <div class="results-container visible" style="animation: fadeSlideIn 0.5s ease">
        ${statsHTML}

        <div class="flex justify-between items-center mb-md">
          <h4 style="font-size:var(--text-base)">Generated Test Cases</h4>
          <div class="flex gap-sm">
            <button class="btn btn-sm btn-outline" onclick="app.expandAllTestCases()">Expand All</button>
            <button class="btn btn-sm btn-outline" onclick="app.collapseAllTestCases()">Collapse All</button>
          </div>
        </div>

        ${testCasesHTML}

        <div class="divider"></div>
        <div class="flex gap-sm">
          <button class="btn btn-secondary btn-sm" onclick="app.exportTestCasesJSON()">📋 Export JSON</button>
          <button class="btn btn-secondary btn-sm" onclick="app.exportTestCasesCSV()">📊 Export CSV</button>
          <button class="btn btn-primary btn-sm" onclick="app.sendToSuiteOptimizer()">→ Optimize Suite</button>
        </div>
      </div>
    `;
  }
}

window.TestCaseGenerator = TestCaseGenerator;

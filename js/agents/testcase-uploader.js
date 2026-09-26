/* ================================================================
   Agent 4: TestCase Uploader (TFS Integration — Placeholder)
   Uploads test cases to Azure DevOps / TFS Test Plans
   Links them as "Tested By" in user stories
   ================================================================ */

class TestCaseUploader {
  constructor() {
    this.name = 'TestCase Uploader';
    this.isConfigured = false;
    this.config = { organization: '', project: '', pat: '' };
  }

  configure(organization, project, pat) {
    this.config = { organization, project, pat };
    this.isConfigured = !!(organization && project && pat);
  }

  async upload(testCases, testPlanId, storyId) {
    if (!this.isConfigured) {
      return { success: false, message: 'TFS/Azure DevOps not configured. Please provide Organization URL, Project Name, and Personal Access Token.' };
    }

    // Simulated upload — replace with actual TFS API calls
    return {
      success: true,
      message: `Ready to upload ${testCases.length} test cases to Test Plan #${testPlanId} and link to Story #${storyId}.`,
      preview: testCases.map((tc, i) => ({
        id: tc.id,
        title: tc.title,
        tfsAction: `Upload as Work Item → Link to Test Plan #${testPlanId}`,
        storyLink: `"Tested By" → Story #${storyId}`
      }))
    };
  }

  renderConfig() {
    return `
      <div class="section-card">
        <div class="section-card-header">
          <div class="section-card-title"><span class="icon">⚙️</span> TFS / Azure DevOps Configuration</div>
        </div>
        <div class="form-group">
          <label class="form-label">Organization URL</label>
          <input class="form-input" id="tfs-org" placeholder="https://dev.azure.com/your-org" />
        </div>
        <div class="form-group">
          <label class="form-label">Project Name</label>
          <input class="form-input" id="tfs-project" placeholder="MyProject" />
        </div>
        <div class="form-group">
          <label class="form-label">Personal Access Token (PAT)</label>
          <input class="form-input" id="tfs-pat" type="password" placeholder="Enter your PAT" />
        </div>
        <div class="form-group">
          <label class="form-label">Test Plan ID</label>
          <input class="form-input" id="tfs-plan-id" placeholder="12345" />
        </div>
        <div class="form-group">
          <label class="form-label">User Story ID (to link "Tested By")</label>
          <input class="form-input" id="tfs-story-id" placeholder="67890" />
        </div>
        <button class="btn btn-primary" onclick="app.configureTFS()">Connect & Upload</button>
        <p style="margin-top:var(--space-md);font-size:var(--text-xs);color:var(--text-muted)">
          🔒 Credentials are used locally and never stored on any server.
        </p>
      </div>
    `;
  }
}

window.TestCaseUploader = TestCaseUploader;

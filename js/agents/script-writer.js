/* ================================================================
   Agent 7: Automation Script Writer
   Generates Java Selenium code following POM pattern
   Uses reusable methods, proper locators, and TestNG
   ================================================================ */

class ScriptWriter {
  constructor() {
    this.name = 'Script Writer';
  }

  /* ---- Main Generation ---- */
  generateCode(testCases, options = {}) {
    if (!testCases || testCases.length === 0) {
      return { files: [], stats: {} };
    }

    const framework = options.framework || 'TestNG';
    const packageName = options.packageName || 'com.qa.automation';
    const files = [];

    // 1. Generate BasePage.java
    files.push(this._generateBasePage(packageName));

    // 2. Generate LoginPage.java
    files.push(this._generateLoginPage(packageName));

    // 3. Generate Feature Page Object
    const context = this._extractContext(testCases);
    files.push(this._generateFeaturePage(packageName, context));

    // 4. Generate Test Class
    files.push(this._generateTestClass(packageName, context, testCases, framework));

    // 5. Generate Test Data Utils
    files.push(this._generateTestDataUtils(packageName));

    // 6. Generate TestNG XML (if TestNG)
    if (framework === 'TestNG') {
      files.push(this._generateTestNGXml(packageName, context));
    }

    const stats = {
      totalFiles: files.length,
      totalLines: files.reduce((sum, f) => sum + f.code.split('\n').length, 0),
      testMethods: testCases.length,
      pageObjects: 3,
      framework
    };

    return { files, stats };
  }

  /* ---- Extract Context from Test Cases ---- */
  _extractContext(testCases) {
    const titles = testCases.map(tc => tc.title.toLowerCase()).join(' ');
    const features = ['user', 'account', 'order', 'product', 'report', 'dashboard', 'profile', 'settings', 'task', 'ticket'];
    let feature = 'Feature';

    for (const f of features) {
      if (titles.includes(f)) {
        feature = f.charAt(0).toUpperCase() + f.slice(1);
        break;
      }
    }

    return {
      feature,
      featureLower: feature.toLowerCase(),
      className: feature + 'Page',
      testClassName: feature + 'Test',
      module: feature + ' Management'
    };
  }

  /* ---- 1. BasePage.java ---- */
  _generateBasePage(pkg) {
    return {
      name: 'BasePage.java',
      path: `src/main/java/${pkg.replace(/\./g, '/')}/pages/BasePage.java`,
      language: 'java',
      code: `package ${pkg}.pages;

import org.openqa.selenium.*;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

/**
 * BasePage — Abstract base class for all Page Objects.
 * Contains reusable helper methods for common Selenium operations.
 * All page classes should extend this class.
 */
public abstract class BasePage {

    protected WebDriver driver;
    protected WebDriverWait wait;
    protected Actions actions;

    private static final Duration DEFAULT_TIMEOUT = Duration.ofSeconds(15);
    private static final Duration POLLING_INTERVAL = Duration.ofMillis(500);

    public BasePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, DEFAULT_TIMEOUT);
        this.actions = new Actions(driver);
        PageFactory.initElements(driver, this);
    }

    // ---- Wait Helpers ----

    protected WebElement waitForElementVisible(By locator) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    protected WebElement waitForElementClickable(By locator) {
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    protected boolean waitForElementInvisible(By locator) {
        return wait.until(ExpectedConditions.invisibilityOfElementLocated(locator));
    }

    protected List<WebElement> waitForElementsVisible(By locator) {
        return wait.until(ExpectedConditions.visibilityOfAllElementsLocatedBy(locator));
    }

    // ---- Click Helpers ----

    protected void click(By locator) {
        waitForElementClickable(locator).click();
    }

    protected void doubleClick(By locator) {
        WebElement element = waitForElementClickable(locator);
        actions.doubleClick(element).perform();
    }

    protected void jsClick(By locator) {
        WebElement element = waitForElementVisible(locator);
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", element);
    }

    // ---- Input Helpers ----

    protected void type(By locator, String text) {
        WebElement element = waitForElementVisible(locator);
        element.clear();
        element.sendKeys(text);
    }

    protected void clearAndType(By locator, String text) {
        WebElement element = waitForElementVisible(locator);
        element.sendKeys(Keys.chord(Keys.CONTROL, "a"), Keys.DELETE);
        element.sendKeys(text);
    }

    protected void selectByVisibleText(By locator, String text) {
        WebElement element = waitForElementVisible(locator);
        new Select(element).selectByVisibleText(text);
    }

    protected void selectByValue(By locator, String value) {
        WebElement element = waitForElementVisible(locator);
        new Select(element).selectByValue(value);
    }

    // ---- Read Helpers ----

    protected String getText(By locator) {
        return waitForElementVisible(locator).getText().trim();
    }

    protected String getAttribute(By locator, String attribute) {
        return waitForElementVisible(locator).getAttribute(attribute);
    }

    protected boolean isElementDisplayed(By locator) {
        try {
            return driver.findElement(locator).isDisplayed();
        } catch (NoSuchElementException e) {
            return false;
        }
    }

    protected boolean isElementEnabled(By locator) {
        try {
            return driver.findElement(locator).isEnabled();
        } catch (NoSuchElementException e) {
            return false;
        }
    }

    protected int getElementCount(By locator) {
        return driver.findElements(locator).size();
    }

    // ---- Navigation Helpers ----

    protected void navigateTo(String url) {
        driver.get(url);
    }

    protected String getCurrentUrl() {
        return driver.getCurrentUrl();
    }

    protected String getPageTitle() {
        return driver.getTitle();
    }

    protected void refreshPage() {
        driver.navigate().refresh();
    }

    // ---- Scroll Helpers ----

    protected void scrollToElement(By locator) {
        WebElement element = waitForElementVisible(locator);
        ((JavascriptExecutor) driver).executeScript(
            "arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", element
        );
    }

    protected void scrollToTop() {
        ((JavascriptExecutor) driver).executeScript("window.scrollTo(0, 0);");
    }

    // ---- Alert Helpers ----

    protected String getAlertText() {
        return wait.until(ExpectedConditions.alertIsPresent()).getText();
    }

    protected void acceptAlert() {
        wait.until(ExpectedConditions.alertIsPresent()).accept();
    }

    protected void dismissAlert() {
        wait.until(ExpectedConditions.alertIsPresent()).dismiss();
    }

    // ---- Screenshot Helper ----

    protected byte[] takeScreenshot() {
        return ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
    }

    // ---- Wait for Page Load ----

    protected void waitForPageLoad() {
        wait.until(webDriver ->
            ((JavascriptExecutor) webDriver)
                .executeScript("return document.readyState").equals("complete")
        );
    }
}`
    };
  }

  /* ---- 2. LoginPage.java ---- */
  _generateLoginPage(pkg) {
    return {
      name: 'LoginPage.java',
      path: `src/main/java/${pkg.replace(/\./g, '/')}/pages/LoginPage.java`,
      language: 'java',
      code: `package ${pkg}.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * LoginPage — Page Object for the Login screen.
 * Handles authentication flows including login and logout.
 */
public class LoginPage extends BasePage {

    // ---- Locators ----
    private final By usernameField = By.id("username");
    private final By passwordField = By.id("password");
    private final By loginButton = By.id("loginBtn");
    private final By errorMessage = By.cssSelector("[data-testid='login-error']");
    private final By forgotPasswordLink = By.linkText("Forgot Password?");
    private final By rememberMeCheckbox = By.id("rememberMe");
    private final By userProfileMenu = By.cssSelector("[data-testid='user-menu']");
    private final By logoutButton = By.cssSelector("[data-testid='logout-btn']");
    private final By welcomeMessage = By.cssSelector("[data-testid='welcome-msg']");

    public LoginPage(WebDriver driver) {
        super(driver);
    }

    // ---- Actions ----

    public void enterUsername(String username) {
        type(usernameField, username);
    }

    public void enterPassword(String password) {
        type(passwordField, password);
    }

    public void clickLogin() {
        click(loginButton);
    }

    public void login(String username, String password) {
        enterUsername(username);
        enterPassword(password);
        clickLogin();
        waitForPageLoad();
    }

    public void logout() {
        click(userProfileMenu);
        click(logoutButton);
        waitForPageLoad();
    }

    // ---- Verifications ----

    public boolean isLoginPageDisplayed() {
        return isElementDisplayed(loginButton);
    }

    public boolean isErrorMessageDisplayed() {
        return isElementDisplayed(errorMessage);
    }

    public String getErrorMessageText() {
        return getText(errorMessage);
    }

    public boolean isWelcomeMessageDisplayed() {
        return isElementDisplayed(welcomeMessage);
    }

    public String getWelcomeText() {
        return getText(welcomeMessage);
    }

    public boolean isLoggedIn() {
        return isElementDisplayed(userProfileMenu);
    }
}`
    };
  }

  /* ---- 3. Feature Page Object ---- */
  _generateFeaturePage(pkg, context) {
    return {
      name: `${context.className}.java`,
      path: `src/main/java/${pkg.replace(/\./g, '/')}/pages/${context.className}.java`,
      language: 'java',
      code: `package ${pkg}.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import java.util.List;

/**
 * ${context.className} — Page Object for ${context.module}.
 * Implements all interactions specific to the ${context.feature} feature.
 */
public class ${context.className} extends BasePage {

    // ---- Locators ----
    private final By pageHeader = By.cssSelector("[data-testid='${context.featureLower}-header']");
    private final By createButton = By.cssSelector("[data-testid='create-${context.featureLower}-btn']");
    private final By searchField = By.cssSelector("[data-testid='${context.featureLower}-search']");
    private final By dataTable = By.cssSelector("[data-testid='${context.featureLower}-table']");
    private final By tableRows = By.cssSelector("[data-testid='${context.featureLower}-table'] tbody tr");
    private final By editButton = By.cssSelector("[data-testid='edit-btn']");
    private final By deleteButton = By.cssSelector("[data-testid='delete-btn']");
    private final By saveButton = By.cssSelector("[data-testid='save-btn']");
    private final By cancelButton = By.cssSelector("[data-testid='cancel-btn']");
    private final By confirmDeleteBtn = By.cssSelector("[data-testid='confirm-delete']");
    private final By successMessage = By.cssSelector("[data-testid='success-msg']");
    private final By errorMessage = By.cssSelector("[data-testid='error-msg']");
    private final By formDialog = By.cssSelector("[data-testid='${context.featureLower}-form']");
    private final By nameField = By.cssSelector("[data-testid='name-field']");
    private final By descriptionField = By.cssSelector("[data-testid='description-field']");
    private final By paginationNext = By.cssSelector("[data-testid='pagination-next']");
    private final By paginationPrev = By.cssSelector("[data-testid='pagination-prev']");
    private final By noResultsMessage = By.cssSelector("[data-testid='no-results']");
    private final By loadingSpinner = By.cssSelector("[data-testid='loading-spinner']");

    public ${context.className}(WebDriver driver) {
        super(driver);
    }

    // ---- Navigation ----

    public void navigateTo${context.feature}Page() {
        click(By.cssSelector("[data-testid='nav-${context.featureLower}']"));
        waitForPageLoad();
        waitForElementVisible(pageHeader);
    }

    public boolean is${context.feature}PageDisplayed() {
        return isElementDisplayed(pageHeader);
    }

    // ---- CRUD Operations ----

    public void clickCreate() {
        click(createButton);
        waitForElementVisible(formDialog);
    }

    public void fillForm(String name, String description) {
        type(nameField, name);
        type(descriptionField, description);
    }

    public void clickSave() {
        click(saveButton);
        waitForPageLoad();
    }

    public void create${context.feature}(String name, String description) {
        clickCreate();
        fillForm(name, description);
        clickSave();
    }

    public void clickEditOnRow(int rowIndex) {
        List<WebElement> rows = waitForElementsVisible(tableRows);
        if (rowIndex < rows.size()) {
            rows.get(rowIndex).findElement(editButton).click();
            waitForElementVisible(formDialog);
        }
    }

    public void clickDeleteOnRow(int rowIndex) {
        List<WebElement> rows = waitForElementsVisible(tableRows);
        if (rowIndex < rows.size()) {
            rows.get(rowIndex).findElement(deleteButton).click();
        }
    }

    public void confirmDelete() {
        click(confirmDeleteBtn);
        waitForPageLoad();
    }

    // ---- Search ----

    public void search(String keyword) {
        clearAndType(searchField, keyword);
        waitForPageLoad();
    }

    // ---- Pagination ----

    public void goToNextPage() {
        click(paginationNext);
        waitForPageLoad();
    }

    public void goToPreviousPage() {
        click(paginationPrev);
        waitForPageLoad();
    }

    // ---- Verification Methods ----

    public String getSuccessMessage() {
        return getText(successMessage);
    }

    public String getErrorMessage() {
        return getText(errorMessage);
    }

    public boolean isSuccessMessageDisplayed() {
        return isElementDisplayed(successMessage);
    }

    public boolean isErrorMessageDisplayed() {
        return isElementDisplayed(errorMessage);
    }

    public int getTableRowCount() {
        return getElementCount(tableRows);
    }

    public boolean isNoResultsDisplayed() {
        return isElementDisplayed(noResultsMessage);
    }

    public boolean isFormDialogDisplayed() {
        return isElementDisplayed(formDialog);
    }

    public boolean isLoadingComplete() {
        try {
            return waitForElementInvisible(loadingSpinner);
        } catch (Exception e) {
            return true;
        }
    }
}`
    };
  }

  /* ---- 4. Test Class ---- */
  _generateTestClass(pkg, context, testCases, framework) {
    const testMethods = testCases.map(tc => this._generateTestMethod(tc, context)).join('\n\n');

    return {
      name: `${context.testClassName}.java`,
      path: `src/test/java/${pkg.replace(/\./g, '/')}/tests/${context.testClassName}.java`,
      language: 'java',
      code: `package ${pkg}.tests;

import ${pkg}.pages.LoginPage;
import ${pkg}.pages.${context.className};
import ${pkg}.utils.TestDataUtils;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.testng.Assert;
import org.testng.annotations.*;
import io.github.bonigarcia.wdm.WebDriverManager;

/**
 * ${context.testClassName} — Test class for ${context.module}.
 * Generated by QA Lifecycle Agents Platform.
 *
 * Test Cases: ${testCases.length}
 * Coverage: Positive, Negative, Edge Cases, UI/UX, Security
 */
public class ${context.testClassName} {

    private WebDriver driver;
    private LoginPage loginPage;
    private ${context.className} ${context.featureLower}Page;

    private static final String BASE_URL = TestDataUtils.getBaseUrl();
    private static final String USERNAME = TestDataUtils.getUsername();
    private static final String PASSWORD = TestDataUtils.getPassword();

    @BeforeClass
    public void setUp() {
        WebDriverManager.chromedriver().setup();
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--start-maximized");
        options.addArguments("--disable-notifications");
        driver = new ChromeDriver(options);
        driver.get(BASE_URL);

        loginPage = new LoginPage(driver);
        ${context.featureLower}Page = new ${context.className}(driver);
    }

    @BeforeMethod
    public void beforeEachTest() {
        // Ensure user is logged in before each test
        if (!loginPage.isLoggedIn()) {
            driver.get(BASE_URL);
            loginPage.login(USERNAME, PASSWORD);
        }
    }

    @AfterClass
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    // ===============================================
    // Generated Test Methods
    // ===============================================

${testMethods}
}`
    };
  }

  /* ---- Generate Individual Test Method ---- */
  _generateTestMethod(tc, context) {
    const methodName = this._toMethodName(tc.title);
    const priorityGroup = tc.priority === 'High' ? 'smoke' : tc.priority === 'Medium' ? 'regression' : 'extended';
    const stepsComments = (tc.steps || []).map((s, i) => `        // Step ${i + 1}: ${s}`).join('\n');

    let bodyCode = '';

    // Generate appropriate test body based on test type and title
    const titleLower = tc.title.toLowerCase();

    if (titleLower.includes('login') && titleLower.includes('valid') && !titleLower.includes('invalid')) {
      bodyCode = `        loginPage.login(USERNAME, PASSWORD);
        Assert.assertTrue(loginPage.isLoggedIn(), "User should be logged in after valid credentials");`;
    } else if (titleLower.includes('login') && (titleLower.includes('invalid') || titleLower.includes('fail'))) {
      bodyCode = `        loginPage.login(USERNAME, "wrongPassword123!");
        Assert.assertTrue(loginPage.isErrorMessageDisplayed(), "Error message should be displayed for invalid credentials");
        Assert.assertTrue(loginPage.isLoginPageDisplayed(), "User should remain on login page");`;
    } else if (titleLower.includes('login') && titleLower.includes('empty')) {
      bodyCode = `        loginPage.login("", "");
        Assert.assertTrue(loginPage.isLoginPageDisplayed(), "User should remain on login page with empty credentials");`;
    } else if (titleLower.includes('navigation') || titleLower.includes('navigate')) {
      bodyCode = `        ${context.featureLower}Page.navigateTo${context.feature}Page();
        Assert.assertTrue(${context.featureLower}Page.is${context.feature}PageDisplayed(), "${context.module} page should be displayed");`;
    } else if (titleLower.includes('creat') || titleLower.includes('add new')) {
      bodyCode = `        ${context.featureLower}Page.navigateTo${context.feature}Page();
        int initialCount = ${context.featureLower}Page.getTableRowCount();
        ${context.featureLower}Page.create${context.feature}("Test ${context.feature} " + System.currentTimeMillis(), "Automated test description");
        Assert.assertTrue(${context.featureLower}Page.isSuccessMessageDisplayed(), "Success message should appear after creation");
        Assert.assertEquals(${context.featureLower}Page.getTableRowCount(), initialCount + 1, "Row count should increase by 1");`;
    } else if (titleLower.includes('delete')) {
      bodyCode = `        ${context.featureLower}Page.navigateTo${context.feature}Page();
        int initialCount = ${context.featureLower}Page.getTableRowCount();
        ${context.featureLower}Page.clickDeleteOnRow(0);
        ${context.featureLower}Page.confirmDelete();
        Assert.assertTrue(${context.featureLower}Page.isSuccessMessageDisplayed(), "Success message should appear after deletion");`;
    } else if (titleLower.includes('search')) {
      bodyCode = `        ${context.featureLower}Page.navigateTo${context.feature}Page();
        ${context.featureLower}Page.search("Test ${context.feature}");
        Assert.assertTrue(${context.featureLower}Page.getTableRowCount() > 0, "Search should return matching results");`;
    } else if (titleLower.includes('logout')) {
      bodyCode = `        loginPage.logout();
        Assert.assertTrue(loginPage.isLoginPageDisplayed(), "User should be redirected to login page after logout");`;
    } else {
      bodyCode = `        ${context.featureLower}Page.navigateTo${context.feature}Page();
        // TODO: Implement specific assertions for this test case
        Assert.assertTrue(${context.featureLower}Page.is${context.feature}PageDisplayed(), "${context.module} page should be accessible");`;
    }

    return `    /**
     * ${tc.id}: ${tc.title}
     * Type: ${tc.type} | Priority: ${tc.priority}
     * Preconditions: ${tc.preconditions || 'N/A'}
     * Expected: ${tc.expectedResult || 'N/A'}
     */
    @Test(groups = {"${priorityGroup}", "${tc.type.toLowerCase().replace(/[^a-z]/g, '_')}"}, priority = ${tc.priority === 'High' ? 1 : tc.priority === 'Medium' ? 2 : 3})
    public void ${methodName}() {
${stepsComments}

${bodyCode}
    }`;
  }

  /* ---- 5. Test Data Utils ---- */
  _generateTestDataUtils(pkg) {
    return {
      name: 'TestDataUtils.java',
      path: `src/main/java/${pkg.replace(/\./g, '/')}/utils/TestDataUtils.java`,
      language: 'java',
      code: `package ${pkg}.utils;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;

/**
 * TestDataUtils — Configuration and test data management.
 * Reads from config.properties for environment-specific values.
 */
public class TestDataUtils {

    private static final Properties props = new Properties();

    static {
        try {
            props.load(new FileInputStream("src/test/resources/config.properties"));
        } catch (IOException e) {
            System.err.println("Warning: config.properties not found. Using defaults.");
            props.setProperty("base.url", "http://localhost:8080");
            props.setProperty("username", "testuser");
            props.setProperty("password", "Test@123");
        }
    }

    public static String getBaseUrl() {
        return props.getProperty("base.url", "http://localhost:8080");
    }

    public static String getUsername() {
        return props.getProperty("username", "testuser");
    }

    public static String getPassword() {
        return props.getProperty("password", "Test@123");
    }

    public static String getProperty(String key) {
        return props.getProperty(key);
    }

    public static String getProperty(String key, String defaultValue) {
        return props.getProperty(key, defaultValue);
    }

    public static String generateUniqueId() {
        return "auto_" + System.currentTimeMillis();
    }

    public static String generateTestData(String prefix) {
        return prefix + "_" + System.currentTimeMillis();
    }
}`
    };
  }

  /* ---- 6. TestNG XML ---- */
  _generateTestNGXml(pkg, context) {
    return {
      name: 'testng.xml',
      path: 'testng.xml',
      language: 'xml',
      code: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE suite SYSTEM "https://testng.org/testng-1.0.dtd">
<suite name="${context.module} Test Suite" verbose="2" parallel="methods" thread-count="2">

    <test name="Smoke Tests">
        <groups>
            <run>
                <include name="smoke"/>
            </run>
        </groups>
        <classes>
            <class name="${pkg}.tests.${context.testClassName}"/>
        </classes>
    </test>

    <test name="Regression Tests">
        <groups>
            <run>
                <include name="regression"/>
            </run>
        </groups>
        <classes>
            <class name="${pkg}.tests.${context.testClassName}"/>
        </classes>
    </test>

    <test name="Full Suite">
        <classes>
            <class name="${pkg}.tests.${context.testClassName}"/>
        </classes>
    </test>

    <listeners>
        <listener class-name="org.testng.reporters.JUnitXMLReporter"/>
    </listeners>
</suite>`
    };
  }

  /* ---- Helper: Convert title to method name ---- */
  _toMethodName(title) {
    return 'test' + title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('')
      .substring(0, 60);
  }

  /* ---- Render Results ---- */
  renderResults(result) {
    const { files, stats } = result;

    const statsHTML = `
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-card-value">${stats.totalFiles}</div>
          <div class="stat-card-label">Files</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value">${stats.totalLines}</div>
          <div class="stat-card-label">Lines of Code</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value">${stats.testMethods}</div>
          <div class="stat-card-label">Test Methods</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value">${stats.pageObjects}</div>
          <div class="stat-card-label">Page Objects</div>
        </div>
      </div>
    `;

    const filesHTML = files.map((f, i) => `
      <div class="testcase-card ${i === 0 ? 'expanded' : ''}" data-id="${f.name}">
        <div class="testcase-card-header" onclick="this.parentElement.classList.toggle('expanded')">
          <span class="testcase-id">${f.language.toUpperCase()}</span>
          <span class="testcase-title">${f.name}</span>
          <span class="testcase-type">${f.path}</span>
        </div>
        <div class="testcase-card-body">
          <div class="code-output">
            <button class="copy-btn" onclick="ExportUtils.copyToClipboard(app.generatedFiles[${i}].code); ExportUtils.showNotification('Copied!','success')">Copy</button>
            <pre>${this._escapeHtml(f.code)}</pre>
          </div>
        </div>
      </div>
    `).join('');

    return `
      <div class="results-container visible" style="animation: fadeSlideIn 0.5s ease">
        ${statsHTML}

        <div class="flex justify-between items-center mb-md">
          <h4 style="font-size:var(--text-base)">Generated Files (${stats.framework} + POM)</h4>
          <button class="btn btn-sm btn-outline" onclick="app.expandAllTestCases()">Expand All</button>
        </div>

        ${filesHTML}

        <div class="divider"></div>
        <div class="flex gap-sm">
          <button class="btn btn-secondary btn-sm" onclick="app.downloadAllScripts()">📥 Download All Files</button>
          <button class="btn btn-primary btn-sm" onclick="app.navigateTo('pme-analyzer')">→ PME Analyzer</button>
        </div>
      </div>
    `;
  }

  _escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

window.ScriptWriter = ScriptWriter;

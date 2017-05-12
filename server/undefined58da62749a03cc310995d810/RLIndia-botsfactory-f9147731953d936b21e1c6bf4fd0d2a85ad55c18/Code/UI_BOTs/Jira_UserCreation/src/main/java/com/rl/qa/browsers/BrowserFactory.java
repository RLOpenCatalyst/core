package com.rl.qa.browsers;
import com.gargoylesoftware.htmlunit.BrowserVersion;
import com.rl.qa.FileUtilities;
import com.rl.qa.utils.CucumberContext;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.Point;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxBinary;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxProfile;
import org.openqa.selenium.htmlunit.HtmlUnitDriver;
import org.openqa.selenium.ie.InternetExplorerDriver;
import org.openqa.selenium.remote.Augmenter;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.remote.RemoteWebDriver;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static junit.framework.Assert.assertNotNull;

//import static com.rl.qa.utils.FileUtils.createDirectory;

public class BrowserFactory {
    //WebDriver driver;
    //public static Scenario scenario;

    private static WebDriver createHtmlUnitDriver() {
        // Create a pure Java based browser with a Javascript that emulates
        // FIREFOX's Javascript engine.
//        return new HtmlUnitDriver(BrowserVersion.FIREFOX_17);
        return new HtmlUnitDriver(BrowserVersion.FIREFOX_38);
    }

    private static WebDriver createInternetExplorerDriver() {
        return new InternetExplorerDriver();
    }

    private static WebDriver createChromeDriver() {
        File dataDir = new File(FileUtilities.getCWD(), "\\target");
        String path = dataDir.getPath();

        FileUtilities dir = new FileUtilities();
//        createDirectory(path);

        Map<String, Object> prefs = new HashMap<String, Object>();
        prefs.put("download.default_directory", path);

        DesiredCapabilities caps = DesiredCapabilities.chrome();

        ChromeOptions options = new ChromeOptions();
        options.setExperimentalOption("prefs", prefs);
        caps.setCapability(ChromeOptions.CAPABILITY, options);

        System.setProperty("webdriver.chrome.driver", "src/main/resources/chromedriver.exe");
        return new Augmenter().augment(new ChromeDriver(caps));
    }

    private static WebDriver createFirefoxDriver(FirefoxProfile profile) {
        return new Augmenter().augment(new FirefoxDriver(profile));
    }

    private static WebDriver createXvfbFirefoxDriver() {
        FirefoxBinary firefoxBinary = new FirefoxBinary(new File("/usr/bin/firefox"));

        firefoxBinary.setEnvironmentProperty("DISPLAY", ":1");

        return new Augmenter().augment(new FirefoxDriver(firefoxBinary, null));
    }

    /**
     * Returns the user's download directory creating it if it was not found.
     */
    public static String getBrowserDownloadsDir() throws IOException {
        File downloads = new File(System.getProperty("user.home"), "Downloads");

        if (!downloads.exists()) {
            if (!downloads.mkdirs()) {
                String msg = String.format("Unable to create directory '%s'", downloads.getCanonicalPath());

                throw new IOException(msg);
            }
        }

        return downloads.getCanonicalPath();
    }

    private static void addAllBrowserSetup(WebDriver driver) {
        driver.manage().deleteAllCookies();
        driver.manage().timeouts().implicitlyWait(40, TimeUnit.SECONDS);
        driver.manage().window().maximize();
//        driver.manage().window().setPosition(new Point(0, 0));
//        driver.manage().window().setSize(new Dimension(1500, 800));
//        driver.manage().window().setPosition(new Point(0, 0));
//        java.awt.Dimension screenSize = Toolkit.getDefaultToolkit().getScreenSize();
//        Dimension dim = new Dimension((int) screenSize.getWidth(), (int) screenSize.getHeight());
//        driver.manage().window().setSize(dim);
//        Toolkit toolkit = Toolkit.getDefaultToolkit();
//        int Width = (int) toolkit.getScreenSize().getWidth();
//        int Height = (int)toolkit.getScreenSize().getHeight();
//        Dimension screenResolution = new Dimension(Width,Height);
//        driver.manage().window().setSize(screenResolution);
//        driver.manage().window().setSize(new Dimension(1500, 800));

    }

    /**
     * Create a selenium WebDriver that is appropriate for use with the specified
     * type of browser.
     *
     * @param browserType - type of browser to create
     * @return WebDriver
     */
    public static WebDriver createBrowser(BrowserType browserType) {
        WebDriver driver;
        URL seleniumHub;
        DesiredCapabilities capabilities;

        //original
        File dataDir = new File(FileUtilities.getCWD(), "//target");
        String path = dataDir.getPath();


//        createDirectory(path);

        switch (browserType) {
            case XVFB_FIREFOX:
                driver = createXvfbFirefoxDriver();
                System.out.println("Created XVFB_FIREFOX browser driver.");
                break;
            case REMOTE_FIREFOX:
                seleniumHub = CucumberContext.getSeleniumHub();

                assertNotNull(String.format("Property [%s] is not defined!", CucumberContext.SELENIUM_HUB), seleniumHub);

                File profileDirectory = new File(path);
                FirefoxProfile profile = new FirefoxProfile(profileDirectory);

                capabilities = DesiredCapabilities.firefox();
                capabilities.setCapability(FirefoxDriver.PROFILE, profile);

                driver = new RemoteWebDriver(
                        seleniumHub, capabilities
                );

                driver.manage().window().setPosition(new Point(0, 0));
                driver.manage().window().setSize(new Dimension(1500, 800));
                driver.manage().window().maximize();

                System.out.format("Created REMOTE_FIREFOX browser, windows size: %s\n", driver.manage().window().getSize());
                //return driver;
                break;
            case REMOTE_CHROME:
                seleniumHub = CucumberContext.getSeleniumHub();

                assertNotNull(String.format("Property [%s] is not defined!", CucumberContext.SELENIUM_HUB), seleniumHub);

                //capabilities = DesiredCapabilities.chrome();
                //capabilities.setCapability("chrome.switches", "['--start-maximized']");
                //capabilities.setCapability("chrome.switches", Arrays.asList("--start-maximized"));

                //ChromeOptions options = new ChromeOptions();

                //options.addArguments("start-maximized");
                //capabilities.setCapability(ChromeOptions.CAPABILITY, options);

                Map<String, Object> prefs = new HashMap<String, Object>();
                prefs.put("download.default_directory", path);

                capabilities = DesiredCapabilities.chrome();

                ChromeOptions options = new ChromeOptions();
                options.setExperimentalOption("prefs", prefs);
                capabilities.setCapability(ChromeOptions.CAPABILITY, options);
                driver = new RemoteWebDriver(
                        seleniumHub,
                        capabilities
                );

                //JavascriptExecutor je = (JavascriptExecutor)driver;

                //je.executeScript("window.resizeTo(1024, 1024)");

//                driver.manage().window().setPosition(new Point(0, 0));
////                driver.manage().window().setSize(new Dimension(1024, 768));
//                driver.manage().window().setSize(new Dimension(1024, 1024));
////                driver.manage().window().setSize(new Dimension(1500, 800));
//                Dimension d = new Dimension(1500, 800);
//                driver.manage().window().setSize(d);
                driver.manage().window().setPosition(new Point(0, 0));
                driver.manage().window().setSize(new Dimension(1500, 800));
//                driver.manage().window().maximize();

                /*
                try {
                    driver = new RemoteWebDriver(
                        new URL("http://127.0.0.1:9515"), // use of chromedriver without Selenium GRID
                        capabilities
                    );
                } catch (MalformedURLException e) {
                    return null; // not going to happen
                }
                */

                System.out.format("Created REMOTE_CHROME browser, windows size: %s\n", driver.manage().window().getSize());
                break;
            //return driver;
            case REMOTE_IE:
                seleniumHub = CucumberContext.getSeleniumHub();

                assertNotNull(String.format("Property [%s] is not defined!", CucumberContext.SELENIUM_HUB), seleniumHub);

                capabilities = DesiredCapabilities.internetExplorer();

                // The following is using the chromedriver directly without the selenium server.
                driver = new RemoteWebDriver(
                        seleniumHub,
                        capabilities
                );

                System.out.format("Created REMOTE_CHROME browser, windows size: %s\n", driver.manage().window().getSize());
                //return driver;
            case CHROME:
                driver = createChromeDriver();
                System.out.println("Created CHROME browser driver.");
                break;
            case IE:
                driver = createInternetExplorerDriver();
                System.out.println("Created IE browser driver.");
                break;
            case HTML_UNIT:
                driver = createHtmlUnitDriver();
                System.out.println("Created HTML_UNIT browser driver.");
                break;
            case FIREFOX:
            default:
                profile = new FirefoxProfile();
                profile.setPreference("browser.download.folderList", 2);
                profile.setPreference("browser.download.dir", path);

                profile.setPreference("browser.download.alertOnEXEOpen", false);
                profile.setPreference("browser.helperApps.neverAsk.saveToDisk", "text/html;" +
                        "text/xml; application/xml; " +
                        "application/excel; application/vnd.ms-excel; application/x-excel; application/x-msexcel;" +
                        "application/pdf;" +
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                profile.setPreference("browser.download.manager.showWhenStarting", false);
                profile.setPreference("browser.download.manager.focusWhenStarting", false);
                profile.setPreference("browser.helperApps.alwaysAsk.force", false);
                profile.setPreference("browser.download.manager.alertOnEXEOpen", false);
                profile.setPreference("browser.download.manager.closeWhenDone", false);
                profile.setPreference("browser.download.manager.showAlertOnComplete", false);
                profile.setPreference("browser.download.manager.useWindow", false);
                profile.setPreference("browser.download.manager.showWhenStarting", false);
                profile.setPreference("services.sync.prefs.sync.browser.download.manager.showWhenStarting", false);

                driver = createFirefoxDriver(profile);
                System.out.println("Created FIREFOX browser driver.");
                driver.manage().window().setPosition(new Point(0, 0));
                driver.manage().window().setSize(new Dimension(1500, 800));
                driver.manage().window().maximize();
                break;
        }

        addAllBrowserSetup(driver);

        return driver;
    }

    /**
     * Create a selenium WebDriver that is appropriate for use with the specified
     * type of browser. The JVM property 'browser' may be used to specify the
     * desired browser type with a default of 'firefox'. Supported browser types
     * include: [firefox,chrome,ie].
     * <p>
     * Example of specifying browser type 'ie':
     * <p>
     * -Dbrowser=ie
     *
     * @return WebDriver
     */
    public static WebDriver createBrowser() {

        BrowserType bt = CucumberContext.getBrowserType();

//        assertNotNull("Required property 'iwms.browser' not defined!", bt);

        return createBrowser(bt);
    }
}
  /*
    @Before
    public static void setUp(Scenario scenario) {
        //this.Scenario = scenario;
    }

 @After("@browser")
    public void after(Scenario scenario) {
        if (scenario.isFailed()) {
            final byte[] screenshot = ((TakesScreenshot) driver)
                    .getScreenshotAs(OutputType.BYTES);
            scenario.embed(screenshot, "//target//image/png"); //stick it in the report


        }
        driver.close();
    }

    } */


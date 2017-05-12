package com.rl.qa.browsers;

import com.google.common.io.Files;
import com.rl.qa.utils.CucumberContext;
import com.rl.qa.utils.BaseView;
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.*;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;

import static org.junit.Assert.assertNotNull;

public class BrowserDriver {
    private static final Logger LOGGER = Logger.getLogger(BrowserDriver.class.getName());

    private static final ThreadLocal<WebDriver> driverThreadLocal = new ThreadLocal<WebDriver>() {
        protected WebDriver initialValue() {
            WebDriver driver = BrowserFactory.createBrowser();

            Runtime.getRuntime().addShutdownHook(new Thread(new BrowserCleanup(driver)));

            return driver;
        }
    };

    private static int defaultWaitTime = 30;

    private static class BrowserCleanup implements Runnable {
        private WebDriver driver;

        public void run() {
            try {
                driver.quit();
                CucumberContext.getCucumberContext().put("loggedIn", false);
            } catch (Exception e) {
                LOGGER.warning(e.getMessage());
                BaseView.takeScreenshot("BrowserNotFound.png");
            }
        }

        public BrowserCleanup(WebDriver driver) {
            this.driver = driver;
        }
    }

    public static WebDriver getCurrentDriver() {
        return driverThreadLocal.get();
    }

    /**
     * Captures a screen shot of the browser's current page writing the .png image
     * to the specified file.
     *
     * @param imageFile - file to receive the .png image output
     */
    public static void takeScreenshot(File imageFile) throws IOException {
        TakesScreenshot ts = (TakesScreenshot) getCurrentDriver();
        File src = ts.getScreenshotAs(OutputType.FILE);
        Files.copy(src, imageFile);
        //  extractJSErrors();
    }

    /*public static void extractJSErrors() {
        JavaScriptError.readErrors(BrowserDriver.getCurrentDriver());
        final List jsErrors = JavaScriptError.readErrors(BrowserDriver.getCurrentDriver());
        if (!jsErrors.isEmpty()) {
            LOGGER.info("JS Script Error: " + jsErrors.toString());
        }
    }*/

    public static void loadPage(URL url) throws Throwable{
        assertNotNull("Required field 'url' is null!", url);
        loadPage(url.toString());
    }

    public static void logoutIfModalWindowAppears(String url) throws Throwable{
        try{
            BrowserDriver.getCurrentDriver().switchTo().defaultContent();
            WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(),8);
            wait.until(ExpectedConditions
                    .textToBePresentInElement(BrowserDriver.getCurrentDriver()
                            .findElement(By.cssSelector("div.x-css-shadow+div.x-window div.x-title-text")), "Confirm logout"));
            CucumberContext.getCucumberContext().put("loggedIn", false);
            loadPage(url);
        }catch(Exception e){
            System.out.println(e.getMessage());
        }
    }
    public static void loadPage(String url) throws Throwable{
        assertNotNull("Required field 'url' is null!", url);

        LOGGER.info("Directing browser to: " + url);

        WebDriver wd = getCurrentDriver();

        //needed when scripts fails in child window
        if (BaseView.mainWindowHandle != null) {
            BrowserDriver.getCurrentDriver().switchTo().window(BaseView.mainWindowHandle);
        }
        wd.manage().timeouts().implicitlyWait(20, TimeUnit.SECONDS);

        try {
            wd.get(url);
            logoutIfModalWindowAppears(url);
        } catch (WebDriverException e) {
            BaseView.takeScreenshot("redirect-to-url-fails.png");

            LOGGER.info(String.format("Attempting to recover from this WebDriver exception: %s", e.getMessage()));

//            // Let start with a fresh browser as the current one is mis-behaving.
//            try {
//                getCurrentDriver().close();
//                driverThreadLocal.remove();
//                LOGGER.info("Closed the browser on browser error.");
//            }catch(Exception ex){
//            }
////            getCurrentDriver().quit();
//            wd = getCurrentDriver();
//            CucumberContext.getCucumberContext().put("loggedIn", false);
//
//            LOGGER.info("Created new WebDriver instance as old one was failing to respond.");
//
//            wd.manage().timeouts().implicitlyWait(20, TimeUnit.SECONDS);
            wd.get(url);

            LOGGER.info("Browser at URL: " + url);
        }
    }

    /**
     * Returns the domain name of the current page. Necessary to navigate to pages that can only be accessed through
     * their address directly (e.g. Lx Administrator Page), since the environment URL varies between developers and
     * testing environment.
     *
     * @return The domain name of the current environment
     * @throws URISyntaxException
     */
    public static String getDomainName() throws URISyntaxException {
        URI uri = new URI(BrowserDriver.getCurrentDriver().getCurrentUrl());
        return uri.getHost();
    }

    public static WebElement waitForElement(WebElement elementToWaitFor) {
        return waitForElement(elementToWaitFor, null);
    }

    public static WebElement waitForElement(WebElement elementToWaitFor, Integer waitTimeInSeconds) {
        return waitForElement(getCurrentDriver(), elementToWaitFor, waitTimeInSeconds);
    }

    public static WebElement waitForElement(WebDriver driver, WebElement elementToWaitFor, Integer waitTimeInSeconds) {
        if (waitTimeInSeconds == null) {
            waitTimeInSeconds = defaultWaitTime;
        }

        WebDriverWait wait = new WebDriverWait(driver, waitTimeInSeconds);
        //return wait.until(ExpectedConditions.visibilityOf(elementToWaitFor));
        return wait.until(ExpectedConditions.elementToBeClickable(elementToWaitFor));
    }

    public static WebElement findElementWithTimeout(final By by, final long timeOut) throws InterruptedException {
        Wait<WebDriver> wait = new FluentWait<WebDriver>(BrowserDriver.getCurrentDriver())
                .withTimeout(timeOut, TimeUnit.SECONDS)
                .pollingEvery(500l, TimeUnit.MILLISECONDS)
                .ignoring(NoSuchElementException.class)
                .ignoring(StaleElementReferenceException.class);

        try {
            return wait.until(ExpectedConditions.presenceOfElementLocated(by));
        } catch (TimeoutException te) {
            throw new InterruptedException(te.getMessage());
        }
    }

    public static List<WebElement> waitForAllElements(List<WebElement> elementsToWaitFor) {
        return BrowserDriver.waitForAllElements(elementsToWaitFor, null);
    }

    public static List<WebElement> waitForAllElements(List<WebElement> elementsToWaitFor, Integer waitTimeInSeconds) {
        return BrowserDriver.waitForAllElements(BrowserDriver.getCurrentDriver(), elementsToWaitFor, waitTimeInSeconds);
    }

    public static List<WebElement> waitForAllElements(WebDriver driver, List<WebElement> elementsToWaitFor, Integer waitTimeInSeconds) {
        if (waitTimeInSeconds == null) {
            waitTimeInSeconds = defaultWaitTime;
        }

        WebDriverWait wait = new WebDriverWait(driver, waitTimeInSeconds);
        return wait.until(ExpectedConditions.visibilityOfAllElements(elementsToWaitFor));
    }

    public static WebElement getParent(WebElement element) {
        return element.findElement(By.xpath(".."));
    }

    /**
     * Copied from Selenium JavascriptExecutor.executeScript() javadoc.
     * <p/>
     * Executes JavaScript in the context of the currently selected frame or
     * window. The script fragment provided will be executed as the body of
     * an anonymous function. Within the script, use document to refer to the
     * current document. Note that local variables will not be available once
     * the script has finished executing, though global variables will persist.
     * <p/>
     * If the script has a return value (i.e. if the script contains a return
     * statement), then the following steps will be taken:
     * <p/>
     * For an HTML element, this method returns a WebElement
     * For a decimal, a Double is returned
     * For a non-decimal number, a Long is returned
     * For a boolean, a Boolean is returned
     * For all other cases, a String is returned.
     * For an array, return a List<Object> with each object following the
     * rules above. We support nested lists.
     * <p/>
     * Unless the value is null or there is no return value, in which null
     * is returned Arguments must be a number, a boolean, a String, WebElement,
     * or a List of any combination of the above. An exception will be thrown
     * if the arguments do not meet these criteria. The arguments will be made
     * available to the JavaScript via the "arguments" magic variable, as if
     * the function were called via "Function.apply"
     */
    public static Object executeScript(String script) {
        JavascriptExecutor je = (JavascriptExecutor) BrowserDriver.getCurrentDriver();

        return je.executeScript(script);
    }

    public static List<WebElement> getDropDownOptions(WebElement webElement) {
        Select select = new Select(webElement);
        return select.getOptions();
    }

    public static WebElement getDropDownOption(WebElement webElement, String value) {
        WebElement option = null;
        List<WebElement> options = getDropDownOptions(webElement);
        for (WebElement element : options) {
            if (element.getAttribute("value").equalsIgnoreCase(value)) {
                option = element;
                break;
            }
        }
        return option;
    }

    /**
     * Waits for the element to be displayed, then clicks that element.
     *
     * @param webElement
     */
    public static void clickElement(WebElement webElement) {
        webElement = BrowserDriver.waitForElement(webElement);
        webElement.isDisplayed();
        webElement.click();
    }

    /**
     * Gets the visible text in the specified WebElement, with the white space before and after trimmed off.
     *
     * @param webElement - the WebElement to grab its visible text from.
     * @return A String representation of the trimmed text that is visible in this WebElement.
     */
    public static String getTextFromElement(WebElement webElement) {
        webElement = BrowserDriver.waitForElement(webElement);
        webElement.isDisplayed();
        return webElement.getText().trim();
    }
}

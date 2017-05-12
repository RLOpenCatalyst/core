package com.rl.qa.utils;

import com.rl.qa.browsers.BrowserDriver;
import junit.framework.Assert;
import junit.framework.TestCase;
import org.apache.log4j.Logger;
import org.openqa.selenium.*;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.*;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.NoSuchElementException;
import java.util.concurrent.TimeUnit;

import static com.rl.qa.utils.CucumberContext.getCucumberContext;
import static junit.framework.Assert.fail;
import static org.openqa.selenium.support.ui.ExpectedConditions.*;

/**
 * Commonly used Framework Function libraries
 *
 */
public class SeleniumUtilities {
    public static int OBJWAITTIMEOUT = 10;
    public static int WEBDRIVER_WAIT = 60;
    public static int WEBDRIVER_WAIT_SMALL = 30;
    public static int DEFAULT_TIMEOUT_IN_SECONDS = 50, DEFAULT_SLEEP_TIME_IN_SECONDS = 50, WAIT_TIME = 50;
    public static Logger Log = Logger.getLogger(Logger.class.getName());
    public static Properties objProp;

    String parentBrowser = null;
    private static final String DATE_FORMAT = "MM/dd/yyyy";
    private static DateFormat formatter = new SimpleDateFormat(DATE_FORMAT);
    Map<String, String> map = new HashMap<String, String>();
    Integer count;
    public static Properties GTKey = new Properties();

    private int waitTime = 4;
    private WebDriver driver;


    public enum Locators {
        xpath, id, name, classname, paritallinktext, linktext, tagname, cssselector
    }

    //WebElement el = seleniumUtil.getWebElementObject("div[id^=Covenant_CodeCovenantGroupID]", "cssSelector");


    public void editableField(String locator, String element, String value, int timeout) throws Exception {
        //WebElement el = seleniumUtil.getWebElementObject("div[id^=Covenant_CodeCovenantGroupID]", "cssSelector");
        BaseView.pushShortTimeout();
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            Actions action = new Actions(driver);
            action.click(ele).sendKeys(value).perform();
            Log.info("Typing text '" + value + "' into text field ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element ''" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }
    }


    public void editableClick(String locator, String element, int timeout) throws Exception {
        //WebElement el = seleniumUtil.getWebElementObject("div[id^=Covenant_CodeCovenantGroupID]", "cssSelector");
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
//            Actions action = new Actions(driver);
//            action.click(ele).perform();

            Actions builder = new Actions(driver);

            builder.moveToElement(ele);
            builder.click();
            builder.build().perform();

            Log.info("Clicking on field ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element ''" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }
    }


    public static WebElement findElementWithTimeout(final By by, final long timeOut) throws InterruptedException {
        Wait<WebDriver> wait = new FluentWait<WebDriver>(BrowserDriver.getCurrentDriver())
                .withTimeout(timeOut, TimeUnit.SECONDS)
                .pollingEvery(500l, TimeUnit.MILLISECONDS)
                .ignoring(NoSuchElementException.class)
                .ignoring(StaleElementReferenceException.class);

        try {
            return wait.until(presenceOfElementLocated(by));
        } catch (TimeoutException te) {
            throw new InterruptedException(te.getMessage());
        }
    }

    public void dragAndDropElement(String fromElementLocator, String fromElement, String targetElementLocator, String targetElement) throws Exception {
        try {
            WebElement fromEle = getWebElementObject(fromElementLocator, fromElement);
            WebElement targetEle = getWebElementObject(targetElementLocator, targetElement);
            Actions builder = new Actions(driver);
            builder.moveToElement(fromEle).build().perform();
            builder.dragAndDrop(fromEle, targetEle).build().perform();
           /* Action dragAndDrop = builder.clickAndHold(fromEle)
               .moveToElement(targetEle)
               .release(targetEle)
               .build();
            dragAndDrop.perform();*/

            Log.info("Drag and drop of " + fromElement + " field is successful");
        } catch (Exception ex) {
            Log.error("Error Message :" + ex.getMessage());
        }
    }


    public void dragAndDropElementXYOffSet(String fromElementLocator, String fromElement, int xOffset, int yOffset) throws Exception {
        try {
            WebElement fromEle = getWebElementObject(fromElementLocator, fromElement);
            Actions builder = new Actions(driver);
            builder.moveToElement(fromEle).perform();
            builder.dragAndDropBy(fromEle, xOffset, yOffset).build().perform();

            Log.info("Drag and drop of " + fromElement + " field is successful");
        } catch (Exception ex) {
            Log.error("Error Message :" + ex.getMessage());
        }
    }

    public void rightClickSelectMenuOption(String locator, String element, String menuOptionLink) throws Exception {
        try {
            WebElement ele = getWebElementObject(locator, element);
            Actions oAction = new Actions(driver);
            oAction.moveToElement(ele);
            for (int i = 0; i < 10; i++) {
                /* this will perform right click */
                oAction.contextClick(ele).build().perform();
                try {
                    WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), 5);
                    wait.until(visibilityOfElementLocated(By.cssSelector("div#folderMenu-body")));

                    break;
                } catch (Exception e) {
                }
            }
            driver.findElement(By.linkText(menuOptionLink)).click();
			/*WebElement elementOpen = driver.findElement(By.linkText(menuOptionLink)); *//*This will select menu after right click *//*
			elementOpen.click();*/
            Log.info("Performed right click on menu option to select : " + menuOptionLink + " '" + locator + "=" + element + "'");
        } catch (Exception ex) {
            Exception error = new Exception(element);
            Log.error("Does not performed right click on menu option to select : " + menuOptionLink + " '" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }
    }

    public void rightClickSelectMenuOption(String locator, String element, String menuLocator, String menuElement) throws Exception {
        try {
            WebElement ele = getWebElementObject(locator, element);
            Actions oAction = new Actions(driver);
            oAction.moveToElement(ele);
            for (int i = 0; i < 10; i++) {
                /* this will perform right click */
                oAction.contextClick(ele).build().perform();
                try {
                    WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), 5);
                    wait.until(visibilityOfElementLocated(By.id("mainMenu-innerCt")));

                    break;
                } catch (Exception e) {
                }
            }
            click(menuLocator, menuElement, SeleniumUtilities.OBJWAITTIMEOUT);

            Log.info("Performed right click on menu option to select : " + locator + "=" + element + "'");
        } catch (Exception ex) {
            Exception error = new Exception(element);
            Log.error("Does not performed right click on menu option to select : " + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }
    }

    public void rightClickSelectMenuOption(WebElement ele, String menuOptionLink) throws Exception {
        try {
            Actions oAction = new Actions(driver);
            oAction.moveToElement(ele);
            oAction.contextClick(ele).build().perform();
            driver.findElement(By.linkText(menuOptionLink)).click();
            Log.info("Performed right click on menu option to select : " + menuOptionLink + " '" + ele.getText());
        } catch (Exception ex) {
            Exception error = new Exception(ele.getText());
            Log.error("Does not performed right click on menu option to select : " + menuOptionLink + " '" + ele.getText());
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }
    }

    public void rightClickSelectMenuOption(WebElement ele, String strMovemenuOptionLink, String menuOptionLink) throws Exception {
        int count = 0;
        do {
            count++;
            try {
                Actions oAction = new Actions(driver);
                oAction.moveToElement(ele);
                oAction.contextClick(ele).build().perform();

                WebElement mvEle = driver.findElement(By.linkText(strMovemenuOptionLink));
                Actions mvAction = new Actions(driver);
                mvAction.moveToElement(mvEle);
                mvAction.click(mvEle).build().perform();

                WebElement menuOpEle = driver.findElement(By.linkText(menuOptionLink));
                Actions menuOpAction = new Actions(driver);
                menuOpAction.moveToElement(menuOpEle).build().perform();

                WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), 5);
                wait.until(presenceOfElementLocated(By.xpath("//span[text()='" + menuOptionLink + "'][contains(@class,'x-menu-item-text')]")));
                driver.findElement(By.xpath("//span[text()='" + menuOptionLink + "'][contains(@class,'x-menu-item-text')]")).click();
                mvAction.doubleClick(driver.findElement(By.xpath("//span[text()='" + menuOptionLink + "'][contains(@class,'x-menu-item-text')]")));
                BaseView.pushShortTimeout();
                if (!(BrowserDriver.getCurrentDriver().findElements(By.xpath("//span[text()='" + menuOptionLink + "'][contains(@class,'x-menu-item-text')]")).size() > 0)) {
                    break;
                }
                Log.info("Performed right click on menu option to select : " + menuOptionLink + " '" + ele.getText());
            } catch (Exception ex) {

                if (count == 9) {
                    Exception error = new Exception(ele.getText());
                    Log.error("Does not performed right click on menu option to select : " + menuOptionLink + " '" + ele.getText());
                    String Str = new String(error.getMessage());
                    Log.error("Error Message :" + Str.substring(1, 240));
                    BaseView.popDefaultTimeout();
                    throw error;
                }
            } finally {
                BaseView.popDefaultTimeout();
            }
        } while (count < 10);

    }

    public Boolean rightClickVerifyMenuOption(WebElement ele, String strMovemenuOptionLink, String menuOptionLink) throws Exception {
        Boolean flag = false;
        try {
            Actions oAction = new Actions(driver);
            oAction.moveToElement(ele);
            oAction.contextClick(ele).build().perform();

            WebElement mvEle = driver.findElement(By.linkText(strMovemenuOptionLink));
            Actions mvAction = new Actions(driver);
            mvAction.moveToElement(mvEle);
            mvAction.click(mvEle).build().perform();

            try {
                WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), 5);
                //wait.until(ExpectedConditions.presenceOfElementLocated(By.linkText(menuOptionLink)));
                wait.until(presenceOfElementLocated(By.xpath("//span[text()='" + menuOptionLink + "'][contains(@class,'x-menu-item-text')]")));
                flag = true;
            } catch (Exception ex) {
                flag = false;
            }

            try {
                WebElement escpmvEle = driver.findElement(By.linkText(strMovemenuOptionLink));
                Actions escpmvAction = new Actions(driver);
                escpmvAction.moveToElement(escpmvEle);
                escpmvAction.sendKeys(Keys.ESCAPE).build().perform();
            } catch (Exception ex) {
            }
            Log.info("Performed right click on menu option to verify : " + menuOptionLink + " '" + ele.getText());
            return flag;
        } catch (Exception ex) {
            Exception error = new Exception(ele.getText());
            Log.error("Does not performed right click on menu option to verify : " + menuOptionLink + " '" + ele.getText());
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }
    }

    public void dblClick(String locator, String element, int OBJWAITTIMEOUT) throws Exception {
        try {
            WebElement ele = getWebElementObject(locator, element);
            Actions oAction = new Actions(driver);
            oAction.moveToElement(ele);
            oAction.doubleClick(ele).build().perform();  /* this will perform dbl click */
            Log.info("Performed double click on element : " + "'" + locator + "=" + element + "'");
        } catch (Exception ex) {
            Exception error = new Exception(element);
            Log.error("Does not performed double click on element : " + " '" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }
    }

    public void doubleClickElement(WebElement element) throws Exception {
        try {
            BrowserDriver.waitForElement(element);
            Actions oAction = new Actions(driver);
            oAction.moveToElement(element);
            oAction.doubleClick(element).build().perform();  /* this will perform dbl click */
            Log.info("Performed double click on element : " + "'" + "=" + element + "'");
        } catch (Exception ex) {
            Log.error("Does not performed double click on element : " + "='" + element + "'");
            //fail("Does not performed double click on element : "+"='"+element+"'"+"\n"+ex.getMessage());
        }
    }

    public void sendEnterKeyToElement(WebElement element) throws Exception {
        try {
            BrowserDriver.waitForElement(element);
            Actions oAction = new Actions(driver);
            oAction.moveToElement(element);
            oAction.sendKeys(element, Keys.ENTER).build().perform();  /* this will perform dbl click */
            Log.info("Performed enter on element : " + "'" + "=" + element + "'");
        } catch (Exception ex) {
            Log.error("Does not performed double click on element : " + "='" + element + "'");
            //fail("Does not performed double click on element : "+"='"+element+"'"+"\n"+ex.getMessage());
        }
    }


    public void dblClickSendKey(String locator, String element, String txtBoxLocator, String txtBoxElement, String strValue, int OBJWAITTIMEOUT) throws Exception {
        try {
            WebElement ele = getWebElementObject(locator, element);
            Actions oAction = new Actions(driver);
            oAction.moveToElement(ele);
            oAction.doubleClick(ele).build().perform();  /* this will perform dbl click */

            WebElement txtBoxele = getWebElementObject(txtBoxLocator, txtBoxElement);
            txtBoxele.clear();
            Actions txtBoxAction = new Actions(driver);
            txtBoxAction.moveToElement(txtBoxele);
            txtBoxAction.sendKeys("").sendKeys(strValue).sendKeys(Keys.ENTER).build().perform();

            Log.info("Performed double click on element and entered the value in text box: " + "'" + locator + "=" + element + "'" + "'" + strValue + "'");
        } catch (Exception ex) {
            Exception error = new Exception(element);
            Log.error("Does not performed double click on element : " + " '" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }
    }

    public boolean verifyDataInTableColumns(WebElement ele, String strLabelName, String strValue) throws Exception {
        int col_num = 0, matchIndex = 0;
        boolean flag = false;
        List<WebElement> tableRows = ele.findElements(By.xpath("./tbody/tr"));

        for (WebElement trElement : tableRows) {
            List<WebElement> Cols = trElement.findElements(By.tagName("td"));
            for (WebElement tdElement : Cols) {
                col_num++;
                if (tdElement.getText().trim().contains(strLabelName)) {
                    matchIndex = col_num + 1;
                } else if (matchIndex == col_num) {
//                    String colValue = tdElement.getText().trim();
//                    if (colValue.contains(",")) {
//                        colValue = colValue.replace(",", "");
//                    }
//                    if (colValue.contains("$")) {
//                        colValue = colValue.replace("$", "");
//                    }
//                    if (colValue.contains(".")) {
//                        colValue = colValue.replace(".", "");
//                    }
//                    if (colValue.contains("%")) {
//                        colValue = colValue.replace("%", "");
//                    }
//
//                    if (strValue.contains(",")) {
//                        strValue = strValue.replace(",", "");
//                    }
//                    if (strValue.contains("$")) {
//                        strValue = strValue.replace("$", "");
//                    }
//                    if (strValue.contains(".")) {
//                        strValue = strValue.replace(".", "");
//                    }
//                    if (strValue.contains("%")) {
//                        strValue = strValue.replace("%", "");
//                    }
                    String colValue = replaceSpecialChar(tdElement.getText().trim());
                    strValue = replaceSpecialChar(strValue.trim());

                    if (colValue.contains(strValue) || strValue.contains(colValue) || colValue.equalsIgnoreCase(strValue)) {
                        matchIndex = 0;
                        Log.info(" Expected value :" + strLabelName + " - " + strValue + "- value exist :" + tdElement.getText().trim());
                        flag = true;
                        return flag;
                    } else {
                        Log.error(" Expected value :" + strLabelName + " - " + strValue + "- value exist :" + tdElement.getText().trim());
                        flag = false;
                        return flag;
                    }
                }
            }
        }
        if (flag == false)
            Log.error("Value does not exist: " + strLabelName + " : " + strValue);
        return flag;
    }

//    public boolean verifyRowPairValueData(WebElement ele, String strLabelName, String strValue) throws Exception {
//        int col_num = 0, matchIndex = 0;
//        boolean flag = false;
//        List<WebElement> tableRows = ele.findElements(By.xpath("./tbody/tr"));
//
//        for (WebElement trElement : tableRows) {
//            List<WebElement> Cols = trElement.findElements(By.tagName("td"));
//            for (WebElement tdElement : Cols) {
//                col_num++;
//                if (tdElement.getText().trim().contains(strLabelName)) {
//                    matchIndex = col_num + 1;
//                } else if (matchIndex == col_num) {
//                    String colValue = replaceSpecial(tdElement.getText().trim());
//                    strValue = replaceSpecial(strValue.trim());
//
//                    if (colValue.contains(strValue) || strValue.contains(colValue) || colValue.equalsIgnoreCase(strValue)) {
//                        matchIndex = 0;
//                        Log.info(" Expected value :" + strLabelName + " - " + strValue + "- value exist :" + tdElement.getText().trim());
//                        flag = true;
//                        return flag;
//                    } else {
//                        Log.error(" Expected value :" + strLabelName + " - " + strValue + "- value exist :" + tdElement.getText().trim());
//                        flag = false;
//                        return flag;
//                    }
//                }
//            }
//        }
//        if (flag == false)
//            Log.error("Value does not exist: " + strLabelName + " : " + strValue);
//        return flag;
//    }

    public String replaceSpecialChar(String strData) {
        if (strData.contains(",")) {
            strData = strData.replace(",", "");
        }
        if (strData.contains("'")) {
            strData = strData.replace("'", "");
        }
        if (strData.contains("$")) {
            strData = strData.replace("$", "");
        }
        if (strData.contains(".")) {
            strData = strData.replace(".", "");
        }
        if (strData.contains("%")) {
            strData = strData.replace("%", "");
        }
        if (strData.equalsIgnoreCase("false")) {
            strData = "No/off/false";
        }
        if (strData.equalsIgnoreCase("true")) {
            strData = "Yes/on/true";
        }

        if (strData.equals("Yes")) {
            strData = "true";
        }
        if (strData.equals("No")) {
            strData = "false";
        }
        return strData;
    }

    public boolean verifyDataInTableColumn(WebElement ele, String strLabelName, String strValue) throws Exception {
        boolean flag = false;
        List<WebElement> tableRows = ele.findElements(By.xpath("./tbody/tr"));
        for (WebElement trElement : tableRows) {
            List<WebElement> Cols = trElement.findElements(By.tagName("td"));
            for (WebElement tdElement : Cols) {
                if (tdElement.getText().trim().contains((strLabelName + "  " + strValue))) {
                    Log.info(" Expected value " + strLabelName + " : " + strValue + "- Value exist " + tdElement.getText().trim());
                    flag = true;
                    return flag;
                }
            }
        }
        if (flag == false)
            Log.error("Value does not exist: " + strLabelName + " : " + strValue);
        return flag;
    }


    public boolean verifySplitDataInTableColumns(WebElement ele, String strLabelName, String strValue) throws Exception {
        int col_num = 0, matchIndex = 0;
        boolean flag = false;
        List<WebElement> tableRows = ele.findElements(By.xpath("./tbody/tr"));

        for (WebElement trElement : tableRows) {
            List<WebElement> Cols = trElement.findElements(By.tagName("td"));
            for (WebElement tdElement : Cols) {
                col_num++;
                if (tdElement.getText().trim().contains(strLabelName)) {
                    matchIndex = col_num + 1;
                } else if (matchIndex == col_num) {
                    if (tdElement.getText().trim().contains(strValue)) {
                        matchIndex = 0;
                        Log.info(" Expected value :" + strLabelName + " - " + strValue + "- value exist :" + tdElement.getText().trim());
                        flag = true;
                        return flag;
                    } else {
                        Log.error(" Expected value :" + strLabelName + " - " + strValue + "- value exist :" + tdElement.getText().trim());
                        flag = false;
                        return flag;
                    }
                }
            }
        }
        if (flag == false)
            Log.error("Value does not exist: " + strLabelName + " : " + strValue);
        return flag;
    }

    public boolean verifyDataInTableRow(WebElement ele, String strLabelName, String strValue) throws Exception {
        int col_num = 0, matchIndex = 0;
        boolean flag = false;

        //Fetching web elemnts using the below xpath hanging inconsistently
        //List<WebElement> tableRows = ele.findElements(By.xpath("./tbody/tr"));
        List<WebElement> tableRows = ele.findElements(By.cssSelector("tbody>tr"));

        for (WebElement trElement : tableRows) {
           /* if((replaceSpecialChar(trElement.getText()).trim().contains(strLabelName)) && replaceSpecialChar(trElement.getText()).trim().contains(strValue)){
                Log.info(" Value exist: " + strLabelName + " : " + strValue);
                flag=true;
                return flag;
            }*/
        }
        if (flag == false)
            Log.error("Value does not exist: " + strLabelName + " : " + strValue);
        return flag;
    }

    public boolean verifyDataInNestedTables(WebElement ele, String strNestedLocator, String strNestedElement, String strTableHeaderLocator, String strTableHeaderElement, String strTableHeadertxt, String strLabelName, String strValue) throws Exception {
        int col_num = 0, matchIndex = 0;
        boolean flag = false;
        List<WebElement> tables = ele.findElements(By.cssSelector(strNestedElement));

        for (WebElement trElement1 : tables) {
            WebElement tableHeaderElement = trElement1.findElement(By.cssSelector(strTableHeaderElement));
            if (strTableHeadertxt.contentEquals(tableHeaderElement.getText())) {
                List<WebElement> tableRows = trElement1.findElements(By.xpath("./tbody/tr"));
                for (WebElement trElement : tableRows) {
                    List<WebElement> Cols = trElement.findElements(By.tagName("td"));
                    for (WebElement tdElement : Cols) {
                        col_num++;
                        if (tdElement.getText().trim().contains(strLabelName))
                            matchIndex = col_num + 1;
                        else if (matchIndex == col_num) {
                            if (tdElement.getText().contains(strValue)) {
                                matchIndex = 0;
                                Log.info("Expected value :" + strLabelName + " - " + strValue + "- Value exist " + tdElement.getText().trim());
                                flag = true;
                                return flag;
                            } else {
                                Log.error("Expected value :" + strLabelName + " - " + strValue + "- Value exist " + tdElement.getText().trim());
                                flag = false;
                                return flag;
                            }
                        }
                    }
                }
            }
        }
        if (flag == false)
            Log.error("Value does not exist: " + strLabelName + " : " + strValue);
        return flag;
    }

    public boolean verifyDataInNestedTablesEquals(WebElement ele, String strNestedLocator, String strNestedElement, String strTableHeaderLocator, String strTableHeaderElement, String strTableHeadertxt, String strLabelName, String strValue) throws Exception {
        int col_num = 0, matchIndex = 0;
        boolean flag = false;
        List<WebElement> tables = ele.findElements(By.cssSelector(strNestedElement));

        for (WebElement trElement1 : tables) {
            WebElement tableHeaderElement = trElement1.findElement(By.cssSelector(strTableHeaderElement));
            if (strTableHeadertxt.contentEquals(tableHeaderElement.getText())) {
                List<WebElement> tableRows = trElement1.findElements(By.xpath("./tbody/tr"));
                for (WebElement trElement : tableRows) {
                    List<WebElement> Cols = trElement.findElements(By.tagName("td"));
                    for (WebElement tdElement : Cols) {
                        col_num++;
                        if (tdElement.getText().trim().contentEquals(strLabelName))
                            matchIndex = col_num + 1;
                        else if (matchIndex == col_num) {
                            if (tdElement.getText().contains(strValue)) {
                                matchIndex = 0;
                                Log.info("Expected value :" + strLabelName + " - " + strValue + "- Value exist " + tdElement.getText().trim());
                                flag = true;
                                return flag;
                            } else {
                                Log.error("Expected value :" + strLabelName + " - " + strValue + "- Value exist " + tdElement.getText().trim());
                                flag = false;
                                return flag;
                            }
                        }
                    }
                }
            }
        }
        if (flag == false)
            Log.error("Value does not exist: " + strLabelName + " : " + strValue);
        return flag;
    }

    public WebElement waitForElement(WebElement elementToWaitFor, Integer waitTimeInSeconds) {
        WebElement ele;
        if (waitTimeInSeconds == null) {
            waitTimeInSeconds = OBJWAITTIMEOUT;
        }

        Wait<WebDriver> wait = new FluentWait<WebDriver>(this.driver)
                .withTimeout(waitTimeInSeconds, TimeUnit.SECONDS)
                .pollingEvery(500l, TimeUnit.MILLISECONDS)
                .ignoring(NoSuchElementException.class)
                .ignoring(StaleElementReferenceException.class);

        ele = wait.until(elementToBeClickable((By) elementToWaitFor));

        if (ele.isDisplayed()) {
            ele.getAttribute("value");
            Log.info("Element exist '" + ele.getText());
        } else {
            Log.error("Element does not exist '" + ele.getText());
        }
        return ele;
    }

    public SeleniumUtilities(WebDriver driver) {
        this(driver, SeleniumUtilities.DEFAULT_TIMEOUT_IN_SECONDS);
    }

    public SeleniumUtilities(WebDriver driver, int elementWaitTime) {
        this.driver = driver;
        this.waitTime = elementWaitTime;
    }

    /**
     * Use when element is on the page or will be on the page. Can be used element is not on the page before the ajax call and will be on the page after the ajax call
     *
     * @param elementId
     * @param value
     */
    protected void waitUntilElementGetsValue(final String elementId, final String value) {
        new FluentWait<WebDriver>(driver).withTimeout(DEFAULT_TIMEOUT_IN_SECONDS, TimeUnit.SECONDS).pollingEvery(DEFAULT_SLEEP_TIME_IN_SECONDS, TimeUnit.SECONDS).ignoring(NoSuchElementException.class).until(new ExpectedCondition<Boolean>() {
                                                                                                                                                                                                                   public Boolean apply(WebDriver wd) {
                                                                                                                                                                                                                       WebElement element = wd.findElement(By.id(elementId));
                                                                                                                                                                                                                       return element.getText().equals(value);
                                                                                                                                                                                                                   }
                                                                                                                                                                                                               }
        );
    }

    public void waitUntilElementExists(final By by) {
        new FluentWait<WebDriver>(driver).withTimeout(DEFAULT_TIMEOUT_IN_SECONDS, TimeUnit.SECONDS).pollingEvery(DEFAULT_SLEEP_TIME_IN_SECONDS, TimeUnit.SECONDS).ignoring(NoSuchElementException.class).until(new ExpectedCondition<Boolean>() {
                                                                                                                                                                                                                   public Boolean apply(WebDriver wd) {
                                                                                                                                                                                                                       wd.findElement(by);
                                                                                                                                                                                                                       return true;
                                                                                                                                                                                                                   }
                                                                                                                                                                                                               }
        );
    }


    public String buildTextXML(String strValue) {
        return "//div[./text()='" + strValue + "'];xpath";
    }

    public void elementShouldVisible(String locator, String element, int maxTry, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isEnabled()) {
            Log.info("Element visible '" + locator + "=" + element + "'");
        } else {
            for (int i = 0; i < maxTry; i++) {
                WebElement tryAgainele = getWebElementObject(locator, element);
                if (tryAgainele.isEnabled()) {
                    Log.info("Element visible '" + locator + "=" + element + "'");
                    break;
                } else if (maxTry > i) {
                    Exception error = new Exception(element);
                    Log.error("Current page does not contain element '" + locator + "=" + element + "'");
                    String Str = new String(error.getMessage());
                    Log.error("Error Message :" + Str.substring(1, 240));
                    throw error;
                }
            }
            Exception error = new Exception();
            Log.error("Current page does not contain element '" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }


    }

    public boolean elementShouldContain(String locator, String element, String strIntputData) throws Exception {
        String strExtractedElementData = getElementText(locator, element, 1);
        if (strExtractedElementData.contains(strIntputData)) {
            Log.info("Verifying element'" + locator + "=" + element + "' contains text '" + strIntputData + "'");
            return true;
        } else {
            Log.error("Verifying element'" + locator + "=" + element + "' does not contains text '" + strIntputData + "'");
            return false;
        }
    }

    public boolean elementShouldNotContain(String locator, String element, String strIntputData) throws Exception {
        String strExtractedElementData = getElementText(locator, element, 1);
        if (!strExtractedElementData.contains(strIntputData)) {
            Log.info("Verifying element'" + locator + "=" + element + "' contains text '" + strIntputData + "'");
            return true;
        } else {
            Log.error("Verifying element'" + locator + "=" + element + "' does not contains text '" + strIntputData + "'");
            return false;
        }
    }

    public void verifyText(String strExtractedData, String strIntputData) throws Exception {
        if (strExtractedData.contains(strIntputData))
            Log.info("Verified data '" + strIntputData + "'");
        else
            Log.error("Verified data does not exist :" + strIntputData);
    }

    /**
     * Adds specified number of days to the today's date
     *
     * @param Days Number of days to be added to the current date
     * @return newdate New date returned after adding specified number of days to current date
     */
    public String addDaystoCurrentDate(int Days) {
        SimpleDateFormat dateformat = new SimpleDateFormat("MM/dd/yyyy");
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DATE, Days);    //Adding 1 day to current date
        String newdate = dateformat.format(cal.getTime());
        Log.info("New date '" + newdate + "'");
        System.out.println(newdate);
        return (newdate);
    }


    /**
     * Adds specified duration to the start date and skip week ends
     *
     * @param Days Number of days to be added to the current date
     * @return newdate New date returned after adding specified number of days to current date
     */
    public String addDaystoCurrentDateSkipWeekEndsCount(int Days) {
        SimpleDateFormat dateformat = new SimpleDateFormat("MM/dd/yyyy");
        Calendar cal = Calendar.getInstance();
        int daysCount = 1;
        do {
            cal.add(Calendar.DATE, 1);
            if (cal.get(Calendar.DAY_OF_WEEK) == Calendar.SUNDAY
                    || cal.get(Calendar.DAY_OF_WEEK) == Calendar.SATURDAY) {
            } else {
                daysCount++;
            }
            if (daysCount == 30 && cal.get(Calendar.DAY_OF_WEEK) == Calendar.SUNDAY) {
                cal.add(Calendar.DATE, 2);
            }

            if (daysCount == 30 && cal.get(Calendar.DAY_OF_WEEK) == Calendar.SATURDAY) {
                cal.add(Calendar.DATE, 1);
            }

        } while (daysCount < Days);

        String newdate = dateformat.format(cal.getTime());
        Log.info("New date '" + newdate + "'");
        System.out.println(newdate);
        return (newdate);
    }

    public String dateFormat(String strDateFormat, String strDate) throws ParseException {
        SimpleDateFormat DEFAULTDATE_FORMAT = new SimpleDateFormat("MM/dd/yyyy");
        Date mDefaultDate = DEFAULTDATE_FORMAT.parse(strDate);
        SimpleDateFormat DATE_FORMAT = new SimpleDateFormat(strDateFormat);
        String newDate = DATE_FORMAT.format(mDefaultDate);
        System.out.println("Today in dd-MM-yyyy format : " + strDateFormat);
        return newDate;
    }

    public String getDateFormat(String strDate) throws ParseException {
        String newdate, strDateFormat = getCucumberContext().SESSION_DATE_FORMAT;
        ;
        switch (strDateFormat) {
            case "dd/MM/yyyy":
                newdate = dateFormat(strDateFormat, strDate);
                break;
            case "dd-MM-yyyy":
                newdate = dateFormat(strDateFormat, strDate);
                break;
            case "dd.MM.yyyy":
                newdate = dateFormat(strDateFormat, strDate);
                break;
            case "dd.MM.yyyy.":
                newdate = dateFormat(strDateFormat, strDate);
                break;
            case "MM/dd/yyyy":
                newdate = dateFormat(strDateFormat, strDate);
                break;
            case "MM-dd-yyyy":
                newdate = dateFormat(strDateFormat, strDate);
                break;
            case "MM.dd.yyyy":
                newdate = dateFormat(strDateFormat, strDate);
                break;
            case "MM.dd.yyyy.":
                newdate = dateFormat(strDateFormat, strDate);
                break;
            case "yyyy-MM-dd":
                newdate = dateFormat(strDateFormat, strDate);
                break;
            case "yyyy.MM.dd":
                newdate = dateFormat(strDateFormat, strDate);
                break;
            case "yyyy.MM.dd.":
                newdate = dateFormat(strDateFormat, strDate);
                break;

            case "yyyy/MM/dd":
                newdate = dateFormat(strDateFormat, strDate);
                break;
            case "yyyy.dd.MM":
                newdate = dateFormat(strDateFormat, strDate);
                break;
            case "yyyy. MM. dd":
                newdate = dateFormat(strDateFormat, strDate);
                break;
            case "MMMM d, yyyy":
                newdate = dateFormat(strDateFormat, strDate);
                break;
            case "MMMM, yyyy":
                newdate = dateFormat(strDateFormat, strDate);
                break;
            default:
                newdate = dateFormat("MM/dd/yyyy", strDate);
                break;
        }
        return (newdate);
    }

    /**
     * Clear the editable UI element
     *
     * @param propertyNameAndValue UI Property name and value delimited by ";"
     * @param timeout              customizable wait time for object to load
     * @throws Exception
     */
    public String getElementText(String locator, String element, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);

        if (ele.isDisplayed()) {
            Log.info("Element text '" + ele.getText() + "' ''" + locator + "=" + element + "'");
            return ele.getText();
        } else {
            Log.error("Element text does not exist '" + ele.getText() + "' ''" + locator + "=" + element + "'");
            return "";
        }
    }

    /**
     * Clear the editable UI element
     *
     * @param propertyNameAndValue UI Property name and value delimited by ";"
     * @param timeout              customizable wait time for object to load
     * @throws Exception
     */
    public void clear(String locator, String element, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            ele.clear();
            Log.info("Cleared text ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element  ''" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }
    }

    public void clear(WebElement ele, int timeout) throws Exception {
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            ele.clear();
            Log.info("Cleared text ''" + ele);
        } else {
            Exception error = new Exception();
            Log.error("Current page does not contain element  ''" + ele);
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }
    }

    public void Enter(String locator, String element, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            ele = getClickableWebElementObject(locator, element);
            ele.sendKeys(Keys.RETURN);
            Log.info("Clicking element ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element  '" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }


    public void checkbox(String locator, String element, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            if (!ele.isSelected())
                ele.click();
            Log.info("Selected checkbox ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element  '" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    /**
     * Clicks the UI element
     *
     * @param propertyNameAndValue UI Property name and value delimited by ";"
     * @param timeout              customizable wait time for object to load
     * @return none
     */
    public void click(String locator, String element, int timeout) throws Exception {
//		WebElement ele = getWebElementObject(locator, element);
        WebElement ele = getClickableWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        //Wait(timeout);
        if (ele.isDisplayed()) {
//		    ele = getClickableWebElementObject(locator, element);
//            ele.click();
            Actions builder = new Actions(driver);
//            builder.moveToElement(ele).build().perform();
//            getClickableWebElementObject(locator, element).click();
            builder.moveToElement(ele);
            builder.click(getClickableWebElementObject(locator, element));
            builder.build().perform();

            Log.info("Clicking element ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element  '" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    public void click(WebElement ele, int timeout) throws Exception {
        waitForObjectToLoad(ele);
        if (ele.isDisplayed()) {
            Log.info("Clicking element ''" + ele.getText());
            Actions builder = new Actions(driver);
            builder.moveToElement(ele);
            builder.click();
            builder.build().perform();
        } else {
            Exception error = new Exception(ele.getText());
            Log.error("Current page does not contain element  '" + ele.getText());
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    public void mouseOver(String locator, String element, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        if (ele.isDisplayed()) {
            Actions builder = new Actions(driver);
            builder.moveToElement(ele);
            builder.build().perform();
            Log.info("mouse over to element ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element  '" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }
    }

    public static void waitForTextToAppear(WebDriver newDriver, String textToAppear, WebElement element) {
        WebDriverWait wait = new WebDriverWait(newDriver, 30);
        wait.until(textToBePresentInElement(element, textToAppear));
    }

    public void moveToElement(WebElement ele, int timeout) throws Exception {
        Actions builder = new Actions(driver);
        builder.moveToElement(ele);
        builder.build().perform();
        Log.info("move to element ''" + ele.getText());
    }

    public void selectHitEnterKey(String locator, String element, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            ele = getClickableWebElementObject(locator, element);
            Actions action = new Actions(driver);
            try {
                action.moveToElement(ele).click().sendKeys(Keys.ENTER).build().perform();
            } catch (Exception e) {
//                AllContractPagesView.focusWebElement(ele);
                try {
                    ele.click();
                    Log.info("Clicking element after last try of finding element");
                } catch (Exception last) {
                    Log.info("Unable to click element after last try of finding element " + last.getMessage());
                }
            }
            Log.info("Double clicking element ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element  '" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    public void hitEnterKey(String locator, String element, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            ele = getClickableWebElementObject(locator, element);
            Actions action = new Actions(driver);
            action.moveToElement(ele).sendKeys(Keys.ENTER).build().perform();
            Log.info("Hit enter key on element''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element  '" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    public void escape(String locator, String element, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            ele = getClickableWebElementObject(locator, element);
            Actions action = new Actions(driver);
            action.moveToElement(ele).sendKeys(Keys.ESCAPE).build().perform();
            Log.info("escape element ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element  '" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    public void tab(String locator, String element, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            ele = getClickableWebElementObject(locator, element);
            Actions action = new Actions(driver);
            action.moveToElement(ele).sendKeys(Keys.TAB).build().perform();
            Log.info("tab element ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element  '" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    /**
     * Clicks the UI element
     *
     * @param propertyNameAndValue UI Property name and value delimited by ";"
     * @param timeout              customizable wait time for object to load
     * @return none
     */
    public void enter(String locator, String element, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            ele = getClickableWebElementObject(locator, element);
            ele.sendKeys(Keys.ENTER);
            Log.info("Clicking element ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element  '" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    /**
     * types data into the editable UI element
     *
     * @param propertyNameAndValue UI Property name and value delimited by ";"
     * @param value                test data to be populated
     * @param timeout              customizable wait time for object to load
     */
    public void type(String locator, String element, String value, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            ele.sendKeys(value);
            Log.info("Typing text '" + value + "' into text field ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element ''" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    public void type(WebElement ele, String value, int timeout) throws Exception {
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            ele.sendKeys(value);
            Log.info("Typing text '" + value + "' into text field ''" + ele.getText());
        } else {
            Exception error = new Exception(ele.getText());
            Log.error("Current page does not contain element ''" + ele.getText());
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    public void typeHitTab(String locator, String element, String value, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            Actions action = new Actions(driver);
            action.doubleClick(ele).sendKeys(Keys.chord(Keys.CONTROL, "a"), value).perform();
            action.moveToElement(ele).click(ele).sendKeys(Keys.TAB).build().perform();
            Log.info("Typing text '" + value + "' into text field ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element ''" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    public void typeHitEnter(String locator, String element, String value, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            Actions action = new Actions(driver);
            action.moveToElement(ele).click(ele).sendKeys(value).sendKeys(Keys.ENTER).build().perform();
            Log.info("Typing text '" + value + "' into text field ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element ''" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    public static List<WebElement> getDropDownOptions(WebElement webElement) {
        Select select = new Select(webElement);
        return select.getOptions();
    }

    public String getFirstSelectedOption(String locator, String element, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            ele = getWebElementObject(locator, element);
            Select list = new Select(ele);
            Log.info("Selected '" + list.getFirstSelectedOption().getText() + "' from dropdown ''" + locator + "=" + element + "'");
            return list.getFirstSelectedOption().getText();
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element ''" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    public void getDropDownOption(WebElement ele, String value) throws Exception {
        waitForObjectToLoad(ele);
        if (ele.isDisplayed()) {
            Select list = new Select(ele);
            list.selectByVisibleText(value);
            Log.info("Selected '" + value + "' from dropdown");
        } else {
            Exception error = new Exception(value);
            Log.error("Current page does not contain element");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }
    }

    public void selectRepeatedly(String locator, String element, String value) {
        try {
            WebElement ele = getWebElementObject(locator, element);
            ele = getWebElementObject(locator, element);
            Select list = new Select(ele);
            int count = 0;
//            AllContractPagesView.focusWebElement(ele);
            while (!list.getFirstSelectedOption().getText().trim().equals(value.trim()) && count < 10) {
                list.selectByVisibleText(value);
//                AllContractPagesView.focusWebElement(ele);
                count++;
                if (count == 10) {
                    break;
                }
            }
        } catch (Exception e) {
        }
    }

    /**
     * Selects the specified Web Radio button
     *
     * @param propertyNameAndValue UI Property name and value delimited by ";"
     * @param value                test data to be populated
     * @timeout customizable wait time for object to load
     */
    public void select(String locator, String element, String value, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            ele = getWebElementObject(locator, element);
            Select list = new Select(ele);
            list.selectByVisibleText(value);
            selectRepeatedly(locator, element, value);
            Log.info("Selected '" + value + "' from dropdown ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element ''" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    public void select(WebElement ele, String value, int timeout) throws Exception {
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            Select list = new Select(ele);
            list.selectByVisibleText(value);
            Log.info("Selected '" + value + "' from dropdown ''" + ele.getText());
        } else {
            Exception error = new Exception(ele.getText());
            Log.error("Current page does not contain element ''" + ele.getText());
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    /**
     * Selects the drop down box by value
     *
     * @param propertyNameAndValue UI Property name and value delimited by ";"
     * @param value                test data to be populated
     * @timeout customizable wait time for object to load
     */
    public void selectByValue(String locator, String element, String value, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            Select list = new Select(ele);
            list.selectByValue(value);
            Log.info("Selected '" + value + "' from dropdown ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element ''" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    /**
     * Types the date in date web control
     *
     * @param propertyNameAndValue UI Property name and value delimited by ";"
     * @param value                date value to be populated
     * @param timeout              customizable wait time for object to load
     */
    public void dateType(String locator, String element, String value, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            ele.clear();
            if (value.contains("/")) {
                ele.sendKeys(value);
            } else {
                String curDate = currentDate(Integer.parseInt(value));
                ele.sendKeys(curDate);
            }
            driver.findElement(By.className("ui-datepicker-close")).click();  // Click on the Close line in datepicker window.
            Wait(1);
            Log.info("Clicking element ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element  ''" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    public void clickOnCellValue(String locator, String element, String cellValue) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        if (ele.isDisplayed()) {
            List<WebElement> tblRow = ele.findElements(By.tagName("tr"));
            for (int i = 0; i <= tblRow.size(); i++) {
                System.out.println(tblRow.get(i).toString());
                Log.info("Clicking element ''" + locator + "=" + element + "'");
            }

        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element  ''" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }
    }

    /**
     * Determines the type of the UI web element based on the UI obeject description
     *
     * @param propValue UI object name description
     * @param propName  type of the property descrtiption like "id","name", "xpath", tagname" etc
     * @return the identified web element
     * @throws Exception
     */
    public WebElement getWebElementObject(String locator, String element) throws Exception {
        By byElement;
        try {
            byElement = getElementBy(locator, element);
            Wait<WebDriver> wait = new FluentWait<WebDriver>(this.driver)
                    .withTimeout(this.waitTime, TimeUnit.SECONDS)
                    .pollingEvery(500l, TimeUnit.MILLISECONDS)
                    .ignoring(NoSuchElementException.class)
                    .ignoring(StaleElementReferenceException.class);

            WebElement webelement = wait.until(presenceOfElementLocated(byElement));
            waitForObjectToLoad(webelement);
            return webelement; // return webelement object
        } catch (Exception ex) {
            String Str = new String(ex.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw ex;
        }
    }

    public List<WebElement> getWebElementObjects(String locatorType, String locator, int counter, int timeOut) throws Exception {
        List<WebElement> eles = null;
        for (int i = 0; i < counter; i++) {
            try {
                BaseView.pushShortTimeout(1);
                eles = BrowserDriver.getCurrentDriver().findElements(getElementBy(locatorType, locator));
                for (WebElement ele : eles) {
                    WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
                    ele = wait.until(visibilityOf(ele));
                    if (ele.isDisplayed()) return eles;
                }
            } catch (StaleElementReferenceException se) {

            } catch (Exception ne) {
                Log.error("Webelements does not exist : " + locatorType + " : " + locator + "counter :" + counter);
            } finally {
                BaseView.popDefaultTimeout();
            }
        }
        return eles;
    }

    public WebElement getClickableWebElementObject(String locator, String element) throws Exception {
        By byElement;
        try {
            byElement = getElementBy(locator, element);
            Wait<WebDriver> wait = new FluentWait<WebDriver>(this.driver)
                    .withTimeout(this.waitTime, TimeUnit.SECONDS)
                    .pollingEvery(500l, TimeUnit.MILLISECONDS)
                    .ignoring(NoSuchElementException.class)
                    .ignoring(StaleElementReferenceException.class);

            WebElement webelement = wait.until(elementToBeClickable(byElement));
            wait.until(visibilityOf(webelement));
            waitForObjectToLoad(webelement);
            return webelement; // return webelement object
        } catch (Exception ex) {
            String Str = new String(ex.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw ex;
        }
    }

    public WebElement getClickableWebElementObject(WebElement byElement) throws Exception {
        try {
            Wait<WebDriver> wait = new FluentWait<WebDriver>(this.driver)
                    .withTimeout(this.waitTime, TimeUnit.SECONDS)
                    .pollingEvery(500l, TimeUnit.MILLISECONDS)
                    .ignoring(NoSuchElementException.class)
                    .ignoring(StaleElementReferenceException.class);

            WebElement webelement = wait.until(elementToBeClickable(byElement));
            wait.until(visibilityOf(webelement));
            waitForObjectToLoad(webelement);
            return webelement; // return webelement object
        } catch (Exception ex) {
            String Str = new String(ex.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw ex;
        }
    }

    public void Wait(int timeout) {
        long t1, t2;
        t1 = System.currentTimeMillis();

        do {
            t2 = System.currentTimeMillis();
        }
        while ((t2 - t1) < (timeout * 1000));

    }

    /**
     * Waits for the UI object to completed load on webpage
     *
     * @param ele UI element for which wait time is required to load
     */
    public void waitForObjectToLoad(WebElement ele) {
        boolean isExist = false;
        int cntr = 0;
        while (!isExist) {
            if (ele.isDisplayed()) {
                isExist = true;
            } else {
                Wait(1);
                cntr++;
                if (cntr >= 240) {  // Maximum wait time is for 120 seconds i.e. 2 minutes
                    //fail
                    isExist = true;
                }
            }
        }
    }

    public static String currentDate(int num) {
        Calendar c1 = Calendar.getInstance();
        c1.add(Calendar.DATE, num);
        return formatter.format(c1.getTime());
    }

    /**
     * checks whether the element is present on webpage
     *
     * @param by String UI object reference
     * @return returns true or false based on whether UI object present on the webpage
     */
    public boolean isElementPresent(String by) {
        try {
            driver.findElement(By.xpath(by));
            Log.info("Element " + by + " exist.");
            return true;
        } catch (NoSuchElementException e) {
            Log.info("Element does not " + by + " exist.");
            return false;
        }
    }

    /**
     * checks whether the element is present on webpage
     *
     * @param by UI object reference
     * @return returns true or false based on whether UI object present on the webpage
     */
    public boolean isElementPresent(By by) {
        try {
            driver.findElement(by);
            return true;
        } catch (NoSuchElementException e) {
            return false;
        }
    }


    /**
     * Handles intestistial page
     */
    public void handle() {
        try {

            String windowHandle = driver.getWindowHandle();
            driver.switchTo().window(windowHandle);

        } catch (Exception e) {
            System.out.println(e);
        }

    }

    public void switchToFrame(int index) {
        try {
            driver.switchTo().frame(index);
        } catch (Exception e) {
            Log.error("Error :" + e.getMessage());
        }
    }

    public void switchTodefaultContent() {
        try {
            driver.switchTo().defaultContent();
        } catch (Exception e) {
            Log.error("Error :" + e.getMessage());
        }
    }

    /**
     * Clicks on the link present on a webtable for a specifed row and column
     *
     * @param ele UI element for which wait time is required to load
     * @throws Exception
     */
    public void randomClick(String locator, String element, int ClickRow, int ClickCol) throws Exception {
        int row_num = 1, col_num, ClickedFlag = 0;
        WebElement TableElement = getWebElementObject(locator, element);
        List<WebElement> Rows = TableElement.findElements(By.xpath("id('" + element + "')/tbody/tr"));
        for (WebElement trElement : Rows) {
            if (row_num > ClickRow) {
                List<WebElement> Cols = trElement.findElements(By.xpath("td"));
                col_num = 1;
                for (WebElement tdElement : Cols) {
                    if (col_num > ClickCol) {
                        if (tdElement.getText() != "")
                            if (tdElement.getText() != "N/A")
                                if (tdElement.getText().length() < 12) {
                                    driver.findElement(By.linkText(tdElement.getText())).click();
                                    ClickedFlag = 1;
                                    break;
                                }
                        System.out.println("row # " + row_num + ", col # " + col_num + "text=" + tdElement.getText());
                    }
                    col_num++;
                }
                if (ClickedFlag == 1)
                    break;
            }
            row_num++;
        }
    }

    public int getTableRowCount(String locator, String element) throws Exception {
        WebElement TableElement = getWebElementObject(locator, element);
        List<WebElement> Rows = TableElement.findElements(By.xpath(element));
        Log.info("Total Rows '" + Rows.size() + "' ''" + locator + "=" + element + "'");
        return Rows.size();
    }

    public String getTableColumnValue(String locator, String element, int intRow, int intCol) throws Exception {
        int row_num = 1, col_num, boolExitFlag = 0;
        String strColText = "";
        WebElement TableElement = getWebElementObject(locator, element);
        List<WebElement> Rows = TableElement.findElements(By.xpath("" + element + "/tbody/tr"));
        for (WebElement trElement : Rows) {
            if (row_num == intRow) {
                List<WebElement> Cols = trElement.findElements(By.xpath("td"));
                col_num = 1;
                for (WebElement tdElement : Cols) {
                    if (col_num == intCol) {
                        strColText = tdElement.getText();
                        Log.info("Extracted element value '" + tdElement.getText() + "' ''" + locator + "=" + element + "'");
                        boolExitFlag = 1;
                        break;
                    }
                }
                if (boolExitFlag == 1)
                    break;
            }
        }
        row_num++;
        return strColText;
    }

    public String getLastIndexTextValue(String locator, String element, int timeout) throws Exception {
        //String[] propertyNameValue= propertyNameAndValue.split(";");
        List<WebElement> eles = driver.findElements(getElementBy(locator, element));
        if (eles.get(eles.size() - 1).isDisplayed()) {
            Log.info("Extracted element value '" + eles.get(eles.size() - 1).getText() + "' ''" + locator + "=" + element + "'");
            return eles.get(eles.size() - 1).getText().trim();
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element  ''" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }
    }

    public boolean verifyTextValue(String locator, String element, String strMsg, int timeout) {
        boolean flag = false;
        try {
            List<WebElement> eles = driver.findElements(getElementBy(locator, element));

            for (int i = 0; i < eles.size(); i++) {
//                AllContractPagesView.focusWebElement(eles.get(i));
                if (eles.get(i).getText().trim().contains(strMsg.trim())) {
                    flag = true;
                    Log.info("Extracted element value '" + eles.get(i).getText() + "' ''" + locator + "=" + element + "'");
                    return flag;
                }
            }
            if (flag == false) {
                Log.error("Current page does not contain element  ''" + locator + "=" + element + "'");
            }
        } catch (Exception ex) {
            return false;
        }
        return flag;
    }

    public Boolean isElementExist(String locator, String element) {
        Boolean flag = false;
        try {
            if (getWebElementObject(locator, element).isDisplayed())
                flag = true;
        } catch (Exception ex) {
            flag = false;
        }
        return flag;
    }

    /**
     * Captures the text value of the web element
     *
     * @param propertyNameAndValue UI Property name and value delimited by ";"
     * @param timeout              customizable wait time for object to load
     * @return ele returns the captured text
     */
    public String getTextValue(String locator, String element, int timeout) throws Exception {
        //String[] propertyNameValue= propertyNameAndValue.split(";");
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            ele = getWebElementObject(locator, element);
            Log.info("Extracted element value '" + ele.getText() + "' ''" + locator + "=" + element + "'");
            return ele.getText().trim();
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element  ''" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    public String getTextValue(WebElement ele, int timeout) throws Exception {
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            Log.info("Extracted element value '" + ele.getText() + "' ''" + ele);
            return ele.getText().trim();
        } else {
            Exception error = new Exception();
            Log.error("Current page does not contain element  ''" + ele);
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    /**
     * Checks whether element is enabled in UI.
     *
     * @param element The UI element  to be validated
     * @return true or false depending on whether UI element is enabled.
     */

    public static boolean assertNull(WebElement element) {
        try {
            // call any method on the element
            element.isEnabled();
            Log.info("Element enabled");
        } catch (Exception ex) {
            Log.error("Current page does not contain element");
            String Str = new String(ex.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            return true;
        }
        return false;
    }

    /**
     * Checks whether element is not enabled in UI.
     *
     * @param element The UI element  to be validated
     * @return true or false depending on whether UI element is enabled.
     */
    public static boolean assertNotNull(WebElement element) {
        try {
            // call any method on the element
            if (element.isEnabled())
                Log.info("Element enabled");
        } catch (Exception ex) {
            Log.error("Current page does not contain element");
            String Str = new String(ex.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            return false;
        }
        return true;
    }

    /*
	 * findWebelement method looks for the presence of the element and clicks on the same.
	 * 
	 * @param xpath  String: xpath is the element
	 */
    public void findWebElement(String xpath) {
        WebElement Elements = null;

        try {
            By ElementLocator = By.xpath(xpath);
            Elements = driver.findElement(ElementLocator);
            Elements.click();
            Log.info("Clicking element");
        } catch (Exception Ex) {
            Log.error("Current page does not contain element");
            String Str = new String(Ex.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            System.out.println("FindWebElement Functiion : " + Ex.getMessage());
        }
    }

    /**
     * Returns the Attribute value for a given Webelement object
     *
     * @param propertyNameAndValue: Webelement object
     * @param attribute:            Attribute name for which the value to be returned
     *                              *@param timeout: default timeout
     * @return Attribute value
     */
    public String getAttributeValue(String locator, String element, String attribute, int timeout) throws Exception {
        //String[] propertyNameValue= propertyNameAndValue.split(";");
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            Log.info("Attribute of the element '" + ele.getAttribute(attribute) + "' ''" + locator + "=" + element + "'");
            return ele.getAttribute(attribute);
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element  ''" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }
    }


    /**
     * This method returns the Selected item value from the dropdown.
     *
     * @param propertyNameAndValue: Listbox Object
     * @param timeout:              default timeout
     * @return String : Item value selected in the dropdown
     */
    public String getSelectedValue(String locator, String element, int timeout) throws Exception {
        //String[] propertyNameValue= propertyNameAndValue.split(";");
        WebElement ele = getWebElementObject(locator, element);
        Wait(timeout);
        if (ele.isDisplayed()) {
            Select list = new Select(ele);
            WebElement val = list.getFirstSelectedOption();
            Log.info("Selected '" + val.getText() + "' ''" + locator + "=" + element + "'");
            return val.getText();
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element ''" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    public String getTableText(String locator, String element) throws Exception {
        WebElement TableElement = getWebElementObject(locator, element);
        Log.info("Table Value '" + TableElement.getText() + "' ''" + locator + "=" + element + "'");
        return TableElement.getText();
    }

    public List<WebElement> getTableValues(String locator, String element, int ClickRow, int ClickCol) throws Exception {
        WebElement TableElement = getWebElementObject(locator, element);
        List<WebElement> Rows = TableElement.findElements(By.xpath(element + "/tbody/tr"));
        Log.info("Selected '" + TableElement.getText() + "' ''" + locator + "=" + element + "'");
        return Rows;
    }

    public int getXpathCount(String xpathValue) throws Exception {
        return driver.findElements(By.xpath(xpathValue)).size();
    }

    public WebDriver getWebDriver() {
        return driver;
    }

//	 public void getChildWindow(boolean flag) throws Throwable{
//		 try{
//			 if(flag){
//				 parentBrowser = driver.getWindowHandle();
//			      Iterator<String> i = driver.getWindowHandles().iterator();
//			      while(i.hasNext()) {
//			        String childBrowser = i.next();
//			        driver.switchTo().window(childBrowser);
//			      }
//			 }else{
//				 driver.close();
//				 driver.switchTo().window(parentBrowser);
//			 }
//		 } catch (Exception e) {
//		}
//	 }

    public void getChildWindow(boolean flag) throws Throwable {
        try {
            parentBrowser = driver.getWindowHandle();
            if (flag) {
                Iterator<String> i = driver.getWindowHandles().iterator();
                while (i.hasNext()) {
                    String childBrowser = i.next();
                    driver.switchTo().window(childBrowser);
                }
            }
            driver.close();
            driver.switchTo().window(parentBrowser);
        } catch (Exception e) {
        }
    }

    public void waitForPopUp(long count) throws Throwable {
        int time = 0;
        boolean flag = false;
        try {
            while (time < count) {
                time++;
                Thread.sleep(1000);
                Set<String> i = driver.getWindowHandles();
                if (i.toArray().length > 1) {
                    flag = true;
                    break;
                }
            }
            if (time == count) {
                throw new Exception("Pop up not found");
            }
        } catch (Exception e) {
        }
    }

    public boolean handelPopWindow(long count) {
        int time = 0;
        boolean flag = false;
        try {
            while (time < count) {
                time++;
                Thread.sleep(1000);
                Set<String> i = driver.getWindowHandles();
                if (i.toArray().length > 1) {
                    flag = true;
                    return flag;
                    //break;
                }
            }
            if (time == count) {
                throw new Exception("Pop up not found");
            }
        } catch (Exception e) {
        }
        return flag;
    }

    public void verifyLabelAndValuePair(String strType, String strValue) throws Exception {
        Assert.assertTrue("Expected type " + strType + " and pair " + strValue + " NOT found", getWebElementObject("xpath", "//td[contains(text(),'" + strType + "')]//following-sibling::td").getText().trim().replace(",", "").replace(".", "").contains(strValue.replace(",", "").replace(".", "")));
        Log.info("Expected type " + strType + " and pair " + strValue + " exist");
    }


    public void focusAndClick(String locator, String element, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            ele = getClickableWebElementObject(locator, element);
//            ele.sendKeys("");
//            ele.click();
            Actions builder = new Actions(driver);
            builder.moveToElement(ele);
            builder.sendKeys("");
            builder.click();
            builder.build().perform();

            Log.info("Clicking element ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element  '" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    public void moveToElement(String locator, String element, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            ele = getClickableWebElementObject(locator, element);
            Actions builder = new Actions(driver);
            builder.moveToElement(ele);
//            builder.sendKeys("");
            builder.build().perform();
            ele.sendKeys("");
            Log.info("Clicking element ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element  '" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }

    }

    public By getElementBy(String locator, String element) throws Exception {
        By byElement;
        try {
            switch (Locators.valueOf(locator.toLowerCase())) { // determine which locator item we are interested in
                case xpath: {
                    byElement = By.xpath(element);
                    break;
                }
                case id: {
                    byElement = By.id(element);
                    break;
                }
                case name: {
                    byElement = By.name(element);
                    break;
                }
                case classname: {
                    byElement = By.className(element);
                    break;
                }
                case linktext: {
                    byElement = By.linkText(element);
                    break;
                }
                case paritallinktext: {
                    byElement = By.partialLinkText(element);
                    break;
                }
                case tagname: {
                    byElement = By.tagName(element);
                    break;
                }
                case cssselector: {
                    byElement = By.cssSelector(element);
                    break;
                }
                default: {
                    throw new InvalidSelectorException(locator
                            + " is not a valid Selector.");
                }
            }
            return byElement;
        } catch (Exception ex) {
            String Str = new String(ex.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw ex;
        }
    }

    public void clickElement(String locator, String element, int count) throws Exception {
        int localCount = 0;
        while (!(localCount == count)) {

            try {
                //This element focus will work only for link, input etc. Therefore surrounded with try catch
                try {
                    getWebElementObject(locator, element).sendKeys("");
                    getClickableWebElementObject(locator, element).sendKeys("");

                } catch (Exception e) {
                }
//                getWebElementObject(locator, element).click();
                click(locator, element, waitTime);
                break;
            } catch (StaleElementReferenceException e) {
                localCount++;
            }
        }
    }

    public void handleUnexpectedAlerts() throws Exception {
        try {
//            ForceWaitForItem.delay(10000);
            WebDriverWait wait = new WebDriverWait(driver, 4);
            wait.ignoring(NoAlertPresentException.class)
                    .until(alertIsPresent());
            Alert alert = BrowserDriver.getCurrentDriver().switchTo().alert();
            alert.accept();
        } catch (Exception e) {
        }
    }

    public void handleParticularAlert(String alertMessage) throws Exception {
        try {
            WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), 5);
            wait.until(alertIsPresent());
            Alert alert = BrowserDriver.getCurrentDriver().switchTo().alert();
            if (alertMessage.trim().contains(alert.getText().trim())) {
                alert.accept();
            } else {
                System.out.println("Alert not found");
            }
        } catch (Exception e) {
        }
    }

    public void dismissUnexpectedAlerts() throws Exception {
        try {
//            ForceWaitForItem.delay(5000);
            WebDriverWait wait = new WebDriverWait(driver, 10);
            wait.ignoring(NoAlertPresentException.class)
                    .until(alertIsPresent());

            Alert alert = BrowserDriver.getCurrentDriver().switchTo().alert();
            alert.dismiss();
        } catch (Exception e) {
        }
    }

    public void switchToFrameHavingElement(String locatorType, String locator) {
        int count = 0;
        driver.switchTo().defaultContent();

        //Wait for frame to load
        WebDriverWait wait = new WebDriverWait(driver, OBJWAITTIMEOUT);
        wait.until(frameToBeAvailableAndSwitchToIt(By.cssSelector("iframe")));

        driver.switchTo().defaultContent();
        List<WebElement> elements = this.getWebDriver().findElements(By.cssSelector("iframe"));
        Log.info("Number of frames in this page : " + elements.size());

        for (WebElement e : elements) {
            driver.switchTo().defaultContent();
            System.out.println(e.getAttribute("src"));
            driver.switchTo().frame(e);
            try {
                this.getWebElementObject(locatorType, locator);
                Log.info("Element is found in frame " + (count + 1));
                break;
            } catch (Exception ec) {
                count++;
            }
        }
        if (count == elements.size()) {
            Log.info("Element is not found in any of the frames");
            driver.switchTo().defaultContent();
            //throw new NoSuchElementException("Element is not found in any of the frames");
        }
    }

    public boolean getFrameIndex(String locatorType, String locator) {
        int count = 0;
        boolean flag = false;
        driver.switchTo().defaultContent();

        //Wait for frame to load
        WebDriverWait wait = new WebDriverWait(driver, OBJWAITTIMEOUT);
        wait.until(frameToBeAvailableAndSwitchToIt(By.cssSelector("iframe")));

        driver.switchTo().defaultContent();
        List<WebElement> elements = this.getWebDriver().findElements(By.cssSelector("iframe"));
        Log.info("Number of frames in this page : " + elements.size());

        for (WebElement e : elements) {
            driver.switchTo().defaultContent();
            System.out.println(e.getAttribute("src"));
            driver.switchTo().frame(e);
            try {
//                if(count!=0) {
                BaseView.pushShortTimeout(1);
                this.getWebElementObject(locatorType, locator);
                Log.info("Element is found in frame " + (count + 1));
                flag = true;
                break;
//                }
//                count++;
            } catch (Exception ec) {
                count++;
            } finally {
                BaseView.popDefaultTimeout();
            }
        }
//        if (count == elements.size()) {
//            Log.info("Element is not found in any of the frames");
//            driver.switchTo().defaultContent();
//            //throw new NoSuchElementException("Element is not found in any of the frames");
//        }
        return true;
    }

    public static void selectDropdownOption(By by, String optionName) {

        WebElement optionNames = BrowserDriver.getCurrentDriver().findElement(by);
        Select select = new Select(optionNames);
        select.selectByVisibleText(optionName);

    }
    /*public void waitForPageLoad() {

        try{
            JavascriptExecutor js = (JavascriptExecutor)driver;
            final boolean response = js.executeScript("return document.readyState").equals("complete");
            WebDriverWait wait = new WebDriverWait(driver,30000,5000);
            wait.until(new Predicate<WebDriver>() {
                public boolean apply(WebDriver arg0) {
                    return response;
                }
            });
            Log.info("Page is loaded completely....");
        }catch(Exception e){
            //Ignore
        }
    }*/

//    private void readExcelSheet(String destFile){
//        File excelSheet = null;
//        Workbook workbook = null;
//
//        try {
//            Workbook wb = Workbook.getWorkbook(new File(destFile));
//            System.out.println(wb.getNumberOfSheets());
//            for(int sheetNo=0; sheetNo<wb.getNumberOfSheets();sheetNo++)
//            {
//                Sheet sheet = wb.getSheet(sheetNo);
//                int columns = sheet.getColumns();
//                int rows = sheet.getRows();
//                String data;
//                System.out.println("Sheet Name\t"+wb.getSheet(sheetNo).getName());
//                for(int row = 0;row < rows;row++) {
//                    for(int col = 0;col < columns;col++) {
//                        data = sheet.getCell(col, row).getContents();
//                        System.out.print(data+ " ");
//
//                    }
//                    System.out.println("\n");
//                }
//            }
//        } catch(Exception ioe) {
//            ioe.printStackTrace();
//        }
//    }

    //    publicstaticvoid main(String arg[]){
//        ReadExcel excel = new ReadExcel();
//        excel.readExcelSheet("C://Employee.xls");
//    }
/*
    Waits 10 seconds for non stale element and returns nothing
 */
    public static void waitForNonStaleWebElement(WebElement element) {
        try {
            WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), 10);
            wait.until(not(stalenessOf(element)));
        } catch (Exception e) {
            Log.info("Error: Waited for non stale element for 10 seconds but no use...");
            BaseView.takeScreenshot("waitForNonStaleWebElement.png");
        }
    }

    public boolean verifyHeaderAndValuePairInTableColumn(WebElement ele, String strLabelName, String strValue) throws Exception {
        boolean flag = false;
        List<WebElement> tableRows = ele.findElements(By.xpath("./tbody/tr"));
        for (WebElement trElement : tableRows) {
            List<WebElement> Cols = trElement.findElements(By.tagName("td"));
            for (WebElement tdElement : Cols) {
                // System.out.println(tdElement.getText().trim()+"===="+strLabelName+":"+strValue);
                if (tdElement.getText().trim().contains((strLabelName + "\n" + strValue))) {
                    Log.info(" Expected value " + strLabelName + " : " + strValue + "- Value exist " + tdElement.getText().trim());
                    flag = true;
                    return flag;
                }
            }
        }
        if (flag == false)
            Log.error("Value does not exist: " + strLabelName + " : " + strValue);
        return flag;
    }

    public WebElement getWebElementWithoutStaleness(String locator, String element) throws Exception {
        By byElement;
        WebElement webelement = null;
        int staleElementCount = 0;
        do {
            try {
                byElement = getElementBy(locator, element);
                WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), WEBDRIVER_WAIT_SMALL);
                wait.until(not(stalenessOf(BrowserDriver.getCurrentDriver().findElement(byElement))));
                webelement = BrowserDriver.getCurrentDriver().findElement(byElement);
                break;
            } catch (StaleElementReferenceException se) {
                staleElementCount++;
            } catch (NoSuchElementException ne) {
                BaseView.takeScreenshot("ElementNotFound.png");
                fail("Element not found in the DOM " + ne.getMessage());
            }
        } while (!(staleElementCount > 15));
        return webelement;
    }

    public static boolean waitForNonStaleWebElement(WebElement element, int timeOut) {
        boolean flag = false;
        try {
            WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
            return wait.until(not(stalenessOf(element)));
        } catch (Exception e) {
            Log.info("Error: Waited for non stale element for " + timeOut + " seconds but no use...");
            return flag;
        } finally {
            BaseView.popDefaultTimeout();
        }
    }

    public static boolean waitForNonStaleWebElement(WebElement element, int counter, int timeOut) {
        boolean flag = false;
        for (int i = 0; i < counter; i++) {
            try {
                WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
                boolean ele = wait.until(not(stalenessOf(element)));
                if (ele) return ele;
            } catch (Exception e) {
                Log.info("Error: Waited for non stale element for " + timeOut + " seconds but no use...");
            } finally {
                BaseView.popDefaultTimeout();
            }
        }
        return flag;
    }

    public boolean waitForNonStaleWebElement(String locatorType, String locator, int timeOut) {
        boolean flag = false;
        try {
            BaseView.pushShortTimeout(2);
            WebElement element = getWebElementObject(locatorType, locator);
            WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
            return wait.until(not(stalenessOf(element)));
//            flag = wait.until(ExpectedConditions.not(ExpectedConditions.stalenessOf(element)));
//            flag = true;
        } catch (Exception e) {
            Log.info("Error: Waited for non stale element for \"+timeOut+\" seconds but no use..." + e.getMessage());
        } finally {
            BaseView.popDefaultTimeout();
        }
        return flag;
    }

    public boolean waitForNonStaleWebElement(String locatorType, String locator, int counter, int timeOut) {
        boolean flag = false;
        for (int i = 0; i < counter; i++) {
            try {
                BaseView.pushShortTimeout(2);
                WebElement element = getWebElementObject(locatorType, locator);

                WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
                flag = wait.until(not(stalenessOf(element)));
                if (flag) return flag;
            } catch (Exception e) {
                Log.info("Error: Waited for non stale element for " + timeOut + " seconds but no use...");
            } finally {
                BaseView.popDefaultTimeout();
            }
        }
        return flag;
    }

    public boolean waitForElementContainText(WebElement element, String text) throws Exception {
        boolean textPresent = false;
        try {
            WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), WEBDRIVER_WAIT);
            textPresent = wait.until(textToBePresentInElement(element, text));
        } catch (Exception ne) {
            BaseView.takeScreenshot("TextNotFoundInElement.png");
            fail("Element not found in the DOM " + ne.getMessage());
        }
        return textPresent;
    }

    public boolean waitForElementContainText(String locatorType, String locator, String text) throws Exception {
        boolean textPresent = false;
        try {
            BaseView.pushShortTimeout(1);
            WebElement element = getWebElementObject(locatorType, locator);
            WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), WEBDRIVER_WAIT);
            textPresent = wait.until(textToBePresentInElement(element, text));
        } catch (Exception ne) {
            Log.error("Webelement does not exist : " + locatorType + " : " + locator);
        } finally {
            BaseView.popDefaultTimeout();
        }
        return textPresent;
    }

    public boolean waitForElementVisibilityOf(String locatorType, String locator, int timeOut) {
        try {
            BaseView.pushShortTimeout(1);
            WebElement element = getWebElementObject(locatorType, locator);
            WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
            return wait.until(visibilityOf(element)).isDisplayed();
        } catch (Exception ne) {
            Log.error("Webelement does not exist : " + locatorType + " : " + locator);
            return false;
        } finally {
            BaseView.popDefaultTimeout();
        }
    }

    /*public boolean waitForElementVisibilityOf(String element, int timeOut){
        try {
            BaseView.pushShortTimeout(1);
            WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
            return wait.until(visibilityOf(element)).isDisplayed();
        } catch (Exception ne) {
            Log.error("Webelement does not exist : " + element.getText());
            return false;
        }finally{
            BaseView.popDefaultTimeout();
        }
    }*/

    public boolean waitForElementVisibilityOf(WebElement element, int counter, int timeOut) {
        boolean eleVisibile = false;
        for (int i = 0; i < counter; i++) {
            try {
                BaseView.pushShortTimeout(1);
                WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
                eleVisibile = wait.until(visibilityOf(element)).isDisplayed();
                if (eleVisibile) return eleVisibile;
            } catch (Exception ne) {
                Log.error("Webelement does not exist : " + element.getText());
            } finally {
                BaseView.popDefaultTimeout();
            }
        }
        return eleVisibile;
    }

    public boolean waitForElementVisibilityOf(String locatorType, String locator, int counter, int timeOut) {
        boolean eleVisibile = false;
        for (int i = 0; i < counter; i++) {
            try {
                BaseView.pushShortTimeout(1);
                WebElement element = getWebElementObject(locatorType, locator);
                WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
                eleVisibile = wait.until(visibilityOf(element)).isDisplayed();
                if (eleVisibile) return eleVisibile;
            } catch (Exception ne) {
                Log.error("Webelement does not exist : " + locatorType + " : " + locator + "counter :" + counter);
            } finally {
                BaseView.popDefaultTimeout();
            }
        }
        return eleVisibile;
    }

    public boolean waitForElementIsClickable(String locatorType, String locator, int counter, int timeOut) {
        boolean eleVisibile = false;
        for (int i = 0; i < counter; i++) {
            try {
                BaseView.pushShortTimeout(1);
                WebElement element = getWebElementObject(locatorType, locator);
                WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
                eleVisibile = wait.until(elementToBeClickable(element)).isDisplayed();
                if (eleVisibile) return eleVisibile;
            } catch (Exception ne) {
                Log.error("Webelement does not exist : " + locatorType + " : " + locator + "counter :" + counter);
            } finally {
                BaseView.popDefaultTimeout();
            }
        }
        return eleVisibile;
    }

    public boolean waitForElementIsClickable(WebElement element, int counter, int timeOut) {
        boolean eleVisibile = false;
        for (int i = 0; i < counter; i++) {
            try {
                BaseView.pushShortTimeout(1);
                WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
                eleVisibile = wait.until(elementToBeClickable(element)).isDisplayed();
                if (eleVisibile) return eleVisibile;
            } catch (Exception ne) {
                Log.error("Webelement does not exist : " + element.getText() + "counter :" + counter);
            } finally {
                BaseView.popDefaultTimeout();
            }
        }
        return eleVisibile;
    }

    public WebElement getElement(String locatorType, String locator, int timeOut) {
        WebElement element = null;
        try {
            BaseView.pushShortTimeout(1);
            element = getWebElementObject(locatorType, locator);
            WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
            element = wait.until(visibilityOf(element));
        } catch (Exception ne) {
            Log.error("Webelement does not exist : " + locatorType + " : " + locator);
        } finally {
            BaseView.popDefaultTimeout();
        }
        return element;
    }

    public WebElement getElement(String locatorType, String locator, int counter, int timeOut) {
        WebElement element = null;
        for (int i = 0; i < counter; i++) {
            try {
                BaseView.pushShortTimeout(1);
                element = getClickableWebElementObject(locatorType, locator);//BrowserDriver.getCurrentDriver().findElement(getElementBy(locatorType, locator));
                WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
                element = wait.until(visibilityOf(element));
                if (element.isDisplayed()) return element;
//                wait.until(ExpectedConditions.not(ExpectedConditions.stalenessOf(element)));
            } catch (StaleElementReferenceException se) {

            } catch (Exception ne) {
                Log.error("Webelement does not exist : " + locatorType + " : " + locator + "counter :" + counter);
            } finally {
                BaseView.popDefaultTimeout();
            }
        }
        return element;
    }

    public boolean waitForElementNotPresent(String locatorType, String locator) throws Throwable {
        try {
            WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), WEBDRIVER_WAIT);
            wait.until(invisibilityOfElementLocated(getElementBy(locatorType, locator)));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean waitForElementNotPresent(String locatorType, String locator, int timeOut) throws Throwable {
        try {
            WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
            wait.until(invisibilityOfElementLocated(getElementBy(locatorType, locator)));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean waitForElementPresent(String locatorType, String locator) throws Throwable {
        try {
            WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), WEBDRIVER_WAIT);
            wait.until(visibilityOfElementLocated(getElementBy(locatorType, locator)));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean waitUntilElementContainsText(String locatorType, String locator, String text, int timeOut) throws Exception {
        boolean textPresent = false;
        try {
            WebDriverWait wait = new WebDriverWait(driver, timeOut);
            textPresent = wait.until(textToBePresentInElement(getElement(locatorType, locator, timeOut), text));
            if (textPresent) return textPresent;
        } catch (Exception ne) {
            BaseView.takeScreenshot("TextNotFoundInElement.png");
            Log.info("Error :" + ne.getMessage());
            return textPresent;
        } finally {
            BaseView.popDefaultTimeout();
        }
        return textPresent;
    }

    public boolean waitUntilElementContainsText(String locatorType, String locator, String text, int counter, int timeOut) throws Exception {
        boolean textPresent = false;
        for (int i = 0; i < counter; i++) {
            try {
                WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
                textPresent = wait.until(textToBePresentInElement(getElement(locatorType, locator, timeOut), text));
                if (textPresent) return textPresent;
            } catch (Exception ne) {
                BaseView.takeScreenshot("TextNotFoundInElement.png");
                Log.info("Error :" + ne.getMessage());
            } finally {
                BaseView.popDefaultTimeout();
            }
        }
        return textPresent;
    }

    public boolean waitUntilElementNotContainsText(String locatorType, String locator, String text, int counter, int timeOut) throws Exception {
        boolean textPresent = false;
        for (int i = 0; i < counter; i++) {
            try {
                WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
                textPresent = wait.until(not(textToBePresentInElement(getElement(locatorType, locator, timeOut), text)));
                if (textPresent) return textPresent;
            } catch (Exception ne) {
                BaseView.takeScreenshot("TextNotFoundInElement.png");
                Log.info("Error :" + ne.getMessage());
            } finally {
                BaseView.popDefaultTimeout();
            }
        }
        return textPresent;
    }

    public boolean waitUntilElementNotContainsText(WebElement ele, String text, int counter, int timeOut) throws Exception {
        boolean textPresent = false;
        for (int i = 0; i < counter; i++) {
            try {
                WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
                textPresent = wait.until(not(textToBePresentInElement(ele, text)));
                if (textPresent) return textPresent;
            } catch (Exception ne) {
                BaseView.takeScreenshot("TextNotFoundInElement.png");
                Log.info("Error :" + ne.getMessage());
            } finally {
                BaseView.popDefaultTimeout();
            }
        }
        return textPresent;
    }

    public static void failed(String errorMessage) {
        org.junit.Assert.fail(errorMessage);
    }

    public boolean waitUntilElementDisappers(String locatorType, String locator, int counter, int timeOut) throws Exception {
        boolean boolEleExist = false;
        for (int i = 0; i < counter; i++) {
            try {
                WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
                boolEleExist = wait.until(not(visibilityOf(getElement(locatorType, locator, timeOut))));
                if (boolEleExist) return boolEleExist;
            } catch (Exception ne) {
                BaseView.takeScreenshot("waitUntilElementDisappers");
                Log.info("Error :" + ne.getMessage());
            } finally {
                BaseView.popDefaultTimeout();
            }
        }
        return boolEleExist;
    }

    public boolean waitUntilElementDisappers(WebElement ele, int counter, int timeOut) throws Exception {
        boolean boolEleExist = false;
        for (int i = 0; i < counter; i++) {
            try {
                WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), timeOut);
                boolEleExist = wait.until(not(visibilityOf(ele)));
                if (boolEleExist) return boolEleExist;
            } catch (Exception ne) {
                BaseView.takeScreenshot("waitUntilElementDisappers");
                Log.info("Error :" + ne.getMessage());
            } finally {
                BaseView.popDefaultTimeout();
            }
        }
        return boolEleExist;
    }

    public boolean textContains(String strSearchText) {
        boolean flag = false;
        try {
            WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), 30);
            return wait.until(textToBePresentInElement(By.tagName("*"), strSearchText));
        } catch (Exception ex) {
            Log.error("Text doesnot contains :" + strSearchText + ex.getMessage());
        }
        Log.info("Verified : " + strSearchText);
        return flag;
    }

    public static void switchToFrame(String strFrameLoctor) throws Throwable {
        WebElement allPagesFrame = null;
        Log.info("Switching to default frame....");
        BrowserDriver.getCurrentDriver().switchTo().defaultContent();
        boolean isFrameVisible = false;
        Log.info("Started finding visible frame....");
        for (WebElement frame : BrowserDriver.getCurrentDriver().findElements(By.cssSelector(strFrameLoctor))) {
            //System.out.println(frame.getAttribute("src"));
            if (frame.isDisplayed()) {
                allPagesFrame = frame;
                isFrameVisible = true;
                Log.info("Visible frame found, exiting loop");
                break;
            }
        }
        if (!isFrameVisible) {
            TestCase.fail("No frames are visible hence not switching to frame");
        }
        //Waits till the "Loading.." text disappears
        BrowserDriver.getCurrentDriver().switchTo().frame(allPagesFrame);
        Log.info("Switched to Third level Tab continuing....");
    }

    public void selectByVisibleText(String locator, String element, String value, int timeout) throws Exception {
        WebElement ele = getWebElementObject(locator, element);
        waitForObjectToLoad(ele);
        Wait(timeout);
        if (ele.isDisplayed()) {
            Select list = new Select(ele);
            list.selectByVisibleText(value);
            Log.info("Selected '" + value + "' from dropdown ''" + locator + "=" + element + "'");
        } else {
            Exception error = new Exception(element);
            Log.error("Current page does not contain element ''" + locator + "=" + element + "'");
            String Str = new String(error.getMessage());
            Log.error("Error Message :" + Str.substring(1, 240));
            throw error;
        }
    }
}




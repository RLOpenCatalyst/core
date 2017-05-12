package com.rl.qa.utils;

import com.google.common.collect.Iterables;
import com.rl.qa.FileUtilities;
import com.rl.qa.browsers.BrowserDriver;
import cucumber.api.java.After;
import cucumber.api.java.Before;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.Select;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;

import static junit.framework.Assert.fail;

public class BaseView {

    private static final Logger logger = Logger.getLogger(BaseView.class.getName());
    private final static int DEFAULT_TIMEOUT = 40;
    public static String mainWindowHandle;
    public static String genericSecondWindowHandle;


    public static void pushShortTimeout() {
        BrowserDriver.getCurrentDriver().manage().timeouts().implicitlyWait(5, TimeUnit.SECONDS);
    }

    public static void pushShortTimeout(int intSeconds) {
        BrowserDriver.getCurrentDriver().manage().timeouts().implicitlyWait(intSeconds, TimeUnit.SECONDS);
    }

    public static void pushMillSecTimeout(int millSec) {
        BrowserDriver.getCurrentDriver().manage().timeouts().implicitlyWait(millSec, TimeUnit.MILLISECONDS);
    }

    public static void pushVeryShortTimeout() {
        BrowserDriver.getCurrentDriver().manage().timeouts().implicitlyWait(2, TimeUnit.SECONDS);
    }

    public static void popDefaultTimeout() {
        BrowserDriver.getCurrentDriver().manage().timeouts().implicitlyWait(DEFAULT_TIMEOUT, TimeUnit.SECONDS);
    }

    /**
     * Returns true if the specified WebElement is visible, does not wait for
     * the element.
     */
    public static boolean isElementPresentNoWait(WebElement we) {
        try {
            pushShortTimeout();

            return we.isDisplayed();
        } catch (NoSuchElementException e) {
            return false;
        } catch (NullPointerException e) {
            return false;
        } finally {
            popDefaultTimeout();
        }
    }

// Waits for the max time mentioned or till the element is visible and then moves to the next step - rupi
    public static WebElement waitForElement(By by) throws InterruptedException {
        WebElement visible = null;
        long maxTime = 15 * 100; // time in milliseconds
        long waitTime = 350;
        long elapsedTime = 0;
        do {
            try {
                Thread.sleep(waitTime);
                elapsedTime += waitTime;
                visible = BrowserDriver.getCurrentDriver().findElement(by);
                if (!visible.isDisplayed()) {
                    visible = null;
                } else {
                    System.out.println("element visible" + by);
                }
            } catch (NoSuchElementException e) {
                System.out.println("waiting for element to be visible"+ by);
            }
        } while (visible == null && elapsedTime < maxTime);
        return visible;
    }

// Selects the dropdown by the label text
    public static void selectFromList(By by, String visibleText) {
        Select selectNew = new Select(BrowserDriver.getCurrentDriver().findElement(by));
        selectNew.selectByVisibleText(visibleText);
    }

    // returns the selected value in the drop down
    protected String getSelectedTextInDropDown(By by) {
        Select sel = new Select(BrowserDriver.getCurrentDriver().findElement(by));
        return sel.getFirstSelectedOption().getText();
    }

    public static void clickLink(String linkText) {
        try {
            waitForElement(By.linkText(linkText));
        } catch (InterruptedException e) {
            System.out.println("Could not find link text");
        }
        BrowserDriver.getCurrentDriver().findElement(By.linkText(linkText)).click();
    }

    public static void switchToFrame()throws InterruptedException{
        waitForElement(By.tagName("iframe"));
        String iframeID = BrowserDriver.getCurrentDriver().findElement(By.tagName("iframe")).getAttribute("id");
        BrowserDriver.getCurrentDriver().switchTo().frame(iframeID);
    }

    //this method will find the right iframe containing specific CSS element and switch to it
    public static void switchToFrameWithField(String cssSelector)throws InterruptedException{
        waitForElement(By.tagName("iframe"));
        List<WebElement> iframeList = BrowserDriver.getCurrentDriver().findElements(By.tagName("iframe"));
        List<String> idList = new ArrayList<String>();
        //just record the iframes IDs here
        for (WebElement we : iframeList) {
            String iframeID = we.getAttribute("id");
            idList.add(iframeID);
        }
        //have to do it in separate loop as selenium is real funny about object access
        for (String id : idList) {
            BrowserDriver.getCurrentDriver().switchTo().frame(id);
            List<WebElement> itemList = BrowserDriver.getCurrentDriver().findElements(By.cssSelector(cssSelector));
            if (itemList.size() > 0) {
                break;
            }
            //have to go back to default frame to find next child iframe
            BrowserDriver.getCurrentDriver().switchTo().defaultContent();
        }
    }

    public static void takeScreenshot(String filename) {
        File dir = new File(FileUtilities.getCWD(), "//target//screenshots");
        dir.mkdirs();

        SimpleDateFormat sdf = new SimpleDateFormat("ddMMyyyy_hhmmss");
        Date curDate = new Date();
        String strDate = sdf.format(curDate);
        filename = filename.replace(".png","");
        filename = filename + strDate+".png";

        File file = new File(dir, filename);

        try {
            BrowserDriver.takeScreenshot(file);
            System.out.format("Wrote screen shot to '%s'", file.getAbsolutePath());
        } catch (IOException e) {
            System.out.format("Unable to write screen shot to '%s': %s", file.getAbsolutePath(), e.getMessage());
        }
    }

    public static void switchToFrameByTitle(String title)throws InterruptedException {
        WebElement iframe = BrowserDriver.getCurrentDriver().findElement(By.cssSelector("iframe[title=\""+title+"\"]"));
        BrowserDriver.getCurrentDriver().switchTo().frame( iframe );
    }

    public static void switchToSecondFrame() {

        WebElement secondIframe = null;
        List<WebElement> iframes = BrowserDriver.getCurrentDriver()
                                   .findElements(By.cssSelector("iframe"));
        if(CollectionUtils.isNotEmpty(iframes)) {

            int i = 0;
            for(WebElement iFrame : iframes) {
                if(iFrame.getAttribute("title") != null && i++ == 1) {
                    secondIframe = iFrame;
                    break;
                }
            }

            if(secondIframe == null) {
                fail("Couldn't find second iFrame");
            }

            BrowserDriver.getCurrentDriver().switchTo().frame( secondIframe );

        } else {
            fail("There are no iFrames found");
        }

    }

    /**
     * Get's second window handle.
     * Helpful when dealing with multiple windows
     *
     * @return
     * @see BaseView#getCurrentWindowHandle()
     */
    public static void switchToSecondWindow() {
      /*  try {
            Thread.sleep(4000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }*/
//        Set<String> windowHandles = BrowserDriver.getCurrentDriver().getWindowHandles();
//        if(CollectionUtils.isNotEmpty(windowHandles)) {
//            mainWindowHandle = Iterables.get(windowHandles, 0, null);
//            String secondWindowHandle = Iterables.get(windowHandles, 1, null);
//
//            if(StringUtils.isNotEmpty(secondWindowHandle)) {
//                BrowserDriver.getCurrentDriver().switchTo().window(secondWindowHandle);
//                BrowserDriver.getCurrentDriver().switchTo().window(secondWindowHandle).manage().window().setPosition(new Point(0, 0));
//                BrowserDriver.getCurrentDriver().switchTo().window(secondWindowHandle).manage().window().setSize(new Dimension(1500, 800));
//            } else {
//                logger.warning("There is no second browser window found");
//            }
//        }
        for(int i=0;i<20;i++) {
            Set<String> windowHandles = BrowserDriver.getCurrentDriver().getWindowHandles();
            if (CollectionUtils.isNotEmpty(windowHandles)) {
                mainWindowHandle = Iterables.get(windowHandles, 0, null);
                String secondWindowHandle = Iterables.get(windowHandles, 1, null);
                genericSecondWindowHandle = secondWindowHandle;

                if (StringUtils.isNotEmpty(secondWindowHandle)) {
                    BrowserDriver.getCurrentDriver().switchTo().window(secondWindowHandle);
                    BrowserDriver.getCurrentDriver().switchTo().window(secondWindowHandle).manage().window().setPosition(new Point(0, 0));
                    BrowserDriver.getCurrentDriver().switchTo().window(secondWindowHandle).manage().window().setSize(new Dimension(1500, 800));
                    return;
                } else {
                  /*  try {
                        Thread.sleep(100);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }*/
                    logger.warning(i + " : There is no second browser window found");
                }
            }
        }
    }


    public boolean switchToSecondWindow(int counter) {
        boolean flag = false;
        for(int i=0;i<counter;i++) {
            Set<String> windowHandles = BrowserDriver.getCurrentDriver().getWindowHandles();
            if (CollectionUtils.isNotEmpty(windowHandles)) {
                mainWindowHandle = Iterables.get(windowHandles, 0, null);
                String secondWindowHandle = Iterables.get(windowHandles, 1, null);

                if (StringUtils.isNotEmpty(secondWindowHandle)) {
                    BrowserDriver.getCurrentDriver().switchTo().window(secondWindowHandle);
                    BrowserDriver.getCurrentDriver().switchTo().window(secondWindowHandle).manage().window().setPosition(new Point(0, 0));
                    BrowserDriver.getCurrentDriver().switchTo().window(secondWindowHandle).manage().window().setSize(new Dimension(1500, 800));
                    flag = true;
                } else {
                    logger.warning("There is no second browser window found");
                }
            }
        }
        return flag;
    }

    public static void switchToSecondWindowToClose() {
       /* try {
            Thread.sleep(4000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }*/
        Set<String> windowHandles = BrowserDriver.getCurrentDriver().getWindowHandles();
        if(CollectionUtils.isNotEmpty(windowHandles)) {
            mainWindowHandle = Iterables.get(windowHandles, 0, null);
            String secondWindowHandle = Iterables.get(windowHandles, 1, null);

            if(StringUtils.isNotEmpty(secondWindowHandle)) {
                BrowserDriver.getCurrentDriver().switchTo().window(secondWindowHandle).close();
            } else {
                logger.warning("There is no second browser window found");
            }
        }
    }

    public static void switchToThirdWindowToClose() {
       /* try {
            Thread.sleep(4000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }*/
        Set<String> windowHandles = BrowserDriver.getCurrentDriver().getWindowHandles();
        if(CollectionUtils.isNotEmpty(windowHandles)) {
            mainWindowHandle = Iterables.get(windowHandles, 0, null);
            String thirdWindowHandle = Iterables.get(windowHandles, 2, null);

            if(StringUtils.isNotEmpty(thirdWindowHandle)) {
                BrowserDriver.getCurrentDriver().switchTo().window(thirdWindowHandle).close();
            } else {
                logger.warning("There is no second browser window found");
            }
        }
    }

    /**
     * Get's current window handle.
     * Helpful when dealing with multiple windows
     *
     * @return
     * @see BaseView#switchToSecondWindow()
     */
    public static String getCurrentWindowHandle() {

        return BrowserDriver.getCurrentDriver().getWindowHandle();
    }


    public static void switchToThirdWindow() {
        BrowserDriver.getCurrentDriver().switchTo().window(BaseView.mainWindowHandle);
        for(int i=0;i<20;i++) {
            Set<String> windowHandles = BrowserDriver.getCurrentDriver().getWindowHandles();
            if (CollectionUtils.isNotEmpty(windowHandles)) {
                mainWindowHandle = Iterables.get(windowHandles, 0, null);
                String thirdWindowHandle = Iterables.get(windowHandles, 2, null);

                if (StringUtils.isNotEmpty(thirdWindowHandle)) {
                    BrowserDriver.getCurrentDriver().switchTo().window(thirdWindowHandle);
                    BrowserDriver.getCurrentDriver().switchTo().window(thirdWindowHandle).manage().window().setPosition(new Point(0, 0));
                    BrowserDriver.getCurrentDriver().switchTo().window(thirdWindowHandle).manage().window().setSize(new Dimension(1500, 800));
                    return;
                } else {
                    logger.warning(i + " : There is no third browser window found");
                }
            }
        }
    }


}

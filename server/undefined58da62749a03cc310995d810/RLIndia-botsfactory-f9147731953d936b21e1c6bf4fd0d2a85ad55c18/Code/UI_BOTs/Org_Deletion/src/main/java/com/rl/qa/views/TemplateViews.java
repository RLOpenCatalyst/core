package com.rl.qa.views;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.steps.LoginSteps;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.remote.LocalFileDetector;
import org.openqa.selenium.remote.RemoteWebElement;
import org.openqa.selenium.support.PageFactory;

import java.io.File;
import java.util.logging.Logger;

import static junit.framework.TestCase.*;

/**
 * Created by RLE0372 on 11-08-2016.
 */
public class TemplateViews {
    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());

    public static void clickOnLink(String linkText) {
        try {
            SeleniumUtil.waitForElementIsClickable("linktext", "Gallery Setup", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("linktext", "Gallery Setup", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnProLink");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void selectTempType(String tempType) {
        try {
            SeleniumUtil.selectByVisibleText("id","templatetypename",tempType,SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectTempType");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyTempDetails(String templateName, String tempDetails) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='" + templateName + "']//*[text()='" + tempDetails + "']", 5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//*[text()='" + templateName + "']/following-sibling::td[text()='" + tempDetails + "']", tempDetails, SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info("Verified :" + tempDetails);
//            } else {
//                logger.info("Not found:" + tempDetails);
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyTempDetails");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyDeletedTemp(String tempName) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='" + tempName + "']", 1, SeleniumUtilities.OBJWAITTIMEOUT);
            assertFalse(SeleniumUtil.isElementExist("xpath", ".//*[@id='envtable']//*[text()='" + tempName + "']")); {
                logger.info("Template does not exists :deleted");
//            } else {
//                logger.info("Template does not exists : deleted");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyDeletedTemp");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyChefFactory(String idOfChkBox) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("id", idOfChkBox,5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.isElementExist("id", idOfChkBox)); {
                logger.info("Chef Factory is displayed");
//            } else {
//                logger.info("Chef factory is displayed");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyChefFactory");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyTempName(String tempName) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+tempName+"']",4, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//*[text()='"+tempName+"']",tempName,SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info(tempName + " Created Template is available");
//            } else {
//                logger.info(tempName + " Craeted Template is not available");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyDeletedTemp");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void selectOrgInTemplatePage(String orgName) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("id","orgname",1, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.selectByVisibleText("id","orgname",orgName, SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectOrgInTemplatePage");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void browseAndUploadTemplateFile(String fileName) {
        try {
            WebDriver driver=SeleniumUtil.getWebDriver();
            WebElement element = driver.findElement(By.id("template"));
            LocalFileDetector detector = new LocalFileDetector();
            String path = new String(new File(".").getCanonicalPath() + "/src/test/resources/Upload/"+fileName);
            File f = detector.getLocalFile(path);
            ((RemoteWebElement)element).setFileDetector(detector);
            element.sendKeys(f.getAbsolutePath());
//            element.sendKeys(path);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectOrgInTemplatePage");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

}


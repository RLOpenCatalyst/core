package com.rl.qa.views;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.steps.LoginSteps;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

import static junit.framework.Assert.assertTrue;
import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.fail;

/**
 * Created by RLE0372 on 10-09-2016.
 */
public class ConfigBlueprintForSSTempUsingProAWSViews {
    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());

    public static void verifyBlueprintInWorkZone(String blueprintName, String pageName) {
        try {
            assertTrue(SeleniumUtil.verifyTextValue("xpath", "//*[text()='"+blueprintName+"']",blueprintName,SeleniumUtilities.OBJWAITTIMEOUT));
            logger.info("Verified Blueprint in "+pageName+" "+blueprintName);
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyBlueprintInWorkZone");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void clickOnMoreInfo(String moreInfo, String blueprintName) {
        try {
            SeleniumUtil.click("cssselector","i[title='More Info']",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnMoreInfo");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void clickOnClose() {
        try {
            SeleniumUtil.click("xpath",".//*[@id='instanceLogsPage']//button",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnCloseInstanceLogPopup");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void selectBlueprint(String blueprintName) {
        try {
            SeleniumUtil.click("xpath","//*[text()='"+blueprintName+"']",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectBlueprint");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnCopyBlueprint() {
        try {
            SeleniumUtil.click("cssselector","button[title='Copy Blueprint']",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnCopyBlueprint");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void selectParametersOnPopupWindow(String name, String idOfElement) {
        try {
            SeleniumUtil.selectByVisibleText("id",idOfElement,name,SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectParametersOnPopupWindow");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void clickOnSave(String buttonText) {
        try {
            SeleniumUtil.click("xpath","//*[text()='"+buttonText+"']",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnSaveOnPopup");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnEnv(String proName, String envName) {
        try {
            SeleniumUtil.click("xpath","//div[span[text()='"+proName+"']]//*[text()='"+envName+"']",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnSaveOnPopup");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnDeleteBlueprint(String buttonTitle) {
        try {
            SeleniumUtil.click("cssselector","button[title='Remove Blueprint']",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnDelete");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyBlueprintDeleted(String blueprintName) {
        try {
            assertFalse(SeleniumUtil.isElementExist("xpath", "//*[text()='"+blueprintName+"']"));
            logger.info(blueprintName+" does not exists : deleted");

        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyBlueprintDeleted");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnEditBlueprintButton(String buttonTitle, String blueprintName) {
        try {
            SeleniumUtil.click("xpath","//li[@title='"+blueprintName+"']/following-sibling::button[@title='"+buttonTitle+"']",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyBlueprintDeleted");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnSettings() {
        try {
            SeleniumUtil.waitForElementIsClickable("id","settingsNew",8,SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("id","settingsNew",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnSettings");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void deleteBlueprint(String title) {
        try {
            SeleniumUtil.click("cssselector","span[title='"+title+"']",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("deleteBlueprint");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnDeleteOnConfirmationPopup() {
        try {
            SeleniumUtil.click("cssselector",".btn.cat-btn-delete",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnDeleteOnConfirmationPopup");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }
}

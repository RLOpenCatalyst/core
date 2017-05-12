package com.rl.qa.views;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.steps.LoginSteps;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertTrue;
import static junit.framework.TestCase.fail;

/**
 * Created by RLE0372 on 23-09-2016.
 */
public class ConfigBlueprintForOSImageUsingProAWSViews {
    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());

    public static void verifyChooseOSIsDisabled() {
        try {
            WebElement wb=SeleniumUtil.getElement("id","instanceOS",SeleniumUtilities.OBJWAITTIMEOUT);
            assertFalse(wb.isEnabled());
            logger.info("Choose Operating System is disabled");
        }
        catch(Exception ex){
            BaseView.takeScreenshot("verifyElementIsDisabled");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyChooseProviderIsDisabled() {
        try {
            WebElement wb=SeleniumUtil.getElement("id","providerId",SeleniumUtilities.OBJWAITTIMEOUT);
            assertFalse(wb.isEnabled());
            logger.info("Choose Choose Provider is disabled");
        }
        catch(Exception ex){
            BaseView.takeScreenshot("verifyChooseProviderIsDisabled");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyChooseAvailableImages() {
        try {
            WebElement wb=SeleniumUtil.getElement("id","imageId",SeleniumUtilities.OBJWAITTIMEOUT);
            assertFalse(wb.isEnabled());
            logger.info("Choose Available Images is disabled");
        }
        catch(Exception ex){
            BaseView.takeScreenshot("verifyChooseAvailableImages");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyChooseOrgIsDisabled() {
        try {
            WebElement wb=SeleniumUtil.getElement("id","",SeleniumUtilities.OBJWAITTIMEOUT);
            assertFalse(wb.isEnabled());
            logger.info("Choose Organization is disabled");
        }
        catch(Exception ex){
            BaseView.takeScreenshot("verifyChooseOrgIsDisabled");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyLaunchButtonISDisplayed() {
        try {
            assertTrue(SeleniumUtil.verifyTextValue("id","blueprintLaunch","Launch Blueprint",SeleniumUtilities.OBJWAITTIMEOUT));
        }
        catch(Exception ex){
            BaseView.takeScreenshot("verifyChooseOrgIsDisabled");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

}

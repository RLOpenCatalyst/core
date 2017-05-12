package com.rl.qa.views;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.steps.LoginSteps;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertTrue;
import static junit.framework.TestCase.fail;

/**
 * Created by RLE0372 on 20-07-2016.
 */
public class CreateEditDelProjectViews {
    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    public static void clickOnProLink() {
        try {
            SeleniumUtil.waitForElementIsClickable("linktext","Projects",8,SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("linktext","Projects", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnProLink");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }
    public static void clickOnNewProButton() {
        try {
            SeleniumUtil.waitForElementIsClickable("id","newProj",8,SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("id","newProj", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnNewProButton");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnOrg(String proOrg) {
        try {
            SeleniumUtil.waitForElementIsClickable("xpath",".//*[@id='select2-drop']//div[text()='"+proOrg+"']",8,SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath",".//*[@id='select2-drop']//div[text()='"+proOrg+"']",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnOrg");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clearProNameField() {
        try {
            SeleniumUtil.waitForElementIsClickable("id","projectname",8,SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.clear("id","projectname",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clearProNameField");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void typeNewProj(String newProName) {
        try {
            SeleniumUtil.waitForElementIsClickable("id","projectname",8,SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.type("id","projectname",newProName,SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("typeNewProj");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void delProject(String proName) {
        try {
            SeleniumUtil.waitForElementIsClickable("xpath",".//*[@id='envtable']/tbody/tr/td[text()='"+proName+"']/../td/div/button[@title='Delete']",8,SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath",".//*[@id='envtable']/tbody/tr/td[text()='"+proName+"']/../td/div/button[@title='Delete']",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("typeNewProj");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyCreatedProject(String proName) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+proName+"']",5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue (SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//*[text()='"+proName+"']",proName,SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info("Verified created Project:"+proName);
//            } else {
//                logger.info("Project not found:" +proName);
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyCreatedProject");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyDeletedPro(String proName) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+proName+"']", 1, SeleniumUtilities.OBJWAITTIMEOUT);
            assertFalse (SeleniumUtil.isElementExist("xpath", ".//*[@id='envtable']//*[text()='"+proName+"']")); {
                logger.info("Project does not exists :deleted");
//            } else {
//                logger.info("Project does not exists :"+proName+"deleted");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyDeletedProject");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnEnv() {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@data-swchon-text='YES']",8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath",".//*[@data-swchon-text='YES']",SeleniumUtilities.OBJWAITTIMEOUT);
            logger.info("Clicked on environment");
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyDeletedProject");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyProjectInfo(String projectName, String projectDetails) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//td[text()='"+projectName+"']/../td[text()='"+projectDetails+"']",5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue (SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//td[text()='"+projectName+"']/../td[text()='"+projectDetails+"']",projectDetails,SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info("Verified Project with:"+projectDetails);
//            } else {
//                logger.info("Project not found:" +assignedOrg);
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyProjectInfo");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }
}
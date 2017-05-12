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
 * Created by RLE0372 on 16-08-2016.
 */
public class CreateEditDeleteTeamViews {
    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());

    public static void verifyTeamName(String teamName) {
        try {
            while(true) {
                if (SeleniumUtil.isElementExist("xpath", ".//*[@id='envtable']//*[text()='" + teamName + "']")) {
                    assertTrue(SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//*[text()='" + teamName + "']", teamName, SeleniumUtilities.OBJWAITTIMEOUT));
                    logger.info("Verified created Team:" + teamName);
                    break;
                }
                if(SeleniumUtil.getAttributeValue("id","envtable_next","class",SeleniumUtilities.OBJWAITTIMEOUT).equals("paginate_button next disabled")){
                    assertTrue(SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//*[text()='" + teamName + "']", teamName, SeleniumUtilities.OBJWAITTIMEOUT));
                    break;
                }
                else {
                    SeleniumUtil.click("id", "envtable_next", SeleniumUtilities.OBJWAITTIMEOUT);
                    SeleniumUtil.waitForElementVisibilityOf("id", "newTeam", SeleniumUtilities.OBJWAITTIMEOUT);
                }
            }

        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyTeamName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyTeamDetails(String teamName, String teamDetails) {
        try {
            while(true) {
                if (SeleniumUtil.isElementExist("xpath", ".//*[@id='envtable']//td[text()='" + teamName + "']/../td[text()='" + teamDetails + "']")) {
                    assertTrue(SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//td[text()='" + teamName + "']/../td[text()='" + teamDetails + "']", teamDetails, SeleniumUtilities.OBJWAITTIMEOUT));
                    logger.info("Verified created Team:" + teamName + "with " + teamDetails);
                    break;
                }
                if(SeleniumUtil.getAttributeValue("id","envtable_next","class",SeleniumUtilities.OBJWAITTIMEOUT).equals("paginate_button next disabled")){
                    break;
                }
                else {
                    SeleniumUtil.click("id", "envtable_next", SeleniumUtilities.OBJWAITTIMEOUT);
                    SeleniumUtil.waitForElementVisibilityOf("id", "newTeam", SeleniumUtilities.OBJWAITTIMEOUT);
                }
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyTEamDetails");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void checkTheCheckBox(String value) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath","//input[@value='"+value+"']/following-sibling::i",5, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath","//input[@value='"+value+"']/following-sibling::i",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("checkTheCheckBox");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void searchAndEditTheTeam(String teamName, String edit) {
        try {
            while(true) {
                if (SeleniumUtil.isElementExist("xpath", ".//*[@id='envtable']//*[text()='" + teamName + "']")) {
                    SeleniumUtil.click("xpath",".//*[@id='envtable']//td[text()='"+teamName+"']/following-sibling::td//*[@title='"+edit+"']",SeleniumUtilities.OBJWAITTIMEOUT);
                    logger.info("Verified created Team:" + teamName);
                    break;
                }
                if(SeleniumUtil.getAttributeValue("id","envtable_next","class",SeleniumUtilities.OBJWAITTIMEOUT).equals("paginate_button next disabled")){
                    break;
                }
                else {
                    SeleniumUtil.click("id", "envtable_next", SeleniumUtilities.OBJWAITTIMEOUT);
                    SeleniumUtil.waitForElementVisibilityOf("id", "newTeam", SeleniumUtilities.OBJWAITTIMEOUT);
                }
            }

        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyTeamName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyTeamIsDeleted(String teamName) {
        try {
            SeleniumUtil.click("id","envtable_first",SeleniumUtilities.OBJWAITTIMEOUT);
            while(true) {
                assertFalse(SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//*[text()='"+teamName+"']", teamName, SeleniumUtilities.OBJWAITTIMEOUT));
                if(SeleniumUtil.getAttributeValue("id","envtable_next","class",SeleniumUtilities.OBJWAITTIMEOUT).equals("paginate_button next disabled")){
                    logger.info("Verified Team is deleted : " + teamName);
                    break;
                }
                else {
                    SeleniumUtil.click("id", "envtable_next", SeleniumUtilities.OBJWAITTIMEOUT);
                    SeleniumUtil.waitForElementVisibilityOf("id", "newTeam", SeleniumUtilities.OBJWAITTIMEOUT);
                }
            }

        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyTeamIsDeleted");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }
}

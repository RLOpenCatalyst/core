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
 * Created by RLE0372 on 20-07-2016.
 */
public class CreateEditDelBGroupViews {
    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    public static void clickBGroupLink()throws InterruptedException  {
        try {
            SeleniumUtil.waitForElementIsClickable("linktext", "Business Groups", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("linktext","Business Groups",SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("clickBGroupLink");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }
    public static void clickOnNewBGroup() {
        try {
            SeleniumUtil.waitForElementIsClickable("id","newProd", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("id","newProd",SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("clickOnNewBGroup");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void enterBGroupName(String bGroupName) {
        try {
            SeleniumUtil.waitForElementIsClickable("id","productgroupname", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.type("id","productgroupname",bGroupName,SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("enterBGroupName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void enterOrgName(String org_Name) {
        try {
            SeleniumUtil.waitForElementIsClickable("xpath",".//*[@id='select2-drop']/div/input", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath",".//*[@id='select2-drop']/div/input",SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("enterOrgName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }


    public static void clickOnEditBGroup(String bGroup) {
        try {
            SeleniumUtil.waitForElementIsClickable("xpath",".//*[@id='envtable']/tbody/tr/td[text()='"+bGroup+"']/../td/div/a",8,SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath",".//*[@id='envtable']/tbody/tr/td[text()='"+bGroup+"']/../td/div/a",SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("clickOnEditBGroup");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clearField() {
        try {
            SeleniumUtil.waitForElementIsClickable("id","productgroupname",8,SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.clear("id","productgroupname",SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("clearField");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void enterNewBGrpName(String newBGrpName) {
        try {
            SeleniumUtil.waitForElementIsClickable("id","productgroupname",8,SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.type("id","productgroupname",newBGrpName,SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("enterNewBGrpName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void delEditedBGroup(String editedBGrp) {
        try {
            SeleniumUtil.waitForElementIsClickable("xpath",".//*[@id='envtable']/tbody/tr/td[text()='"+editedBGrp+"']/../td/div/button",8,SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath",".//*[@id='envtable']/tbody/tr/td[text()='"+editedBGrp+"']/../td/div/button",SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("delEditedBGroup");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void clickOnOrgLinkInSettTree() {
        try {
            SeleniumUtil.waitForElementIsClickable("linktext","Organizations",8,SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("linktext","Organizations",SeleniumUtilities.OBJWAITTIMEOUT);

        }
        catch(Exception ex){
            BaseView.takeScreenshot("clickOnOrgLinkInSettTree");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyAssignedOrg(String bGroup,String org) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//td[text()='"+bGroup+"']/../td[text()='"+org+"']",5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue (SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//td[text()='"+bGroup+"']/../td[text()='"+org+"']",org,SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info("Verified assigned organization:"+org);
//            } else {
//                logger.info("Assigned Organization not found:" +org);
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyAssignedOrg");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void verifyCreatedBGroup(String businessGroup) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+businessGroup+"']",5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//*[text()='"+businessGroup+"']",businessGroup,SeleniumUtilities.OBJWAITTIMEOUT));
            logger.info("Verified created Business Group :"+businessGroup);
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyCreatedOrg");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyEditedBGroup(String editedBGroup) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath",".//*[@id='envtable']//*[text()='"+editedBGroup+"']",8, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.waitUntilElementContainsText("xpath",".//*[@id='envtable']//*[text()='"+editedBGroup+"']",editedBGroup,5,SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info("Verified edited Business Group :" +editedBGroup);
//            } else {
//                logger.info("Edited Business Group : "+ editedBGroup+ " does not exist");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyEditedBGroup");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyDeletedBGroup(String bGroup) {
        try {
//            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+bGroup+"']", 1, SeleniumUtilities.OBJWAITTIMEOUT);
            assertFalse(SeleniumUtil.isElementExist("xpath", ".//*[@id='envtable']//*[text()='"+bGroup+"']")); {
                logger.info("Business Group does not  exists : Deleted");
//            } else {
//                logger.info("Business Group does not exists : Business Group deleted");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyDeletedBGroup");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void selectBusinessGroup(String orgName) {
        try {
            SeleniumUtil.click("xpath","//span[text()='Select an Organization']",SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath","//div[text()='"+orgName+"']",SeleniumUtilities.OBJWAITTIMEOUT);
            //SeleniumUtil.selectByVisibleText("id","orgname",orgName,SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectBusinessGroup");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }
}



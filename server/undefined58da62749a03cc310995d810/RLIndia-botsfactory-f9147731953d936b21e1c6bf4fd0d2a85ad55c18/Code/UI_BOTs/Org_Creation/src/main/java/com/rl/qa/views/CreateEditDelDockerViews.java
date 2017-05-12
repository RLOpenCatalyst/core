package com.rl.qa.views;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.steps.LoginSteps;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

import static junit.framework.TestCase.assertTrue;
import static junit.framework.TestCase.fail;

/**
 * Created by RLE0372 on 01-08-2016.
 */
public class CreateEditDelDockerViews {
    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());

    public static void clickOnDevopsSetup(String linkText) {
        try {
            //SeleniumUtil.waitForElementIsClickable("linktext",,8, SeleniumUtilities.OBJWAITTIMEOUT);
            Thread.sleep(2000);
            SeleniumUtil.click("xpath","//a[text()='"+linkText+"']",SeleniumUtilities.OBJWAITTIMEOUT);
            Thread.sleep(2000);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("clickOnDevopsSetup");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }



    public static void clickonChefServer(String linkText) {
        try {
            //SeleniumUtil.waitForElementIsClickable("linktext",,8, SeleniumUtilities.OBJWAITTIMEOUT);
            Thread.sleep(2000);
            SeleniumUtil.click("xpath","//a[text()='"+linkText+"']",SeleniumUtilities.OBJWAITTIMEOUT);
            Thread.sleep(2000);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("clickonChefServer");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }


//    public static void clickOnDockerLink(String linktext) {
//        try {
//            SeleniumUtil.waitForElementIsClickable("linktext",linktext,8, SeleniumUtilities.OBJWAITTIMEOUT);
//            SeleniumUtil.click("linktext",linktext,SeleniumUtilities.OBJWAITTIMEOUT);
//        }
//        catch(Exception ex){
//            BaseView.takeScreenshot("clickOnDockerLink");
//            SeleniumUtil.Log.info("Error :" + ex.getMessage());
//            fail(ex.getMessage());
//        }
//    }

    public static void enterDockerName(String dockerName) {
        try {
            SeleniumUtil.waitForElementIsClickable("id","dockerreponame",8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.type("id","dockerreponame",dockerName,SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("enterDockeName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void enterDockerHubRegistry(String dockerName, String dockerreponame) {
        try {
            SeleniumUtil.waitForElementIsClickable("id",dockerreponame,8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.type("id",dockerreponame,dockerName,SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("enterDockerHubRegistry");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void enterUserID(String userId) {
        try {
            SeleniumUtil.waitForElementIsClickable("id","dockerreponame",8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.type("id","dockerreponame",userId,SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("enterDockerHubRegistry");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void enterDockerHubRegistryName(String docerHubRegName) {
        try {
            SeleniumUtil.waitForElementIsClickable("id","dockerrepopath",8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.type("id","dockerrepopath",docerHubRegName,SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("enterDockerHubRegistryName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyDocker(String dockerName) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+dockerName+"']",5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue (SeleniumUtil.verifyTextValue("xpath",".//*[@id='envtable']//*[text()='"+dockerName+"']",dockerName,SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info(dockerName+"is available");
//            } else {
//                logger.info(dockerName+"is not available");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyDockerDetails");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifySelOrgIsDisabled() {

        try {
            SeleniumUtil.waitForElementVisibilityOf("id","s2id_orgname",5, SeleniumUtilities.OBJWAITTIMEOUT);
//            WebElement wb=SeleniumUtil.getElement("id","s2id_orgname",SeleniumUtilities.OBJWAITTIMEOUT);
            String actClassValOfElement=SeleniumUtil.getAttributeValue("id","s2id_orgname","class",SeleniumUtilities.OBJWAITTIMEOUT);
            String expClassValWhenEleIsDisabled="select2-container select2-container-disabled chooseOrganization width-100";
            assertTrue(actClassValOfElement.equals(expClassValWhenEleIsDisabled));{
                System.out.print(actClassValOfElement);
                logger.info("Select organization type is disabled");
//            } else {
//                logger.info("Select organization type is enabled");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifySelectOrgIsDisabled");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }    }

    public static void verifyDockerInfo(String dockerName, String dockerDetails) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+dockerName+"']/../*[text()='"+dockerDetails+"']",5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue (SeleniumUtil.verifyTextValue("xpath",".//*[@id='envtable']//*[text()='"+dockerName+"']/../*[text()='"+dockerDetails+"']",dockerDetails,SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info(dockerName+" with "+dockerDetails+" is available");
//            } else {
//                logger.info(dockerName+" with "+dockerDetails+" is available");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyDockerDetails");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickTemplateLink(String linkText) {
        try {
            //SeleniumUtil.waitForElementIsClickable("linktext",,8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath","//a[text()='"+linkText+"']",SeleniumUtilities.OBJWAITTIMEOUT);
            Thread.sleep(2000);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("clickonGallerySetup");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickGallerySetuplink(String linkText) {
        try {
            //SeleniumUtil.waitForElementIsClickable("linktext",,8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath","//a[text()='"+linkText+"']",SeleniumUtilities.OBJWAITTIMEOUT);
            Thread.sleep(2000);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("clickonGallerySetup");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void addCookbooksRunlist(String strCookbooks) {
        try {
            //SeleniumUtil.waitForElementIsClickable("linktext",,8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.type("id", "textbox","apache2", 10);
            SeleniumUtil.click("xpath",".//*[@id='cookbooksrecipesList']/option[text()='"+strCookbooks+"']",10);
            SeleniumUtil.click("id","btnaddToRunlist",10);

            Thread.sleep(2000);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("AddCookbooks");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }


}

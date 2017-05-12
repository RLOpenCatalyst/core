package com.rl.qa.views;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.steps.LoginSteps;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

import static junit.framework.Assert.assertTrue;
import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.fail;

/**
 * Created by RLE0372 on 18-07-2016.
 */
public class CreateEditDelOrgViews {
    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());


    public static void clickOnSettings() throws InterruptedException {
        try {
            SeleniumUtil.waitForElementIsClickable("linktext", "SETTINGS", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("linktext", "SETTINGS", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("settingsNew");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void clickOnOrganizations() {
        try {
            SeleniumUtil.waitForElementIsClickable("linktext", "ORGANIZATIONS", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("linktext", "ORGANIZATIONS", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("ORGANIZATIONS");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnNewButton(String newButtonId) {
        try {
            SeleniumUtil.waitForElementIsClickable("id", newButtonId, 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("id", newButtonId, SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("newOrg");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void saveOrg() {
        try {
            SeleniumUtil.click("cssselector", "button[class='btn btn-primary btn-mini']", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("saveOrg");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void editOrg(String Organization) throws InterruptedException {
        try {
            SeleniumUtil.waitForElementIsClickable("xpath", ".//*[@id='envtable']/tbody/tr/td[text()='" + Organization + "']/../td[4]//a[@title='Edit']", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath", ".//*[@id='envtable']/tbody/tr/td[text()='" + Organization + "']/../td[4]//a[@title='Edit']", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("editOrg");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clearTheField(String idOfEditbox) {
        try {
            SeleniumUtil.waitForElementIsClickable("id", idOfEditbox, 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.clear("id", idOfEditbox, SeleniumUtilities.OBJWAITTIMEOUT);
            logger.info("Field cleared :" + idOfEditbox);

        } catch (Exception ex) {
            BaseView.takeScreenshot("clearTheField");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void enterNewOrgName(String New_Organization) {
        try {
            SeleniumUtil.waitForElementIsClickable("id", "orgname", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.clear("id", "orgname", SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.type("id", "orgname", New_Organization, SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("editOrg");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void delOrg(String New_Organization) {
        try {
            SeleniumUtil.waitForElementIsClickable("xpath", ".//*[@id='envtable']/tbody/tr/td[text()='" + New_Organization + "']/../td[4]/div/button", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath", ".//*[@id='envtable']/tbody/tr/td[text()='" + New_Organization + "']/../td[4]/div/button", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("delOrg");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnOK() {
        try {
            SeleniumUtil.waitForElementIsClickable("xpath", "//button[text()='OK']", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath", "//button[text()='OK']", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnOK");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnSettingsFromOrgPage() {
        try {
            SeleniumUtil.waitForElementIsClickable("id", "settingsNew", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("id", "settingsNew", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnOK");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void seeWorkzone(String idOfElement) {
        try {
            SeleniumUtil.waitForElementIsClickable("id", idOfElement, 8, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.verifyTextValue("id", idOfElement, "WORKZONE", SeleniumUtilities.OBJWAITTIMEOUT));
            {
                SeleniumUtil.Log.info("Workzone is displayed");
//            } else {
//                SeleniumUtil.Log.info("Workzone is not displayed");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("seeWorkzone");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void verifyEditedOrg(String editedOrg) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='" + editedOrg + "']", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.waitUntilElementContainsText("xpath", ".//*[@id='envtable']//*[text()='" + editedOrg + "']", editedOrg, 5, SeleniumUtilities.OBJWAITTIMEOUT));
            {
                logger.info("Verified edited Organization :" + editedOrg);
//            } else {
//                logger.info("Edited Organization" + editedOrg + " does not exist");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyEditedOrg");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyLoginPage() {
        try {
            SeleniumUtil.waitForElementVisibilityOf("id", "login-form", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.waitUntilElementContainsText("id", "login-form", "Login", 0, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.verifyTextValue("id", "login-form", "Login", SeleniumUtilities.OBJWAITTIMEOUT));
            {
                logger.info("Verified : LoginPage");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyLoginPage");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyStatusOfOrg(String status, String orgName) {
        try {
            Thread.sleep(2000);
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//td[text()='" + orgName + "']/../td[text()='" + status + "']", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//td[text()='" + orgName + "']/../td[text()='" + status + "']", status, 5));
            logger.info("Verified : staus is Active");
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyStatusOfOrg");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void verifyDeletedOrg(String orgName) {
        try {
//            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+orgName+"']/following-sibling::td[2]",1, SeleniumUtilities.OBJWAITTIMEOUT);
            assertFalse(SeleniumUtil.isElementExist("xpath", ".//*[@id='envtable']//*[text()='" + orgName + "']"));
            logger.info("Organization does not exists :deleted");
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyDeletedOrg");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyCreatedOrg(String organizationName) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='" + organizationName + "']", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//*[text()='" + organizationName + "']", organizationName, SeleniumUtilities.OBJWAITTIMEOUT));
            logger.info("Verified created organization:" + organizationName);
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyCreatedOrg");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyDomainName(String domainName, String orgName) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//td[text()='" + orgName + "']/../td[text()='" + domainName + "']", 5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//td[text()='" + orgName + "']/../td[text()='" + domainName + "']", domainName, SeleniumUtilities.OBJWAITTIMEOUT));
            {
                logger.info("Verified Domain Name:" + domainName);
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyDomainName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnStatusButton() {
        try {
            SeleniumUtil.click("xpath", ".//*[@name='checkbox-toggle']/following-sibling::i", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnStatusButton");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void selectAllInShowDropDown(String expectedValFromDropdown) {
        try {
            SeleniumUtil.selectByVisibleText("id", "filteractive", expectedValFromDropdown, SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectAllInShowDropDown");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnOkOnAlertPopUp() {
        try {
            SeleniumUtil.handleParticularAlert("You have selected to change the status of this organization. Proceed?");
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectAllInShowDropDown");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnCloseToast() {
        try {
            SeleniumUtil.click("cssselector", ".toast-close-button", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnCloseToast");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void moveCursorOnMenu() {
        try {
            Thread.sleep(2000);
            SeleniumUtil.mouseOver("xpath", "//strong[text()='Menu']", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("moveCursorOnMenu");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void checkAndDecide() {
        try {
            Thread.sleep(2000);
            boolean value = SeleniumUtil.waitForElementVisibilityOf("xpath", "//span[text()='Instances']", 2, SeleniumUtilities.OBJWAITTIMEOUT);
            if (value == true){
                System.out.println("Instances Element is visible");
                logger.info("Instances Element is visible");
                SeleniumUtil.click("xpath", ".//*[@id='settings']/a", 8);

            }
            else {
                logger.info("Instances Element is NOT visible Its In the Settings Page");
                System.out.println("Its In the Settings Page");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("moveCursorOnMenu");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }
}


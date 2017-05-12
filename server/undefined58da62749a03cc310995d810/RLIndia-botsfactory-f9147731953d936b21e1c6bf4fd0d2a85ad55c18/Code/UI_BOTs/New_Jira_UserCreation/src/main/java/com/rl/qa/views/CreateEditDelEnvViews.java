package com.rl.qa.views;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.steps.LoginSteps;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.PageFactory;

import java.util.Random;
import java.util.logging.Logger;

import static junit.framework.Assert.assertFalse;
import static junit.framework.TestCase.assertTrue;
import static junit.framework.TestCase.fail;

/**
 * Created by RLE0372 on 26-07-2016.
 */
public class CreateEditDelEnvViews {
    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    public static WebElement PagesFrame;
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    public static String envName = "";

    public static void clickOnEnvironmentsLink() {
        try {
            SeleniumUtil.waitForElementIsClickable("linktext", "Environments", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("linktext", "Environments", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnEnvironmentsLink");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void clickOnChefServerSelButton(String serverName) {
        try {
            SeleniumUtil.waitForElementIsClickable("xpath", ".//*[@id='s2id_environmentname']/a//b", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath", ".//*[@id='s2id_environmentname']/a//b", SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.type("xpath", ".//*[@id='select2-drop']//input", serverName, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.hitEnterKey("xpath", "//span[text()='" + serverName + "']", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnChefServerSelButton");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void enterChefEnvName(String chefEnvName) {
        try {
            SeleniumUtil.waitForElementIsClickable("id", "chefenvname", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.type("id", "chefenvname", chefEnvName, SeleniumUtil.OBJWAITTIMEOUT);

        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnAddChefEnvButton");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnAddChefEnvButtonOnEnvPage() {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath","(//a[text()='Add'])[1]",5, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath", "(//a[text()='Add'])[1]", SeleniumUtil.OBJWAITTIMEOUT);

        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnAddChefEnvButton");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void checkElementIsDisabled(String idOfElement) {
        try {
            SeleniumUtil.waitForElementIsClickable("id", idOfElement, 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtilities.assertNull(SeleniumUtil.getElement("id", idOfElement, 5, SeleniumUtilities.OBJWAITTIMEOUT));
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnAddChefEnvButton");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static String enterRandomEnvName(String idOfEditBox) {
        try {
            int max = 100000;
            int min = 10000;
            Random r = new Random();
            int ranNumber = r.nextInt((max - min) + 1) + min;
            envName = "QA" + ranNumber;
            SeleniumUtil.type("id", idOfEditBox,envName, SeleniumUtil.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnAddChefEnvButton");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
        return envName;
    }

    public static void verifyEnvName() {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+envName+"']", 5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue (SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//*[text()='"+envName+"']",envName, SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info("Verified created environment:" + envName);
//            } else {
//                logger.info("environment not found:" + envName);
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyEnvName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void verifyAssignedOrgName(String arg0, String org) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//td[text()='" + envName + "']/../td[text()='" + org + "']", 5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue (SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//td[text()='" + envName + "']/../td[text()='" + org + "']", org, SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info("Verified " + org + " assigned to " + envName);
//            } else {
//                logger.info("assigned org to environment not found:" + org);
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyAssignedOrgNametoEnv");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyEditIsEnabled(String s, String edit) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//td[text()='" + envName + "']/following-sibling::td//*[@title='" + edit + "']", 5, SeleniumUtilities.OBJWAITTIMEOUT);
            WebElement wb = SeleniumUtil.getElement("xpath", ".//*[@id='envtable']//td[text()='" + envName + "']/following-sibling::td//*[@title='" + edit + "']", SeleniumUtilities.OBJWAITTIMEOUT);
            if (wb.isEnabled()) {
                logger.info(edit + " is Enabled");
            } else {
                logger.info(edit + " is disbled");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyEditIsEnabled");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifySelectChefServerisDisabled() {
        try {
//            SeleniumUtil.waitForElementVisibilityOf("id", "s2id_configname", 5, SeleniumUtilities.OBJWAITTIMEOUT);
            WebElement wb = SeleniumUtil.getElement("id", "s2id_configname", SeleniumUtilities.OBJWAITTIMEOUT);
            String actClassValOfElement = wb.getAttribute("class");
            String expClassValWhenEleIsDisabled = "select2-container select2-container-disabled chooseOrganization width-100";
            assertTrue (actClassValOfElement.equals(expClassValWhenEleIsDisabled));
            logger.info("Select chef server is disbled");
//            } else {
//                logger.info("Select chef server is enabled");
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifySelectChefServerisDisabled");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyEnvIsDeleted() {
        try {
//            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='" + envName + "']/following-sibling::td[2]", 1, SeleniumUtilities.OBJWAITTIMEOUT);
            assertFalse(SeleniumUtil.isElementExist("xpath", ".//*[@id='envtable']//*[text()='" + envName + "']")); {
                logger.info(envName + "Environment does not exists : Deleted");
//            } else {
//                logger.info(envName + "Chef server does not exists : deleted");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyEnvIsDeleted");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void selectExistingEnv(String cheEnvName) {
        try {
//            SeleniumUtil.waitForElementIsClickable("xpath", "//*[@id='s2id_environmentname']/a", 8, SeleniumUtilities.OBJWAITTIMEOUT);
//            Thread.sleep(2000);
//            SeleniumUtil.click("xpath", "//*[@id='s2id_environmentname']/a", SeleniumUtil.OBJWAITTIMEOUT);
//            Thread.sleep(2000);
//            SeleniumUtil.waitForElementIsClickable("xpath", "//*[text()='" + cheEnvName + "']", 8, SeleniumUtilities.OBJWAITTIMEOUT);
//            SeleniumUtil.click("xpath", "//*[text()='" + cheEnvName + "']", SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.selectByVisibleText("id","environmentname",cheEnvName,SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectExistingEnv");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void verifyEnvInWorkZone() {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", "//span[text()='" + envName + "']", 5, SeleniumUtilities.OBJWAITTIMEOUT);
            if (SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//*[text()='" + envName + "']", envName, SeleniumUtilities.OBJWAITTIMEOUT)) {
                logger.info("Verified created environment:" + envName);
            } else {
                logger.info("environment not found:" + envName);
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyEnvName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void clickOnEnv() {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", "//span[text()='" + envName + "']", 5, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath", "//span[contains(text(),'QA')]", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnEnv");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyAndSelectCreatedEnv() {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", "//span[text()='"+envName+"']",5, SeleniumUtilities.OBJWAITTIMEOUT);
//            assertTrue(SeleniumUtil.verifyTextValue("xpath", "//span[text()='"+envName+"']",envName,SeleniumUtilities.OBJWAITTIMEOUT)); {
            SeleniumUtil.click("xpath", "//span[text()='"+envName+"']",SeleniumUtilities.OBJWAITTIMEOUT);
            logger.info("Verified created environment:" + envName);
//            } else {
//                logger.info("environment not found:" + envName);

        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyAndSelectCreatedEnv");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void assigntheProject(String projectName)
    {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='projectname']/label/input[@value='"+projectName+"']/../i",5, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath",".//*[@id='projectname']/label/input[@value='"+projectName+"']/../i",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("assignporject");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void verifySelectedEnvNameFromChef(String environmentName) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+environmentName+"']", 5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue (SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//*[text()='"+environmentName+"']",environmentName, SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info("Verified created environment:" + envName);
//            } else {
//                logger.info("environment not found:" + envName);
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyEnvName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyAssignedDetailsOfEnv(String environmentName, String org) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath",".//*[@id='envtable']//td[text()='"+environmentName +"']/../td[text()='"+org+"']", 5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue (SeleniumUtil.verifyTextValue("xpath",".//*[@id='envtable']//td[text()='"+environmentName+"']/../td[text()='"+org+"']",org,SeleniumUtilities.OBJWAITTIMEOUT));
            logger.info("Verified " +org+ "with" +environmentName);
//            } else {
//                logger.info("environment not found:" + envName);
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyEnvName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyEditPageIsDisplayed(String pageName) {
        try {
            assertTrue (SeleniumUtil.verifyTextValue("xpath","//*[text()='"+pageName+"']",pageName,SeleniumUtilities.OBJWAITTIMEOUT));
            logger.info("Verified "+pageName);
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyEnvName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnAddButton() {
        try {
            SeleniumUtil.click("cssselector",".btn.btn-default.btn-primary.createchefenvbtn",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnAddButton");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void selectNewlyAddedEnv() {
        try {
            SeleniumUtil.selectByVisibleText("id","environmentname",envName,SeleniumUtil.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectNewlyAddedEnv");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }


    }

    public static void verifyEnvironmentIsDeleted(String environmentName) {
        try {
            assertFalse(SeleniumUtil.isElementExist("xpath", ".//*[@id='envtable']//*[text()='" + environmentName + "']"));
            logger.info(envName + "Environment does not exists : Deleted");
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyEnvIsDeleted");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }
}



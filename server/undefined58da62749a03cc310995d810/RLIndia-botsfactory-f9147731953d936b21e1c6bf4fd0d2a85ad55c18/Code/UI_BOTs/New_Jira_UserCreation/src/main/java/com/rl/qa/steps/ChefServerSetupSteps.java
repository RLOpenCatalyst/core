package com.rl.qa.steps;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import com.rl.qa.views.ChefServerSetupViews;
import cucumber.api.PendingException;
import cucumber.api.java.en.And;
import cucumber.api.java.en.Then;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.PageFactory;

import java.util.Iterator;
import java.util.logging.Logger;

import static junit.framework.Assert.assertTrue;
import static junit.framework.TestCase.fail;

/**
 * Created by RLE0372 on 20-07-2016.
 */
public class ChefServerSetupSteps {
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    private static final com.rl.qa.utils.SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);

    @And("^I Enter the \"([^\"]*)\" in name edit box$")
    public void iEnterTheInNameEditBox(String chefServerName) throws Throwable {
        ChefServerSetupViews.enterServerName(chefServerName);
    }

    @And("^I Enter \"([^\"]*)\" in User Name edit box$")
    public void iEnterInUserNameEditBox(String userName) throws Throwable {
        ChefServerSetupViews.enterUserName(userName);
    }

    @And("^I Enter \"([^\"]*)\" in URL edit box$")
    public void iEnterInURLEditBox(String url) throws Throwable {
        ChefServerSetupViews.enterURL(url);
    }

    @And("^I browse pem file for chef server$")
    public void iBrowsePemFileForChefServer() throws Throwable {
        ChefServerSetupViews.BrowsePemFileForChefServer();
    }

    @And("^I browse knife file for chef server$")
    public void iBrowseKnifeFileForChefServer() throws Throwable {
        ChefServerSetupViews.BrowseKnifeFileForChefServer();
    }

    @And("^I select the \"([^\"]*)\" and click on corresponding \"([^\"]*)\" Button$")
    public void iSelectTheAndClickOnCorrespondingButton(String cherServerName ,String Import_Node) throws Throwable {
        ChefServerSetupViews.chefServerEditButton(cherServerName,Import_Node);
    }

    @And("^I clear the \"([^\"]*)\" already present in name edit box$")
    public void iClearTheAlreadyPresentInNameEditBox(String arg0) throws Throwable {
        ChefServerSetupViews.clearNameField();
    }


    @Then("^I verify \"([^\"]*)\" Link is displayed or not$")
    public void iVerifyLinkIsDisplayedOrNot(String Nodes) throws Throwable {
        try {
            SeleniumUtil.waitForElementIsClickable("xpath","//a[text()='Nodes']",8,SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.waitUntilElementContainsText("xpath","//a[text()='Nodes']",Nodes,8,SeleniumUtilities.OBJWAITTIMEOUT));{
                logger.info("Verified : " +Nodes);
//            }else{
//                logger.info("Verified : " +Nodes);
            }
        } catch (Exception e) {
            try {
                SeleniumUtil.getWebElementObject("xpath", "//a[text()='Nodes']");
            } catch (Exception ex) {
                BaseView.takeScreenshot(Nodes + ".png");
                logger.info("Error :" + e.getMessage());
                fail(e.getMessage());
            }
        }

    }

    @Then("^I verify that message \"([^\"]*)\" is displayed$")
    public void iVerifyThatMessageIsDisplayed(String expectedMsg) throws Throwable {
        try {
            WebDriver driver=SeleniumUtil.getWebDriver();
            Iterator<String> i = driver.getWindowHandles().iterator();
            while (i.hasNext()) {
                String parentBrowser=i.next();
                String childBrowser =i.next();
                driver.switchTo().window(childBrowser);
                assertTrue(SeleniumUtil.isElementExist("id","chefAccountMsg"));
                logger.info("Verified : Chef Account is Displayed");
                driver.close();
                driver.switchTo().window(parentBrowser);
            }
        } catch (Exception e) {
            BaseView.takeScreenshot(expectedMsg + ".png");
            logger.info("Error :" + e.getMessage());
            fail(e.getMessage());
        }
    }
    @Then("^I verify that message \"([^\"]*)\" on data bag page is displayed$")
    public void iVerifyThatMessageOnDataBagPageIsDisplayed(String expectedMsg) throws Throwable {
        try {
            SeleniumUtil.waitForElementIsClickable("xpath","//h4[contains(text(),'Data Bags & Items')]",8,SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.verifyTextValue("xpath","//h4[contains(text(),'Data Bags & Items')]",expectedMsg,SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info("Verified : " + expectedMsg);
            }
        } catch (Exception e) {
                BaseView.takeScreenshot(expectedMsg + ".png");
                logger.info("Error :" + e.getMessage());
                fail(e.getMessage());
            }
        }

    @Then("^I verify created \"([^\"]*)\" in chef server table$")
    public void iVerifyCreatedInChefServerTable(String chefServerName) throws Throwable {
        ChefServerSetupViews.verifyChefServerName(chefServerName);

    }


    @And("^I verify select organization is disabled$")
    public void iVerifySelectOrganizationIsDisabled() throws Throwable {
        ChefServerSetupViews.verifySelectOrgISDisabled();
    }

    @Then("^I verify created \"([^\"]*)\" is deleted$")
    public void iVerifyCreatedChefServerIsDeleted(String chefServerName) throws Throwable {
        ChefServerSetupViews.verifyChefServerIsDeleted(chefServerName);
    }


    @Then("^I verify \"([^\"]*)\" with \"([^\"]*)\" in the Chef Server table$")
    public void iVerifyWithInTheChefServerTable(String chefServerName, String chefUserName) throws Throwable {
        ChefServerSetupViews.verifyServerDetails(chefServerName,chefUserName);
    }

    @And("^I upload pem file \"([^\"]*)\"$")
    public void iUploadPemFile(String fileName) throws Throwable {
        ChefServerSetupViews.uploadPemFile(fileName);
    }

    @And("^I upload knife file \"([^\"]*)\"$")
    public void iUploadKnifeFile(String fileName) throws Throwable {
        ChefServerSetupViews.uploadKnifeFile(fileName);
    }

    @And("^I select \"([^\"]*)\" from the Drop Down available$")
    public void iSelectFromTheDropDownAvailable(String strOrgname) throws Throwable {
        ChefServerSetupViews.selectTheOrg(strOrgname);

    }
}


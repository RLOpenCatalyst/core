package com.rl.qa.steps;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.SeleniumUtilities;
import com.rl.qa.views.ConfigBlueprintForSSTempUsingProAWSViews;
import cucumber.api.java.en.And;
import cucumber.api.java.en.Then;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

/**
 * Created by RLE0372 on 10-09-2016.
 */
public class ConfigBlueprintForSSTempUsingProAWSSteps {
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    private static final com.rl.qa.utils.SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);

    @Then("^I verify \"([^\"]*)\" present in \"([^\"]*)\" page$")
    public void iVerifyPresentInPage(String blueprintName, String pageName) throws Throwable {
        ConfigBlueprintForSSTempUsingProAWSViews.verifyBlueprintInWorkZone(blueprintName,pageName);
    }

    @And("^I click on \"([^\"]*)\" of the \"([^\"]*)\"$")
    public void iClickOnOfThe(String moreInfo, String blueprintName) throws Throwable {
        ConfigBlueprintForSSTempUsingProAWSViews.clickOnMoreInfo(moreInfo,blueprintName);
    }

    @And("^I click on the \"([^\"]*)\" button on instance log popup$")
    public void iClickOnTheButtonOnInstanceLogPopup(String arg0) throws Throwable {
        ConfigBlueprintForSSTempUsingProAWSViews.clickOnClose();
    }

    @And("^I select the desired \"([^\"]*)\"$")
    public void iSelectTheDesired(String blueprintName) throws Throwable {
        ConfigBlueprintForSSTempUsingProAWSViews.selectBlueprint(blueprintName);
    }

    @And("^I click on copy Blueprint$")
    public void iClickOnCopyBlueprint() throws Throwable {
        ConfigBlueprintForSSTempUsingProAWSViews.clickOnCopyBlueprint();
    }

    @And("^I select \"([^\"]*)\" from \"([^\"]*)\" drop down on select target popup$")
    public void iSelectFromDropDownOnSelectTargetPopup(String name, String idOfElement) throws Throwable {
        ConfigBlueprintForSSTempUsingProAWSViews.selectParametersOnPopupWindow(name,idOfElement);
    }

    @And("^I click on \"([^\"]*)\" button on the select target popup$")
    public void iClickOnButtonOnTheSelectTargetPopup(String buttonText) throws Throwable {
        ConfigBlueprintForSSTempUsingProAWSViews.clickOnSave(buttonText);
    }

    @And("^I select the \"([^\"]*)\" and click on assigned \"([^\"]*)\"$")
    public void iSelectTheAndClickOnAssigned(String proName, String envName) throws Throwable {
        ConfigBlueprintForSSTempUsingProAWSViews.clickOnEnv(proName,envName);
    }

    @And("^I click on \"([^\"]*)\" button to delete the blueprint$")
    public void iClickOnButtonToDeleteTheBlueprint(String buttonTitle) throws Throwable {
        ConfigBlueprintForSSTempUsingProAWSViews.clickOnDeleteBlueprint(buttonTitle);
    }

    @Then("^I verify \"([^\"]*)\" is deleted$")
    public void iVerifyIsDeleted(String blueprintName) throws Throwable {
        ConfigBlueprintForSSTempUsingProAWSViews.verifyBlueprintDeleted(blueprintName);
    }

    @And("^I click on \"([^\"]*)\" button of \"([^\"]*)\"$")
    public void iClickOnButtonOf(String buttonTitle, String blueprintName) throws Throwable {
        ConfigBlueprintForSSTempUsingProAWSViews.clickOnEditBlueprintButton(buttonTitle,blueprintName);
    }

    @And("^I click on the Settings$")
    public void iClickOnTheSettings() throws Throwable {
        ConfigBlueprintForSSTempUsingProAWSViews.clickOnSettings();
    }

    @And("^I click on \"([^\"]*)\" on blueprint page$")
    public void iClickOnOnBlueprintPage(String title) throws Throwable {
        ConfigBlueprintForSSTempUsingProAWSViews.deleteBlueprint(title);
    }

    @And("^I click on the \"([^\"]*)\" button on \"([^\"]*)\" popup window$")
    public void iClickOnTheButtonOnPopupWindow(String arg0, String arg1) throws Throwable {
        ConfigBlueprintForSSTempUsingProAWSViews.clickOnDeleteOnConfirmationPopup();
    }

}

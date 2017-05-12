package com.rl.qa.steps;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.SeleniumUtilities;
import com.rl.qa.views.CreateEditDelEnvViews;
import cucumber.api.java.en.And;
import cucumber.api.java.en.Then;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

/**
 * Created by RLE0372 on 26-07-2016.
 */
public class CreateEditDelEnvSteps {

    private static final Logger logger = Logger.getLogger(com.rl.qa.steps.LoginSteps.class.getName());
    private static final com.rl.qa.utils.SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);

    @And("^I click on Environments link$")
    public void iClickOnEnvironmentsLink() throws Throwable {
        CreateEditDelEnvViews.clickOnEnvironmentsLink();
    }

    @And("^I click on \"([^\"]*)\" select Button and select one existing environment$")
    public void iClickOnSelectButtonAndSelectOneExistingEnvironment(String serverName) throws Throwable {
        CreateEditDelEnvViews.clickOnChefServerSelButton(serverName);
    }

    @And("^I enter the \"([^\"]*)\" name in edit box$")
    public void iEnterTheNameInEditBox(String chefEnvName) throws Throwable {
        CreateEditDelEnvViews.enterChefEnvName(chefEnvName);
    }

    @And("^I click on add chef environment button on create environment page$")
    public void iClickOnAddChefEnvironmentButtonOnCreateEnvironmentPage() throws Throwable {
        CreateEditDelEnvViews.clickOnAddChefEnvButtonOnEnvPage();

    }

    @And("^I check \"([^\"]*)\" is disabled$")
    public void iCheckIsDisabled(String idOfElement) throws Throwable {
        CreateEditDelEnvViews.checkElementIsDisabled(idOfElement);

    }

    @And("^I enter  chef environment in \"([^\"]*)\" Edit box$")
    public void iEnterChefEnvironmentInEditBox(String idOfEditBox) throws Throwable {
        CreateEditDelEnvViews.enterRandomEnvName(idOfEditBox);
    }


    @Then("^I verify created \"([^\"]*)\" in environments table$")
    public void iVerifyCreatedEnvInEnvironmentsTable(String environmentName) throws Throwable {
        CreateEditDelEnvViews.verifySelectedEnvNameFromChef(environmentName);
    }


    @Then("^I select the \"([^\"]*)\" and verify \"([^\"]*)\" Button is enabled in environments table$")
    public void iSelectTheEnvAndVerifyButtonIsEnabledInEnvironmentsTable(String arg0, String Edit) throws Throwable {
        CreateEditDelEnvViews.verifyEditIsEnabled(" ",Edit);
    }

    @And("^I verify select chef server is disabled$")
    public void iVerifySelectChefServerIsDisabled() throws Throwable {
        CreateEditDelEnvViews.verifySelectChefServerisDisabled();
    }

    @Then("^I verify the created environment is deleted$")
    public void iVerifyTheCreatedEnvironmentIsDeleted() throws Throwable {
        CreateEditDelEnvViews.verifyEnvIsDeleted();
    }


    @And("^I select existing chef \"([^\"]*)\" from chef server$")
    public void iSelectExistingChefFromChefServer(String envName) throws Throwable {
        CreateEditDelEnvViews.selectExistingEnv(envName);

    }

    @Then("^I verify \"([^\"]*)\" with assigned \"([^\"]*)\" in the environments table$")
    public void iVerifyEnvWithAssignedOrgInTheEnvironmentsTable(String arg0, String org) throws Throwable {
        CreateEditDelEnvViews.verifyAssignedOrgName(arg0,org);
    }

    @And("^I verify created \"([^\"]*)\" in workzone$")
    public void iVerifyCreatedInWorkzone(String arg0) throws Throwable {
        CreateEditDelEnvViews.verifyEnvInWorkZone();
    }

    @And("^I click on the environment$")
    public void iClickOnTheEnvironment() throws Throwable {
        CreateEditDelEnvViews.clickOnEnv();
    }

    @And("^I select the \"([^\"]*)\" to be assigned with Env$")
    public void iSelectTheToBeAssignedWithEnv(String projectname) throws Throwable {
        CreateEditDelEnvViews.assigntheProject(projectname);
    }

    @And("^I verify created \"([^\"]*)\" in workzone and click on it$")
    public void iVerifyCreatedInWorkzoneAndClickOnIt(String arg0) throws Throwable {
        CreateEditDelEnvViews.verifyAndSelectCreatedEnv();
    }

    @Then("^I verify \"([^\"]*)\" with \"([^\"]*)\" in the environments table$")
    public void iVerifyWithInTheEnvironmentsTable(String environmentName, String org) throws Throwable {
        CreateEditDelEnvViews.verifyAssignedDetailsOfEnv(environmentName,org);
    }

    @Then("^I verify newly created \"([^\"]*)\" in environments table$")
    public void iVerifyNewlyCreatedInEnvironmentsTable(String arg0) throws Throwable {
        CreateEditDelEnvViews.verifyEnvName();
    }

    @Then("^I Verify \"([^\"]*)\" page is displayed$")
    public void iVerifyPageIsDisplayed(String pageName) throws Throwable {
        CreateEditDelEnvViews.verifyEditPageIsDisplayed(pageName);
    }

    @And("^I click on \"([^\"]*)\" button on the \"([^\"]*)\" popup$")
    public void iClickOnButtonOnThePopup(String arg0, String arg1) throws Throwable {
        CreateEditDelEnvViews.clickOnAddButton();
    }

    @And("^I select environment from drop down$")
    public void iSelectEnvironmentFromDropDown() throws Throwable {
        CreateEditDelEnvViews.selectNewlyAddedEnv();
    }

    @Then("^I verify the created \"([^\"]*)\" is deleted$")
    public void iVerifyTheCreatedIsDeleted(String envName) throws Throwable {
        CreateEditDelEnvViews.verifyEnvironmentIsDeleted(envName);

    }
}

package com.rl.qa.steps;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.SeleniumUtilities;
import com.rl.qa.views.CreateEditDelProjectViews;
import cucumber.api.java.en.And;
import cucumber.api.java.en.Then;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

/**
 * Created by RLE0372 on 20-07-2016.
 */
public class CreateEditDelProjectSteps {
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    private static final com.rl.qa.utils.SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);

    @And("^I click on Projects link$")
    public void iClickOnProjectsLink() throws Throwable {
        CreateEditDelProjectViews.clickOnProLink();
    }

    @And("^I click on new Projects button$")
    public void iClickOnNewProjectsButton() throws Throwable {
        CreateEditDelProjectViews.clickOnNewProButton();
    }


    @And("^I click on \"([^\"]*)\"$")
    public void iClickOn(String proOrg) throws Throwable {
        CreateEditDelProjectViews.clickOnOrg(proOrg);
    }

    @And("^I clear the project name field$")
    public void iClearTheProjectNameField() throws Throwable {
        CreateEditDelProjectViews.clearProNameField();
    }


    @And("^I enter \"([^\"]*)\" name$")
    public void iEnterName(String newProName) throws Throwable {
        CreateEditDelProjectViews.typeNewProj(newProName);
    }

    @And("^I click on \"([^\"]*)\" delete project button$")
    public void iClickOnDeleteProjectButton(String proName) throws Throwable {
        CreateEditDelProjectViews.delProject(proName);
    }

    @Then("^I verify the created \"([^\"]*)\" in project table$")
    public void iVerifyTheCreatedProInProjectTable(String proName) throws Throwable {
        CreateEditDelProjectViews.verifyCreatedProject(proName);
    }

    @Then("^I verify the \"([^\"]*)\" is deleted from project table$")
    public void iVerifyTheIsDeletedFromProjectTable(String proName) throws Throwable {
        CreateEditDelProjectViews.verifyDeletedPro(proName);
    }

    @And("^I check the environment$")
    public void iCheckTheEnvironment() throws Throwable {
        CreateEditDelProjectViews.clickOnEnv();
            }

    @Then("^I verify the \"([^\"]*)\" with assigned \"([^\"]*)\" in project table$")
    public void iVerifyTheWithAssignedInProjectTable(String projectName, String projectDetails) throws Throwable {
        CreateEditDelProjectViews.verifyProjectInfo(projectName,projectDetails);
    }
}

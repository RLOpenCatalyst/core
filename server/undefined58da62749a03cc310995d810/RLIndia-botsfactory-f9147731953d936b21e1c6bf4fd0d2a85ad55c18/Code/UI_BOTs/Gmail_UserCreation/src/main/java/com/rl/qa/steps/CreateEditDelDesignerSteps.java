package com.rl.qa.steps;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.SeleniumUtilities;
import com.rl.qa.views.CreateEditDelDesignerViews;
import cucumber.api.java.en.And;
import cucumber.api.java.en.Then;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

/**
 * Created by rle0346 on 3/8/16.
 */
public class CreateEditDelDesignerSteps {
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    private static final com.rl.qa.utils.SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);

    @And("^I Click on \"([^\"]*)\" Link$")
    public void iClickOnLink(String StrDesignerlink) throws Throwable {
        CreateEditDelDesignerViews.clickOnUsersSetupLink(StrDesignerlink);
    }

    @And("^I Click on \"([^\"]*)\" Link in the link$")
    public void iClickOnLinkInTheLink(String strUserLink) throws Throwable {
        CreateEditDelDesignerViews.clickOnUsersLink(strUserLink);

    }

    @And("^I Click on New Button of Users page$")
    public void iClickOnNewButtonOfUsersPage() throws Throwable {
        CreateEditDelDesignerViews.clickOnNewButton();
    }

    @And("^I Enter the \"([^\"]*)\" User Login Name$")
    public void iEnterTheUserLoginName(String strDesignerName) throws Throwable {
        CreateEditDelDesignerViews.enterLoginName(strDesignerName);
    }

    @And("^I Enter the \"([^\"]*)\" of the User$")
    public void iEnterTheOfTheUser(String strEmailAddress) throws Throwable {
        CreateEditDelDesignerViews.enterEmailAddress(strEmailAddress);

    }


    @And("^I Enter the \"([^\"]*)\" of the User field$")
    public void iEnterTheOfTheUserField(String strPassword) throws Throwable {
        CreateEditDelDesignerViews.enterPassword(strPassword);
    }


    @And("^I Enter the \"([^\"]*)\" of User field$")
    public void iEnterTheOfUserField(String strConfPassword) throws Throwable {
        CreateEditDelDesignerViews.enterConfirmPassword(strConfPassword);
    }

    @And("^I Click on Org Dropdown and select \"([^\"]*)\"$")
    public void iClickOnOrgDropdownAndSelect(String strOrganization) throws Throwable {
        CreateEditDelDesignerViews.selectOrganization(strOrganization);

    }

    @And("^I Select the Role as \"([^\"]*)\"$")
    public void iSelectTheRoleAs(String strRole) throws Throwable {
        CreateEditDelDesignerViews.selectRole(strRole);

    }

    @And("^I Assign the Teams for the User with respect to \"([^\"]*)\"$")
    public void iAssignTheTeamsForTheUserWithRespectTo(String strOrganization) throws Throwable {
        CreateEditDelDesignerViews.selectTeam(strOrganization);

    }


    @And("^I Click on Save Button of User creation page$")
    public void iClickOnSaveButtonOfUserCreationPage() throws Throwable {
        CreateEditDelDesignerViews.clickSaveButton();
    }


    @And("^I Click on Edit Button the \"([^\"]*)\" user created$")
    public void iClickOnEditButtonTheUserCreated(String strDesigner) throws Throwable {
        CreateEditDelDesignerViews.clickEditDesignerButton(strDesigner);

    }


    @Then("^I Verify the \"([^\"]*)\" User is created$")
    public void iVerifyTheUserIsCreated(String strDesigner) throws Throwable {
        CreateEditDelDesignerViews.verifyDesignerUserCreation(strDesigner);

    }

    @And("^I Verify the Login name is disabled$")
    public void iVerifyTheLoginNameIsDisabled() throws Throwable {
        CreateEditDelDesignerViews.VerifyLoginNameDisabled();

    }

    @And("^I Click on Update Password tick$")
    public void iClickOnUpdatePasswordTick() throws Throwable {
        CreateEditDelDesignerViews.clickOnUpdatePasswordCheckbox();
    }


    @And("^I Click on Delete button of the \"([^\"]*)\" user created$")
    public void iClickOnDeleteButtonOfTheUserCreated(String strDesigner) throws Throwable {
        CreateEditDelDesignerViews.clickOnDeleteButton(strDesigner);

    }

    @And("^I Click on \"([^\"]*)\" Button to remove the Designer user$")
    public void iClickOnButtonToRemoveTheDesignerUser(String strOK) throws Throwable {
        CreateEditDelDesignerViews.clickOnOkButton(strOK);
    }

    @And("^I Verify the \"([^\"]*)\" is updated$")
    public void iVerifyTheIsUpdated(String strEmailAddress) throws Throwable {
        CreateEditDelDesignerViews.verfiyEmailAddressUpdated(strEmailAddress);
    }

    @And("^I Assign the Teams for the SuperAdmin User with respect to \"([^\"]*)\"$")
    public void iAssignTheTeamsForTheSuperAdminUserWithRespectTo(String strDefaultTeam) throws Throwable {
        CreateEditDelDesignerViews.selectDefaultTeam(strDefaultTeam);

    }

    @Then("^I Verify the \"([^\"]*)\" User with this \"([^\"]*)\" is created$")
    public void iVerifyTheUserWithThisIsCreated(String strDesigner, String strEmailAddress) throws Throwable {
        CreateEditDelDesignerViews.VerifyEmailAddress(strDesigner, strEmailAddress);

    }

    @Then("^I Verify the \"([^\"]*)\" User with this \"([^\"]*)\" created$")
    public void iVerifyTheUserWithThisCreated(String strDesigner, String strDesignerRole) throws Throwable {
        CreateEditDelDesignerViews.VerifyDesignerRoleInTable(strDesigner, strDesignerRole);
    }


    @Then("^I Verify the \"([^\"]*)\" User with this \"([^\"]*)\" is available$")
    public void iVerifyTheUserWithThisIsAvailable(String strDesigner, String strOrganization) throws Throwable {
        CreateEditDelDesignerViews.VerifyOrganizationInTable(strDesigner, strOrganization);
    }

    @Then("^I select the \"([^\"]*)\" and verify \"([^\"]*)\" Button is enabled$")
    public void iSelectTheAndVerifyButtonIsEnabled(String strOrganization, String strEdit) throws Throwable {
        CreateEditDelDesignerViews.verifyButtonIsEnabled(strOrganization, strEdit);
    }

    @Then("^I Verify the \"([^\"]*)\" user is deleted$")
    public void iVerifyTheUserIsDeleted(String strDesigner) throws Throwable {
        CreateEditDelDesignerViews.verifyDeletedUser(strDesigner);
    }
}

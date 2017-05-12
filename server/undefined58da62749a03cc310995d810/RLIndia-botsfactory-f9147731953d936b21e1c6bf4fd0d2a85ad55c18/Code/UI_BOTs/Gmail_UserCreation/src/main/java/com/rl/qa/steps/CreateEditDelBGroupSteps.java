package com.rl.qa.steps;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.SeleniumUtilities;
import com.rl.qa.views.CreateEditDelBGroupViews;
import cucumber.api.java.en.And;
import cucumber.api.java.en.Then;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

/**
 * Created by RLE0372 on 20-07-2016.
 */
public class CreateEditDelBGroupSteps {
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    private static final com.rl.qa.utils.SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    @And("^I click on Business Groups Link$")
    public void iClickOnBusinessGroupsLink() throws Throwable {
        CreateEditDelBGroupViews.clickBGroupLink();
    }

    @And("^I click on New BGroup button$")
    public void iClickOnNewBGroupButton() throws Throwable {
        CreateEditDelBGroupViews.clickOnNewBGroup();

    }
    @And("^I enter the \"([^\"]*)\" name in Business Group name$")
    public void iEnterTheNameInBusinessGroupName(String bGroupName) throws Throwable {
            CreateEditDelBGroupViews.enterBGroupName(bGroupName);
    }

//    @And("^I click on Organization select button$")
//    public void iClickOnOrganizationSelectButton() throws Throwable {
//        CreateEditDelBGroupViews.clickOnOrgSelectButton();
//    }

    @And("^I enter \"([^\"]*)\" in the search box$")
    public void iEnterInTheSearchBox(String org_Name) throws Throwable {
        CreateEditDelBGroupViews.enterOrgName(org_Name);
    }


    @And("^I click on \"([^\"]*)\" Edit button$")
    public void iClickOnEditButton(String bGroup) throws Throwable {
        CreateEditDelBGroupViews.clickOnEditBGroup(bGroup);
    }

    @And("^I clear the product group name field$")
    public void iClearTheProductGroupNameField() throws Throwable {
        CreateEditDelBGroupViews.clearField();
    }

    @And("^I enter another \"([^\"]*)\" in edit box$")
    public void iEnterAnotherBGrpInEditBox(String newBGrpName) throws Throwable {
        CreateEditDelBGroupViews.enterNewBGrpName(newBGrpName);
    }

    @And("^I click on \"([^\"]*)\" delete bGroup button$")
    public void iClickOnDeleteBGroupButton(String editedBGrp) throws Throwable {
        CreateEditDelBGroupViews.delEditedBGroup(editedBGrp);
    }

    @And("^I click on Organizations link in the settings tree$")
    public void iClickOnOrganizationsLinkInTheSettingsTree() throws Throwable {
        CreateEditDelBGroupViews.clickOnOrgLinkInSettTree();
    }


    @Then("^I verify the created \"([^\"]*)\" in Business group table$")
    public void iVerifyTheCreatedInBusinessGroupTable(String businessGroup) throws Throwable {
        CreateEditDelBGroupViews.verifyCreatedBGroup(businessGroup);

    }

    @Then("^I verify the edited \"([^\"]*)\" in Business group table$")
    public void iVerifyTheEditedInBusinessGroupTable(String editedBGroup) throws Throwable {
        CreateEditDelBGroupViews.verifyEditedBGroup(editedBGroup);
    }

    @Then("^I verify the \"([^\"]*)\" is deleted from the Business Group table$")
    public void iVerifyTheIsDeletedFromTheBusinessGroupTable(String bGroup) throws Throwable {
        CreateEditDelBGroupViews.verifyDeletedBGroup(bGroup);
    }

    @Then("^I verify \"([^\"]*)\" with assigned \"([^\"]*)\" in the Business group table$")
    public void iVerifyWithAssignedInTheBusinessGroupTable(String bGroup, String org) throws Throwable {
        CreateEditDelBGroupViews.verifyAssignedOrg(bGroup,org);
    }

    @And("^I select \"([^\"]*)\" from the Drop Down$")
    public void iSelectFromTheDropDown(String orgName) throws Throwable {
        CreateEditDelBGroupViews.selectBusinessGroup(orgName);
    }
}

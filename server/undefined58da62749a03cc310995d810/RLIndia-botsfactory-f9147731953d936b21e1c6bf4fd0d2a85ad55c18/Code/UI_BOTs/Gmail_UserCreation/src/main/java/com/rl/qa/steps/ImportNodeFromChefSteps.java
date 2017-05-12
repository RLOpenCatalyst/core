package com.rl.qa.steps;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.SeleniumUtilities;
import com.rl.qa.views.ImportNodesFromChefViews;
import cucumber.api.java.en.And;
import cucumber.api.java.en.Then;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

/**
 * Created by RLE0372 on 10-08-2016.
 */
public class ImportNodeFromChefSteps {
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    private static final com.rl.qa.utils.SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);


    @And("^I click on AWS provider$")
    public void iClickOnAWSProvider() throws Throwable {
        ImportNodesFromChefViews.clickOnAWSProvider();
    }

    @And("^I select type of blueprint \"([^\"]*)\"$")
    public void iSelectTypeOfBlueprint(String blueprintType) throws Throwable {
        ImportNodesFromChefViews.selectBlueprintType(blueprintType);
    }

    @And("^I click on next button$")
    public void iClickOnNextButton() throws Throwable {
        ImportNodesFromChefViews.clickOnNext();
    }

    @And("^I select \"([^\"]*)\" in \"([^\"]*)\" select box$")
    public void iSelectInSelectBox(String valueToSelect, String idOfSelectBox) throws Throwable {
        ImportNodesFromChefViews.selectValues(valueToSelect,idOfSelectBox);
    }

    @And("^I select \"([^\"]*)\" in select box$")
    public void iSelectInSelectBox(String region) throws Throwable {
        ImportNodesFromChefViews.selectRegion(region);
    }

    @And("^I select security group$")
    public void iSelectSecurityGroup() throws Throwable {
        ImportNodesFromChefViews.selectSecurityGrp();
    }

    @And("^I click on the \"([^\"]*)\"$")
    public void iClickOnThe(String tempName) throws Throwable {
        ImportNodesFromChefViews.selectTemplate(tempName);
    }

    @And("^I verify the \"([^\"]*)\" in the workzone$")
    public void iVerifyTheInTheWorkzone(String envDetails) throws Throwable {
        ImportNodesFromChefViews.verifyEnvDetails(envDetails);
    }

    @And("^I click on launch blueprint$")
    public void iClickOnLaunchBlueprint() throws Throwable {
        ImportNodesFromChefViews.clickOnLaunchBlueprint();
    }

    @And("^I  click on Workzone$")
    public void iClickOnWorkzone() throws Throwable {
        ImportNodesFromChefViews.clickOnWorkzone();
    }

    @And("^I click on launch blueprint on the pop-up menu$")
    public void iClickOnLaunchBlueprintOnThePopUpMenu() throws Throwable {
        ImportNodesFromChefViews.clickOnLaunchBlueprintPopUp();
    }

    @And("^I click on launch on select blueprint parameter pop-up menu$")
    public void iClickOnLaunhOnSelectBlueprintParameterPopUpMenu() throws Throwable {
        ImportNodesFromChefViews.clickOnLaunchOnSelBlueprintPopUp();
    }

    @And("^I capture the AWS ID of \"([^\"]*)\"$")
    public void iCaptureTheAWSIDOf(String bluePrintName) throws Throwable {
        ImportNodesFromChefViews.captureAwsId(bluePrintName);
    }

    @And("^I capture the IP Address of \"([^\"]*)\"$")
    public void iCaptureTheIPAddressOf(String bluePrintName) throws Throwable {
        ImportNodesFromChefViews.captureIpAddress(bluePrintName);
    }

    @And("^I click on Import Nodes button$")
    public void iClickOnImportNodesButton() throws Throwable {
        ImportNodesFromChefViews.clickOnImportNodesButton();
    }

    @And("^I enter \"([^\"]*)\" in \"([^\"]*)\" Edit box in Import Nodes popup window$")
    public void iEnterInEditBoxInImportNodesPopupWindow(String userName, String idOfEditBox) throws Throwable {
        ImportNodesFromChefViews.enterUserNameInPopup(userName,idOfEditBox);
    }
    @And("^I enter \"([^\"]*)\" in the search box and check the corresponding AWS ID checkbox$")
    public void iEnterInTheSearchBoxAndCheckTheCorrespondingAWSIDCheckbox(String arg0) throws Throwable {
        ImportNodesFromChefViews.checkTheCheckBoxOfCorrespondingAWSID();
    }

    @And("^I select \"([^\"]*)\" in \"([^\"]*)\" drop down in Import Nodes popup window$")
    public void iSelectInDropDownInImportNodesPopupWindow(String BusinessGroup, String idOfDropDown) throws Throwable {
        ImportNodesFromChefViews.selectBGroupInImportPopUp(BusinessGroup,idOfDropDown);
    }

    @And("^I browse pem file in Import Nodes popup window$")
    public void iBrowsePemFileInImportNodesPopupWindow() throws Throwable {
        ImportNodesFromChefViews.importPemFileInPopupWindow();
    }

    @And("^I click on Import button on the popup window$")
    public void iClickOnImportButtonOnThePopupWindow() throws Throwable {
        ImportNodesFromChefViews.clickOnImportButton();
    }

    @And("^i verify Importing Nodes popup window is displayed$")
    public void iVerifyImportingNodesPopupWindowIsDisplayed() throws Throwable {
        ImportNodesFromChefViews.verifyImportingNodesPopUp();
            }

    @And("^I click on close button on popup window$")
    public void iClickOnCloseButtonOnPopupWindow() throws Throwable {
        ImportNodesFromChefViews.clickOnCloseButtonOnPopup();
    }

    @And("^I verify Node Imported with AWS ID$")
    public void iVerifyNodeImportedWithAWSID() throws Throwable {
        ImportNodesFromChefViews.verifyNodeImportedMessage();
    }

    @And("^I select the \"([^\"]*)\" from the drop down$")
    public void iSelectTheFromTheDropDown(String envName) throws Throwable {
        ImportNodesFromChefViews.selectEnv(envName);

    }

    @And("^I delete the launched instance from Instances$")
    public void iDeleteTheLaunchedInstanceFromInstances() throws Throwable {
        ImportNodesFromChefViews.deleteInstance();
    }

    @Then("^I verify \"([^\"]*)\" message on popup$")
    public void iVerifyMessageOnPopup(String confirmationMsg) throws Throwable {
        ImportNodesFromChefViews.verifyConfirmationMsg(confirmationMsg);
    }

//    @And("^I browse pem file in Import Nodes popup window$")
//    public void iBrowsePemFileInImportNodesPopupWindow() throws Throwable {
//        ImportNodesFromChefViews.browsePemFile();
//    }
}
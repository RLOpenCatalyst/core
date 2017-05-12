package com.rl.qa.steps;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.SeleniumUtilities;
import com.rl.qa.views.TemplateViews;
import cucumber.api.java.en.And;
import cucumber.api.java.en.Then;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

/**
 * Created by RLE0372 on 11-08-2016.
 */
public class TemplateSteps {
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    private static final com.rl.qa.utils.SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);

    @And("^I click On \"([^\"]*)\" link$")
    public void iClickOnLink(String linkText) throws Throwable {
        TemplateViews.clickOnLink(linkText);

    }

    @And("^I select \"([^\"]*)\" from select box$")
    public void iSelectFromSelectBox(String tempType) throws Throwable {
        TemplateViews.selectTempType(tempType);
    }

    @Then("^I verify the \"([^\"]*)\" is deleted from the Templates table$")
    public void iVerifyTheIsDeletedFromTheTemplatesTable(String tempName) throws Throwable {
        TemplateViews.verifyDeletedTemp(tempName);
    }

    @And("^I verify \"([^\"]*)\" is displayed$")
    public void iVerifyIsDisplayed(String idOfChkBox) throws Throwable {
        TemplateViews.verifyChefFactory(idOfChkBox);
    }

    @Then("^I select \"([^\"]*)\" and verify corresponding \"([^\"]*)\" in Templates table$")
    public void iSelectAndVerifycorrespondingCreatedInTemplatesTable(String templateName, String tempDetails) throws Throwable {
        TemplateViews.verifyTempDetails(templateName,tempDetails);
    }

    @Then("^I verify \"([^\"]*)\" is available in templates table$")
    public void iVerifyIsAvailableInTemplatesTable(String tempName) throws Throwable {
        TemplateViews.verifyTempName(tempName);
    }

    @And("^I browse \"([^\"]*)\" Template file$")
    public void iBrowseTemplateFile(String fileName) throws Throwable {
        TemplateViews.browseAndUploadTemplateFile(fileName);
    }

    @And("^I select \"([^\"]*)\" from the drop down in create template page$")
    public void iSelectFromTheDropDownInCreateTemplatePage(String orgName) throws Throwable {
        TemplateViews.selectOrgInTemplatePage(orgName);
    }
}

package com.rl.qa.steps;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.SeleniumUtilities;
import com.rl.qa.views.ConfigBlueprintForOSImageUsingProAWSViews;
import cucumber.api.java.en.And;
import cucumber.api.java.en.Then;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

/**
 * Created by RLE0372 on 23-09-2016.
 */
public class ConfigBlueprintForOSImageUsingProAWSSteps {
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    private static final com.rl.qa.utils.SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);

    @And("^I see Choose Operating System is disabled$")
    public void iSeeChooseOperatingSystemIsDisabled() throws Throwable {
        ConfigBlueprintForOSImageUsingProAWSViews.verifyChooseOSIsDisabled();
    }

    @And("^I see Choose Provider is disabled$")
    public void iSeeChooseProviderIsDisabled() throws Throwable {
        ConfigBlueprintForOSImageUsingProAWSViews.verifyChooseProviderIsDisabled();
    }

    @And("^I see Choose Available Images is disabled$")
    public void iSeeChooseAvailableImagesIsDisabled() throws Throwable {
        ConfigBlueprintForOSImageUsingProAWSViews.verifyChooseAvailableImages();
    }

    @And("^I see Choose Organization is disabled$")
    public void iSeeChooseOrganizationIsDisabled() throws Throwable {
        ConfigBlueprintForOSImageUsingProAWSViews.verifyChooseOrgIsDisabled();
    }

    @Then("^I verify launch blueprint button is dispalyed$")
    public void iVerifyLaunchBlueprintButtonIsDispalyed() throws Throwable {
        ConfigBlueprintForOSImageUsingProAWSViews.verifyLaunchButtonISDisplayed();
    }
}

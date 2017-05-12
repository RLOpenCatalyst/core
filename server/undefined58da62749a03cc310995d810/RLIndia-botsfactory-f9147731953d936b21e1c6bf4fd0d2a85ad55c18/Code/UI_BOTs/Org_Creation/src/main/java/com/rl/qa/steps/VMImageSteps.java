package com.rl.qa.steps;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.SeleniumUtilities;
import com.rl.qa.views.VMImageViews;
import cucumber.api.java.en.And;
import cucumber.api.java.en.Then;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

/**
 * Created by RLE0372 on 11-08-2016.
 */
public class VMImageSteps {
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    private static final com.rl.qa.utils.SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);

    @And("^I select \"([^\"]*)\" type$")
    public void iSelectOSType(String osType) throws Throwable {
        VMImageViews.selectOS(osType);
    }

    @Then("^I verify created \"([^\"]*)\" in the Images table$")
    public void iVerifyCreatedInTheImagesTable(String imageName) throws Throwable {
        VMImageViews.verifyCreatedImage(imageName);
    }

    @Then("^I select \"([^\"]*)\" and verify assigned \"([^\"]*)\" in Images table$")
    public void iSelectAndVerifyAssignedInImagesTable(String imageName, String imageDetail ) throws Throwable {
        VMImageViews.verifyVMImageDetails(imageName,imageDetail);
    }

    @Then("^I select \"([^\"]*)\" and verify given \"([^\"]*)\" in Images table$")
    public void iSelectAndVerifyGivenInImagesTable(String imageName, String imageDetail) throws Throwable {
        VMImageViews.verifyImageId(imageName,imageDetail);
    }

    @And("^I select \"([^\"]*)\" from the select box in VMImage page$")
    public void iSelectFromTheSelectBoxInVMImagePage(String orgName) throws Throwable {
        VMImageViews.selectOrgInVMImagePage(orgName);
    }
}

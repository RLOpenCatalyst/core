package com.rl.qa.steps;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.SeleniumUtilities;
import com.rl.qa.views.ConfigureNexusServerViews;
import cucumber.api.java.en.And;
import cucumber.api.java.en.Then;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

/**
 * Created by RLE0372 on 09-08-2016.
 */
public class ConfigureNexusServerSteps {
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    private static final com.rl.qa.utils.SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);

    @Then("^I verify \"([^\"]*)\" in the nexus server management table$")
    public void iVerifyInTheNexusServerManagementTable(String nexusServerName) throws Throwable {
        ConfigureNexusServerViews.verifyNexusServerName(nexusServerName);
    }

    @Then("^I verify \"([^\"]*)\" with \"([^\"]*)\" in the nexus server management table$")
    public void iVerifyWithInTheNexusServerManagementTable(String nexusServerName, String nexusServerDetails) throws Throwable {
        ConfigureNexusServerViews.verifyNexusServerInfo(nexusServerName,nexusServerDetails);
    }

    @And("^I select \"([^\"]*)\" from the select box Nexus Configuration Management page$")
    public void iSelectFromTheSelectBoxNexusConfigurationManagementPage(String orgName) throws Throwable {
        ConfigureNexusServerViews.selectOrgInNexusConfigPage(orgName);
    }
}

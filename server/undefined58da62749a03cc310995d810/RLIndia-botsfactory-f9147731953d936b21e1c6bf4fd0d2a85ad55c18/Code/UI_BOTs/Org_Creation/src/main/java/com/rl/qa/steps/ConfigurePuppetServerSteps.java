package com.rl.qa.steps;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.SeleniumUtilities;
import com.rl.qa.views.ConfigurePuppetServerViews;
import cucumber.api.java.en.And;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;
/**
 * Created by RLE0372 on 01-08-2016.
 */
public class ConfigurePuppetServerSteps {
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    private static final com.rl.qa.utils.SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);


    @And("^I click on puppet server link$")
    public void iClickOnPuppetServerLink() throws Throwable {
        ConfigurePuppetServerViews.clickOnPuppetServerLink();
    }


    @And("^I enter the \"([^\"]*)\" in edit box$")
    public void iEnterTheInEditBox(String puppetServerName) throws Throwable {
        ConfigurePuppetServerViews.enterPuppetServerName(puppetServerName);
    }


    @And("^I Enter puppet server \"([^\"]*)\" in User Name edit box$")
    public void iEnterPuppetServerInUserNameEditBox(String userName) throws Throwable {
        ConfigurePuppetServerViews.enterUserName(userName);
    }

    @And("^I enter \"([^\"]*)\" in edit box$")
    public void iEnterInEditBox(String hostName) throws Throwable {
        ConfigurePuppetServerViews.enterHostName(hostName);
    }

    @And("^I enter \"([^\"]*)\" in password edit box$")
    public void iEnterInPasswordEditBox(String password) throws Throwable {
        ConfigurePuppetServerViews.enterPuppetPassword(password);
    }
}

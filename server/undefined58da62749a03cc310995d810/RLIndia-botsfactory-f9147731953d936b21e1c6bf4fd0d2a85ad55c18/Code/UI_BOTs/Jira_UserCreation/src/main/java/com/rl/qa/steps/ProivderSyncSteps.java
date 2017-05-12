package com.rl.qa.steps;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.SeleniumUtilities;
import cucumber.api.PendingException;
import cucumber.api.java.en.And;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

/**
 * Created by rle0346 on 11/8/16.
 */
public class ProivderSyncSteps {
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    private static final com.rl.qa.utils.SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);

    @And("^I Click on Teams Link$")
    public void iClickOnTeamsLink() throws Throwable {

    }


    @And("^Clicks on New Team Button$")
    public void clicksOnNewTeamButton() throws Throwable {

    }


    @And("^Enters the Team Name$")
    public void entersTheTeamName() throws Throwable {

    }

    @And("^Enters the Team Description$")
    public void entersTheTeamDescription() throws Throwable {

    }
}

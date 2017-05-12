package com.rl.qa.steps;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.CucumberContext;
import com.rl.qa.utils.SeleniumUtilities;
import com.rl.qa.views.JIRAViews;
import com.rl.qa.views.LoginViews;
import cucumber.api.PendingException;
import cucumber.api.java.en.And;
import cucumber.api.java.en.Given;
import cucumber.api.java.en.Then;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.support.PageFactory;

import java.io.File;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.logging.Level;
import java.util.logging.Logger;

import static com.google.common.base.Strings.isNullOrEmpty;
import static com.rl.qa.utils.CucumberContext.getCucumberContext;
import static junit.framework.Assert.assertNotNull;


/**
 * Created by rle0346 on 7/7/16.
 */
public class JiraSteps {

    @And("^I click on \"([^\"]*)\" option at top right$")
    public void iClickOnOptionAtTopRight(String arg0) throws Throwable {
        JIRAViews.clickOnAdministrationlink();

    }


    @And("^I Click on \"([^\"]*)\" option$")
    public void iClickOnOption(String arg0) throws Throwable {
        JIRAViews.clickOnUserManagementOption();

    }

    @And("^I Enter the \"([^\"]*)\" of the user$")
    public void iEnterTheOfTheUser(String Fullname) throws Throwable {
        JIRAViews.enterFullname(Fullname);
    }


    @And("^I Enter the \"([^\"]*)\"$")
    public void iEnterThe(String Emailaddress) throws Throwable {
        JIRAViews.enterEmailaddress(Emailaddress);

    }


    @And("^I Click on \"([^\"]*)\" button$")
    public void iClickOnButton(String arg0) throws Throwable {
        JIRAViews.clickonCreateUsersButton();

    }


    @And("^I verify the created user \"([^\"]*)\" in the table$")
    public void iVerifyTheCreatedUserInTheTable(String FullName) throws Throwable {
        JIRAViews.verifyCreatedUser(FullName);

    }

    @And("^I Close the Unwanted Popup$")
    public void iCloseTheUnwantedPopup() throws Throwable {
        JIRAViews.clickOnUnwantedPopup();
    }


    @And("^I Click on the created user \"([^\"]*)\" link$")
    public void iClickOnTheCreatedUserLink(String FullName) throws Throwable {
        JIRAViews.clickOnCreatedUserLink(FullName);

    }

    @And("^I Click on Deactivate dropdown$")
    public void iClickOnDeactivateDropdown() throws Throwable {
        JIRAViews.clickOnDeactivateDropdown();

    }


    @And("^I Select the \"([^\"]*)\" option$")
    public void iSelectTheOption(String arg0) throws Throwable {
        JIRAViews.clickOnDeleteOption();

    }

    @And("^I Confirm the User Deletion by clicking on \"([^\"]*)\" button$")
    public void iConfirmTheUserDeletionByClickingOnButton(String arg0) throws Throwable {
        JIRAViews.confirmDeleteButton();


    }


    @And("^I Click on UserProfile Account$")
    public void iClickOnUserProfileAccount() throws Throwable {
        JIRAViews.clickOnUserProfileAccount();

    }



}



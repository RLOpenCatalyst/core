package com.rl.qa.steps;


import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.CucumberContext;
import com.rl.qa.utils.SeleniumUtilities;
import com.rl.qa.views.LoginViews;
import cucumber.api.Scenario;
import cucumber.api.java.After;
import cucumber.api.java.Before;
import cucumber.api.java.en.And;
import cucumber.api.java.en.Given;
import cucumber.api.java.en.Then;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.PageFactory;

import java.net.URL;
import java.util.logging.Level;
import java.util.logging.Logger;

import static com.rl.qa.utils.CucumberContext.getCucumberContext;
import static junit.framework.Assert.assertNotNull;

/**
 * Created by RLE0097 on 21-06-2016.
 */
public class LoginSteps {
    private static WebDriver driver;
    private static Scenario scenario;


    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    private static final com.rl.qa.utils.SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);

    @Then("^I Login to IWMS using \"([^\"]*)\" access credentials$")
    public void I_Login_to_IWMS_using_access_credentials(String loginName) throws Throwable {
        try {
            boolean flag = false;
            String strUserName, strPassword;

            strUserName = CucumberContext.getUserName();
            strPassword = CucumberContext.getPassword();

            URL url = CucumberContext.getURL();

            assertNotNull(url);

            String appURL = url.toString();

            assertNotNull(appURL);

            // Load browser and point it at configured IWMS web-ui.
            BrowserDriver.loadPage(appURL);

            Boolean loggedIn = (Boolean) getCucumberContext().get("loggedIn");
            if (loggedIn != null && loggedIn) {
                logger.info("Already logged in, reusing authenticated session(1).");
                return;
            }


            logger.info("Logged in successfully.");
//            } else
//                logger.info("Login to IWMS using " + loginName + " access credentials does not exist in excel spreadsheet");
        } catch (Exception e) {
            BaseView.takeScreenshot("I_Login_to_IWMS_using_access_credentials");
            String msg = String.format("Unable to login and see expected dashboard: %s", e.getMessage());
            logger.log(Level.SEVERE, msg, e);
            logger.info("Created new WebDriver instance as old one was failing to respond.");
//            fail(msg);
        }
    }


    // Login method for JIRA TESTCASE
    @Given("^I login to jira using \"([^\"]*)\" and access credentials \"([^\"]*)\"$")
    public void iLoginToJiraUsingAndAccessCredentials(String username, String password) throws Throwable {
        try {
            boolean flag = false;
            String strUserName,strPassword;

            strUserName = username;//CucumberContext.getUserName();
            strPassword = password;//CucumberContext.getPassword();

            URL url = CucumberContext.getURL();

            assertNotNull(url);

            String appURL = url.toString();

            assertNotNull(appURL);

            // Load browser and point it at configured IWMS web-ui.
            BrowserDriver.loadPage(appURL);

            LoginViews.enterUsername(strUserName);
            LoginViews.enterJiraPassword(strPassword);
            LoginViews.clickJiraLoginButton();

            Boolean loggedIn = (Boolean) getCucumberContext().get("loggedIn");
            if (loggedIn != null && loggedIn) {
                logger.info("Already logged in, reusing authenticated session(1).");
                return;
            }


            logger.info("Logged in successfully.");
        }
        catch(Exception e){

            e.printStackTrace();


        }



    }





















    @Given("^I Login to catalyst using \"([^\"]*)\" access credentials$")
    public void I_Login_to_catalyst_using_access_credentials(String loginName) throws Throwable {
        try {
            boolean flag = false;
            String strUserName, strPassword;

            strUserName = loginName;//CucumberContext.getUserName();
            strPassword = "superadmin@123";//CucumberContext.getPassword();

            URL url = CucumberContext.getURL();

            assertNotNull(url);

            String appURL = url.toString();

            assertNotNull(appURL);

            // Load browser and point it at configured IWMS web-ui.
            BrowserDriver.loadPage(appURL);

            LoginViews.enterUsername(strUserName);
            LoginViews.enterPassword(strPassword);
            LoginViews.clickLoginButton();

            /*Boolean loggedIn = (Boolean) getCucumberContext().get("loggedIn");
            if (loggedIn != null && loggedIn) {
                logger.info("Already logged in, reusing authenticated session(1).");
                return;
            }*/


            logger.info("Logged in successfully.");
        } catch (Exception e) {
            BaseView.takeScreenshot("I_Login" + loginName + "_using_access_credentials");
            String msg = String.format("Unable to login and see expected dashboard: %s", e.getMessage());
            logger.log(Level.SEVERE, msg, e);
            logger.info("Created new WebDriver instance as old one was failing to respond.");
        }
    }

    @Given("^I Login to created new stack using \"([^\"]*)\" access credentials$")
    public void I_Login_to_created_new_stack_using_access_credentials(String loginName) throws Throwable {
        try {
            boolean flag = false;
            String strUserName, strPassword;

            strUserName = "superadmin";//CucumberContext.getUserName();
            strPassword = "superadmin@123";//CucumberContext.getPassword();

            URL url = CucumberContext.getURL();

            assertNotNull(url);

            String appURL = url.toString();

            assertNotNull(appURL);

            // Load browser and point it at configured IWMS web-ui.
            BrowserDriver.loadPage(appURL);

            LoginViews.enterUsername(strUserName);
            LoginViews.enterPassword(strPassword);
            LoginViews.clickLoginButton();

            Boolean loggedIn = (Boolean) getCucumberContext().get("loggedIn");
            if (loggedIn != null && loggedIn) {
                logger.info("Already logged in, reusing authenticated session(1).");
                return;
            }


            logger.info("Logged in successfully.");
        } catch (Exception e) {
            BaseView.takeScreenshot("I_Login" + loginName + "_using_access_credentials");
            String msg = String.format("Unable to login and see expected dashboard: %s", e.getMessage());
            logger.log(Level.SEVERE, msg, e);
            logger.info("Created new WebDriver instance as old one was failing to respond.");
        }
    }

    @Given("^I Login to created new stack \"([^\"]*)\" using \"([^\"]*)\" access credentials$")
    public void I_Login_to_created_new_stack_using_access_credentials(String strStackName, String strLoginName) throws Throwable {
        try {
            Thread.sleep(200000);
            boolean flag = false;
            String strUserName, strPassword;

            strUserName = strLoginName;//CucumberContext.getUserName();
            strPassword = "superadmin@123";//CucumberContext.getPassword();

//            URL url = strStackName+"."+"rlcatalyst.com"; CucumberContext.getURL();
            String url = "http://" + strStackName + ".rlcatalyst.com";
            assertNotNull(url);

            String appURL = url.toString();

            assertNotNull(appURL);

            // Load browser and point it at configured IWMS web-ui.
            BrowserDriver.loadPage(appURL);

            LoginViews.enterUsername(strUserName);
            LoginViews.enterPassword(strPassword);
            LoginViews.clickLoginButton();

            Boolean loggedIn = (Boolean) getCucumberContext().get("loggedIn");
            if (loggedIn != null && loggedIn) {
                logger.info("Already logged in, reusing authenticated session(1).");
                return;
            }


            logger.info("Logged in successfully.");
        } catch (Exception e) {
            BaseView.takeScreenshot("I_Login" + strLoginName + "_using_access_credentials");
            String msg = String.format("Unable to login and see expected dashboard: %s", e.getMessage());
            logger.log(Level.SEVERE, msg, e);
            logger.info("Created new WebDriver instance as old one was failing to respond.");
        }
    }

    @And("^I Sign Out$")
    public void I_Sign_Out() throws Throwable {
        LoginViews.signOut();
    }


   /* @Before
    public static void setUp(Scenario scenario) {
        scenario = scenario;
        System.out.println("I am at before");

    }*/

    /*@After
    public static void embedscreenshot(Scenario scenario) {

        if (scenario.isFailed()) {
            try {
                //encoded_img = @browser.driver.screenshot_as(:base64)
                byte[] screenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
                scenario.embed(screenshot, "image/png"); //stick it in the report
                System.out.println("I am at after");

            } catch (Exception e) {
                e.pintStackTrace();
            }
        }

    }*/


    //Sign out Method for jira account
    @And("^I Sign out of Jira Account$")
    public void iSignOutOfJiraAccount() throws Throwable {
        LoginViews.jirasignout();


    }


}




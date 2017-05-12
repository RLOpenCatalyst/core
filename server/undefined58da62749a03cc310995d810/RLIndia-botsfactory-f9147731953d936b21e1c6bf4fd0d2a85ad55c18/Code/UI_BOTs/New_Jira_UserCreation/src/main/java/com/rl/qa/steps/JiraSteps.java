package com.rl.qa.steps;

import com.rl.qa.utils.BaseView;
import com.rl.qa.views.JIRAViews;
import cucumber.api.java.en.And;

import java.io.InputStream;
import java.util.Properties;


/**
 * Created by rle0346 on 7/7/16.
 */
public class JiraSteps {

    @And("^I click on \"([^\"]*)\" option at top right$")
    public void iClickOnOptionAtTopRight(String arg0) {
        try {
            JIRAViews.clickOnAdministrationlink();
        }catch (Exception ex){
            BaseView.takeScreenshot("I_Login_to_IWMS_using_access_credentials");
            String msg = String.format("", ex.getMessage());
            ex.printStackTrace();
        }
    }


    @And("^I Click on \"([^\"]*)\" option$")
    public void iClickOnOption(String arg0) throws Throwable {
        try {
            JIRAViews.clickOnUserManagementOption();
        }catch (Exception ex){
        BaseView.takeScreenshot("I_Login_to_IWMS_using_access_credentials");
        String msg = String.format("", ex.getMessage());
        ex.printStackTrace();
    }
}

    @And("^I Enter the \"([^\"]*)\" of the user$")
    public void iEnterTheOfTheUser(String Fullname) {
        try{
        ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
        InputStream stream = classLoader.getResourceAsStream("lx-selenium.properties");
        Properties properties = new Properties();
        properties.load(stream);

        String fullname = properties.getProperty("iwms.fullname", "not_filtered");
        System.out.println(fullname);

        JIRAViews.enterFullname(fullname);
        }catch (Exception ex){
            BaseView.takeScreenshot("I_Login_to_IWMS_using_access_credentials");
            String msg = String.format("", ex.getMessage());
            ex.printStackTrace();
        }

    }


    @And("^I Enter the \"([^\"]*)\"$")
    public void iEnterThe(String Emailaddress) {
        try{
        ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
        InputStream stream = classLoader.getResourceAsStream("lx-selenium.properties");
        Properties properties = new Properties();
        properties.load(stream);

        String email = properties.getProperty("iwms.email", "not_filtered");
        System.out.println(email);


        JIRAViews.enterEmailaddress(email);
        }catch (Exception ex){
            BaseView.takeScreenshot("I_Login_to_IWMS_using_access_credentials");
            String msg = String.format("", ex.getMessage());
            ex.printStackTrace();
        }

    }


    @And("^I Click on \"([^\"]*)\" button$")
    public void iClickOnButton(String arg0) {
        try{
         JIRAViews.clickonCreateUsersButton();
        }catch (Exception ex){
            BaseView.takeScreenshot("I_Login_to_IWMS_using_access_credentials");
            String msg = String.format("", ex.getMessage());
            ex.printStackTrace();
        }

    }


    @And("^I verify the created user \"([^\"]*)\" in the table$")
    public void iVerifyTheCreatedUserInTheTable(String FullName)  {
        try{
        ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
        InputStream stream = classLoader.getResourceAsStream("lx-selenium.properties");
        Properties properties = new Properties();
        properties.load(stream);

        String fullname = properties.getProperty("iwms.fullname", "not_filtered");
        System.out.println(fullname);

        JIRAViews.verifyCreatedUser(fullname);
        }catch (Exception ex){
            BaseView.takeScreenshot("I_Login_to_IWMS_using_access_credentials");
            String msg = String.format("", ex.getMessage());
            ex.printStackTrace();
        }


    }

    @And("^I Close the Unwanted Popup$")
    public void iCloseTheUnwantedPopup(){
        try{
        JIRAViews.clickOnUnwantedPopup();
        }catch (Exception ex){
            BaseView.takeScreenshot("I_Login_to_IWMS_using_access_credentials");
            String msg = String.format("", ex.getMessage());
            ex.printStackTrace();
        }

    }


    @And("^I Click on the created user \"([^\"]*)\" link$")
    public void iClickOnTheCreatedUserLink(String FullName){
        try{
        ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
        InputStream stream = classLoader.getResourceAsStream("lx-selenium.properties");
        Properties properties = new Properties();
        properties.load(stream);

        String fullname = properties.getProperty("iwms.fullname", "not_filtered");
        System.out.println(fullname);

        JIRAViews.clickOnCreatedUserLink(fullname);
        }catch (Exception ex){
            BaseView.takeScreenshot("I_Login_to_IWMS_using_access_credentials");
            String msg = String.format("", ex.getMessage());
            ex.printStackTrace();
        }


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
    public void iClickOnUserProfileAccount() {
        try{
        JIRAViews.clickOnUserProfileAccount();
        }catch (Exception ex){
            BaseView.takeScreenshot("I_Login_to_IWMS_using_access_credentials");
            String msg = String.format("", ex.getMessage());
            ex.printStackTrace();
        }


    }


}



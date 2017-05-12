package com.rl.qa.views;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.PageFactory;

import static junit.framework.TestCase.fail;

/**
 * Created by rle0346 on 7/7/16.
 */
public class JIRAViews {
    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    public static WebElement PagesFrame;

    public static void clickOnAdministrationlink(){
        try {
            SeleniumUtil.waitForElementIsClickable("id", "admin_menu",8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("id", "admin_menu", SeleniumUtilities.OBJWAITTIMEOUT);


        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    public static void clickOnUserManagementOption()
    {
        try {
            Thread.sleep(2000);
            SeleniumUtil.waitForElementIsClickable("id", "user_management_section",8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("id", "user_management_section", SeleniumUtilities.OBJWAITTIMEOUT);


        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    public static void enterFullname(String Fullname)
    {
        try {
            Thread.sleep(2000);
            SeleniumUtil.type("xpath", ".//*[@id='user-quick-create']/div[1]/input[1]",Fullname, SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void enterEmailaddress(String EmailAddress)
    {
        try {
            Thread.sleep(2000);
            SeleniumUtil.type("xpath", ".//*[@id='user-quick-create']/div[1]/input[2]",EmailAddress, SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void clickonCreateUsersButton()
    {
        try {
            Thread.sleep(2000);
            SeleniumUtil.waitForElementIsClickable("id", "new-user-quick-add-submit", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("id", "new-user-quick-add-submit", SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){

            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyCreatedUser(String Fullname)
    {
        try {
            Thread.sleep(2000);
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='page-data']/table/tbody/tr/td/a[text()='"+Fullname+"']", 18, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.waitUntilElementContainsText("xpath",".//*[@id='page-data']/table/tbody/tr/td/a[text()='"+Fullname+"']",Fullname,200,SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("verifyStackName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnCreatedUserLink(String Fullname)
    {
        try {
            Thread.sleep(3000);
            SeleniumUtil.waitForElementIsClickable("xpath", "//a[text()='"+Fullname+"']",8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath", "//a[text()='"+Fullname+"']", SeleniumUtilities.OBJWAITTIMEOUT);

        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    public static void clickOnUnwantedPopup()
    {
        try {
            Thread.sleep(2000);
            SeleniumUtil.waitForElementIsClickable("xpath", "(//span[@class='aui-icon icon-close'])[1]",8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath", "(//span[@class='aui-icon icon-close'])[1]", SeleniumUtilities.OBJWAITTIMEOUT);

        } catch (Exception e) {
            e.printStackTrace();
        }



    }


    public static void clickOnDeactivateDropdown()
    {
        try {
            Thread.sleep(2000);
            SeleniumUtil.waitForElementIsClickable("id", "delete-user-button-dropdown",8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("id", "delete-user-button-dropdown", SeleniumUtilities.OBJWAITTIMEOUT);

        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    public static void clickOnDeleteOption() {
        try {
            Thread.sleep(2000);
            SeleniumUtil.waitForElementIsClickable("id", "delete-user-button", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("id", "delete-user-button", SeleniumUtilities.OBJWAITTIMEOUT);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void confirmDeleteButton()
    {
        try {
            SeleniumUtil.waitForElementIsClickable("id", "user-delete-submit", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("id", "user-delete-submit", SeleniumUtilities.OBJWAITTIMEOUT);

        } catch (Exception e) {
            e.printStackTrace();
        }


    }

    public static void clickOnUserProfileAccount()
    {
        try {
            Thread.sleep(1000);
            SeleniumUtil.waitForElementIsClickable("xpath", ".//*[@id='header']/nav/div[2]/ul/li[3]/a",8, SeleniumUtilities.OBJWAITTIMEOUT);
            Thread.sleep(2000);
            SeleniumUtil.click("xpath", ".//*[@id='header']/nav/div[2]/ul/li[3]/a", SeleniumUtilities.OBJWAITTIMEOUT);


        } catch (Exception e) {
            e.printStackTrace();
        }
    }


}






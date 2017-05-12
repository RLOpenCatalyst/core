package com.rl.qa.views;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import org.openqa.selenium.support.PageFactory;

import static junit.framework.TestCase.fail;

/**
 * Created by RLE0097 on 21-06-2016.
 */
public class LoginViews {
    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    public static void enterUsername(String strUserName){
        try {
            SeleniumUtil.type("xpath","//section[label[text()='Username']]/label[@class='loginform_input']/input", strUserName, SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("enterUsername");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void enterPassword(String strPassword){
        try {
            SeleniumUtil.type("xpath", "//section[label[text()='Password']]/label[@class='loginform_input']/input", strPassword, SeleniumUtilities.OBJWAITTIMEOUT);
            System.out.println();
        }
        catch(Exception ex){
            BaseView.takeScreenshot("enterPassword");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickLoginButton(){
        try {
            SeleniumUtil.click("id", "loginBtn", SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("clickLoginButton");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void signOut(){
        try {
            Thread.sleep(2000);
            SeleniumUtil.waitForElementIsClickable("id","logout",8,SeleniumUtilities.OBJWAITTIMEOUT);
//          SeleniumUtil.click("cssselector", "a[title='Sign Out']", SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("id","logout",SeleniumUtilities.OBJWAITTIMEOUT);
            Thread.sleep(2000);
            SeleniumUtil.waitForElementIsClickable("xpath","//button[text()=' Yes']",8,SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath","//button[text()=' Yes']",SeleniumUtilities.OBJWAITTIMEOUT);

    }

        catch(Exception ex){
            BaseView.takeScreenshot("signOut");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }


}

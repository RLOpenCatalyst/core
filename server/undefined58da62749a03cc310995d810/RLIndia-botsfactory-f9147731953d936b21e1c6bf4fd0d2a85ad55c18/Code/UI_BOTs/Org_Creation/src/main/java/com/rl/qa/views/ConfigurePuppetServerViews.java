package com.rl.qa.views;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import org.openqa.selenium.support.PageFactory;

import static junit.framework.TestCase.fail;

/**
 * Created by RLE0372 on 01-08-2016.
 */
public class ConfigurePuppetServerViews {
    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);

    public static void clickOnPuppetServerLink() {
        try{
            SeleniumUtil.waitForElementIsClickable("linktext","Puppet Server",8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("linktext","Puppet Server",SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch (Exception ex)
        {
            BaseView.takeScreenshot("clickOnPuppetServerLink");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void enterPuppetServerName(String puppetServerName) {
        try{
            SeleniumUtil.waitForElementIsClickable("id","puppetservername",8,SeleniumUtil.OBJWAITTIMEOUT);
            SeleniumUtil.type("id","puppetservername","",SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch (Exception ex)
        {
            BaseView.takeScreenshot("enterPuppetServerName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void enterUserName(String userName) {
        try{
            SeleniumUtil.waitForElementIsClickable("id","username",8,SeleniumUtil.OBJWAITTIMEOUT);
            SeleniumUtil.type("id","username",userName,SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch (Exception ex)
        {
            BaseView.takeScreenshot("enterUserName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void enterHostName(String hostName) {
        try{
            SeleniumUtil.waitForElementIsClickable("id","hostname",8,SeleniumUtil.OBJWAITTIMEOUT);
            SeleniumUtil.type("id","hostname",hostName,SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch (Exception ex)
        {
            BaseView.takeScreenshot("enterHostName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void enterPuppetPassword(String password) {
        try{
            SeleniumUtil.waitForElementIsClickable("id","puppetpassword",8,SeleniumUtil.OBJWAITTIMEOUT);
            SeleniumUtil.type("id","puppetpassword",password,SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch (Exception ex)
        {
            BaseView.takeScreenshot("enterPuppetPassword");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }
}



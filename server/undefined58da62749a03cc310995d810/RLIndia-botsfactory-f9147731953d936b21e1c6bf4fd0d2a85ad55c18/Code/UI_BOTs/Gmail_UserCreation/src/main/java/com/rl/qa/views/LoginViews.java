package com.rl.qa.views;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.PageFactory;

import static junit.framework.Assert.assertTrue;
import static junit.framework.TestCase.fail;


/**
 * Created by RLE0097 on 21-06-2016.
 */
public class LoginViews {
    public static String gmail,yahoo;
    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    //Actions act = new Actions(driver);

    public static void enterUsername(String strUserName){
        try {
            SeleniumUtil.type("id","Email", strUserName, SeleniumUtilities.OBJWAITTIMEOUT);
            Thread.sleep(8000);
            WebElement wb=SeleniumUtil.getElement("id","Email",10);
            wb.sendKeys(Keys.TAB);
            Thread.sleep(3000);
            wb.sendKeys(Keys.ENTER);
//            SeleniumUtil.findWebElement("name","signIn",10);
            Thread.sleep(8000);
            System.out.println("I Entered the Gmail Email Address");

        }
        catch(Exception ex){
            BaseView.takeScreenshot("enterUsername");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void enterYahooUsername(String strUserName){
        try {
//            SeleniumUtil.click("xpath","//*[@title='Sign in']",10);
            SeleniumUtil.type("id","login-username", strUserName, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("id","login-signin",10);
            System.out.println("I Entered the Yahoo Email Address");

        }
        catch(Exception ex){
            BaseView.takeScreenshot("enterUsername");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }


    public static void enterPassword(String strPassword){
        try {
            Thread.sleep(8000);
            SeleniumUtil.type("id", "Passwd", strPassword, SeleniumUtilities.OBJWAITTIMEOUT);
            System.out.println("I Entered the Gmail Password");
        }
        catch(Exception ex){
            BaseView.takeScreenshot("enterPassword");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void enterYahooPassword(String strPassword){
        try {
            Thread.sleep(1000);
            SeleniumUtil.findWebElement(".//*[@id='login-passwd']");
            SeleniumUtil.type("xpath",".//*[@id='login-passwd']", strPassword, SeleniumUtilities.OBJWAITTIMEOUT);
            System.out.println("I Entered the Yahoo Password");
        }
        catch(Exception ex){
            BaseView.takeScreenshot("enterPassword");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }


    public static void clickLoginButton(){
        try {
            Thread.sleep(4000);
            SeleniumUtil.click("xpath", ".//*[@id='signIn']", SeleniumUtilities.OBJWAITTIMEOUT);
            System.out.println("I Clicked on Gmail login button");
            Thread.sleep(8000);
            //SeleniumUtil.click("css",".T-I.J-J5-Ji.T-I-KE.L3",8);
            //SeleniumUtil.waitForElementVisibilityOf("xpath","//*[@title='Starred']",8, 10);
            //assertTrue(SeleniumUtil.verifyTextValue("xpath", "//*[@title='Starred']", "Starred" , SeleniumUtilities.OBJWAITTIMEOUT));
            //assertTrue(SeleniumUtil.verifyTextValue("xpath", "//*[@title='Starred']", "Starred" , SeleniumUtilities.OBJWAITTIMEOUT));
            //assertTrue(SeleniumUtil.isElementPresent(By.xpath("//div[text()='COMPOSE']")));
            assertTrue(SeleniumUtil.isElementPresent(By.xpath("//*[@title='Starred']")));
            System.out.println("I am able to see the starred button now");
        }
        catch(Exception ex){
            BaseView.takeScreenshot("clickLoginButton");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickYahooLoginButton(){
        try {
            SeleniumUtil.click("id", "login-signin", SeleniumUtilities.OBJWAITTIMEOUT);
            System.out.println("I Clicked on Yahoo login button");
            Thread.sleep(4000);
            //assertTrue(SeleniumUtil.verifyTextValue("xpath", "//b[text()='Home']", "Home" , SeleniumUtilities.OBJWAITTIMEOUT));
            assertTrue(SeleniumUtil.isElementPresent(By.xpath("//*[@id='uh-logo']")));
            System.out.println("I am able to see Home button");

        }
        catch(Exception ex){
            BaseView.takeScreenshot("clickLoginButton");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void signOutGmail(){
        try {
            Thread.sleep(4000);
            //SeleniumUtil.click("xpath","//div[@class='gb_uc gb_hb gb_yf gb_R']",SeleniumUtilities.OBJWAITTIMEOUT);
            //SeleniumUtil.waitForElementIsClickable("xpath","//span[@class='gb_8a gbii']",8,SeleniumUtilities.OBJWAITTIMEOUT);
//          SeleniumUtil.click("cssselector", "a[title='Sign Out']", SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath","//span[@class='gb_8a gbii']",SeleniumUtilities.OBJWAITTIMEOUT);
            Thread.sleep(3000);
            SeleniumUtil.waitForElementIsClickable("xpath","//a[text()='Sign out']",8,SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath","//a[text()='Sign out']",SeleniumUtilities.OBJWAITTIMEOUT);
            Thread.sleep(5000);
            assertTrue(SeleniumUtil.isElementPresent(By.xpath("//*[@value='Sign in']")));
        }

        catch(Exception ex){
            BaseView.takeScreenshot("signOut");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void signOutYahoo(){
        try {
            Thread.sleep(4000);
            SeleniumUtil.click("xpath","//li[@id='uh-profile']",10);
            Thread.sleep(2000);
            SeleniumUtil.click("xpath","//*[@id='uh-signout']",SeleniumUtilities.OBJWAITTIMEOUT);
            Thread.sleep(3000);
            assertTrue(SeleniumUtil.isElementPresent(By.xpath("//*[@id='uh-signin']")));


            //SeleniumUtil.waitForElementIsClickable("xpath","//span[@class='gb_8a gbii']",8,SeleniumUtilities.OBJWAITTIMEOUT);
//          SeleniumUtil.click("cssselector", "a[title='Sign Out']", SeleniumUtilities.OBJWAITTIMEOUT);
            //SeleniumUtil.click("xpath","//span[@class='gb_8a gbii']",SeleniumUtilities.OBJWAITTIMEOUT);
            //Thread.sleep(2000);
            //SeleniumUtil.waitForElementIsClickable("xpath","//a[text()='Sign out']",8,SeleniumUtilities.OBJWAITTIMEOUT);
            //SeleniumUtil.click("xpath","//a[text()='Sign out']",SeleniumUtilities.OBJWAITTIMEOUT);

        }

        catch(Exception ex){
            BaseView.takeScreenshot("signOut");
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


    public static void checkURLForApplication()
    {

    }


    public static void whichApplicationToLaunch(String strEmailAppName)
    {
        try
        {
            if(strEmailAppName == gmail)
            {
                System.out.println("Its an Gmail application");



            }
            else if (strEmailAppName == yahoo)
            {
                System.out.println("Its an Yahoo application");

            }
            else
            {
                System.out.println("Nonoe of the gmail or yahoo application will be opened");
            }
        }
        catch (Exception e)
        {
            e.printStackTrace();

        }

    }


    public static void loggedout()
    {
        System.out.println("Logged out of application successfully");
    }


}

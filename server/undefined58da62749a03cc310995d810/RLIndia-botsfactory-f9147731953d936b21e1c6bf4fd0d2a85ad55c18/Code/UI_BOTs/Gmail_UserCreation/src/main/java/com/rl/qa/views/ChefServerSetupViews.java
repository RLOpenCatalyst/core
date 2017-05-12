package com.rl.qa.views;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.steps.LoginSteps;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import cucumber.api.java.eo.Se;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.remote.LocalFileDetector;
import org.openqa.selenium.remote.RemoteWebElement;
import org.openqa.selenium.support.PageFactory;

import java.io.File;
import java.util.logging.Logger;

import static junit.framework.Assert.assertTrue;
import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.fail;

/**
 * Created by RLE0372 on 20-07-2016.
 */
public class ChefServerSetupViews {
    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());

    public static void enterServerName(String chefServerName) {
        try{
            SeleniumUtil.waitForElementIsClickable("id","configname",8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.type("id","configname",chefServerName,SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("typeServerName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void enterUserName(String userName) {
        try{
            SeleniumUtil.waitForElementIsClickable("id","loginname",8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.type("id","loginname",userName,SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("typeUserName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void enterURL(String url) {
        try{
            SeleniumUtil.waitForElementIsClickable("id","url",8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.type("id","url",url,SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("typeURL");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

//    public static void clickOnPemFileBrowse() {
//        try{
//            String path  = new String(new File(".").getCanonicalPath() + "\\src\\test\\resources\\Upload\\mycatqa.pem");
////            System.out.println(path);
////            logger.info(path);
//            WebDriver driver=SeleniumUtil.getWebDriver();
//            driver.findElement(By.xpath("//input[@id='userpemfile']")).sendKeys(path);
//        }
//        catch(Exception ex){
//            BaseView.takeScreenshot("clickOnPemFileBrowse");
//            SeleniumUtil.Log.info("Error :" + ex.getMessage());
//            fail(ex.getMessage());
//        }
//    }
//
//    public static void clickOnKnifeBrowse() {
//        try{
//            Thread.sleep(5000);
//            String path  = new String(new File(".").getCanonicalPath() + "\\src\\test\\resources\\Upload\\knife.rb");
////            System.out.println(path);
////            logger.info(path);
//            WebDriver driver=SeleniumUtil.getWebDriver();
//            driver.findElement(By.xpath("//input[@id='kniferbfile']")).sendKeys(path);
//        }
//        catch(Exception ex){
//            BaseView.takeScreenshot("clickOnPemFileBrowse");
//            SeleniumUtil.Log.info("Error :" + ex.getMessage());
//            fail(ex.getMessage());
//        }
//    }

    public static void BrowsePemFileForChefServer() {
        try{
            WebDriver driver=SeleniumUtil.getWebDriver();
            WebElement element = driver.findElement(By.id("userpemfile"));
            LocalFileDetector detector = new LocalFileDetector();
            String path = new String(new File(".").getCanonicalPath() + "/src/test/resources/Upload/mycatqa.pem");
            File f = detector.getLocalFile(path);
            ((RemoteWebElement)element).setFileDetector(detector);
            element.sendKeys(f.getAbsolutePath());
//            element.sendKeys(path);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("clickOnPemFileBrowse");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void BrowseKnifeFileForChefServer() {
        try{
            WebDriver driver=SeleniumUtil.getWebDriver();
            WebElement element = driver.findElement(By.id("kniferbfile"));
            LocalFileDetector detector = new LocalFileDetector();
            String path = new String(new File(".").getCanonicalPath() + "/src/test/resources/Upload/knife.rb");
            File f = detector.getLocalFile(path);
            ((RemoteWebElement)element).setFileDetector(detector);
            element.sendKeys(f.getAbsolutePath());
//            element.sendKeys(path);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("clickOnPemFileBrowse");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }


    public static void chefServerEditButton(String cherServerName,String Edit ) {
        try{
            Thread.sleep(1000);
            SeleniumUtil.waitForElementIsClickable("xpath",".//*[@id='envtable']//td[text()='"+cherServerName+"']/following-sibling::td//*[@title='"+Edit+"']",8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath",".//*[@id='envtable']//td[text()='"+cherServerName+"']/following-sibling::td//*[@title='"+Edit+"']",SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("chefServerEditButton");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void clearNameField() {
        try{
            SeleniumUtil.waitForElementIsClickable("id","configname",8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.clear("id","configname",SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("clearNameField");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyChefServerName(String chefServerName) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+chefServerName+"']",5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//*[text()='"+chefServerName+"']",chefServerName,SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info("Verified created chef server:"+chefServerName);
//            } else {
//                logger.info("Chef Server not found:" +chefServerName);
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyChefServerName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifySelectOrgISDisabled() {
        try {
            SeleniumUtil.waitForElementVisibilityOf("id","s2id_orgname",5, SeleniumUtilities.OBJWAITTIMEOUT);
            WebElement wb=SeleniumUtil.getElement("id","s2id_orgname",SeleniumUtilities.OBJWAITTIMEOUT);
            String actClassValOfElement=wb.getAttribute("class");
            String expClassValWhenEleIsDisabled="select2-container select2-container-disabled chooseOrganization width-100";
            assertTrue(actClassValOfElement.equals(expClassValWhenEleIsDisabled));
            logger.info("Select Organization is disbled");
//            } else {
//                logger.info("Element is enabled");
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifySelectOrgISDisabled");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }    }

    public static void verifyChefServerIsDeleted(String chefServerName) {
        try {
//            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+chefServerName+"']/following-sibling::td[2]", 1, SeleniumUtilities.OBJWAITTIMEOUT);
            assertFalse(SeleniumUtil.isElementExist("xpath", ".//*[@id='envtable']//*[text()='"+chefServerName+"']")); {
                logger.info(chefServerName+" does not exists : deleted");
//            } else {
//                logger.info(chefServerName+" does not exists : deleted");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyChefServerIsDeleted");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyServerDetails(String chefServerName, String chefUserName) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+chefServerName+"']/../td[text()='"+chefUserName+"']",5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//*[text()='"+chefServerName+"']/../td[text()='"+chefUserName+"']",chefUserName,SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info("Chef server" +chefServerName+" exists with :"+chefUserName);
//            } else {
//                logger.info("Chef server" +chefServerName+" does not exists with :"+chefUserName);
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("chefUserName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void uploadKnifeFile(String fileName) {
        try{
            WebDriver driver=SeleniumUtil.getWebDriver();
            WebElement element = driver.findElement(By.id("kniferbfile"));
            LocalFileDetector detector = new LocalFileDetector();
            String path = new String(new File(".").getCanonicalPath() + "/src/test/resources/Upload/jagadeesh12_ChefServerFile"+fileName);
            File f = detector.getLocalFile(path);
            ((RemoteWebElement)element).setFileDetector(detector);
            element.sendKeys(f.getAbsolutePath());
        }
        catch(Exception ex){
            BaseView.takeScreenshot("clickOnPemFileBrowse");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void uploadPemFile(String fileName) {
        try{
            WebDriver driver=SeleniumUtil.getWebDriver();
            WebElement element = driver.findElement(By.id("userpemfile"));
            LocalFileDetector detector = new LocalFileDetector();
            String path = new String(new File(".").getCanonicalPath() + "/src/test/resources/Upload/jagadeesh12_ChefServerFile/"+fileName);
            File f = detector.getLocalFile(path);
            ((RemoteWebElement)element).setFileDetector(detector);
            element.sendKeys(f.getAbsolutePath());
        }
        catch(Exception ex){
            BaseView.takeScreenshot("uploadPemFile");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }


    public static void selectTheOrg(String strOrgname) {
        try{
            //SeleniumUtil.waitForElementIsClickable("id","loginname",8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath", "//span[text()='Select an Organization']",SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath","//div[text()='"+strOrgname+"']",SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("selectOrg");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }
}


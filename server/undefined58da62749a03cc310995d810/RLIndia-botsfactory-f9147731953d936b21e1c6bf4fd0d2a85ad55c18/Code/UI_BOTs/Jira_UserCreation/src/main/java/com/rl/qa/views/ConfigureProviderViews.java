package com.rl.qa.views;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.steps.LoginSteps;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.remote.LocalFileDetector;
import org.openqa.selenium.remote.RemoteWebElement;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.io.File;
import java.util.logging.Logger;

import static junit.framework.TestCase.*;

/**
 * Created by RLE0372 on 02-08-2016.
 */
public class ConfigureProviderViews {

    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());

    public static void selectProviderType(String providerType) {

        try {
            SeleniumUtil.selectByVisibleText("id","providertype",providerType,SeleniumUtilities.OBJWAITTIMEOUT);
//            SeleniumUtil.waitForElementIsClickable("id","s2id_providertype",8, SeleniumUtilities.OBJWAITTIMEOUT);
//            SeleniumUtil.click("id","s2id_providertype",SeleniumUtilities.OBJWAITTIMEOUT);
//            SeleniumUtil.click("xpath",".//*[@id='select2-drop']//*[text()='"+providerType+"']",SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("selectProviderType");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void clickCredentialSelButton(String buttonID) {
        try {
            SeleniumUtil.waitForElementIsClickable("id",buttonID,8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.checkbox("id",buttonID,SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("clickCredentialSelButton");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void selectOrg(String orgName) {
        try {
            //SeleniumUtil.waitForElementIsClickable("xpath","//label[contains(text(),'Organization')]/following-sibling::div",8, SeleniumUtilities.OBJWAITTIMEOUT);
            //Thread.sleep(1000);
//            SeleniumUtil.click("xpath","//span[text()='Select an Organization']",SeleniumUtilities.OBJWAITTIMEOUT);
//            Thread.sleep(1000);
            //SeleniumUtil.waitForElementIsClickable("xpath","//*[text()='"+orgName+"']",8, SeleniumUtilities.OBJWAITTIMEOUT);
            //Thread.sleep(1000);
//            SeleniumUtil.click("xpath","//div[text()='"+orgName+"']", SeleniumUtilities.OBJWAITTIMEOUT);
            //select/option[@value='"+orgName+"']"
//            Thread.sleep(2000);
            SeleniumUtil.selectByVisibleText("id","orgname",orgName,SeleniumUtilities.OBJWAITTIMEOUT);

        }
        catch(Exception ex){
            BaseView.takeScreenshot("selectOrg");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void OrgSelct(String orgName) {
        try {
            SeleniumUtil.waitForElementIsClickable("xpath","//label[contains(text(),'Organization')]/following-sibling::div",8, SeleniumUtilities.OBJWAITTIMEOUT);
            Thread.sleep(1000);
            SeleniumUtil.click("xpath","//label[contains(text(),'Organization')]/following-sibling::div",SeleniumUtilities.OBJWAITTIMEOUT);
            Thread.sleep(1000);
            //SeleniumUtil.waitForElementIsClickable("xpath","//*[text()='"+orgName+"']",8, SeleniumUtilities.OBJWAITTIMEOUT);
            //Thread.sleep(1000);
            SeleniumUtil.click("xpath","//select[@id='orgId']/option[text()='"+orgName+"']", SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("selectOrg");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void selectRegion(String region) {
        try {
            SeleniumUtil.selectByVisibleText("name","region","US West (N. California) | us-west-1",SeleniumUtilities.OBJWAITTIMEOUT);
//            Thread.sleep(5000);
//            SeleniumUtil.waitForElementIsClickable("xpath","(//span[text()='Select Region'])[2]",8, SeleniumUtilities.OBJWAITTIMEOUT);
//            SeleniumUtil.click("xpath","(//span[text()='Select Region'])[2]",SeleniumUtilities.OBJWAITTIMEOUT);
//            SeleniumUtil.waitForElementIsClickable("xpath","//option[contains(text(),'"+region+"')]",8, SeleniumUtilities.OBJWAITTIMEOUT);
//            SeleniumUtil.click("xpath","//option[contains(text(),'"+region+"')]",SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("selectRegion");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void selectKeyPair(String keyPair) {
        try {
            SeleniumUtil.selectByVisibleText("name","keyPairName",keyPair, SeleniumUtilities.OBJWAITTIMEOUT);
//            SeleniumUtil.waitForElementIsClickable("xpath","//*[text()='Select Key Pair:']/following-sibling::div",8, SeleniumUtilities.OBJWAITTIMEOUT);
//            SeleniumUtil.click("xpath","//*[text()='Select Key Pair:']/following-sibling::div",SeleniumUtilities.OBJWAITTIMEOUT);
//            SeleniumUtil.waitForElementIsClickable("xpath","//*[text()='"+keyPair+"']",8, SeleniumUtilities.OBJWAITTIMEOUT);
//            SeleniumUtil.click("xpath","//*[text()='"+keyPair+"']",SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("selectKeyPair");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void browsePemFileForProvider() {
        try {
            WebDriver driver=SeleniumUtil.getWebDriver();
            WebElement element = driver.findElement(By.name("fileObject"));
            LocalFileDetector detector = new LocalFileDetector();
            String path = new String(new File(".").getCanonicalPath() + "/src/test/resources/Upload/bootstrapncal.pem");
            File f = detector.getLocalFile(path);
            ((RemoteWebElement)element).setFileDetector(detector);
            element.sendKeys(f.getAbsolutePath());
//            element.sendKeys(path);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("selectKeyPair");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyProvidersName(String providerName) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", "//*[contains(text(),'Azure')]", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.waitUntilElementContainsText("xpath","//*[contains(text(),'Azure')]",providerName,8,SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("verifyProvidersName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyMessage(String actMsg) {
        try {
            SeleniumUtil.waitUntilElementContainsText("xpath",".//*[contains(./text(),'"+actMsg+"')]",actMsg,SeleniumUtilities.OBJWAITTIMEOUT);
            WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), 500);
            wait.until(ExpectedConditions.textToBePresentInElement(By.tagName("*"), actMsg));
            SeleniumUtil.waitForElementVisibilityOf("xpath", "//*[contains(text(),'"+actMsg+"')]", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.verifyTextValue("xpath",".//*[contains(./text(),'"+actMsg+"')]",actMsg,SeleniumUtilities.OBJWAITTIMEOUT));{
                logger.info("Verified : " +actMsg);
            }
// else{
//                logger.info("Not Verified"+actMsg);
//            }
        }
        catch(Exception ex){
            BaseView.takeScreenshot("verifyProvidersName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }
    public static void browseAzurePemFile() {
        try {
            WebDriver driver=SeleniumUtil.getWebDriver();
            WebElement element = driver.findElement(By.id("azurepem"));
            LocalFileDetector detector = new LocalFileDetector();
            String path = new String(new File(".").getCanonicalPath() + "/src/test/resources/Upload/rlcatalyst.pem");
            File f = detector.getLocalFile(path);
            ((RemoteWebElement)element).setFileDetector(detector);
            element.sendKeys(f.getAbsolutePath());
//            element.sendKeys(path);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("selectKeyPair");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void browseAzurePrivateKeyFile() {
        try {
            WebDriver driver=SeleniumUtil.getWebDriver();
            WebElement element = driver.findElement(By.id("azurekey"));
            LocalFileDetector detector = new LocalFileDetector();
            String path = new String(new File(".").getCanonicalPath() + "/src/test/resources/Upload/rlcatalyst.key");
            File f = detector.getLocalFile(path);
            ((RemoteWebElement)element).setFileDetector(detector);
            element.sendKeys(f.getAbsolutePath());
//            element.sendKeys(path);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("selectKeyPair");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void browseOpenStackPemFile(String openStackpemFile) {
        try {
            WebDriver driver=SeleniumUtil.getWebDriver();
            WebElement element = driver.findElement(By.id("openstackinstancepem"));
            LocalFileDetector detector = new LocalFileDetector();
            String path = new String(new File(".").getCanonicalPath() + "/src/test/resources/Upload/"+ openStackpemFile);
            File f = detector.getLocalFile(path);
            ((RemoteWebElement)element).setFileDetector(detector);
            element.sendKeys(f.getAbsolutePath());
//            element.sendKeys(path);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("browseOpenStackPemFile");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyProviderName(String providerName) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+providerName+"']",5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue (SeleniumUtil.verifyTextValue("xpath",".//*[@id='envtable']//*[text()='"+providerName+"']",providerName,SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info("Verified : "+providerName);
//            } else {
//                logger.info("Not verified:" +providerName);
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyProvideDetails");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifySelProviderTypeisDisabled() {
        try {
            SeleniumUtil.waitForElementVisibilityOf("id","s2id_providertype",5, SeleniumUtilities.OBJWAITTIMEOUT);
            WebElement wb=SeleniumUtil.getElement("id","s2id_providertype",SeleniumUtilities.OBJWAITTIMEOUT);
            String actClassValOfElement=wb.getAttribute("class");
            String expClassValWhenEleIsDisabled="select2-container select2-container-disabled chooseOrganization width-100";
            assertTrue(actClassValOfElement.equals(expClassValWhenEleIsDisabled));{
                logger.info("Select provider type is disbled");
//            } else {
//                logger.info("Select provider type is enabled");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifySelProviderTypeIsDisabled");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }    }

    public static void verifyCredentialsAccessKeyIsDisabled(String credentialsAccessKeys) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("id",credentialsAccessKeys,5, SeleniumUtilities.OBJWAITTIMEOUT);
            WebElement wb=SeleniumUtil.getElement("id",credentialsAccessKeys,SeleniumUtilities.OBJWAITTIMEOUT);
            assertFalse(wb.isEnabled());{
                logger.info("Credentials Access Keys is enabled");
//            } else {
//                logger.info("Credentials Access Keys is disabled");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyCredentialsAccessKeyisDisabled");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }    }


    public static void verifySelectOrgIsDisabled() {
        try {
            SeleniumUtil.waitForElementVisibilityOf("id","s2id_orgId",5, SeleniumUtilities.OBJWAITTIMEOUT);
            WebElement wb=SeleniumUtil.getElement("id","s2id_orgId",SeleniumUtilities.OBJWAITTIMEOUT);
            String actClassValOfElement=wb.getAttribute("class");
            String expClassValWhenEleIsDisabled="select2-container select2-container-disabled chooseOrganization width-100";
            assertTrue(actClassValOfElement.equals(expClassValWhenEleIsDisabled));{
                logger.info("Select organization type is disabled");
//            } else {
//                logger.info("Select organization type is enabled");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifySelectOrgIsDisabled");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }    }

    public static void verifySelectRegionIsDisabled() {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath",".//*[@class='select2-container select2-container-disabled region chooseOrganization width-100 secretInfo']",5, SeleniumUtilities.OBJWAITTIMEOUT);
            WebElement wb=SeleniumUtil.getElement("xpath",".//*[@class='select2-container select2-container-disabled region chooseOrganization width-100 secretInfo']",SeleniumUtilities.OBJWAITTIMEOUT);
            String actClassValOfElement=wb.getAttribute("class");
            String expClassValWhenEleIsDisabled="select2-container select2-container-disabled region chooseOrganization width-100 secretInfo";
            assertTrue(actClassValOfElement.equals(expClassValWhenEleIsDisabled));{
                logger.info("Select region is disabled");
//            } else {
//                logger.info("Select region is enabled");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifySelectRegionIsDisabled");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }    }

    public static void verifySelKeyPairIsDisabled() {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath","//*[@class='select2-container select2-container-disabled chooseOrganization width-100 keyvalue secretInfo']",5, SeleniumUtilities.OBJWAITTIMEOUT);
            WebElement wb=SeleniumUtil.getElement("xpath","//*[@class='select2-container select2-container-disabled chooseOrganization width-100 keyvalue secretInfo']",SeleniumUtilities.OBJWAITTIMEOUT);
            String actClassValOfElement=wb.getAttribute("class");
            String expClassValWhenEleIsDisabled="select2-container select2-container-disabled chooseOrganization width-100 keyvalue secretInfo";
            assertTrue(actClassValOfElement.equals(expClassValWhenEleIsDisabled));{
                logger.info("Select key pair is disabled");
//            } else {
//                logger.info("Select key pair is enabled");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifySelKeyPairIsDisabled");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }    }

    public static void verifyProviderInfo(String providerName, String providerInfo) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+providerName+"']/../*[text()='"+providerInfo+"']",5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue (SeleniumUtil.verifyTextValue("xpath",".//*[@id='envtable']//*[text()='"+providerName+"']/../*[text()='"+providerInfo+"']",providerInfo,SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info(providerName+" is available with : "+providerInfo);
//            } else {
//                logger.info(providerName+" is not available with : "+providerInfo);
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyProviderInfo");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void selectOrgInNewAWSPage(String orgName) {
        try {
            SeleniumUtil.selectByVisibleText("id","orgId",orgName,SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectOrgInNewAWSPage");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

}

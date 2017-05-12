package com.rl.qa.views;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.steps.LoginSteps;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.PageFactory;

import java.io.File;
import java.util.logging.Logger;

import static junit.framework.TestCase.assertTrue;
import static junit.framework.TestCase.fail;

/**
 * Created by RLE0372 on 10-08-2016.
 */
public class ImportNodesFromChefViews {

    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    public static String awsid = "";
    public static String IpAddress="";

    public static void clickOnAWSProvider() {
        try {
            SeleniumUtil.waitForElementIsClickable("xpath", ".//*[@id='blueprints']//div[@title='AWS']", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath", ".//*[@id='blueprints']//div[@title='AWS']", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnAWSProvider");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void selectBlueprintType(String blueprintType) {
        try {
            Thread.sleep(2000);
            SeleniumUtil.waitForElementIsClickable("xpath", "//*[text()='"+blueprintType+"']", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath", "//*[text()='"+blueprintType+"']", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectBlueprintType");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnNext() {
        try {
            SeleniumUtil.waitForElementIsClickable("linktext", "Next", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("linktext", "Next", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnNext");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void selectTemplate(String tempName) {
        try {
            SeleniumUtil.waitForElementIsClickable("xpath", ".//*[text()='" + tempName + "']", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath", ".//*[text()='" + tempName + "']", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectTemplate");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void selectValues(String valueToSelect, String idOfSelectBox) {
        try {
            SeleniumUtil.waitForElementIsClickable("id", idOfSelectBox, 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.selectByVisibleText("id", idOfSelectBox, valueToSelect, SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectTemplate");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void selectRegion(String region) {
        try {
            SeleniumUtil.waitForElementIsClickable("id", "region", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("id", "region", SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.waitForElementIsClickable("xpath", "//*[contains(text(),'" + region + "')]", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            WebElement wb = SeleniumUtil.getElement("xpath", "//*[contains(text(),'" + region + "')]", SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.sendEnterKeyToElement(wb);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectTemplate");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void selectSecurityGrp() {
        try {
            SeleniumUtil.waitForElementIsClickable("xpath", "//*[text()='sg-eeff688b | default']", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath", "//*[text()='sg-eeff688b | default']", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectSecurityGrp");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyEnvDetails(String envDetails) {
        try {
            SeleniumUtil.waitForElementIsClickable("xpath", "", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.waitForElementContainText("xpath", "//span[contains(text(),'" + envDetails + "')]", envDetails));
            logger.info(envDetails + " is present");
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyEnvDetails");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnLaunchBlueprint() {
        try {
            SeleniumUtil.waitForElementIsClickable("xpath", "//span[@title='Launch BluePrint']", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath", "//span[@title='Launch BluePrint']", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnLaunchBlueprint");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnWorkzone() {
        try {
            SeleniumUtil.waitForElementIsClickable("id","workZoneNew", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("id","workZoneNew",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnWorkzone");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnLaunchBlueprintPopUp() {
        try {
            SeleniumUtil.waitForElementVisibilityOf("id", "blueprintLaunch",8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("id","blueprintLaunch",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnWorkzone");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnLaunchOnSelBlueprintPopUp() {
        try {
            SeleniumUtil.waitForElementIsClickable("cssselector", ".btn.btn-default.btn-primary.launchBlueprintBtn", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("cssselector", ".btn.btn-default.btn-primary.launchBlueprintBtn", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnLaunchOnSelBlueprintPopUp");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void captureIpAddress(String bluePrintName) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", "//div[div[text()='"+bluePrintName+"']]/following-sibling::div/strong", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            IpAddress=SeleniumUtil.getElementText("xpath", "//div[div[text()='"+bluePrintName+"']]/following-sibling::div/strong", SeleniumUtilities.OBJWAITTIMEOUT);
            System.out.println("Captured IP address "+IpAddress);
        } catch (Exception ex) {
            BaseView.takeScreenshot("captureIpAddress");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void captureAwsId(String bluePrintName) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", "//div[div[text()='" +bluePrintName +"']]/../div[contains(text(),'AWS Id')]", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            String capturedText = SeleniumUtil.getElementText("xpath", "//div[div[text()='"+bluePrintName+"']]/../div[contains(text(),'AWS Id')]", SeleniumUtilities.OBJWAITTIMEOUT);
            String[] parts = capturedText.split(":");
            String awsTitle = parts[0];
            awsid = parts[1].trim();
            System.out.println("AWS title"+awsTitle);
            System.out.println("AWS id "+awsid);
        } catch (Exception ex) {
            BaseView.takeScreenshot("captureAwsId");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }
    public static void checkTheCheckBoxOfCorrespondingAWSID() {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath",".//*[@id='nodeListTable_filter']//input", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.type("xpath",".//*[@id='nodeListTable_filter']//input",awsid,SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='nodeListTable']//*[text()='"+awsid+"']/..//*[@type='checkbox']", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath", ".//*[@id='nodeListTable']//*[text()='"+awsid+"']/..//*[@type='checkbox']", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnLaunchOnSelBlueprintPopUp");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnImportNodesButton() {
        try {
            SeleniumUtil.waitForElementIsClickable("id", "buttonForIP", 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("id","buttonForIP", SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("clickOnImportNodesButton");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void selectBGroupInImportPopUp(String businessGroup,String idOfDropDown) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("id", idOfDropDown, 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.selectByVisibleText("id",idOfDropDown,businessGroup,SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectBGroupInImportPopUp");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void enterUserNameInPopup(String userName, String idOfEditBox) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("id", idOfEditBox, 8, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.type("id",idOfEditBox,userName,SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("enterUserNameInPopup");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void importPemFileInPopupWindow() {
        try{
            String path  = new String(new File(".").getCanonicalPath() + "\\src\\test\\resources\\Upload\\bootstrapncal.pem");
            WebDriver driver=SeleniumUtil.getWebDriver();
            driver.findElement(By.id("importPemfileInput")).sendKeys(path);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("importPemFileInPopupWindow");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void clickOnImportButton() {
        try{
            SeleniumUtil.click("xpath","//button[text()='Import']",SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("clickOnImportButtonPopupWindow");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void verifyImportingNodesPopUp() {
        try{
            SeleniumUtil.waitForElementVisibilityOf("xpath","//h4[text()='Importing Nodes']",SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.verifyTextValue("xpath","//h4[text()='Importing Nodes']","Importing Nodes",SeleniumUtilities.OBJWAITTIMEOUT));
            logger.info("Importing Nodes is displayed");
        }
        catch(Exception ex){
            BaseView.takeScreenshot("verifyImportingNodesPopUp");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void clickOnCloseButtonOnPopup() {
        try{
            SeleniumUtil.click("cssselector",".btn.btn-default",SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("clickOnCloseButtonOnPopup");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }


    }

    public static void verifyNodeImportedMessage() {
        try{
            SeleniumUtil.waitForElementPresent("xpath","//div[contains(text(),'Node Imported :  "+awsid+"')]");
            SeleniumUtil.verifyTextValue("xpath","//div[contains(text(),'Node Imported : "+awsid+"')]","Node Imported : "+awsid+"",SeleniumUtilities.OBJWAITTIMEOUT);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("verifyNodeImportedMessage");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        } catch (Throwable throwable) {
            throwable.printStackTrace();
        }
    }
    //    public static void browsePemFile() {
//        try{
//            //SeleniumUtil.waitForElementIsClickable("xpath","//*[@for='userpemfile']",8, SeleniumUtilities.OBJWAITTIMEOUT);
//            //SeleniumUtil.click("xpath","//*[@for='userpemfile']",SeleniumUtilities.OBJWAITTIMEOUT);
//            Thread.sleep(5000);
//            String path  = new String(new File(".").getCanonicalPath() + "/src/test/resources/Upload/mycatqa.pem");
//            SeleniumUtil.uploadPemFile(path);
//
//
//            //original
//            //String path="catalyst\\src\\test\\resources\\Upload";
//            //  String path  = new String(new File(".").getCanonicalPath() + "/src/test/resources/Upload/mycatqa.pem");
//            Thread.sleep(5000);
//        }
//        catch(Exception ex){
//            BaseView.takeScreenshot("clickOnPemFileBrowse");
//            SeleniumUtil.Log.info("Error :" + ex.getMessage());
//            fail(ex.getMessage());
//        }
//    }
    public static void selectEnv(String envName) {
        try {
            SeleniumUtil.selectByVisibleText("id", "chefEnv",envName,SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectEnv");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void deleteInstance() {
        try {
            SeleniumUtil.click("xpath", "//*[@class='card-btns']//button",SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("xpath","//span[@ng-click='operationSet.deleteInstance(inst, $index);']",SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.click("cssselector",".btn.cat-btn-delete",SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectEnv");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyConfirmationMsg(String confirmationMsg) {
        try {
            assertTrue(SeleniumUtil.verifyTextValue("xpath","//*[text()='"+confirmationMsg+"']",confirmationMsg,SeleniumUtilities.OBJWAITTIMEOUT));
            SeleniumUtil.waitUntilElementDisappers("xpath","//*[text()='"+confirmationMsg+"']",3,SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyConfirmationMsg");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }
}
package com.rl.qa.views;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.steps.LoginSteps;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

import static junit.framework.TestCase.assertTrue;
import static junit.framework.TestCase.fail;

/**
 * Created by RLE0372 on 01-08-2016.
 */
public class CreateEditDelJenkinsViews {

    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    public static WebElement PagesFrame;
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    public static void enterJenkinsName(String name,String idOfEditBox){
        try {
            SeleniumUtil.waitForElementVisibilityOf("id",idOfEditBox,8,SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.type("id",idOfEditBox,name,SeleniumUtilities.OBJWAITTIMEOUT);
            logger.info("Value entered "+name);
        }
        catch(Exception ex){
            BaseView.takeScreenshot("enterJenkinsName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyJenkins(String jenkinsPara) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+jenkinsPara+"']",5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue (SeleniumUtil.verifyTextValue("xpath",".//*[@id='envtable']//*[text()='"+jenkinsPara+"']",jenkinsPara,SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info("Verified : "+jenkinsPara);
//            } else {
//                logger.info("Not verified:" +jenkinsPara);
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyJenkinsDetails");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }
    public static void verifyJenkinsDetails(String jenkinsRefName,String jenkinsPara) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//td[text()='"+jenkinsRefName+"']/../*[text()='"+jenkinsPara+"']",5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue (SeleniumUtil.verifyTextValue("xpath",".//*[@id='envtable']//td[text()='"+jenkinsRefName+"']/../*[text()='"+jenkinsPara+"']",jenkinsPara,SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info(jenkinsRefName+" with "+jenkinsPara+" is available");
//            } else {
//                logger.info(jenkinsRefName+" with "+jenkinsPara+" is not available");
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyJenkinsDetails");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

}


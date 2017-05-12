package com.rl.qa.views;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.steps.LoginSteps;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

import static junit.framework.TestCase.assertTrue;
import static junit.framework.TestCase.fail;

/**
 * Created by RLE0372 on 09-08-2016.
 */
public class ConfigureNexusServerViews {
    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());

    public static void verifyNexusServerName(String nexusServerName) {
            try {
                SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+nexusServerName+"']",5, SeleniumUtilities.OBJWAITTIMEOUT);
                assertTrue (SeleniumUtil.verifyTextValue("xpath",".//*[@id='envtable']//*[text()='"+nexusServerName+"']",nexusServerName,SeleniumUtilities.OBJWAITTIMEOUT)); {
                    logger.info(nexusServerName+" is available");
//                } else {
//                    logger.info(nexusServerName+" is not available");
                }
            } catch (Exception ex) {
                BaseView.takeScreenshot("verifyNexusServerName");
                SeleniumUtil.Log.info("Error :" + ex.getMessage());
                fail(ex.getMessage());
            }
        }

    public static void verifyNexusServerInfo(String nexusServerName, String nexusServerDetails) {
        try {
//            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+nexusServerName+"']/../*[text()='"+nexusServerDetails+"']",5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue (SeleniumUtil.verifyTextValue("xpath",".//*[@id='envtable']//*[text()='"+nexusServerName+"']/../*[text()='"+nexusServerDetails+"']",nexusServerDetails,SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info(nexusServerName+" is available with "+nexusServerDetails);
//            } else {
//                logger.info(nexusServerName+" is not available with "+nexusServerDetails);
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyNexusServerName");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void selectOrgInNexusConfigPage(String orgName) {
        try {
            SeleniumUtil.selectByVisibleText("id","orgname",orgName,SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectOrgInNexusConfigPage");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }
}


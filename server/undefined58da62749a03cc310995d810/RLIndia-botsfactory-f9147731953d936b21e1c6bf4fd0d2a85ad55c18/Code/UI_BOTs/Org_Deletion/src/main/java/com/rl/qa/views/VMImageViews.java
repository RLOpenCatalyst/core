package com.rl.qa.views;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.steps.LoginSteps;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

import static junit.framework.Assert.assertTrue;
import static junit.framework.TestCase.fail;

/**
 * Created by RLE0372 on 11-08-2016.
 */
public class VMImageViews {
    private static final SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());


    public static void selectOS(String osType) {
        try {
            SeleniumUtil.selectByVisibleText("id","osType",osType,SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectOS");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyCreatedImage(String imageName) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+imageName+"']",5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//*[text()='"+imageName+"']",imageName,SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info("Verified created VMImage:"+imageName);
//            } else {
//                logger.info("VMImage not found:" +imageName);
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyCreatedImage");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void verifyVMImageDetails(String imageName, String imageDetail) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+imageName+"']/following-sibling::td[text()='"+imageDetail+"']",5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue (SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//*[text()='"+imageName+"']/following-sibling::td[text()='"+imageDetail+"']",imageDetail,SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info("Verified  VMImage details:"+imageDetail);
//            } else {
//                logger.info("VMImage details not found:" +imageDetail);
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyCreatedImage");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }

    }

    public static void verifyImageId(String imageName, String imageDetail) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("xpath", ".//*[@id='envtable']//*[text()='"+imageName+"']/following-sibling::td/span",5, SeleniumUtilities.OBJWAITTIMEOUT);
            assertTrue(SeleniumUtil.verifyTextValue("xpath", ".//*[@id='envtable']//*[text()='"+imageName+"']/following-sibling::td/span",imageDetail,SeleniumUtilities.OBJWAITTIMEOUT)); {
                logger.info("Verified  VMImage details:"+imageDetail);
//            } else {
//                logger.info("VMImage details not found:" +imageDetail);
            }
        } catch (Exception ex) {
            BaseView.takeScreenshot("verifyCreatedImage");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }

    public static void selectOrgInVMImagePage(String orgName) {
        try {
            SeleniumUtil.waitForElementVisibilityOf("id", "orgId",5, SeleniumUtilities.OBJWAITTIMEOUT);
            SeleniumUtil.selectByVisibleText("id","orgId",orgName,SeleniumUtilities.OBJWAITTIMEOUT);
        } catch (Exception ex) {
            BaseView.takeScreenshot("selectOrgInVMImagePage");
            SeleniumUtil.Log.info("Error :" + ex.getMessage());
            fail(ex.getMessage());
        }
    }
}

package com.rl.qa.steps;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.BaseView;
import com.rl.qa.utils.SeleniumUtilities;
import com.rl.qa.views.CFTViews;
import cucumber.api.PendingException;
import cucumber.api.java.en.And;
import org.openqa.selenium.By;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.logging.Logger;

import static junit.framework.Assert.assertTrue;
import static junit.framework.TestCase.fail;

/**
 * Created by RLE0097 on 21-06-2016.
 */
public class CFTSteps {
    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    private static final com.rl.qa.utils.SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);

    @And("^I navigate to the \"([^\"]*)\"$")
    public void I_navigate_to_the(String strLink) throws Throwable {
        CFTViews.clickOnWorkZoneLink();
    }

    @And("^I click on the \"([^\"]*)\" link$")
    public void I_click_on_the_link(String strLink) throws Throwable {
        CFTViews.clickOntheLink(strLink);
    }

    @And("^I select the \"([^\"]*)\" blueprint$")
    public void I_select_the_blueprint(String strBlueprint) throws Throwable {
        CFTViews.clickOntheCssselectorField("li[title='"+strBlueprint+"']");
    }

    @And("^I select the \"([^\"]*)\" blueprint and click on the Launch button$")
    public void I_select_the_blueprint_and_click_on_the_Launch_button(String strBlueprint) throws Throwable {
        CFTViews.selectBlueprintAndClickOnLaunchButton(strBlueprint);
    }

    @And("^I click on the \"([^\"]*)\" button on confirmation popup window$")
    public void I_click_on_the_button_on_confirmation_popup_window(String strButton) throws Throwable {
        CFTViews.clickOnOKButton(strButton);
    }

    @And("^I enter \"([^\"]*)\" unique stack name$")
    public void I_enter_unique_stack_name(String strStackName) throws Throwable {
        CFTViews.enterStackName(strStackName);
    }

    @And("^I click on the submit button$")
    public void I_click_on_the_submit_button() throws Throwable {
        CFTViews.clickOnButtonButton();
    }

    @And("^I verify the following message \"([^\"]*)\"$")
    public void I_verify_the_following_message(String strSearchText) {
        try {
            Thread.sleep(130000);
            SeleniumUtil.waitUntilElementContainsText("id","instanceLogModalContainer",strSearchText,8,SeleniumUtilities.OBJWAITTIMEOUT);
//            WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), 560);
//            assertTrue(wait.until(ExpectedConditions.textToBePresentInElement(By.tagName("*"), strSearchText)));
            logger.info("Verified : " + strSearchText);
        } catch (Exception e) {
            try {
                SeleniumUtil.getWebElementObject("xpath", "//*[contains(text(),\"" + strSearchText + "\")]");
            } catch (Exception ex) {
                BaseView.takeScreenshot(strSearchText + ".png");
                logger.info("Error :" + e.getMessage());
                fail(e.getMessage());
            }
        }
    }

    @And("^I verify the \"([^\"]*)\" stack name and status \"([^\"]*)\" in cloudformation$")
    public void I_verify_the_stack_name_and_status_in_cloudformation(String strStackName, String strStatus) throws Throwable {
        CFTViews.verifyStackName(strStackName,strStatus);
    }

    @And("^I click on more Info icon of \"([^\"]*)\" instance card$")
    public void I_click_on_more_Info_icon_of_instance_card(String strCardName) throws Throwable {
        CFTViews.clickOnMoreInfoofInstanceCard(strCardName);
    }

    @And("^I extract IP address of \"([^\"]*)\" instance card$")
    public void I_extract_IP_address_of_instance_card(String strCardName) throws Throwable {
        CFTViews.getIPAddress(strCardName);
    }

    @And("^I click on the \"([^\"]*)\" button on confirmation popup$")
    public void I_click_on_the_button_on_confirmation_popup(String arg1) throws Throwable {
        CFTViews.clickOnConfirmatinButton();
    }

    @And("^I collapse the first section \"([^\"]*)\"$")
    public void I_collapse_the_first_section(String strSoftwareStack) throws Throwable {
        CFTViews.clickOntheLink(strSoftwareStack);
    }

    @And("^I expand the \"([^\"]*)\" section$")
    public void I_expand_the_section(String Cloudformation) throws Throwable {
        CFTViews.clickOntheLink(Cloudformation);
    }

    @And("^I see the catalyst dashboard$")
    public void I_see_the_catalyst_dashboard() throws Throwable {
        CFTViews.seeDashboard();
    }

    @And("^I click on the \"([^\"]*)\" link to expend the tree$")
    public void I_click_on_the_link_to_expend_the_tree(String strTreeHead) throws Throwable {
        CFTViews.expendTheTree(strTreeHead);
    }

    @And("^I verify the following message \"([^\"]*)\" on \"([^\"]*)\" popup window$")
    public void I_verify_the_following_message_on_popup_window(String strPopWindowText,String strSearchText) {
        try {
            Thread.sleep(10000);
            SeleniumUtil.waitUntilElementContainsText("xpath",".//*[contains(./text(),'"+strPopWindowText+"')]",strPopWindowText,SeleniumUtilities.OBJWAITTIMEOUT);
            WebDriverWait wait = new WebDriverWait(BrowserDriver.getCurrentDriver(), 160);
            assertTrue(wait.until(ExpectedConditions.textToBePresentInElement(By.tagName("*"), strSearchText)));
            logger.info("Verified : " + strSearchText);
        } catch (Exception e) {
            try {
                SeleniumUtil.getWebElementObject("xpath", "//*[contains(text(),\"" + strSearchText + "\")]");
            } catch (Exception ex) {
                BaseView.takeScreenshot(strSearchText + ".png");
                logger.info("Error :" + e.getMessage());
                fail(e.getMessage());
            }
        }
    }

    @And("^I navigate to the trackNew$")
    public void I_navigate_to_the_trackNew() throws Throwable {
        CFTViews.clickOnTrack();
    }

    @And("^I click on the line chart \"([^\"]*)\"$")
    public void I_click_on_the_line_chart(String strLabel) throws Throwable {
        CFTViews.clickOnLineChartNotifications(strLabel);
    }

    @And("^I click on the file \"([^\"]*)\"$")
    public void I_click_on_the_file(String strLabel) throws Throwable {
        CFTViews.clickOnFileNotifications(strLabel);
    }

    @And("^I click on the desktop \"([^\"]*)\"$")
    public void I_click_on_the_desktop(String strLabel) throws Throwable {
        CFTViews.clickOnDesktopNotifications(strLabel);
    }

    @And("^I click on the \"([^\"]*)\" tab$")
    public void I_click_on_the_tab(String strLink) throws Throwable {
        CFTViews.clickOnLink(strLink);
    }

    @And("^I verify the Public IP address exist in \"([^\"]*)\" instance$")
    public void I_verify_the_Public_IP_address_exist_in_instance(String strCardName) throws Throwable {
//        span[class='ip-cell-public']
//        span[class='ip-cell-private']
        CFTViews.verifyPublicIPAddress(strCardName);
    }

    @And("^I extract Private IP address of \"([^\"]*)\" instance card$")
    public void I_extract_Private_IP_address_of_instance_card(String strCardName) throws Throwable {
        CFTViews.getPrivateIPAddress(strCardName);
    }

    @And("^I switch to visible frame$")
    public void I_switch_to_visible_frame() throws Throwable {
        CFTViews.switchToFrame();
    }

    @And("^I switch to default frame$")
    public void I_switch_to_default_frame() throws Throwable {
        SeleniumUtil.switchTodefaultContent();
    }


    @And("^I select the \"([^\"]*)\" from drop down$")
    public void iSelectTheFromDropDown(String orgName) throws Throwable {
        CFTViews.selectOrg(orgName);
    }

    @And("^I click on \"([^\"]*)\" to expand it$")
    public void iClickOnToExpandIt(String configStackPara) throws Throwable {
        CFTViews.clickOnConfigStackParaLink(configStackPara);
    }

    @And("^I enter \"([^\"]*)\" in the \"([^\"]*)\" edit box$")
    public void iEnterInTheEditBox(String stackPara, String webEleAttribute) throws Throwable {
        CFTViews.enterStackPara(stackPara,webEleAttribute);

    }

    @And("^I enter \"([^\"]*)\" in Username Input edit box$")
    public void iEnterInUsernameInputEditBox(String instanceUserName) throws Throwable {
        CFTViews.enterInstanceUserName(instanceUserName);
    }

    @And("^I expand \"([^\"]*)\"$")
    public void iExpand(String blueprintType) throws Throwable {
        CFTViews.clickOnBlueprintType(blueprintType);
    }

    @And("^I enter \"([^\"]*)\" on popup window$")
    public void iEnterOnPopupWindow(String uniqueStackName) throws Throwable {
        CFTViews.enterUniqueStackName(uniqueStackName);
    }

    @And("^I click on Refresh button$")
    public void iClickOnRefreshButton() throws Throwable {
        CFTViews.refreshCFTStackPage();
    }
    @And("^I verify the \"([^\"]*)\" stack name and status CREATE_IN_PROGRESS in CFT Stacks$")
    public void iVerifyTheStackNameAndStatusCREATE_IN_PROGRESSInCFTStacks(String cftName) throws Throwable {
        CFTViews.verifyStatusCreateInProgress(cftName);
    }

    @And("^I verify the \"([^\"]*)\" stack name and status CREATE_COMPLETE in CFT Stacks$")
    public void iVerifyTheStackNameAndStatusCREATE_COMPLETEInCFTStacks(String cftName) throws Throwable {
        CFTViews.verifyStatusCreateComplete();

    }

    @And("^I Click on \"([^\"]*)\" link$")
    public void iClickOnLink(String strLinkSaid) throws Throwable {
        CFTViews.clickonTheLinkSaid(strLinkSaid);

    }

    @And("^I Click on \"([^\"]*)\" Tab provided$")
    public void iClickOnTabProvided(String strCloudFormationTab) throws Throwable {
       CFTViews.clickonCloudformationTab(strCloudFormationTab);
    }


    @And("^I Verify the Cloudformation Blueprint is created \"([^\"]*)\"$")
    public void iVerifyTheCloudformationBlueprintIsCreated(String strVerifyBlueprint) throws Throwable {
        CFTViews.VerifyCloudFormationBlueprint(strVerifyBlueprint);
    }

    @And("^I click on the link workzone$")
    public void iClickOnTheLinkWorkzone() throws Throwable {
       CFTViews.clickOnWorkZoneLink();
    }

    @And("^I Click on \"([^\"]*)\" link provided$")
    public void iClickOnLinkProvided(String arg0) throws Throwable {
        CFTViews.clickOnBlueprints();

    }

    @And("^I Verify the SoftwareStack Blueprint is created \"([^\"]*)\"$")
    public void iVerifyTheSoftwareStackBlueprintIsCreated(String strSoftwareStack) throws Throwable {
        CFTViews.VerifySoftwareStackBlueprint(strSoftwareStack);
    }
}

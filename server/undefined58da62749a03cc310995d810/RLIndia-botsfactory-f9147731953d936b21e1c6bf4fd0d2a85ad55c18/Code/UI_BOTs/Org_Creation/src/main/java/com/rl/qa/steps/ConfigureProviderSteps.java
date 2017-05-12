package com.rl.qa.steps;

import com.rl.qa.browsers.BrowserDriver;
import com.rl.qa.utils.SeleniumUtilities;
import com.rl.qa.views.ConfigureProviderViews;
import cucumber.api.java.en.And;
import cucumber.api.java.en.Then;
import org.openqa.selenium.support.PageFactory;

import java.util.logging.Logger;

/**
 * Created by RLE0372 on 02-08-2016.
 */
public class ConfigureProviderSteps {

    private static final Logger logger = Logger.getLogger(LoginSteps.class.getName());
    private static final com.rl.qa.utils.SeleniumUtilities SeleniumUtil = PageFactory.initElements(BrowserDriver.getCurrentDriver(), SeleniumUtilities.class);

    @And("^I select provider type \"([^\"]*)\"$")
    public void iSelectProviderType(String providerType) throws Throwable {
        ConfigureProviderViews.selectProviderType(providerType);

    }

    @And("^I click on \"([^\"]*)\" User Access Key$")
    public void iClickOnUserAccessKey(String buttonID) throws Throwable {
        ConfigureProviderViews.clickCredentialSelButton(buttonID);
    }

    @And("^I select \"([^\"]*)\" from the drop down$")
    public void iSelectFromTheDropDown(String orgName) throws Throwable {
        ConfigureProviderViews.selectOrg(orgName);
    }

    @And("^I select \"([^\"]*)\" from the region select box$")
    public void iSelectFromTheRegionSelectBox(String region) throws Throwable {
        ConfigureProviderViews.selectRegion(region);
    }

    @And("^I select \"([^\"]*)\" from the key pair select box$")
    public void iSelectFromTheKeyPairSelectBox(String keyPair) throws Throwable {
        ConfigureProviderViews.selectKeyPair(keyPair);
    }

    @And("^I browse pem file for provider$")
    public void iBrowsePemFileForProvider() throws Throwable {
        ConfigureProviderViews.browsePemFileForProvider();
    }

    @And("^I verify the created provider \"([^\"]*)\" in Providers list$")
    public void iVerifyTheCreatedProviderInProvidersList(String providerName) throws Throwable {
        ConfigureProviderViews.verifyProvidersName(providerName);
    }

    @Then("^I verify the following message \"([^\"]*)\" on popup window$")
    public void iVerifyTheFollowingMessageOnPopupWindow(String actMsg) throws Throwable {
        ConfigureProviderViews.verifyMessage(actMsg);
    }

    @And("^I browse \"([^\"]*)\" file for open stack provider$")
    public void iBrowseFileForOpenStackProvider(String openStackpemFile) throws Throwable {
        ConfigureProviderViews.browseOpenStackPemFile(openStackpemFile);
    }

    @Then("^I verify \"([^\"]*)\" in the provider table$")
    public void iVerifyInTheProviderTable(String providerName) throws Throwable {
        ConfigureProviderViews.verifyProviderName(providerName);
    }

    @And("^I verify select provider type is disabled$")
    public void iVerifySelectProviderTypeIsDisabled() throws Throwable {
        ConfigureProviderViews.verifySelProviderTypeisDisabled();
    }

    @And("^I verify \"([^\"]*)\" is disabled$")
    public void iVerifyIsDisabled(String credentialsAccessKeys) throws Throwable {
        ConfigureProviderViews.verifyCredentialsAccessKeyIsDisabled(credentialsAccessKeys);
    }

    @And("^I verify select organization is disabled in edit provider page$")
    public void iVerifySelectOrganizationIsDisabledInEditProviderPage() throws Throwable {
        ConfigureProviderViews.verifySelectOrgIsDisabled();
    }

    @And("^I verify select region is disabled in edit provider page$")
    public void iVerifySelectRegionIsDisabledInEditProviderPage() throws Throwable {
        ConfigureProviderViews.verifySelectRegionIsDisabled();
    }

    @And("^I verify select key pair is disabled in edit provider page$")
    public void iVerifySelectKeyPairIsDisabledInEditProviderPage() throws Throwable {
        ConfigureProviderViews.verifySelKeyPairIsDisabled();
    }


    @Then("^I verify \"([^\"]*)\" with \"([^\"]*)\" in the provider table$")
    public void iVerifyWithInTheProviderTable(String providerName, String providerInfo) throws Throwable {
        ConfigureProviderViews.verifyProviderInfo(providerName,providerInfo);
    }


    @And("^I select \"([^\"]*)\" from the dropdown$")
    public void iSelectFromTheDropdown(String orgName) throws Throwable {
        ConfigureProviderViews.OrgSelct(orgName);
    }

    @And("^I select \"([^\"]*)\" from the select box in new provider page$")
    public void iSelectFromTheSelectBoxInNewProviderPage(String orgName) throws Throwable {
        ConfigureProviderViews.selectOrgInNewAWSPage(orgName);
    }

    @And("^I browse pem file for azure provider$")
    public void iBrowsePemFileForAzureProvider() throws Throwable {
        ConfigureProviderViews.browseAzurePemFile();

    }

    @And("^I browse private key file for azure provider$")
    public void iBrowsePrivateKeyFileForAzureProvider() throws Throwable {
        ConfigureProviderViews.browseAzurePrivateKeyFile();
    }
}

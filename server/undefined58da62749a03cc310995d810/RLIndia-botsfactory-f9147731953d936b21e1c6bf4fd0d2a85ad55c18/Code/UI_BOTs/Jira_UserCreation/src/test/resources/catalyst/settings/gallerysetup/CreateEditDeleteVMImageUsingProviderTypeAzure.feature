@All
Feature: As a super user I Create, Edit & Delete VMImage Using provider type Azure
  Scenario Outline: As a super user I create a organization
    Given I Login to catalyst using "<Login User>" access credentials
    Then I see the catalyst "workzone"
    And I click on the "SETTINGS" link
    And I move the cursor on "Menu"
    And I click on the "Org Configuration" link
    And I click on the "Organizations" link
    And I click on "newOrg" button
    And I enter "<Organization>" in "orgname" Edit box
#    And I enter "<Domain Name>" in "domainname" Edit box
    And I click on save button
    Then I verify the created "<Organization>" in organization table

    Examples:
      | Login User | Organization |
      | superadmin | UAT_RL1      |

  Scenario Outline: As a super user I create a Azure Provider
    And I move the cursor on "Menu"
    And I click on "Provider Configuration" link
    And I click on "Providers" link
    And I click on "addnewitem" button
    And I select provider type "AZURE"
    And I enter "<Azure Provider name>" in "name" Edit box
    And I enter "<Azure Subscription ID>" in "azureSubscriptionId" Edit box
    And I enter "<Azure Client ID>" in "azureClientId" Edit box
    And I enter "<Azure Client Secret>" in "azureClientSecret" Edit box
    And I enter "<I Azure Tenant Id>" in "azureTenantId" Edit box
    And I browse pem file for azure provider
    And I browse private key file for azure provider
    And I select "<Organization>" from the select box in new provider page
    And I click on save button
    Then I verify "<Azure Provider name>" in the provider table

    Examples:
      |Organization  |Azure Provider name |  Azure Subscription ID             |Azure Client ID                     |Azure Client Secret                         |I Azure Tenant Id                        |
      |UAT_RL1       |AzureProvider            |f2c53cd4-5d0f-4c6d-880b-6af801de9b21|53114209-b33b-497c-be26-6e282cad85ef|5f2RANpQ6GpT/ysmSYkpDMHX70qr/f4FRrUewZSdXVo=|   5a96ecbd-b05f-4363-a243-713dc2588bea  |

  Scenario Outline: As a super user I create VMImage
#    And I click on "Gallery Setup" link
    And I move the cursor on "Menu"
    And I click on "VMImage" link
    And I click on "addnewitem" button
    And I enter "<VMImage Name>" in "name" Edit box
    And I select "<Organization>" from the select box in VMImage page
    And I select "<Operating System>" type
    And I enter "<Image ID>" in "imageidentifire" Edit box
    And I enter "<Admin User Name>" in "UserName" Edit box
    And I click on save button
    Then I verify created "<VMImage Name>" in the Images table
    Then I select "<VMImage Name>" and verify given "<Image ID>" in Images table
    Then I select "<VMImage Name>" and verify assigned "<Organization>" in Images table
    Then I select "<VMImage Name>" and verify assigned "<Provider Name>" in Images table
    Then I select "<VMImage Name>" and verify assigned "<Operating System>" in Images table
    Then I select the "<VMImage Name>" and verify "Edit" Button is enabled
    Then I select the "<VMImage Name>" and verify "Delete" Button is enabled

    Examples:
      |VMImage Name|Organization|Operating System|Image ID    |Admin User Name|Provider Name|
      | RL_VM      | UAT_RL1    | Ubuntu         |ami-06116566|ubuntu         |AzureProvider|

  Scenario Outline: As a super user I edit the created VMImage
    And I select the "<VMImage Name>" and click on corresponding "Edit" Button
    And I clear the existing "name" in the edit box
    And I enter "<New VMImage Name>" in "name" Edit box
    And I click on save button
    Then I verify created "<New VMImage Name>" in the Images table
    Then I select "<New VMImage Name>" and verify given "<Image ID>" in Images table
    Then I select "<New VMImage Name>" and verify assigned "<Organization>" in Images table
    Then I select "<New VMImage Name>" and verify assigned "<Provider Name>" in Images table
    Then I select "<New VMImage Name>" and verify assigned "<Operating System>" in Images table
    Then I select the "<New VMImage Name>" and verify "Edit" Button is enabled
    Then I select the "<New VMImage Name>" and verify "Delete" Button is enabled
    Examples:
      |VMImage Name|New VMImage Name|Organization|Operating System|Image ID    |Provider Name|
      | RL_VM      | RL_VMImage     | UAT_RL1    | Ubuntu         |ami-06116566|AzureProvider|


  Scenario Outline: As a super user I delete the created a VMImage
    And I select the "<VMImage Name>" and click on corresponding "Delete" Button
    And I click on OK button
    Then I verify created "<VMImage Name>" is deleted

    Examples:
      |VMImage Name|
      |RL_VMImage  |

  Scenario Outline:Aa a super user I delete the created Azure provider
    And I move the cursor on "Menu"
    And I click on "Providers" link
    And I select the "<Provider Name>" and click on corresponding "Delete" Button
    And I click on OK button
#    Then I verify created "<Provider Name>" is deleted

    Examples:
      |Provider Name|
      |AzureProvider|

  Scenario Outline:As a super user I delete the created organization
    And I move the cursor on "Menu"
    And I click on "Organizations" link
    And I select the "<Organization>" and click on corresponding "Delete" Button
    And I click on OK button
#    Then I verify the "<Organization>" is deleted

    Examples:
      |Organization|
      |UAT_RL1     |

  Scenario: As a super user I Sign out
    And I Sign Out
    Then I verify login page is displayed
@All
Feature: As a super user I configure Azure Provider
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
    Then I verify "<Azure Provider name>" with "<Provider Type>" in the provider table
    Then I verify "<Azure Provider name>" with "<Organization>" in the provider table
    Then I select the "<Azure Provider name>" and verify "Edit" Button is enabled
    Then I select the "<Azure Provider name>" and verify "Delete" Button is enabled

    Examples:
      |Organization  |Azure Provider name |  Azure Subscription ID             |Azure Client ID                     |Azure Client Secret                         |I Azure Tenant Id                        |Provider Type|
      |UAT_RL1       |RL_Azure            |f2c53cd4-5d0f-4c6d-880b-6af801de9b21|53114209-b33b-497c-be26-6e282cad85ef|5f2RANpQ6GpT/ysmSYkpDMHX70qr/f4FRrUewZSdXVo=|   5a96ecbd-b05f-4363-a243-713dc2588bea  |    AZURE    |


#  Scenario Outline:As a super user I edit the created a AWS Provider
#    And I select the "<Azure Provider name>" and click on corresponding "Edit" Button
#    And I clear the existing "name" in the edit box
#    And I enter "<New Azure Provider Name>" in "name" Edit box
#    And I verify select provider type is disabled
#    And I verify "azureClientId" is disabled
#    And I verify "azureClientSecret" is disabled
#    And I verify "azureTenantId" is disabled
#    And I verify select organization is disabled in edit provider page
#    And I click on save button
#    And I verify "<Azure Provider name>" in the provider table
#
#
#    Examples:
#      |Azure Provider name|New Azure Provider Name|
#      |  RL_Azure         |    RL_Cat_Azure       |

  Scenario Outline: As a super user I delete the created a AWS Provider
    And I select the "<Azure Provider Name>" and click on corresponding "Delete" Button
    And I click on OK button
    Then I verify created "<Azure Provider Name>" is deleted

    Examples:
      |Azure Provider Name|
      |RL_Azure              |

  Scenario Outline: As a super user I delete the created organization
    And I move the cursor on "Menu"
    And I click on "Organizations" link
    And I click on "<Organization>" delete button
    And I click on OK button
    Then I verify the "<Organization>" is deleted

    Examples:
      |Organization|
      |UAT_RL1     |

  Scenario: As a super user I Sign out
    And I Sign Out
    Then I verify login page is displayed



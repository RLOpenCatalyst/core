@All
Feature: As a super user Create, Edit and Delete Organization
  Scenario Outline: As a super user I create a organization
    Given I Login to catalyst using "<Login User>" access credentials
    ##Then I see the catalyst "workzone"
#    And I close the toast popup
    ##And I click on the "SETTINGS" link
    And I move the cursor on "Menu"
#    And I click on Organizations link in main page
    And I click on the "Org Configuration" link
    And I click on the "Organizations" link
    And I click on "newOrg" button
    And I enter "<Organization>" in "orgname" Edit box
    And I enter "<Domain Name>" in "domainname" Edit box
    And I click on save button
    Then I verify the created "<Organization>" in organization table
    Then I verify "<Domain Name>" with "<Organization>" in the organization table
    Then I verify "Active" status with "<Organization>" in the organization table
    Then I select the "<Organization>" and verify "Delete" Button is enabled
    Then I select the "<Organization>" and verify "Edit" Button is enabled

    Examples:
      | Login User | Organization | Domain Name     |
      | superadmin |    UAT_RL    | www.uat_rl.com |

  Scenario Outline: As a super user I edit the created organization
    And I select the "<Organization>" and click on corresponding "Edit" Button
    And I clear the existing "orgname" in the edit box
    And I enter the another "<Org>" name
    And I clear the existing "domainname" in the edit box
    And I enter another "<Domain Name>" in "domainname" Edit box
    And I click on save button
    Then I verify the created "<Org>" in organization table
    Then I verify "<Domain Name>" with "<Org>" in the organization table
    Then I verify "Active" status with "<Org>" in the organization table
    Then I select the "<Org>" and verify "Delete" Button is enabled
    Then I select the "<Org>" and verify "Edit" Button is enabled

    Examples:
      | Organization |      Org            |Domain Name             |
      | UAT_RL       |  Relevance_Lab      |www.uat_relevancelab.com|

  Scenario Outline: As a super user I delete the created organization
    And I select the "<New_Organization>" and click on corresponding "Delete" Button
    And I click on OK button
    Then I verify the "<New_Organization>" is deleted

    Examples:
      | New_Organization |
      | Relevance_Lab    |

  Scenario: As a super user I Sign out
    And I Sign Out
    Then I verify login page is displayed

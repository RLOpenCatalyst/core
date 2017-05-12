@All
Feature: As a super user Create a Organization and Verify Four automatically created teams
  Scenario Outline: As a super user I create a organization
    Given I Login to catalyst using "<Login User>" access credentials
    Then I see the catalyst "workzone"
    And I click on the "SETTINGS" link
    And I move the cursor on "Menu"
    And I click on the "Org Configuration" link
    And I click on the "Organizations" link
    And I click on "newOrg" button
    And I enter "<Organization>" in "orgname" Edit box
    And I enter "<Domain Name>" in "domainname" Edit box
    And I click on save button
    Then I verify the created "<Organization>" in organization table
    Examples:
      | Login User | Organization |Domain Name   |
      | superadmin |     aaron    |www.Aaron.com |

  Scenario Outline: As a super user I navigate to Teams page and verify the auto created Teams
    And I move the cursor on "Menu"
    And I click on the "User Configuration" link
    And I click on the "Teams" link
    Then I verify created "<Admin Team>" in the teams table
    Then I verify created "<Admin Team>" with "<Organization>" in the teams table
    Then I select the "<Admin Team>" and verify "Delete" Button is enabled
    Then I select the "<Admin Team>" and verify "Edit" Button is enabled
    Then I verify created "<Dev Team>" in the teams table
    Then I verify created "<Dev Team>" with "<Organization>" in the teams table
    Then I select the "<Dev Team>" and verify "Delete" Button is enabled
    Then I select the "<Dev Team>" and verify "Edit" Button is enabled
    Then I verify created "<DevOps Team>" in the teams table
    Then I verify created "<DevOps Team>" with "<Organization>" in the teams table
    Then I select the "<DevOps Team>" and verify "Delete" Button is enabled
    Then I select the "<DevOps Team>" and verify "Edit" Button is enabled
    Then I verify created "<QA Team>" in the teams table
    Then I verify created "<QA Team>" with "<Organization>" in the teams table
    Then I select the "<QA Team>" and verify "Delete" Button is enabled
    Then I select the "<QA Team>" and verify "Edit" Button is enabled

    Examples:
      |Admin Team        |Dev Team     |DevOps Team     |QA Team       |Organization|
      |aaron_Admins      | aaron_DEV   |  aaron_DevOps  |aaron_QA      |aaron       |

  Scenario Outline: As a super user I delete the created organization
    And I move the cursor on "Menu"
#    And I click on Organizations link in the settings tree
    And I click on the "Organizations" link
    And I select the "<Organization>" and click on corresponding "Delete" Button
    And I click on OK button
#    Then I verify the "<Organization>" is deleted

    Examples:
      | Organization |
      | aaron        |

  Scenario: As a super user I Sign out
    And I Sign Out
    Then I verify login page is displayed


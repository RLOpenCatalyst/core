@Six
Feature: As a Super user Create the Chef Server
  Scenario Outline: As a super user I create a Chef Server
    Given I Login to catalyst using "superadmin" access credentials
    #Then I see the catalyst "workzone"
    #And I click on the "SETTINGS" link
    And I Check where application is landing and take the step
    And I move the cursor on "Menu"
    And I click on "Config Management" link
    And I click on "Chef Server" link available
    And I click on "newConfig" button
    And I enter "<name of server>" in "configname" Edit box
    And I enter "<User Name>" in "loginname" Edit box
    And I enter "<URL>" in "url" Edit box
    And I select "<Organization>" from the Drop Down available
    And I browse pem file for chef server
    And I browse knife file for chef server
    And I click on save button
    Then I verify created "<name of server>" in chef server table
    Then I verify "<name of server>" with "<User Name>" in the Chef Server table
    Then I verify "<name of server>" with "<URL>" in the Chef Server table
    Then I verify "<name of server>" with "<Organization>" in the Chef Server table
    Then I select the "<name of server>" and verify "Import Nodes" Button is enabled
    Then I select the "<name of server>" and verify "Edit" Button is enabled
    Then I select the "<name of server>" and verify "Chef Factory" Button is enabled
    Then I select the "<name of server>" and verify "DataBag" Button is enabled
    Then I select the "<name of server>" and verify "Import Nodes" Button is enabled
    Then I select the "<name of server>" and verify "Delete" Button is enabled

    Examples:
      | name of server  | User Name | URL                                           | Organization |
      | Cat_Chef_Server | mycatqa   | https://api.opscode.com/organizations/cattest | UAT_RL       |


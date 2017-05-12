@All
Feature: As a super user create organization

  Scenario Outline: As a super user I create a organization
    Given I Login to catalyst using "<Login User>" access credentials
    And I click on the Settings Link
    And I click on Organizations link in main page
    And I click on "newOrg" button
    And I enter "<Organization>" in "orgname" Edit box
    And I click on save button

    Examples:
      | Login User | Organization |
      | superadmin | UAT_RL1      |

  Scenario Outline: As a super user I create a Puppet Server
    And I click on config setup link
    And I click on puppet server link
    And I click on "<New Button>" button
    And I enter the "<Puppet Server Name>" in edit box
    And I Enter puppet server "<User Name>" in User Name edit box
    And I enter "<Host name>" in edit box
    And I click on Organization select button
    And I click on "<Org Name>"
    And I enter "<password>" in password edit box
    And I click on save button

    Examples:
      |New Button   |Puppet Server Name|User Name|Host name|Org Name|
      |   newConfig |Puppet_Master     |RL       |         | UAT_RL1 |
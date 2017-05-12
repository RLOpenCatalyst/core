
Feature: As a super user create, edit, delete Organization

  Scenario Outline: As a super user I create a organization
    Given I Login to catalyst using "<Login User>" access credentials
    And I click on the Settings Link
    And I click on Organizations link in main page
    And I click on "<New Organization>" button
    And I enter "<Organization>" in "orgname" Edit box
    And I click on save button

    Examples:
      | Login User | Organization |New Organization|
      | superadmin | UAT_RL       |newOrg          |



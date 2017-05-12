@Seven
Feature: As a super user I Create Environment from chef server which already exists
  Scenario Outline: As a super user I create environment
    #Given I Login to catalyst using "superadmin" access credentials
    #Then I see the catalyst "workzone"
    #And I click on the "SETTINGS" link

    And I move the cursor on "Menu"
    #And I click on "Config Management" link
    And I click on Environments link
    And I click on "newENV" button
    #And I select "<Organization>" from the drop down
    And I select "<Organization>" from the drop down
    And I select existing chef "<environment>" from chef server
    And I click on save button
    And I verify created "<environment>" in environments table
    Then I verify "<environment>" with "<Organization>" in the environments table
    Then I verify "<environment>" with "<Chef Server>" in the environments table
    Then I select the "<environment>" and verify "Edit" Button is enabled
    Then I select the "<environment>" and verify "Delete" Button is enabled

    Examples:
      | Organization | Chef Server      | environment | Organization_1 |
      | UAT_RL       | Cat_Chef_Server  | QA957        | Smoke_Rel_Org  |


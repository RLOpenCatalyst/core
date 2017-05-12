@Four
Feature: As a super user Create Team
  Scenario Outline: As a super user I create a Team
    Given I Login to catalyst using "superadmin" access credentials
    #Then I see the catalyst "workzone"
    #And I click on the "SETTINGS" link
    And I Check where application is landing and take the step
    And I move the cursor on "Menu"
    And I click on the "User Configuration" link
    And I click on the "Teams" link
    And I click on "newTeam" button
    And I enter "<Team Name>" in "teamname" Edit box
    And I enter "<Description>" in "description" Edit box
    And I select "<Organization>" from the drop down
    And I check the "superadmin" check box
    And I check the "<Project>" check box
    And I click on save button
    Then I verify created "<Team Name>" in the teams table
    Then I verify created "<Team Name>" with "<Organization>" in the teams table
    Then I select the "<Team Name>" and verify "Delete" Button is enabled
    Then I select the "<Team Name>" and verify "Edit" Button is enabled

    Examples:
      | Team Name      | Description          | Organization | Project  |
      | AutomationTeam | UAT  Automation Team | UAT_RL       | Catalyst |


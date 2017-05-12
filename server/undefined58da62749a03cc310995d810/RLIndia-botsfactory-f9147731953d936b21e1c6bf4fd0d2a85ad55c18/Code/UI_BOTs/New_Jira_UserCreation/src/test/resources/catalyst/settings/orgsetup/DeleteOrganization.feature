@Delete
Feature: As a super user Delete Organization
  Scenario Outline: As a super user I create a organization
    Given I Login to catalyst using "<Login User>" access credentials
    Then I see the catalyst "workzone"
    And I click on the "SETTINGS" link
    And I move the cursor on "Menu"
    And I click on the "Org Configuration" link
    And I click on the "Organizations" link
    And I select the "<New_Organization>" and click on corresponding "Delete" Button
    And I click on OK button
    Then I verify the "<New_Organization>" is deleted

    Examples:
      | Login User  | New_Organization |
      | superadmin  | UAT_RL           |




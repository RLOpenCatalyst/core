@Eight
Feature: As a super user I Create Environment by adding NEW Environment to ChefServer

  Scenario Outline: As a super user I create environment by creating new Environment
    #Given I Login to catalyst using "superadmin" access credentials
    #Then I see the catalyst "workzone"
    #And I click on the "SETTINGS" link

    And I move the cursor on "Menu"
    #And I click on "Config Management" link
    And I click on Environments link
    And I click on "newENV" button
    And I select "<Organization>" from the drop down
    And I click on add chef environment button on create environment page
    And I enter  chef environment in "chefenvname" Edit box
    And I click on "Add" button on the "Add a Chef Environment" popup
    And I select environment from drop down
    And I click on save button
    Then I verify newly created "environment" in environments table
    Then I verify "environment" with assigned "<Organization>" in the environments table
    Then I verify "environment" with assigned "<Chef Server>" in the environments table
    Then I select the "envName" and verify "Edit" Button is enabled in environments table
    Then I select the "envName" and verify "Delete" Button is enabled in environments table

    Examples:
      | Organization | Chef Server     |
      | UAT_RL       | Cat_Chef_Server |


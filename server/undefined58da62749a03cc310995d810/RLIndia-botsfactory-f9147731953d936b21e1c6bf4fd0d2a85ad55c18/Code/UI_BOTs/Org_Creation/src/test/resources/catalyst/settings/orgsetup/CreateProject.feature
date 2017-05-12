@Three
Feature: As a super user create Project
#  Scenario Outline: As a super user I create a organization
#    Given I Login to catalyst using "<Login User>" access credentials
    #Then I see the catalyst "workzone"
#    And I close the toast popup
    ##And I click on the "SETTINGS" link
#    And I move the cursor on "Menu"
    #And I click on Organizations link in main page
#    And I click on the "Org Configuration" link
#    And I click on the "Organizations" link
#    And I click on "newOrg" button
#    And I enter "<Organization>" in "orgname" Edit box
#    And I enter "<Domain Name>" in "domainname" Edit box
#    And I click on save button
#    Then I verify the created "<Organization>" in organization table

 #   Examples:
 #     | Login User |Organization|
 #     | superadmin |UAT_RL      |

 # Scenario Outline: As a super user I create a Business group
 #   And I move the cursor on "Menu"
 #   And I click on Business Groups Link
 #   And I click on "newProd" button
 #   And I enter the "<Business Group>" name in Business Group name
 #   And I select "<Organization>" from the drop down
 #   And I click on save button
 #   Then I verify the created "<Business Group>" in Business group table

  #  Examples:
  #    |Business Group|Organization|
  #    |Abc           |UAT_RL         |

  Scenario Outline: As a super user I create a Project
    #Given I Login to catalyst using "superadmin" access credentials
    #Then I see the catalyst "workzone"
    #And I click on the "SETTINGS" link

    And I move the cursor on "Menu"
    #And I click on the "Org Configuration" link
    And I click on Projects link
    And I click on "newProj" button
    And I enter "<Project name>" in "projectname" Edit box
    And I enter "<Description>" in "description" Edit box
    And I select "<Organization>" from the drop down
    And I click on save button
    Then I verify the created "<Project name>" in project table
    Then I verify the "<Project name>" with assigned "<Organization>" in project table
    Then I verify the "<Project name>" with assigned "<Business Group>" in project table
    Then I verify the "<Project name>" with assigned "<Description>" in project table
    Then I select the "<Project name>" and verify "Delete" Button is enabled
    Then I select the "<Project name>" and verify "Edit" Button is enabled

    Examples:
      | Project name | Organization | Description     | Business Group |
      | Catalyst     | UAT_RL       | Catalyst_UAT_RL |    RLBG        |

@Ten
Feature: As a super user I Create Cloud Formation Template
  Scenario Outline: As a super user I create Cloud Formation Template
    #Given I Login to catalyst using "superadmin" access credentials
    #Then I see the catalyst "workzone"
    #And I click on the "SETTINGS" link

    #And I move the cursor on "Menu"
    #And I click on "Gallery Setup" linktext
    #And I click on "Templates" linked
    And I click on "newTemplate" button
    And I enter "<Template Name>" in "templatename" Edit box
    And I select "CloudFormation" from select box
    And I select "<Organization>" from the drop down in create template page
    And I browse "bootstrapncal.pem" Template file
    And I click on save button
    Then I verify "<Template Name>" is available in templates table
    Then I select "<Template Name>" and verify corresponding "<Organization>" in Templates table
    Then I select "<Template Name>" and verify corresponding "<Template Type>" in Templates table
    Then I select the "<Template Name>" and verify "Edit" Button is enabled
    Then I select the "<Template Name>" and verify "Delete" Button is enabled

    Examples:
      | Template Name | Organization | Template Type  |
      | RL_Cloud      | UAT_RL       | CloudFormation |


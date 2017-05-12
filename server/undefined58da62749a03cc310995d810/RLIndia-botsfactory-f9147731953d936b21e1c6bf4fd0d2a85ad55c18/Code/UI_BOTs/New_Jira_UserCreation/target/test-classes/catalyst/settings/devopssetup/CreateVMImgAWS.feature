@Twelve
Feature: As a super user I Create VMImage Using AWS provider
  Scenario Outline: As a super user I create VMImage
    #Given I Login to catalyst using "superadmin" access credentials
    #Then I see the catalyst "workzone"
    #And I click on the "SETTINGS" link

    And I move the cursor on "Menu"
    #And I click on "Provider Configuration" link
    And I click on "VMImage" link
    And I click on "addnewitem" button
    And I enter "<VMImage Name>" in "name" Edit box
    And I select "<Organization>" from the select box in VMImage page
    And I select "<Operating System>" type
    And I enter "<Image ID>" in "imageidentifire" Edit box
    And I enter "<Admin User Name>" in "UserName" Edit box
    And I click on save button
    Then I verify created "<VMImage Name>" in the Images table
    Then I select "<VMImage Name>" and verify given "<Image ID>" in Images table
    Then I select "<VMImage Name>" and verify assigned "<Organization>" in Images table
    Then I select "<VMImage Name>" and verify assigned "<Provider Name>" in Images table
    Then I select "<VMImage Name>" and verify assigned "<Operating System>" in Images table
    Then I select the "<VMImage Name>" and verify "Edit" Button is enabled
    Then I select the "<VMImage Name>" and verify "Delete" Button is enabled

    Examples:
      |VMImage Name|Organization|Operating System|Image ID     |Admin User Name|Provider Name|
      | RL_VM      | UAT_RL     |  Ubuntu        |ami-06116566 |  ubuntu       |   RL_AWS    |

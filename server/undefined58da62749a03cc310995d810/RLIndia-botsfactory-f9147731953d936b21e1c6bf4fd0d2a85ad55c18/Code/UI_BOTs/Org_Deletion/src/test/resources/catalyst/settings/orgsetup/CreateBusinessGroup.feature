@Two
Feature: As a super user create Business group
 # Scenario Outline: As a super user I create a organization
 #   Given I Login to catalyst using "<Login User>" access credentials
    ##And I see the catalyst "workzone"
#    And I close the toast popup
    ##And I click on the "SETTINGS" link
 #   And I move the cursor on "Menu"
#    And I click on Organizations link in main page
  #  And I click on the "Org Configuration" link
  #  And I click on the "Organizations" link
  #  And I click on "newOrg" button
  #  And I enter "<Organization>" in "orgname" Edit box
  #  And I enter "<Domain Name>" in "domainname" Edit box
  #  And I click on save button
  #  Then I verify the created "<Organization>" in organization table

   # Examples:
   #   | Login User | Organization |Domain Name|
   #   | superadmin | UAT_RL1      |www.uat_rl1.com|


  Scenario Outline: As a super user I create a Business group
    #Given I Login to catalyst using "superadmin" access credentials
    #Then I see the catalyst "workzone"
    #And I click on the "SETTINGS" link
    And I move the cursor on "Menu"
    #And I click on the "Org Configuration" link
    And I click on the "Business Groups" link
    And I click on New BGroup button
    And I enter the "<Business Group>" name in Business Group name
    And I select "<Organization>" from the Drop Down
    And I click on save button
    Then I verify the created "<Business Group>" in Business group table
    Then I verify "<Business Group>" with assigned "<Organization>" in the Business group table
    Then I select the "<Business Group>" and verify "Delete" Button is enabled
    Then I select the "<Business Group>" and verify "Edit" Button is enabled

    Examples:
      | Business Group | Organization |
      | RLBG           | UAT_RL       |

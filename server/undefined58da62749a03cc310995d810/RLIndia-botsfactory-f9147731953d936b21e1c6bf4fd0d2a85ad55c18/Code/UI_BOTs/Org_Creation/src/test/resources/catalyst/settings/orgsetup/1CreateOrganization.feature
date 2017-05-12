@One
Feature: As a super user Create Organization
  Scenario Outline: As a super user I create a organization
    Given I Login to catalyst using "<Login User>" access credentials
    Then I see the catalyst "workzone"
    And I click on the "SETTINGS" link
    And I move the cursor on "Menu"
    And I click on the "Org Configuration" link
    And I click on the "Organizations" link
    And I click on "newOrg" button
    And I enter "<Organization>" in "orgname" Edit box
    And I enter "<Domain Name>" in "domainname" Edit box
    And I click on save button
    Then I verify the created "<Organization>" in organization table
    Then I verify "<Domain Name>" with "<Organization>" in the organization table
    Then I verify "Active" status with "<Organization>" in the organization table
    Then I select the "<Organization>" and verify "Delete" Button is enabled
    Then I select the "<Organization>" and verify "Edit" Button is enabled

    Examples:
      | Login User   | Organization |Domain Name   |
      | superadmin   |     testorg   |www.testorg.com|


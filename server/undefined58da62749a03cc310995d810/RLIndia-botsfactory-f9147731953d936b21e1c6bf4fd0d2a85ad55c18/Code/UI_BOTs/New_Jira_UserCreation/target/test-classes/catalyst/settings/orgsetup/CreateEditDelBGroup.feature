@All
Feature: As a super user create, edit, delete Business group
  Scenario Outline: As a super user I create a organization
    Given I Login to catalyst using "<Login User>" access credentials
    ##And I see the catalyst "workzone"
#    And I close the toast popup
    #And I click on the "SETTINGS" link
    And I move the cursor on "Menu"
#    And I click on Organizations link in main page
    And I click on the "Org Configuration" link
    And I click on the "Organizations" link
    And I click on "newOrg" button
    And I enter "<Organization>" in "orgname" Edit box
    And I enter "<Domain Name>" in "domainname" Edit box
    And I click on save button
    Then I verify the created "<Organization>" in organization table

    Examples:
      | Login User | Organization |Domain Name|
      | superadmin | UAT_RL1      |www.uat_rl1.com|

  Scenario Outline: As a super user I create another organization
    And I click on "newOrg" button
    And I enter "<Organization>" in "orgname" Edit box
    And I enter "<Domain Name>" in "domainname" Edit box
    And I click on save button
    Then I verify the created "<Organization>" in organization table

    Examples:
      | Organization |Domain Name    |
      | UAT_RL2      |www.uat_rl2.com|

  Scenario Outline: As a super user I create a Business group
#    And I click on Business Groups Link
    And I move the cursor on "Menu"
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
      | Abc            | UAT_RL1      |

  Scenario Outline: As a super user I edit the created Business Group
#    And I click on "<Business Group>" Edit button
    And I select the "<Business Group>" and click on corresponding "Edit" Button
    And I clear the product group name field
    And I enter another "<New Business Group>" in edit box
    And I select "<Organization>" from the Drop Down
    And I click on save button
    Then I verify the edited "<New Business Group>" in Business group table
    Then I verify "<New Business Group>" with assigned "<Organization>" in the Business group table
    Then I select the "<New Business Group>" and verify "Delete" Button is enabled
    Then I select the "<New Business Group>" and verify "Edit" Button is enabled
    Examples:
      | Business Group | New Business Group| Organization |
      | Abc            | Cell                | UAT_RL2      |

  Scenario Outline: As a super user I delete the edited Business Group
    And I select the "<Business Group>" and click on corresponding "Delete" Button
    And I click on OK button
    Then I verify the "<Business Group>" is deleted from the Business Group table
    Examples:
      | Business Group |
      | Cell           |

  Scenario Outline:As a super user I delete created Organizations
#    And I click on Organizations link in the settings tree
    And I move the cursor on "Menu"
    And I click on the "Organizations" link
    And I click on "<Organization_1>" delete button
    And I click on OK button
#    Then I verify the "<Organization_1>" is deleted
    And I click on "<Organization_2>" delete button
    And I click on OK button
#    Then I verify the "<Organization_2>" is deleted
    Examples:
      |Organization_1 | Organization_2 |
      |UAT_RL1        | UAT_RL2        |

  Scenario:As a super user I  Sign out
    And I Sign Out
    Then I verify login page is displayed


@All
Feature: As a super user Create, Edit, Delete Jenkins
  Scenario Outline: As a super user I create a organization
    Given I Login to catalyst using "<Login User>" access credentials
    Then I see the catalyst "workzone"
    And I click on the "SETTINGS" link
    And I move the cursor on "Menu"
    And I click on the "Org Configuration" link
    And I click on the "Organizations" link
    And I click on "newOrg" button
    And I enter "<Organization>" in "orgname" Edit box
#    And I enter "<Domain Name>" in "domainname" Edit box
    And I click on save button
    Then I verify the created "<Organization>" in organization table

    Examples:
      | Login User | Organization |
      | superadmin | UAT_RL1      |

  Scenario Outline: As a super user I create a Jenkins
    And I move the cursor on "Menu"
    And I click on "DevOps Roles" link
#    And I click on "User Information" link
    And I click on "Jenkins" link
    And I click on "newJen" button
    And I select "<Organization>" from the drop down
    And I enter "<Jenkins Ref Name>" in "jenkinsname" Edit box
    And I enter "<Jenkins URL>" in "jenkinsurl" Edit box
    And I enter "<User name>" in "jenkinsusername" Edit box
    And I enter "<Password>" in "jenkinspassword" Edit box
    And I click on save button
    Then I verify "<Jenkins Ref Name>" in the jenkins table
    Then I verify "<Jenkins Ref Name>" with "<Jenkins URL>" in the jenkins table
    Then I verify "<Jenkins Ref Name>" with "<Organization>" in the jenkins table
    Then I verify "<Jenkins Ref Name>" with "<User name>" in the jenkins table
    Then I select the "<Jenkins Ref Name>" and verify "Edit" Button is enabled
    Then I select the "<Jenkins Ref Name>" and verify "Delete" Button is enabled

    Examples:

      |Organization|Jenkins Ref Name    |Jenkins URL                      |User name  |Password|
      |UAT_RL1     | Jenkins_UAT        |http://jenkins.rlcatalyst_uat.com|uat_admin|admin@123|

  Scenario Outline: As a super user I edit the  created Jenkins
    And I select the "<Jenkins Ref Name>" and click on corresponding "Edit" Button
    And I clear the existing "jenkinsname" in the edit box
    And I enter "<New Jenkins Ref Name>" in "jenkinsname" Edit box
#    And I verify select organization is disabled
    And I click on save button
    Then I verify "<New Jenkins Ref Name>" in the jenkins table
    Then I verify "<New Jenkins Ref Name>" with "<Jenkins URL>" in the jenkins table
    Then I verify "<New Jenkins Ref Name>" with "<Organization>" in the jenkins table
    Then I verify "<New Jenkins Ref Name>" with "<User name>" in the jenkins table
    Then I select the "<New Jenkins Ref Name>" and verify "Edit" Button is enabled
    Then I select the "<New Jenkins Ref Name>" and verify "Delete" Button is enabled

    Examples:

      |Jenkins Ref Name|New Jenkins Ref Name|Organization|Jenkins URL                      |User name  |
      |Jenkins_UAT     | Jenkins_UAT1       | UAT_RL1    |http://jenkins.rlcatalyst_uat.com|uat_admin|

  Scenario Outline: As a super user I delete the  created Jenkins
    And I select the "<Organization>" and click on corresponding "Delete" Button
    And I click on OK button
    Then I verify created "<New Jenkins Ref Name>" is deleted

    Examples:
      | Organization |New Jenkins Ref Name|
      | UAT_RL1      |Jenkins_UAT1        |

  Scenario Outline: As a super user I delete the  created organization
    And I move the cursor on "Menu"
    And I click on "Organizations" link
    And I click on "<Organization>" delete button
    And I click on OK button
    Then I verify the "<Organization>" is deleted

    Examples:
      | Organization |
      | UAT_RL1      |
  Scenario: As a super user I Sign out
    And I Sign Out
    Then I verify login page is displayed


@All
Feature: As a super user I Create, Edit, Delete Environment by creating new Environment
  Scenario Outline: As a super user I create a organization
    Given I Login to catalyst using "<Login User>" access credentials
    And I see the catalyst "workzone"
    And I click on the "SETTINGS" link
    And I move the cursor on "Menu"
    And I click on the "Org Configuration" link
    And I click on the "Organizations" link
    And I click on "newOrg" button
    And I enter "<Organization>" in "orgname" Edit box
    And I enter "<Domain Name>" in "domainname" Edit box
    And I click on save button
    Then I verify the created "<Organization>" in organization table

    Examples:
      | Login User | Organization |Domain Name|
      | superadmin | UAT_RL1      |www.UAT_RL1.com|

#  Scenario Outline: As a super user I create a Chef Server
#    And I click on "Config Setup" link
#    And I click on "Chef Server" link
#    And I click on "newConfig" button
#    And I enter "<name of server>" in "configname" Edit box
#    And I enter "<User Name>" in "loginname" Edit box
#    And I enter "<URL>" in "url" Edit box
#    And I select "<Organization>" from the select box
#    And I upload pem file "<pem file name>"
#    And I upload knife file "<knife file name>"
#    And I click on save button
#    And I verify created "<name of server>" in chef server table
#
#    Examples:
#
#      | name of server  |User Name  | URL                                         | Organization |pem file name  |knife file name  |
#      | Cat_Chef_Server |mycatqa    |https://api.opscode.com/organizations/cattest| UAT_RL1      |mycatqa.pem    |knife.rb         |


  Scenario Outline: As a super user I create a Chef Server
    And I move the cursor on "Menu"
    And I click on "Config Management" link
    And I click on "Chef Server" link
    And I click on "newConfig" button
    And I enter "<name of server>" in "configname" Edit box
    And I enter "<User Name>" in "loginname" Edit box
    And I enter "<URL>" in "url" Edit box
    And I select "<Organization>" from the Drop Down
    And I browse pem file for chef server
    And I browse knife file for chef server
    And I click on save button
    Then I verify created "<name of server>" in chef server table

    Examples:
      | name of server  | User Name | URL                                           | Organization |
      | Cat_Chef_Server | mycatqa   | https://api.opscode.com/organizations/cattest | UAT_RL1      |

  Scenario Outline: As a super user I create environment by creating new Environment
    And I move the cursor on "Menu"
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
      |  Organization |Chef Server     |
      |  UAT_RL1      |Cat_Chef_Server |

#  Scenario Outline: As a super user I edit the created environment
#    And I select the "<Chef Server>" and click on corresponding "Edit" Button
##    And I verify select organization is disabled
##    And I verify select chef server is disabled
#    And I click on add chef environment button on create environment page
#    And I enter  chef environment in "chefenvname" Edit box
#    And I click on save button
#    And I verify created "name of environments" in environments table
#    And I verify "environments" with assigned "<Organization>" in the environments table
#    And I verify "environments" with assigned "<Chef Server>" in the environments table
#    And I select the "envName" and verify "Edit" Button is enabled in environments table
#    And I select the "envName" and verify "Delete" Button is enabled in environments table
#
#    Examples:
#      |Organization|Chef Server     |
#      |UAT_RL1     |Cat_Chef_Server |

  Scenario Outline: As A super user I delete the created environment
    And I select the "<Chef Server>" and click on corresponding "Delete" Button
    And I click on OK button
    Then I verify the created environment is deleted

    Examples:
      |Chef Server    |
      |Cat_Chef_Server|

  Scenario Outline:As a super user I delete the created Chef Server
    And I move the cursor on "Menu"
    And I click on "Chef Server" link
    And I select the "<Chef Server>" and click on corresponding "Delete" Button
    And I click on OK button
#    Then I verify created "<Chef Server>" is deleted

    Examples:
      |Chef Server    |
      |Cat_Chef_Server|

  Scenario Outline:As a super user I delete the created Organization
    And I move the cursor on "Menu"
    And I click on Organizations link in the settings tree
    And I click on "<Organization>" delete button
    And I click on OK button
#    Then I verify the "<Organization>" is deleted
    Examples:
      |Organization|
      |UAT_RL1|

  Scenario: As a super user I sign out
    And I Sign Out
    Then I verify login page is displayed


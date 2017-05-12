@All
Feature: As a super user Create, Edit, & Delete Docker

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

  Scenario Outline: As a super user I create a Docker
    And I move the cursor on "Menu"
    And I click on "DevOps Roles" link
    And I click on "Docker" link
    And I click on "newDoc" button
    And I select "<Organization>" from the drop down
    And I Enter "<docker name>" in docker "dockerreponame"
    And I enter "<docker hub registry name>" in docker hub registry edit box
    And I Enter "<user id>" in docker "dockeruserid"
    And I Enter "<Email id>" in docker "dockeremailid"
    And I Enter "<password>" in docker "dockerpassword"
    And I click on save button
    Then I verify "<docker name>" in the docker table
    Then I verify "<docker name>" with "<docker hub registry name>" in the docker table
    Then I verify "<docker name>" with "<Organization>" in the docker table
    Then I verify "<docker name>" with "<Email id>" in the docker table
    Then I verify "<docker name>" with "<user id>" in the docker table
    Then I select the "<docker name>" and verify "Edit" Button is enabled
    Then I select the "<docker name>" and verify "Delete" Button is enabled

    Examples:
      |Organization|docker name|docker hub registry name|user id     |Email id               |password        |
      | UAT_RL1    | rl_uat2   |relevancelab            |relevancelab|puneet@relevancelab.com|20relevancelab14|

  Scenario Outline: As a super user I  edit the created Docker
    And I select the "<docker name>" and click on corresponding "Edit" Button
    And I verify "Edit Docker" page is displayed
#    And I verify select organization is disabled in edit docker page
    And I clear the existing "dockerreponame" in the edit box
    And I Enter "<new docker name>" in docker "dockerreponame"
    And I click on save button
    Then I verify "<new docker name>" in the docker table
    Then I verify "<new docker name>" with "<docker hub registry name>" in the docker table
    Then I verify "<new docker name>" with "<Organization>" in the docker table
    Then I verify "<new docker name>" with "<Email id>" in the docker table
    Then I verify "<new docker name>" with "<user id>" in the docker table
    Then I select the "<new docker name>" and verify "Edit" Button is enabled
    Then I select the "<new docker name>" and verify "Delete" Button is enabled


    Examples:
      |docker name|new docker name|Organization|docker name|docker hub registry name|user id     |Email id                |password|
      |rl_uat2    |uat_docker     | UAT_RL1       | rl        |relevancelab            |relevancelab|puneet@relevancelab.com|20relevancelab14|

  Scenario Outline: As a super user I delete a Docker
    And I select the "<docker name>" and click on corresponding "Delete" Button
    And I click on OK button
    Then I verify created "<docker name>" is deleted

    Examples:
      |docker name     |
      |uat_docker   |

  Scenario Outline: As a super user I delete a Organization
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


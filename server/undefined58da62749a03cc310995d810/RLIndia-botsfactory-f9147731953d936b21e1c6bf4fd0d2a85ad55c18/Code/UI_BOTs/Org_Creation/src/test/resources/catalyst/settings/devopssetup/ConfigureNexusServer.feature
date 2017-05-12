@All
Feature: As a super user I configure Nexus Server

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

  Scenario Outline: As a super user I create a Nexus Server
    And I move the cursor on "Menu"
    And I click on "DevOps Roles" link
    And I click on "Nexus Server" link
    And I click on "newConfig" button
    And I enter "<Nexus Server Name>" in "nexusservername" Edit box
    And I enter "<User Name>" in "username" Edit box
    And I enter "<Nexus Password>" in "nexuspassword" Edit box
    And I enter "<Nexus Server URL>" in "hostname" Edit box
    And I select "<Organization>" from the select box Nexus Configuration Management page
    And I click on save button
    Then I verify "<Nexus Server Name>" in the nexus server management table
    Then I verify "<Nexus Server Name>" with "<User Name>" in the nexus server management table
    Then I verify "<Nexus Server Name>" with "<Nexus Server URL>" in the nexus server management table
    Then I verify "<Nexus Server Name>" with "<Organization>" in the nexus server management table
    Then I select the "<Nexus Server Name>" and verify "Edit" Button is enabled
    Then I select the "<Nexus Server Name>" and verify "Delete" Button is enabled

    Examples:

      |Nexus Server Name|User Name|Nexus Password|Nexus Server URL              |Organization|
      | Cat_Nexus       |  admin  | pass@123     |http://nexus.rlcatalyst.com/nexus    | UAT_RL1    |

  Scenario Outline: As a super user I edit the  created Nexus Server
    And I select the "<Nexus Server Name>" and click on corresponding "Edit" Button
    And I clear the existing "nexusservername" in the edit box
    And I enter "<New Nexus Server Name>" in "nexusservername" Edit box
#    And I verify select organization is disabled
    And I click on save button
    Then I verify "<New Nexus Server Name>" in the nexus server management table
    Then I verify "<New Nexus Server Name>" with "<User Name>" in the nexus server management table
    Then I verify "<New Nexus Server Name>" with "<Nexus Server URL>" in the nexus server management table
    Then I verify "<New Nexus Server Name>" with "<Organization>" in the nexus server management table
    Then I select the "<New Nexus Server Name>" and verify "Edit" Button is enabled
    Then I select the "<New Nexus Server Name>" and verify "Delete" Button is enabled

    Examples:
      | Nexus Server Name |New Nexus Server Name |User Name|Nexus Server URL                    |Organization|
      | Cat_Nexus         | Cat_Nexus_Dev        |  admin  |http://nexus.rlcatalyst.com/nexus    | UAT_RL1    |

  Scenario Outline: As a super user I delete the created Nexus Server
    And I select the "<Nexus Server Name>" and click on corresponding "Delete" Button
    And I click on OK button
    Then I verify created "<Nexus Server Name>" is deleted

    Examples:
      | Nexus Server Name|
      |Cat_Nexus_Dev     |

  Scenario Outline: As a super user I delete the created Organization
    And I move the cursor on "Menu"
    And I click on "Organizations" link
    And I select the "<Organization>" and click on corresponding "Delete" Button
    And I click on OK button
    Then I verify the "<Organization>" is deleted

    Examples:
      | Organization |
      | UAT_RL1      |

  Scenario: As a super user I Sign out
    And I Sign Out
    Then I verify login page is displayed

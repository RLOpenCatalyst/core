@All
Feature: As a super user create, edit, delete Project
  Scenario Outline: As a super user I create a organization
    Given I Login to catalyst using "<Login User>" access credentials
    #Then I see the catalyst "workzone"
#    And I close the toast popup
    ##And I click on the "SETTINGS" link
    And I move the cursor on "Menu"
    #And I click on Organizations link in main page
    And I click on the "Org Configuration" link
    And I click on the "Organizations" link
    And I click on "newOrg" button
    And I enter "<Organization>" in "orgname" Edit box
#    And I enter "<Domain Name>" in "domainname" Edit box
    And I click on save button
    Then I verify the created "<Organization>" in organization table
    Examples:
      | Login User |Organization|
      | superadmin |UAT_RL      |

  Scenario Outline: As a super user I create another organization
    And I click on "newOrg" button
    And I enter "<Organization>" in "orgname" Edit box
    And I click on save button
    Then I verify the created "<Organization>" in organization table

    Examples:
      |Organization|
      |UAT_RL1     |

  Scenario Outline: As a super user I create a Business group
    And I move the cursor on "Menu"
    And I click on Business Groups Link
    And I click on "newProd" button
    And I enter the "<Business Group>" name in Business Group name
    And I select "<Organization>" from the drop down
    And I click on save button
    Then I verify the created "<Business Group>" in Business group table

    Examples:
      |Business Group|Organization|
      |Abc           |UAT_RL         |

  Scenario Outline: As a super user I create another Business group
    And I click on "newProd" button
    And I enter the "<Business Group>" name in Business Group name
    And I select "<Organization>" from the drop down
    And I click on save button
    Then I verify the created "<Business Group>" in Business group table

    Examples:
      |Business Group|Organization|
      |UAT_BG        |UAT_RL1         |

  Scenario Outline: As a super user I create a Project
    And I move the cursor on "Menu"
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
      |Project name|Organization     |Description     |Business Group|
      | Catalyst   |UAT_RL           | Catalyst_UAT_RL|    Abc       |

  Scenario Outline: As a super user I edit the created project
    And I select the "<Project name>" and click on corresponding "Edit" Button
    And I clear the existing "projectname" in the edit box
    And I enter "<New Project name>" in "projectname" Edit box
    And I clear the existing "description" in the edit box
    And I enter "<new Description>" in "description" Edit box
    And I select "<Organization>" from the drop down
    And I click on save button
    Then I verify the created "<New Project name>" in project table
    Then I verify the "<New Project name>" with assigned "<Organization>" in project table
    Then I verify the "<New Project name>" with assigned "<Business Group>" in project table
    Then I verify the "<New Project name>" with assigned "<new Description>" in project table
    Then I select the "<New Project name>" and verify "Delete" Button is enabled
    Then I select the "<New Project name>" and verify "Edit" Button is enabled

    Examples:
      |Project name|New Project name  |Organization|Business Group|new Description   |
      | Catalyst   |Catalyst_d4d      | UAT_RL1    |UAT_BG        |Catalyst_UAT_D4D  |

  Scenario Outline:As a super user I delete the created project
    And I select the "<New Project name>" and click on corresponding "Delete" Button
    And I click on OK button
    Then I verify the "<New Project name>" is deleted from project table

    Examples:
      |New Project name|
      |Catalyst_d4d    |

  Scenario Outline: As a super user I delete the created Business Group
    And I move the cursor on "Menu"
    And I click on Business Groups Link
    And I select the "<Business Group>" and click on corresponding "Delete" Button
    And I click on OK button
#    Then I verify the "<Business Group>" is deleted from the Business Group table
    And I select the "<Business Group2>" and click on corresponding "Delete" Button
    And I click on OK button
#    Then I verify the "<Business Group>" is deleted from the Business Group table

    Examples:
      |Business Group|Business Group2|
      |   UAT_BG     |Abc            |

  Scenario Outline: As a super user I delete the created organization
    And I move the cursor on "Menu"
    And I click on "Organizations" link
    And I select the "<Organization_1>" and click on corresponding "Delete" Button
    And I click on OK button
#    Then I verify the "<Organization_1>" is deleted
    And I select the "<Organization_2>" and click on corresponding "Delete" Button
    And I click on OK button
#    Then I verify the "<Organization_2>" is deleted

    Examples:
      |Organization_1|Organization_2|
      |UAT_RL        |   UAT_RL1    |

  Scenario: As a super user I sign out
    And I Sign Out
    Then I verify login page is displayed


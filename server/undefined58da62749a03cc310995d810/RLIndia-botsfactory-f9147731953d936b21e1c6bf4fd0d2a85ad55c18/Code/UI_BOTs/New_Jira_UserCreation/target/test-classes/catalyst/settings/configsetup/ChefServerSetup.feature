@All
Feature: As a Super user Create the Chef Server
  Scenario Outline: As a super user I create a organization
    Given I Login to catalyst using "<Login User>" access credentials
    #Then I see the catalyst "workzone"
#    And I close the toast popup
    #And I click on the "SETTINGS" link
    And I move the cursor on "Menu"
#    And I click on Organizations link in main page
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
    Then I verify "<name of server>" with "<User Name>" in the Chef Server table
    Then I verify "<name of server>" with "<URL>" in the Chef Server table
    Then I verify "<name of server>" with "<Organization>" in the Chef Server table
    Then I select the "<name of server>" and verify "Import Nodes" Button is enabled
    Then I select the "<name of server>" and verify "Edit" Button is enabled
    Then I select the "<name of server>" and verify "Chef Factory" Button is enabled
    Then I select the "<name of server>" and verify "DataBag" Button is enabled
    Then I select the "<name of server>" and verify "Import Nodes" Button is enabled
    Then I select the "<name of server>" and verify "Delete" Button is enabled

    Examples:
      | name of server  | User Name | URL                                           | Organization |
      | Cat_Chef_Server | mycatqa   | https://api.opscode.com/organizations/cattest | UAT_RL1      |

  Scenario Outline: As a super user I edit created chef server
    And I select the "<Chef Server>" and click on corresponding "Edit" Button
    And I clear the existing "configname" in the edit box
    And I enter "<New name of server>" in "configname" Edit box
    And I verify select organization is disabled
    And I click on save button
    Then I verify created "<New name of server>" in chef server table
    Then I verify "<New name of server>" with "<User Name>" in the Chef Server table
    Then I verify "<New name of server>" with "<URL>" in the Chef Server table
    Then I verify "<New name of server>" with "<Organization>" in the Chef Server table
    Then I select the "<New name of server>" and verify "Import Nodes" Button is enabled
    Then I select the "<New name of server>" and verify "Edit" Button is enabled
    Then I select the "<New name of server>" and verify "Chef Factory" Button is enabled
    Then I select the "<New name of server>" and verify "DataBag" Button is enabled
    Then I select the "<New name of server>" and verify "Import Nodes" Button is enabled
    Then I select the "<New name of server>" and verify "Delete" Button is enabled

    Examples:
      | Chef Server       |New name of server| User Name | URL                                          | Organization |
      | Cat_Chef_Server   |CAT_SERVER        |  mycatqa  |https://api.opscode.com/organizations/cattest | UAT_RL1      |

  Scenario Outline: As a super user I click on Import node button
    And I select the "<Chef Server>" and click on corresponding "Import Nodes" Button
    Then I verify "Nodes" Link is displayed or not
    And I move the cursor on "Menu"
    And I click on "Chef Server" link

    Examples:
      |Chef Server|
      |CAT_SERVER |

  Scenario Outline: As a super user I click on Chef Factory Button
    And I select the "<Chef Server>" and click on corresponding "Chef Factory" Button
    Then I verify that message "Welcome to Chef Factory page" is displayed
#    And I move the cursor on "Menu"
#    And I click on "Chef Server" link

    Examples:
      |Chef Server|
      |CAT_SERVER |

  Scenario Outline: As a super user I click on Chef Factory Button
    And I select the "<Chef Server>" and click on corresponding "DataBag" Button
    Then I verify that message "Data Bags & Items for Chef Server" on data bag page is displayed
    And I move the cursor on "Menu"
    And I click on "Chef Server" link
    Examples:
      |Chef Server|
      |CAT_SERVER |

  Scenario Outline: As a super user I delete the created chef server
    And I click on "Chef Server" link
    And I select the "<Chef Server>" and click on corresponding "Delete" Button
    And I click on OK button
    Then I verify created "<Chef Server>" is deleted

    Examples:
      |Chef Server|
      |CAT_SERVER |

  Scenario Outline:As A super user I delete the created organization
    And I move the cursor on "Menu"
    And I click on Organizations link in the settings tree
    And I select the "<Organization>" and click on corresponding "Delete" Button
    And I click on OK button
#    Then I verify the "<Organization>" is deleted

    Examples:
      | Organization |
      |   UAT_RL1    |

  Scenario: As a super user I Sign out
    And I Sign Out
    Then I verify login page is displayed




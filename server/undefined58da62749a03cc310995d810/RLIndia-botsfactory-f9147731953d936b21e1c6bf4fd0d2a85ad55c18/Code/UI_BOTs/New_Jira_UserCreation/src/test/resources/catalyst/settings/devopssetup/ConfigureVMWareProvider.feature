@All
Feature: As a super user configure VMWare provider

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

  Scenario Outline: As a super user I create a VMWare Provider
    And I move the cursor on "Menu"
    And I click on "Provider Configuration" link
    And I click on "Providers" link
    And I click on "addnewitem" button
    And I select provider type "VMWARE"
    And I enter "<VMWare Provider Name>" in "name" Edit box
    And I enter "<VMWare User Name>" in "vmwareusername" Edit box
    And I enter "<Password>" in "vmwarepassword" Edit box
    And I enter "<Host>" in "vmwarehost" Edit box
    And I enter "<DC>" in "vmwaredc" Edit box
    And I select "<Organization>" from the select box in new provider page
    And I click on save button
    Then I verify "<VMWare Provider Name>" in the provider table
    Then I verify "<VMWare Provider Name>" with "<Organization>" in the provider table
    Then I verify "<VMWare Provider Name>" with "<Provider Type>" in the provider table
    Then I select the "<VMWare Provider Name>" and verify "Edit" Button is enabled
    Then I select the "<VMWare Provider Name>" and verify "Delete" Button is enabled

    Examples:
      |VMWare Provider Name|VMWare User Name|Password   |         Host     |     DC  |Organization|Provider Type|
      |RL_VMWare           |administrator   |Vcenter@123|192.168.102.48    |    DC1  | UAT_RL1    | VMWARE      |

#  Scenario Outline:As a super user I edit the created a AWS Provider
#    And I select the "<VMWare Provider Name>" and click on corresponding "Edit" Button
#    And I clear the existing "name" in the edit box
#    And I enter "<New VMWare Provider Name>" in "name" Edit box
#    And I verify select provider type is disabled
#    And I verify "vmwarepassword" is disabled
#    And I verify select organization is disabled in edit provider page
#    And I click on save button
#    And I verify "<New VMWare Provider Name>" in the provider table
#    And I verify "<Provider Type>" in the provider table
#    And I verify "<Organization>" in the provider table
#    And I select the "<VMWare Provider Name>" and verify "Edit" Button is enabled
#    And I select the "<VMWare Provider Name>" and verify "Delete" Button is enabled
#
#
#
#    Examples:
#      |VMWare Provider Name|New VMWare Provider Name|Provider Type|Organization|
#      |  RL_VMWare         |    RL_VMWare_Dev      | vmware       |   UAT_RL1    |

  Scenario Outline: As a super user I delete the created a AWS Provider
    And I select the "<VMWare Provider Name>" and click on corresponding "Delete" Button
    And I click on OK button
    Then I verify created "<VMWare Provider Name>" is deleted

    Examples:
      |VMWare Provider Name|
      |RL_VMWare           |

  Scenario Outline: As a super user I delete the created a organization
    And I move the cursor on "Menu"
    And I click on "Organizations" link
    And I click on "<Organization>" delete button
    And I click on OK button
#    Then I verify the "<Organization>" is deleted

    Examples:
      |Organization|
      |UAT_RL1     |

  Scenario: As a super user I Sign out
    And I Sign Out
    Then I verify login page is displayed

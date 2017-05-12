@All
Feature: As a super user I configure Open Stack provider, Edit and Delete it

  Scenario Outline: As a super user I create a organization
    Given I Login to catalyst using "<Login User>" access credentials
    Then I see the catalyst "workzone"
    And I click on the "SETTINGS" link
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

  Scenario Outline: As a super user I create a Open Stack Provider
    And I move the cursor on "Menu"
    And I click on "Provider Configuration" link
    And I click on "Providers" link
    And I click on "addnewitem" button
    And I select provider type "OPENSTACK"
    And I enter "<Open Stack Provider name>" in "name" Edit box
    And I enter "<User Name>" in "openstackusername" Edit box
    And I enter "<Password>" in "openstackpassword" Edit box
    And I enter "<Host>" in "openstackhost" Edit box
    And I enter "<Project Name>" in "openstackprojectname" Edit box
    And I enter "<Tenantid>" in "openstacktenantid" Edit box
    And I enter "<Tenantname>" in "openstacktenantname" Edit box
    And I enter "<End Point Compute>" in "openstackendpointcompute" Edit box
    And I enter "<End Point Identity>" in "openstackendpointidentity" Edit box
    And I enter "<End Point Network>" in "openstackendpointnetwork" Edit box
    And I enter "<End Point Image>" in "openstackendpointimage" Edit box
    And I enter "<Key Name>" in "openstackkeyname" Edit box
    And I browse "key_rldc_new_openstack.pem" file for open stack provider
    And I select "<Organization>" from the select box in new provider page
#    And I select "<Organization>" from the select box
    And I click on save button
    Then I verify "<Open Stack Provider name>" in the provider table
    Then I verify "<Open Stack Provider name>" with "<Organization>" in the provider table
    Then I verify "<Open Stack Provider name>" with "<Provider Type>" in the provider table
    Then I verify "<Provider Type>" in the provider table
    Then I verify "<Organization>" in the provider table
    Then I select the "<Open Stack Provider name>" and verify "Edit" Button is enabled
    Then I select the "<Open Stack Provider name>" and verify "Delete" Button is enabled

    Examples:
      |Organization  |Open Stack Provider name|  User Name            | Password |Host                 |Project Name|Tenantid                        |Tenantname|End Point Compute            |End Point Identity             |End Point Network              |End Point Image                |Key Name|Provider Type|
      |UAT_RL1       |RL_Open_Stack           |       admin           |  admin   |http://192.168.105.31|admin       |817d2dd8f382494a9c812d63f3056080| admin    |http://192.168.105.31:8774/v2|http://192.168.105.31:5000/v2.0|http://192.168.105.31:9696/v2.0|http://192.168.105.31:5000/v2.0|  key   |OPENSTACK    |

#  Scenario Outline:As a super user I edit the created a Open Stack Provider
#    And I select the "<Open Stack Provider name>" and click on corresponding "Edit" Button
#    And I clear the existing "name" in the edit box
#    And I enter "<New Open Stack Provider>" in "name" Edit box
#    And I verify select provider type is disabled
#    And I verify "openstackpassword" is disabled
#    And I verify select organization is disabled in edit provider page
#    And I click on save button
#    And I verify "<New Open Stack Provider>" in the provider table
#
#    Examples:
#      |Open Stack Provider name|New Open Stack Provider|
#      |  RL_Open_Stack         |    OpenStack_Pro       |

  Scenario Outline: As a super user I delete the created a Open Stack Provider
    And I select the "<Open Stack Provider Name>" and click on corresponding "Delete" Button
    And I click on OK button
    Then I verify created "<Open Stack Provider Name>" is deleted

    Examples:
      |Open Stack Provider Name|
      |RL_Open_Stack           |

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

@All
Feature: As a super user I Create, Edit & Delete VMImage Using Open Stack Provider
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

    Examples:
      |Organization  |Open Stack Provider name|  User Name            | Password |Host                 |Project Name|Tenantid                        |Tenantname|End Point Compute            |End Point Identity             |End Point Network              |End Point Image                |Key Name|Provider Type|
      |UAT_RL1       |RL_Open_Stack           |       admin           |  admin   |http://192.168.105.31|admin       |817d2dd8f382494a9c812d63f3056080| admin    |http://192.168.105.31:8774/v2|http://192.168.105.31:5000/v2.0|http://192.168.105.31:9696/v2.0|http://192.168.105.31:5000/v2.0|  key   |OPENSTACK|

  Scenario Outline: As a super user I create VMImage Using Open Stack Provider
    And I move the cursor on "Menu"
#    And I click on "Gallery Setup" link
    And I click on "VMImage" link
    And I click on "addnewitem" button
    And I enter "<VMImage Name>" in "name" Edit box
    And I select "<Organization>" from the select box in VMImage page
    And I select "<Operating System>" type
    And I enter "<Image ID>" in "imageidentifire" Edit box
    And I enter "<Admin User Name>" in "UserName" Edit box
    And I click on save button
    Then I verify created "<VMImage Name>" in the Images table
    Then I select "<VMImage Name>" and verify given "<Image ID>" in Images table
    Then I select "<VMImage Name>" and verify assigned "<Organization>" in Images table
    Then I select "<VMImage Name>" and verify assigned "<Provider Name>" in Images table
    Then I select "<VMImage Name>" and verify assigned "<Operating System>" in Images table
    Then I select the "<VMImage Name>" and verify "Edit" Button is enabled
    Then I select the "<VMImage Name>" and verify "Delete" Button is enabled

    Examples:
      |VMImage Name|Organization|Operating System|Image ID    |Admin User Name|Provider Name|
      | RL_VM      | UAT_RL1    | Ubuntu         |ami-06116566|Administrator  | RL_Open_Stack    |

  Scenario Outline: As a super user I edit the created VMImage
    And I select the "<VMImage Name>" and click on corresponding "Edit" Button
    And I clear the existing "name" in the edit box
    And I enter "<New VMImage Name>" in "name" Edit box
    And I click on save button
    Then I verify created "<New VMImage Name>" in the Images table
    Then I select "<New VMImage Name>" and verify given "<Image ID>" in Images table
    Then I select "<New VMImage Name>" and verify assigned "<Organization>" in Images table
    Then I select "<New VMImage Name>" and verify assigned "<Provider Name>" in Images table
    Then I select "<New VMImage Name>" and verify assigned "<Operating System>" in Images table
    Then I select the "<New VMImage Name>" and verify "Edit" Button is enabled
    Then I select the "<New VMImage Name>" and verify "Delete" Button is enabled
    Examples:
      |VMImage Name|New VMImage Name|Organization|Operating System|Image ID    |Provider Name|
      | RL_VM      | RL_VMImage     | UAT_RL1    | Ubuntu         |ami-06116566| RL_Open_Stack|


  Scenario Outline: As a super user I delete the created a VMImage
    And I select the "<VMImage Name>" and click on corresponding "Delete" Button
    And I click on OK button
    Then I verify created "<VMImage Name>" is deleted

    Examples:
      |VMImage Name|
      |RL_VMImage  |

  Scenario Outline:Aa a super user I delete the created Open Stack provider
    And I move the cursor on "Menu"
    And I click on "Providers" link
    And I select the "<Provider Name>" and click on corresponding "Delete" Button
    Then I click on OK button
#    Then I verify created "<Provider Name>" is deleted

    Examples:
      |Provider Name|
      |RL_Open_Stack|

  Scenario Outline:As a super user I delete the created organization
    And I move the cursor on "Menu"
    And I click on "Organizations" link
    And I select the "<Organization>" and click on corresponding "Delete" Button
    And I click on OK button
#    Then I verify the "<Organization>" is deleted

    Examples:
      |Organization|
      |UAT_RL1     |

  Scenario: As a super user I Sign out
    And I Sign Out
    Then I verify login page is displayed
@All
Feature: As a super user I Create data required for Design Module
  Scenario Outline: As a super user I create a organization
    Given I Login to catalyst using "<Login User>" access credentials
    And I see the catalyst "workzone"
    And I click on "SETTINGS" link
    And I click on Organizations link in main page
    And I click on "newOrg" button
    And I enter "<Organization>" in "orgname" Edit box
    And I click on save button
    And I verify the created "<Organization>" in list

    Examples:
      | Login User | Organization |
      | superadmin | UAT_RL1      |

  Scenario Outline: As a super user I create a Business group
    And I click on Business Groups Link
    And I click on New BGroup button
    And I enter the "<Business Group>" name in Business Group name
    And I select "<Organization>" from the select box
    And I click on save button
    And I verify the created "<Business Group>" in Business group table

    Examples:
      | Business Group | Organization |
      | Cat_UAT        | UAT_RL1      |

  Scenario Outline: As a super user I create a Project
    And I click on Projects link
    And I click on "newProj" button
    And I enter "<Project name>" in "projectname" Edit box
    And I enter "<Description>" in "description" Edit box
    And I select "<Organization>" from the select box
    And I click on save button
    And I verify the created "<Project name>" in project table
    Examples:
      |Project name|Organization     |Description     |
      | Catalyst   |UAT_RL1          | Catalyst_UAT_RL|

  Scenario Outline: As a super user I create a chef server
    And I click on "Config Setup" link
    And I click on "Chef Server" link
    And I click on "newConfig" button
    And I enter "<Chef Server>" in "configname" Edit box
    And I enter "<User Name>" in "loginname" Edit box
    And I enter "<URL>" in "url" Edit box
    And I select "<Organization>" from the select box
    And I click on user pem file browse button
    And I click on knife file browse button
#    And I upload pem file "<pem file name>"
#    And I upload knife file "<knife file name>"
    And I click on save button
    And I verify created "<Chef Server>" in chef server table

    Examples:
      | Chef Server       | User Name | URL                                          | Organization |
      | Cat_Chef_Server   |  mycatqa  |https://api.opscode.com/organizations/cattest | UAT_RL1      |

  Scenario Outline: As a super user I create environment
    And I click on Environments link
    And I click on "newENV" button
    And I select "<Organization_1>" from the select box
    And I select "<Organization>" from the select box
    And I select existing chef "<environment>" from chef server
    And I check the "<Project>" check box
#    And I check the "<Project1>" check box
    And I click on save button
    And I verify created "<environment>" in environments table

    Examples:
      |  Organization |environment |Organization_1|Project |
      |  UAT_RL1      |QA957       |Smoke_Rel_Org |Catalyst|

  Scenario Outline: As a super user I change the status Inactive of all other existing Organization
    And I click on the "Organizations" link
    And I select the "<Organization_1>" and click on corresponding "Edit" Button
    And I click on Current Status Button
    And I click on save button
    And I click on OK button on Alert popup
    And I select "All" in the show drop down
    Then I verify "Inactive" status with "<Organization_1>" in the organization list
    And I select the "<Organization_2>" and click on corresponding "Edit" Button
    And I click on Current Status Button
    And I click on save button
    And I click on OK button on Alert popup
    And I select "All" in the show drop down
    Then I verify "Inactive" status with "<Organization_2>" in the organization list

    Examples:
      | Organization_1 |Organization_2|
      | Phoenix        |Smoke_Rel_Org |

  Scenario Outline: As a super user I create a Team
    And I click on the "Users Setup" link
    And I click on the "Teams" link
    And I click on "newTeam" button
    And I enter "<Team Name>" in "teamname" Edit box
    And I enter "<Description>" in "description" Edit box
    And I select "<Organization>" from the select box
    And I check the "superadmin" check box
    And I check the "<Project>" check box
#    And I check the "<Project1>" check box
    And I click on save button
    And I verify created "<Team Name>" in the teams table

    Examples:
      |Team Name      |Description         |Organization |Project  |
      |UatAutoTeam14   |UAT  Automation Team|  UAT_RL1    |Catalyst |

  Scenario Outline: As a super user I create a AWS Provider
    And I click on "DevOps Setup" link
    And I click on "Providers" link
    And I click on "addnewitem" button
    And I select provider type "AWS"
    And I enter "<AWS service name>" in "name" Edit box
    And I click on "credentials-accessKeys" User Access Key
    And I enter "<Access Key>" in "accessKey" Edit box
    And I enter "<Secret Key>" in "secretKey" Edit box
    And I enter "<S3 Bucket Name>" in "s3BucketName" Edit box
    And I select "<Organization>" from the select box in new provider page
    And I enter "<Planned cost>" in "plannedCost" Edit box
    And I select "<Region>" from the region select box
    And I select "<Key Pair>" from the key pair select box
    And I click on user pem file browse button and select pem file
    And I click on save button
    And I verify "<AWS service name>" in the provider table
    Examples:
      |AWS service name |Access Key             |Secret Key                               |S3 Bucket Name|Organization|Region                 |Key Pair      |Planned cost|
      |RL_AWS           |  AKIAIIK5APRNV54QAVQA |bz6Hl4wtjXi5Mg2EaZxLR1I/7y0bmYXEiYINDBSp |  RLBilling   |   UAT_RL1  |US West (N. California)| bootstrapncal|10000|

  Scenario Outline: As a super user I create VMImage
    And I click on "Gallery Setup" link
    And I click on "VMImage" link
    And I click on "addnewitem" button
    And I enter "<VMImage Name>" in "name" Edit box
    And I select "<Organization>" from the select box in VMImage page
    And I select "<Operating System>" type
    And I enter "<Image ID>" in "imageidentifire" Edit box
    And I enter "<Admin User Name>" in "UserName" Edit box
    And I click on save button
    And I verify created "<VMImage Name>" in the Images table

    Examples:
      |VMImage Name|Organization|Operating System|Image ID    |Admin User Name|
      | RL_VM     | UAT_RL1    | Ubuntu          |ami-06116566|ubuntu         |

  Scenario Outline: As a super user I create Cloud Formation Template
    And I click on "Templates" link
    And I click on "newTemplate" button
    And I enter "<Template Name>" in "templatename" Edit box
    And I select "CloudFormation" from select box
    And I select "<Organization>" from the select box in create template page
    And I browse "JavaStack.template" Template file
    And I click on save button
    And I verify "<Template Name>" is available in templates table

    Examples:
      |Template Name | Organization |
      | RL_Cloud     | UAT_RL1      |

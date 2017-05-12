@All
Feature: As a super user I Configure Blueprint for Cloud Formation Template using provider type AWS
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
      |UatAutoTeam13   |UAT  Automation Team|  UAT_RL1    |Catalyst |

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

  Scenario Outline: As a super user I create a Cloud Formation blueprint
    And I navigate to the "Workzone"
    And I click on the "DESIGN" link
    And I click on AWS provider
    And I click on "New" link
    And I select the "<Organization>" from drop down
    And I select type of blueprint "CloudFormation"
    And I click on next button
    And I click on the "<Template>"
    And I click on next button
    And I enter "<Blueprint Name>" in "blueprintNameInput" Edit box
    And I select "<Business Grp>" in "bgListInput" select box
    And I select "<Project>" in "projectListInput" select box
    And I click on "Configure Stack Parameters" to expand it
    And I select "<Region>" in "cftRegionInput" select box
    And I select "<Provider>" in "cftProviderInput" select box
    And I enter "<Java Stack>" in the "JavaStack" edit box
    And I enter "<Key Name>" in the "KeyName" edit box
    And I enter "<Subnet>" in the "Subnet" edit box
    And I enter "<Security Group>" in the "SecurityGroup" edit box
    And I enter "<AMImage ID>" in the "AMImageID" edit box
    And I enter "<Instance Type>" in the "InstanceType" edit box
    And I click on "Configure Resource : Java" to expand it
    And I enter "<Instance UserName>" in Username Input edit box
    And I click on next button
    And I click on OK button
    And I click on launch blueprint on the pop-up menu
    And I click on launch on select blueprint parameter pop-up menu
    And I click on OK button
    And I enter "<Unique Stack Name>" on popup window
    And I click on the submit button
    And I verify the following message "Your Created Blueprint is being Launched, kindly check Workzone to view your instance." on "Launching Blueprint" popup window
    And I click on the "Close" button on confirmation popup

    Examples:
      |Organization|Blueprint Name|Business Grp|Project  |Template    |Provider |Region                 |Java Stack|Key Name      |Subnet          |Security Group|AMImage ID   |Instance UserName|Instance Type|Unique Stack Name|
      |    UAT_RL1 | RL_Blueprint | Cat_UAT    |Catalyst |RL_Cloud    |  RL_AWS |US West (N. California)|java-test | bootstrapncal| subnet-d7df258e|   sg-eeff688b|ami-06116566 |  RL_Catalyst    |t2.micro     |      RL2995     |

  Scenario Outline: As a super user I verify the launched blueprint in workzone
    And I navigate to the "Workzone"
    And I select the "<Project>" and click on assigned "<environment>"
    And I click on the "Infrastructure" link
    And I click on the "Blueprints" link
    And I expand "Cloud Formation"
    Then I verify "<Blueprint Name>" present in "Blueprint" page
    And I click on the "Infrastructure" link
    And I click on the "CloudFormation" link
    And I verify the "<stackName>" stack name and status CREATE_IN_PROGRESS in CFT Stacks
    And I click on Refresh button
    And I verify the "<stackName>" stack name and status CREATE_COMPLETE in CFT Stacks

    Examples:
      |Blueprint Name|environment|Project     |environment|stackName|
      | RL_Blueprint |  QA957    |Catalyst    |  QA957    |RL2995   |






@All
Feature: As a super user I import nodes from chef server
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
    And I verify "<Business Group>" with assigned "<Organization>" in the Business group list
    And I select the "<Organization>" and verify "Delete" Button is enabled
    And I select the "<Organization>" and verify "Edit" Button is enabled

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
    And I enter "<name of server>" in "configname" Edit box
    And I enter "<User Name>" in "loginname" Edit box
    And I enter "<URL>" in "url" Edit box
    And I select "<Organization>" from the select box
    And I click on user pem file browse button
    And I click on knife file browse button
    And I click on save button
    And I verify created "<name of server>" in chef server table

    Examples:

      | name of server  | User Name | URL                                           | Organization |
      | Cat_Chef_Server | mycatqa   | https://api.opscode.com/organizations/cattest | UAT_RL1      |

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
#      | name of server  |User Name  | URL                                       | Organization |pem file name  |knife file name    |
#      | Cat_Chef_Server |jagadeesh12|https://api.opscode.com/organizations/jm012| UAT_RL1      |jagadeesh12.pem|jagdeesh12_knife.rb|

#  Scenario Outline: As a super user I create environment
#    And I click on Environments link
#    And I click on "newENV" button
#    And I select "<Organization>" from the select box
#    And I click on add chef environment button on create environment page
#    And I enter  chef environment in "chefenvname" Edit box
#    And I check the "<Project>" check box
#    And I click on save button
#    And I verify created "name of environments" in environments table
#
#    Examples:
#      |  Organization |Project |
#      |  UAT_RL1      |Catalyst|

  Scenario Outline: As a super user I create environment
    And I click on Environments link
    And I click on "newENV" button
    And I select "<Organization_1>" from the select box
    And I select "<Organization>" from the select box
    And I select existing chef "<environment>" from chef server
    And I check the "<Project>" check box
    And I click on save button
    And I verify created "<environment>" in environments table

    Examples:
      |  Organization |environment |Organization_1|Project |
      |  UAT_RL1      |QA957       |Phoenix       |Catalyst|

  Scenario Outline: As a super user I create a Team
    And I click on the "Users Setup" link
    And I click on the "Teams" link
    And I click on "newTeam" button
    And I enter "<Team Name>" in "teamname" Edit box
    And I enter "<Description>" in "description" Edit box
    And I select "<Organization>" from the select box
    And I check the "superadmin" check box
    And I check the "<Project>" check box
    And I click on save button
    And I verify created "<Team Name>" in the teams table

    Examples:
      |Team Name       |Description         |Organization |Project  |
      |UatTeam2        |UAT  Automation Team|  UAT_RL1    |Catalyst |

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
    And I enter "<Planned cost>" in "plannedCost" Edit box
    And I select "<Organization>" from the select box in new provider page
    And I select "<Region>" from the region select box
    And I select "<Key Pair>" from the key pair select box
    And I click on user pem file browse button and select pem file
    And I click on save button
    And I verify "<AWS service name>" in the provider table
    Examples:
      |AWS service name |Access Key             |Secret Key                               |S3 Bucket Name|Organization|Region                 |Key Pair      |Planned cost|
      |RL_AWS           |AKIAIIK5APRNV54QAVQA   |bz6Hl4wtjXi5Mg2EaZxLR1I/7y0bmYXEiYINDBSp |  RLBilling   |   UAT_RL1  |US West (N. California)| bootstrapncal|12211       |

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
      | RL_VM1     | UAT_RL1    | Ubuntu         |ami-06116566|ubuntu         |

  Scenario Outline: As a super user I create software stack template
    And I click on "Templates" link
    And I click on "newTemplate" button
    And I enter "<Template Name>" in "templatename" Edit box
    And I select "SoftwareStack" from select box
    And I select "<Organization>" from the select box in create template page
    And I verify "chefFactory" is displayed
    And I click on save button
    And I verify "<Template Name>" is available in templates table

    Examples:
      |Template Name|Organization|
      | UAT_Template | UAT_RL1    |

  Scenario Outline: As a super user I create a blueprint and launch it
    And I click on the "DESIGN" link
    And I click on AWS provider
    And I click on "New" link
    And I click on software stack
    And I click on next button
    And I click on the "<Template>"
    And I click on next button
    And I select "<Operating System>" in "instanceOS" select box
    And I select "<Provider>" in "providerId" select box
    And I select "<VMImage>" in "imageId" select box
    And I select "<Region>" in select box
    And I select "<VPC>" in "vpcId" select box
    And I select "<Subnet ID>" in "subnetId" select box
    And I select "<Key Pair>" in "keypairId" select box
    And I select "<Instance Type>" in "instancesize" select box
    And I select security group
    And I select "<Instance Count>" in "instanceCount" select box
    And I click on the "Configure Organization Parameters" link
    And I select "<Organization>" in "orgnameSelect" select box
    And I enter "<Blueprint Name>" in "blueprintNameInput" Edit box
    And I select "<Business Grp>" in "bgListInput" select box
    And I select "<Project>" in "projectListInput" select box
#    And I click on the "Configure Runlist Parameters" link
    And I click on next button
    And I click on OK button
    And I click on launch blueprint on the pop-up menu
    And I click on launch on select blueprint parameter pop-up menu
    And I click on OK button
#    And I verify the following message "Your Created Blueprint is being Launched, kindly check Workzone to view your instance." on "Launching Blueprint" popup window
#    And I verify the following message "Instance Bootstraped successfully" on "Launching Blueprint" popup window
    And I verify the following message "Your Created Blueprint is being Launched, kindly check Workzone to view your instance." on popup window
    And I verify the following message "Instance Bootstraped successfully" on popup window
    And I click on the "Close" button on confirmation popup

    Examples:
      |Operating System|Provider   |VMImage|Region                 |Key Pair     |VPC                                     |Subnet ID                                  |Instance Type|Instance Count|Organization|Blueprint Name|Business Grp|Project |Template     |Chef Server    |User Name|Password Type|
      |Ubuntu          |  RL_AWS   |RL_VM1 |US West (N. California)|bootstrapncal| vpc-bd815ad8 (10.0.0.0/16) RL_DemoSetup|subnet-d7df258e (us-west-1b) Public subnet|t2.micro     |      1       |    UAT_RL1 | RL_Blueprint | Cat_UAT    |Catalyst|UAT_Template |Cat_Chef_Server|ubuntu|Pem File|

  Scenario Outline: As a super user I capture the AWS ID and IP address of  the launched blueprint
    And I  click on Workzone
#    And I verify the "<Organization>" in the workzone
#    And I verify the "<Business Grp>" in the workzone
#    And I verify the "<Project>" in the workzone
#    And I verify created "name of environments" in workzone
#    And I verify created "<Environments>" in workzone and click on it
#    Given I Login to catalyst using "superadmin" access credentials
    And I select the "<Project>" and click on assigned "<environments>"
    And I capture the AWS ID of "<Blueprint Name>"
    And I capture the IP Address of "<Blueprint Name>"
#    And I delete the launched instance from Instances
#    Then I verify "Successfully deleted" message on popup
    And I click on "SETTINGS" link
    And I click on "Config Setup" link
    And I click on "Chef Server" link
    And I select the "<Chef Server>" and click on corresponding "Import Nodes" Button
    And I enter "AWS ID" in the search box and check the corresponding AWS ID checkbox
    And I select the "<environments>" from the drop down
    And I click on OK button
    And I click on Import Nodes button
    And I select "<Business Grp>" in "chefImportBgSelect" drop down in Import Nodes popup window
    And I select "<Project>" in "chefImportProjectSelect" drop down in Import Nodes popup window
    And I enter "<User Name>" in "importUsernameInput" Edit box in Import Nodes popup window
    And I select "<Password Type>" in "pemFileDropdown2" drop down in Import Nodes popup window
    And I browse pem file in Import Nodes popup window
    And I click on Import button on the popup window
    And i verify Importing Nodes popup window is displayed
    And I click on close button on popup window
    And I verify Node Imported with AWS ID
    And I click on close button on popup window
#    And I click on the environment
#    And I click on the "Infrastructure" link
#    And I click on the "Blueprints" link
#    And I click on launch blueprint
#    And I click on the "OK" button on confirmation popup window

    Examples:
      |environments|Organization|Blueprint Name   |Business Grp|Project |Template     |Chef Server    |User Name|Password Type|
      |QA957       | PhoenixApp | RL_Blueprint    | Cat_UAT    |Catalyst|UAT_Template |Cat_Chef_Server|ubuntu   |Pem File     |

  Scenario Outline: As a super user I navigate to Workzone and Delete BluePrint
    And I  click on Workzone
    And I select the "<Project>" and click on assigned "<environments>"
    And I click on the "Infrastructure" link
    And I click on the "Blueprints" link
    And I click on "Delete BluePrint" on blueprint page
    And I click on the "Close" button on "Delete Blueprint" popup window
    Then I verify "Successfully deleted" message on popup

    Examples:
      |environments|Project |
      |QA957       |Catalyst|

  Scenario Outline: As a super user I navigate to Settings and Delete VMImage
    And I click on "SETTINGS" link
    And I click on "Gallery Setup" link
    And I click on "VMImage" link
    And I select the "<VMImage Name>" and click on corresponding "Delete" Button
    And I click on OK button
    And I verify created "<VMImage Name>" is deleted

    Examples:
      |VMImage Name|
      |RL_VM1      |

  Scenario Outline: As a super user I  Delete Templates
    And I click on "Templates" link
    And I select the "<Template Name>" and click on corresponding "Delete" Button
    And I click on OK button
    And I verify the "<Template Name>" is deleted from the Templates table

    Examples:
      |Template Name |
      |UAT_Template |

  Scenario Outline: As a super user I  Delete AWS Provider
    And I click on "DevOps Setup" link
    And I click on "Providers" link
    And I select the "<AWS service name>" and click on corresponding "Delete" Button
    And I click on OK button
    And I verify created "<AWS service name>" is deleted

    Examples:
      |AWS service name|
      |     RL_AWS     |
  Scenario Outline: As a super user I  Delete Chef Server
    And I click on "Config Setup" link
    And I click on "Chef Server" link
    And I select the "<Chef Server>" and click on corresponding "Delete" Button
    And I click on OK button
    And I verify created "<Chef Server>" is deleted

    Examples:
      |Chef Server     |
      |Cat_Chef_Server |

  Scenario Outline: As a super user I  Delete Environment
    And I click on "Organization Setup" link
    And I click on "Environments" link
    And I select the "<environment>" and click on corresponding "Delete" Button
    And I click on OK button
    And I verify the created environment is deleted

    Examples:
      |environment |
      |QA957       |

  Scenario Outline:As a super user I delete the project

    And I select the "<Project name>" and click on corresponding "Delete" Button
    And I click on OK button
    And I verify the "<Project name>" is deleted from project table

    Examples:
      |Project name|
      |Catalyst    |

  Scenario Outline: As a super user I delete the Business Group
    And I click on Business Groups Link
    And I select the "<Business Group>" and click on corresponding "Delete" Button
    And I click on OK button

    Examples:
      |Business Group|
      |   Cat_UAT    |

  Scenario Outline: As a super user I delete the organization
    And I click on "Organizations" link
    And I select the "<Organization>" and click on corresponding "Delete" Button
    And I click on OK button

    Examples:
      |Organization|
      |UAT_RL1     |

  Scenario: As a super user I sign out
    And I Sign Out
    And I verify login page is displayed


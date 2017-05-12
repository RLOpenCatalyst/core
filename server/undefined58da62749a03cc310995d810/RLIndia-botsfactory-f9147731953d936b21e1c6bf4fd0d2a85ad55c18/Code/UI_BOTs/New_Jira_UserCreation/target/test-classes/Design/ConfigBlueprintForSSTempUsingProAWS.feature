@All
Feature: As a super user I Configure Blueprint for Software Stack Template using provider type AWS
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
      |  Organization |environment |Organization_1|Project |Project1     |
      |  UAT_RL1      |QA957       |Phoenix       |Catalyst|CatalystTest |

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
      |Team Name      |Description         |Organization |Project  |Project1|
      |UatAutoTeam8   |UAT  Automation Team|  UAT_RL1    |Catalyst | CatalystTest|

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

  Scenario Outline: As a super user I create another AWS Provider
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
      |RL_AWS_Demo      |  AKIAIIK5APRNV54QAVQA |bz6Hl4wtjXi5Mg2EaZxLR1I/7y0bmYXEiYINDBSp |  RLBilling   |   UAT_RL1  |US West (N. California)| bootstrapncal|20000      |

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

  Scenario Outline: As a super user I create another VMImage
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
      | RL_VM_Demo | UAT_RL1    | Ubuntu         |ami-06116566|ubuntu         |

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
    And I select type of blueprint "SoftwareStack"
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
    And I verify the following message "Your Created Blueprint is being Launched, kindly check Workzone to view your instance." on popup window
    And I verify the following message "Instance Bootstraped successfully" on popup window
    And I click on the "Close" button on confirmation popup


    Examples:
      |Operating System|Provider   |VMImage|Region                 |Key Pair     |VPC                                     |Subnet ID                                  |Instance Type|Instance Count|Organization|Blueprint Name|Business Grp|Project |Template     |environment|
      |Ubuntu          |  RL_AWS   |RL_VM  |US West (N. California)|bootstrapncal| vpc-bd815ad8 (10.0.0.0/16) RL_DemoSetup|subnet-d7df258e (us-west-1b) Public subnet |t2.micro     |      1       |    UAT_RL1 | RL_Blueprint | Cat_UAT    |Catalyst |UAT_Template|  QA957    |

  Scenario Outline: As a super user I create another Business group
    And I click on the Settings
    And I click on "BUSINESS GROUPS" link
    And I click on New BGroup button
    And I enter the "<Business Group>" name in Business Group name
    And I select "<Organization>" from the select box
    And I click on save button
    And I verify the created "<Business Group>" in Business group table

    Examples:
      | Business Group | Organization |
      | Cat_Automation | UAT_RL1      |

  Scenario Outline: As a super user I create another Project
    And I click on Projects link
    And I click on "newProj" button
    And I enter "<Project name>" in "projectname" Edit box
    And I enter "<Description>" in "description" Edit box
    And I select "<Organization>" from the select box
    And I select "<Business Group>" from the drop down
    And I click on save button
    And I verify the created "<Project name>" in project table
    Examples:
      |Project name  |Organization     |Description|Business Group|
      | CatalystTest |UAT_RL1          | Cat_UAT_RL|Cat_Automation|

  Scenario Outline: As a super user I edit the environment and assign new project to that
    And I click on Environments link
    And I select the "<environment>" and click on corresponding "Edit" Button
    Then I Verify "Edit Environment" page is displayed
    And I check the "<Project>" check box
    And I click on save button
    And I verify created "<environment>" in environments table

    Examples:
      | environment |Project       |
      | QA957       | CatalystTest |

  Scenario Outline: As a super user I edit the Team and assign new project to that
    And I click on the "Users Setup" link
    And I click on the "Teams" link
    And I find the "<Team Name>" by navigating to different page in and click on corresponding "Edit" Button
    Then I Verify "Edit Team" page is displayed
    And I check the "<Project>" check box
    And I click on save button
    And I verify created "<Team Name>" in the teams table

    Examples:
      |Team Name      |Project      |
      |UatAutoTeam8    | CatalystTest|

#  Scenario Outline: As a super user I edit the Blueprint
#    And I click on the "DESIGN" link
#    And I click on "SoftwareStack" link
#    And I click on "Edit" button of "<Blueprint>"
#    And I select "<Operating System>" in "instanceOS" select box
#    And I select "<Provider>" in "providerId" select box
#    And I select "<VMImage>" in "imageId" select box
#    And I select "<Region>" in select box
#    And I select "<VPC>" in "vpcId" select box
#    And I select "<Subnet ID>" in "subnetId" select box
#    And I select "<Key Pair>" in "keypairId" select box
#    And I select "<Instance Type>" in "instancesize" select box
#    And I select security group
#    And I select "<Instance Count>" in "instanceCount" select box
#    And I click on the "Configure Organization Parameters" link
#    And I select "<Organization>" in "orgnameSelect" select box
#    And I enter "<Blueprint Name>" in "blueprintNameInput" Edit box
#    And I select "<Business Grp>" in "bgListInput" select box
#    And I select "<Project>" in "projectListInput" select box
##    And I click on the "Configure Runlist Parameters" link
#    And I click on next button
#    And I click on OK button
#
#
#    Examples:
#      |Operating System|Provider     |VMImage     |Region                 |Key Pair     |VPC                                  |Subnet ID                   |Instance Type|Instance Count|Organization|Blueprint Name     |Business Grp|Project |Template     |environment|
#      |Windows         |  RL_AWS_Demo|RL_VM_Demo  |US West (N. California)|bootstrapncal|vpc-aeb105cb (10.1.0.0/16) RL_BigData|subnet-12b4ea54 (us-west-1b)|t2.small     |      2       |    UAT_RL1 | Demo_Blueprint | Cat_UAT    |Catalyst|UAT_Template1 |  QA957    |

#
#
#
#    Examples:
#      ||Blueprint   |
#      |RL_AWS_Demo|RL_Blueprint|

  Scenario Outline: As a super user I copy the Blueprint
    And I click on the "DESIGN" link
    And I click on "SoftwareStack" link
    And I select the desired "<Blueprint>"
    And I click on copy Blueprint
    And I select "<Business Group>" from "bgListInputExistingforcopy" drop down on select target popup
    And I select "<Business Group>" from "projectListInputExistingforcopy" drop down on select target popup
    And I click on "Copy" button on the select target popup
    And I select "<Business Group>" from "bgListInputExisting" drop down on select target popup
    And I click on "SoftwareStack" link
    Then I verify "<Blueprint>" present in "Software Stack" page
    Examples:
      |Business Group|Blueprint   |
      |Cat_Automation|RL_Blueprint|

  Scenario Outline: As a super user I verify the launched blueprint in workzone
    And I navigate to the "Workzone"
    And I select the "<Project>" and click on assigned "<environment>"
    And I click on the "Infrastructure" link
    And I click on the "Blueprints" link
    Then I verify "<Blueprint Name>" present in "Blueprint" page
    And I click on the "Infrastructure" link
    And I click on the "Instances" link
    Then I verify "<Blueprint Name>" present in "Instances" page
    And I click on "More Info" of the "<Blueprint Name>"
    And I verify the following message "Instance Bootstraped successfully" on popup window
    And I click on the "Close" button on instance log popup
    And I select the "<Project1>" and click on assigned "<environment>"
    And I click on the "Infrastructure" link
    And I click on the "Blueprints" link
    Then I verify "<Blueprint Name>" present in "Blueprint" page
    And I click on the "Infrastructure" link
    And I click on the "Instances" link
    Then I verify "<Blueprint Name>" present in "Instances" page

    Examples:
      |Blueprint Name|environment|Project |Project1    |environment|
      | RL_Blueprint |  QA957    |Catalyst|CatalystTest|  QA957    |

  Scenario Outline: As a super user I delete the blueprint
    And I click on the "DESIGN" link
    And I click on "SoftwareStack" link
    And I select the desired "<Blueprint>"
    And I click on "Remove Blueprint" button to delete the blueprint
    And I click on OK button
    Then I verify "<Blueprint>" is deleted

    Examples:
      |Blueprint     |
      | RL_Blueprint |
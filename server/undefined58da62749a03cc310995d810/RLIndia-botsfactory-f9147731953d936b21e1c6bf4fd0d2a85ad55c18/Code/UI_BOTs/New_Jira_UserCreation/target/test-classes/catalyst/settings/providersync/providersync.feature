@ProviderSync
Feature: This feature is the Automation Flow for Provider Sync
  #Creation of Organization
  Scenario Outline: As a super user I create a organization
    Given I Login to catalyst using "<Login User>" access credentials
    And I see the catalyst "workzone"
    And I click on the Settings Link
    And I click on Organizations link in main page
    And I click on "newOrg" button
    And I enter "<Organization>" in "orgname" Edit box
    And I enter "<Domain Name>" in "domainname" Edit box
    And I click on save button
    And I verify the created "<Organization>" in list
    And I select the "<Organization>" and verify "Delete" Button is enabled
    And I select the "<Organization>" and verify "Edit" Button is enabled

    Examples:
      | Login User | Organization | Domain Name |
      | superadmin | StackOrg     | www.stackorg.com |


  #Creation of Business Group
  Scenario Outline: As a super user I create a Business Group
    And I click on Business Groups Link
    And I click on New BGroup button
    And I enter the "<Business Group>" name in Business Group name
    And I select "<Organization>" from the select box
    And I click on save button
    And I verify the created "<Business Group>" in Business group table
    And I verify the created "<Business Group>" in Business group table
    And I select the "<Organization>" and verify "Delete" Button is enabled
    And I select the "<Organization>" and verify "Edit" Button is enabled

    Examples:
      | Organization | Business Group |
      | StackOrg     |  StackBG       |


  #Creation of Project
  Scenario Outline: As a super user I create a Project
    And I click on Projects link
    And I click on "newProj" button
    And I enter "<Project name>" in "projectname" Edit box
    And I enter "<Description>" in "description" Edit box
    And I select "<Organization>" from the select box
    And I click on save button
    And I verify the created "<Project name>" in project table
    And I verify the "<Project name>" with assigned "<Organization>" in project table
    And I verify the "<Project name>" with assigned "<Business Group>" in project table
    And I verify the "<Project name>" with assigned "<Description>" in project table
    And I select the "<Organization>" and verify "Delete" Button is enabled
    And I select the "<Organization>" and verify "Edit" Button is enabled


    Examples:
      | Organization   | Business Group | Project name | Description |
      | StackOrg       |    StackBG     | StackProj    | CatProject  |


  #Creation of New User OrgAdmin
  Scenario Outline: As Superadmin I Create the Admin User
    And I Click on "Users Setup" Link
    And I Click on "Users" Link in the link
    And I Click on New Button of Users page
    And I Enter the "<Admin>" User Login Name
    And I Enter the "<Email address>" of the User
    And I Enter the "<Password>" of the User field
    And I Enter the "<Confirm Password>" of User field
    And I Click on Org Dropdown and select "<Organization>"
    And I Select the Role as "<AdminRole>"
    And I Assign the Teams for the User with respect to "<Organization>"
    And I Click on Save Button of User creation page
    And I Verify the "<Admin>" User is created
    And I Verify the "<Admin>" User with this "<Email address>" is created
    And I Verify the "<Admin>" User with this "<AdminRole>" created
    And I Verify the "<Admin>" User with this "<Organization>" is available
    And I select the "<Admin>" and verify "Delete" Button is enabled
    And I select the "<Admin>" and verify "Edit" Button is enabled

    Examples:
      | Login User | Email address   | Password | Organization | Confirm Password | Admin      | AdminRole |
      | Admin2     | Admin@gmail.com | Admin    |  StackOrg    | Admin            | StackAdmin | Admin     |



  #Creatiion of New Team and Assign Project
  Scenario Outline: As a super user I create a Team and Assign Project
    And I click on the "Teams" link
    And I click on "newTeam" button
    And I enter "<Team Name>" in "teamname" Edit box
    And I enter "<Description>" in "description" Edit box
    And I select "<Organization>" from the select box
    And I check the "superadmin" check box
    And I check the "<Project>" check box
    And I click on save button
    And I verify created "<Team Name>" in the teams table
    And I verify created "<Team Name>" with "<Organization>" in the teams table
    And I select the "<Organization>" and verify "Delete" Button is enabled
    And I select the "<Organization>" and verify "Edit" Button is enabled

    Examples:
      | Team Name | Description         | Organization | Project   |
      | CATEAM    | CAT Automation Team | StackOrg     | StackProj |




  #Creation of ChefServer
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
    And I verify "<name of server>" with "<User Name>" in the Chef Server table
    And I verify "<name of server>" with "<URL>" in the Chef Server table
    And I verify "<name of server>" with "<Organization>" in the Chef Server table
    And I select the "<name of server>" and verify "Import Nodes" Button is enabled
    And I select the "<name of server>" and verify "Edit" Button is enabled
    And I select the "<name of server>" and verify "Chef Factory" Button is enabled
    And I select the "<name of server>" and verify "DataBag" Button is enabled
    And I select the "<name of server>" and verify "Import Nodes" Button is enabled
    And I select the "<name of server>" and verify "Delete" Button is enabled

    Examples:

      | name of server | User Name | URL                                           | Organization  |
      | CChefServer    | mycatqa   | https://api.opscode.com/organizations/cattest | StackOrg      |



  #Creation of Environment
  Scenario Outline: As a super user I create Environment
    And I click on Environments link
    And I click on "newENV" button
    And I select "<Organization>" from the select box
    #And I select the "<Chef Server name>" and click on corresponding "Edit" Button
    #And I verify select organization is disabled
    #And I verify select chef server is disabled
    And I click on add chef environment button on create environment page
    And I enter  chef environment in "chefenvname" Edit box
    And I select the "<project>" to be assigned with Env
    And I click on save button
    And I verify created "name of environments" in environments table
    And I verify "environments" with assigned "<Organization>" in the environments table
    And I verify "environments" with assigned "<Chef Server>" in the environments table
    And I select the "envName" and verify "Edit" Button is enabled in environments table
    And I select the "envName" and verify "Delete" Button is enabled in environments table

    Examples:
      | Organization | Chef Server | project   |
      | StackOrg     | CChefServer | StackProj |


# Creation of Template
  Scenario Outline: As a Super User I Create Software Stack Template
    And I click on "Gallery Setup" link
    And I click on "Templates" link
    And I click on "newTemplate" button
    And I enter "<Template Name>" in "templatename" Edit box
    And I select "SoftwareStack" from select box
    And I select "<Organization>" from the select box
    And I verify "chefFactory" is displayed
    And I click on save button
    And I select "<Template Name>" and verify corresponding "<Template Name>" in Templates table
    And I select "<Template Name>" and verify corresponding "<Organization>" in Templates table
    And I select "<Template Name>" and verify corresponding "<Template Type>" in Templates table
    And I select the "<Template Name>" and verify "Edit" Button is enabled
    And I select the "<Template Name>" and verify "Delete" Button is enabled

    Examples:
      | Template Name | Organization | Template Type |
      | NewApache     |  StackOrg    | SoftwareStack |


  #Creation of Provider
  Scenario Outline: As a super user I create Provider
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
    #And I select "<Organization>" from the dropdown
    And I select "<Region>" from the region select box
    And I select "<Key Pair>" from the key pair select box
    And I click on user pem file browse button and select pem file
    And I click on save button
    And I verify "<Provider Type>" in the provider table

    Examples:
      | AWS service name | Access Key             | Secret Key                               | S3 Bucket Name | Organization | Region                  | Key Pair      | Provider Type | Organization |
      | AWSProv          | AKIAIIK5APRNV54QAVQA   | bz6Hl4wtjXi5Mg2EaZxLR1I/7y0bmYXEiYINDBSp |  RLBilling     |   StackOrg   | US West (N. California) | bootstrapncal | AWS           | StackOrg     |

  #Creation of VM Image
  Scenario Outline: As a super user I Create VM Image
    #And I click on "Gallery Setup" link
    And I click on "VMImage" link
    And I click on "addnewitem" button
    And I enter "<VMImage Name>" in "name" Edit box
    And I select "<Organization>" from the dropdown
    And I select "<Operating System>" type
    And I enter "<Image ID>" in "imageidentifire" Edit box
    And I enter "<Admin User Name>" in "UserName" Edit box
    And I click on save button
    And I verify created "<VMImage Name>" in the Images table
    And I select "<VMImage Name>" and verify given "<Image ID>" in Images table
    And I select "<VMImage Name>" and verify assigned "<Organization>" in Images table
    And I select "<VMImage Name>" and verify assigned "<Provider Name>" in Images table
    And I select "<VMImage Name>" and verify assigned "<Operating System>" in Images table
    And I select the "<VMImage Name>" and verify "Edit" Button is enabled
    And I select the "<VMImage Name>" and verify "Delete" Button is enabled

    Examples:
      | VMImage Name | Organization | Operating System | Image ID     | Admin User Name | Provider Name |
      | UbuntuIMg    |  StackOrg    | Ubuntu           | ami-06116566 | ubuntu          |   AWSProv     |


  #Creation of Blueprint & Launch of Blueprint
  Scenario Outline: As a super user I create a software stack blueprint and launch it
    Given I Login to catalyst using "superadmin" access credentials
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
    And I click on the "Configure Runlist Parameters" link
    And I click on next button
    And I click on OK button
    And I click on launch blueprint on the pop-up menu
    And I click on launch on select blueprint parameter pop-up menu
    And I click on OK button
    And I verify the following message "Your Created Blueprint is being Launched, kindly check Workzone to view your instance." on "Launching Blueprint" popup window
    And I verify the following message "Instance Bootstraped successfully" on "Launching Blueprint" popup window
    And I click on the "Close" button on confirmation popup
    #And I  click on Workzone
    And I verify the "<Organization>" in the workzone
    And I verify the "<Business Grp>" in the workzone
    And I verify the "<Project>" in the workzone
    And I verify created "name of environments" in workzone

    Examples:
      | Operating System | Provider | VMImage    | Region                  | Key Pair      | VPC                                     | Subnet ID                                  | Instance Type | Instance Count | Organization | Blueprint Name  | Business Grp | Project   | Template  | Chef Server     | User Name | Password Type |
      | Ubuntu           | AWSProv  | UbuntuIMg  | US West (N. California) | bootstrapncal | vpc-bd815ad8 (10.0.0.0/16) RL_DemoSetup | subnet-d7df258e (us-west-1b) Public subnet | t2.micro      |      1         |   StackOrg   | SStackBluprnt   | StackBG      | StackProj | NewApache | Cat_Chef_Server | ubuntu    | Pem File      |

    #Verification of the node under Managed tab in providers



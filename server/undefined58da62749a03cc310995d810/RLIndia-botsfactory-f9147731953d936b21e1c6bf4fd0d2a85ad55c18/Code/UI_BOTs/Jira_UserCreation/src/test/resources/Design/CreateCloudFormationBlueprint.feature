@Thirteen
Feature: As a super user I Configure Blueprint for Cloud Formation Template using provider type AWS
  Scenario Outline: As a super user I create CloudFormation Blueprint
    Given I Login to catalyst using "superadmin" access credentials
    And I see the catalyst "workzone"
    And I click on the "DESIGN" link
    #And I click on AWS provider
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
    And I click on the link workzone
    And I Click on "Infrastructure" link
    And I Click on "Blueprints" link provided
    And I Click on "CloudFormation" Tab provided
    And I Verify the Cloudformation Blueprint is created "<Blueprint Name>"





    #And I click on launch blueprint on the pop-up menu
    #And I click on launch on select blueprint parameter pop-up menu
    #And I click on OK button
    #And I enter "<Unique Stack Name>" on popup window
    #And I click on the submit button
    #And I verify the following message "Your Created Blueprint is being Launched, kindly check Workzone to view your instance." on "Launching Blueprint" popup window
    #And I click on the "Close" button on confirmation popup

    Examples:
      | Organization |Blueprint Name|Business Grp|Project  |Template  |Provider |Region                 |Java Stack|Key Name      |Subnet          |Security Group|AMImage ID   |Instance UserName|Instance Type|Unique Stack Name|
      |    UAT_RL    | RLCloud      | RLBG       |Catalyst |RL_Cloud  | RL_AWS  |US West (N. California)|java-test | bootstrapncal| subnet-d7df258e| sg-eeff688b  |ami-06116566 |  RL_Catalyst    |t2.micro     |      RL2995     |



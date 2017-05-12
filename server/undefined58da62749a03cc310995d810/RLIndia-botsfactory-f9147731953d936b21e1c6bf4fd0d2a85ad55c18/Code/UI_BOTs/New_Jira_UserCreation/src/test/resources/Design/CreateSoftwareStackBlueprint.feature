@Fourteen
Feature: As a super user I Create Blueprint Software Stack Blueprint using provider type AWS
  Scenario Outline: As a super user I create a SoftwareStack Blueprint
   Given I Login to catalyst using "superadmin" access credentials
    And I see the catalyst "workzone"
    And I click on the "DESIGN" link
    #And I click on AWS provider
    And I click on "New" link
    And I select the "<Organization>" from drop down
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
    And I click on the link workzone
    And I Click on "Infrastructure" link
    And I Click on "Blueprints" link provided

    #And I Click on SoftwareStack Tab now
    And I Verify the SoftwareStack Blueprint is created "<Blueprint Name>"


    #And I click on launch blueprint on the pop-up menu
    #And I click on launch on select blueprint parameter pop-up menu
    #And I click on OK button
    #And I verify the following message "Your Created Blueprint is being Launched, kindly check Workzone to view your instance." on popup window
    #And I verify the following message "Instance Bootstraped successfully" on popup window
    #And I click on the "Close" button on confirmation popup



    Examples:
      |Operating System|Provider |VMImage|Region                 |Key Pair     |VPC                                     |Subnet ID                                  |Instance Type|Instance Count|Organization|Blueprint Name|Business Grp|Project  |Template |environment|
      |Ubuntu          |  RL_AWS |RL_VM  |US West (N. California)|bootstrapncal| vpc-bd815ad8 (10.0.0.0/16) RL_DemoSetup|subnet-d7df258e (us-west-1b) Public subnet |t2.micro     |      1       |    UAT_RL  | RL_SStack    | RLBG       |Catalyst |RL_UAT  |  QA957    |

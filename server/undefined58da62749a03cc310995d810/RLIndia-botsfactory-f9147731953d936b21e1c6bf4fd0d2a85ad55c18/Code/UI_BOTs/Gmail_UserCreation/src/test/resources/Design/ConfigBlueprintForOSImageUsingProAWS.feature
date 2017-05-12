@All
Feature: As a super user I Configure Blueprint for OSImage using provider type AWS
  Scenario Outline: As a super user I create a Cloud Formation blueprint
    And I click on the "DESIGN" link
    And I click on AWS provider
    And I click on "New" link
    And I select the "<Organization>" from drop down
    And I select type of blueprint "OSImage"
    And I click on next button
    And I click on the "<Image>"
    And I click on next button
    And I see Choose Operating System is disabled
    And I see Choose Provider is disabled
    And I see Choose Available Images is disabled
    And I select "<Region>" in select box
    And I select "<VPC>" in "vpcId" select box
    And I select "<Subnet ID>" in "subnetId" select box
    And I select "<Key Pair>" in "keypairId" select box
    And I select "<Instance Type>" in "instancesize" select box
    And I select security group
    And I select "<Instance Count>" in "instanceCount" select box
    And I click on the "Configure Organization Parameters" link
    And I see Choose Organization is disabled
    And I enter "<Blueprint Name>" in "blueprintNameInput" Edit box
    And I select "<Business Grp>" in "bgListInput" select box
    And I select "<Project>" in "projectListInput" select box
    And I click on next button
    And I click on OK button
    Then I verify launch blueprint button is dispalyed

    Examples:
      |Organization|Blueprint Name|Business Grp|Project  |Image    |Provider |Region                 |Java Stack|Key Name      |Subnet          |Security Group|AMImage ID   |Instance UserName|Instance Type|Unique Stack Name|
      |    UAT_RL1 | RL_Blueprint | Cat_UAT    |Catalyst |RL_VM    |  RL_AWS |US West (N. California)|java-test | bootstrapncal| subnet-d7df258e|   sg-eeff688b|ami-06116566 |  RL_Catalyst    |t2.micro     |      RL2995     |


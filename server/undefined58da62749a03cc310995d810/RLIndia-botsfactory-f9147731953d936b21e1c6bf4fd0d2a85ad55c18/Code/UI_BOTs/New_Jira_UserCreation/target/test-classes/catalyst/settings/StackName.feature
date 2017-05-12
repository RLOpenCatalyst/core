@all
Feature: As a Super user, cloud formation stack creation

  Scenario Outline: As a Super user, I create cloud formation stack
    Given I Login to catalyst using "<Login User>" access credentials
    And I see the catalyst dashboard
    And I navigate to the "Workzone"
#    And I click on the "Product" link to expend the tree
#    And I click on the "Catalyst" link to expend the tree
    And I click on the "RL_Customer" link
    And I click on the "Infrastructure" link
    And I click on the "Blueprints" link
    And I collapse the first section "SoftwareStack"
    And I expand the "CloudFormation" section
    And I select the "customername" blueprint and click on the Launch button
    And I click on the "OK" button on confirmation popup window
    And I enter "<stackName>" unique stack name
    And I click on the submit button
    And I verify the following message "Your Selected Blueprint is being Launched, kindly check back in a while" on "Launching Blueprint" popup window
    And I click on the "Close" button on confirmation popup
    And I click on the "RL_Customer" link
    And I click on the "Infrastructure" link
    And I click on the "CloudFormation" link
    And I verify the "<stackName>" stack name and status "CREATE_COMPLETE" in cloudformation

    And I click on the "Infrastructure" link
    And I click on the "Instances" link
    And I click on more Info icon of "NginX" instance card
    And I verify the following message "Instance Bootstraped successfully"
    And I click on the "Close" button on confirmation popup window

    And I click on more Info icon of "Catalyst" instance card
    And I verify the following message "Instance Bootstraped successfully"
    And I click on the "Close" button on confirmation popup window

    And I extract IP address of "NginX" instance card
    And I extract IP address of "Catalyst" instance card

    Examples:
      | Login User | stackName |
      | Admin2     | RL2995     |

  Scenario Outline: As superadmin user ,I login to created stack
    Given I Login to created new stack "<stackName>" using "<Login User>" access credentials
    And I Sign Out

    Examples:
      | Login User | stackName |
      | Admin2     | RL2995     |


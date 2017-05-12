@all
Feature: As a Super user, cloud formation stack creation

  Scenario Outline: As a Super user, I create cloud formation stack
    Given I Login to catalyst using "<Login User>" access credentials
    And I navigate to the trackNew
    And I click on the line chart "Notifications"
    And I click on the file "Notifications"
    And I click on the desktop "Notifications"
    And I click on the "Telemetry" tab
    And I verify the Public IP address exist in "Catalyst" instance
    And I extract Private IP address of "Catalyst" instance card
    And I verify the Public IP address exist in "NginX" instance
    And I extract Private IP address of "NginX" instance card
    And I click on the "Adverse Event" tab
    And I switch to default frame

  Examples:
    | Login User |
    | Admin2     |


  Scenario Outline: As super admin user ,I login to created stack
    Given I Login to created new stack "<stackName>" using "<Login User>" access credentials
    And I Sign Out

  Examples:
    | Login User |
    | superadmin |


@Designer
Feature: As SuperAdmin I Create Organization, Create, Edit, Delete a Designer User & Delete Organization

  Scenario Outline: As a super user I create a organization

    Given I Login to catalyst using "<Login User>" access credentials
    #Then I see the catalyst "workzone"
    #And I click on the "SETTINGS" link
    And I move the cursor on "Menu"
    And I click on the "Org Configuration" link
    And I click on the "Organizations" link
    And I click on "newOrg" button
    And I enter "<Organization>" in "orgname" Edit box
#    And I enter "<Domain Name>" in "domainname" Edit box
    And I click on save button
    Then I verify the created "<Organization>" in organization table


    Examples:
      | Login User | Organization |
      | superadmin | RelevanceLab |

  Scenario Outline: As Superadmin I Create the Designer User
    And I move the cursor on "Menu"
    And I click on the "User Configuration" link
#    And I Click on "Users Setup" Link
#    And I Click on "Users" Link in the link
    And I click on the "Users" link
    And I Click on New Button of Users page
    And I Enter the "<Designer>" User Login Name
    And I Enter the "<Email address>" of the User
    And I Enter the "<Password>" of the User field
    And I Enter the "<Confirm Password>" of User field
    And I Click on Org Dropdown and select "<Organization>"
    And I Select the Role as "<DesignerRole>"
    And I Assign the Teams for the User with respect to "<Organization>"
    And I Click on Save Button of User creation page
    Then I Verify the "<Designer>" User is created
    Then I Verify the "<Designer>" User with this "<Email address>" is created
    Then I Verify the "<Designer>" User with this "<DesignerRole>" created
    Then I Verify the "<Designer>" User with this "<Organization>" is available
    Then I select the "<Designer>" and verify "Delete" Button is enabled
    Then I select the "<Designer>" and verify "Edit" Button is enabled



    Examples:
      | Login User | Email address      | Password | Organization | Confirm Password | Designer | DesignerRole | Organization |
      | Admin2     | Designer@gmail.com | Designer | RelevanceLab | Designer         | Designer | Designer     | RelevanceLab |


  Scenario Outline: As SuperAdmin I Edit the Designer User
    And I Click on Edit Button the "<Designer>" user created
    #And I Verify the Login name is disabled
    And I Enter the "<Email address>" of the User
    And I Click on Update Password tick
    And I Enter the "<Password>" of the User field
    And I Enter the "<Confirm Password>" of User field
    And I Select the Role as "<AdminRole>"
    And I Click on Save Button of User creation page
    Then I Verify the "<Designer>" User is created
    Then I Verify the "<Designer>" User with this "<Email address>" is created
    Then I Verify the "<Designer>" User with this "<DesignerRole>" created
    Then I Verify the "<Designer>" User with this "<Organization>" is available
    Then I select the "<Designer>" and verify "Delete" Button is enabled
    Then I select the "<Designer>" and verify "Edit" Button is enabled


    Examples:
       | Designer | Email address         | Password    | Confirm Password | AdminRole | Organization | DesignerRole   |
       | Designer | Designernew@gmail.com | DesignerNew | DesignerNew      | Admin     | RelevanceLab | Admin,Designer |


  Scenario Outline: As SuperAdmin I Delete the Designer User
    And I Click on Delete button of the "<Designer>" user created
    And I Click on "OK" Button to remove the Designer user
    Then I Verify the "<Designer>" user is deleted

    Examples:
       | Designer |
       | Designer |


  Scenario Outline: As SuperAdmin I Delete the Created Organization
    And I move the cursor on "Menu"
    And I click on Organizations link in the settings tree
    And I click on "<Organization>" delete button
    And I click on OK button
#    Then I verify the "<Organization>" is deleted

    Examples:
      | Organization     |
      | RelevanceLab     |

  Scenario:As a super user I  Sign out
    And I Sign Out
    Then I verify login page is displayed

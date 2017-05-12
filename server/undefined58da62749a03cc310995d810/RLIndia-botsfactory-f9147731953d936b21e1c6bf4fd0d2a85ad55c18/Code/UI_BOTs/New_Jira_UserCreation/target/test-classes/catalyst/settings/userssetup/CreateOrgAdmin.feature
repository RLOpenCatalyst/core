@Five
Feature: As SuperAdmin I Create OrgAdmin

  Scenario Outline: As Superadmin I Create the Admin User
    #Given I Login to catalyst using "superadmin" access credentials
    #Then I see the catalyst "workzone"
    #And I click on the "SETTINGS" link

    And I move the cursor on "Menu"
    #And I Click on "Users Setup" Link
    #And I Click on "Users" Link in the link
    #And I click on the "User Configuration" link
    And I click on the "Users" link
    And I Click on New Button of Users page
    And I Enter the "<Admin>" User Login Name
    And I Enter the "<Email address>" of the User
    And I Enter the "<Password>" of the User field
    And I Enter the "<Confirm Password>" of User field
    And I Click on Org Dropdown and select "<Organization>"
    And I Select the Role as "<AdminRole>"
    And I Assign the Teams for the User with respect to "<Organization>"
    And I Click on Save Button of User creation page
    Then I Verify the "<Organization>" User is created
    Then I Verify the "<Admin>" User with this "<Email address>" is created
    Then I Verify the "<Admin>" User with this "<AdminRole>" created
    Then I Verify the "<Admin>" User with this "<Organization>" is available
    Then I select the "<Admin>" and verify "Delete" Button is enabled
    Then I select the "<Admin>" and verify "Edit" Button is enabled


    Examples:
      | Login User | Email address   | Password | Organization | Confirm Password | Admin | AdminRole |
      | Admin2     | Admin@gmail.com | Admin    | UAT_RL       | Admin            | Admin | Admin     |



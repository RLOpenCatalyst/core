@SuperAdmin
Feature: Creation of SuperAdmin User
  Scenario Outline: As Superadmin I Create the SuperAdmin User
    And I move the cursor on "Menu"
  #    And I Click on "Users Setup" Link
  #    And I Click on "Users" Link in the link
    And I click on the "User Configuration" link
    And I click on the "Users" link
    And I Click on New Button of Users page
    And I Enter the "<SuperAdmin>" User Login Name
    And I Enter the "<Email address>" of the User
    And I Enter the "<Password>" of the User field
    And I Enter the "<Confirm Password>" of User field
    And I Click on Org Dropdown and select "<Organization>"
    And I Select the Role as "<AdminRole>"
    And I Assign the Teams for the SuperAdmin User with respect to "<Team Default>"
    And I Click on Save Button of User creation page
    Then I Verify the "<SuperAdmin>" User is created
    Then I Verify the "<SuperAdmin>" User with this "<Email address>" is created
    And I Verify the "<SuperAdmin>" User with this "<AdminRole>" created
    And I Verify the "<SuperAdmin>" User with this "<Organization>" is available
    And I select the "<SuperAdmin>" and verify "Delete" Button is enabled
    And I select the "<SuperAdmin>" and verify "Edit" Button is enabled

    Examples:
      | Organizationname | Email address       | Password  | Organization | Confirm Password | SuperAdmin | AdminRole | Team Default   |
      | RelevanceLab     | Superuser@gmail.com | Superuser | All          | Superuser        | SuperUser  | Admin     | UAT_RL1_Admins |


@Jira
Feature: As a Admin I login to Jira Account and Create a User

  Scenario Outline: As a Admin I login to Jira Account and Create a User
    Given I login to jira using "<username>" and access credentials "<password>"
    And I click on "Administration" option at top right
    And I Click on "User management" option
    And I Enter the "<FullName>" of the user
    And I Enter the "<EmailAddress>"
    And I Click on "Create users" button
    And I Close the Unwanted Popup
    And I verify the created user "<FullName>" in the table
    And I Click on the created user "<FullName>" link
    #And I Click on Deactivate dropdown
    #And I Select the "Delete" option
    #And I Confirm the User Deletion by clicking on "Delete" button
    And I Click on UserProfile Account
    And I Sign out of Jira Account


    Examples:
      | username                | password         | FullName | EmailAddress                          |
      | vimal11592@gmail.com    | vimal11592mishra | ashna     | ashna@gmail.com |

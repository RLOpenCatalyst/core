$(document).ready(function() {var formatter = new CucumberHTML.DOMFormatter($('.cucumber-report'));formatter.uri("src/test/resources/catalyst/settings/JiraScenarios/deleteJiraUser.feature");
formatter.feature({
  "line": 2,
  "name": "As a Admin I login to Jira Account and Delete a User",
  "description": "",
  "id": "as-a-admin-i-login-to-jira-account-and-delete-a-user",
  "keyword": "Feature",
  "tags": [
    {
      "line": 1,
      "name": "@Jira"
    }
  ]
});
formatter.scenario({
  "line": 4,
  "name": "As a Admin I login to Jira Account and Delete a User",
  "description": "",
  "id": "as-a-admin-i-login-to-jira-account-and-delete-a-user;as-a-admin-i-login-to-jira-account-and-delete-a-user",
  "type": "scenario",
  "keyword": "Scenario"
});
formatter.step({
  "comments": [
    {
      "line": 5,
      "value": "#Given I login to jira using \"\u003cusername\u003e\" and access credentials \"\u003cpassword\u003e\""
    }
  ],
  "line": 6,
  "name": "I login to jira using username and access credentials password",
  "keyword": "Given "
});
formatter.step({
  "line": 8,
  "name": "I click on \"Administration\" option at top right",
  "keyword": "And "
});
formatter.step({
  "line": 9,
  "name": "I Click on \"User management\" option",
  "keyword": "And "
});
formatter.step({
  "comments": [
    {
      "line": 10,
      "value": "#And I Enter the \"\u003cFullName\u003e\" of the user"
    },
    {
      "line": 11,
      "value": "#And I Enter the \"\u003cEmailAddress\u003e\""
    },
    {
      "line": 12,
      "value": "#And I Click on \"Create users\" button"
    },
    {
      "line": 13,
      "value": "#And I Close the Unwanted Popup"
    }
  ],
  "line": 14,
  "name": "I verify the created user \"\u003cFullName\u003e\" in the table",
  "keyword": "And "
});
formatter.step({
  "line": 15,
  "name": "I Click on the created user \"\u003cFullName\u003e\" link",
  "keyword": "And "
});
formatter.step({
  "line": 16,
  "name": "I Click on Deactivate dropdown",
  "keyword": "And "
});
formatter.step({
  "line": 17,
  "name": "I Select the \"Delete\" option",
  "keyword": "And "
});
formatter.step({
  "line": 18,
  "name": "I Confirm the User Deletion by clicking on \"Delete\" button",
  "keyword": "And "
});
formatter.step({
  "line": 19,
  "name": "I Click on UserProfile Account",
  "keyword": "And "
});
formatter.step({
  "line": 20,
  "name": "I Sign out of Jira Account",
  "keyword": "And "
});
formatter.match({
  "location": "LoginSteps.iLoginToJiraUsingUsernameAndAccessCredentialsPassword()"
});
formatter.result({
  "duration": 69036435418,
  "status": "passed"
});
formatter.match({
  "arguments": [
    {
      "val": "Administration",
      "offset": 12
    }
  ],
  "location": "JiraSteps.iClickOnOptionAtTopRight(String)"
});
formatter.result({
  "duration": 8577743606,
  "status": "passed"
});
formatter.match({
  "arguments": [
    {
      "val": "User management",
      "offset": 12
    }
  ],
  "location": "JiraSteps.iClickOnOption(String)"
});
formatter.result({
  "duration": 3171896882,
  "status": "passed"
});
formatter.match({
  "arguments": [
    {
      "val": "\u003cFullName\u003e",
      "offset": 27
    }
  ],
  "location": "JiraSteps.iVerifyTheCreatedUserInTheTable(String)"
});
formatter.result({
  "duration": 5763272010,
  "status": "passed"
});
formatter.match({
  "arguments": [
    {
      "val": "\u003cFullName\u003e",
      "offset": 29
    }
  ],
  "location": "JiraSteps.iClickOnTheCreatedUserLink(String)"
});
formatter.result({
  "duration": 4181204847,
  "status": "passed"
});
formatter.match({
  "location": "JiraSteps.iClickOnDeactivateDropdown()"
});
formatter.result({
  "duration": 3219253686,
  "status": "passed"
});
formatter.match({
  "arguments": [
    {
      "val": "Delete",
      "offset": 14
    }
  ],
  "location": "JiraSteps.iSelectTheOption(String)"
});
formatter.result({
  "duration": 3273956431,
  "status": "passed"
});
formatter.match({
  "arguments": [
    {
      "val": "Delete",
      "offset": 44
    }
  ],
  "location": "JiraSteps.iConfirmTheUserDeletionByClickingOnButton(String)"
});
formatter.result({
  "duration": 1526009350,
  "status": "passed"
});
formatter.match({
  "location": "JiraSteps.iClickOnUserProfileAccount()"
});
formatter.result({
  "duration": 4303057886,
  "status": "passed"
});
formatter.match({
  "location": "LoginSteps.iSignOutOfJiraAccount()"
});
formatter.result({
  "duration": 5735921707,
  "status": "passed"
});
});
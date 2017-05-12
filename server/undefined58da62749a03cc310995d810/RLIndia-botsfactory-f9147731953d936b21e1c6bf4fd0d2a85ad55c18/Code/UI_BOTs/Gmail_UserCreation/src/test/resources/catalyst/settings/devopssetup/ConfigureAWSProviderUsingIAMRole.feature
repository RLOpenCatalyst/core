@All
Feature: As a super user I configure AWS Provider using IAM Role

  Scenario Outline: As a super user I create a organization
    Given I Login to catalyst using "<Login User>" access credentials
    And I see the catalyst "workzone"
    And I click on the Settings Link
    And I click on Organizations link in main page
    And I click on "newOrg" button
    And I enter "<Organization>" in "orgname" Edit box
    And I click on save button
    And I verify the created "<Organization>" in list

    Examples:
      | Login User | Organization |
      | superadmin | UAT_RL1      |


  Scenario Outline: As a super user I create a AWS Provider
    And I click on "DevOps Setup" link
    And I click on "Providers" link
    And I click on "addnewitem" button
    And I select provider type "AWS"
    And I click on "credentials-IAMRole" User Access Key
    And I enter "<AWS service name>" in "name" Edit box
    And I enter "<S3 Bucket Name>" in "s3BucketName" Edit box
    And I select "<Organization>" from the select box
    And I select "<Region>" from the region select box
    And I select "<Key Pair>" from the key pair select box
    And I click on user pem file browse button and select pem file
    And I click on save button


    Examples:
      |AWS service name |S3 Bucket Name|Organization|Region                 |Key Pair      |
      |RL_AWS_IAMKey    |  RLBilling   |   UAT_RL1  |US West (N. California)| bootstrapncal|


  Scenario Outline:As a super user I edit the created a AWS Provider
    And I select the "<Organization>" and click on corresponding "Edit" Button
    And I clear the existing "name" in the edit box
    And I enter "<AWS service name>" in "name" Edit box
    And I clear the existing "s3BucketName" in the edit box
    And I enter "<new S3 Bucket Name>" in "s3BucketName" Edit box
    And I select "<new Organization>" from the drop down
    And I click on save button

    Examples:
      |Organization|AWS service name|new Organization|new S3 Bucket Name|
      |UAT_RL1     |RL_AWS_Provider |UAT_RL2     |    RLBilling     |

  Scenario Outline: As a super user I delete the created a AWS Provider
    And I select the "<AWS service name>" and click on corresponding "Delete" Button
    And I click on OK button
    And I verify created "<AWS service name>" is deleted

    Examples:
      |AWS service name|
      |RL_AWS_Provider |

  Scenario Outline: As a super user I delete the created a organization
    And I click on "Organizations" link
    And I click on "<Organization>" delete button
    And I click on OK button
    And I click on "<Organization_2>" delete button

    Examples:
      |Organization|Organization_2|
      |UAT_RL1     |UAT_RL2       |

  Scenario: As a super user I Sign out
    And I Sign Out
    And I verify login page is displayed

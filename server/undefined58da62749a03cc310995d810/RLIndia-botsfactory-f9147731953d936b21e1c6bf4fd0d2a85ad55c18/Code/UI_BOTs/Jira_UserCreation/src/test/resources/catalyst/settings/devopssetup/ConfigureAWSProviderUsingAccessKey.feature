@All
Feature: As a super user I configure AWS provider Using Access keys

  Scenario Outline: As a super user I create a organization
    Given I Login to catalyst using "<Login User>" access credentials
    Then I see the catalyst "workzone"
    And I click on the "SETTINGS" link
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
      | superadmin | UAT_RL1      |

  Scenario Outline: As a super user I create a AWS Provider
    And I move the cursor on "Menu"
    And I click on "Provider Configuration" link
    And I click on "Providers" link
    And I click on "addnewitem" button
    And I select provider type "AWS"
    And I enter "<AWS service name>" in "name" Edit box
    And I click on "credentials-accessKeys" User Access Key
    And I enter "<Access Key>" in "accessKey" Edit box
    And I enter "<Secret Key>" in "secretKey" Edit box
    And I enter "<S3 Bucket Name>" in "s3BucketName" Edit box
    And I select "<Organization>" from the select box in new provider page
#    And I select "<Organization>" from the select box
    And I select "<Region>" from the region select box
    And I select "<Key Pair>" from the key pair select box
    And I browse pem file for provider
    And I click on save button
    Then I verify "<AWS service name>" in the provider table
    Then I verify "<AWS service name>" with "<Provider Type>" in the provider table
    Then I verify "<AWS service name>" with "<Organization>" in the provider table
    Then I select the "<AWS service name>" and verify "Edit" Button is enabled
    Then I select the "<AWS service name>" and verify "Sync Instances" Button is enabled
    Then I select the "<AWS service name>" and verify "Delete" Button is enabled

    Examples:
      | AWS service name | Access Key             | Secret Key                               | S3 Bucket Name | Organization | Region                 | Key Pair      | Provider Type |
      | RL_AWS           |  AKIAIIK5APRNV54QAVQA  | bz6Hl4wtjXi5Mg2EaZxLR1I/7y0bmYXEiYINDBSp |  RLBilling     |   UAT_RL1    | US West (N. California)| bootstrapncal |  AWS          |


  Scenario Outline:As a super user I edit the created a AWS Provider
    And I select the "<AWS service name>" and click on corresponding "Edit" Button
    And I clear the existing "name" in the edit box
    And I enter "<New AWS service name>" in "name" Edit box
    And I verify select provider type is disabled
    And I verify "credentials-accessKeys" is disabled
    And I verify "accessKey" is disabled
    And I verify "secretKey" is disabled
    And I verify select organization is disabled in edit provider page
    And I verify select region is disabled in edit provider page
    And I verify select key pair is disabled in edit provider page
    And I click on save button
    Then I verify "<New AWS service name>" in the provider table
    Then I verify "<New AWS service name>" with "<Provider Type>" in the provider table
    Then I verify "<New AWS service name>" with "<Organization>" in the provider table
    Then I select the "<New AWS service name>" and verify "Edit" Button is enabled
    Then I select the "<New AWS service name>" and verify "Sync Instances" Button is enabled
    Then I select the "<New AWS service name>" and verify "Delete" Button is enabled

    Examples:
      | AWS service name | New AWS service name | Provider Type | Organization |
      |  RL_AWS          | RL_AWS_QA            |      AWS      | UAT_RL1      |

  Scenario Outline: As a super user I delete the created a AWS Provider
    And I select the "<AWS service name>" and click on corresponding "Delete" Button
    And I click on OK button
    Then I verify created "<AWS service name>" is deleted

    Examples:
      |AWS service name|
      |RL_AWS_QA      |

  Scenario Outline: As a super user I delete the created Organization
    And I move the cursor on "Menu"
    And I click on "Organizations" link
    And I select the "<Organization>" and click on corresponding "Delete" Button
    And I click on OK button
#    Then I verify the "<Organization>" is deleted
    Examples:
      |Organization|
      |UAT_RL1     |

  Scenario: As a super user I Sign out
    And I Sign Out
    Then I verify login page is displayed


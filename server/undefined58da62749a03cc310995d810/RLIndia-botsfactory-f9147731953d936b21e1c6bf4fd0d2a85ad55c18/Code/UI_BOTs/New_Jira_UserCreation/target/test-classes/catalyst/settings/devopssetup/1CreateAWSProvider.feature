@Eleven
Feature: As a super user I configure AWS provider Using Access keys
  Scenario Outline: As a super user I create a AWS Provider
    Given I Login to catalyst using "superadmin" access credentials
    #Then I see the catalyst "workzone"
    #And I click on the "SETTINGS" link
    And I Check where application is landing and take the step
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
      | AWS service name | Access Key           | Secret Key                               | S3 Bucket Name | Organization | Region                  | Key Pair      | Provider Type |
      | RL_AWS           | AKIAIIK5APRNV54QAVQA | bz6Hl4wtjXi5Mg2EaZxLR1I/7y0bmYXEiYINDBSp | RLBilling      | UAT_RL       | US West (N. California) | bootstrapncal | AWS           |


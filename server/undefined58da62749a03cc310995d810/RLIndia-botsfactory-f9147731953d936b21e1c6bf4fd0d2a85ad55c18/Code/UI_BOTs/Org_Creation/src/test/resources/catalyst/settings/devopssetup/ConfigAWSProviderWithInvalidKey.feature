@All
Feature: As a super user I Configure AWS Provider with invalid key and Verify the expected popup

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
      | superadmin | UAT_RL       |

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
#    And I select "<Key Pair>" from the key pair select box
#    And I click on user pem file browse button and select pem file
    Then I verify the following message "AWS was not able to validate the provided access credentials" on popup window
    And I click on OK button

    Examples:
      |AWS service name |      Access Key     |                 Secret Key              |S3 Bucket Name|Organization|       Region          |Key Pair      |
      |    RL_AWS       |AHHSFJKSKKMNS4235HHA |bz6Hl4wtjXi5Mg2EaZxLR1I/7y0bjdhyjdhhhhSp | ABucket      |   UAT_RL  |US West (N. California)| bootstrap    |

  Scenario Outline: As a super user I delete the created a Organization
    And I move the cursor on "Menu"
    And I click on Organizations link in the settings tree
    And I click on "<Organization>" delete button
    And I click on OK button
#    Then I verify the "<Organization>" is deleted

    Examples:
      |Organization|
      |UAT_RL      |

  Scenario: As a super user I Sign out
    And I Sign Out
    Then I verify login page is displayed

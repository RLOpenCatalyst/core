@Application
Feature: Login and Logout of Mail Application
  Scenario Outline: Login and Logout of Mail Application
    Given I Login to catalyst using "<AppUrl>" and "<Login User>" and "<Password>"access credentials
    Then I logged out of application successfully


    Examples:
       |  Password    | Login User                    |   AppUrl           |
       | #64J&uV%L1   | servicedesk@relevancelab.com  | https://www.gmail.com |
       |  1234%asd    | bjohn287@yahoo.com            | https://login.yahoo.com/ |

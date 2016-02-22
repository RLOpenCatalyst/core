# Catalyst Core Repository
Repository for RLCatalyst core


#About RLCatalyst

RLCatalyst is an end-to-end automation platform that helps enterprises adopt devops maturity and benefits. Catalyst is  powered by Chef and integrated with all major cloud providers like AWS, Azure, Openstack, VMware etc. It provides seamless Infrastructure Automation across data centers, environments, applications with Configuration Management & Service Orchestration to help enterprises achieve end-to-end IT DevOps Service Automation and being prepared for Web-scale IT.
Few of the highlights of Catalyst are:
 * It helps in adopting intelligent devops – from Unmanaged->Managed->Self-Service->Self-Aware->Self Heal Infrastructure
 * It does Infrastructure automation, provisioning, Orchestration and management
 * It helps automating the entire ALM cycle from Continuous Integration->Testing->Continuous Deployment and works with all major CI/CD tools
 * It gives realtime-dashboard and alerts-based monitoring and remediation of cost, usage , health and performance of all IT assets
 * Powered by Chef and integrated with Docker

 ##RLCatalyst DevOps Platform
 

 
 **How you can make use of Catalyst:**  

* **Infrastructure Provisioning and Management:** Do you need to provision infrastructure dynamically? Do you want to manage your heterogeneous environments? Do you want to control usage and cost? or Do you want to identify and retire your unused infrastructure? RLCatalyst has the solutions to all these challenges. It helps you towards a more efficient capacity planning and improved utilization
* **Application Deployment:** RLcatalyst provides you a seamless experience of managing your ALM lifecycle, with its one-click application deployment, on any of your cloud providers. You can reduce your deployment time from weeks to days to hours with better quality with a focus on performance and health of the application. It works with all latest CI/CD tools- Jenkins, JIRA, BitBucket, Github, SonarQube etc to name a few.
* **Monitoring and Tracking :** RLCatalyst provides you the near-real time information on the cost and usage of your infrastructure . This helps you to keep track of Cloud Capacity and to optimize your resources to ensure better utilization. 

#Documentation
Please see the detailed documentation at http://catalyst.readthedocs.org
 
#Branching Strategy
The central repository will have two branches with infinite lifetime
* master 
* dev 

*Supported Branches* 
For contributions to RLCatalyst create a feature or hot fix branch and make changes. Usage of the branches shall be explained  in the following section.

#Code Contributions
*Step 1: Fork*
```
$ git clone git@github.com:username/core.git
$ cd core
$ git remote add upstream git://github.com/RLOpenCatalyst/core.git
```

*Step 2: Branch*
Create a feature branch and start hacking
```
$ git checkout -b my-feature-branch -t origin/master
```

*Step 3: Commit*
Make sure git knows your name and email address
```
$ git config --global user.name "J. Random User"
$ git config --global user.email "j.random.user@example.com"
```

**Writing good commit logs is important. A commit log should describe what changed and why. Follow these guidelines when writing one**

1. The first line should be 50 characters or less and contain a short description of the change prefixed with the name of the changed subsystem.
2. Keep the second line blank.
3. A good commit log can look something like this: [subsystem: explaining the commit in one line]
4. Body of commit message is a few lines of text, explaining things in more detail, possibly giving some background about the issue being fixed, etc. etc.
5. The header line should be meaningful; it is what other people see when they run git shortlog or git log --oneline.

Check the output of git log --oneline files_that_you_changed to find out what subsystem (or subsystems) your changes touch.

 *Step 4: Rebase*

 Use git rebase (not git merge) to sync your work from time to time.
```
 $ git fetch upstream
 $ git rebase upstream/master
```

*Step 5: Tests*
 Bug fixes and features should come with tests. Add these tests in the tests directory of the repository.

*Step 6: Push*
```
 $ git push origin my-feature-branch
```

Pull requests will usually be reviewed within a few days. If there are comments to address, apply your changes in a separate  commit and push that to your feature branch. Post a comment in the pull request afterwards; GitHub does not send out   notifications when you add commits.

#Code Review

Each Github pull request will go through 3 step before merge:

 1. We will execute our automated test cases against the pull request. If the tests failed the pull request will be rejected with comments provided on the failures.

 2. If tests pass, the RLCatalyst engineering team member will do the review of the changes. Technical communication possible via github.com pull request page. When ready, your pull request will be tagged with label Ready For Merge.

 3. Your patch will be merged into master including necessary documentation updates.

 4. After merge the feature branch will be deleted.

#Release Strategy 
Our primary shipping vehicle is operating system specific packages that includes all the requirements of RLCatalyst.

Our version numbering closely follows Semantic Versioning standard. Our standard version numbers look like X.Y.Z which mean:

* X is a major release, which may not be fully compatible with prior major releases
* Y is a minor release, which adds both new features and bug fixes
* Z is a patch release, which adds just bug fixes
We frequently make releases with version numbers that look like 3.0.1 or 3.0.2. These releases are still well tested but not as throughly as Minor releases.

We do a Minor release approximately every 1 months and Patch releases on a when-needed basis for regressions, significant bugs, and security issues.

Announcements of releases will be maid available to our mailing list and slack channel.

#Logging Issues
When opening new issues or commenting on existing issues please make sure discussions are related to concrete technical issues with the RLCatalyst software

RLCatalyst Issue Tracking is handled using Github Issues.

If you are familiar with RLCatalyst and know the repository that is causing you a problem or if you have a feature request on a specific component, you can file an issue in the corresponding GitHub project. All of our Open Source Software can be found in our GitHub organization.

Otherwise you can file your issue in the RLCatalyst project and we will make sure it gets filed against the appropriate project.

To decrease the back and forth in issues, and to help us get to the bottom of them quickly, we use the issue template below.  You can copy/paste this template into the issue you are opening and edit it accordingly::

```
  Version:[Version of the project installed]

  Environment:[Details about the environment such as the Operating System, cookbook details, etc.]

  Scenario:[What you are trying to achieve and you can't?]

  Steps to Reproduce:[If you are filing an issue, what are the things we need to do to reproduce your problem?]

  Expected Result:[What are you expecting to happen as the consequence of the reproduction steps above?]

  Actual Result:[What actually happens after the reproduction steps?]
```

#License
  
 RLCatalyst is licensed under Apache License 2.0. 
 
 Copyright 2016 Relevance Lab Pvt Ltd.

 Licensed under the Apache License, Version 2.0 (the "License");you may not use this file except in compliance with the   License.You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

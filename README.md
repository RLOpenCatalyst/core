   [![Code Climate](https://codeclimate.com/github/RLOpenCatalyst/core/badges/gpa.svg)](https://codeclimate.com/github/RLOpenCatalyst/core)
# RLCatalyst Core Repository
Repository for RLCatalyst core


#Documentation
Please see the detailed documentation at http://catalyst.readthedocs.org

#Installation
Installation manual can be found at http://catalyst.readthedocs.org/en/latest/install.html
 
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

*Step 5: Push*

```
 $ git push origin my-feature-branch
```

Pull requests will usually be reviewed within a few days. If there are comments to address, apply your changes in a separate  commit and push that to your feature branch. Post a comment in the pull request afterwards; GitHub does not send out   notifications when you add commits.

#Code Review

Each Github pull request will go through the following step before merge:

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
  Bug description : [Description About Bug]

  Version:[Version of the project installed]

  Environment:[Details about the environment such as the Operating System, cookbook details, etc.]
   Catalyst Version:[Tag or Latest Version]
   OS Type and Version :
   Versions of MongoDB , NodeJS:
   Browser Type and Version:
   Chef Client and Server Version:

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

 #API Documentation
   First Install apidoc and run the below command for this.

     npm install apidoc -g

   For creating a API Documentation for any api, run the below command on terminal.
   
   apidoc -i myapp/ -o apidoc/ -t mytemplate/

   Creates an apiDoc of all files within dir myapp/, uses template from dir mytemplate/ and put all output to dir apidoc/.
   Without any parameter, apiDoc generate a documentation from all .cs .dart .erl .go .java .js .php .py .rb .ts files in current dir (incl. subdirs) and writes the output to ./doc/.


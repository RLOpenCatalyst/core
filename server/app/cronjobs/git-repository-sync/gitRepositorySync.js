
var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var nodeGit =  require('nodegit');
var promisify = require("promisify-node");
var fse = promisify(require("fs-extra"));
var path = "/tmp/bot-factory";
var Promise = require('promise');

var gitRepoSync = Object.create(CatalystCronJob);
gitRepoSync.interval = '*/2 * * * *';
gitRepoSync.execute = gitRepositorySync;

module.exports = gitRepoSync;

function gitRepositorySync(){
    /*var nodegit = require('nodegit'),
        path = require('path');

    var url = "https://github.com/pazdera/scriptster.git",
        local = "./scriptster",
        cloneOpts = {};

    nodegit.Clone(url, local, cloneOpts).then(function (repo) {
        console.log("Cloned " + path.basename(url) + " to " + repo.workdir());
    }).catch(function (err) {
        console.log(err);
    });

    var cloneOpts = {
        fetchOpts: {
            callbacks: {
                credentials: function(url, userName) {
                    return nodegit.Cred.sshKeyNew(
                        userName,
                        '/Users/radek/.ssh/id_rsa.pub',
                        '/Users/radek/.ssh/id_rsa',
                        "<your-passphrase-here>");
                }
            }
        }
    };*/

    var url = "https://github.com/pazdera/scriptster.git", cloneOpts = {},userName ='Durgesh1988'

    var cloneOpts = {
        fetchOpts: {
            callbacks: {
                credentials: function (url, userName) {
                    return nodegit.Cred.sshKeyNew(
                        userName,
                        '/Users/radek/.ssh/id_rsa.pub',
                        '/Users/radek/.ssh/id_rsa',
                        "<your-passphrase-here>");
                }
            }
        }
    }
    fse.remove(path).then(function() {
        var entry;

        nodeGit.Clone(
            "https://github.com/RLIndia/botsfactory.git",
            path,
            {
                fetchOpts: {
                    callbacks: {
                        credentials: function(url, userName) {
                            return nodeGit.Cred.sshKeyNew(
                                userName,
                                '/Users/radek/.ssh/id_rsa.pub',
                                '/Users/radek/.ssh/id_rsa',
                                "<your-passphrase-here>");
                        }
                    }
                }
            })
            .then(function(repo) {
                console.log("Durgesh");
                console.log(repo);
                return repo.getCommit("7d84cc1cf514725702f397119cbe1cc3c3a649a8");
            })
            .then(function(commit) {
                return commit.getEntry("README.md");
            })
            .then(function(entryResult) {
                entry = entryResult;
                return entry.getBlob();
            })
            .done(function(blob) {
                console.log(entry.name(), entry.sha(), blob.rawsize() + "b");
                console.log("========================================================\n\n");
                var firstTenLines = blob.toString().split("\n").slice(0, 10).join("\n");
                console.log(firstTenLines);
                console.log("...");
            });
    });



   /* nodeGit.Repository.open(path).then(function(repo) {
        /!* Get the current branch. *!/
        return repo.getCurrentBranch().then(function(ref) {
            console.log("On " + ref.shorthand() + " (" + ref.target() + ")");

            /!* Get the commit that the branch points at. *!/
            return repo.getBranchCommit(ref.shorthand());
        }).then(function (commit) {
            /!* Set up the event emitter and a promise to resolve when it finishes up. *!/
            var hist = commit.history(),
                p = new Promise(function(resolve, reject) {
                    hist.on("end", resolve);
                    hist.on("error", reject);
                });
            hist.start();
            return p;
        }).then(function (commits) {
            /!* Iterate through the last 10 commits of the history. *!/
            for (var i = 0; i < 10; i++) {
                var sha = commits[i].sha().substr(0,7),
                    msg = commits[i].message().split('\n')[0];
                console.log(sha + " " + msg);
            }
        });
    }).catch(function (err) {
        console.log(err);
    }).done(function () {
        console.log('Finished');
    });*/

   /* nodeGit.Repository.open(path).then(function(repo) {
        return repo.getCurrentBranch().then(function(ref) {
            console.log("On " + ref.shorthand() + " " + ref.target());

            console.log("Checking out master");
            var checkoutOpts = {
                checkoutStrategy: nodeGit.Checkout.STRATEGY.FORCE
            };
            console.log(checkoutOpts);
            return repo.checkoutBranch("master", checkoutOpts);
        }).then(function () {
            return repo.getCurrentBranch().then(function(ref) {
                console.log("On " + ref.shorthand() + " " + ref.target());
            });
        });
    }).catch(function (err) {
        console.log(err);
    }).done(function () {
        console.log('Finished');
    });*/

    /*var rr = require("recursive-readdir");

    rr(path, ["scriptster/.git/!**"], function (err, files) {
        for (var i = 0; i < files.length; i++) {
            console.log(files[i]);
        }
    });*/

}





/*
 Copyright [2016] [Relevance Lab]

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */


//var logger = require('_pr/logger')(module);
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var readline = require('readline');

var currentDirectory = __dirname;

function getDefaultsConfig() {
    var config = {
        express: {
            port: 3001,
            express_sid_key: 'express.sid',
            sessionSecret: 'sessionSekret'
        },
        jwt: {
            secret: "jwtSecr3t",
            expiresInSec: 604800
        },
        catalystAuthHeaderName: 'x-catalyst-auth',
        app_run_port: 3001,
        catalystDataDir: currentDirectory + '/catdata',
        catalysHomeDirName: 'catalyst',
        instancePemFilesDirName: 'instance-pemfiles',
        tempDirName: 'temp',
        scriptDirName :'scriptDir',
        staticUploadDir: '/var/chef/cache/uploads',
        app_run_secure_port: 443,
        cryptoSettings: {
            algorithm: "aes192",
            password: "pass@!@#",
            encryptionEncoding: "ascii",
            decryptionEncoding: "base64",
        },
        chef: {
            chefReposDirName: 'chef-repos',
            cookbooksDirName: 'cookbooks',
            defaultChefCookbooks: [],
            defaultChefCookbooksLinux: [],
            defaultChefCookbooksWindows: [],
            ohaiHints: ['ec2'],
            attributeExtractorCookbookName: 'attrib',
            defaultChefClientRunCookbooks: [],

            // getter methods
            get chefReposLocation() {
                return config.catalystHome + this.chefReposDirName + '/';
            },
            get cookbooksDir() {
                return config.catalystHome + this.cookbooksDirName + "/";
            }
        },
        constantData: {
            common_field: ['envId', 'providerId', 'orgId', 'bgId', 'projectId'],
            sort_field: ['name', 'description'],
            filterReferanceData: {
                "unmanagedInstances": [{
                    "state": "running"
                }, {
                    "os": "linux"
                }],
                "managedInstances": [{
                    "instanceState": "running"
                }]
            },
            sort_order : "asc",
            sortReferanceData : {
                "unmanagedInstances" : "state",
                "managedInstances" : "instanceState",
                "instances" : "instanceCreatedOn",
                "tasks" : "taskCreatedOn",
                "applications" : "name",
                "azureArms" : "status",
                "containerList" : "Status",
                "cftList" : "status",
                "appDeploy" : "envId",
                "trackedInstances": "providerType",
                "resources":"createdOn",
                "instanceLogs":"createdOn",
                "taskLogs":"timestampStarted",
                "unassignedInstances":"state"
            },
            skip_Records : 1,
            max_record_limit : 200,
            record_limit : 50
        },
        puppet: {
            puppetReposDirName: 'puppet-repos',

            // getter methods
            get puppetReposLocation() {
                return config.catalystHome + this.puppetReposDirName + '/';
            }
        },
        aws: {
            pemFileLocation: __dirname + '/app/config/',
            s3BucketDownloadFileLocation: currentDirectory + '/catdata/catalyst/temp/',
            s3BucketFileName:'rlBilling.zip',
            s3AccountNumber:"549974527830",
            s3CSVFileName:"-aws-billing-detailed-line-items-with-resources-and-tags-",
            pemFile: "catalyst.pem",
            instanceUserName: "root",
            virtualizationType: [{
                hvm: ['t2.micro', 't2.small', 't2.medium', 'm3.medium', 'm3.large', 'm3.xlarge', 'm3.2xlarge',
                    'c3.large', 'c3.xlarge', 'c3.2xlarge', 'c3.4xlarge', 'c3.8xlarge', 'c4.large', 'c4.xlarge',
                    'c4.2xlarge', 'c4.4xlarge', 'c4.8xlarge', 'r3.large', 'r3.xlarge', 'r3.2xlarge', 'r3.4xlarge',
                    'r3.8xlarge', 'i2.xlarge', 'i2.2xlarge', 'i2.4xlarge', 'i2.8xlarge', 'hs1.8xlarge'
                ]
            }, {
                paravirtual: ['t1.micro', 'm1.small', 'm1.medium', 'm1.large', 'm1.xlarge', 'm3.medium', 'm3.large', 'm3.xlarge', 'm3.2xlarge', 'c3.large', 'c3.xlarge', 'c3.2xlarge',
                    'c3.4xlarge', 'c3.8xlarge', 'hs1.8xlarge'
                ]
            }],

            regions: [{

                region_name: "US East (N. Virginia)",
                region: "us-east-1"
            }, {
                region_name: "US West (Oregon)",
                region: "us-west-2"
            }, {
                region_name: "US West (N. California)",
                region: "us-west-1"
            }, {
                region_name: "EU (Ireland)",
                region: "eu-west-1"
            }, {
                region_name: "EU (Frankfurt)",
                region: "eu-central-1"
            }, {
                region_name: "Asia Pacific (Singapore)",
                region: "ap-southeast-1"
            }, {
                region_name: "Asia Pacific (Sydney)",
                region: "ap-southeast-2"
            }, {
                region_name: "Asia Pacific (Tokyo)",
                region: "ap-northeast-1"
            }, {
                region_name: "South America (Sao Paulo)",
                region: "sa-east-1"
            }],

            operatingSystems: [{

                os_name: "Cent OS",
                osType: "linux"
            }, {

                os_name: "Windows",
                osType: "windows"
            }, {

                os_name: "Ubuntu",
                osType: "linux"
            }],

            cwMetricsUnits: {
                CPUCreditUsage: 'Count',
                CPUCreditBalance: 'Count',
                CPUUtilization: 'Percent',
                DiskReadOps: 'Count',
                DiskWriteOps: 'Count',
                DiskReadBytes: 'Megabytes',
                DiskWriteBytes: 'Megabytes',
                NetworkIn: 'Megabytes',
                NetworkOut: 'Megabytes',
                BucketSizeBytes:"Bytes",
                NumberOfObjects:"Count",
                NetworkPacketsIn: 'Count',
                NetworkPacketsOut: 'Count',
                StatusCheckFailed: 'Count',
                StatusCheckFailed_Instance: 'Count',
                StatusCheckFailed_System: 'Count'
            },

            cwMetricsDisplayUnits: {
                CPUUtilization: 'Percent',
                DiskReadOps: 'Count',
                DiskWriteOps: 'Count',
                DiskReadBytes: 'MB',
                DiskWriteBytes: 'MB',
                NetworkIn: 'MB',
                NetworkOut: 'MB'
            },
            costData:{
                regions:['us-east-1','us-west-2','us-west-1','eu-west-1','eu-central-1','ap-southeast-1','ap-northeast-1','ap-southeast-2','sa-east-1'],
                productName1:['Amazon Elastic Compute Cloud','Amazon RDS Service','Amazon Redshift','Amazon ElastiCache'],
                productName2:['Amazon CloudFront','Amazon Route 53','Amazon Simple Storage Service','Amazon Virtual Private Cloud']
            }
        },
        vmware: {
            serviceHost: "http://localhost:3000"
        },
        db: {
            dbName: 'devops_new',
            host: 'localhost',
            port: '27017'
        },
        authStrategy: {
            local: true,
            externals: false
        },
        logServerUrl: '',
        features: {
            appcard: false
        },
        maxInstanceCount: 0,

        // cronjobTimeDelay: '"* * * * * *"',

        //getter methods
        get catalystHome() {
            return this.catalystDataDir + '/' + this.catalysHomeDirName + '/';
        },

        get instancePemFilesDir() {
            return this.catalystHome + this.instancePemFilesDirName + "/";
        },
        get tempDir() {
            return this.catalystHome + this.tempDirName + "/";
        },
        get scriptDir() {
            return this.catalystHome + this.scriptDirName + "/";
        }
    };
    return config;
}

function parseArguments() {
    var cliArgs = require("command-line-args");
    var cli = cliArgs([{
        name: "help",
        alias: "h",
        type: Boolean,
        description: "Help"
    }, {
        name: "catalyst-port",
        type: String,
        description: "Catalyst port number"
    }, {
        name: "db-host",
        type: String,
        description: "DB Host"
    }, {
        name: "db-port",
        type: String,
        description: "DB Port"
    }, {
        name: "db-name",
        type: String,
        description: "DB Port"
    }, {
        name: "ldap-host",
        type: String,
        description: "Ldap Host"
    }, {
        name: "ldap-port",
        type: String,
        description: "Ldap Host"
    }, {
        name: "seed-data",
        type: Boolean,
        description: "Restore Seed Data"
    }, {
        name: "ldap-user",
        type: Boolean,
        description: "Setup Ldap user"
    }, {
        name: "max-instance-count",
        type: Number,
        description: "Maximum number of instance allowed to be launch"
    }]);

    var options = cli.parse();

    /* generate a usage guide */
    var usage = cli.getUsage({
        header: "catalyst help",
        footer: "For more information, visit http://www.relevancelab.com"
    });

    if (options.help) {
        console.log(usage);
        process.exit(0);
    }
    return options;
}

function getConfig(config, options) {
    //parsing arguments
    if (options['catalyst-port']) {
        var catalystPort = parseInt(options['catalyst-port']);
        if (catalystPort) {
            config.app_run_port = catalystPort;
            config.express.port = catalystPort;
        }
    }
    config.db.host = options['db-host'] ? options['db-host'] : config.db.host;
    config.db.port = options['db-port'] ? options['db-port'] : config.db.port;
    config.db.dbName = options['db-name'] ? options['db-name'] : config.db.dbName;
    //config.ldap.host = options['ldap-host'] ? options['ldap-host'] : config.ldap.host;
    //config.ldap.port = options['ldap-port'] ? options['ldap-port'] : config.ldap.port;
    if (options['max-instance-count']) {
        var maxInstanceCount = parseInt(options['max-instance-count']);
        if (maxInstanceCount) {
            config.maxInstanceCount = maxInstanceCount;
        }
    }
    return config;
}

function installPackageJson() {
    console.log("Installing node packages from pacakge.json");
    var procInstall = spawn('npm', ['install', '--unsafe-perm']);
    procInstall.stdout.on('data', function(data) {
        console.log("" + data);
    });
    procInstall.stderr.on('data', function(data) {
        console.error("" + data);
    });
    procInstall.on('close', function(pacakgeInstallRetCode) {
        if (pacakgeInstallRetCode === 0) {
            console.log("Installation Successfull.");
            process.exit(0);
        } else {
            console.log("Error occured while installing packages from apidoc.json");
            process.exit(1);
        }
    });
}

function restoreSeedData(config, callback) {
    var mongoDbClient = require('mongodb');

    mongoDbClient.connect('mongodb://' + config.db.host + ':' + config.db.port + '/' + config.db.dbName, function(err, db) {
        if (err) {
            throw "unable to connect to mongodb"
            return;
        }
        db.dropDatabase();

        var procMongoRestore = spawn('mongorestore', ['--host', config.db.host, '--port', config.db.port, '--db', config.db.dbName, '--drop', '../seed/mongodump/devops_new/']);
        procMongoRestore.on('error', function(mongoRestoreError) {
            console.error("mongorestore error ==> ", mongoRestoreError);
        });
        procMongoRestore.stdout.on('data', function(data) {
            console.log("" + data);
        });
        procMongoRestore.stderr.on('data', function(data) {
            console.log("" + data);
        });
        procMongoRestore.on('close', function(mongoRestoreCode) {
            if (mongoRestoreCode === 0) {
                console.log('mongo restore successfull');
                fse = require('fs-extra');
                console.log('copying seed data');
                fse.copySync('../seed/catalyst', config.catalystHome);
                callback();
            } else {
                throw "Unable to restore mongodb"
            }
        });

    });

}

function setupLdapUser(config, callback) {
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
    });
    rl.question("Ldap super user ? ", function(ldapUser) {
        rl.close();
        ldapUser = ldapUser.trim();
        if (!ldapUser) {
            throw 'Invalid ldap user input'
        }
        console.log('Checking for ldap User : ' + ldapUser);
        var ldapjs = require('ldapjs');
        var client = ldapjs.createClient({
            url: 'ldap://' + config.ldap.host + ':' + config.ldap.port
        });
        var searchOpts = {
            attrsOnly: true
        };

        client.search('cn=' + ldapUser + ',dc=d4d-ldap,dc=relevancelab,dc=com', searchOpts, function(err, res) {
            if (err) {
                console.error("Unable to preform search in ldap");
                throw err;
            }
            var userFound = false;

            res.on('searchEntry', function(entry) {
                userFound = true;
            });
            res.on('searchReference', function(referral) {

            });
            res.on('error', function(err) {

            });

            res.on('end', function(result) {
                console.log('status: ' + result.status);
                if (!userFound) {
                    console.error('Unable to find user ' + ldapUser);
                    process.exit(1);
                } else {
                    callback();
                }
            });
        });
    });
}

function createConfigFile(config) {
    console.log('creating configuration json file');
    configJson = JSON.stringify(config);
    var fs = require('fs');
    fs.writeFileSync('app/config/catalyst-config.json', configJson);
}
console.log('Installing node packages required for installation');
proc = spawn('npm', ['install', "command-line-args@0.5.3", 'mkdirp@0.5.0', 'fs-extra@0.18.0', 'ldapjs@0.7.1', 'mongodb@2.1.4']);
proc.on('close', function(code) {
    if (code !== 0) {
        throw "Unable to install packages"
    } else {
        var options = parseArguments();
        var defaultConfig = getDefaultsConfig();
        var config = getConfig(defaultConfig, options);
        console.log('creating catalyst home directory');
        var fsExtra = require('fs-extra');
        var mkdirp = require('mkdirp');
        mkdirp.sync(config.catalystHome);
        mkdirp.sync(config.instancePemFilesDir);
        mkdirp.sync(config.tempDir);
        mkdirp.sync(config.chef.chefReposLocation);
        mkdirp.sync(config.chef.cookbooksDir);
        mkdirp.sync(config.puppet.puppetReposLocation);
        if (options['seed-data']) {
            fsExtra.emptydirSync(config.catalystDataDir);
            restoreSeedData(config, function() {
                /*if (options['ldap-user']) {
                 setupLdapUser(config, function() {
                 createConfigFile(config);
                 installPackageJson();
                 });
                 } else {*/
                createConfigFile(config);
                installPackageJson();
                //}
            });
        } else {
            createConfigFile(config);
            installPackageJson();
        }
    }
});
proc.stdout.on('data', function(data) {
    console.log("" + data);
});

proc.stderr.on('data', function(data) {
    console.error("" + data);
});
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


//var sys = require('sys');
var exec = require('child_process').exec;
var SSHExec = require('./utils/sshexec');
var logger = require('_pr/logger')(module);
var Process = require("./utils/process");
var Curl = require("./utils/curl.js");
var appConfig = require('_pr/config');

var path = require('path');
var fs = require('fs');
var request = require('request');
var xml = require('xml');
var xml2json = require('xml2json');

var waitForPort = require('wait-for-port');
var AZUREARM = require('./azure-arm');

function execute(cmd, isJsonResponse, callback) {
    var output = '';
    var options = {
        onError: function(err) {
            callback(err, null);
        },
        onClose: function(code) {
            if (code === 0) {
                if (isJsonResponse) {
                    var json = JSON.parse(output);
                    //logger.debug("Json:", json)
                    callback(null, json);
                    return;
                }
                callback(null, output);
            } else {
                callback({
                    code: code
                }, null)
            }
        }
    };
    options.onStdOut = function(data) {
        output = output + data.toString();
    };
    options.onStdErr = function(data) {
        logger.debug('Process stderr out ==> :', data.toString());
    };

    var proc = new Process(cmd, [], options);
    proc.start();
}


function constructXmlInputBody(params) {
    logger.debug("START:: constructXmlInputBody for VM creation:: ");

    /*Defining configuration sets template*/
    var configurationSets = {};
    configurationSets.ConfigurationSets = [];

    /*Defining Network Configuration Template*/
    var networkConfigurationTemplate = {
        ConfigurationSet: [{
            ConfigurationSetType: ""
        }, {
            InputEndpoints: []
        }]
    };

    networkConfigurationTemplate.ConfigurationSet[0].ConfigurationSetType = "NetworkConfiguration";
    if (params.os === "windows") {
        /*start of template for windows type machines configuration */
        var windowsProvisioningConfigurationTemplate = {
            ConfigurationSet: [{
                _attr: ""
            }, {
                ConfigurationSetType: ""
            }, {
                ComputerName: ""
            }, {
                AdminPassword: ""
            }, {
                AdminUsername: ""
            }]
        };

        windowsProvisioningConfigurationTemplate.ConfigurationSet[0]._attr = {
            "i:type": 'WindowsProvisioningConfigurationSet'
        };
        windowsProvisioningConfigurationTemplate.ConfigurationSet[1].ConfigurationSetType = "WindowsProvisioningConfiguration";
        windowsProvisioningConfigurationTemplate.ConfigurationSet[2].ComputerName = params.VMName;
        windowsProvisioningConfigurationTemplate.ConfigurationSet[3].AdminPassword = params.password;
        windowsProvisioningConfigurationTemplate.ConfigurationSet[4].AdminUsername = params.username;
        /*end of template for windows type machines configuration */
        configurationSets.ConfigurationSets.push(windowsProvisioningConfigurationTemplate);
        /*start of template for windows 5985 port creation */
        var inputEndpointsTemplate = {
            InputEndpoint: [{
                LocalPort: ""
            }, {
                Name: ""
            }, {
                Port: ""
            }, {
                Protocol: ""
            }]
        };
        inputEndpointsTemplate.InputEndpoint[0].LocalPort = "5985";
        inputEndpointsTemplate.InputEndpoint[1].Name = "winRM";
        inputEndpointsTemplate.InputEndpoint[2].Port = "5985";
        inputEndpointsTemplate.InputEndpoint[3].Protocol = "tcp";
        /*end of template for windows 5985 port creation */

        networkConfigurationTemplate.ConfigurationSet[1].InputEndpoints.push(inputEndpointsTemplate);

        /*start of template for windows rdp port creation */
        var inputEndpointsTemplate1 = {
            InputEndpoint: [{
                LocalPort: ""
            }, {
                Name: ""
            }, {
                Port: ""
            }, {
                Protocol: ""
            }]
        };
        inputEndpointsTemplate1.InputEndpoint[0].LocalPort = "3389";
        inputEndpointsTemplate1.InputEndpoint[1].Name = "rdp";
        inputEndpointsTemplate1.InputEndpoint[2].Port = "3389";
        inputEndpointsTemplate1.InputEndpoint[3].Protocol = "tcp";
        /*end of template for windows rdp port creation */
        networkConfigurationTemplate.ConfigurationSet[1].InputEndpoints.push(inputEndpointsTemplate1);

    } else {
        /*start of template for linux type machines configuration */
        var linuxProvisioningConfigurationTemplate = {
            ConfigurationSet: [{
                _attr: {
                    "i:type": 'LinuxProvisioningConfigurationSet'
                }
            }, {
                ConfigurationSetType: "LinuxProvisioningConfigurationSet"
            }, {
                HostName: params.VMName
            }, {
                UserName: params.username
            }, {
                UserPassword: params.password
            }, {
                DisableSshPasswordAuthentication: "false"
            }]
        };
        /*end of template for linux type machines configuration */
        configurationSets.ConfigurationSets.push(linuxProvisioningConfigurationTemplate);
        /*start of default endpoint template for ssh port*/
        var inputEndpointsTemplate = {
            InputEndpoint: [{
                LocalPort: ""
            }, {
                Name: ""
            }, {
                Port: ""
            }, {
                Protocol: ""
            }]
        };
        inputEndpointsTemplate.InputEndpoint[0].LocalPort = "22";
        inputEndpointsTemplate.InputEndpoint[1].Name = "ssh";
        inputEndpointsTemplate.InputEndpoint[2].Port = "22";
        inputEndpointsTemplate.InputEndpoint[3].Protocol = "tcp";
        /*end of default endpoint template for ssh port*/

        networkConfigurationTemplate.ConfigurationSet[1].InputEndpoints.push(inputEndpointsTemplate);
    }

    var endpointsPorts = params.endpoints;
    logger.debug("endpointsPorts >>", endpointsPorts);
    var port = endpointsPorts.split(',')[0];
    logger.debug('Creating endpoint CatEndpoint template', port);
    if (port != "22" && port != "5985" && port != "3389") {
        var inputEndpointsTemplate = {
            InputEndpoint: [{
                LocalPort: ""
            }, {
                Name: ""
            }, {
                Port: ""
            }, {
                Protocol: ""
            }]
        };
        inputEndpointsTemplate.InputEndpoint[0].LocalPort = port;
        inputEndpointsTemplate.InputEndpoint[1].Name = "catEndpoint";
        inputEndpointsTemplate.InputEndpoint[2].Port = port;
        inputEndpointsTemplate.InputEndpoint[3].Protocol = "tcp";

        networkConfigurationTemplate.ConfigurationSet[1].InputEndpoints.push(inputEndpointsTemplate);
    }

    configurationSets.ConfigurationSets.push(networkConfigurationTemplate);

    /*start of template for vm role definition */
    var roleTemplate = {
        Role: [{
            RoleName: ""
        }, {
            RoleType: ""
        },
            configurationSets, {
                VMImageName: ""
            }, {
                RoleSize: ""
            }
        ]
    };
    roleTemplate.Role[0].RoleName = params.VMName;
    roleTemplate.Role[1].RoleType = "PersistentVMRole";
    roleTemplate.Role[3].VMImageName = params.imageName;
    roleTemplate.Role[4].RoleSize = params.size;
    /*start of template for vm role definition */

    var roleListTemplate = {
        RoleList: [roleTemplate]
    };

    /*start of template for deployment definition */
    var deploymentTemplate = {
        Deployment: [{
            _attr: {
                xmlns: "http://schemas.microsoft.com/windowsazure",
                "xmlns:i": "http://www.w3.org/2001/XMLSchema-instance"
            }
        }, {
            Name: params.VMName
        }, {
            DeploymentSlot: "Production"
        }, {
            Label: params.VMName
        }, {
            RoleList: [roleTemplate]
        }, {
            VirtualNetworkName: params.vnet
        }]
    };
    /*end of template for deployment definition */

    var xmlString = xml(deploymentTemplate);

    logger.debug("END:: constructXmlInputBody for VM creation:: ");

    return xmlString;

}

function constructCloudServiceReqBody(cloudService, location) {
    logger.debug("START:: constructCloudServiceReqBody");
    var base64_label = new Buffer(cloudService).toString('base64');
    var cloudServiceTemplate = {
        CreateHostedService: [{
            _attr: {
                xmlns: "http://schemas.microsoft.com/windowsazure"
            }
        }, {
            ServiceName: cloudService
        }, {
            Label: base64_label
        }, {
            Description: "Catalyst cloud service"
        }, {
            Location: location
        }]
    }

    var xmlString = xml(cloudServiceTemplate);

    logger.debug("constructCloudServiceReqBody output:", xmlString);
    logger.debug("END:: constructCloudServiceReqBody");

    return xmlString;
}

function constructVMShutDownReqBody() {
    logger.debug('constructVMShutDownReqBody');

    var shutDownVMTemplate = {
        ShutdownRoleOperation: [{
            _attr: {
                xmlns: "http://schemas.microsoft.com/windowsazure",
                "xmlns:i": "http://www.w3.org/2001/XMLSchema-instance"
            }
        }, {
            OperationType: "ShutdownRoleOperation"
        }]
    }

    var xmlString = xml(shutDownVMTemplate);

    return xmlString;

}

function constructVMStartReqBody() {
    logger.debug('constructVMStartReqBody');

    var shutDownVMTemplate = {
        StartRoleOperation: [{
            _attr: {
                xmlns: "http://schemas.microsoft.com/windowsazure",
                "xmlns:i": "http://www.w3.org/2001/XMLSchema-instance"
            }
        }, {
            OperationType: "StartRoleOperation"
        }]
    }

    var xmlString = xml(shutDownVMTemplate);

    return xmlString;
}

var instanceStateList = {
    RUNNING: 'ReadyRole',
    STOPPED: 'StoppedVM',
    STOPPED_DEALLOCATED: 'StoppedDeallocated',
    TERMINATED: 'terminated',
    PENDING: 'pending'
}

var AzureCloud = function(options) {
    var certFile = path.resolve(__dirname, options.certLocation);
    var keyFile = path.resolve(__dirname, options.keyLocation);

    var that = this;

    this.setSubscriptionById = function(id, callback) {
        var setSubscriptionCmd = "azure account set " + id;

        execute(setSubscriptionCmd, false, function(err, data) {
            if (err) {
                logger.error("Error in setting subscription:", err);
                callback(err, null);
                return;
            }
            callback(null, data);
            return;
        });
    }

    this.setStorageByName = function(name, callback) {
        var setStorageCmd = "azure storage account set " + name;

        execute(setStorageCmd, false, function(err, data) {
            if (err) {
                logger.error("Error in setting storage by name:", err);
                callback(err, null);
                return;
            }

            logger.debug("Set StorageByName is success", data);
            callback(null, data);
            return;
        });
    }

    this.listVM = function(callback) {
        execute("azure vm list --json", true, function(err, data) {
            if (err) {
                logger.error("Error in listing VM's:", err);
                callback(err, null);
                return;
            }

            logger.debug("Number of VM's:", data.length);
            callback(null, data);
            return;
        });
    }

    this.shutDownVM = function(vmName, callback) {
        logger.debug("START:: shutDownVM");
        fs.readFile(certFile, function(err, certData) {
            if (err) {
                logger.error("Error reading certFile..", err);
                callback(err, null);
                return;
            }
            logger.debug("certFile loaded");
            fs.readFile(keyFile, function(err, keyData) {
                if (err) {
                    logger.error("Error reading keyFile..", err);
                    callback(err, null);
                    return;
                }
                logger.debug("keyFile loaded");

                shtDownReqBody = constructVMShutDownReqBody();

                var opts = {
                    url: "https://management.core.windows.net/" + options.subscriptionId + "/services/hostedservices/" + vmName + "/deployments/" + vmName + "/roleinstances/" + vmName + "/Operations",
                    agentOptions: {
                        cert: certData,
                        key: keyData,
                    },
                    headers: {
                        "x-ms-version": "2015-04-01",
                        "Content-Type": "text/xml"
                    },
                    body: shtDownReqBody
                }

                request.post(opts, function(err, response, body) {

                    logger.debug("response.statusCode: ", response.statusCode);

                    if (err) {
                        callback(err, null);
                        return;
                    }

                    if (response.statusCode == '202') {
                        callback(null, instanceStateList.RUNNING);
                        return;
                    } else {
                        callback(body, null);
                        return;
                    }
                });

                pollInstanceState(vmName, instanceStateList.STOPPED, function(err, state) {
                    if(err){
                        callback(err,null);
                        return;
                    }
                    callback(null, state);
                    return;
                });

            });
        });

    }

    this.startVM = function(vmName, callback) {

        logger.debug("START:: startVM");
        fs.readFile(certFile, function(err, certData) {
            if (err) {
                logger.error("Error reading certFile..", err);
                callback(err, null);
                return;
            }
            logger.debug("certFile loaded");
            fs.readFile(keyFile, function(err, keyData) {
                if (err) {
                    logger.error("Error reading keyFile..", err);
                    callback(err, null);
                    return;
                }
                logger.debug("keyFile loaded");

                shtDownReqBody = constructVMStartReqBody();

                var opts = {
                    url: "https://management.core.windows.net/" + options.subscriptionId + "/services/hostedservices/" + vmName + "/deployments/" + vmName + "/roleinstances/" + vmName + "/Operations",
                    agentOptions: {
                        cert: certData,
                        key: keyData,
                    },
                    headers: {
                        "x-ms-version": "2015-04-01",
                        "Content-Type": "text/xml"
                    },
                    body: shtDownReqBody
                }

                request.post(opts, function(err, response, body) {

                    logger.debug("response.statusCode: ", response.statusCode);

                    if (err) {
                        callback(err, null);
                        return;
                    }

                    if (response.statusCode == '202') {
                        callback(null, instanceStateList.STOPPED);
                        return;
                    } else {
                        callback(body, null);
                        return;
                    }
                });

                pollInstanceState(vmName, instanceStateList.RUNNING, function(err, state) {
                    if(err){
                        callback(err, null);
                        return;
                    }
                    callback(null, state);
                    return;
                });

            });
        });

    }

    this.getLocations = function(callback) {
        logger.debug("START:: getLocations");
        fs.readFile(certFile, function(err, certData) {
            if (err) {
                logger.error("Error reading certFile..", err);
                return;
            }
            fs.readFile(keyFile, function(err, keyData) {
                if (err) {
                    logger.error("Error reading keyFile..", err);
                    return;
                }
                var opts = {
                    url: "https://management.core.windows.net/" + options.subscriptionId + "/locations",
                    agentOptions: {
                        cert: certData,
                        key: keyData,
                    },
                    headers: {
                        "x-ms-version": "2015-04-01"
                    }
                }

                request.get(opts, function(err, response, body) {
                    logger.debug("getLocations response.statusCode: ", response.statusCode);
                    if (err) {
                        logger.error("Error...", err);
                        callback(err, null);
                        return;
                    }

                    if (response.statusCode == '200') {
                        callback(null, body);
                        return;
                    } else {
                        callback(body, null);
                        return;
                    }

                });

            });

        });

    }

    this.getNetworks = function(callback) {
        logger.debug("START:: getNetworks");
        fs.readFile(certFile, function(err, certData) {
            if (err) {
                logger.error("Error reading certFile..", err);
                return;
            }
            fs.readFile(keyFile, function(err, keyData) {
                if (err) {
                    logger.error("Error reading keyFile..", err);
                    return;
                }
                var opts = {
                    url: "https://management.core.windows.net/" + options.subscriptionId + "/services/networking/virtualnetwork",
                    agentOptions: {
                        cert: certData,
                        key: keyData,
                    },
                    headers: {
                        "x-ms-version": "2015-04-01"
                    }
                }
                request.get(opts, function(err, response, body) {
                    if (err) {
                        logger.error("Error...", err);
                        callback(err, null);
                        return;
                    }
                    if (response.statusCode == '200') {
                        callback(null, body);
                        return;
                    } else {
                        callback(body, null);
                        return;
                    }
                });
            });
        });
    }
    this.createVirtualMachine = function(cloudService, reqBody, callback) {
        logger.debug("START:: createVirtualMachine");
        fs.readFile(certFile, function(err, certData) {
            if (err) {
                logger.error("Error reading certFile..", err);
                return;
            }
            logger.debug("certFile loaded");

            fs.readFile(keyFile, function(err, keyData) {
                if (err) {
                    logger.error("Error reading keyFile..", err);
                    return;
                }
                logger.debug("keyFile loaded");

                var opts = {
                    url: "https://management.core.windows.net/" + options.subscriptionId + "/services/hostedservices/" + cloudService + "/deployments",
                    agentOptions: {
                        cert: certData,
                        key: keyData,
                    },
                    headers: {
                        "x-ms-version": "2015-04-01",
                        "Content-Type": "text/xml"
                    },
                    body: reqBody
                }

                request.post(opts, function(err, response, body) {
                    logger.debug("response.statusCode: ", response.statusCode);

                    if (err) {
                        callback(err, null);
                        return;
                    }

                    if (response.statusCode == '202') {
                        logger.debug("END:: createVirtualMachine");
                        callback(null, "Created Virtual Machine Successfully");
                        return;
                    } else {
                        callback(body, null);
                        return;
                    }
                });
            });
        });

    }

    this.createCloudService = function(reqBody, callback) {
        logger.debug("START:: createCloudService");
        fs.readFile(certFile, function(err, certData) {
            if (err) {
                logger.error("Error reading certFile..", err);
                return;
            }
            logger.debug("certFile loaded");
            fs.readFile(keyFile, function(err, keyData) {
                if (err) {
                    logger.error("Error reading keyFile..", err);
                    return;
                }
                logger.debug("keyFile loaded");

                var opts = {
                    url: "https://management.core.windows.net/" + options.subscriptionId + "/services/hostedservices",
                    agentOptions: {
                        cert: certData,
                        key: keyData,
                    },
                    headers: {
                        "x-ms-version": "2015-04-01",
                        "Content-Type": "text/xml"
                    },
                    body: reqBody
                }

                request.post(opts, function(err, response, body) {

                    logger.debug("response.statusCode: ", response.statusCode);

                    if (err) {
                        logger.debug("Error in Cloud Service creation", err);
                        callback(err, null);
                        return;
                    }

                    if (response.statusCode == '201') {
                        logger.debug("END:: createCloudService");
                        callback(null, "Created Cloud Service Successfully");
                        return;
                    } else {
                        logger.debug("Error in Cloud Service creation:", body);
                        callback(body, null);
                        return;
                    }
                });
            });
        });

    }

    this.createServerClassic = function(params, callback) {
        if (params.os === 'windows') {
            params.remoteCon = '-r';
            params.port = '3389';
        } else {
            params.remoteCon = '-e';
            params.port = '22';
        }

        var cloudServiceName = params.VMName;

        var cloudServiceReqBody = constructCloudServiceReqBody(cloudServiceName, params.location);

        var vmReqBody = constructXmlInputBody(params);

        var self = this;

        self.createCloudService(cloudServiceReqBody, function(err, res) {

            if (!err) {
                logger.debug("createCloudService response:", res);

                self.createVirtualMachine(cloudServiceName, vmReqBody, function(err, data) {
                    if (!err) {
                        logger.debug("createVirtualMachine response:", data);
                        callback(null, data);
                        return;
                    }
                    logger.error("Error in createVirtualMachine:", err);
                    callback(err, null);
                });
            } else {
                logger.error("Error in createCloudService:", err);
                callback(err, null);
            }
        });

    }

    this.createServer = function (params, callback) {
        logger.debug("create server:", params);
        //create a token

        var options = {
            subscriptionId: params.providerdata.subscriptionId,
            clientId: params.providerdata.clientId,
            clientSecret: params.providerdata.clientSecret,
            tenant: params.providerdata.tenant
        };
        var azurearm = new AZUREARM(options);
        azurearm.getResourceGroups(function (err1,rgroups) {
            if(err1){
                logger.error("Get Resource Group Error: " + err1);
                callback(err1,null);
            }
            else{
                logger.info("Resource Groups ");
                logger.info(rgroups);
            }
        })




    }

    this.createEndPoint = function(serverName, name, port, callback) {
        var createEndPoint = "azure vm endpoint create " + serverName + " " + port + " -n " + name;

        execute(createEndPoint, false, function(err, data) {
            if (err) {
                logger.error("Error in endpoint creation:", err);
                callback(err, null);
                return;
            }

            logger.debug("endpoint creation response:", data);
            callback(null, data);
        });
    }

    this.getServerByName = function(serverName, callback) {
        logger.debug("START:: getServerByName");
        fs.readFile(certFile, function(err, certData) {
            if (err) {
                logger.error("Error reading certFile..", err);
                return;
            }
            logger.debug("certFile loaded");

            fs.readFile(keyFile, function(err, keyData) {
                if (err) {
                    logger.error("Error reading keyFile..", err);
                    return;
                }
                logger.debug("keyFile loaded");

                var opts = {
                    uri: "https://management.core.windows.net/" + options.subscriptionId + "/services/hostedservices/" + serverName + "/deploymentslots/Production",
                    agentOptions: {
                        cert: fs.readFileSync(certFile),
                        key: fs.readFileSync(keyFile),
                    },
                    headers: {
                        "x-ms-version": "2015-04-01"
                    }
                }

                request.get(opts, function(err, response, body) {

                    if (err) {
                        callback(err, null);
                        return;
                    }

                    logger.debug("response.statusCode: ", response.statusCode);

                    if (response.statusCode == '200') {
                        logger.debug("END:: getServerByName");
                        callback(null, body);
                        return;
                    } else {
                        callback(body, null);
                        return;
                    }

                });
            });
        });

    }

    this.updatedfloatingip = false;


    this.trysshoninstance = function(ostype, ip_address, username, pwd, callback) {
        logger.debug('In trysshoninstance1');
        var opts = {
            password: pwd,
            username: username,
            host: ip_address,
            instanceOS: 'linux',
            port: 22,
            cmds: ["ls -al"],
            cmdswin: ["knife wsman test"]
        }

        var cmdString = '';
        if (ostype == "Windows") {
            curl = new Curl();
            cmdString = opts.cmdswin[0] + ' ' + opts.host + ' -m';
            var openport = 5985;
            logger.debug('checking windows port 5985 for node with ip : ' + opts.host);
            waitForPort(opts.host, openport, function(err) {
                if (err) {
                    logger.error(err);
                    callback('Error ', null);
                    return;
                } else {
                    logger.debug('port enabled');
                    callback('ok');
                    return;
                }

            });

            /*curl.executecurl(cmdString, function(err, stdout) {
                logger.debug('stdout:', stdout, err);

                if (stdout && stdout.indexOf('Connected successfully') >= 0) {
                    callback('ok');
                    return;
                }

            }); */

        } else {
            cmdString = opts.cmds.join(' && ');
            logger.debug("cmdString >>>", cmdString);
            var sshExec = new SSHExec(opts);
            sshExec.exec(cmdString, function(err, stdout) {
                logger.debug(stdout);
                callback(stdout);
                return;
            }, function(err, stdout) {
                logger.debug('Out:', stdout); //assuming that receiving something out would be a goog sign :)
                callback('ok');
                return;
            }, function(err, stdout) {
                logger.error('Error Out:', stdout);
            });
        }
    }

    this.trysshoninstance1 = function(ostype, ip_address, username, pwd, callback) {
        var opts = {
            password: pwd,
            username: username,
            host: ip_address,
            instanceOS: 'linux',
            port: 22,
            cmds: ["ls -al"],
            cmdswin: ["knife wsman test"],
            interactiveKeyboard: true
        }

        var cmdString = '';
        if (ostype == "Windows") {
            curl = new curl();
            cmdString = opts.cmdswin[0] + ' ' + opts.host + ' -m';
            logger.debug("cmdString >>>", cmdString);
            curl.executecurl(cmdString, function(err, stdout) {
                logger.debug(stdout);
                if (stdout.indexOf('Connected successfully') >= 0) {
                    callback('ok');
                    return;
                }
            });

        } else {
            cmdString = opts.cmds.join(' && ');
            var sshExec = new SSHExec(opts);
            sshExec.exec(cmdString, function(err, stdout) {
                logger.debug(stdout);
                callback(stdout);
                return;
            }, function(err, stdout) {
                logger.debug('Out:', stdout); //assuming that receiving something out would be a goog sign :)
                callback('ok');
                return;
            }, function(err, stdout) {
                logger.error('Error Out:', stdout);
            });
        }
    }

    this.timeouts = [];
    this.callbackdone = false;

    this.waitforserverready = function(instanceName, username, pwd, callback) {
        var self = this;
        logger.debug('instanceName received:', JSON.stringify(instanceName));
        var wfsr = function() {
            self.getServerByName(instanceName, function(err, data) {
                if (err) {
                    logger.error("Error", err);
                    callback(err, null);
                    return;
                }
                if (!err) {
                    data = xml2json.toJson(data);
                    logger.debug('Quried server:', data);

                    data = JSON.parse(data);
                    var ip_address = '';

                    var virtualIp = data.Deployment.VirtualIPs.VirtualIP;

                    if (virtualIp) {

                        ip_address = virtualIp.Address;
                        logger.debug('Azure VM ip address:', ip_address);

                        var status = data.Deployment.RoleInstanceList.RoleInstance.InstanceStatus;

                        if (status == 'ReadyRole') {
                            //set the floating ip to instance
                            if (ip_address)
                                if (!err) {
                                    self.updatedfloatingip = true;
                                    logger.debug('Updated with floating ip');
                                }
                        }
                    } else {
                        logger.debug('Timeout 2 set for Ip');
                        if (!self.callbackdone) {
                            self.timeouts.push(setTimeout(wfsr, 30000));
                        }
                    }

                    if (self.updatedfloatingip) {

                        var os = data.Deployment.RoleList.Role.OSVirtualHardDisk.OS;

                        logger.debug("data.OSDisk.operatingSystem >>>>", os);

                        self.trysshoninstance(os, ip_address, username, pwd, function(cdata) {
                            logger.debug('End trysshoninstance:', cdata);
                            if (cdata == 'ok') {
                                //Clearing all timeouts
                                for (var i = 0; i < self.timeouts.length; i++) {
                                    logger.debug('Clearing timeout : ', self.timeouts[i]);
                                    clearTimeout(self.timeouts[i]);
                                }
                                self.timeouts = [];
                                if (!self.callbackdone) {
                                    self.callbackdone = true;
                                    callback(null, ip_address);
                                }

                                return;
                            } else {
                                logger.debug('Timeout 1 set');
                                if (!self.callbackdone) {
                                    self.timeouts.push(setTimeout(wfsr, 30000));
                                }
                            }
                        });

                    } else {
                        logger.debug('Timeout 2 set');
                        if (!self.callbackdone) {
                            self.timeouts.push(setTimeout(wfsr, 60000));
                        }
                    }

                }
            });
        };
        logger.debug('Timeout 3 set');
        self.timeouts.push(setTimeout(wfsr, 15000));
    }

    this.getVM = function(params, callback) {
        fs.readFile(certFile, function(err, certData) {
            if (err) {
                logger.error("Error reading certFile..", err);
                return;
            }
            logger.debug("certFile loaded");

            fs.readFile(keyFile, function(err, keyData) {
                if (err) {
                    logger.error("Error reading keyFile..", err);
                    return;
                }
                logger.debug("keyFile loaded");

                console.log('params ==> ',params);
                var opts = {
                    url: 'https://management.core.windows.net/'+options.subscriptionId+'/services/hostedservices/'+params.cloudServiceName+'/deployments/'+params.deploymentName+'/roles/'+params.name,
                    agentOptions: {
                        cert: certData,
                        key: keyData,
                    },
                    headers: {
                        "x-ms-version": "2015-04-01",
                        "Content-Type": "application/json"
                    }
                }

                request.get(opts, function(err, response, body) {

                    if (err) {
                        //console.log("Error...",err);
                        callback(err, null);
                        return;
                    }

                    console.log("response.statusCode: ", response.statusCode);

                    if (response.statusCode == '200') {
                        logger.debug("END:: getServerByName");
                        callback(null, body);
                        return;
                    } else {
                        callback(body, null);
                        return;
                    }

                });
            });
        });

    }

    function pollInstanceState(instanceName, state, callback) {
        function checkInstanceStatus(statusToCheck, delay) {
            var timeout = setTimeout(function() {
                that.getServerByName(instanceName, function(err, data) {
                    if (err) {
                        logger.debug('Unable to get instance state', err);
                        callback(err, null);
                        return;
                    }
                    data = xml2json.toJson(data);
                    data = JSON.parse(data);

                    var instanceState = data.Deployment.RoleInstanceList.RoleInstance.InstanceStatus;

                    logger.debug('Instance Status:', instanceState);

                    if (statusToCheck === instanceState) {
                        callback(null, instanceState);
                    } else {
                        checkInstanceStatus(state, 5000);
                    }
                });
            }, delay);
        }
        checkInstanceStatus(state, 1);
    }

}


module.exports = AzureCloud;

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


// This file act as a Model class which contains all Settings schema.

var mongoose = require('mongoose');
var uuid = require('node-uuid'); //used for generating unique id
var validate = require('mongoose-validator');
var logger = require('_pr/logger')(module);
var extend = require('mongoose-validator').extend;
var Schema = mongoose.Schema;

extend('is_ValidName', function (val) {
    var pattern = /^[a-zA-Z0-9-_]+$/;
    return pattern.test(val);
}, 'Name can contain alphabets, numbers,dash, underscore');

extend('isValidDesc', function (val) {
    var pattern = /^[a-zA-Z0-9-_.,\s]+$/;
    return pattern.test(val);
}, 'Name can contain alphabets, numbers,dash, underscore');

var nameValidator = [
    validate({
        validator: 'isLength',
        arguments: [1, 15],
        message: 'Name should be between 1 and 15 characters'
    }),
    validate({
        validator: 'is_ValidName',
        passIfEmpty: true,
        message: 'Name can contain alphabets, numbers,dash, underscore, dot'
    })
];

var descValidator = [
    validate({
        validator: 'isLength',
        arguments: [0, 140],
        message: 'Name should be between 0 and 140 characters'
    }),
    validate({
        validator: 'isValidDesc',
        passIfEmpty: true,
        message: 'Name can contain alphabets, numbers,dash, underscore, dot or a space'
    })
];

var d4dMastersSchemaNew = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    masterjson: {
        data: Object
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelNew = mongoose.model('d4dMasterNew', d4dMastersSchemaNew, 'd4dmastersnew');

var d4dMastersOrg = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    orgname: {
        type: String,
        required: true,
        trim: true,
        validate: nameValidator
    },
    domainname: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    plannedCost: {
        type: Number,
        required: false,
        default: 0.0
    },
    active: {
        type: Boolean,
        trim: true,
        default: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersOrg = mongoose.model('d4dModelMastersOrg', d4dMastersOrg, 'd4dmastersnew');




var d4dMastersProductGroup = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        trim: true,
        validate: nameValidator
    },
    orgname: {
        type: [String],
        required: true,
        trim: true
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    productgroupname: {
        type: String,
        required: true,
        trim: true,
        validate: nameValidator
    },
    description: {
        type: String,
        trim: true,
        validate: descValidator
    },
    plannedCost: {
        type: Number,
        required: false,
        default: 0.0
    },
    active: {
        type: Boolean,
        trim: true,
        default: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersProductGroup = mongoose.model('d4dModelMastersProductGroup', d4dMastersProductGroup, 'd4dmastersnew');


var d4dMastersEnvironments = new mongoose.Schema({
    id: {
        type: String,
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    orgname: {
        type: [String],
        required: false,
        trim: true
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    environmentname: {
        type: String,
        trim: true
    },
    puppetenvironmentname: {
        type: String
    },
    description: {
        type: String,
        trim: true,
        validate: descValidator
    },
    active: {
        type: Boolean,
        trim: true,
        default: true
    },
    configname: {
        type: String,
        trim: true
    },
    configname_rowid: {
        type: String,
        trim: true
    },
    puppetservername: {
        type: String,
        trim: true
    },
    puppetservername_rowid: {
        type: String,
        trim: true
    },
    projectname: {
        type: String,
        trim: true
    },
    projectname_rowid: {
        type: String,
        trim: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersEnvironments = mongoose.model('d4dModelMastersEnvironments', d4dMastersEnvironments, 'd4dmastersnew');

var d4dMastersGeneric = new mongoose.Schema({
    active: {
        type: Boolean,
        trim: true,
        default: true
    },
    orgname: {
        type: [String],
        trim: true
    },
    orgname_rowid: {
        type: [String],
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersGeneric = mongoose.model('d4dModelMastersGeneric', d4dMastersGeneric, 'd4dmastersnew');

var d4dMastersDynamic = new mongoose.Schema({
    active: {
        type: Boolean
    },
    id: {
        type: String
    },
    rowid: {
        type: String
    }
}, {
    strict: false
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersDynamic = mongoose.model('d4dModelMastersDynamic', d4dMastersDynamic, 'd4dmastersnew');

var d4dMastersTeams = new mongoose.Schema({
    id: {
        type: String,
        trim: true
    },
    teamname: {
        type: String,
        trim: true
    },
    loginname: {
        type: String,
        trim: true
    },
    loginname_rowid: {
        type: String,
        trim: true
    },
    projectname: {
        type: String,
        trim: true
    },
    projectname_rowid: {
        type: String,
        trim: true
    },
    orgname: {
        type: [String],
        required: false,
        trim: true
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        validate: descValidator
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersTeams = mongoose.model('d4dModelMastersTeams', d4dMastersTeams, 'd4dmastersnew');

var d4dMastersProjects = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        trim: true,
        validate: nameValidator
    },
    orgname: {
        type: [String],
        required: false,
        trim: true
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    projectname: {
        type: String,
        trim: true,
        validate: nameValidator
    },
    productgroupname: {
        type: String,
        trim: true
    },
    productgroupname_rowid: {
        type: String,
        trim: true
    },
    environmentname: {
        type: String,
        trim: true
    },
    environmentname_rowid: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        validate: descValidator
    },
    active: {
        type: Boolean,
        trim: true,
        default: true
    },
    appdeploy: [{
            applicationname: String,
            appdescription: String
        }],
    repositories: {
        nexus: [String],
        docker: [String]
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersProjects = mongoose.model('d4dModelMastersProjects', d4dMastersProjects, 'd4dmastersnew');

var d4dMastersConfigManagement = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        trim: true,
        validate: nameValidator
    },
    orgname: {
        type: [String],
        required: true,
        trim: true,
        validate: nameValidator
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    orgrowid: {
        type: String,
        trim: true
    },
    configname: {
        type: String,
        required: true,
        trim: true
    },
    loginname: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        trim: true
    },
    userpemfile_filename: {
        type: String,
        trim: true
    },
    validatorpemfile_filename: {
        type: String,
        trim: true
    },
    kniferbfile_filename: {
        type: String,
        trim: true
    },
    encryption_filename: {
        type: String,
        trim: true
    },
    template_filename: {
        type: String,
        trim: true
    },
    folderpath: {
        type: String,
        trim: true
    },
    active: {
        type: Boolean,
        trim: true,
        default: true
    },
    configType: {
        type: String,
        trim: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersConfigManagement = mongoose.model('d4dModelMastersConfigManagement', d4dMastersConfigManagement, 'd4dmastersnew');

var d4dMastersDockerConfig = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        trim: true,
        validate: nameValidator
    },
    dockerreponame: {
        type: String,
        required: true,
        trim: true,
        validate: nameValidator
    },
    dockerrepopath: {
        type: String,
        required: true,
        trim: true
    },
    dockeruserid: {
        type: String,
        required: true,
        trim: true
    },
    dockeremailid: {
        type: String,
        trim: true
    },
    dockerpassword: {
        type: String,
        required: true,
        trim: true
    },
    orgname: {
        type: [String],
        required: true,
        trim: true,
        validate: nameValidator
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    projectname: {
        type: String,
        required: false,
        trim: true
    },
    projectname_rowid: {
        type: String,
        required: false,
        trim: true
    },
    repositories: Schema.Types.Mixed,
    folderpath: {
        type: String,
        trim: true
    },
    active: {
        type: Boolean,
        trim: true,
        default: true
    },
    configType: {
        type: String,
        trim: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersDockerConfig = mongoose.model('d4dModelMastersDockerConfig', d4dMastersDockerConfig, 'd4dmastersnew');


var d4dMastersUsers = new mongoose.Schema({
    id: {
        type: String,
        trim: true
    },
    loginname: {
        type: String,
        trim: true,
        validate: nameValidator
    },
    password: {
        type: String
    },
    email: {
        type: String,
        trim: true
    },
    userrolename: {
        type: String,
        trim: true
    },
    orgname: {
        type: [String],
        required: false,
        trim: true
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    teamname: {
        type: String,
        required: true,
        trim: true
    },
    teamname_rowid: {
        type: String,
        required: true,
        trim: true
    },
    active: {
        type: Boolean,
        trim: true,
        default: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersUsers = mongoose.model('d4dModelMastersUsers', d4dMastersUsers, 'd4dmastersnew');

var d4dMastersUserroles = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    userrolename: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    globalaccessname: {
        type: String,
        required: true,
        trim: true
    },
    orgname: {
        type: [String],
        required: false,
        trim: true
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersUserroles = mongoose.model('d4dModelMastersUserroles', d4dMastersUserroles, 'd4dmastersnew');



var d4dMastersDesignTemplateTypes = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    templatetypename: {
        type: String,
        required: true,
        trim: true
    },
    designtemplateicon_filename: {
        type: String,
        trim: true
    },
    orgname: {
        type: [String],
        required: false,
        trim: true
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    templatetype: {
        type: String,
        trim: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    },
    providerType:[String]
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersDesignTemplateTypes = mongoose.model('d4dModelMastersDesignTemplateTypes', d4dMastersDesignTemplateTypes, 'd4dmastersnew');

var d4dMastersTemplatesList = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    templatename: {
        type: String,
        trim: true
    },
    templatesicon_filename: {
        type: String,
        trim: true
    },
    templatesicon_filePath: {
        type: String,
        trim: true
    },
    templatetypename: {
        type: String,
        trim: true
    },
    dockerreponame: {
        type: String,
        trim: true
    },
    configname: {
        type: String,
        trim: true
    },
    configname_rowid: {
        type: String,
        trim: true
    },
    dockercontainerpathstitle: {
        type: String,
        trim: true
    },
    dockercontainerpaths: {
        type: String,
        trim: true
    },
    templatescookbooks: {
        type: String,
        trim: true
    },
    orgname: {
        type: [String],
        required: false,
        trim: true
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    template_filename: {
        type: String,
        trim: true
    },
    active: {
        type: Boolean,
        trim: true,
        default: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersTemplatesList = mongoose.model('d4dModelMastersTemplatesList', d4dMastersTemplatesList, 'd4dmastersnew');


var d4dMastersServicecommands = new mongoose.Schema({
    id: {
        type: String,
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    servicename: {
        type: String,
        trim: true,
        validate: nameValidator
    },
    commandname: {
        type: String,
        trim: true
    },
    commandtype: {
        type: String,
        trim: true
    },
    configname: {
        type: String,
        trim: true
    },
    configname_rowid: {
        type: String,
        trim: true
    },
    chefserverid: {
        type: String,
        trim: true
    },
    operatingsystem: {
        type: String,
        trim: true
    },
    servicecookbook: {
        type: String,
        trim: true
    },
    servicestart: {
        type: String,
        trim: true
    },
    servicestop: {
        type: String,
        trim: true
    },
    servicerestart: {
        type: String,
        trim: true
    },
    servicestatus: {
        type: String,
        trim: true
    },
    servicekill: {
        type: String,
        trim: true
    },
    command: {
        type: String,
        trim: true
    },
    commandaction: {
        type: String,
        trim: true
    },
    orgname: {
        type: [String],
        required: false,
        trim: true
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    active: {
        type: Boolean,
        trim: true,
        default: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersServicecommands = mongoose.model('d4dModelMastersServicecommands', d4dMastersServicecommands, 'd4dmastersnew');

var d4dMastersglobalaccess = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    globalaccessname: {
        type: String,
        required: true,
        trim: true,
        validate: nameValidator
    },
    files: {
        type: String,
        required: true,
        trim: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersglobalaccess = mongoose.model('d4dModelMastersglobalaccess', d4dMastersglobalaccess, 'd4dmastersnew');

var d4dMastersJenkinsConfig = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    jenkinsname: {
        type: String,
        required: true,
        trim: true,
        validate: nameValidator
    },
    jenkinsurl: {
        type: String,
        required: true,
        trim: true
    },
    jenkinsusername: {
        type: String,
        required: true,
        trim: true,
        validate: nameValidator
    },
    jenkinspassword: {
        type: String,
        required: true,
        trim: true
    },
    jenkinstokenfile_filename: {
        type: String,
        trim: true
    },
    orgname: {
        type: [String],
        required: true,
        trim: true,
        validate: nameValidator
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    folderpath: {
        type: String,
        trim: true
    },
    active: {
        type: Boolean,
        trim: true,
        default: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelJenkinsConfig = mongoose.model('d4dModelJenkinsConfig', d4dMastersJenkinsConfig, 'd4dmastersnew');

var d4dMastersBitbucketConfig = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    bitbucketname: {
        type: String,
        required: true,
        trim: true,
        validate: nameValidator
    },
    bitbucketurl: {
        type: String,
        required: false,
        trim: true
    },
    bitbucketusername: {
        type: String,
        required: true,
        trim: true
        //validate: nameValidator
    },
    bitbucketpassword: {
        type: String,
        required: true,
        trim: true
    },
    orgname: {
        type: [String],
        required: true,
        trim: true,
        validate: nameValidator
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    active: {
        type: Boolean,
        trim: true,
        default: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelBitbucketConfig = mongoose.model('d4dModelBitbucketConfig', d4dMastersBitbucketConfig, 'd4dmastersnew');

var d4dMastersSonarqubeConfig = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    sonarqubename: {
        type: String,
        required: true,
        trim: true,
        validate: nameValidator
    },
    sonarqubeurl: {
        type: String,
        required: false,
        trim: true
    },
    sonarqubeusername: {
        type: String,
        required: true,
        trim: true
        //validate: nameValidator
    },
    sonarqubepassword: {
        type: String,
        required: true,
        trim: true
    },
    orgname: {
        type: [String],
        required: true,
        trim: true,
        validate: nameValidator
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    active: {
        type: Boolean,
        trim: true,
        default: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelSonarqubeConfig = mongoose.model('d4dModelSonarqubeConfig', d4dMastersSonarqubeConfig, 'd4dmastersnew');

var d4dMastersFunctionalTestConfig = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    functionaltestname: {
        type: String,
        required: true,
        trim: true,
        validate: nameValidator
    },
    functionaltesturl: {
        type: String,
        required: true,
        trim: true
    },
    functionaltestdays: {
        type: String,
        required: true,
        trim: true,
        validate: nameValidator
    },
    orgname: {
        type: [String],
        required: true,
        trim: true,
        validate: nameValidator
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    active: {
        type: Boolean,
        trim: true,
        default: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelFunctionalTestConfig = mongoose.model('d4dModelFunctionalTestConfig', d4dMastersFunctionalTestConfig, 'd4dmastersnew');


var d4dMastersOctopusConfig = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    octopusname: {
        type: String,
        required: true,
        trim: true,
        validate: nameValidator
    },
    octopusurl: {
        type: String,
        required: true,
        trim: true
    },
    octopuskey: {
        type: String,
        required: true,
        trim: true
       
    },
    octopusenvs: {
        type: String,
        required: false,
        trim: true
       
    },
    
    orgname: {
        type: [String],
        required: true,
        trim: true,
        validate: nameValidator
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    active: {
        type: Boolean,
        trim: true,
        default: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelOctopusConfig = mongoose.model('d4dModelOctopusConfig', d4dMastersOctopusConfig, 'd4dmastersnew');

var d4dMastersProviders = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    providername: {
        type: String,
        required: true,
        trim: true
    },
    region: {
        type: String,
        required: true,
        trim: true
    },
    accesskey: {
        type: String,
        required: true,
        trim: true
    },
    secretkey: {
        type: String,
        required: true,
        trim: true
    },
    providertype: {
        type: String,
        required: true,
        trim: true
    },
    securitygroupids: {
        type: [String],
        required: true,
        trim: true
    },
    instanceUserName: {
        type: String,
        required: true,
        trim: true
    },
    providerpemfile_filename: {
        type: String,
        required: true,
        trim: true
    },
    folderpath: {
        type: String,
        required: true,
        trim: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersProviders = mongoose.model('d4dModelMastersProviders', d4dMastersProviders, 'd4dmastersnew');

var d4dMastersProvidersOpenStack = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    providername: {
        type: String,
        required: true,
        trim: true
    },
    openstackusername: {
        type: String,
        required: true,
        trim: true
    },
    openstackpassword: {
        type: String,
        required: true,
        trim: true
    },
    region: {
        type: String,
        required: false,
        trim: true
    },
    accesskey: {
        type: String,
        required: false,
        trim: true
    },
    secretkey: {
        type: String,
        required: false,
        trim: true
    },
    providertype: {
        type: String,
        required: true,
        trim: true
    },
    securitygroupids: {
        type: [String],
        required: false,
        trim: true
    },
    instanceUserName: {
        type: String,
        required: false,
        trim: true
    },
    providerpemfile_filename: {
        type: String,
        required: false,
        trim: true
    },
    folderpath: {
        type: String,
        required: false,
        trim: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersProvidersOpenStack = mongoose.model('d4dModelMastersProvidersOpenStack', d4dMastersProviders, 'd4dmastersnew');

var d4dMastersImages = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    imagename: {
        type: String,
        required: true,
        trim: true
    },
    imageidentifire: {
        type: String,
        required: true,
        trim: true
    },
    osusername: {
        type: String,
        required: true,
        trim: true
    },
    ostype: {
        type: String,
        required: true,
        trim: true
    },
    instancetypes: {
        type: [String],
        required: true,
        trim: true
    },
    providername: {
        type: String,
        required: true,
        trim: true
    },
    providername_rowid: {
        type: String,
        trim: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersImages = mongoose.model('d4dModelMastersImages', d4dMastersImages, 'd4dmastersnew');

var d4dMastersJira = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    orgname: {
        type: [String],
        required: true,
        trim: true,
        validate: nameValidator
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    jiraname: {
        type: String,
        required: true,
        trim: true
    },
    jirakey: {
        type: String,
        required: true,
        trim: true
    },
    /*jirapassword: {
        type: String,
        required: true,
        trim: true
    },*/
    jiraurl: {
        type: String,
        required: true,
        trim: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersJira = mongoose.model('d4dModelMastersJira', d4dMastersJira, 'd4dmastersnew');

var d4dMastersPuppetServer = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        trim: true,
        validate: nameValidator
    },
    orgname: {
        type: [String],
        required: true,
        trim: true,
        validate: nameValidator
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    orgrowid: {
        type: String,
        trim: true
    },
    puppetservername: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    puppetpassword: {
        type: String,
        trim: true
    },
    userpemfile_filename: {
        type: String,
        trim: true
    },
    folderpath: {
        type: String,
        trim: true
    },
    active: {
        type: Boolean,
        trim: true,
        default: true
    },
    configType: {
        type: String,
        trim: true
    },
    hostname: {
        type: String,
        required: true,
        trim: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersPuppetServer = mongoose.model('d4dModelMastersPuppetServer', d4dMastersPuppetServer, 'd4dmastersnew');


var d4dMastersNexusServer = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        trim: true,
        validate: nameValidator
    },
    orgname: {
        type: [String],
        required: true,
        trim: true,
        validate: nameValidator
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    projectname: {
        type: String,
        required: false,
        trim: true
    },
    projectname_rowid: {
        type: String,
        required: false,
        trim: true
    },
    repositories: Schema.Types.Mixed,
    orgrowid: {
        type: String,
        trim: true
    },
    nexusservername: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    nexuspassword: {
        type: String,
        trim: true
    },
    configType: {
        type: String,
        trim: true
    },
    hostname: {
        type: String,
        required: true,
        trim: true
    },
    groupid: {
        type: [String],
        required: false,
        trim: true
    },
    active: {
        type: Boolean,
        trim: true,
        default: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersNexusServer = mongoose.model('d4dModelMastersNexusServer', d4dMastersNexusServer, 'd4dmastersnew');


var d4dMastersCICDDashboard = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    dashboardName: {
        type: String,
        trim: true,
        validate: nameValidator
    },
    orgname: {
        type: [String],
        required: true,
        trim: true,
        validate: nameValidator
    },
    orgname_rowid: {
        type: [String],
        trim: true
    },
    productgroupname: {
        type: String,
        trim: true
    },
    productgroupname_rowid: {
        type: String,
        trim: true
    },
    projectname: {
        type: String,
        required: false,
        trim: true
    },
    projectname_rowid: {
        type: String,
        required: false,
        trim: true
    },
    
    orgrowid: {
        type: String,
        trim: true
    },
    dashboardServerId: {
        type: String,
        required: true,
        trim: true
    },
    dashboardId: {
        type: String,
       
        trim: true
    },
    dashboardUrl: {
        type: String,
        required: true,
        trim: true
    },
    dashboardLink: {
        type: String,
        required: true,
        trim: true
    },
        rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
}

);

d4dMastersCICDDashboard.statics.getDependentDashboard = function(dashboardServerId,callback)
{
    return this.findOne({"dashboardServerId" : dashboardServerId},
        function (err, CICDDashboard) {
            if (err) {
                logger.error(err);
                return callback(err, null);
            } else {
                return callback(null, CICDDashboard);
            }
        });
};

var d4dModelMastersCICDDashboard = mongoose.model('d4dModelMastersCICDDashboard', d4dMastersCICDDashboard, 'd4dmastersnew');

var d4dMastersRemoteBotServer = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    hostIP: {
        type: String,
        required: true,
        trim: true,
    },
    hostPort: {
        type: String,
        required: true,
        trim: true,
    },
   /* hostCredentialType: {
        type: String,
        required: false,
        trim: true
    },
    hostUserName: {
        type: String,
        required: false,
        trim: true
    },
    hostPassword: {
        type: String,
        required: false,
        trim: true
    },
    hostPemFileLocation: {
        type: String,
        required: false,
        trim: true
    },*/
    active: {
        type: Boolean,
        trim: true,
        default: true
    },
    orgname: {
        type: String,
        required: true,
        trim: true
    },
    orgname_rowid: {
        type: String,
        required: true,
        trim: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    }
}, {
    collection: 'd4dmastersnew'
});
var d4dModelMastersBOTsRemoteServer = mongoose.model('d4dModelMastersBOTsRemoteServer', d4dMastersRemoteBotServer, 'd4dmastersnew');

module.exports = d4dModelNew;
module.exports.d4dModelMastersOrg = d4dModelMastersOrg;
module.exports.d4dModelMastersProductGroup = d4dModelMastersProductGroup;
module.exports.d4dModelMastersEnvironments = d4dModelMastersEnvironments;
module.exports.d4dModelMastersProjects = d4dModelMastersProjects;
module.exports.d4dModelMastersConfigManagement = d4dModelMastersConfigManagement;
module.exports.d4dModelMastersDockerConfig = d4dModelMastersDockerConfig;
module.exports.d4dModelMastersDesignTemplateTypes = d4dModelMastersDesignTemplateTypes;
module.exports.d4dModelMastersTemplatesList = d4dModelMastersTemplatesList;
module.exports.d4dModelMastersServicecommands = d4dModelMastersServicecommands;
module.exports.d4dModelMastersUsers = d4dModelMastersUsers;
module.exports.d4dModelMastersTeams = d4dModelMastersTeams;
module.exports.d4dModelMastersUserroles = d4dModelMastersUserroles;
module.exports.d4dModelMastersglobalaccess = d4dModelMastersglobalaccess;
module.exports.d4dModelJenkinsConfig = d4dModelJenkinsConfig; //
module.exports.d4dModelMastersGeneric = d4dModelMastersGeneric;
module.exports.d4dModelMastersDynamic = d4dModelMastersDynamic;
module.exports.d4dModelMastersProviders = d4dModelMastersProviders;
module.exports.d4dModelMastersProvidersOpenStack = d4dModelMastersProvidersOpenStack;
module.exports.d4dModelMastersImages = d4dModelMastersImages;
module.exports.d4dModelMastersJira = d4dModelMastersJira;
module.exports.d4dModelMastersPuppetServer = d4dModelMastersPuppetServer;
module.exports.d4dModelMastersNexusServer = d4dModelMastersNexusServer;
module.exports.d4dModelBitbucketConfig = d4dModelBitbucketConfig;
module.exports.d4dModelOctopusConfig = d4dModelOctopusConfig;
module.exports.d4dModelFunctionalTestConfig = d4dModelFunctionalTestConfig;
module.exports.d4dModelMastersCICDDashboard = d4dModelMastersCICDDashboard;
module.exports.d4dModelSonarqubeConfig = d4dModelSonarqubeConfig;
module.exports.d4dModelMastersBOTsRemoteServer = d4dModelMastersBOTsRemoteServer;


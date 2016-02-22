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

var d4dModel = require('./d4dmastersmodel.js');
var uuid = require('node-uuid');
var d4dModelNew = require('./d4dmastersmodelnew.js');
var logger = require('_pr/logger')(module);


function Env() {


    this.createEnv__ = function(name, orgname, callback) {
        var uuid1 = uuid.v4();
        var tempObj = JSON.parse(envField);
        logger.debug('tempObj ==>', envField);

        d4dModel.findOne({
            id: '3'
        }, function(err, d4dMasterJson) {
            if (err) {
                logger.debug("Hit and error:" + err);
            }
            if (d4dMasterJson) {
                var hasOrg = false;
                d4dMasterJson.masterjson.rows.row.forEach(function(itm, i) {
                    logger.debug("found" + itm.field.length);
                    var fieldOrgName = null;
                    var fieldEnvName = null;
                    for (var j = 0; j < itm.field.length; j++) {
                        if (itm.field[j]["name"] == 'environmentname') {
                            if (itm.field[j]["values"].value == name) {
                                logger.debug("found: " + i + " -- " + itm.field[j]["values"].value);
                                fieldEnvName = itm.field[j]["values"].value;
                            }
                        } else if (itm.field[j]["name"] == 'orgname') {
                            logger.debug("found: " + i + " -- " + itm.field[j]["values"].value);
                            fieldOrgName = itm.field[j]["values"].value;

                        }
                    }
                    logger.debug('org====>', orgname, fieldOrgName, fieldEnvName, name);
                    if (orgname == fieldOrgName && fieldEnvName == name) {
                        logger.debug('has org true');
                        hasOrg = true;
                    }


                });
                if (hasOrg == false) {
                    //Creating org
                    logger.debug('Creating');
                    d4dMasterJson.masterjson.rows.row.push(JSON.parse(envField));


                    d4dModel.update({
                        "id": "3"
                    }, {
                        $set: {
                            "masterjson": d4dMasterJson.masterjson
                        }
                    }, {
                        upsert: false
                    }, function(err, data) {
                        if (err) {
                            callback(err, null);
                            return;
                        }
                        callback(null, data);
                    });
                } else {
                    callback(null, name);
                }

            } else {
                callback(true, name);
                logger.debug("none found");
            }

        });

    }

    this.createEnv = function(name, orgname, bgname, projname, callback) {
        var uuid1 = uuid.v4();
        var envField = [];
        envField.push('\"environmentname\" : \"' + name + '\"');
        envField.push('\"orgname_rowid\" : \"' + orgname + '\"');
        envField.push('\"orgname\" : \"\"');
        envField.push('\"rowid\" : \"' + uuid1 + '\"');
        envField.push('\"id\" : \"3\"');
        var FLD = JSON.parse('{' + envField + '}');
        logger.debug('tempObj ==>', JSON.stringify(FLD));
        d4dModelNew.d4dModelMastersEnvironments.findOne({
            environmentname: name,
            orgname_rowid: orgname,
            id: '3'
        }, function(err, envdata) {
            logger.debug(JSON.stringify(envdata));
            if (!envdata) {
                var mastersrdb = new d4dModelNew.d4dModelMastersEnvironments(FLD);
                mastersrdb.save(function(err, data) {
                    if (err) {
                        logger.debug('Hit Save in createEnv error' + err);
                        callback(err, null);
                        return;
                    }
                    logger.debug('New Env Master Saved');
                    logger.debug('Need to update project with : o' + orgname + ' b' + bgname + ' e' + uuid1 + ' p' + projname);
                    //Step to add env to project.
                    d4dModelNew.d4dModelMastersProjects.findOne({
                        orgname_rowid: orgname,
                        productgroupname_rowid: bgname,
                        rowid: projname,
                        id: '4'
                    }, function(err, data2) {
                        if (!err) {
                            var newenv = '';
                            if (data2.environmentname_rowid != '') {
                                logger.debug("Env Names found :========> " + data2.environmentname_rowid);
                                var _data2env = data2.environmentname_rowid.split(',');
                                if (_data2env.indexOf(uuid1) >= 0) {
                                    //found an env in the list exit
                                    logger.debug("In Callback Env found in list");
                                    callback(null, uuid1);

                                    return;
                                }
                                data2.environmentname_rowid += ',';
                            }
                            var newenv = data2.environmentname_rowid + uuid1;

                            logger.debug('Newenv ====>', newenv);
                            d4dModelNew.d4dModelMastersProjects.update({
                                orgname_rowid: orgname,
                                productgroupname_rowid: bgname,
                                rowid: projname,
                                id: '4'
                            }, {
                                environmentname_rowid: newenv
                            }, function(err, data1) {
                                if (!err) {
                                    //data2.environmentname_rowid
                                    callback(null, uuid1);
                                    return;
                                } else {
                                    callback(err, null);
                                    return;
                                }

                            });
                        } else {
                            callback(err, null);
                            return;
                        }
                    });

                });
            } else {
                d4dModelNew.d4dModelMastersProjects.findOne({
                    orgname_rowid: orgname,
                    productgroupname_rowid: bgname,
                    rowid: projname,
                    id: '4'
                }, function(err, data2) {
                    if (!err) {
                        var newenv = '';

                        if (data2.environmentname_rowid != '') {
                            var _data2env = data2.environmentname_rowid.split(',');
                            if (_data2env.indexOf(envdata.rowid) >= 0) {
                                //found an env in the list exit
                                logger.debug("In Callback Env found in list");
                                callback(null, envdata.rowid);

                                return;
                            }
                            data2.environmentname_rowid += ',';
                        }

                        newenv = data2.environmentname_rowid + name;
                        d4dModelNew.d4dModelMastersProjects.update({
                            orgname_rowid: orgname,
                            productgroupname_rowid: bgname,
                            rowid: projname,
                            id: '4'
                        }, {
                            environmentname_rowid: newenv
                        }, function(err, data1) {
                            if (!err) {
                                callback(null, name);
                                return;
                            } else {
                                callback(err, null);
                                return;
                            }

                        });
                    } else {
                        callback(err, null);
                        return;
                    }
                });

                //callback(null,name);
            }
        });
    }

}


module.exports = new Env();

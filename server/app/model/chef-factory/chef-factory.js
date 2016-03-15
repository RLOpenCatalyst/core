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


var Chef = require('_pr/lib/chef');
var fileIo = require('_pr/lib/utils/fileio');
var logger = require('_pr/logger')(module);


function fixPath(path) {
    if (path) {
        if (path[0] == '/') {
            path = path.slice(1);
        }
        if (path.length && path.length >= 2) {
            if (path[path.length - 1] == '/') {
                path = path.slice(0, path.length - 1);

            }
        } else {
            if (path[0] == '/') {
                path = path.slice(1);
            }
        }
    } else {
        path = '';
    }
    return path;
}

var ChefFactory = function ChefFactory(chefSettings) {
    var chef = new Chef(chefSettings);

    this.sync = function sync(callback) {
        chef.syncCookbooks(function(err) {
            if (err) {
                callback(err, null);
                return;
            }
            chef.syncRoles(function(err) {
                if (err) {
                    callback(err, null);
                    return;
                }
                callback(null);
            });

        });
    };

    this.getCookbookData = function(path, callback) {
        path = fixPath(path);
        var rootDir = chefSettings.userChefRepoLocation + '/cookbooks/';
        fileIo.exists(rootDir, function(exists) {
            if (exists) {
                readDir();
            } else {
                fileIo.mkdir(rootDir, function(err, callback) {
                    if (err) {
                        callback(err, null);
                        return;
                    }
                    readDir();
                });
            }
        });

        function readDir() {

            fileIo.isDir(rootDir + path, function(err, dir) {
                if (err) {
                    callback(err);
                    return;
                }

                if (dir) {
                    fileIo.readDir(rootDir, path, function(err, dirList, filesList) {

                        if (err) {
                            callback(err);
                            return;
                        }
                        var chefUserName;
                        if (chefSettings.chefUserName) {
                            chefUserName = chefSettings.chefUserName;
                        }
                        callback(null, {
                            resType: 'dir',
                            files: filesList,
                            dirs: dirList,
                            chefUserName: chefUserName
                        });
                    });
                } else { // this is a file
                    fileIo.readFile(rootDir + path, function(err, fileData) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        callback(null, {
                            resType: "file",
                            fileData: fileData.toString('utf-8')
                        });
                    });
                }
            });
        }
    };

    this.uploadCookbook = function(cookbookName, callback) {
        var fileCount = 0;

        function readNameFromFile(fileName, fileType, callback) {
            fileIo.readFile(chefSettings.userChefRepoLocation + '/cookbooks/' + cookbookName + '/' + fileName, function(err, fileData) {
                fileCount++;
                if (err) {
                    logger.debug(err);
                    if (fileCount < 2) {
                        readNameFromFile('metadata.json', 'json', callback);
                    } else {
                        callback(err, null);
                    }
                    return;
                }
                var cookbookName = null;
                var fileDataString = fileData.toString();
                if (fileType === 'rb') {
                    var regEx = /name\s*['"](.*?)['"]/g;
                    var matches;
                    var metaDatacookbookName;

                    while (matches = regEx.exec(fileDataString)) {
                        if (matches.length == 2) {
                            metaDatacookbookName = matches[1];
                            break;
                        }
                    }
                    if (metaDatacookbookName) {
                        cookbookName = metaDatacookbookName;
                    }
                    callback(null, cookbookName);

                } else if (fileType == 'json') {
                    var obj = JSON.parse(fileDataString);
                    cookbookName = obj.name;
                    callback(null, cookbookName);
                } else {
                    callback(null, null);
                }
            });
        }

        readNameFromFile('metadata.rb', 'rb', function(err, name) {
            if (err) {
                callback(err);
                return;
            }
            if (name) {
                cookbookName = name;
            }

            chef.uploadCookbook(cookbookName, function(err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null);
                }
            });
        });
    };

    this.saveCookbookFile = function(filePath, fileContent, callback) {
        filePath = fixPath(filePath);
        var self = this;
        if (filePath) {
            fileIo.writeFile(chefSettings.userChefRepoLocation + '/cookbooks/' + filePath, fileContent, 'utf-8', function(err) {
                if (err) {
                    callback(err, null);
                    return;
                }
                //extracting cookbook name;
                var cookbookName = '';

                var indexOfSlash = filePath.indexOf('/');
                if (indexOfSlash != -1) {
                    cookbookName = filePath.substring(0, indexOfSlash);
                }
                if (cookbookName) {

                    self.uploadCookbook(cookbookName, function(err) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null);
                        }
                    });
                } else {
                    callback({
                        message: "Invalid Cookbook name"
                    });
                }
            });
        } else {
            callback({
                message: "Invalid file path"
            }, null);
        }
    };

    this.getRoleData = function(path, callback) {
        path = fixPath(path);
        var rootDir = chefSettings.userChefRepoLocation + '/roles/';
        fileIo.exists(rootDir, function(exists) {
            if (exists) {
                readDir();
            } else {
                fileIo.mkdir(rootDir, function(err, callback) {
                    if (err) {
                        callback(err, null);
                        return;
                    }
                    readDir();
                });
            }
        });

        function readDir() {
            fileIo.isDir(rootDir + path, function(err, dir) {
                if (err) {
                    callback(err);
                    return;
                }
                if (dir) {
                    fileIo.readDir(rootDir, path, function(err, dirList, filesList) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        var chefUserName;
                        if (chefSettings.chefUserName) {
                            chefUserName = chefSettings.chefUserName;
                        }
                        callback(null, {
                            resType: 'dir',
                            files: filesList,
                            dirs: dirList,
                            chefUserName: chefUserName
                        });
                    });
                } else { // this is a file
                    fileIo.readFile(rootDir + path, function(err, fileData) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        callback(null, {
                            resType: "file",
                            fileData: fileData.toString('utf-8')
                        });
                    })
                }
            });
        }
    };

    this.saveRoleFile = function(filePath, fileContent, callback) {
        filePath = fixPath(filePath);
        logger.debug(filePath);
        if (filePath) {
            fileIo.writeFile(chefSettings.userChefRepoLocation + '/roles/' + filePath, fileContent, 'utf-8', function(err) {
                if (err) {
                    callback(err, null);
                    return;
                }
                //extracting cookbook name;
                var roleName = filePath;

                var indexOfSlash = filePath.indexOf('/');
                if (indexOfSlash != -1) {
                    roleName = filePath.substring(0, indexOfSlash);
                }
                if (roleName) {

                    chef.uploadRole(roleName, function(err) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null);
                        }
                    });
                } else {
                    callback({
                        message: "Invalid role name"
                    });
                }
            });
        } else {
            callback({
                message: "Invalid file path"
            }, null);
        }
    };

    this.getFactoryItems = function(callback) {
        chef.getCookbooksList(function(err, cookbookList) {
            if (err) {
                callback(err, null);
                return;
            }
            chef.getRolesList(function(err, rolesList) {
                if (err) {
                    callback(err, null);
                    return;
                }
                callback(null, {
                    cookbooks: Object.keys(cookbookList),
                    roles: Object.keys(rolesList)
                });
            });
        });
    };

    this.downloadFactoryItem = function(itemName, type, callback) {
        if (type === 'cookbook') {
            chef.downloadCookbook(itemName, null, function(err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null);
            });

        } else if (type === 'role') {
            chef.downloadRole(itemName, null, function(err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null);
            });
        } else {
            process.nextTick(function() {
                callback(null);
            });
        }
    };

    this.downloadFactoryItems = function(items, callback) {
        var cookbookCount = 0;
        var roleCount = 0;
        var cookbooks = items.cookbooks;
        var roles = items.roles;

        function downloadCookbook(cookbookName) {
            chef.downloadCookbook(cookbookName, null, function(err) {
                cookbookCount++;
                if (err) {
                    callback(err);
                    return;
                }
                if (cookbooks.length === cookbookCount) {
                    if (roles && roles.length) {
                        downloadRole(roles[roleCount]);
                    } else {
                        callback(null);
                    }
                } else {
                    downloadCookbook(cookbooks[cookbookCount]);
                }
            });
        }

        function downloadRole(roleName) {
            chef.downloadRole(roleName, null, function(err) {
                roleCount++;
                if (err) {
                    callback(err);
                    return;
                }
                if (roles.length === roleCount) {
                    callback(null);
                } else {
                    downloadRole(roles[roleCount]);
                }
            });
        }
        if (cookbooks && cookbooks.length) {
            downloadCookbook(cookbooks[cookbookCount]);
        } else if (roles && roles.length) {
            downloadRole(roles[roleCount]);
        } else {
            process.nextTick(function() {
                callback(null);
            });
        }
    };

};

module.exports = ChefFactory;

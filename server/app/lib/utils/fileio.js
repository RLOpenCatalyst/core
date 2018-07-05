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



var fs = require('fs');
var fsExtra = require('fs-extra');
var logger = require('_pr/logger')(module);

module.exports.readDir = function(root, path, callback) {
    var dirList = [];
    var filesList = [];
    var totalItems = 0;
    var that = this;
    fs.readdir(root + path, function(err, files) {

        if (err) {
            callback(err);
            return;
        }
        var fileStatError = false;
        totalItems = files.length;
        if (totalItems === 0) {
            callback(null, dirList, filesList);
            return;
        }
        for (var i = 0; i < totalItems; i++) {
            var file = files[i];
            (function(file) {
                fs.stat(root + path + '/' + file, function(err, stats) {
                    totalItems--;
                    if (err) {
                        fileStatError = true;
                        callback(err);
                        return;
                    }

                    var itemPath = path + '/' + file;
                    if (stats.isDirectory()) {
                        dirList.push({
                            fullPath: itemPath,
                            name: file
                        });
                    } else {
                        filesList.push({
                            fullPath: itemPath,
                            name: file
                        });
                    }
                    if (totalItems < 1) {
                        callback(null, dirList, filesList);
                    }

                });
            })(file);
            if (fileStatError) {
                break;
            }
        }
    })
}

module.exports.isDir = function(path, callback) {
    fs.stat(path, function(err, stats) {
        if (err) {
            callback(err);
            return;
        }
        if (stats.isDirectory()) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    });
}

module.exports.readFile = function(path, callback) {
    fs.readFile(path, function(err, fileData) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, fileData);
    })
}

module.exports.writeFile = function(path, data, encoding, callback) {
    var options = {};
    if (encoding) {
        options.encoding = encoding;
    }
    fs.writeFile(path, data, options, function(err) {
        if (err) {
            callback(err);
            return;
        }
        callback(null);
    });
}

module.exports.exists = function(path, callback) {
    fs.exists(path, function(exists, err) {
        if (exists) {
            callback(exists);
        } else {
            callback(false);
        }
    });
}

module.exports.mkdir = function(path, callback) {
    fs.mkdir(path, function(err) {
        if (err) {
            callback(err);
        } else {
            callback(null);
        }
    });
}

module.exports.copyFile = function(src, dst, callback) {
    fsExtra.copy(src, dst, function(err) {
        if (err) {
            logger.debug(err);
            callback(err);
            return;
        }
        callback(null);
    });
}

module.exports.removeFile = function(path, callback) {
    fs.unlink(path, function(err) {
        if (err) {
            if (typeof callback === 'function') {
                callback(err,null);
            }
            return;
        }
        if (typeof callback === 'function') {
            callback(null,null);
        }
    });
};

module.exports.appendToFile = function(path, data, callback) {
    fs.appendFile(path, data, function(err) {
        if (err) {
            callback(err);
            return;
        }
        callback(null);
    });
};

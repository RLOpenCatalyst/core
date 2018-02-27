
var fs = require('fs');
var Grid = require('gridfs-stream');
var appConfig = require('_pr/config');
var logger = require('_pr/logger')(module);
var gfs = null;
var mongoDbClient = require('mongodb');
var uuid = require('node-uuid');
var dbHost = process.env.DB_HOST || appConfig.db.host;
mongoDbClient.connect('mongodb://' + dbHost + ':' + appConfig.db.port + '/' + appConfig.db.dbName, function (err, db) {
    if (err) {
        throw "unable to connect to mongodb"
        return;
    }
    gfs = Grid(db, mongoDbClient);
});

var fileUpload = module.exports = {};

fileUpload.uploadFile = function uploadFile(filename, filePath, fileId, callback) {
    if(fileId === null){
        fileId = uuid.v4();
    }
    var writeStream = gfs.createWriteStream({
        _id: fileId,
        filename: filename,
        mode: 'w',
        content_type: 'plain/text'
    });
    fs.createReadStream(filePath).pipe(writeStream).on('error', function (err) {
        logger.error(err);
        callback(err, null);
    }).on('finish', function () {
        callback(null, fileId)
    });
};

fileUpload.getFileByFileId = function getFileByFileId(fileId, callback) {
    gfs.findOne({
        _id: fileId
    }, function (err, file) {
        if (err) {
            callback(err, null);
        }
        callback(null, file);
    });
};

fileUpload.getReadStreamFileByFileId = function getReadStreamFileByFileId(fileId, callback) {
    var buffer = '';
    gfs.findOne({
        _id: fileId
    }, function (err, file) {
        if (err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err,null);
        } else if (!file) {
            var err = new Error('File not found');
            err.status = 404;
            return callback(err,null);
        } else {
            var readStream = gfs.createReadStream({
                _id: file._id
            });
            readStream.on("data", function (chunk) {
                buffer += chunk;
            });
            readStream.on("end", function () {
                callback(null, {fileName: file.filename, fileData: buffer})
            });
            readStream.on("error", function (err) {
                callback(err, null)
            });
        }
    });
};

fileUpload.removeFileByFileId = function removeFileByFileId(fileId, callback) {
    gfs.files.remove({
        _id: fileId
    }, function (err, file) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, file);
        }
    });
};

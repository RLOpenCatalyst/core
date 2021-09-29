var fs = require('fs');
var mongoose = require('mongoose');
// var Grid = new mongoose.mongo.GridFSBucket();
var appConfig = require('_pr/config');
var logger = require('_pr/logger')(module);
var gfs = null;
var CHUNKS_COLL, FILES_COLL, dbo;
var mongoDbClient = require('mongodb').MongoClient;
var uuid = require('node-uuid');

const dboptions = {
    host: process.env.DB_HOST || appConfig.db.host,
    port: process.env.DB_PORT || appConfig.db.port,
    dbName: process.env.DB_NAME || appConfig.db.dbName,
    ssl: process.env.DB_SSL === 'true' || appConfig.db.ssl,
    enable_ssl: (process.env.ENABLE_SSL === 'true') || appConfig.db.enable_ssl,
    enable_auth: process.env.ENABLE_AUTH === 'true' || appConfig.db.enable_auth,
    ssl_config:{
        "CAFile": process.env.CAFILE || appConfig.db.ssl_config.CAFile,
        "PEMFile": process.env.PEMFILE || appConfig.db.ssl_config.PEMFile
    },
    auth_config:{
        "username":process.env.username || appConfig.db.auth_config.username,
        "password":process.env.password || appConfig.db.auth_config.password,
        "authenticated":process.env.authenticated || appConfig.db.auth_config.authenticated
    }
};

var connectionString = 'mongodb://' + dboptions.host + ':' + dboptions.port + '/' + dboptions.dbName + '?ssl=' + dboptions.ssl;
var mongoOptions = {};
if(dboptions.enable_ssl){
    connectionString = 'mongodb://' + dboptions.host + ':' + dboptions.port + '/' + dboptions.dbName + '?ssl=' + dboptions.enable_ssl;
    var ca = [fs.readFileSync(dboptions.ssl_config.CAFile)];
    var cert = fs.readFileSync(dboptions.ssl_config.PEMFile);
    var key = fs.readFileSync(dboptions.ssl_config.PEMFile);
    mongoOptions.checkServerIdentity = false;
    mongoOptions.sslValidate = true;
    mongoOptions.sslCA = ca;
    mongoOptions.sslKey = key;
    mongoOptions.sslCert = cert;
}

if(dboptions.enable_auth){
    connectionString = 'mongodb://'+dboptions.auth_config.username+':'+dboptions.auth_config.password+'@' + dboptions.host + ':' + dboptions.port + '/' + dboptions.dbName + '?ssl=' + dboptions.enable_ssl+'&authSource=admin';
}

logger.info("Connecting to mongodb in file upload.");
mongoDbClient.connect(connectionString,  mongoOptions , function (err, client) {
    if (err) {
        logger.error(err);
        throw "unable to connect to mongodb";
        return;
    }else{
        var db = client.db(dboptions.dbName);
        logger.info("Mongodb connected successfully in file upload.");
        gfs = new mongoose.mongo.GridFSBucket(db, { bucketName: 'fs' });
        CHUNKS_COLL = 'fs.chunks';
        FILES_COLL = 'fs.files';
        dbo = db;
    }

});

var fileUpload = module.exports = {};

fileUpload.uploadFile = function uploadFile(filename, filePath, fileId, callback) {
    if (fileId === null) {
        fileId = uuid.v4();
    }
    var writeStream = gfs.openUploadStream({
        _id: fileId,
        filename: filename,
        mode: 'w',
        content_type: 'plain/text'
    });
    
    var res = fs.createReadStream(filePath).pipe(writeStream);
    res.on('error', handler)
    res.on('finish', function(){
        callback(null, fileId)
})
    // fs.createReadStream(filePath).pipe(writeStream).on('error', function (err) {
    //     logger.error("FileError -> " + err);
    //     callback(err, null);
    // }).on('finish', function () {
    //     callback(null, fileId)
    // });
};

function handler (err) { 
    if(err){
        logger.error('File writeStream error : ' + err);
    }
}

fileUpload.getFileByFileId = function getFileByFileId(fileId, callback) {
    // gfs.findOne({
    //     _id: fileId
    // }, function (err, file) {
    //     if (err) {
    //         callback(err, null);
    //     }
    //     callback(null, file);
    // });
    gfs.find({_id: fileId}).toArray((err, files) => {
        if(err){
            callback(err, null);
        }
        callback(null, files);
    })
};

fileUpload.getReadStreamFileByFileId = function getReadStreamFileByFileId(fileId, callback) {
    var buffer = '';
    var chunksQuery = dbo.collection(FILES_COLL).find({ "filename._id" : fileId });
    chunksQuery.toArray(function(error, docs) {
        if (err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err, null);
        } else if (!docs) {
            var err = new Error('File not found');
            err.status = 404;
            return callback(err, null);
        } else {
            var readStreamQuery = dbo.collection(CHUNKS_COLL).find({ files_id : docs[0]._id });
            readStreamQuery.toArray(function(error, botData) {
                var readStream = gfs.openDownloadStream(docs[0]._id);
                readStream.on("data", function (chunk) {
                        buffer += chunk;
                    });
                    readStream.on("end", function () {
                        callback(null, {fileName: docs[0].filename.filename, fileData: buffer})
                    });
                    readStream.on("error", function (err) {
                        callback(err, null)
                    });
                
            })
        }
    })
    // gfs.findOne({
    //     _id: fileId
    // }, function (err, file) {
    //     if (err) {
    //         var err = new Error('Internal server error');
    //         err.status = 500;
    //         return callback(err, null);
    //     } else if (!file) {
    //         var err = new Error('File not found');
    //         err.status = 404;
    //         return callback(err, null);
    //     } else {
    //         var readStream = gfs.createReadStream({
    //             _id: file._id
    //         });
    //         readStream.on("data", function (chunk) {
    //             buffer += chunk;
    //         });
    //         readStream.on("end", function () {
    //             callback(null, {fileName: file.filename, fileData: buffer})
    //         });
    //         readStream.on("error", function (err) {
    //             callback(err, null)
    //         });
    //     }
    // });
};

fileUpload.removeFileByFileId = function removeFileByFileId(fileId, callback) {
    dbo.collection(FILES_COLL).remove({ "filename._id": fileId }, function (err, file) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, file);
        }
    });
    // gfs.files.remove({
    //     _id: fileId
    // }, function (err, file) {
    //     if (err) {
    //         callback(err, null);
    //     } else {
    //         callback(null, file);
    //     }
    // });
};
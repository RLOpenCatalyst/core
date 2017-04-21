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


// The file contains all the end points for Tracks

var logger = require('_pr/logger')(module);
var uuid = require('node-uuid');
var fileUpload = require('_pr/model/file-upload/file-upload');
var apiUtil = require('_pr/lib/utils/apiUtil.js');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/fileUpload*', sessionVerificationFunc);

    app.post('/fileUpload', function(req, res) {
        if(req.files && req.files.file) {
            var fileId = req.query.fileId?req.query.fileId:null;
            if(fileId === '' || fileId === null){
                fileId = uuid.v4();
            }else{
                fileId = req.query.fileId;
            }
            fileUpload.uploadFile(req.files.file.originalFilename,req.files.file.path,fileId,function(err,fileData){
                if(err){
                    res.send({message: "Unable to upload file"});
                }
                res.send({fileId:fileData});
                apiUtil.removeFile(req.files.file.path);
            })
        } else if(req.query.fileId !== '' && req.query.fileId !== null) {
            res.send({fileId:req.query.fileId});
            apiUtil.removeFile(req.files.file.path);
        } else{
            res.send({message: "Bad Request"});
            apiUtil.removeFile(req.files.file.path);
        }
    });

    app.delete('/fileUpload', function(req, res) {
        fileUpload.removeFileByFileId(req.query.fileId,function(err,fileData){
            if(err){
                res.send({message: "Unable to delete file"});
            }
            res.send(fileData);
        })
    });

    app.get('/fileUpload', function(req, res) {
        fileUpload.getReadStreamFileByFileId(req.query.fileId,function(err,file){
            if(err){
                res.send({message: "Unable to delete file"});
            }
            res.send(file);
        })
    });
};


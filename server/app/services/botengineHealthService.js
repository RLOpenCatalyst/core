var logger = require('_pr/logger')(module);
var async = require("async");
var crontab = require('node-crontab');
var d4dModelNew = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');
var dateUtil = require('_pr/lib/utils/dateUtil')


var botengineHealthService = module.exports = {};

var date = new Date();
var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);

botengineHealthService.getTotalAvailability = function getTotalAvailability(totalUnplannedOutageTime,callback) {
    
    var availabilty = [];
    var available = [];
    var totalUnplannedOutageTime = [];
    var lastSync = [];
    var lastSync = new Date().getTime();
    var curr_time = new Date().getTime();
    var totalTime = [];

        d4dModelNew.d4dModelMastersBOTsRemoteServer.find({
        
            id: '32'
        }, function (err, remoteServerDetails) {
            if (err) {
                callback(err,null);
                return;
            }else{
            
            if (remoteServerDetails) {
                for(var i=0;i<remoteServerDetails.length;i++){
                    var lastSync = remoteServerDetails[i].lastSync;
                if (remoteServerDetails[i].createdAt < new Date(firstDay).getTime()) {
                    totalTime[i] = (new Date().getTime() - new Date(firstDay).getTime());
                    //totalTime[i] = (new Date(firstDay).getTime() - remoteServerDetails[i].lastSync);
                    //console.log("total timeeeeeee",totalTime[i]);
                    if(remoteServerDetails[i].active == false){
            
                        totalUnplannedOutageTime[i] = (new Date().getTime() - remoteServerDetails[i].from_date);
                        availabilty[i]= ((Number(totalUnplannedOutageTime[i]) - totalTime[i]) / totalTime[i]) * 100;
                        //console.log("unplanned outage.........",totalUnplannedOutageTime[i]);
                        d4dModelNew.d4dModelMastersBOTsRemoteServer.update({
                            id: '32',
                            rowid: remoteServerDetails[i].rowid
                        }, { $set: { availability: availabilty[i]} }, function (err, data) {
                            if (err) {
                                logger.error('Error in Updating State of Bot-Engine', err);
                            }
                            else{

                               // console.log("Botengine updated successfully")
                            }
                        });
            
            
                    }else{
                        totalUnplannedOutageTime[i] = 0;
                        availabilty[i]= ((Number(totalUnplannedOutageTime[i]) - totalTime[i]) / totalTime[i]) * 100;
                        d4dModelNew.d4dModelMastersBOTsRemoteServer.update({
                            id: '32',
                            rowid: remoteServerDetails[i].rowid
                        }, { $set: { availability: availabilty[i]} }, function (err, data) {
                            if (err) {
                                logger.error('Error in Updating State of Bot-Engine', err);
                            }
                            else{

                                //console.log("Botengine updated successfully")
                            }
                        });
                    }
                    
                }
                else {
                    totalTime[i] = (new Date().getTime() - Number(remoteServerDetails[i].createdAt));
                    //totalTime[i] = (new Date(firstDay).getTime() - remoteServerDetails[i].lastSync);
                    if(remoteServerDetails[i].active == false){
            
                        totalUnplannedOutageTime[i] = (new Date().getTime() - remoteServerDetails[i].from_date);
                        availabilty[i]= ((Number(totalUnplannedOutageTime[i]) - totalTime[i]) / totalTime[i]) * 100;
                        d4dModelNew.d4dModelMastersBOTsRemoteServer.update({
                            id: '32',
                            rowid: remoteServerDetails[i].rowid
                        }, { $set: { availability: availabilty[i]} }, function (err, data) {
                            if (err) {
                                logger.error('Error in Updating State of Bot-Engine', err);
                            }
                            else{

                               // console.log("Botengine updated successfully")
                            }
                        });
            
            
                    }else{
                        totalUnplannedOutageTime[i] = 0;
                        availabilty[i]= ((Number(totalUnplannedOutageTime[i]) - totalTime[i]) / totalTime[i]) * 100;
                        d4dModelNew.d4dModelMastersBOTsRemoteServer.update({
                            id: '32',
                            rowid: remoteServerDetails[i].rowid
                        }, { $set: { availability: availabilty[i]} }, function (err, data) {
                            if (err) {
                                logger.error('Error in Updating State of Bot-Engine', err);
                            }
                            else{

                                console.log("Botengine updated successfully")
                            }
                        });
                    }
                }
                }
            }

        }
        
    });
}



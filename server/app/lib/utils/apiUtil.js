/**
 * Created by Durgesh on 28/3/16.
 */

var logger = require('_pr/logger')(module);
var appConfig = require('_pr/config');
var commons=appConfig.constantData;
var normalizedUtil = require('_pr/lib/utils/normalizedUtil.js');
var formatMessage = require('format-message')
var fileIo = require('_pr/lib/utils/fileio');

var ApiUtil = function() {

    this.messageFormatter=function(formattedMessage,replaceTextObj,callback){
        var resultMessage = formatMessage(formattedMessage,replaceTextObj);
        callback(null,resultMessage);
    }
    this.errorResponse=function(code,field){
        var errObj={};
        if(code==400){
            errObj['code']=code;
            errObj['message']='Bad Request';
            errObj['fields']={errorMessage:'Bad Request',attribute:field};
        } else if(code==500){
            errObj['code']=code;
            errObj['message']='Internal Server Error';
            errObj['fields']={errorMessage:'Server Behaved Unexpectedly',attribute:field};
        } else if(code==404){
            errObj['code']=code;
            errObj['message']='Not Found';
            errObj['fields']={errorMessage:'The requested resource could not be found but may be available in the future',attribute:field};
        } else if(code==403){

            errObj['code']=code;
            errObj['message']='Forbidden';
            errObj['fields']={errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:field};
        }
        return errObj;
    };
    this.removeFile = function(filePath){
        fileIo.removeFile(filePath, function(err, result) {
            if (err) {
                logger.error(err);
                return;
            } else {
                logger.debug("Successfully Remove file");
                return
            }
        })
    };
    this.createCronJobPattern= function(scheduler){
        scheduler.cronRepeatEvery = parseInt(scheduler.cronRepeatEvery);
        var startOn = null,endOn = null;
        if(scheduler.cronStartOn === scheduler.cronEndOn){
            startOn = new Date();
            endOn = new Date()
            endOn.setHours(23);
            endOn.setMinutes(59);
        }else{
            startOn = scheduler.cronStartOn;
            endOn = scheduler.cronEndOn;
        }
        if(scheduler.cronFrequency ==='Minutes'){
            scheduler.pattern = '*/'+scheduler.cronRepeatEvery+' * * * *';
        }else if(scheduler.cronFrequency ==='Hourly'){
            scheduler.pattern = '0 */'+scheduler.cronRepeatEvery+' * * *';
        }else if(scheduler.cronFrequency ==='Daily'){
            scheduler.pattern = parseInt(scheduler.cronMinute)+' '+parseInt(scheduler.cronHour)+' */'+scheduler.cronRepeatEvery+' * *';
        }else if(scheduler.cronFrequency ==='Weekly') {
            if(scheduler.cronRepeatEvery === 2) {
                scheduler.pattern = parseInt(scheduler.cronMinute)+' '+parseInt(scheduler.cronHour)+' 8-14 * ' + parseInt(scheduler.cronWeekDay);
            }else if(scheduler.cronRepeatEvery === 3) {
                scheduler.pattern = parseInt(scheduler.cronMinute)+' '+parseInt(scheduler.cronHour)+' 15-21 * ' + parseInt(scheduler.cronWeekDay);
            }else if(scheduler.cronRepeatEvery === 4) {
                scheduler.pattern = parseInt(scheduler.cronMinute)+' '+parseInt(scheduler.cronHour)+' 22-28 * ' + parseInt(scheduler.cronWeekDay);
            }else{
                scheduler.pattern = parseInt(scheduler.cronMinute)+' '+parseInt(scheduler.cronHour)+' * * ' + parseInt(scheduler.cronWeekDay);
            }
        }else if(scheduler.cronFrequency ==='Monthly') {
            if(scheduler.cronRepeatEvery === 1) {
                scheduler.pattern = parseInt(scheduler.cronMinute)+' '+parseInt(scheduler.cronHour)+' '+parseInt(scheduler.cronDate)+' * *';
            }else{
                scheduler.pattern = parseInt(scheduler.cronMinute)+' '+parseInt(scheduler.cronHour)+' '+parseInt(scheduler.cronDate)+' */'+scheduler.cronRepeatEvery+' *';
            }
        }else if(scheduler.cronFrequency ==='Yearly') {
            scheduler.pattern ='0 '+parseInt(scheduler.cronMinute)+' '+parseInt(scheduler.cronHour)+' '+parseInt(scheduler.cronDate)+' '+parseInt(scheduler.cronMonth)+' ? '+parseInt(scheduler.cronYear)/scheduler.cronRepeatEvery;
        }
        var cronScheduler = {
            "cronFrequency": scheduler.cronFrequency,
            "cronRepeatEvery": scheduler.cronRepeatEvery,
            "cronPattern":scheduler.pattern,
            "cronStartOn":Date.parse(startOn),
            "cronEndOn":Date.parse(endOn),
            "cronHour":scheduler.cronHour ? parseInt(scheduler.cronHour):0,
            "cronMinute":scheduler.cronMinute ? parseInt(scheduler.cronMinute):0,
            "cronDate":scheduler.cronDate ? parseInt(scheduler.cronDate):0,
            "cronWeekDay":scheduler.cronWeekDay ? parseInt(scheduler.cronWeekDay):0,
            "cronMonth":scheduler.cronMonth ? scheduler.cronMonth: null,
            "cronYear":scheduler.cronYear ? scheduler.cronYear: null
        }
        return cronScheduler;
    }
    this.paginationResponse=function(data,req, callback) {
        var response={};
        var sortField=req.mirrorSort;
        response[req.id]=data.docs;
        response['metaData']={
            totalRecords:data.total,
            pageSize:data.limit,
            page:data.page,
            totalPages:data.pages,
            sortBy:Object.keys(sortField)[0],
            sortOrder:req.mirrorSort ? (sortField[Object.keys(sortField)[0]]==1 ?'asc' :'desc') : '',
            filterBy:req.filterBy
        };
        callback(null, response);
        return;
    };

    this.changeResponseForJqueryPagination=function(data,req,callback){
        var resObj= {
            "draw": req.draw,
            "recordsTotal": data.total,
            "recordsFiltered": data.total,
            "data":data.docs
        };
        callback(null,resObj);
    };

    this.databaseUtil=function(jsonData,callback){
        var queryObj={};
        var queryArr=[];
        var objAnd = {}
        var objOr=[];
        var databaseCall={};
        var columns=commons.common_field;
        var fields=commons.sort_field;
        var sortField=jsonData.mirrorSort;
        var key=Object.keys(sortField)[0];

        if(fields.indexOf(key) !== -1){
            if(jsonData.id === 'tasks' || jsonData.id === 'instances' || jsonData.id === 'instanceLogs' || jsonData.id === 'taskLogs'){
                normalizedUtil.normalizedSort(jsonData,key);
                var sortBy={};
                sortBy['normalized'] = sortField[key];
                if(sortField[key] === -1){
                    sortBy[commons.sortReferanceData[jsonData.id]] = 1;
                };
                if(sortField[key] === 1){
                    sortBy[commons.sortReferanceData[jsonData.id]] = -1;
                }
                jsonData.sortBy=sortBy;
            }
        }
        for(var i = 0; i < columns.length; i++){
            var keyField=columns[i];
            if(jsonData[keyField]) {
                objAnd[keyField] = jsonData[keyField];
            }

        };
        if(jsonData.search) {
            queryArr.push(objAnd);
            for(var i = 0; i < jsonData.searchColumns.length; i++){
                var searchParam={};
                searchParam[jsonData.searchColumns[i]]={
                  $regex: new RegExp(jsonData.search, "i")
                };
                objOr.push(searchParam);
            }
            queryArr.push({$or:objOr});
        }
        if(jsonData.filterBy) {
            objAnd = jsonData.filterBy;
        }
        queryArr.push(objAnd);
        queryObj['$and']=queryArr;
        var options = {
            sort: jsonData.sortBy,
            lean: false,
            page: jsonData.page > 0 ? jsonData.page : 1 ,
            limit: jsonData.pageSize
        };
        databaseCall['queryObj']=queryObj;
        databaseCall['options']=options;
        callback(null, databaseCall);
        return;
    };

    this.changeRequestForJqueryPagination=function(req,callback){
        var reqObj = {};
        if ('draw' in req) {
            reqObj = {
                'pageSize': req.pageSize,
                'page': req.page,
                'draw': req.draw,
                'sortOrder': req.sortOrder,
                'sortBy': req.sortBy
            }
        }
        if(('search' in req) && (req.search !== '' || req.search !== null)){
         reqObj['search'] =   req.search;
        }
        if('filterBy' in req){
            reqObj['filterBy'] =   req.filterBy;
        }
        callback(null,reqObj);
    };
    this.paginationRequest=function(data,key, callback) {
        var pageSize,page;
        if(data.pageSize) {
            pageSize = parseInt(data.pageSize);
            if (pageSize > commons.max_record_limit) {
                pageSize = commons.max_record_limit;
            }
        } else {
            pageSize = commons.record_limit;
        }
        if(data.page) {
            page = parseInt(data.page);
        } else {
            page = commons.skip_Records;
        }

        var sortBy={};
        if(data.sortBy) {
            sortBy[data.sortBy] = data.sortOrder == 'desc' ? -1 : 1;
        } else {
            sortBy[commons.sortReferanceData[key]] = commons.sort_order == 'desc' ? -1 : 1;
        }

        var request={
            'sortBy':sortBy,
            'mirrorSort' :sortBy,
            'page':page,
            'pageSize':pageSize,
            'id':key
        };
        var filterBy={};
        if(data.filterBy) {
            var a = data.filterBy.split(",");
            for (var i = 0; i < a.length; i++) {
                var b = a[i].split(":");
                var c = b[1].split("+");
                if (c.length > 1) {
                    filterBy[b[0]] = {'$in': c};
                } else {
                    if(key === 'resources' && b[0] === 'providerId'){
                        filterBy['providerDetails.id'] = b[1];
                    }else {
                        filterBy[b[0]] = b[1];
                    }
                }
            }
            request['filterBy'] = filterBy;
        }
        if (data.instanceType) {
            filterBy['blueprintData.templateType'] = data.instanceType;
            request['filterBy']=filterBy;

        }
        if(data.search){
            request['search']=data.search;
        }
        if (typeof callback === 'function') {
            callback(null, request);
        }
    }

    this.queryFilterBy = function(query,callback){
        var filterByObj = {};
        if(query.filterBy) {
            var filters = query.filterBy.split(',');
            for (var i = 0; i < filters.length; i++) {
                var filter = filters[i].split(':');
                var filterQueryValues = filter[1].split("+");
                if (filterQueryValues.length > 1) {
                    filterByObj[filter[0]] = {'$in': filterQueryValues};
                } else {
                    filterByObj[filter[0]] = filter[1];
                }

            }
            callback(null, filterByObj);
        }else{
            callback(null, filterByObj);
        }
    }

    this.writeLogFile = function(desPath,data,callback){
        fileIo.exists(desPath,function(err,existFlag){
            if(err){
                logger.error("Error in checking File Exists or not.",err);
                callback(err,null);
                return;
            }else if(existFlag === true){
                fileIo.appendToFile(desPath,data,function(err,dataAppend){
                    if(err){
                        logger.error("Error in Appending Data in exist File.",err);
                        callback(err,null);
                        return;
                    }else{
                        callback(null,dataAppend);
                        return;
                    }
                })
            }else{
                fileIo.writeFile(desPath, data, false, function (err, fileWrite) {
                    if (err) {
                        logger.error("Error in Writing File.", err);
                        callback(err, null);
                        return;
                    } else {
                        callback(null, fileWrite);
                        return;
                    }
                });
            }

        })
    }


}

module.exports = new ApiUtil();
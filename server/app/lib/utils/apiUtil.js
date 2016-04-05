/**
 * Created by Durgesh on 28/3/16.
 */

var logger = require('_pr/logger')(module);
var appConfig = require('_pr/config');
var constantData = appConfig.constantData;
var Cryptography = require('_pr/lib/utils/cryptography.js');
var cryptoConfig = appConfig.cryptoSettings;


var ApiUtil = function() {
    this.errorResponse=function(code,field){
        var errObj={};
        if(code==400){
            errObj['code']=code;
            errObj['message']='Bad Request';
            errObj['fields']={errorMessage:'Bad Request',attribute:field};
        }
        else if(code==500){
            errObj['code']=code;
            errObj['message']='Internal Server Error';
            errObj['fields']={errorMessage:'Server Behaved Unexpectedly',attribute:field};
        }
        else if(code==404){
            errObj['code']=code;
            errObj['message']='Not Found';
            errObj['fields']={errorMessage:'The requested resource could not be found but may be available in the future',attribute:field};
        }
        else if(code==403){
            errObj['code']=code;
            errObj['message']='Forbidden';
            errObj['fields']={errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:field};
        }
        return errObj;
    }
    this.paginationResponse=function(data,req, callback) {
        var response={};
        response[req.id]=data.docs;
        response['metaData']={
            totalRecords:data.total,
            pageSize:data.limit,
            page:data.page,
            totalPages:data.pages,
            sortBy:Object.keys(req.sortBy)[0],
            sortOrder:req[Object.keys(req.sortBy)]==1 ?'desc' :"asc",
            filterBy:req.filterBy
        };

        callback(null, response);
        return;
    };

    this.databaseUtil=function(jsonData,callback){
        var queryObj={};
        var queryArr=[];
        var objAnd = {}
        var objOr=[];
        var databaseCall={};
        if(jsonData.providerId)
            objAnd["providerId"] = jsonData.providerId;
        if(jsonData.orgId)
            objAnd["orgId"] = jsonData.orgId;
        if(jsonData.projectId)
            objAnd["projectId"] = jsonData.projectId;
        if(jsonData.bgId)
            objAnd["bgId"] = jsonData.bgId;
        if(jsonData.envId)
            objAnd["envId"] = jsonData.envId;
        if (jsonData.instanceType) {
            objAnd['blueprintData.templateType'] = jsonData.instanceType;
        }
        if(jsonData.search) {
            queryArr.push(objAnd);
            for(var i = 0; i < jsonData.searchColumns.length; i++){
                var searchParam={};
                searchParam[jsonData.searchColumns[i]]=jsonData.search;
                objOr.push(searchParam);
            }
            queryArr.push({$or:objOr});
        }
        else{
            if(jsonData.filterBy)
                objAnd = jsonData.filterBy;
            queryArr.push(objAnd);
        }
        queryObj['$and']=queryArr;
        var options = {
            sort: jsonData.sortBy,
            lean: false,
            skip: jsonData.record_Skip >0 ? jsonData.record_Skip :1,
            limit: jsonData.record_Limit
        };
        databaseCall['queryObj']=queryObj;
        databaseCall['options']=options;
        callback(null, databaseCall);
        return;

    };

    this.paginationRequest=function(data,key, callback) {
        var pageSize,page;
        if(data.pageSize) {
            pageSize = parseInt(data.pageSize);
            if (pageSize > constantData.max_record_limit)
                pageSize = constantData.max_record_limit;
        }
        else
            pageSize = constantData.record_limit;
        if(data.page)
            page = parseInt(data.page)-1;
        else
            page = constantData.skip_Records;

        var skip = pageSize * page;
        var sortBy={};
        if(data.sortBy)
            sortBy[data.sortBy]=data.sort_order=='desc' ? -1 : 1;
        else
            if(key=='unmanagedInstances')
                sortBy[constantData.sort_unmanaged_instances]=constantData.sort_order=='desc' ? -1 :1;
            else if(key=='managedInstances' || key=='instances')
                sortBy[constantData.sort_managed_instances]=constantData.sort_order=='desc' ? -1 :1;

        var request={
            'sortBy':sortBy,
            'record_Skip':skip,
            'record_Limit':pageSize
        };
        var filterBy={};
        if(data.filterBy){
            var a=data.filterBy.split(" ");
            for(var i = 0;i < a.length; i++){
                var b=a[i].split(":");
                if(b[0]=='region'){
                    var c=b[1].split(",");
                    if(c.length > 1)
                        filterBy['providerData.region'] =  {'$in':c};
                    else
                        filterBy['providerData.region']=b[1];
                }

                else {
                    var c=b[1].split(",");
                    if(c.length > 1)
                        filterBy[b[0]] =  {'$in':c};
                    else
                        filterBy[b[0]] = b[1];
                }
            }
            request['filterBy']=filterBy;
        }
       /* else {
            if (key == 'unmanagedInstances') {
                for (var i = 0; i < constantData.filter_unmanaged_instances_records.length; i++) {
                    var key = Object.keys(constantData.filter_unmanaged_instances_records[i]);
                    filterBy[key] = constantData.filter_unmanaged_instances_records[i][key];
                }
                request['filterBy']=filterBy;
            }
            else if (key == 'managedInstances') {
                for (var i = 0; i < constantData.filter_managed_instances_records.length; i++) {
                    var key = Object.keys(constantData.filter_managed_instances_records[i]);
                    filterBy[key] = constantData.filter_managed_instances_records[i][key];
                }
                request['filterBy']=filterBy;
            }
        }*/

        if(data.search){
            var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
            var encrpt=cryptography.encryptText(data.search, cryptoConfig.encryptionEncoding,cryptoConfig.decryptionEncoding);
            var dcypt=cryptography.decryptText(encrpt, cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
            request['search']=dcypt;
        }
        if (typeof callback === 'function') {
            callback(null, request);
        }
    };

}

module.exports = new ApiUtil();
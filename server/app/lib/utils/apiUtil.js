/**
 * Created by Durgesh on 28/3/16.
 */

var logger = require('_pr/logger')(module);
var appConfig = require('_pr/config');
var commons=appConfig.constantData;
var Cryptography = require('_pr/lib/utils/cryptography.js');
var cryptoConfig = appConfig.cryptoSettings;
var d4dModelNew = require('../../model/d4dmasters/d4dmastersmodelnew.js');


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
        var sortField=req.sortBy;
        response[req.id]=data.docs;
        response['metaData']={
            totalRecords:data.total,
            pageSize:data.limit,
            page:data.page,
            totalPages:data.pages,
            sortBy:Object.keys(sortField)[0],
            sortOrder:req.sortBy ? (sortField[Object.keys(sortField)[0]]==1 ?'asc' :'desc') : '',
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
        var columns=commons.common_field;
        for(var i = 0; i < columns.length; i++){
            var keyField=columns[i];
            if(jsonData[keyField])
                objAnd[keyField] = jsonData[keyField];
        };
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
            page: jsonData.page > 0 ? jsonData.page : 1 ,
            limit: jsonData.pageSize
        };
        databaseCall['queryObj']=queryObj;
        databaseCall['options']=options;
        callback(null, databaseCall);
        return;

    };

    this.paginationRequest=function(data,key, callback) {
        d4dModelNew.d4dModelReferanceData.find({rowid:'101'},function(err, referanceData){
            if(err){
                logger.error("In Fetching Reference Data Error");
                return;
            }
        var pageSize,page;
        if(data.pageSize) {
            pageSize = parseInt(data.pageSize);
            if (pageSize > referanceData[0].max_record_limit)
                   pageSize = referanceData[0].max_record_limit;
        }
        else
            pageSize = referanceData[0].record_limit;
        if(data.page)
            page = parseInt(data.page);
        else
            page = referanceData[0].skip_Records;

        var sortBy={};
        if(data.sortBy)
            sortBy[data.sortBy]=data.sortOrder=='desc' ? -1 : 1;
        else
            sortBy[referanceData[0].sortReferanceData[key]] = referanceData[0].sort_order == 'desc' ? -1 :1;
        var request={
            'sortBy':sortBy,
            'page':page,
            'pageSize':pageSize
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
            if (data.instanceType) {
                filterBy['blueprintData.templateType'] = data.instanceType;
                request['filterBy']=filterBy;
            }
        if(data.search){
            var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
            var encrpt=cryptography.encryptText(data.search, cryptoConfig.encryptionEncoding,cryptoConfig.decryptionEncoding);
            var dcypt=cryptography.decryptText(encrpt, cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
            request['search']=dcypt;
        }
        if (typeof callback === 'function') {
            callback(null, request);
        }
    });
    }


}

module.exports = new ApiUtil();
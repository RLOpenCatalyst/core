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
const json2csv = require('json2csv')
const reportsService = require('_pr/services/reportsService')
const async = require('async')

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/reports*', sessionVerificationFunc);


    // @TODO Reconsider providing different end points for trend and aggregate
    /**
     * @api {get} /reports/cost?type=<reportType>&filterBy=organizationId:<organizationId>&period=<period>&timeStamp=<endDate>&splitUpBy=<catalystEntityType>&interval<INTERVAL>
     * 										                    									Get aggregate cost
     * @apiName generateCostReports
     * @apiGroup reports
     * @apiVersion 1.0.0
     *
     * @apiParam {String} type                                              Report type (trend/aggregate)
     * @apiParam {String} filterBy                                          Catalyst entity. Multiple entities can be specified using +
     * @apiParam {String} period                                            Cost aggregation period Ex: hour, day, week, month, year, 5years, 10years
     * @apiParam {Number} interval                                          Frequency interval in seconds Ex: 60,300, 3600
     * @apiParam {Date} timeStamp                                           End Time Stamp. Format YYYY-MM-DDTHH:MM:SS.  For Ex: 2016-08-12T00:00:00
     * @apiParam {String} [splitUpBy="All possible catalyst entity types"]	Split up cost by particular catalyst entity type. For Ex: organization, businessUnit, project, providerType, provider, environment, resourceType, resource
     *
     * @apiExample Sample_Request_1
     * 		/reports/cost?type=aggregate&filterBy=organizationId:5790c31edff2c49223fd6efa&timeStamp=2016-08-12T00:00:00&period=month
     *
     * @apiSuccess {csv}   report                                            Cost report in CSV
     *
     */
    app.get("/reports/cost", getCostReport)
    function getCostReport(req, res, next) {
        //@TODO Authorization to be implemented after fixing provider schema
        async.waterfall([
            function(next) {
                reportsService.getCost(req.query, next)
            }
        ], function(err, costReport) {
            if(err) {
                next(err)
            } else {
                res.header("content-type", "text/csv")
                res.status(200).send(json2csv({data: costReport.data,
                    fields: costReport.fields}))
            }
        })
    }

    /**
     * @api {get} /reports/usage?resourceType=<resourceType>&fromTimeStamp=<startDate>&toTimeStamp=<endDate>&metric=<METRIC>&interval=<INTERVAL>
     * 										                    									Get usage trend.
     * @apiName getUsageReport
     * @apiGroup reports
     * @apiVersion 1.0.0
     *
     * @apiParam {String} resourceType                      Resource type Ex: EC2, RDS, S3
     * @apiParam {Date} fromTimeStamp						Start Time Stamp, inclusive. Format YYYY-MM-DDTHH:MM:SS. For Ex: 2016-07-29T00:00:00
     * @apiParam {Date} toTimeStamp							End Time Stamp, exclusive. Format YYYY-MM-DDTHH:MM:SS.  For Ex: 2016-07-29T00:05:00
     * @apiParam {Number} interval                          Frequency interval in seconds Ex: 60,300, 3600
     * @apiParam {String} [metric="All Metrics"]			Filter particular metrics. For Ex: CPUUtilization,DiskReadBytes
     * @apiParam {String} [statistics="All Statistics"]		Filter particular statistics. For Ex: Average,Minimum
     *
     * @apiExample Sample_Request_1
     * 		/reports/usage?resourceType=EC2&fromTimeStamp=2016-07-29T00:00:00&toTimeStamp=2016-07-29T00:05:00&interval=3600
     *
     * @apiSuccess {csv}   report                                            Usage report in CSV
     *
     */
    app.get("/reports/usage", getUsageReport)
    function getUsageReport(req, res, next) {
        async.waterfall([
            function(next) {
                reportsService.getUsageTrends(req.query, next)
            }
        ], function(err, usageTrendsReport) {
            if(err) {
                next(err)
            } else {
                res.header("content-type", "text/csv")
                res.status(200).send(json2csv({data: usageTrendsReport.data,
                    fields: usageTrendsReport.fields}))
            }
        })
    }
}
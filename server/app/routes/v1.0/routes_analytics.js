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

module.exports.setRoutes = function(app, sessionVerificationFunc) {


    /**
     * @api {get} /analytics/aggregate/cost?filterBy=organizationId:<organizationId>&period=<period>&timeStamp=<endDate>&splitUpBy=<catalystEntityType>
     * 										                    									Get aggregate cost
     * @apiName getAggregateCost
     * @apiGroup analytics
     * @apiVersion 1.0.0
     *
     * @apiParam {String} filterBy                                          Catalyst entity. Multiple entities can be specified using +
     * @apiParam {String} period                                            Cost aggregation period Ex: hour, day, week, month, year, 5years, 10years
     * @apiParam {Date} timeStamp                                           End Time Stamp. Format YYYY-MM-DDTHH:MM:SS.  For Ex: 2016-08-12T00:00:00
     * @apiParam {String} [splitUpBy="All possible catalyst entity types"]	Split up cost by particular catalyst entity type. For Ex: organization, businessUnit, project, providerType, provider, environment, resourceType, resource
     *
     * @apiExample Sample_Request_1
     * 		/analytics/aggregate/cost?filterBy=organizationId:5790c31edff2c49223fd6efa&timeStamp=2016-08-12T00:00:00&period=month
     *
     * @apiSuccess {Object}   aggregatedCost                                            Aggregated cost
     * @apiSuccess {Object}   aggregatedCost.totalCost                                  Usage Metric Name
     * @apiSuccess {String}   aggregatedCost.period                                     Cost aggregation period
     * @apiSuccess {Date}   aggregatedCost.fromTime                                     From time
     * @apiSuccess {Date}   aggregatedCost.toTime                                       To time
     * @apiSuccess {Object[]}   aggregatedCost.splitUpCosts                             Split up cost
     * @apiSuccess {Object}   aggregatedCost.splitUpCosts.CATALYST_ENTITY_TYPE          Cost split up based on catalyst entity
     * @apiSuccess {Object}   aggregatedCost.splitUpCosts.CATALYST_ENTITY_TYPE.id       Catalyst entity ID
     * @apiSuccess {Object}   aggregatedCost.splitUpCosts.CATALYST_ENTITY_TYPE.name     Catalyst entity name
     * @apiSuccess {Object}   aggregatedCost.splitUpCosts.CATALYST_ENTITY_TYPE.cost     Cost for the catalyst entity
     *
     * @apiSuccessExample {json} Sample_Response_1:
     * 	HTTP/1.1 200 OK
     *
     * {
          "totalCost": 300,
          "period": "month",
          "fromTime": "2016-08-01T00:00:00",
          "toTime": "2016-08-12T00:00:00",
          "splitUpCosts": {
            "businessUnit": [
              {
                "id": "<businessUnit_1_id>",
                "name": "Business Unit 1",
                "cost": 100
              },
              {
                "id": "<businessUnit_2_id>",
                "name": "Business Unit 2",
                "cost": 100
              },
              {
                "id": "<businessUnit_3_id>",
                "name": "Business Unit 3",
                "cost": 100
              }
            ],
            "provider": [
              {
                "id": "<provider_1_id>",
                "name": "Provider 1",
                "cost": 100
              },
              {
                "id": "<businessUnit_2_id>",
                "name": "Provider 2",
                "cost": 100
              },
              {
                "id": "<businessUnit_3_id>",
                "name": "Provider 3",
                "cost": 100
              }
            ]
          }
        }
     */
    app.get("/analytics/aggregate/cost", getAggregateCost)
    function getAggregateCost(req, res, next) {

    }

    /**
     * @api {get} /analytics/trend/cost?filterBy=organizationId:<organizationId>&period=<PERIOD>&timeStamp=<endDate>&splitUpBy=<catalystEntityType>&interval=<INTERVAL>
     * 										                    									Get cost trend
     * @apiName getCostTrends
     * @apiGroup analytics
     * @apiVersion 1.0.0
     *
     * @apiParam {String} filterBy                                          Catalyst entity. Multiple entities can be specified using +
     * @apiParam {String} period                                            Cost aggregation period Ex: hour, day, week, month, year, 5years, 10years
     * @apiParam {Date} timeStamp                                           End Time Stamp. Format YYYY-MM-DDTHH:MM:SS.  For Ex: 2016-08-12T00:00:00
     * @apiParam {String} [splitUpBy="All possible catalyst entity types"]	Split up cost by particular catalyst entity type. For Ex: organization, businessUnit, project, providerType, provider, environment, resourceType, resource
     *
     * @apiExample Sample_Request_1
     * 		/analytics/aggregate/cost?filterBy=organizationId:5790c31edff2c49223fd6efa&timeStamp=2016-08-03T00:00:00&period=month&interval=86400
     *
     * @apiSuccess {Object}   aggregatedCost                                            Aggregated cost
     * @apiSuccess {Object}   aggregatedCost.totalCost                                  Usage Metric Name
     * @apiSuccess {String}   aggregatedCost.period                                     Cost aggregation period
     * @apiSuccess {Date}   aggregatedCost.fromTime                                     From time
     * @apiSuccess {Date}   aggregatedCost.toTime                                       To time
     * @apiSuccess {Object[]}   aggregatedCost.splitUpCosts                             Split up cost
     * @apiSuccess {Object}   aggregatedCost.splitUpCosts.CATALYST_ENTITY_TYPE          Cost split up based on catalyst entity
     * @apiSuccess {Object}   aggregatedCost.splitUpCosts.CATALYST_ENTITY_TYPE.id       Catalyst entity ID
     * @apiSuccess {Object}   aggregatedCost.splitUpCosts.CATALYST_ENTITY_TYPE.name     Catalyst entity name
     * @apiSuccess {Object}   aggregatedCost.splitUpCosts.CATALYST_ENTITY_TYPE.cost     Cost for the catalyst entity
     *
     * @apiSuccessExample {json} Sample_Response_1:
     * 	HTTP/1.1 200 OK
     *
     * {
          "totalCost": 100,
          "period": "month",
          "fromTime": "2016-08-01T00:00:00",
          "toTime": "2016-08-12T00:00:00",
          "interval": 86400,
          "dataPoints": [
              {
		        "fromTime": "2016-08-01T00:01:00",
		        "toTime": "2016-08-02T00:00:00",
		        "cost": 50
		       },
              {
                "fromTime": "2016-08-02T00:01:00",
		        "toTime": "2016-08-03T00:00:00",
                "cost": 50
              }
            ]
          }
        }
     */
    app.get("/analytics/trend/cost", getCostTrend)
    function getCostTrend(req, res, next) {

    }

}
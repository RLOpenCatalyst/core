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
     * @api {get} /analytics/cost/aggregate?catalystEntity=organizationId:<organizationId>&period=<period>&toTimeStamp=<endDate>&splitUpBy=<catalystEntityType>
     * 										                    									Get aggregate cost
     * @apiName getAggregateCost
     * @apiGroup analytics
     * @apiVersion 1.0.0
     *
     * @apiParam {String} catalystEntity                                    Catalyst entity. Only single entity should be specified.
     * @apiParam {String} period                                            Cost aggregation period Ex: hour, day, week, month, year, 5years, 10years
     * @apiParam {Date} toTimeStamp                                         End Timestamp. Format YYYY-MM-DDTHH:MM:SS.  For Ex: 2016-08-12T00:00:00
     * @apiParam {String} [splitUpBy="All possible catalyst entity types"]	Split up cost by particular catalyst entity type. For Ex: organization, businessUnit, project, providerType, provider, environment, resourceType, resource
     *
     * @apiExample Sample_Request_1
     * 		/analytics/cost/aggregate?catalystEntity=organizationId:5790c31edff2c49223fd6efa&timeStamp=2016-08-12T00:00:00&period=month
     *
     * @apiSuccess {Object}   aggregatedCost                                                Aggregated cost
     * @apiSuccess {String}   aggregatedCost.period                                         Cost aggregation period
     * @apiSuccess {Date}   aggregatedCost.fromTime                                         From time
     * @apiSuccess {Date}   aggregatedCost.toTime                                           To time
     * @apiSuccess {Object}   aggregatedCost.cost                                           Cost for entity
     * @apiSuccess {Number}   aggregatedCost.cost.totalCost                                 Total cost
     * @apiSuccess {Object}   aggregatedCost.cost.awsCosts                                  AWS cost
     * @apiSuccess {Number}   aggregatedCost.cost.awsCosts.totalCost                        AWS total cost
     * @apiSuccess {Object}   aggregatedCost.cost.awsCosts.serviceCost                      AWS service costs splitup
     * @apiSuccess {Object}   aggregatedCost.serviceCosts                                   Platform specific service cost
     * @apiSuccess {Object[]}   aggregatedCost.splitUpCosts                                 Split up cost
     * @apiSuccess {Object}   aggregatedCost.splitUpCosts.CATALYST_ENTITY_TYPE              Cost split up based on catalyst entity
     * @apiSuccess {Object}   aggregatedCost.splitUpCosts.CATALYST_ENTITY_TYPE.id           Catalyst entity ID
     * @apiSuccess {Object}   aggregatedCost.splitUpCosts.CATALYST_ENTITY_TYPE.name         Catalyst entity name
     * @apiSuccess {Object}   aggregatedCost.splitUpCosts.CATALYST_ENTITY_TYPE.cost         Total cost and provider type wise splitup costs
     *
     * @apiSuccessExample {json} Sample_Response_1:
     * 	HTTP/1.1 200 OK
     *
     * {
          "period": "month",
          "fromTime": "2016-08-01T00:00:00",
          "toTime": "2016-08-12T00:00:00",
          "catalystEntity": {
                "type": "organization",
                "id": "q23ro9uasoidfElasdf"
          },
          "cost": {
            "totalCost": 300,
            "awsCosts": {
                "totalCost": 300,
                "serviceCosts": {
                    "ec2": 150,
                    "rds": 90,
                    "s3": 60
                }
            }
          },
          "splitUpCosts": {
            "businessUnits": [
              {
                "id": "<businessUnit_1_id>",
                "name": "Business Unit 1",
                "cost": {
                    "totalCost": 100,
                    "awsCosts": {
                        "totalCost": 100,
                        "serviceCosts": {
                            "ec2": 50,
                            "rds": 20,
                            "s3": 30
                        }
                    }
                 }
              },
              {
                "id": "<businessUnit_2_id>",
                "name": "Business Unit 2",
                "cost": {
                    "totalCost": 100,
                    "awsCosts": {
                        "totalCost": 100,
                        "serviceCosts": {
                            "ec2": 50,
                            "rds": 20,
                            "s3": 30
                        }
                    }
                 }
              },
              {
                "id": "<businessUnit_3_id>",
                "name": "Business Unit 3",
                "cost": {
                    "totalCost": 100,
                    "awsCosts": {
                        "totalCost": 100,
                        "serviceCosts": {
                            "ec2": 50,
                            "rds": 20,
                            "s3": 30
                        }
                    }
                 }
              }
            ],
            "providers": [
              {
                "id": "<provider_1_id>",
                "name": "Provider 1",
                "cost": {
                    "totalCost": 100,
                    "awsCosts": {
                        "totalCost": 100,
                        "serviceCosts": {
                            "ec2": 50,
                            "rds": 20,
                            "s3": 30
                        }
                    }
                 }
              },
              {
                "id": "<businessUnit_2_id>",
                "name": "Provider 2",
                "cost": {
                    "totalCost": 100,
                    "awsCosts": {
                        "totalCost": 100,
                        "serviceCosts": {
                            "ec2": 50,
                            "rds": 20,
                            "s3": 30
                        }
                    }
                 }
              },
              {
                "id": "<businessUnit_3_id>",
                "name": "Provider 3",
                "cost": {
                    "totalCost": 100,
                    "awsCosts": {
                        "totalCost": 100,
                        "serviceCosts": {
                            "ec2": 50,
                            "rds": 20,
                            "s3": 30
                        }
                    }
                 }
              }
            ]
          }
        }
     */
    app.get("/analytics/cost/aggregate", getAggregateCost)
    function getAggregateCost(req, res, next) {

    }

    /**
     * @api {get} /analytics/cost/trend?catalystEntity=organizationId:<organizationId>&period=<PERIOD>&toTimeStamp=<endDate>&splitUpBy=<catalystEntityType>&interval=<INTERVAL>
     * 										                    									Get cost trend
     * @apiName getCostTrend
     * @apiGroup analytics
     * @apiVersion 1.0.0
     *
     * @apiParam {String} catalystEntity                                    Catalyst entity. Only single entity should be specified.
     * @apiParam {String} period                                            Cost aggregation period Ex: hour, day, week, month, year, 5years, 10years
     * @apiParam {Date} toTimeStamp                                         End Timestamp. Format YYYY-MM-DDTHH:MM:SS.  For Ex: 2016-08-12T00:00:00
     * @apiParam {String} [splitUpBy="All possible catalyst entity types"]	Split up cost by particular catalyst entity type. For Ex: organization, businessUnit, project, providerType, provider, environment, resourceType, resource
     *
     * @apiExample Sample_Request_1
     * 		/analytics/cost/trend?catalystEntity=organizationId:5790c31edff2c49223fd6efa&timeStamp=2016-08-03T00:00:00&period=month&interval=86400
     *
     * @apiSuccess {Object}   costTrend                                                         Cost trend
     * @apiSuccess {String}   aggregatedCost.period                                             Cost aggregation period
     * @apiSuccess {Date}   aggregatedCost.fromTime                                             From time
     * @apiSuccess {Date}   aggregatedCost.toTimeStamp                                          To timestamp
     * @apiSuccess {Object}   aggregatedCost.cost                                               Cost for entity
     * @apiSuccess {Number}   aggregatedCost.cost.totalCost                                     Total cost
     * @apiSuccess {Object}   aggregatedCost.cost.awsCosts                                      AWS cost
     * @apiSuccess {Number}   aggregatedCost.cost.awsCosts.totalCost                            AWS total cost
     * @apiSuccess {Object}   aggregatedCost.cost.awsCosts.serviceCost                          AWS service costs splitup
     * @apiSuccess {Object}   aggregatedCost.serviceCosts                                       Platform specific service cost
     * @apiSuccess {Object[]}   aggregatedCost.costTrends                                       Cost trends
     * @apiSuccess {Object}   aggregatedCost.splitUpCosts.COST_TREND_DATA_POINT                 Cost split up based on catalyst entity
     * @apiSuccess {Object}   aggregatedCost.splitUpCosts.COST_TREND_DATA_POINT.fromTime        From time
     * @apiSuccess {Object}   aggregatedCost.splitUpCosts.COST_TREND_DATA_POINT.toTime          To time
     * @apiSuccess {Object}   aggregatedCost.splitUpCosts.COST_TREND_DATA_POINT.cost            Cost
     *
     * @apiSuccessExample {json} Sample_Response_1:
     * 	HTTP/1.1 200 OK
     *
     * {
          "period": "month",
          "fromTime": "2016-08-01T00:00:00",
          "toTime": "2016-08-12T00:00:00",
          "interval": 86400,
          "cost": {
                "totalCost": 100,
                "awsCosts": {
                    "totalCost": 100,
                    "serviceCosts": {
                        "ec2": 40,
                        "rds": 20,
                        "s3": 40
                    }
                }
          }
          "costTrends": [
              {
		        "fromTime": "2016-08-01T00:01:00",
		        "toTime": "2016-08-02T00:00:00",
		        "cost": {
                    "totalCost": 50,
                    "awsCosts": {
                        "totalCost": 50,
                        "serviceCosts": {
                            "ec2": 20,
                            "rds": 10,
                            "s3": 20
                        }
                    }
                }
		      },
              {
                "fromTime": "2016-08-02T00:01:00",
		        "toTime": "2016-08-03T00:00:00",
		        "cost": {
                    "totalCost": 50,
                    "awsCosts": {
                        "totalCost": 50,
                        "serviceCosts": {
                            "ec2": 20,
                            "rds": 10,
                            "s3": 20
                        }
                    }
                }
              }
            ]
          }
        }
     */
    app.get("/analytics/cost/trend", getCostTrend)
    function getCostTrend(req, res, next) {

    }
}
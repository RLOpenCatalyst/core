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
     * @api {get} /analytics/aggregate/cost 	                    						Get aggregated cost
     * @apiName getAggregatedCost
     * @apiGroup analytics
     * 
     * @apiSuccess {Object[]} aggregateCost                   								AggregateCost
     * @apiSuccess {Object[]} aggregateCost.entities		        						List of AggregateCostEntities
     * @apiSuccess {String}   aggregateCost.entities.name		    						AggregateCostEntity Name
     * @apiSuccess {String}   aggregateCost.entities.costMetrics							AggregateCostEntity CostMetrics
     * @apiSuccess {String}   aggregateCost.entities.costMetrics.cost						AggregateCostEntity Cost
     * @apiSuccess {String}   aggregateCost.entities.costMetrics.fromTime					AggregateCostEntity StartTime
     * @apiSuccess {String}   aggregateCost.entities.costMetrics.toTime						AggregateCostEntity EndTime
     * @apiSuccess {Object[]} aggregateCost.entities.costMetrics.dataContributors			List of CostDataContibutor
     * @apiSuccess {String}   aggregateCost.entities.costMetrics.dataContributors.id		CostDataContibutor Id
     * @apiSuccess {String}   aggregateCost.entities.costMetrics.dataContributors.cost		CostDataContibutor Cost
     * 
     * @apiSuccessExample {json} Success-Response:
     * 	HTTP/1.1 200 OK
	 *	{
	 *	  "entities": [
	 *	    {
	 *	      "name": "project",
	 *	      "costMetrics": {
	 *	        "cost": "100$",
	 *	        "fromTime": "Fri Jul 29 2016 00:00:00 GMT+0530 (UTC)",
	 *	        "toTime": "Fri Jul 29 2016 15:59:59 GMT+0530 (UTC)",
	 *	        "dataContributors": [
	 *	          {
	 *	            "id": "project_1",
	 *	            "cost": "50$"
	 *	          },
	 *	          {
	 *	            "id": "project_2",
	 *	            "cost": "25$"
	 *	          },
	 *	          {
	 *	            "id": "project_3",
	 *	            "cost": "25$"
	 *	          }
	 *	        ]
	 *	      }
	 *	    }
	 *	  ]
	 *	 } 
     * 
     * 
     */
	app.get("/analytics/aggregate/cost", getAggregatedCost);
	
	function getAggregatedCost(req, res, next) {
		
	}
    
}
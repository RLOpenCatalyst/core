
/**
 * @api {get} /resources?page=1&pageSize=10&filterBy=providerId:56e7a199789daf6c3863b263+resourceType:S3+category:unassigned&sortBy=bucketName&sortOrder=asc
 * @apiName /resources
 * @apiGroup AWS S3 Resource List with Pagination
 *
 *
 * @apiParam {String} providerId          Unique Provider ID.
 * @apiParam {String} resourceType        Unique AWS Resource.
 * @apiParam {String} category            Unique AWS Resource Category.
 * @apiParam {String} filterBy            User is able to filter the records for a set of attributes.Ex.filterBy=providerId:56e7a199789daf6c3863b263+resourceType:S3+category:unassigned.
 * @apiParam {Number} [page]              Current Page default is 1.
 * @apiParam {Number} [pageSize]          Records per page default is 10.
 * @apiParam {String} [sortBy]            User can sort the records for any field. Default: results are sorted by state.
 * @apiParam {String} [sortOrder]         The sort order if sort parameter is provided. One of asc or desc. Default: desc
 *
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 * {
 *	"resources": [{
 *		"_id": "575180c58832c91e1d2285e2",
 *		"providerDetails": {
 *			"id": "56f1459ec9f075275f4ea9be",
 *			"type": "AWS"
 *		},
 *		"organizationDetails": {
 *			"id": "54edde9c21b4d7e50f29435f",
 *			"name": "Phoenix"
 *		},
 *		"resourceType": "S3",
 *		"category": "unassigned",
 *		"resourceDetails": {
 *			"bucketName": "RLBilling",
 *			"bucketOwnerName": "devops.support",
 *			"bucketOwnerID": "8efc7ec22f14e0a6f4f72c8fe4e809df730d53acacb958ded3214df9a191722b",
 *			"bucketSize": 87918292366,
 *			"bucketCreatedOn": 14859030000
 *		},
 *	    "createdOn":14859030000,
 *		"tags": [],
 *		"cost": {
 *			"aggregateBucketCost": 0.01,
 *			"currency": "USD",
 *		    "symbol":"$"
 *		},
 *		"usage": {
 *			"BucketSizeBytes": {
 *				"maximum": 87918292366,
 *				"minimum": 87918292366,
 *				"average": 87918292366,
 *				"unit": "Bytes"
 *			},
 *			"NumberOfObjects": {
 *				"maximum": 6639,
 *				"minimum": 6639,
 *				"average": 6639,
 *				"unit": "Count"
 *			}
 *		}
 *	}],
 *     metaData:{
 *     totalRecords:1,
 *     pageSize:10,
 *     page:1,
 *     totalPages:1,
 *     sortBy:"createdOn",
 *     sortOrder:"asc"
 *     }
 *   }
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'AWS Resource'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'AWS Resource'}
 *     };
 * @apiError 404 Not Found.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:404,
 *      message:'Not Found',
 *      fields:{errorMessage:'The requested resource could not be found but may be available in the future',attribute:'AWS Resource'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'AWS Resource'}
 *     };
 */


/**
 * @api {get} /resources?page=1&pageSize=10&filterBy=providerId:56e7a199789daf6c3863b263+resourceType:RDS+category:unassigned&sortBy=instanceStatus&sortOrder=asc
 * @apiName /resources
 * @apiGroup AWS RDS Resource List with Pagination
 *
 *
 * @apiParam {String} providerId          Unique Provider ID.
 * @apiParam {String} resourceType        Unique AWS Resource.
 * @apiParam {String} category            Unique AWS Resource Category.
 * @apiParam {String} filterBy            User is able to filter the records for a set of attributes.Ex.filterBy=providerId:56e7a199789daf6c3863b263+resourceType:RDS+category:unassigned.
 * @apiParam {Number} [page]              Current Page default is 1.
 * @apiParam {Number} [pageSize]          Records per page default is 10.
 * @apiParam {String} [sortBy]            User can sort the records for any field. Default: results are sorted by state.
 * @apiParam {String} [sortOrder]         The sort order if sort parameter is provided. One of asc or desc. Default: desc
 *
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *   {
 *	"resources": [{
 *		"_id": "575180c58832c91e1d2285e2",
 *		"providerDetails": {
 *			"id": "56f1459ec9f075275f4ea9be",
 *			"type": "AWS"
 *		},
 *		"organizationDetails": {
 *			"id": "54edde9c21b4d7e50f29435f",
 *			"name": "Phoenix"
 *		},
 *		"resourceType": "RDS",
 *		"category": "unassigned",
 *		"resourceDetails": {
 *			"dbInstanceIdentifier": "rltest",
 *			"dbInstanceClass": "db.t2.micro",
 *			"dbEngine": "mysql",
 *			"dbMasterUserName": "rltest",
 *			"dbInstanceStatus": "available",
 *			"dbName": "rltest",
 *			"dbAllocatedStorage": 5,
 *			"dbInstanceCreateTime": 14859030000,
 *			"region": "us-west-1b",
 *			"multiAZ": false,
 *			"engineVersion": "5.6.27",
 *			"licenseModel": "general-public-license",
 *			"publiclyAccessible": true,
 *			"storageType": "gp2",
 *			"storageEncrypted": false,
 *			"dbiResourceId": "db-J5PUO3CAZSLKWZFBZRHAMXSQOQ",
 *			"caCertificateIdentifier": "rds-ca-2015"
 *		},
 *	    "createdOn":14859030000,
 *		"tags": [],
 *		"cost": {
 *			"aggregateBucketCost": 0.21,
 *			"currency": "USD",
 *		    "symbol":"$"
 *		},
 *		"usage": {
 *			"CPUUtilization": {
 *				"maximum": 0,
 *				"minimum": 0,
 *				"average": 0,
 *				"unit": "Percent"
 *			},
 *			"FreeStorageSpace": {
 *				"maximum": 0,
 *				"minimum": 0,
 *				"average": 0,
 *				"unit": "Bytes"
 *			}
 *		}
 *	}],
 *    	"metaData": {
 *    		"totalRecords": 1,
 *    		"pageSize": 10,
 *    		"page": 1,
 *    		"totalPages": 1,
 *    		"sortBy": "createdOn",
 *    		"sortOrder": "asc"
 *    	}
 *    }
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'AWS Resource'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'AWS Resource'}
 *     };
 * @apiError 404 Not Found.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:404,
 *      message:'Not Found',
 *      fields:{errorMessage:'The requested resource could not be found but may be available in the future',attribute:'AWS Resource'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'AWS Resource'}
 *     };
 */


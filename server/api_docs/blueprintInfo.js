
/**
 * @api {get} /providers/:providerId/unmanagedInstances?page=1&pageSize=5&search=i-656ae2a3&filterBy=region:us-west-2+state:running,stopped&sortBy=state&sortOrder=asc
 * @apiName /providers/:providerId/unmanagedInstances
 * @apiGroup UnmanagedInstance List with Pagination,Sorting,Searching and Filtering
 *
 *
 * @apiParam {String} providerId          Unique providerID.
 * @apiParam {Number} [page] Current Page default is 1.
 * @apiParam {Number} [pageSize]  Records per page default is 10.
 * @apiParam {String} [search]  User is able to search for specific attribute. User can enter Instance ID or IP Address for specific search.
 * @apiParam {String} [sortBy]   User can sort the records for any field. Default: results are sorted by state.
 * @apiParam {String} [sortOrder]  The sort order if sort parameter is provided. One of asc or desc. Default: desc
 * @apiParam {String} [filterBy]  User is able to filter the records for a set of attributes.Ex.filterBy=region:us-west-2+state:running,stopped.
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *     unmanagedInstances: [{"_id":"56e7a198789daf6c3863b25c","orgId":"46d1da9a-d927-41dc-8e9e-7e926d927537","providerId":"56e2a90dccdaec5111a74e2f","providerType":"aws","providerData":{"region":"us-west-1"},"platformId":"i-1d97d593","ip":"52.77.240.203","os":"linux","state":"running","__v":0},
 *     {"_id":"56e7a199789daf6c3863b263","orgId":"46d1da9a-d927-41dc-8e9e-7e926d927537","providerId":"56e2a90dccdaec5111a74e2f","providerType":"aws","providerData":{"region":"us-west-1"},"platformId":"i-9d0f3118","ip":"54.88.125.156","os":"linux","state":"running","__v":0,"tags":{"Name":"SensuServer"}},
 *     {"_id":"56e7a19a789daf6c3863b26d","orgId":"46d1da9a-d927-41dc-8e9e-7e926d927537","providerId":"56e2a90dccdaec5111a74e2f","providerType":"aws","providerData":{"region":"us-west-1"},"platformId":"i-e75fb552","ip":"10.0.0.106","os":"linux","state":"running","__v":0,"tags":{"Name":"shreeram"}},
 *     {"_id":"56e7a19a789daf6c3863b26e","orgId":"46d1da9a-d927-41dc-8e9e-7e926d927537","providerId":"56e2a90dccdaec5111a74e2f","providerType":"aws","providerData":{"region":"us-west-1"},"platformId":"i-7bc992b9","ip":"54.67.35.103","os":"linux","state":"running","__v":0,"tags":{"Name":"NginX_Instance","Owner":"Hamid","Environment":"Production","Role":"WebGateway","Bill":"Catalyst"}},
 *     {"_id":"56e7a19a789daf6c3863b273","orgId":"46d1da9a-d927-41dc-8e9e-7e926d927537","providerId":"56e2a90dccdaec5111a74e2f","providerType":"aws","providerData":{"region":"us-west-1"},"platformId":"i-d3411313","ip":"10.0.1.92","os":"linux","state":"running","__v":0,"tags":{"Name":"MonitoringServer","Environment":"Production","Owner":"Hamid","Bill":"Catalyst"}
 *     }],
 *     metaData:{totalRecords:48,
 *     pageSize:5,
 *     page:1,
 *     totalPages:10,
 *     sortBy:state,
 *     sortOrder:asc
 *     filterBy:{region:'us-west-1',state:['running','stopped']}}
 *     }
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'paginationRequest'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'paginationRequest'}
 *     };
 * @apiError 404 Not Found.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:404,
 *      message:'Not Found',
 *      fields:{errorMessage:'The requested resource could not be found but may be available in the future',attribute:'providerId'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'providerId'}
 *     };
 */


/**
 * @api {get} /blueprintInfo/:blueprintId/
 * @apiName /blueprintInfo/:blueprintId/
 * @apiGroup Blueprint Information
 *
 *
 * @apiParam {String} blueprintId          Unique blueprintId.
 *
 * @apiSuccess [JSONObject]   Blueprint Info
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *     blueprintInfo:{
 *     "_id": ObjectId("56fd004eeecf8ac55269e4a6"),
 *     "orgname": "Phoenix",
 *     "productgroupname": "PhoenixBG",
 *     "projectname": "PhoenixApp",
 *     "name": "TestBlueprint",
 *     "templateId": "TestTemplate",
 *     "templateType":"chef",
 *     "blueprintType": "instance_launch",
 *     "users": ["superadmin"],
 *     "providerType":"AWS",
 *     "ProviderName":"AWSProvider",
 *     "keyPairName": "cat-cal",
 *     "imageName": "Test Image",
 *     "region" : "us-west-1",
 *     "blueprintConfig": {"cloudProviderType": "aws","
 *                cloudProviderData":
 *                                 {
 *                                 "keyPairId" : "56f1459ec9f075275f4ea9bf",
 *			                       "instanceType" : "t2.small",
 *			                       "instanceAmiid" : "ami-06116566",
 *			                       "instanceUsername" : "root",
 *			                       "vpcId" : "vpc-52110130",
 *			                       "subnetId" : "subnet-e49e8286",
 *			                       "imageId" : "56fa21c02a3efd265302040e",
 *			                       "instanceOS" : "linux",
 *			                       "instanceCount" : "1",
 *                                 "securityGroupIds": ["sg-99a3bcfb"]
 *                                 },
 *                "infraMangerType": "chef",
 *                                   "infraManagerData":
 *                                         {
 *                                           "latestVersion": "0.1",
 *                                           "versionsList": [{"ver": "0.1","runlist": ["recipe[lamp-stack]", "recipe[tomcat]"]}]
 *                                         }
 *                     }
 *                  }
 *           }
 *     }
 *
 * * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *     blueprintInfo:{
 *     "_id": ObjectId("56fd004eeecf8ac55269e4a6"),
 *     "orgname": "Phoenix",
 *     "productgroupname": "PhoenixBG",
 *     "projectname": "PhoenixApp",
 *     "name" : "SoftwareAzure",
 *	   "templateId" : "TestTemplate",
 *     "templateType" : "chef",
 *     "blueprintType": "azure_launch",
 *     "users": ["superadmin"],
 *     "providerType":"AZURE",
 *     "ProviderName":"AzureProvider",
 *     "pemFileName": "rlCatalyst.pem",
 *     "keyFileName" : "rlCatalyst.key",
 *     "keyPairName": "cat-cal",
 *     "imageName": "Azure Image",
 *     "region" : "us-west-1",
 *     "blueprintConfig": {
 *     	  "cloudProviderData" : {
 *			"cloudProviderType" : "azure",
 *			"cloudProviderId" : "56fcea6dd24b7bd84c9d337a",
 *			"securityGroupIds" : "8080",
 *			"instanceType" : "Basic_A3",
 *			"instanceAmiid" : "d4d-ubuntu14",
 * 			"vpcId" : "AzureToRLDC",
 *			"region" : "East US",
 *			"subnetId" : "GatewaySubnet",
 *			"imageId" : "56fa4bb6b22e7cf36529f099",
 *			"instanceOS" : "linux",
 *			"instanceCount" : "1",
 *			"infraMangerType" : "chef",
 *			"infraManagerId" : "ef074bc9-d61c-4d3a-8038-17878422f965",
 *			"infraManagerData" : {
 *				"latestVersion" : "0.1",
 * 				"_id" : ObjectId("56fd004eeecf8ac55269e4a3"),
 *				"versionsList" : [
 *					{
 *						"ver" : "0.1",
 *						"_id" : ObjectId("56fd004eeecf8ac55269e4a4"),
 * 						"runlist" : [
 *							"recipe[lamp-stack]",
 *							"recipe[tomcat]"
 *						]
 *					}
 *				]
 *			},
 *			"_id" : ObjectId("56fd004eeecf8ac55269e4a5")
 *		},
 *
 *                  }
 *       }
 *     }
 *
 *
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *     blueprintInfo:{
 *     "_id": ObjectId("56fd004eeecf8ac55269e4a6"),
 *     "orgname": "Phoenix",
 *     "productgroupname": "PhoenixBG",
 *     "projectname": "PhoenixApp",
 *     "name" : "OSBluePrint",
 *	   "templateId" : "Test Image",
 *	   "templateType" : "ami",
 *     "blueprintType": "instance_launch",
 *     "users": ["superadmin"],
 *     "providerType":"AWS",
 *     "ProviderName":"AWSProvider",
 *     "keyPairName": "cat-cal",
 *     "imageName": "Test Image",
 *     "region":"US East",
 *     "blueprintConfig": {"cloudProviderType": "aws",
 *                         "cloudProviderData":
 *                                 {
 *                                 "keyPairId" : "56f1459ec9f075275f4ea9bf",
 *			                       "instanceType" : "t2.small",
 *			                       "instanceAmiid" : "ami-06116566",
 *			                       "instanceUsername" : "root",
 *			                       "vpcId" : "vpc-52110130",
 *			                       "subnetId" : "subnet-e49e8286",
 *			                       "imageId" : "56fa21c02a3efd265302040e",
 *			                       "instanceOS" : "linux",
 *			                       "instanceCount" : "1",
 *                                 "securityGroupIds": ["sg-99a3bcfb"]
 *                                 },
 *                        "infraMangerType": "chef",
 *                                   "infraManagerData":
 *                                         {
 *                                           "latestVersion": "0.1",
 *                                           "versionsList": [{"ver": "0.1","runlist": ["recipe[lamp-stack]", "recipe[tomcat]"]}]
 *                                         }
 *                     }
 *                  }
 *     }
 *
 *
 * * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *     blueprintInfo:{
 *     "_id": ObjectId("56fd004eeecf8ac55269e4a6"),
 *     "orgname": "Phoenix",
 *     "productgroupname": "PhoenixBG",
 *     "projectname": "PhoenixApp",
 *     "name" : "CloudBluePrint",
 *	   "templateId" : "CloudTemplate",
 *     "templateType" : "cft",
 *     "blueprintType": "aws_cf",
 *     "users": ["superadmin"],
 *     "providerType":"AWS",
 *     "ProviderName":"AWSProvider",
 *     "blueprintConfig": {
 *       	"cloudProviderId" : "56f1459ec9f075275f4ea9be",
 *		    "infraMangerType" : "chef",
 *		    "infraManagerId" : "ef074bc9-d61c-4d3a-8038-17878422f965",
 *		    "templateFile" : "b97cf8e9-7680-438e-8156-68e5a06dca29__template__JavaStack.template",
 *		    "region" : "us-west-1",
 *		    "_id" : ObjectId("56fa4992b22e7cf36529f08e"),
 *		    "instances" : [
 *			{
 *				"logicalId" : "JavaVM1",
 *				"username" : "ubuntu",
 *				"runlist" : [ ]
 *			},
 *			{
 *				"logicalId" : "JavaVM2",
 *				"username" : "",
 *				"runlist" : [ ]
 *			}
 *		    ],
 *		    "stackParameters" : [
 *			{
 * 				"ParameterKey" : "JavaStack",
 *  			"ParameterValue" : "java-test"
 *			},
 *			{
 *				"ParameterKey" : "KeyName",
 *				"ParameterValue" : "cat_instances"
 *			},
 *			{
 *				"ParameterKey" : "Subnet",
 *				"ParameterValue" : "subnet-3b1c1e4f"
 *			},
 *			{
 *				"ParameterKey" : "SecurityGroup",
 *				"ParameterValue" : "sg-e202e086"
 *			},
 *			{
 *				"ParameterKey" : "AMImageID",
 *				"ParameterValue" : "ami-5189a661"
 *			},
 *			{
 *				"ParameterKey" : "InstanceType",
 *				"ParameterValue" : "t2.micro"
 *			}
 *		]
 *     }
 *   }
 *
 * * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *     blueprintInfo:{
 *     "_id": ObjectId("56fd004eeecf8ac55269e4a6"),
 *     "orgname": "Phoenix",
 *     "productgroupname": "PhoenixBG",
 *     "projectname": "PhoenixApp",
 *     "name" : "DockerBluePrint",
 *	   "templateId" : "DockerTemplate",
 *	   "templateType" : "docker",
 *     "blueprintType": "docker",
 *     "users": ["superadmin"],
 *     "blueprintConfig": {
 *       	"dockerContainerPathsTitle" : "",
 *		    "dockerContainerPaths" : "ubuntu",
 *		    "dockerLaunchParameters" : "",
 *		    "dockerRepoName" : "",
 *		    "dockerImageName" : "",
 *		    "_id" : ObjectId("56fa49ccb22e7cf36529f090"),
 *		    "dockerCompose" : [
 *			{
 *				"dockercontainerpathstitle" : "DockerTemplate",
 *				"dockercontainerpaths" : "ubuntu",
 *				"dockerrepotags" : "latest",
 *				"dockerlaunchparameters" : " --name DockerTemplate",
 *				"dockerreponame" : "",
 *				"_id" : ObjectId("56fa49ccb22e7cf36529f091")
 *			}
 *		  ]
 *     }
 *   }
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'blueprintId'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'blueprintId'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'blueprintId'}
 *     };
 */


/**
 * @api {get} /instances/dockercontainerdetails/
 * @apiName /instances/dockercontainerdetails/
 * @apiGroup Container List for a Particular Instance
 *
 *
 * @apiParam {String} instanceid          Unique instanceid.1459231494210,
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *     containerData:{
 *     "_id": "56fa223d2a3efd2653020413","state":"running","created":1459231494210,"names":["ubuntu","windows"],"instanceIP":"128.12.134.54","containerID":24,"image":"Test Image","info":"container info"
 *     }
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'instanceid'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'instanceid'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'instanceid'}
 *     };
 */
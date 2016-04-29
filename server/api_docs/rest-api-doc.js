/**
 * @api {get} /providers/:providerId/unmanagedInstances?page=1&pageSize=5&search=i-656ae2a3&filterBy=region:us-west-2+state:running,stopped&sortBy=state&sortOrder=asc
 * @apiName /providers/:providerId/unmanagedInstances
 * @apiGroup UnmanagedInstance List with Pagination,Sorting,Searching and Filtering
 *
 *
 * @apiParam {String} providerId          Unique Provider ID.
 * @apiParam {Number} [page] Current Page default is 1.
 * @apiParam {Number} [pageSize]  Records per page default is 10.
 * @apiParam {String} [search]  User is able to search for specific attribute. User can enter Instance ID or IP Address for specific search.
 * @apiParam {String} [sortBy]   User can sort the records for any field. Default: results are sorted by state.
 * @apiParam {String} [sortOrder]  The sort order if sort parameter is provided. One of asc or desc. Default: desc
 * @apiParam {String} [filterBy]  User is able to filter the records for a set of attributes.Ex.filterBy=region:us-west-2+state:running,stopped.
 *
 * @apiParamExample {url} Request-Example:
 * http://localhost:3001/providers/56f1459ec9f075275f4ea9be/unmanagedInstances?page=1&pageSize=5&search=i-656ae2a3&filterBy=region:us-west-2+state:running,stopped&sortBy=state&sortOrder=asc
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
 * @api {get} /blueprints/:blueprintId/blueprintInfo
 * @apiName /blueprints/:blueprintId/blueprintInfo
 * @apiGroup Blueprint Information
 *
 *
 * @apiParam {String} blueprintId          Unique Blueprint Id.

 * @apiParamExample {url} Request-Example:
 * http://localhost:3001/blueprints/56fa223d2a3efd2653020413/blueprintInfo
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
 *     "blueprintConfig": {
 *                "cloudProviderType": "aws","
 *                "cloudProviderData":
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
 *                "infraManagerData":
 *                                         {
 *                                           "latestVersion": "0.1",
 *                                           "versionsList": [{"ver": "0.1","runlist": ["recipe[lamp-stack]", "recipe[tomcat]"]}]
 *                                         }
 *                     }
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
 *				"versionsList" : [{
 *						"ver" : "0.1",
 *						"_id" : ObjectId("56fd004eeecf8ac55269e4a4"),
 * 						"runlist" : ["recipe[lamp-stack]","recipe[tomcat]"]
 *					}]
 *			     },
 *			"_id" : ObjectId("56fd004eeecf8ac55269e4a5")
 *		    }
 *
 *       }
 *    }
 *  }
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
 *                        "infraManagerData":
 *                                         {
 *                                           "latestVersion": "0.1",
 *                                           "versionsList": [{"ver": "0.1","runlist": ["recipe[lamp-stack]", "recipe[tomcat]"]}]
 *                                         }
 *                       }
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
 *		    "instances" : [{
 *				"logicalId" : "JavaVM1",
 *				"username" : "ubuntu",
 *				"runlist" : [ ]
 *			},
 *			{
 *				"logicalId" : "JavaVM2",
 *				"username" : "",
 *				"runlist" : [ ]
 *			}],
 *		    "stackParameters" : [{
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
 *			}]
 *       }
 *    }
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
 *		    "dockerCompose" : [{
 *				"dockercontainerpathstitle" : "DockerTemplate",
 *				"dockercontainerpaths" : "ubuntu",
 *				"dockerrepotags" : "latest",
 *				"dockerlaunchparameters" : " --name DockerTemplate",
 *				"dockerreponame" : "",
 *				"_id" : ObjectId("56fa49ccb22e7cf36529f091")
 *			}]
 *        }
 *      }
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
 * @api {get}/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/containerList
 * @apiName /organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/containerList
 * @apiGroup Container List for Environment
 *
 *
 * @apiParam {String} orgId          Unique Organization Id
 * @apiParam {String} bgId           Unique Business Group Id
 * @apiParam {String} projectId      Unique Project Id
 * @apiParam {String} envId          Unique Environment Id
 * @apiParam {Number} [page]         Current Page default is 1.
 * @apiParam {Number} [pageSize]     Records per page default is 10.
 * @apiParam {String} [search]       User is able to search for specific attribute. User can enter Instance ID or IP Address for specific search.
 * @apiParam {String} [sortBy]       User can sort the records for any field. Default: results are sorted by state.
 * @apiParam {String} [sortOrder]    The sort order if sort parameter is provided. One of asc or desc. Default: desc
 * @apiParam {String} [filterBy]     User is able to filter the records for a set of attributes.Ex.filterBy=region:us-west-2+state:running,stopped.
 *
 * @apiParamExample {url} Request-Example:
 *  http://localhost:3001/organizations/46d1da9a-d927-41dc-8e9e-7e926d927537/businessgroups/7e3500f1-58f9-43e2-b9eb-347b2e4d129d/projects/b38ccedc-da2c-4e2c-a278-c66333564719/environments/df87280c-ef3d-4e45-ac23-fcb77c845409/containerList?page=1&pageSize=10
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *     containerDetail:[{
 *            "_id": "56fa223d2a3efd2653020413","state":"running","created":1459231494210,"names":["ubuntu","windows"],"instanceIP":"128.12.134.54","containerID":24,"image":"Test Image","info":"container info"},
 *            {"_id": "56fa223d2a3efd2653020413","state":"running","created":1459231494210,"names":["ubuntu","windows"],"instanceIP":"128.12.134.54","containerID":24,"image":"Test Image","info":"container info"},
 *            {"_id": "56fa223d2a3efd2653020413","state":"running","created":1459231494210,"names":["ubuntu","windows"],"instanceIP":"128.12.134.54","containerID":24,"image":"Test Image","info":"container info"}],
 *     metaData:{
 *        totalRecords:3,
 *        pageSize:5,
 *        page:1,
 *        totalPages:1,
 *        sortBy:state,
 *        sortOrder:desc
 *        filterBy:{state:['running']}
 *     }
 *     }
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'Environment Id'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Environment Id'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Environment Id'}
 *     };
 */

/**
 * @api {get}/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/instanceList
 * @apiName /organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/instanceList
 * @apiGroup Instance List for Environment
 *
 *
 * @apiParam {String} orgId          Unique Organization Id
 * @apiParam {String} bgId           Unique Business Group Id
 * @apiParam {String} projectId      Unique Project Id
 * @apiParam {String} envId          Unique Environment Id
 * @apiParam {String} instanceType   Instance Type
 * @apiParam {Number} [page]         Current Page default is 1.
 * @apiParam {Number} [pageSize]     Records per page default is 10.
 * @apiParam {String} [search]       User is able to search for specific attribute. User can enter Instance ID or IP Address for specific search.
 * @apiParam {String} [sortBy]       User can sort the records for any field. Default: results are sorted by instanceState.
 * @apiParam {String} [sortOrder]    The sort order if sort parameter is provided. One of asc or desc. Default: desc
 * @apiParam {String} [filterBy]     User is able to filter the records for a set of attributes.Ex.filterBy=region:us-west-2+state:running,stopped.
 *
 *
 * @apiParamExample {url} Request-Example:
 * http://localhost:3001/organizations/46d1da9a-d927-41dc-8e9e-7e926d927537/businessgroups/7e3500f1-58f9-43e2-b9eb-347b2e4d129d/projects/b38ccedc-da2c-4e2c-a278-c66333564719/environments/df87280c-ef3d-4e45-ac23-fcb77c845409/instanceList?page=1&pageSize=10
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *     "instances":[{"_id":"56fa1a6d2a3efd26530203fb","name":"192.168.152.208","orgId":"46d1da9a-d927-41dc-8e9e-7e926d927537","bgId":"7e3500f1-58f9-43e2-b9eb-347b2e4d129d","projectId":"b38ccedc-da2c-4e2c-a278-c66333564719","envId":"df87280c-ef3d-4e45-ac23-fcb77c845409","instanceIP":"192.168.152.208","instanceState":"running","bootStrapStatus":"success","__v":0,"taskIds":[],"chefClientExecutionIds":[],"actionLogs":[{"_id":"56fa1a6d2a3efd26530203fd","actionData":{"runlist":[]},"timeStarted":1459231341803,"user":"superadmin","success":true,"completed":true,"name":"Bootstrap","type":1,"timeEnded":1459231495251}],"serviceIds":[],"blueprintData":{"blueprintName":"192.168.152.208","templateId":"chef_import","iconPath":"../private/img/templateicons/chef_import.png","templateComponents":[]},"credentials":{"username":"rle0333","password":"OtKDQ4yY8+rl6z90Ll3KUA=="},"software":[],"chef":{"serverId":"ef074bc9-d61c-4d3a-8038-17878422f965","chefNodeName":"192.168.152.208"},"hardware":{"platform":"ubuntu","platformVersion":"14.04","architecture":"x86_64","os":"linux","memory":{"total":"8094692kB","free":"2871460kB"}},"users":["superadmin"],"appUrls":[{"name":"catalyst","url":"http://localhost:3001/","_id":"56fa1a6d2a3efd26530203fc"}],"attributes":[],"runlist":[]}],
 *     "metaData":{"totalRecords":1,"pageSize":10,"page":1,"totalPages":1,"sortBy":"instanceState","sortOrder":"asc"}
 *     }
 *     
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'Environment Id'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Environment Id'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Environment Id'}
 *     };
 */

/**
 * @api {get}/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/taskList
 * @apiName /organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/taskList
 * @apiGroup Orchestration List for Environment
 *
 *
 * @apiParam {String} orgId          Unique Organization Id
 * @apiParam {String} bgId           Unique Business Group Id
 * @apiParam {String} projectId      Unique Project Id
 * @apiParam {String} envId          Unique Environment Id
 * @apiParam {Number} [page]         Current Page default is 1.
 * @apiParam {Number} [pageSize]     Records per page default is 10.
 * @apiParam {String} [search]       User is able to search for specific attribute. User can enter Instance ID or IP Address for specific search.
 * @apiParam {String} [sortBy]       User can sort the records for any field. Default: results are sorted by state.
 * @apiParam {String} [sortOrder]    The sort order if sort parameter is provided. One of asc or desc. Default: desc
 * @apiParam {String} [filterBy]     User is able to filter the records for a set of attributes.Ex.filterBy=region:us-west-2+state:running,stopped.
 *
 *
 * @apiParamExample {url} Request-Example:
 * http://localhost:3001/organizations/46d1da9a-d927-41dc-8e9e-7e926d927537/businessgroups/7e3500f1-58f9-43e2-b9eb-347b2e4d129d/projects/b38ccedc-da2c-4e2c-a278-c66333564719/environments/df87280c-ef3d-4e45-ac23-fcb77c845409/taskList?page=1&pageSize=10
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *  {"tasks":[{
 *	"_id": "56fe1fb340e5982c6467fbba",
 *	"taskType": "chef",
 *	"name": "Test Job Durgesh",
 *	"description": "Durgesh",
 *	"orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
 *	"bgId": "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
 *	"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *	"envId": "df87280c-ef3d-4e45-ac23-fcb77c845409",
 *	"taskConfig": {
 *		"_id": "56fe1fb340e5982c6467fbb9",
 *		"nodeIds": ["56fa1a6d2a3efd26530203fb"],
 *		"runlist": ["recipe[lamp-stack]", "recipe[tomcat]"],
 *		"taskType": "chef"
 *	},
 *	"__v": 0,
 *	"blueprintIds": [],
 *	"jobResultURLPattern": []
 * }],
 *     "metaData":{"totalRecords":1,"pageSize":10,"page":1,"totalPages":1,"sortBy":"name",sortOrder":"asc"}
 * }
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'Environment Id'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Environment Id'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Environment Id'}
 *     };
 */

/**
 * @api {get}/organizations/:orgId/businessgroups/:bgId/projects/:projectId/applicationList
 * @apiName /organizations/:orgId/businessgroups/:bgId/projects/:projectId/applicationList
 * @apiGroup Application List for Project
 *
 *
 * @apiParam {String} orgId          Unique Organization Id
 * @apiParam {String} bgId           Unique Business Group Id
 * @apiParam {String} projectId      Unique Project Id
 * @apiParam {Number} [page]         Current Page default is 1.
 * @apiParam {Number} [pageSize]     Records per page default is 10.
 * @apiParam {String} [search]       User is able to search for specific attribute. User can enter Instance ID or IP Address for specific search.
 * @apiParam {String} [sortBy]       User can sort the records for any field. Default: results are sorted by state.
 * @apiParam {String} [sortOrder]    The sort order if sort parameter is provided. One of asc or desc. Default: desc
 * @apiParam {String} [filterBy]     User is able to filter the records for a set of attributes.Ex.filterBy=region:us-west-2+state:running,stopped.
 *
 *
 * @apiParamExample {url} Request-Example:
 *	http://localhost:3001/organizations/46d1da9a-d927-41dc-8e9e-7e926d927537/businessgroups/7e3500f1-58f9-43e2-b9eb-347b2e4d129d/projects/b38ccedc-da2c-4e2c-a278-c66333564719/applicationList?page=1&pageSize=10
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *  {"applications":[{
 *	"_id": "56fe1fb340e5982c6467fbba",
 *	"orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
 *	"bgId": "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
 *	"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *	"envId": "df87280c-ef3d-4e45-ac23-fcb77c845409",
 *	"name": "ApplicationTest",
 *	"iconpath": "Dev",
 *	"git": {
 *		"repoUrl": "Durgesh1988/git",
 *		"repoUsername": "Durgesh1988",
 *		"repoPassword": "12345678"
 *	},
 *	"users ": ["superadmin "],
 *	"buildId ": "fafafaf21415151351 "
 * }],
 *     "metaData":{"totalRecords":1,"pageSize":10,"page":1,"totalPages":1,"sortBy":"name",sortOrder":"asc"}
 * }
 *     
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'Project Id'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Project Id'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Project Id'}
 *     };
 */

/**
 * @api {get}/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/cftList
 * @apiName /organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/cftList
 * @apiGroup CFT List for Environment
 *
 *
 * @apiParam {String} orgId          Unique Organization Id
 * @apiParam {String} bgId           Unique Business Group Id
 * @apiParam {String} projectId      Unique Project Id
 * @apiParam {String} envId          Unique Environment Id
 * @apiParam {Number} [page]         Current Page default is 1.
 * @apiParam {Number} [pageSize]     Records per page default is 10.
 * @apiParam {String} [search]       User is able to search for specific attribute. User can enter Instance ID or IP Address for specific search.
 * @apiParam {String} [sortBy]       User can sort the records for any field. Default: results are sorted by state.
 * @apiParam {String} [sortOrder]    The sort order if sort parameter is provided. One of asc or desc. Default: desc
 * @apiParam {String} [filterBy]     User is able to filter the records for a set of attributes.Ex.filterBy=region:us-west-2+state:running,stopped.
 *
 * @apiParamExample {url} Request-Example:
 * http://localhost:3001/organizations/46d1da9a-d927-41dc-8e9e-7e926d927537/businessgroups/7e3500f1-58f9-43e2-b9eb-347b2e4d129d/projects/b38ccedc-da2c-4e2c-a278-c66333564719/environments/df87280c-ef3d-4e45-ac23-fcb77c845409/cftList?page=1&pageSize=10
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *  {"cftList":[{
 *	"_id": "56fe1fb340e5982c6467fbba",
 *	"orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
 *	"bgId": "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
 *	"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *	"envId": "df87280c-ef3d-4e45-ac23-fcb77c845409",
 *	"stackParameters": [{
 *		"_id": "56fe1fb340e5982c6467fbba",
 *		"ParameterKey": "JavaStack",
 *		"ParameterValue": "java-test"
 *	}],
 *	"templateFile": "rlCatalyst",
 *	"infraMangerType": "chef",
 *	"infraManagerId": "ef074bc9-d61c-4d3a-8038-17878422f965",
 * 	"infraManagerData": {
 *		"latestVersion": "0.1",
 *		"_id": "56fa4959b22e7cf36529f08a",
 *		"versionsList": [{
 *			"ver": "0.1",
 *			"_id": "56fa4959b22e7cf36529f08b",
 *			"runlist": []
 *		}]],
 *     "metaData":{"totalRecords":1,"pageSize":10,"page":1,"totalPages":1,"sortBy":"status",sortOrder":"asc"}
 *     }
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'Environment Id'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Environment Id'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Environment Id'}
 *     };
 */

/**
 * @api {get}/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/azureArmList
 * @apiName /organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/azureArmList
 * @apiGroup Azure ARM List for Environment
 *
 *
 * @apiParam {String} orgId          Unique Organization Id
 * @apiParam {String} bgId           Unique Business Group Id
 * @apiParam {String} projectId      Unique Project Id
 * @apiParam {String} envId          Unique Environment Id
 * @apiParam {Number} [page]         Current Page default is 1.
 * @apiParam {Number} [pageSize]     Records per page default is 10.
 * @apiParam {String} [search]       User is able to search for specific attribute. User can enter Instance ID or IP Address for specific search.
 * @apiParam {String} [sortBy]       User can sort the records for any field. Default: results are sorted by state.
 * @apiParam {String} [sortOrder]    The sort order if sort parameter is provided. One of asc or desc. Default: desc
 * @apiParam {String} [filterBy]     User is able to filter the records for a set of attributes.Ex.filterBy=region:us-west-2+state:running,stopped.
 *
 *
 * @apiParamExample {url} Request-Example:
 * http://localhost:3001/organizations/46d1da9a-d927-41dc-8e9e-7e926d927537/businessgroups/7e3500f1-58f9-43e2-b9eb-347b2e4d129d/projects/b38ccedc-da2c-4e2c-a278-c66333564719/environments/df87280c-ef3d-4e45-ac23-fcb77c845409/azureArmList?page=1&pageSize=10
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *  {"azureArms":[{
 *	"_id": "56fe1fb340e5982c6467fbba",
 *	"orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
 *	"bgId": "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
 *	"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *	"envId": "df87280c-ef3d-4e45-ac23-fcb77c845409",
 *	"parameters": [{
 *		"_id": "56fe1fb340e5982c6467fbba",
 *		"ParameterKey": "JavaStack",
 *		"ParameterValue": "java-test"
 *	}],
 *	"templateFile": "rlCatalyst",
 *	"infraMangerType": "chef",
 *	"infraManagerId": "ef074bc9-d61c-4d3a-8038-17878422f965",
 *	"infraManagerData": {
 *		"latestVersion": "0.1",
 *		"_id": "56fa4959b22e7cf36529f08a",
 *		"versionsList": [{
 *			"ver": "0.1",
 *			"_id": "56fa4959b22e7cf36529f08b",
 *			"runlist": []
 *		}]
 *	},
 *	"cloudProviderId": "56f1459ec9f075275f4ea9be",
 *	"deploymentName": "DurgeshARM",
 *	"deploymentId": "56f1459ec9f075275f4ea9be",
 *	"status": "running",
 *	"users ": ["superadmin "],
 *	"resourceGroup ": "Dev "
 *  }],
 *     "metaData":{"totalRecords":1,"pageSize":10,"page":1,"totalPages":1,"sortBy":"status",sortOrder":"asc"}
 *     }
 *     
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'Environment Id'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Environment Id'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Environment Id'}
 *     };
 */


/**
 * @api {get}/app/deploy/project/:projectId/appDeployList
 * @apiName /app/deploy/project/:projectId/appDeployList
 * @apiGroup Pipeline View with Pagination
 *
 *
 * @apiParam {String} projectId      Unique Project Id
 *
 * @apiParamExample {url} Request-Example:
 * http://localhost:3001/app/deploy/project/b38ccedc-da2c-4e2c-a278-c66333564719/appDeployList?page=1&pageSize=10
 *
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "appDeploy":[{
 *		"appName": {
 *			"name": "D4D",
 *			"version": "3.03.106"
 *		},
 *		"Dev": {
 *			"applicationInstanceName": "Supercatalyst",
 *			"applicationNodeIP": "54.183.1.26",
 *			"applicationLastDeploy": "2016-03-30 05:04:05 +0000",
 *			"applicationStatus": "Successful",
 *			"containerId": "NA",
 *			"hostName": "ip-10-0-0-54.us-west-1.compute.internal",
 *		},
 *		"QA": {},
 *		"Prod": {}
 *	}, {
 *		"appName": {
 *			"name": "D4D",
 *			"version": "3.02.100"
 *		},
 *		"Dev": {},
 *		"QA": {
 *			"applicationInstanceName": "Supercatalyst",
 *			"applicationNodeIP": "54.183.1.26",
 *			"applicationLastDeploy": "2016-03-30 05:04:05 +0000",
 *			"applicationStatus": "Successful",
 *			"containerId": "NA",
 *			"hostName": "ip-10-0-0-54.us-west-1.compute.internal",
 *		},
 *		"Prod": {}
 *	}],
 *  "metaData":{
 *    "totalRecords":2,
 *    "pageSize":10,
 *    "page":1,
 *    "totalPages":1,
 *    "sortBy":"envId",
 *    "sortOrder":"desc"
 *    }
 *  }
 *
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'AppDeploy PipeLine Information'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'AppDeploy PipeLine Information'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'AppDeploy PipeLine Information'}
 *     };
 */


/**
 * @api {get}/app/deploy/project/:projectId/env/:envName/appName/:appName/version/:version/appDeployHistoryList
 * @apiName /app/deploy/project/:projectId/env/:envName/appName/:appName/version/:version/appDeployHistoryList
 * @apiGroup App Deploy Pipeline View History for Particular Environment, AppName and Version
 *
 *
 * @apiParam {String} projectId      Unique Project Id
 * @apiParam {String} envName        Unique Environment Name
 * @apiParam {String} appName        Unique Application Name
 * @apiParam {String} version        Unique App Deploy Version
 *
 * @apiParamExample {url} Request-Example:
 * http://localhost:3001/app/deploy/project/b38ccedc-da2c-4e2c-a278-c66333564719/env/PreProd/appName/petclinic_db/version/1.0.1/appDeployHistoryList
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *  [{
 *	"_id": "5718c856400f00be828a8972",
 *	"applicationName": "petclinic_db",
 *	"applicationVersion": "1.0.1",
 *	"applicationInstanceName": "petclinic_db",
 *	"applicationNodeIP": "54.183.22.15",
 *	"hostName": "ip-10-0-0-246.us-west-1.compute.internal",
 *	"containerId": "NA",
 *	"applicationType": "Database Update",
 *	"applicationStatus": "successful"
 *  }]
 *
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'AppDeploy PipeLine History Information'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'AppDeploy PipeLine History Information'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'AppDeploy PipeLine History Information'}
 *     };
 */

/**
 * @api {get}/app/deploy/project/:projectId/env/:envName/appDeployHistoryList
 * @apiName /app/deploy/project/:projectId/env/:envName/appDeployHistoryList
 * @apiGroup App Deploy Pipeline History List By Project and Environment with Pagination,Search,Filter and Sort
 *
 *
 * @apiParam {String} projectId      Unique Project Id
 * @apiParam {String} envName        Unique Environment Id
 * @apiParam {Number} [page]         Current Page default is 1.
 * @apiParam {Number} [pageSize]     Records per page default is 10.
 * @apiParam {String} [search]       User is able to search for specific attribute. User can enter Environment Name or App Deploy Version for specific search.
 * @apiParam {String} [sortBy]       User can sort the records for any field. Default: results are sorted by Environment Name.
 * @apiParam {String} [sortOrder]    The sort order if sort parameter is provided. One of asc or desc. Default: desc
 * @apiParam {String} [filterBy]     User is able to filter the records for a set of attributes.Ex.filterBy=envId:Dev,QA.
 *
 *
 * @apiParamExample {url} Request-Example:
 * http://localhost:3001/app/deploy/project/b38ccedc-da2c-4e2c-a278-c66333564719/env/Dev/appDeployHistoryList?page=1&pageSize=10
 *
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *	"appDeploy": [{
 *		"_id": "570b48fcf1f0f28388f4b072",
 *		"applicationLastDeploy": "2016-03-30 05:28:34 +0000",
 *		"appLogs": "NA",
 *		"applicationName": "D4D",
 *		"applicationVersion": "3.03.106",
 *		"applicationInstanceName": "Supercatalyst",
 *		"applicationNodeIP": "54.183.227.76",
 *		"envId": "QA",
 *		"hostName": "ip-10-0-0-99.us-west-1.compute.internal",
 *		"containerId": "NA",
 *		"applicationType": "Package",
 *		"applicationStatus": "Successful",
 *		"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *		"__v": 0
 *	}, {
 *		"_id": "570b48fdf1f0f28388f4b073",
 *		"applicationLastDeploy": "2016-03-30 05:43:17 +0000",
 *		"appLogs": "NA",
 *		"applicationName": "D4D",
 *		"applicationVersion": "3.02.100",
 *		"applicationInstanceName": "Supercatalyst",
 *		"applicationNodeIP": "54.183.227.76",
 *		"envId": "QA",
 *		"hostName": "ip-10-0-0-99.us-west-1.compute.internal",
 *		"containerId": "NA",
 *		"applicationType": "Package",
 *		"applicationStatus": "Successful",
 *		"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *		"__v": 0
 *	}, {
 *		"_id": "570b48fdf1f0f28388f4b075",
 *		"applicationLastDeploy": "2015-03-31 11:17:25 +0000",
 *		"appLogs": "NA",
 *		"applicationName": "D4D",
 *		"applicationVersion": "3.02.100",
 *		"applicationInstanceName": "Supercatalyst",
 *		"applicationNodeIP": "54.183.227.76",
 *		"envId": "QA",
 *		"hostName": "ip-10-0-0-25.us-west-1.compute.internal",
 *		"containerId": "NA",
 *		"applicationType": "Package",
 *		"applicationStatus": "Successful",
 *		"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *		"__v": 0
 *	}, {
 *		"_id": "570b48fef1f0f28388f4b078",
 *		"applicationLastDeploy": "2016-03-30 05:28:34 +0000",
 *		"appLogs": "NA",
 *		"applicationName": "D4D",
 *		"applicationVersion": "3.03.106",
 *		"applicationInstanceName": "Supercatalyst",
 *		"applicationNodeIP": "54.183.227.76",
 *		"envId": "QA",
 *		"hostName": "ip-10-0-0-99.us-west-1.compute.internal",
 *		"containerId": "NA",
 *		"applicationType": "Package",
 *		"applicationStatus": "Successful",
 *		"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *		"__v": 0
 *	}, {
 *		"_id": "570b48fef1f0f28388f4b079",
 *		"applicationLastDeploy": "2016-03-30 05:43:17 +0000",
 *		"appLogs": "NA",
 *		"applicationName": "D4D",
 *		"applicationVersion": "3.02.100",
 *		"applicationInstanceName": "Supercatalyst",
 *		"applicationNodeIP": "54.183.227.76",
 *		"envId": "QA",
 *		"hostName": "ip-10-0-0-99.us-west-1.compute.internal",
 *		"containerId": "NA",
 *		"applicationType": "Package",
 *		"applicationStatus": "Successful",
 *		"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *		"__v": 0
 *	}],
 *	"metaData": {
 *		"totalRecords": 103,
 *		"pageSize": 5,
 *		"page": 1,
 *		"totalPages": 21,
 *		"sortBy": "envId",
 *		"sortOrder": "desc"
 *	}
 * }
 *
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'AppDeploy PipeLine History Information'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'AppDeploy PipeLine History Information'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'AppDeploy PipeLine History Information'}
 *     };
 */


/**
 * @api {get}/d4dMasters/organization/:orgId/repositoryServer/list
 * @apiName /d4dMasters/organization/:orgId/repositoryServer/list
 * @apiGroup Repository Server List
 *
 *
 * @apiParam {String} orgId      Unique Organization Id
 *
 * @apiParamExample {url} Request-Example:
 *	http://localhost:3001/d4dMasters/organization/46d1da9a-d927-41dc-8e9e-7e926d927537/repositoryServer/list
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *   {
 *	  "server": [{
 *		"_id": "570c7ef941824ee81a78c90a",
 *		"dockerreponame": "DockerServer",
 *		"dockerrepopath": "catalyst",
 *		"dockeruserid": "Durgesh1988",
 *		"dockeremailid": "durgesh.sharma@relevancelab.com",
 *		"dockerpassword": "Durgesh@123",
 *		"rowid": "1d087d1b-07e1-4815-b240-40aab20d63ad",
 *		"id": "18",
 *		"configType": "docker",
 *		"__v": 0,
 *		"active": true,
 *		"orgname_rowid": ["46d1da9a-d927-41dc-8e9e-7e926d927537"],
 * 		"orgname": ["Phoenix"]
 *	    },
 *	    {
 *		"_id": "570c7ec641824ee81a78c908",
 *		"nexusservername": "NexusServer",
 *		"username": "Durgesh1988",
 *		"nexuspassword": "Durgesh@123",
 *		"hostname": "http://localhost:3001/",
 *		"rowid": "d64a559b-0466-4631-9b41-30465f6c2156",
 *		"id": "26",
 *		"configType": "nexus",
 * 		"__v": 0,
 *		"active": true,
 *		"groupid": ["Durgesh"],
 *		"orgname_rowid": ["46d1da9a-d927-41dc-8e9e-7e926d927537"],
 *		"orgname": ["Phoenix"]
 *	    }]
 *  }
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'On Load New AppDeploy Information'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'On Load New AppDeploy Information'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'On Load New AppDeploy Information'}
 *     };
 */


//  List image tags w.r.t. docker repo and image
/**
     * @api {get} /d4dMasters/docker/:dockerId/repository/:repository/image/:image/tags Request Docker Image Tag information
     * @apiName GetDockerImageTags
     * @apiGroup Docker Image Tags
     *
     * @apiParam {string} rowid Docker unique ID.
     * @apiParam {string} repository Docker Repo.
     * @apiParam {string} image Docker Image.
     *
     * @apiSuccess {string} layer some unique ID of docker image.
     * @apiSuccess {string} name  version of the docker image.
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     [
             {
                "layer": "b961ba15",
                "name": "latest"
             }
            ]
     *
     * @apiError DockerImageNotFound.
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 404 Not Found
     *     {
     *       "error": "Docker Image not found."
     *     }
     */

/**
 * @api {get}/app/deploy/nexus/:nexusId/project/:projectId/nexusRepositoryList
 * @apiName /app/deploy/nexus/:nexusId/project/:projectId/nexusRepositoryList
 * @apiGroup Nexus Repository List
 *
 *
 * @apiParam {String} nexusId      Unique Nexus Id
 * @apiParam {String} projectId    Unique Project Id
 *
 *
 * @apiParamExample {url} Request-Example:
 *	http://localhost:3001/app/deploy/nexus/6f284219-8009-40f1-8ffc-3235c2f107ca/project/b38ccedc-da2c-4e2c-a278-c66333564719/nexusRepositoryList
 *
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *
 *	    [{
 *	    "name": "petclinic",
 *	    "resourceURI": "http://nexus.rlcatalyst.com/nexus/service/local/repositories/petclinic",
 *	    "id": "petclinic"
 *	    }, {
 *	    "name": "catalyst",
 *	    "resourceURI": "http://nexus.rlcatalyst.com/nexus/service/local/repositories/catalyst",
 *	    "id": "catalyst"
 *	    }]
 *
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'NexusRepositoryList'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'NexusRepositoryList'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'NexusRepositoryList'}
 *     };
 */


/**
 * @api {get}/app/deploy/nexus/:nexusId/repositories/:repoName/group/:groupId/artifactList
 * @apiName /app/deploy/nexus/:nexusId/repositories/:repoName/group/:groupId/artifactList
 * @apiGroup Nexus Repository Artifact List
 *
 *
 * @apiParam {String} nexusId      Unique Nexus Id
 * @apiParam {String} repoName     Unique Nexus Repository Name
 * @apiParam {String} groupId      Unique Nexus Group Id
 *
 * @apiParamExample {url} Request-Example:
 *	http://localhost:3001/app/deploy/nexus/6f284219-8009-40f1-8ffc-3235c2f107ca/repositories/catalyst/group/org.catalyst/artifactList
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *
 *	    [{
 *	    "resourceURI": "http://nexus.rlcatalyst.com/nexus/service/local/repositories/catalyst/content/org/catalyst/D4D/2.01.480/D4D-2.01.480.zip",
 *	    "groupId": "org.catalyst",
 *	    "artifactId": "D4D",
 *	    "version": "2.01.480",
 *	    "packaging": "zip",
 *	    "extension": "zip",
 *	    "repoId": "catalyst",
 *	    "contextId": "catalyst",
 *	    "pomLink": "http://nexus.rlcatalyst.com/nexus/service/local/artifact/maven/redirect?r=catalyst&amp;g=org.catalyst&amp;a=D4D&amp;v=2.01.480&amp;e=pom",
 *	    "artifactLink": "http://nexus.rlcatalyst.com/nexus/service/local/artifact/maven/redirect?r=catalyst&amp;g=org.catalyst&amp;a=D4D&amp;v=2.01.480&amp;e=zip",
 *	    "highlightedFragment": "&lt;blockquote&gt;Group ID&lt;UL&gt;&lt;LI&gt;&lt;B&gt;org&lt;/B&gt;.&lt;B&gt;catalyst&lt;/B&gt;&lt;/LI&gt;&lt;/UL&gt;&lt;/blockquote&gt;"
 *	    }]
 *
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'ArtifactList'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'ArtifactList'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'ArtifactList'}
 *     };
 */


/**
 * @api {get}/app/deploy/nexus/:nexusId/repositories/:repoName/group/:groupId/artifact/:artifactId/versionList
 * @apiName /app/deploy/nexus/:nexusId/repositories/:repoName/group/:groupId/artifact/:artifactId/versionList
 * @apiGroup Nexus Repository Artifact Version List
 *
 *
 * @apiParam {String} nexusId      Unique Nexus Id
 * @apiParam {String} repoName     Unique Nexus Repository Name
 * @apiParam {String} groupId      Unique Nexus Group Id
 * @apiParam {String} artifactId   Unique Nexus Repository Artifact Id
 *
 * @apiParamExample {url} Request-Example:   
 * http://localhost:3001/app/deploy/nexus/6f284219-8009-40f1-8ffc-3235c2f107ca/repositories/catalyst/group/org.catalyst/artifact/D4D/versionList
 *  
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *
 *	    ["2.01.480", "2.01.482", "2.01.484", "2.01.485", "2.01.488", "2.01.492", "2.01.496", "2.01.498", "2.01.506", "2.01.520", "2.01.521", "2.01.523", "2.01.524", "3.02.54", "3.02.2", "3.02.3", "3.02.59", "3.02.60", "3.02.61", "3.02.62", "3.02.63", "3.02.64", "3.02.65", "3.02.66", "3.02.67", "3.02.99", "3.02.100", "3.03.101", "3.03.102", "3.03.104", "3.03.105", "3.03.106"]
 *
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'VersionList'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'VersionList'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'VersionList'}
 *     };
 */


//  Deploy New Application
/**
     * @api {post} /app/deploy/new Deploy New App
     * @apiName DeployNewApp
     * @apiGroup Deploy New App
     *
     * @apiParam {String} [repoURL]  Mandatory repoURL for nexus.
     * @apiParam {String} [version]  Mandatory version for nexus.
     * @apiParam {String} [artifactId]  Mandatory artifactId for nexus.
     * @apiParam {String} [groupId]  Mandatory groupId for nexus.
     * @apiParam {String} [repository]  Mandatory repository for nexus.

 	 * @apiParam {String} [dockerImage]  Mandatory dockerImage for docker.
 	 * @apiParam {String} [containerName]  Optional containerName for docker.
 	 * @apiParam {String} [containerPort]  Mandatory containerPort for docker.
 	 * @apiParam {String} [hostPort]  Mandatory hostPort for docker.
 	 * @apiParam {String} [dockerUser]  Optional dockerUser for docker.
 	 * @apiParam {String} [dockerPassword]  Optional dockerPassword for docker.
 	 * @apiParam {String} [dockerEmailId]  Optional dockerEmailId for docker.
 	 * @apiParam {String} [imageTag]  Mandatory imageTag for docker.

 	 * @apiParam {String} [projectId]  Mandatory projectId for App Data.
 	 * @apiParam {String} [envName]  Mandatory envName for App Data.
 	 * @apiParam {String} [appName]  Mandatory appName for App Data.
 	 * @apiParam {String} [version]  Mandatory version for App Data.

 	 * @apiParam {String} [taskId]  Mandatory taskId for Task.
 	 * @apiParam {[String]} [nodeIds]  Mandatory nodeIds for Task.
     *
     * @apiParamExample {json} Request-Example:
	 *{
		"sourceData": {
			"nexus": {
				"repoURL": "nexusRepoUrl", // nexusArtifact.resourceURI (from nexus artifact call)
				"version": "version",
				"artifactId": "artifactId",
				"groupId": "groupId",
				"repository": "repository"
			},
			"docker": {
				"image": "dockerImage",
				"containerName": "containerName",
				"containerPort": "containerPort",
				"hostPort": "hostPort",
				"dockerUser": "dockerUser",
				"dockerPassword": "dockerPassword",
				"dockerEmailId": "dockerEmailId",
				"imageTag": "imageTag"
			}
		},
		"appData": {
			"projectId": "projectId",
			"envName": "envName",
			"appName": "appName", // for nexus(nexus.artifactId) and for docker(docker.image)
			"version": "version" // for nexus(nexus.version) and for docker(docker.imageTag)
		},
		"task": {
			"taskId": "56fb64a19ee332570c311cef",
			"nodeIds": ["57039230bfa14af3165a2845", "4535554543433455353", "767564535355532432"] // Send which are checked
		}
	  }
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *      {
			  "taskId": "889749848044442",
			  "taskType": "chef",
			  "historyId": "5714843ce4f0ba611a0f1ba5"
			}
     *
     * @apiError TaskNotFound.
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 404 Not Found
     *     {
     *       "error": "Task not found."
     *     }
     */




//  Upgrade Application
/**
     * @api {put} /app/deploy/upgrade  Upgrade App
     * @apiName UpgradeApp
     * @apiGroup Upgrade App
     *
     * @apiParam {String} [repoURL]  Mandatory repoURL for nexus.
     * @apiParam {String} [version]  Mandatory version for nexus.
     * @apiParam {String} [artifactId]  Mandatory artifactId for nexus.
     * @apiParam {String} [groupId]  Mandatory groupId for nexus.
     * @apiParam {String} [repository]  Mandatory repository for nexus.

 	 * @apiParam {String} [dockerImage]  Mandatory dockerImage for docker.
 	 * @apiParam {String} [containerName]  Optional containerName for docker.
 	 * @apiParam {String} [containerPort]  Mandatory containerPort for docker.
 	 * @apiParam {String} [hostPort]  Mandatory hostPort for docker.
 	 * @apiParam {String} [dockerUser]  Optional dockerUser for docker.
 	 * @apiParam {String} [dockerPassword]  Optional dockerPassword for docker.
 	 * @apiParam {String} [dockerEmailId]  Optional dockerEmailId for docker.
 	 * @apiParam {String} [imageTag]  Mandatory imageTag for docker.

 	 * @apiParam {String} [projectId]  Mandatory projectId for App Data.
 	 * @apiParam {String} [envName]  Mandatory envName for App Data.
 	 * @apiParam {String} [appName]  Mandatory appName for App Data.
 	 * @apiParam {String} [version]  Mandatory version for App Data.

 	 * @apiParam {String} [taskId]  Mandatory taskId for Task.
 	 * @apiParam {[String]} [nodeIds]  Mandatory nodeIds for Task.
     *
     * @apiParamExample {json} Request-Example:
	 *{
		"sourceData": {
			"nexus": {
				"repoURL": "nexusRepoUrl", // nexusArtifact.resourceURI (from nexus artifact call)
				"version": "version",
				"artifactId": "artifactId",
				"groupId": "groupId",
				"repository": "repository"
			},
			"docker": {
				"image": "dockerImage",
				"containerName": "containerName",
				"containerPort": "containerPort",
				"hostPort": "hostPort",
				"dockerUser": "dockerUser",
				"dockerPassword": "dockerPassword",
				"dockerEmailId": "dockerEmailId",
				"imageTag": "imageTag"
			}
		},
		"appData": {
			"projectId": "projectId",
			"envName": "envName",
			"appName": "appName", // for nexus(nexus.artifactId) and for docker(docker.image)
			"version": "version" // for nexus(nexus.version) and for docker(docker.imageTag)
		},
		"task": {
			"taskId": "56fb64a19ee332570c311cef",
			"nodeIds": ["57039230bfa14af3165a2845", "4535554543433455353", "767564535355532432"] // Send which are checked
		}
	  }
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *      {
			  "taskId": "889749848044442",
			  "taskType": "chef",
			  "historyId": "5714843ce4f0ba611a0f1ba5"
			}
     *
     * @apiError TaskNotFound.
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 404 Not Found
     *     {
     *       "error": "Task not found."
     *     }
     */


//  Promote Application
/**
     * @api {put} /app/deploy/promote  Promote App
     * @apiName PromoteApp
     * @apiGroup Promote App
     *
 	 * @apiParam {String} [projectId]  Mandatory projectId for App Data.
 	 * @apiParam {String} [sourceEnv]  Mandatory sourceEnv for App Data.
 	 * @apiParam {String} [targetEnv]  Mandatory targetEnv for App Data.
 	 * @apiParam {String} [appName]  Mandatory appName for App Data.
 	 * @apiParam {String} [version]  Mandatory version for App Data.

 	 * @apiParam {String} [taskId]  Mandatory taskId for Task.
 	 * @apiParam {[String]} [nodeIds]  Mandatory nodeIds for Task.
     *
     * @apiParamExample {json} Request-Example:
	 *{
		"appData": {
			"projectId": "projectId",
			"sourceEnv": "sourceEnv",
	 		"targetEnv": "targetEnv",
			"appName": "appName", // for nexus(nexus.artifactId) and for docker(docker.image)
			"version": "version" // for nexus(nexus.version) and for docker(docker.imageTag)
		},
		"task": {
			"taskId": "56fb64a19ee332570c311cef",
			"nodeIds": ["57039230bfa14af3165a2845", "4535554543433455353", "767564535355532432"] // Send which are checked
		}
	}
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *      {
			  "taskId": "889749848044442",
			  "taskType": "chef",
			  "historyId": "5714843ce4f0ba611a0f1ba5"
			}
     *
     * @apiError TaskNotFound.
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 404 Not Found
     *     {
     *       "error": "Task not found."
     *     }
     */

/**
 * @api {get}/app/deploy/pipeline/project/:projectId
 * @apiName /app/deploy/pipeline/project/:projectId
 * @apiGroup Pipeline View Information
 *
 *
 * @apiParam {String} projectId      Unique Project Id
 *
 * @apiParamExample {url} Request-Example:
 *  http://localhost:3001/app/deploy/pipeline/project/b38ccedc-da2c-4e2c-a278-c66333564719
 *  
 *
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *
 *	[{
 *	"_id": "5714cd8f8bf7882c42968d4b",
 *	"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *	"loggedInUser": "superadmin",
 *	"__v": 0,
 *	"envSequence": ["Dev", "Prod", "QA", "PreProd"],
 *	"envId": ["Dev", "QA", "PreProd"]
 *  }]
 *
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'Pipeline View Information'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Pipeline View Information'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Pipeline View Information'}
 *     };
 */


/**
 * @api {post}/app/deploy/data/pipeline/save/configure
 * @apiName /app/deploy/data/pipeline/save/configure
 * @apiGroup Save App Deploy Pipeline Configuration
 *
 *
 * @apiParam {String} [orgId]      Optional Organization Id.
 * @apiParam {String} [bgId]       Optional Business Group Id.
 * @apiParam {String} projectId    Mandatory Project Id.
 * @apiParam {JSONArray} envId     Mandatory List of Environments.
 * @apiParam {JSONArray} envSequence     Mandatory List of Environments Sequence.
 *
 * @apiParamExample {json} Request-Example:
 *  {
 *	            orgId: "46d1da9a-d927-41dc-8e9e-7e926d927537",
 *	            bgId: "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
 *	            projectId: "b38ccedc-da2c-4e2c-a278-c66333564719",
 *              envSequence: ['Dev', 'Prod', 'QA', 'PreProd'],
 *              envId: ['Dev', 'QA', 'PreProd']
 * }
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *
 *	[{
 *	"_id": "5714cd8f8bf7882c42968d4b",
 *	"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *	"loggedInUser": "superadmin",
 *	"envSequence": ["Dev", "Prod", "QA", "PreProd"],
 *	"envId": ["Dev", "QA", "PreProd"],
 *  "__v": 0
 *  }]
 *
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'App Deploy Pipeline Configuration'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'App Deploy Pipeline Configuration'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'App Deploy Pipeline Configuration'}
 *     };
 */

/**
 * @api {put}/app/deploy/data/pipeline/update/configure
 * @apiName /app/deploy/data/pipeline/update/configure
 * @apiGroup Update App Deploy Pipeline Configuration
 *
 *
 * @apiParam {String} [orgId]      Optional Organization Id.
 * @apiParam {String} [bgId]       Optional Business Group Id.
 * @apiParam {String} projectId    Mandatory Project Id.
 * @apiParam {JSONArray} envId     Mandatory List of Environments.
 * @apiParam {JSONArray} envSequence     Mandatory List of Environments Sequence.
 *
 * @apiParamExample {json} Request-Example:
 *  {
 *	            orgId: "46d1da9a-d927-41dc-8e9e-7e926d927537",
 *	            bgId: "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
 *	            projectId: "b38ccedc-da2c-4e2c-a278-c66333564719",
 *              envSequence: ['Dev', 'Prod', 'QA', 'PreProd'],
 *              envId: ['Dev', 'QA', 'PreProd']
 * }
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *
 *	{
 *	           ok: 1, nModified: 0, n: 1
 *  }
 *
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'App Deploy Pipeline Configuration'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'App Deploy Pipeline Configuration'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'App Deploy Pipeline Configuration'}
 *     };
 */

/**
 * @api {get}/instances/instanceIds/list
 * @apiName /instances/instanceIds/list
 * @apiGroup Instance List based on array of Instance IDs
 *
 * @apiParam {JSONArray} instanceIds     List of Instance IDs.
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *
 *	[{
 *	"_id": "5710cf1f527af1d0132e9d1d",
 *	"name": "52.53.223.219",
 *	"orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
 *	"bgId": "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
 *	"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *	"envId": "df87280c-ef3d-4e45-ac23-fcb77c845409",
 *	"instanceIP": "52.53.223.219",
 *	"instanceState": "running",
 *	"bootStrapStatus": "success",
 *	"taskIds": [],
 *	"chefClientExecutionIds": [],
 *	"actionLogs": [{
 *		"_id": "5710cf1f527af1d0132e9d1e",
 *		"actionData": {
 *			"runlist": []
 *		},
 *		"timeStarted": 1460719391658,
 *		"user": "superadmin",
 *		"success": true,
 *		"completed": true,
 *		"name": "Bootstrap",
 *		"type": 1,
 *		"timeEnded": 1460719405910
 *	}, {
 *		"_id": "5710cf50527af1d0132e9d3e",
 *		"actionData": {
 *			"runlist": [
 *				"recipe[docker_rl]"
 *			]
 *		},
 *		"timeStarted": 1460719440694,
 *		"user": "superadmin",
 *		"success": true,
 *		"completed": true,
 *		"name": "Chef-Client-Run",
 *		"type": 2,
 *		"timeEnded": 1460719505198
 *	}],
 *	"serviceIds": [],
 *	"blueprintData": {
 *		"blueprintName": "52.53.223.219",
 *		"templateId": "chef_import",
 *		"iconPath": "../private/img/templateicons/chef_import.png",
 *		"templateComponents": []
 *	},
 *	"credentials": {
 *		"username": "ubuntu",
 *		"pemFileLocation": "/home/rle0333/rlCatalyst/core/server/catdata/catalyst/instance-pemfiles/07fee0c8-f725-4eb7-9b11-07b8fe7d8a2f"
 *	},
 *	"software": [],
 *	"chef": {
 *		"serverId": "ef074bc9-d61c-4d3a-8038-17878422f965",
 *		"chefNodeName": "52.53.223.219"
 *	},
 *	"hardware": {
 *		"platform": "ubuntu",
 *		"platformVersion": "14.04",
 *		"architecture": "x86_64",
 *		"memory": {
 *			"total": "4046872kB",
 *			"free": "3440100kB"
 *		},
 *		"os": "linux"
 *	},
 *	"users": [
 *		"superadmin"
 *	],
 *	"appUrls": [],
 *	"attributes": [],
 *	"runlist": [
 *		"recipe[docker_rl]"
 *	],
 *	"__v": 0,
 *	"docker": {
 *		"dockerEngineStatus": "success",
 *		"dockerEngineUrl": ""
 *	}
 * }]
 *
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'Instance List'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Instance List'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Instance List'}
 *     };
 */


/**
 * @api {post}/aws/providers
 * @apiName /aws/providers
 * @apiGroup Add a new AWS Provider Account
 *
 *
 * @apiParam {String} accessKey     Unique Provider Access Key
 * @apiParam {String} secretKey     Unique Provider Secret Key
 * @apiParam {String} providerName  Unique Provider Name
 * @apiParam {String} providerType  Unique Provider Type
 * @apiParam {String} orgId         Unique Organization Id
 * @apiParam {String} fileName      Unique File Name
 * @apiParam {String} region        Unique Provider Region
 * @apiParam {String} keyPairName   Unique Key Pair Name
 * @apiParam {Boolean} [isDefault]   Set Default Provider
 * 
 * @apiParamExample {json} Request-Example:
 *  {
 *    "providerName" : "AWSProvider",
 *    "providerType" : "AWS",
 *    "accessKey" : "0bYiGYDzoomLGPuSW/dtmJ16Wwiua01b3l8Aeui0UsU=",
 *    "secretKey" : "0mjJkixEIP87EXgmHu54Pxoqt1qiDgUygMwPCCLy3m1MN0RAK6CgJiWgWb68m87D",
 *    "orgId" : "54edde9c21b4d7e50f29435f",
 *    "isDefault" : false,
 *    "fileName" : "cat-cal.pem",
 *    "region" : "us-west-1",
 *    "keyPairName:"cat-cal"
 * }
 *
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *
 *  {
 *		"_id": "56f1459ec9f075275f4ea9be",
 *		"id": 9,
 *		"providerName": "AWSProvider",
 *		"providerType": "AWS",
 *		"accessKey": "0bYiGYDzoomLGPuSW/dtmJ16Wwiua01b3l8Aeui0UsU=",
 *		"secretKey": "0mjJkixEIP87EXgmHu54Pxoqt1qiDgUygMwPCCLy3m1MN0RAK6CgJiWgWb68m87D",
 *		"orgId": "54edde9c21b4d7e50f29435f",
 *		"orgName": "PhoenixOrg",
 *		"keyPairs": {
 *			"_id": "56f1459ec9f075275f4ea9bf",
 *			"keyPairName": "cat-cal",
 *			"region": "us-west-1",
 *			"fileName": "cat-cal.pem",
 *			"providerId": "56f1459ec9f075275f4ea9be",
 *			"id": 99,
 *			"__v": 0
 *		},
 *		"__v": 0
 *	}
 *
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'Provider Creation'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Provider Creation'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Provider Creation'}
 *     };
 */


/**
 * @api {post}/blueprints
 * @apiName /blueprints
 * @apiGroup Create a new AWS Blueprint(Software Stack)
 *
 *
 * @apiParam {String} orgId  Unique Organization ID
 * @apiParam {String} bgId   Unique Business Group ID
 * @apiParam {String} projectId Unique Project ID
 * @apiParam {String} name  Unique Blueprint Name
 * @apiParam {String} templateId  Unique Template ID
 * @apiParam {String} templateType  Unique Template Type
 * @apiParam {String} blueprintType  Unique Blueprint Type
 * @apiParam {JSONArray} users  List of Users
 * @apiParam {JSONArray} [appUrls]  List of Application URLs
 * @apiParam {String} [iconpath]  Unique Icon Path
 * @apiParam {String} providerId  Unique Provider ID
 * @apiParam {String} keyPairId  Unique Key Pair ID
 * @apiParam {String} instanceType  Unique Instance Type
 * @apiParam {String} vpcId  Unique VPC ID
 * @apiParam {String} imageId Unique Image ID
 * @apiParam {JSONArray} securityGroupIds  List of Security Group ID
 * @apiParam {String} infraManagerId Unique Infra Manager ID
 * @apiParam {JSONArray} [runlist] List of Chef Run-List
 *
 * @apiParamExample {json} Request-Example:
 *  {
 *	"blueprintData": {
 *		"orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
 *		"bgId": "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
 *		"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *		"name": "TestBlueprint",
 *		"templateId": "TestTemplate",
 *		"templateType": "chef",
 *		"blueprintType": "instance_launch",
 *		"users": ["superadmin"],
 *		"appUrls": [],
 *		"iconpath": "",
 *		"providerId": "56f1459ec9f075275f4ea9be",
 *		"keyPairId": "56f1459ec9f075275f4ea9bf",
 *		"instanceType": "t2.micro",
 *		"instanceAmiid": "ami-06116566",
 *		"vpcId": "vpc-52110130",
 *		"subnetId": "subnet-12b4ea54",
 *		"imageId": "56fa21c02a3efd265302040e",
 *		"securityGroupIds": ["sg-99a3bcfb"],
 *		"infraManagerId": "ef074bc9-d61c-4d3a-8038-17878422f965",
 *		"runlist": ["recipe[lamp-stack]", "recipe[tomcat]"]
 *	}
 * }
 *
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *
 *  {
 *   "_id" : ObjectId("56fa223d2a3efd2653020413"),
 *   "orgId" : "46d1da9a-d927-41dc-8e9e-7e926d927537",
 *   "bgId" : "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
 *   "projectId" : "b38ccedc-da2c-4e2c-a278-c66333564719",
 *   "name" : "TestBlueprint",
 *   "templateId" : "TestTemplate",
 *   "templateType" : "chef",
 *   "blueprintConfig" : {
 *       "cloudProviderType" : "aws",
 *       "cloudProviderId" : "56f1459ec9f075275f4ea9be",
 *       "cloudProviderData" : {
 *           "keyPairId" : "56f1459ec9f075275f4ea9bf",
 *           "instanceType" : "t2.micro",
 *           "instanceAmiid" : "ami-06116566",
 *           "instanceUsername" : "root",
 *           "vpcId" : "vpc-52110130",
 *           "subnetId" : "subnet-12b4ea54",
 *           "imageId" : "56fa21c02a3efd265302040e",
 *            "instanceOS" : "linux",
 *           "instanceCount" : "1",
 *           "_id" : ObjectId("56fa223d2a3efd265302040f"),
 *           "securityGroupIds" : [
 *               "sg-99a3bcfb"
 *           ]
 *       },
 *       "infraMangerType" : "chef",
 *       "infraManagerId" : "ef074bc9-d61c-4d3a-8038-17878422f965",
 *       "infraManagerData" : {
 *           "latestVersion" : "0.1",
 *           "_id" : ObjectId("56fa223d2a3efd2653020410"),
 *           "versionsList" : [
 *              {
 *                   "ver" : "0.1",
 *                   "_id" : ObjectId("56fa223d2a3efd2653020411"),
 *                   "runlist" : [
 *                       "recipe[lamp-stack]",
 *                       "recipe[tomcat]"
 *                   ]
 *               }
 *           ]
 *       },
 *       "_id" : ObjectId("56fa223d2a3efd2653020412")
 *   },
 *   "blueprintType" : "instance_launch",
 *   "users" : [
 *       "superadmin"
 *   ],
 *   "appUrls" : [],
 *   "__v" : 0
 *	}
 *
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'Blueprint Creation'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Blueprint Creation'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Blueprint Creation'}
 *     };
 */

/**
 * @api {get}/blueprints/:blueprintId/launch
 * @apiName /blueprints/:blueprintId/launch
 * @apiGroup Launch a Blueprint
 *
 *
 * @apiParam {String} blueprintId    Unique Blueprint ID
 * @apiParam {String} envId          Unique Environment ID
 * @apiParam {String} version        Unique Blueprint Version
 * @apiParam {String} stackName      Unique Stack Name
 *
 * @apiParamExample {url} Request-Example:
 *  {
 *	params:{
 *	      "blueprintId":"56fa223d2a3efd2653020413"
 *         },
 *  query: {
 *        "envId":"24fa223d2a3efd2653020413",
 *        "version":"0.1",
 *        "stackName":"Jagadish"
 *    }
 * }
 *
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *  InstanceLogs:[]
 *	}
 *
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'Launch a Blueprint'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Launch a Blueprint'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Launch a Blueprint'}
 *     };
 */

/**
 * @api {post}/app/deploy
 * @apiName /app/deploy
 * @apiGroup Launch / Deploy apps on an Instance
 *
 *
 * @apiParam {String} applicationName  Unique Application Name
 * @apiParam {String} applicationInstanceName   Unique Application Instance Name
 * @apiParam {String} applicationVersion Unique Application Version
 * @apiParam {String} applicationNodeIP  Unique Application Node IP Address
 * @apiParam {String} applicationLastDeploy  Unique Application Last Deploy Date
 * @apiParam {String} applicationStatus  Unique Application Status
 * @apiParam {String} [orgId]  Unique Organization ID
 * @apiParam {String} [bgId]  Unique Business Group ID
 * @apiParam {String} projectId  Unique Project ID
 * @apiParam {String} envId  Unique Environment Name
 * @apiParam {String} [description]  Application Description
 * @apiParam {String} applicationType  Unique Application Type
 * @apiParam {String} [containerId]  Unique Container ID
 * @apiParam {String} hostName Unique Host Name
 * @apiParam {String} [appLogs]  App Logs
 *
 *
 * @apiParamExample {json} Request-Example:
 *  {
 *	"appDeployData": {
 *		 "orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
 *		 "bgId": "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
 *		 "projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *		 "applicationLastDeploy" : "2016-03-30 05:04:05 +0000",
 *       "appLogs" : "NA",
 *       "applicationName" : "D4D",
 *       "applicationVersion" : "3.03.106",
 *       "applicationInstanceName" : "Supercatalyst",
 *       "applicationNodeIP" : "54.183.1.26",
 *       "envId" : "Dev",
 *       "hostName" : "ip-10-0-0-54.us-west-1.compute.internal",
 *       "containerId" : "NA",
 *       "applicationType" : "Package",
 *       "applicationStatus" : "Successful"
 *	}
 * }
 *
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *
 *  {
 *    "_id" : ObjectId("570b48fcf1f0f28388f4b071"),
 *    "applicationLastDeploy" : "2016-03-30 05:04:05 +0000",
 *    "appLogs" : "NA",
 *    "applicationName" : "D4D",
 *    "applicationVersion" : "3.03.106",
 *    "applicationInstanceName" : "Supercatalyst",
 *    "applicationNodeIP" : "54.183.1.26",
 *    "envId" : "Dev",
 *    "hostName" : "ip-10-0-0-54.us-west-1.compute.internal",
 *    "containerId" : "NA",
 *    "applicationType" : "Package",
 *    "applicationStatus" : "Successful",
 *    "projectId" : "b38ccedc-da2c-4e2c-a278-c66333564719",
  *   "__v" : 0
 *	 }
 *
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'Launch / Deploy apps on an Instance'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Launch / Deploy apps on an Instance'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Launch / Deploy apps on an Instance'}
 *     };
 */

/**
 * @api {post}/deploy/permission/data/save/configure
 * @apiName /deploy/permission/data/save/configure
 * @apiGroup Save Deploy Permission
 *
 *
 * @apiParam {String} projectId     Project Id.
 * @apiParam {String} envId         Environment Name.
 * @apiParam {String} appName       Application Name.
 * @apiParam {String} version       Application Version.
 * @apiParam {String} [comments]    Comment for Approval.
 * @apiParam {Boolean} isApproved   Approval Status.
 *
 * @apiParamExample {json} Request-Example:
 *  {
 *	            projectId: "b38ccedc-da2c-4e2c-a278-c66333564719",
 *              envId: "Dev",
 *              appName:"D4D",
 *              version:"301.2.105",
 *              comments:"Approved",
 *              isApproved:true
 * }
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *
 *	{
 *	            "_id": "5714cd8f8bf7882c42968d4b",
 *              projectId: "b38ccedc-da2c-4e2c-a278-c66333564719",
 *              envId: "Dev",
 *              appName:"D4D",
 *              version:"301.2.105",
 *              comments:"Approved",
 *              isApproved:true
 *              "__v": 0
 *  }
 *
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'Deploy Permission Configuration'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Deploy Permission Configuration'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Deploy Permission Configuration'}
 *     };
 */

/**
 * @api {put}/deploy/permission/data/update/configure
 * @apiName /deploy/permission/data/update/configure
 * @apiGroup Update Deploy Permission
 *
 *
 * @apiParam {String} projectId     Project Id.
 * @apiParam {String} envId         Environment Name.
 * @apiParam {String} appName       Application Name.
 * @apiParam {String} version       Application Version.
 * @apiParam {String} [comments]    Comment for Approval.
 * @apiParam {Boolean} isApproved   Approval Status.
 *
 * @apiParamExample {json} Request-Example:
 *  {
 *	            projectId: "b38ccedc-da2c-4e2c-a278-c66333564719",
 *              envId: "Dev",
 *              appName:"D4D",
 *              version:"301.2.105",
 *              comments:"Approved",
 *              isApproved:true
 * }
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *
 *	{
 *	           ok: 1, nModified: 0, n: 1
 *  }
 *
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'Deploy Permission Configuration'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Deploy Permission Configuration'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Deploy Permission Configuration'}
 *     };
 */

/**
 * @api {get}/deploy/permission/project/:projectId/env/:envName/application/:appName/permissionList
 * @apiName /deploy/permission/project/:projectId/env/:envName/application/:appName/permissionList
 * @apiGroup Get Deploy Permission Via Project ID
 *
 *
 * @apiParam {String} projectId     Project Id.
 * @apiParam {String} envName       Environment Name.
 * @apiParam {String} appName       Application Name.
 *
 * @apiParamExample {url} Request-Example:          
 * http://localhost:3001/deploy/permission/project/b38ccedc-da2c-4e2c-a278-c66333564719/env/Dev/application/D4D/permissionList
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *
 *  [{
 *	            "_id": "5714cd8f8bf7882c42968d4b",
 *              projectId: "b38ccedc-da2c-4e2c-a278-c66333564719",
 *              envId: "Dev",
 *              appName:"D4D",
 *              version:"301.2.105",
 *              comments:"Approved",
 *              isApproved:true
 *              "__v": 0
 *  }]
 *
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'Get Deploy Permission'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Get Deploy Permission'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Get Deploy Permission'}
 *     };
 */

 /**
 * @api {get}/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/chefTasks
 * @apiName /organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/chefTasks
 * @apiGroup Chef Task List
 *
 *
 * @apiParam {String} orgId         Unique Organization ID.
 * @apiParam {String} bgId          Unique Business Group ID.
 * @apiParam {String} projectId     Unique Project ID.
 * @apiParam {String} envId         Unique Environment ID.
 *
 * @apiParamExample {url} Request-Example:          
 * http://localhost:3001/organizations/46d1da9a-d927-41dc-8e9e-7e926d927537/businessgroups/7e3500f1-58f9-43e2-b9eb-347b2e4d129d/projects/b38ccedc-da2c-4e2c-a278-c66333564719/environments/df87280c-ef3d-4e45-ac23-fcb77c845409/chefTasks
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *
 *  [{
 *	"_id": "571892c1f016754c2b94a36f",
 *	"taskType": "chef",
 *	"name": "TestJob",
 *	"taskConfig": {
 *		"_id": "571892c1f016754c2b94a36e",
 *		"nodeIds": ["570f611abf8189032f643299"],
 *		"runlist": ["role[catalyst]"],
 *		"attributes": [],
 *		"taskType": "chef"
 *	},
 *	"blueprintIds": []
 *  },{
 *	"_id": "571de1fd4d5f815a29bbdd47",
 *	"taskType": "chef",
 *	"name": "Testing",
 *	"taskConfig": {
 *		"_id": "571de1fd4d5f815a29bbdd46",
 *		"nodeIds": ["57161ba18cd32c644a0f79ab"],
 *		"runlist": [],
 *		"attributes": [],
 *		"taskType": "chef"
 *	},
 *	"blueprintIds": []
 *  }, {
 *	"_id": "571de1be4d5f815a29bbdd3f",
 *	"taskType": "composite",
 *	"name": "TestComposite",
 *	"taskConfig": {
 *		"_id": "571de1be4d5f815a29bbdd3e",
 *		"assignTasks": ["57189283f016754c2b94a35d", "5718916cf016754c2b94a323"],
 *		"taskType": "composite"
 *	},
 *	"blueprintIds": []
 *  }, {
 *	"_id": "571de1eb4d5f815a29bbdd43",
 *	"taskType": "composite",
 *	"name": "Test3",
 *	"taskConfig": {
 *		"_id": "571de1eb4d5f815a29bbdd42",
 *		"assignTasks": ["571de1d24d5f815a29bbdd41", "57189239f016754c2b94a355", "5718916cf016754c2b94a323"],
 *		"taskType": "composite"
 *	},
 *	"blueprintIds": []
 *}]
 *
 *
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'Chef Tasks'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Chef Tasks'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Chef Tasks'}
 *     };
 */

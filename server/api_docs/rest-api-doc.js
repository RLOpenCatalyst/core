
/**
 * @api {get} /organizations/:orgId/dockerContainerList
 * @apiName /organizations/:orgId/dockerContainerList
 * @apiGroup List of all Docker Containers via Organization Id
 *
 *
 * @apiParam {String} orgId          Unique Organization ID.
 *
 * @apiParamExample {url} Request-Example:
 *  http://localhost:3001/organizations/46d1da9a-d927-41dc-8e9e-7e926d927537/dockerContainerList
 *
 * @apiSuccess [JSONObject]
 *
 * @apiSuccessExample Success-Response:
 *   [{
 *	"_id": "5742a72c00e37ff25c4931f8",
 *	"orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
 *	"bgId": "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
 *	"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *	"envId": "1a5876c7-381e-4812-ab16-702d2f8d582b",
 *	"Id": "c5241a2f5bc2570b0904b22a1f0ca07afbb60b39973f5e48ae98e2659325c01d",
 *	"instanceIP": "54.153.67.114",
 *	"instanceId": "5742a70a00e37ff25c4931e5",
 *	"Image": "jenkins:latest",
 *	"ImageID": "sha256:77bd697ef2c3c008e5902b6c80e27d16f8a46aeb2e32a8e29f865872eb7f3d32",
 *	"Command": "/bin/tini -- /usr/local/bin/jenkins.sh",
 *	"Created": 1463985419,
 *	"Status": "Exited (1) 11 minutes ago",
 *	"containerStatus": "STOP",
 *	"HostConfig": {
 *		"NetworkMode": "default"
 *	},
 *	"__v": 0,
 *	"Labels": [],
 *	"Ports": [],
 *	"Names": ["jenkins"]
 *}, {
 *	"_id": "5742a72c00e37ff25c4931f9",
 *	"orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
 *	"bgId": "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
 *	"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *	"envId": "1a5876c7-381e-4812-ab16-702d2f8d582b",
 *	"Id": "6220541069efab05f14cc670460a8c36c8d504fc627a407aff5f221f968bbd17",
 *	"instanceIP": "54.153.67.114",
 *	"instanceId": "5742a70a00e37ff25c4931e5",
 *	"Image": "relevancelab/logstash01:latest",
 *	"ImageID": "sha256:5334bd987dfb9bcc1720ae85d301542f90e97ea5e7b013e4ef69763172d51a11",
 *	"Command": "/entry_script.sh bash",
 *	"Created": 1463984295,
 *	"Status": "Up 29 minutes",
 *	"containerStatus": "START",
 *	"HostConfig": {
 *		"NetworkMode": "default"
 *	},
 * 	"__v": 0,
 *	"Labels": [
 *		["com.docker.swarm.id", "839a3e68fe3e015caf6de4791b6a5306580d2fd513b010e8f582b97671928106"]
 *	],
 *	"Ports": [{
 *		"PrivatePort": 5000,
 *		"Type": "tcp"
 *	}],
 *	"Names": ["logstash01"]
 *}, {
 *	"_id": "5742a72c00e37ff25c4931fa",
 *	"orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
 *	"bgId": "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
 *	"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *	"envId": "1a5876c7-381e-4812-ab16-702d2f8d582b",
 *	"Id": "3f50db6a86f7950c0cc051b86f0f0e7f4276c66b26d85b71e04bd4dc5958c765",
 *	"instanceIP": "54.153.67.114",
 *	"instanceId": "5742a70a00e37ff25c4931e5",
 *	"Image": "ubuntu:latest",
 *	"ImageID": "sha256:c5f1cf30c96b5b55c0e6385f2ecb791790eacfdc874500ec3dd865789e358dd1",
 *	"Command": "/bin/bash",
 *	"Created": 1463984214,
 *	"Status": "Up 31 minutes",
 *	"containerStatus": "START",
 *	"HostConfig": {
 *		"NetworkMode": "default"
 *	},
 *	"__v": 0,
 *	"Labels": [],
 *	"Ports": [],
 *	"Names": ["ubuntu"]
 *}, {
 *	"_id": "5742a72c00e37ff25c4931fb",
 *	"orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
 *	"bgId": "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
 *	"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *	"envId": "1a5876c7-381e-4812-ab16-702d2f8d582b",
 *	"Id": "f3a1b55606eff71f2643f7c0f8af0b11482e8d4037df1b6f07674bad9fe6bc49",
 *	"instanceIP": "54.153.67.114",
 *	"instanceId": "5742a70a00e37ff25c4931e5",
 *	"Image": "centos:latest",
 *	"ImageID": "sha256:8596123a638e23837cc54dbaffccceedc4ce5452eee7f957e8aba93d79b9c6e8",
 *	"Command": "/bin/bash",
 *	"Created": 1463984161,
 *	"Status": "Up 32 minutes",
 *	"containerStatus": "START",
 *	"HostConfig": {
 *		"NetworkMode": "default"
 *	},
 *	"__v": 0,
 *	"Labels": [
 *		["build-date", "2016-05-16"],
 *		["license", "GPLv2"],
 *		["name", "CentOS Base Image"],
 *		["vendor", "CentOS"]
 *	],
 *	"Ports": [],
 *	"Names": ["Centos"]
 *}, {
 *	"_id": "5742a72c00e37ff25c4931fc",
 *	"orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
 *	"bgId": "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
 *	"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
 *	"envId": "1a5876c7-381e-4812-ab16-702d2f8d582b",
 *	"Id": "459d144c53ffdb33f2529b26c8824428dca793c9f99a767b6bc5eb3a6d2a2d3c",
 *	"instanceIP": "54.153.67.114",
 *	"instanceId": "5742a70a00e37ff25c4931e5",
 *	"Image": "java:latest",
 *	"ImageID": "sha256:6c9a006fd38ae2232176ebc7b09eb6cb8d97fbb003879e7d81ec6bb01916c948",
 *	"Command": "/bin/bash",
 *	"Created": 1463984127,
 *	"Status": "Up 32 minutes",
 *	"containerStatus": "START",
 *	"HostConfig": {
 *		"NetworkMode": "default"
 *	},
 *	"__v": 0,
 *	"Labels": [],
 *	"Ports": [],
 *	"Names": ["java"]
 *}]
 *
 * @apiError 400 Bad Request.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:400,
 *      message:'Bad Request',
 *      fields:{errorMessage:'Bad Request',attribute:'Container List'}
 *     };
 * @apiError 403 Forbidden.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:403,
 *      message:'Forbidden',
 *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Container List'}
 *     };
 * @apiError 404 Not Found.
 *
 * @apiErrorExample Error-Response:
 *    {
 *      code:404,
 *      message:'Not Found',
 *      fields:{errorMessage:'The requested resource could not be found but may be available in the future',attribute:'Container List'}
 *     };
 * @apiError 500 InternalServerError.
 *
 * @apiErrorExample Error-Response:
 *     {
 *      code:500,
 *      message:'Internal Server Error',
 *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Container List'}
 *     };
 */
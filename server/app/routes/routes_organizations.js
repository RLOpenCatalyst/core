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

// This file act as a Controller which contains organization related all end points.


var masterjsonDao = require('../model/d4dmasters/masterjson.js');
var configmgmtDao = require('../model/d4dmasters/configmgmt.js');
var Chef = require('_pr/lib/chef');
var Puppet = require('_pr/lib/puppet');
var blueprintsDao = require('../model/dao/blueprints');
var Blueprints = require('_pr/model/blueprint');
var usersDao = require('../model/users.js');
var instancesDao = require('../model/classes/instance/instance');
var containerDao = require('../model/container');
var appConfig = require('_pr/config');
var logger = require('_pr/logger')(module);
var uuid = require('node-uuid');
var fileIo = require('../lib/utils/fileio');
var logsDao = require('../model/dao/logsdao.js');
var errorResponses = require('./error_responses');
var credentialCryptography = require('../lib/credentialcryptography');
var d4dModelNew = require('../model/d4dmasters/d4dmastersmodelnew.js');
var Curl = require('../lib/utils/curl.js');
var waitForPort = require('wait-for-port');
var appCardsDao = require('../model/dao/appcarddao');
var Application = require('../model/classes/application/application');
var Task = require('../model/classes/tasks/tasks.js');
var masterUtil = require('../lib/utils/masterUtil.js');
var CloudFormation = require('_pr/model/cloud-formation');
var AzureArm = require('_pr/model/azure-arm');
var async = require('async');
var ApiUtils = require('_pr/lib/utils/apiUtil.js');
var orgValidator = require('_pr/validators/organizationValidator');
var validate = require('express-validation');
var	orgService = require('_pr/services/organizationService');

module.exports.setRoutes = function(app, sessionVerification) {

	app.all('/organizations/*', sessionVerification);

	app.get('/organizations/getTreeNew', function(req, res) {
		logger.debug("Enter get() for /organizations/getTreeNew");
		var loggedInUser = req.session.user.cn;
		masterUtil.getLoggedInUser(loggedInUser, function(err, anUser) {
			if (err) {
				res.status(500).send("Failed to fetch User.");
			}
			if (!anUser) {
				res.status(500).send("Invalid User.");
			}
			masterUtil.getAllSettingsForUser(loggedInUser, function(err, objperms) {
				var orgTree = [];
				var newTree = [];
				if (err) {
					logger.debug("Hit an error in getTeamsOrgBuProjForUser : " + err);
					res.send(orgTree);
					return;
				}
				if (JSON.stringify(objperms) === 'null' || objperms.length === 0) {
					logger.debug("getTeamsOrgBuProjForUser : is null" + err);
					res.send(orgTree);
					return;
				} else {
					logger.debug('Objperms:' + JSON.stringify(objperms));
					configmgmtDao.getRowids(function(err, rowidlist) {
						d4dModelNew.d4dModelMastersOrg.find({
							id: 1,
							active: true,
							rowid: {
								$in: objperms[0].orgs
							}
						}, function(err, docorgs) {
							var orgids = [];
							if (docorgs) {
								orgids = docorgs.map(function(docorgs1) {
									return docorgs1.rowid;
								});
							}
							var orgCount = 0;
							orgids.forEach(function(k, v) {
								logger.debug("Org v:%s", JSON.stringify(v));
								orgname = configmgmtDao.convertRowIDToValue(k, rowidlist);
								orgTree.push({
									name: orgname,
									orgid: k,
									rowid: k,
									businessGroups: [],
									environments: []
								});
							});
							orgCount++;
							d4dModelNew.d4dModelMastersProductGroup.find({
								id: 2,
								orgname_rowid: {
									$in: orgids
								},
								rowid: {
									$in: objperms[0].bunits
								}
							}, function(err, docbgs) {
								if (typeof docbgs === 'undefined' || docbgs.length <= 0) {
									res.send(orgTree);
									return;
								}
								var counter = 0;
								for (var k = 0; k < docbgs.length; k++) {
									for (var i = 0; i < orgTree.length; i++) {
										if (orgTree[i]['orgid'] == docbgs[k]['orgname_rowid']) {
											bgname = configmgmtDao.convertRowIDToValue(docbgs[k]['rowid'], rowidlist);
											orgTree[i]['businessGroups'].push({
												name: bgname,
												rowid: docbgs[k]['rowid'],
												projects: []
											});
											d4dModelNew.d4dModelMastersProjects.find({
												id: 4,
												orgname_rowid: orgTree[i]['rowid'],
												productgroupname_rowid: docbgs[k]['rowid']
											}, function(err, docprojs) {
												var prjids = docprojs.map(function(docprojs1) {
													return docprojs1.rowid;
												});

												for (var _i = 0; _i < orgTree.length; _i++) {
													logger.debug("Orgid:%s", orgTree[_i]['rowid']);
													for (var __i = 0; __i < orgTree[_i]['businessGroups'].length; __i++) {
														for (var _bg = 0; _bg < docprojs.length; _bg++) {
															if (docprojs[_bg]['orgname_rowid'] == orgTree[_i]['rowid'] && docprojs[_bg]['productgroupname_rowid'] == orgTree[_i]['businessGroups'][__i]['rowid']) {
																logger.debug("hit");
																if (orgTree[_i]['businessGroups'][__i]['projects'].length <= 0) {
																	for (var _prj = 0; _prj < docprojs.length; _prj++) {
																		var envsids = docprojs[_prj]['environmentname_rowid'].split(',');
																		var envs = '';
																		for (var _envid in envsids) {
																			var tempenvname = configmgmtDao.convertRowIDToValue(_envid, rowidlist);
																			if (envs == '') {
																				envs += tempenvname;
																			} else {
																				envs += ',' + tempenvname;
																			}
																		}
																		prjname = configmgmtDao.convertRowIDToValue(docprojs[_prj]['rowid'], rowidlist);
																		orgTree[_i]['businessGroups'][__i]['projects'].push({ //
																			name: prjname,
																			rowid: docprojs[_prj]['rowid'],
																			environments: envs
																		});
																	}

																}
															}
														}
													}
												}
												if (counter >= docbgs.length - 1) {
													d4dModelNew.d4dModelMastersEnvironments.find({
														id: 3,
														orgname_rowid: {
															$in: orgids
														},
														orgname_rowid: {
															$in: objperms[0].orgs
														}
													}, function(err, docenvs) {
														logger.debug('Env Count : ' + JSON.stringify(docenvs) + ' permission : ' + objperms.orgs);
														for (var _i = 0; _i < orgTree.length; _i++) {
															for (var _env = 0; _env < docenvs.length; _env++) {
																if (orgTree[_i]['rowid'] == docenvs[_env]['orgname_rowid']) {
																	var tenv = configmgmtDao.convertRowIDToValue(docenvs[_env]['rowid'], rowidlist)
																	orgTree[_i]['environments'].push({
																		name: tenv,
																		rowid: docenvs[_env]['rowid']
																	});
																}
															}
															logger.debug("Condition valu: ", _i, "  ", orgTree.length - 1);
															if (_i >= orgTree.length - 1) {

																for (var y = 0; y < orgTree.length; y++) {
																	newTree.push(orgTree[y]);
																}
																logger.debug("Exit get() for /organizations/getTreeNew");
																res.send(newTree);
																return;
															} else {
																// empty array
																res.send(newTree);
																return;
															}
														}
													});
												}
												counter++;
											});

										}

									}

								}
							});

						});
					});
				}
			}); //getTeamsOrgBuProjForUser
			//} //else
		}); // getLoggedInUser()
	});

	app.get('/organizations/getTreeForbtv', function(req, res) {
		logger.debug("Enter get() for /organizations/getTreeForbtv");
		var loggedInUser = req.session.user.cn;
		masterUtil.getLoggedInUser(loggedInUser, function(err, anUser) {
			if (err) {
				res.status(500).send("Failed to fetch User.");
				return;
			}
			if (!anUser) {
				res.status(500).send("Invalid User.");
				return;
			}
			logger.debug("Tree view for non catalystAdmin");
			var countAll = 0;
			masterUtil.getAllSettingsForUser(loggedInUser, function(err, objperms) {
				var orgTree = [];
				if (err) {
					logger.debug("Hit an error in getTeamsOrgBuProjForUser : " + err);
					res.send(orgTree);
					return;
				}
				if (JSON.stringify(objperms) === 'null' || objperms.length === 0) {
					logger.debug("No Object found.");
					res.send(orgTree);
					return;
				} else {
					configmgmtDao.getRowids(function(err, rowidlist) {
						d4dModelNew.d4dModelMastersOrg.find({
							id: 1,
							active: true,
							rowid: {
								$in: objperms[0].orgs
							}
						}, function(err, docorgs) {
							var orgids = docorgs.map(function(docorgs1) {
								return docorgs1.rowid;
							});


							var orgCount = 0;
							orgids.forEach(function(k, v) {
								var orgname = configmgmtDao.convertRowIDToValue(k, rowidlist);
								orgTree.push({
									name: orgname,
									text: orgname,
									rowid: k,
									href: 'javascript:void(0)',
									icon: 'fa fa-building ',
									nodes: [],
									borderColor: '#000',
									businessGroups: [],
									selectable: false,
									itemtype: 'org',
									environments: []
								});
							});
							orgCount++;
							logger.debug("Found Orgs");
							d4dModelNew.d4dModelMastersProductGroup.find({
								id: 2,
								orgname_rowid: {
									$in: orgids
								},
								rowid: {
									$in: objperms[0].bunits
								}
							}, function(err, docbgs) {
								if (docbgs.length <= 0) { //no bgs for any org return tree
									logger.debug("Not found any BUs returing empty orgs");
									res.send(orgTree);
									return;
								}
								var counter = 0;
								for (var k = 0; k < docbgs.length; k++) {
									countAll++;
									(function(k) {
										for (var i = 0; i < orgTree.length; i++) {
											(function(i) {
												if (orgTree[i]['rowid'] == docbgs[k]['orgname_rowid']) {
													var bgname = configmgmtDao.convertRowIDToValue(docbgs[k]['rowid'], rowidlist);
													orgTree[i]['businessGroups'].push({
														name: bgname,
														text: bgname,
														rowid: docbgs[k]['rowid'],
														href: 'javascript:void(0)',
														nodes: [],
														projects: []
													});
													orgTree[i]['nodes'].push({
														name: bgname,
														text: bgname.substring(0, 21),
														orgname: orgTree[i]['name'],
														orgid: orgTree[i]['rowid'],
														icon: 'fa fa-fw fa-1x fa-group',
														rowid: docbgs[k]['rowid'],
														borderColor: '#000',
														href: 'javascript:void(0)',
														nodes: [],
														selectable: false,
														itemtype: 'bg',
														projects: []
													});
													d4dModelNew.d4dModelMastersProjects.find({
														id: 4,
														orgname_rowid: orgTree[i]['rowid'],
														productgroupname_rowid: docbgs[k]['rowid'],
														rowid: {
															$in: objperms[0].projects
														}
													}, function(err, docprojs) {

														var prjids = docprojs.map(function(docprojs1) {
															return docprojs1.rowid;
														});
														logger.debug("Projects found:%s", prjids.length);
														for (var _i = 0; _i < orgTree.length; _i++) {
															for (var __i = 0; __i < orgTree[_i]['businessGroups'].length; __i++) {
																for (var _bg = 0; _bg < docprojs.length; _bg++) {

																	if (docprojs[_bg]['orgname_rowid'] == orgTree[_i]['rowid'] && docprojs[_bg]['productgroupname_rowid'] == orgTree[_i]['businessGroups'][__i]['rowid']) {
																		if (orgTree[_i]['businessGroups'][__i]['projects'].length <= 0) {
																			for (var _prj = 0; _prj < docprojs.length; _prj++) {
																				var envs = docprojs[_prj]['environmentname_rowid'].split(',');
																				var envs_ = [];
																				for (var nt = 0; nt < envs.length; nt++) {
																					//fixing the length of the env name
																					var envname = configmgmtDao.convertRowIDToValue(envs[nt], rowidlist);
																					var ttp = '';
																					if (envs[nt].length > 12) {
																						ttp = envname;
																					}
																					if (envname != '') { //was envs[nt].trim() != ''
																						envs_.push({
																							text: envname,
																							href: '#ajax/Dev.html?org=' + orgTree[_i]['rowid'] + '&bg=' + orgTree[_i]['businessGroups'][__i]['rowid'] + '&projid=' + docprojs[_prj]['rowid'] + '&envid=' + envs[nt],
																							orgname: orgTree[_i]['name'],
																							orgid: orgTree[_i]['rowid'],
																							rowid: envs[nt],
																							projname: docprojs[_prj]['projectname'],
																							bgname: orgTree[_i]['businessGroups'][__i]['name'],
																							itemtype: 'env',
																							tooltip: ttp,
																							icon: 'fa fa-fw fa-1x fa-desktop'
																						});
																					}
																				}
																				orgTree[_i]['businessGroups'][__i]['projects'].push({ //
																					name: docprojs[_prj]['projectname'],
																					environments: envs
																				});
																				if (!orgTree[_i].envId) {
																					orgTree[_i].bgId = orgTree[_i]['businessGroups'][__i]['rowid'];
																					orgTree[_i].projId = docprojs[_prj]['rowid'];
																					if (envs_.length) {
																						orgTree[_i].envId = envs_[0].rowid
																					}
																				}
																				var prjname = configmgmtDao.convertRowIDToValue(docprojs[_prj]['rowid'], rowidlist);
																				// get features.appcard from app.config

																				var selectable = !!appConfig.features.appcard
																				orgTree[_i]['nodes'][__i]['nodes'].push({ //
																					name: prjname,
																					text: prjname,
																					rowid: docprojs[_prj]['rowid'],
																					orgname: orgTree[_i]['name'],
																					orgid: orgTree[_i]['rowid'],
																					bgname: orgTree[_i]['businessGroups'][__i]['name'],
																					icon: 'fa fa-fw fa-1x fa-tasks',
																					nodes: envs_,
																					borderColor: '#000',
																					selectable: selectable,
																					itemtype: 'proj',
																					href: selectable ? '#ajax/ProjectSummary.html?org=' + orgTree[_i]['rowid'] + '&bg=' + orgTree[_i]['businessGroups'][__i]['rowid'] + '&projid=' + docprojs[_prj]['rowid'] : 'javascript:void(0)',
																					//background: '#40baf1',
																					//color: '#40baf1 !important',
																					environments: envs
																				});
																				//javascript:void(0) #ajax/ProjectSummary.html?projid=' + docprojs[_prj]['rowid']
																			}

																		}
																	}
																}
															}
														}
														logger.debug("OrgTree:%s", JSON.stringify(orgTree.length));
														if (counter >= docbgs.length - 1) {
															d4dModelNew.d4dModelMastersEnvironments.find({
																id: 3,
																orgname_rowid: {
																	$in: orgids
																}
															}, function(err, docenvs) {
																for (var _i = 0; _i < orgTree.length; _i++) {
																	(function(_i) {
																		for (var _env = 0; _env < docenvs.length; _env++) {
																			logger.debug("Condition check:>>>>> ", orgTree[_i]['name'] == docenvs[_env]['orgname']);
																			if (orgTree[_i]['name'] == docenvs[_env]['orgname']) {
																				var envname = configmgmtDao.convertRowIDToValue(docenvs[_env]['rowid'], rowidlist);
																				orgTree[_i]['environments'].push(envname);
																			}
																		}
																		if (_i === orgTree.length - 1) {
																			logger.debug("Exit get() for /organizations/getTreeForbtv");
																			res.send(orgTree);
																			return;
																		}
																	})(_i);
																}
															});
														}
														counter++;
													});
												}
											})(i);

										}
									})(k);
								}
							});

						});
					}); //getRowids
				} //end of else getTeamsOrgBuProjForUser err
			}); // getTeamsOrgBuProjForUser
			//} // else
		}); // check hasperm
	});


	app.get('/organizations/getTree', function(req, res) {
		logger.debug("Enter get() for /organizations/getTree");
		d4dModelNew.d4dModelMastersOrg.find({
			id: 1,

		}, function(err, docorgs) {
			var orgnames = docorgs.map(function(docorgs1) {
				return docorgs1.orgname;
			});

			var orgTree = [];
			var orgCount = 0;
			orgnames.forEach(function(k, v) {
				orgTree.push({
					name: k,
					businessGroups: [],
					environments: []
				});
			});
			orgCount++;
			d4dModelNew.d4dModelMastersProductGroup.find({
				id: 2,
				orgname: {
					$in: orgnames
				}
			}, function(err, docbgs) {
				var counter = 0;
				for (var k = 0; k < docbgs.length; k++) {
					for (var i = 0; i < orgTree.length; i++) {
						if (orgTree[i]['name'] == docbgs[k]['orgname']) {
							orgTree[i]['businessGroups'].push({
								name: docbgs[k]['productgroupname'],
								projects: []
							});
							d4dModelNew.d4dModelMastersProjects.find({
								id: 4,
								orgname: orgTree[i]['name'],
								productgroupname: docbgs[k]['productgroupname']
							}, function(err, docprojs) {
								var prjnames = docprojs.map(function(docprojs1) {
									return docprojs1.projectname;
								});

								for (var _i = 0; _i < orgTree.length; _i++) {
									logger.debug("Orgnames:%s", orgTree[_i]['name']);
									for (var __i = 0; __i < orgTree[_i]['businessGroups'].length; __i++) {
										logger.debug("businessGroups:%s%s and docprojs.length:%s", orgTree[_i]['businessGroups'], [__i]['name'], docprojs.length);
										for (var _bg = 0; _bg < docprojs.length; _bg++) {

											if (docprojs[_bg]['orgname'] == orgTree[_i]['name'] && docprojs[_bg]['productgroupname'] == orgTree[_i]['businessGroups'][__i]['name']) {
												if (orgTree[_i]['businessGroups'][__i]['projects'].length <= 0) {
													for (var prjname in prjnames)
														orgTree[_i]['businessGroups'][__i]['projects'].push(prjnames[prjname]);
												}

												logger.debug("Env:%s", docprojs[_bg]['environmentname']);
											}
										}
									}
								}
								logger.debug("OrgTree:%s", JSON.stringify(orgTree));
								if (counter >= docbgs.length - 1) {
									d4dModelNew.d4dModelMastersEnvironments.find({
										id: 3,
										orgname: {
											$in: orgnames
										}
									}, function(err, docenvs) {
										for (var _i = 0; _i < orgTree.length; _i++) {
											for (var _env = 0; _env < docenvs.length; _env++) {
												if (orgTree[_i]['name'] == docenvs[_env]['orgname']) {
													orgTree[_i]['environments'].push(docenvs[_env]['environmentname']);
												}
											}
											if (_i >= orgTree.length - 1) {
												res.send(orgTree);
												logger.debug("Exit get() for /organizations/getTree");
												return;
											}
										}
									});

								}
								counter++;
							});

						}

					}

				}
			});
		});
	});

	app.get('/organizations/getTreeOld', function(req, res) {
		logger.debug("Enter get() for /organizations/getTreeOld");
		masterjsonDao.getMasterJson("1", function(err, orgsJson) {
			if (err) {
				res.send(500);
				return;
			}
			var orgTree = [];

			if (orgsJson.masterjson && orgsJson.masterjson.rows && orgsJson.masterjson.rows.row) {
				for (var i = 0; i < orgsJson.masterjson.rows.row.length; i++) {
					for (var j = 0; j < orgsJson.masterjson.rows.row[i].field.length; j++) {
						if (orgsJson.masterjson.rows.row[i].field[j].name = "orgname") {
							orgTree.push({
								name: orgsJson.masterjson.rows.row[i].field[j].values.value,
								businessGroups: [],
								environments: []
							});
							break;
						}
					}
				}

				masterjsonDao.getMasterJson("2", function(err, buJson) {
					if (err) {
						res.send(500);
						return;
					}
					if (buJson.masterjson && buJson.masterjson.rows && buJson.masterjson.rows.row) {
						for (var i = 0; i < orgTree.length; i++) {
							for (var j = 0; j < buJson.masterjson.rows.row.length; j++) {
								var isFilterdRow = false;
								var orgname = '';
								for (var k = 0; k < buJson.masterjson.rows.row[j].field.length; k++) {
									if (buJson.masterjson.rows.row[j].field[k].name == "orgname") {
										if (orgTree[i].name == buJson.masterjson.rows.row[j].field[k].values.value) {
											isFilterdRow = true;
											break;
										}
									}
								}
								if (isFilterdRow) {
									for (var k = 0; k < buJson.masterjson.rows.row[j].field.length; k++) {
										if (buJson.masterjson.rows.row[j].field[k].name == "productgroupname") {
											orgTree[i].businessGroups.push({
												name: buJson.masterjson.rows.row[j].field[k].values.value,
												projects: []
											});
											break;
										}
									}
								}
							}
						}

						//getting projects
						masterjsonDao.getMasterJson("4", function(err, buJson) {
							if (err) {
								res.send(500);
								return;
							}
							if (buJson.masterjson && buJson.masterjson.rows && buJson.masterjson.rows.row) {
								for (var i = 0; i < orgTree.length; i++) {
									if (orgTree[i].businessGroups.length) {
										var businessGroups = orgTree[i].businessGroups;
										for (var j = 0; j < businessGroups.length; j++) {
											for (var k = 0; k < buJson.masterjson.rows.row.length; k++) {
												var isFilterdRow = false;
												for (var l = 0; l < buJson.masterjson.rows.row[k].field.length; l++) {
													if (buJson.masterjson.rows.row[k].field[l].name == "productgroupname") {
														if (businessGroups[j].name == buJson.masterjson.rows.row[k].field[l].values.value) {
															isFilterdRow = true;
															break;
														}
													}
												}
												if (isFilterdRow) {
													for (var l = 0; l < buJson.masterjson.rows.row[k].field.length; l++) {
														if (buJson.masterjson.rows.row[k].field[l].name == "projectname") {
															businessGroups[j].projects.push(buJson.masterjson.rows.row[k].field[l].values.value);
															break;
														}
													}
												}
											}

										}
									}

								}
								//getting environments
								masterjsonDao.getMasterJson("3", function(err, buJson) {
									if (err) {
										res.send(500);
										return;
									}
									if (buJson.masterjson && buJson.masterjson.rows && buJson.masterjson.rows.row) {
										for (var i = 0; i < orgTree.length; i++) {
											for (var j = 0; j < buJson.masterjson.rows.row.length; j++) {
												var isFilterdRow = false;
												var orgname = '';
												for (var k = 0; k < buJson.masterjson.rows.row[j].field.length; k++) {
													if (buJson.masterjson.rows.row[j].field[k].name == "orgname") {
														if (orgTree[i].name == buJson.masterjson.rows.row[j].field[k].values.value) {
															isFilterdRow = true;
															break;
														}
													}
												}
												if (isFilterdRow) {
													for (var k = 0; k < buJson.masterjson.rows.row[j].field.length; k++) {
														if (buJson.masterjson.rows.row[j].field[k].name == "environmentname") {
															orgTree[i].environments.push(buJson.masterjson.rows.row[j].field[k].values.value);
															break;
														}
													}
												}
											}
										}
									}
									res.send(orgTree);
								});

							}

						});
					}
				});

			} else {
				res.send(orgTree);
			}
			logger.debug("Exit get() for /organizations/getTreeOld");
		});

	});


	app.get('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/blueprints', function(req, res) {
		logger.debug("Enter get() for /organizations/%s/businessgroups/%s/projects/%s/environments/%s/blueprints", req.params.orgId, req.params.bgId, req.params.projectId, req.params.envId);
		//getting the list of projects and confirming if user has permission on project

		blueprintsDao.getBlueprintsByOrgBgProjectAndEnvId(req.params.orgId, req.params.bgId, req.params.projectId, req.params.envId, req.query.blueprintType, req.session.user.cn, function(err, data) {
			if (err) {
				res.send(500);
				return;
			}
			res.send(data);
		});

		logger.debug("Exit get() for /organizations/%s/businessgroups/%s/projects/%s/environments/%s/blueprints", req.params.orgId, req.params.bgId, req.params.projectId, req.params.envId);
	});


	app.post('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/blueprints', function(req, res) {
		logger.debug("Enter post() for /organizations/%s/businessgroups/%s/projects/%s/environments/%s/blueprints", req.params.orgId, req.params.bgId, req.params.projectId, req.params.envId, req.params.providerId, req.params.imageId);

		//validating if user has permission to save a blueprint
		logger.debug('Verifying User permission set');
		console.log(req.body);
		console.log(JSON.stringify(req.body));
		var user = req.session.user;
		var category = 'blueprints';
		var permissionto = 'create';
		var orgId = req.params.orgId;
		var bgId = req.params.bgId;
		var projectId = req.params.projectId;
		var name = req.body.blueprintData.name;
		var appUrls = req.body.blueprintData.appUrls;
		var iconpath = req.body.blueprintData.iconpath;
		var templateId = req.body.blueprintData.templateId;
		var templateType = req.body.blueprintData.templateType;
		var users = req.body.blueprintData.users || [];
		var blueprintType = req.body.blueprintData.blueprintType;
        var nexus = req.body.blueprintData.nexus;
        var docker = req.body.blueprintData.docker;

		// a temp fix for invalid appurl data. will be removed in next iteration
		var tempAppUrls = [];
		if (!appUrls) {
			appUrls = []
		}
		for (var i = 0; i < appUrls.length; i++) {
			if (appUrls[i]) {
				tempAppUrls.push(appUrls[i]);
			}
		}
		appUrls = tempAppUrls;

		usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function(err, data) {
			if (!err) {
				logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
				if (data == false) {
					logger.debug('No permission to ' + permissionto + ' on ' + category);
					res.send(401);

					return;
				}
			} else {
				logger.error("Hit and error in haspermission:", err);
				res.send(500);
				return;
			}
			logger.debug("Provider Id: ", req.body.providerId);
			if (!req.body.blueprintData.runlist) {
				req.body.blueprintData.runlist = [];
			}
			var blueprintData = {
				orgId: orgId,
				bgId: bgId,
				projectId: projectId,
				name: name,
				appUrls: appUrls,
				iconpath: iconpath,
				templateId: templateId,
				templateType: templateType,
				users: users,
				blueprintType: blueprintType,
                nexus: nexus,
                docker: docker
			};

			logger.debug('req blueprintData:', blueprintData);
			var dockerData, instanceData;
			logger.debug('req.body.blueprintData.blueprintType:', blueprintType);
			if (blueprintType === 'docker') {
				dockerData = {
					dockerContainerPathsTitle: req.body.blueprintData.dockercontainerpathstitle,
					dockerContainerPaths: req.body.blueprintData.dockercontainerpaths,
					dockerLaunchParameters: req.body.blueprintData.dockerlaunchparameters,
					dockerRepoName: req.body.blueprintData.dockerreponame,
					dockerCompose: req.body.blueprintData.dockercompose,
					dockerRepoTags: req.body.blueprintData.dockerrepotags,
					dockerImageName: req.body.blueprintData.dockerimagename,
				};
				blueprintData.dockerData = dockerData;

			} else if (blueprintType === 'instance_launch') {
				logger.debug('req.body.blueprintData.blueprintType ==>', blueprintType);
				instanceData = {
					keyPairId: req.body.blueprintData.keyPairId,
					securityGroupIds: req.body.blueprintData.securityGroupIds,
					instanceType: req.body.blueprintData.instanceType,
					instanceAmiid: req.body.blueprintData.instanceAmiid,
					instanceUsername: 'root',
					vpcId: req.body.blueprintData.vpcId,
					subnetId: req.body.blueprintData.subnetId,
					imageId: req.body.blueprintData.imageId,
					cloudProviderType: 'aws',
					cloudProviderId: req.body.blueprintData.providerId,
					infraManagerType: 'chef',
					infraManagerId: req.body.blueprintData.chefServerId,
					runlist: req.body.blueprintData.runlist,
					instanceOS: req.body.blueprintData.instanceOS,
					instanceCount: req.body.blueprintData.instanceCount
				}
				blueprintData.instanceData = instanceData;
			} else if (blueprintType === 'openstack_launch') {
				logger.debug('req.body.blueprintData.blueprintType ==>', blueprintType);
				instanceData = {
					instanceImageID: req.body.blueprintData.imageIdentifier,
					flavor: req.body.blueprintData.openstackflavor,
					network: req.body.blueprintData.openstacknetwork,
					securityGroupIds: req.body.blueprintData.openstacksecurityGroupIds,
					subnet: req.body.blueprintData.openstacksubnet,
					instanceOS: req.body.blueprintData.instanceOS,
					instanceCount: req.body.blueprintData.instanceCount,
					cloudProviderType: 'openstack',
					cloudProviderId: req.body.blueprintData.providerId,
					infraManagerType: 'chef',
					infraManagerId: req.body.blueprintData.chefServerId,
					runlist: req.body.blueprintData.runlist,
					instanceImageName: req.body.blueprintData.instanceImageName

				}
				blueprintData.instanceData = instanceData;
			} else if (blueprintType === 'hppubliccloud_launch') {
				logger.debug('req.body.blueprintData.blueprintType ==>', blueprintType);
				instanceData = {
					instanceImageID: req.body.blueprintData.imageIdentifier,
					flavor: req.body.blueprintData.openstackflavor,
					network: req.body.blueprintData.openstacknetwork,
					securityGroupIds: req.body.blueprintData.openstacksecurityGroupIds,
					subnet: req.body.blueprintData.openstacksubnet,
					instanceOS: req.body.blueprintData.instanceOS,
					instanceCount: req.body.blueprintData.instanceCount,
					cloudProviderType: 'hppubliccloud',
					cloudProviderId: req.body.blueprintData.providerId,
					infraManagerType: 'chef',
					infraManagerId: req.body.blueprintData.chefServerId,
					runlist: req.body.blueprintData.runlist,
					instanceImageName: req.body.blueprintData.instanceImageName

				}
				blueprintData.instanceData = instanceData;
			} else if (blueprintType === 'azure_launch') {
				logger.debug('req.body.blueprintData.blueprintType ==>', blueprintType);
				instanceData = {
					securityGroupIds: req.body.blueprintData.securityGroupPorts,
					instanceType: req.body.blueprintData.instanceType,
					instanceAmiid: req.body.blueprintData.instanceAmiid,
					vpcId: req.body.blueprintData.vpcId,
					subnetId: req.body.blueprintData.subnetId,
					imageId: req.body.blueprintData.imageId,
					region: req.body.blueprintData.region,
					cloudProviderType: 'azure',
					cloudProviderId: req.body.blueprintData.providerId,
					infraManagerType: 'chef',
					infraManagerId: req.body.blueprintData.chefServerId,
					runlist: req.body.blueprintData.runlist,
					instanceOS: req.body.blueprintData.instanceOS,
					instanceCount: req.body.blueprintData.instanceCount
				}
				blueprintData.instanceData = instanceData;
			} else if (blueprintType === 'vmware_launch') {
				logger.debug('req.body.blueprintData.blueprintType ==>', blueprintType);
				instanceData = {
					dataStore: req.body.blueprintData.datastore,
					imageId: req.body.blueprintData.imageId,
					cloudProviderType: 'vmware',
					cloudProviderId: req.body.blueprintData.providerId,
					infraManagerType: 'chef',
					infraManagerId: req.body.blueprintData.chefServerId,
					runlist: req.body.blueprintData.runlist,
					instanceOS: req.body.blueprintData.instanceOS,
					instanceCount: req.body.blueprintData.instanceCount
				}
				blueprintData.instanceData = instanceData;
			} else if (blueprintType === 'aws_cf') {
				logger.debug('templateFile ==> ', req.body.blueprintData.cftTemplateFile);
				cloudFormationData = {
					cloudProviderId: req.body.blueprintData.cftProviderId,
					infraManagerType: 'chef',
					infraManagerId: req.body.blueprintData.chefServerId,
					runlist: req.body.blueprintData.runlist,
					stackParameters: req.body.blueprintData.cftStackParameters,
					templateFile: req.body.blueprintData.cftTemplateFile,
					region: req.body.blueprintData.region,
					instances: req.body.blueprintData.cftInstances
				}
				blueprintData.cloudFormationData = cloudFormationData;
			} else if (req.body.blueprintData.blueprintType === 'azure_arm') {
				armTemplateData = {
					cloudProviderId: req.body.blueprintData.cftProviderId,
					infraManagerType: 'chef',
					infraManagerId: req.body.blueprintData.chefServerId,
					runlist: req.body.blueprintData.runlist,
					stackParameters: req.body.blueprintData.cftStackParameters,
					//stackName: req.body.blueprintData.stackName,
					templateFile: req.body.blueprintData.cftTemplateFile,
					resourceGroup: req.body.blueprintData.resourceGroup,
					//instanceUsername: req.body.blueprintData.cftInstanceUserName
					instances: req.body.blueprintData.cftInstances
				}
				blueprintData.armTemplateData = armTemplateData;
			} else {
				res.status(400).send({
					message: "Invalid Blueprint Type"
				});
				return;
			}
			// if (!blueprintData.users || !blueprintData.users.length) {
			// 	res.status(400).send({
			// 		message: "User is empty"
			// 	});
			// 	return;
			// }
			Blueprints.createNew(blueprintData, function(err, data) {
				if (err) {
					logger.error('error occured while saving blueorint', err);
					res.status(500).send({
						message: "DB error"
					});
					return;
				}

				res.send(data);
			});

			logger.debug("Exit post() for /organizations/%s/businessgroups/%s/projects/%s/environments/%s/providers/%s/images/%s/blueprints", req.params.orgId, req.params.bgId, req.params.projectId, req.params.envId, req.params.providerId, req.params.imageId);
		});
	});



	app.get('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/instances', function(req, res) {
		var jsonData={};
		jsonData['orgId']=req.params.orgId;
		jsonData['bgId']=req.params.bgId;
		jsonData['projectId']=req.params.projectId;
		jsonData['envId']=req.params.envId;
		jsonData['instanceType']=req.query.instanceType;
		jsonData['userName']=req.session.user.cn;
		jsonData['id']='instances';
		instancesDao.getInstancesByOrgBgProjectAndEnvId(jsonData, function(err, instancedata) {
			if (err) {
				res.send(500);
				return;
			}
			res.send(instancedata);
		});
	});

	app.get('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/tasks', function(req, res) {
		var jsonData={};
		jsonData['orgId']=req.params.orgId;
		jsonData['bgId']=req.params.bgId;
		jsonData['projectId']=req.params.projectId;
		jsonData['envId']=req.params.envId;
		Task.getTasksByOrgBgProjectAndEnvId(jsonData,function(err, taskdata) {
			if (err) {
				res.send(500);
				return;
			}
			res.send(taskdata);
		});
	});

	app.get('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/applications', function(req, res) {
		var jsonData={};
		jsonData['orgId']=req.params.orgId;
		jsonData['bgId']=req.params.bgId;
		jsonData['projectId']=req.params.projectId;
		Application.getAppCardsByOrgBgAndProjectId(jsonData, function(err, applications) {
			if (err) {
				res.send(500);
				return;
			}
			res.send(applications);
		});
	});

	app.get('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/instanceList',validate(orgValidator.get),getInstanceList);
	

    function getInstanceList(req, res, next) {
		var reqData={};
		async.waterfall(
			[
				function(next) {
					ApiUtils.paginationRequest(req.query,'instances',next);
				},
				function(paginationReq,next){
					paginationReq['orgId']=req.params.orgId;
			        paginationReq['bgId']=req.params.bgId;
			        paginationReq['projectId']=req.params.projectId;
			        paginationReq['envId']=req.params.envId;
			        paginationReq['instanceType']=req.query.instanceType;
			        paginationReq['userName']=req.session.user.cn;
					reqData=paginationReq;
					instancesDao.getInstancesByOrgBgProjectAndEnvId(paginationReq,next);
				},
				function(instances,next){
					ApiUtils.paginationResponse(instances,reqData,next);
				}

			], function(err, results) {
				if(err)
					next(err);
				else
					return res.status(200).send(results);
			});
	}

	app.get('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/taskList',validate(orgValidator.get), getTaskList);
		

	function getTaskList(req, res, next) {
		var reqData={};
		async.waterfall(
			[
				function(next) {
					ApiUtils.paginationRequest(req.query,'tasks',next);
				},
				function(paginationReq,next){
					paginationReq['orgId']=req.params.orgId;
			        paginationReq['bgId']=req.params.bgId;
			        paginationReq['projectId']=req.params.projectId;
			        paginationReq['envId']=req.params.envId;
					reqData=paginationReq;
					Task.getTasksByOrgBgProjectAndEnvId(paginationReq,next);
				},
				function(tasks,next){
					ApiUtils.paginationResponse(tasks,reqData,next);
				}

			], function(err, results) {
				if(err)
					next(err);
				else
					return res.status(200).send(results);
			});
	}

   	app.get('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/chefTasks',validate(orgValidator.get), getChefTaskList);
   	function getChefTaskList(req,res,next){
   		var jsonData={};
   		jsonData['orgId']=req.params.orgId;
	    jsonData['bgId']=req.params.bgId;
	    jsonData['projectId']=req.params.projectId;
		jsonData['envId']=req.params.envId;
		orgService.getChefTasksByOrgBgProjectAndEnvId(jsonData, function(err, chefTasks) {
			if (err) {
				logger.err(err);
				res.send(500);
				return;
			}
			res.send(chefTasks);
		});
	}

	app.get('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/applicationList',validate(orgValidator.applications), getApplicationList);
	 
    function getApplicationList(req, res, next) {
		var reqData={};
		async.waterfall(
			[
				function(next) {
					ApiUtils.paginationRequest(req.query,'applications',next);
				},
				function(paginationReq,next){
					paginationReq['orgId']=req.params.orgId;
			        paginationReq['bgId']=req.params.bgId;
			        paginationReq['projectId']=req.params.projectId;
					reqData=paginationReq;
					Application.getAppCardsByOrgBgAndProjectId(paginationReq,next);
				},
				function(applications,next){
					ApiUtils.paginationResponse(applications,reqData,next);
				}

			], function(err, results) {
				if(err)
					next(err);
				else
					return res.status(200).send(results);
			});
	}





	app.get('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/applications/:applicationId/build/:buildId', function(req, res) {
		Application.getApplicationById(req.params.applicationId, function(err, application) {
			if (err) {
				res.status(500).send(errorResponses.db.error);
				return;
			}
			if (application) {
				application.getBuild(function(err, build) {
					if (err) {
						res.status(500).send(errorResponses.db.error);
						return;
					}
					res.send(build)
				});
			} else {
				res.send(404, {
					message: "application not founds"
				});
			}
		});
	});

	app.post('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/applications', function(req, res) {
		logger.debug(req.files);
		logger.debug(req.body.appData);
		logger.debug("Enter post() for /organizations/%s/businessgroups/%s/projects/%s/applications", req.params.orgId, req.params.bgId, req.params.projectId);
		var appData = req.body.appData;
		appData.orgId = req.params.orgId;
		appData.bgId = req.params.bgId;
		appData.projectId = req.params.projectId;
		Application.createNew(appData, function(err, data) {
			if (err) {
				res.send(500);
				return;
			}
			res.send(data);
		});
		logger.debug("Exit post() for /organizations/%s/businessgroups/%s/projects/%s/applications", req.params.orgId, req.params.bgId, req.params.projectId);
	});


	app.get('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/', function(req, res) {
		var jsonData={};
		jsonData['orgId']=req.params.orgId;
		jsonData['bgId']=req.params.bgId;
		jsonData['projectId']=req.params.projectId;
		jsonData['envId']=req.params.envId;
		jsonData['instanceType']=req.params.instanceType;
		jsonData['userName']=req.session.user.cn;
		jsonData['blueprintType']=req.query.blueprintType

		configmgmtDao.getTeamsOrgBuProjForUser(req.session.user.cn, function(err, orgbuprojs) {
			if (orgbuprojs.length === 0) {
				res.send(401, "User not part of team to see project.");
				return;
			}
			if (!err) {
				if (typeof orgbuprojs[0].projects !== "undefined" && orgbuprojs[0].projects.indexOf(req.params.projectId) >= 0) {
					async.parallel({
							tasks:function(callback) {
								Task.getTasksByOrgBgProjectAndEnvId(jsonData, callback)
							},
							instances:function(callback) {
								instancesDao.getInstancesByOrgBgProjectAndEnvId(jsonData, callback)
							},
					        blueprints:function(callback) {
								Blueprints.getBlueprintsByOrgBgProject(jsonData, callback)
							},
							stacks:function(callback) {
								CloudFormation.findByOrgBgProjectAndEnvId(jsonData, callback)
							},
							arms:	function(callback) {
								AzureArm.findByOrgBgProjectAndEnvId(jsonData, callback)
							}
						},
						function(err, results){
							if(err)
								res.status(500).send("Internal Server Error");
							else if(!results)
								res.status(400).send("Data Not Found");
							else
							    res.status(200).send(results);
						}
					);

				}
				else {
					res.status(401).send("User not part of team to see project");
					return;
				}
			} else {
				res.status(500).send("Internal Server Error");
				return;
			}
		});
	});

	app.post('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/tasks', function(req, res) {
		logger.debug("Enter post() for /organizations/%s/businessGroups/%s/projects/%s/environments/%s/tasks", req.params.orgId, req.params.bgId, req.params.projectId, req.params.environments);
		var taskData = req.body.taskData;
		taskData.orgId = req.params.orgId;
		taskData.bgId = req.params.bgId;
		taskData.projectId = req.params.projectId;
		taskData.envId = req.params.envId;
		taskData.autoSyncFlag = req.body.taskData.autoSyncFlag;
		Task.createNew(taskData, function(err, task) {
			if (err) {
				logger.err(err);
				res.send(500);
				return;
			}
			res.send(task);
			logger.debug("Exit post() for /organizations/%s/businessGroups/%s/projects/%s/environments/%s/tasks", req.params.orgId, req.params.bgId, req.params.projectId, req.params.environments);
		});
	});




	app.get('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/cftList',validate(orgValidator.get), getCftList);
  
    function getCftList(req, res, next) {
		var reqData={};
		async.waterfall(
			[
				function(next) {
					ApiUtils.paginationRequest(req.query,'cftList',next);
				},
				function(paginationReq,next){
					paginationReq['orgId']=req.params.orgId;
			        paginationReq['bgId']=req.params.bgId;
			        paginationReq['projectId']=req.params.projectId;
			        paginationReq['envId']=req.params.envId;
					reqData=paginationReq;
					CloudFormation.findByOrgBgProjectAndEnvId(paginationReq,next);
				},
				function(cftData,next){
					ApiUtils.paginationResponse(cftData,reqData,next);
				}

			], function(err, results) {
				if(err)
					next(err);
				else
					return res.status(200).send(results);
			});
	}

	app.get('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/azureArmList',validate(orgValidator.get), getAzureArmList);

	function getAzureArmList(req, res, next) {
		var reqData={};
		async.waterfall(
			[
				function(next) {
					ApiUtils.paginationRequest(req.query,'azurearms',next);
				},
				function(paginationReq,next){
					paginationReq['orgId']=req.params.orgId;
			        paginationReq['bgId']=req.params.bgId;
			        paginationReq['projectId']=req.params.projectId;
			        paginationReq['envId']=req.params.envId;
					reqData=paginationReq;
					AzureArm.findByOrgBgProjectAndEnvId(paginationReq,next);
				},
				function(armsData,next){
					ApiUtils.paginationResponse(armsData,reqData,next);
				}

			], function(err, results) {
				if(err)
					next(err);
				else
					return res.status(200).send(results);
			});
	}

	app.get('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/containerList',validate(orgValidator.get), getContainerList);

	function getContainerList(req, res, next) {
		var reqData={};
		async.waterfall(
			[
				function(next) {
					ApiUtils.paginationRequest(req.query,'containerList',next);
				},
				function(paginationReq,next){
					paginationReq['orgId']=req.params.orgId;
					paginationReq['bgId']=req.params.bgId;
					paginationReq['projectId']=req.params.projectId;
					paginationReq['envId']=req.params.envId;
					reqData=paginationReq;
					containerDao.getContainerListByOrgBgProjectAndEnvId(paginationReq,next);
				},
				function(containerData,next){
						ApiUtils.paginationResponse(containerData,reqData,next);
				}

			], function(err, results) {
				if(err)
					next(err);
				else
					return res.status(200).send(results);
			});
	}












	app.get('/organizations/:orgId/chefserver', function(req, res) {
		logger.debug("Enter get() for /organizations/%s/chefserver", req.params.orgId);
		configmgmtDao.getChefServerDetailsByOrgname(req.params.orgId, function(err, chefDetails) {
			if (err) {
				res.send(500);
				return;
			}
			logger.debug("chefdata%s", chefDetails);
			if (!chefDetails) {
				res.send(404);
				return;
			} else {
				res.send(chefDetails);
				logger.debug("Exit get() for /organizations/%s/chefserver", req.params.orgId);
			}
		});
	});

	app.get('/organizations/:orgname/cookbooks', function(req, res) {
		logger.debug("Enter get() for /organizations/%s/cookbooks", req.params.orgname);
		configmgmtDao.getChefServerDetailsByOrgname(req.params.orgname, function(err, chefDetails) {
			if (err) {
				res.send(500);
				logger.error(err);
				return;
			}
			logger.debug("chefdata%s", chefDetails);


			if (!chefDetails) {
				res.send(404);
				return;
			}

			var chef = new Chef({
				userChefRepoLocation: chefDetails.chefRepoLocation,
				chefUserName: chefDetails.loginname,
				chefUserPemFile: chefDetails.userpemfile,
				chefValidationPemFile: chefDetails.validatorpemfile,
				hostedChefUrl: chefDetails.url,
			});

			chef.getCookbooksList(function(err, cookbooks) {

				if (err) {
					logger.error('Unable to fetch cookbooks : ', err);
					res.send(500);
					return;
				} else {
					res.send({
						serverId: chefDetails.rowid,
						cookbooks: cookbooks
					});
					logger.debug("Exit get() for /organizations/%s/cookbooks", req.params.orgname);
				}
			});

		});

	});

	app.get('/organizations/:orgname/roles', function(req, res) {
		logger.debug("Enter get() for /organizations/%s/roles", req.params.orgname);
		configmgmtDao.getChefServerDetailsByOrgname(req.params.orgname, function(err, chefDetails) {
			if (err) {
				res.send("There is some Internal Server Error. ", 500);
				return;
			}
			logger.debug("chefdata", chefDetails);

			if (!chefDetails) {
				res.send(404);
				return;
			}
			var chef = new Chef({
				userChefRepoLocation: chefDetails.chefRepoLocation,
				chefUserName: chefDetails.loginname,
				chefUserPemFile: chefDetails.userpemfile,
				chefValidationPemFile: chefDetails.validatorpemfile,
				hostedChefUrl: chefDetails.url,
			});

			chef.getRolesList(function(err, roles) {
				if (err) {
					logger.error('Unable to fetch roles : ', err);
					res.send(500);
					return;
				} else {
					res.send({
						serverId: chefDetails.rowid,
						roles: roles
					});
					logger.debug("Exit get() for /organizations/%s/roles", req.params.orgname);
				}
			});
		});
	});

	app.get('/organizations/:orgname/chefRunlist', function(req, res) {
		logger.debug("Enter get() for /organizations/%s/chefRunlist", req.params.orgname);
		configmgmtDao.getChefServerDetailsByOrgname(req.params.orgname, function(err, chefDetails) {
			if (err) {
				res.status(500).send(errorResponses.db.error);
				return;
			}
			logger.debug("chefdata", chefDetails);
			if (!chefDetails) {
				res.send(404, errorResponses.db.error);
				return;
			}
			var chef = new Chef({
				userChefRepoLocation: chefDetails.chefRepoLocation,
				chefUserName: chefDetails.loginname,
				chefUserPemFile: chefDetails.userpemfile,
				chefValidationPemFile: chefDetails.validatorpemfile,
				hostedChefUrl: chefDetails.url,
			});

			chef.getCookbooksList(function(err, cookbooks) {

				if (err) {
					logger.error('Unable to fetch cookbooks : ', err);
					res.status(500).send(errorResponses.chef.connectionError);
					return;
				} else {
					chef.getRolesList(function(err, roles) {

						if (err) {
							logger.error('Unable to fetch roles : ', err);
							res.status(500).send(errorResponses.chef.connectionError);
							return;
						} else {
							res.send({
								serverId: chefDetails.rowid,
								roles: roles,
								cookbooks: cookbooks
							});
							logger.debug("Exit get() for /organizations/%s/chefRunlist", req.params.orgname);
						}
					});
				}
			});

		});

	});
	app.get('/organizations/usechefserver/:chefserverid/chefRunlist', function(req, res) {
		logger.debug("Enter get() for /organizations/usechefserver/%s/chefRunlist", req.params.orgname);
		configmgmtDao.getChefServerDetails(req.params.chefserverid, function(err, chefDetails) {
			if (err) {
				res.send(500);
				return;
			}
			logger.debug("chefdata", chefDetails);

			if (!chefDetails) {
				res.send(404);
				return;
			}
			var chef = new Chef({
				userChefRepoLocation: chefDetails.chefRepoLocation,
				chefUserName: chefDetails.loginname,
				chefUserPemFile: chefDetails.userpemfile,
				chefValidationPemFile: chefDetails.validatorpemfile,
				hostedChefUrl: chefDetails.url,
			});

			chef.getCookbooksList(function(err, cookbooks) {
				if (err) {
					logger.error('Unable to fetch cookbooks : ', err);
					res.send(500);
					return;
				} else {
					chef.getRolesList(function(err, roles) {

						if (err) {
							logger.error('Unable to fetch roles : ', err);
							res.send(500);
							return;
						} else {
							res.send({
								serverId: chefDetails.rowid,
								roles: roles,
								cookbooks: cookbooks
							});
							logger.debug("Exit get() for /organizations/usechefserver/%s/chefRunlist", req.params.orgname);
						}
					});
				}
			});

		});

	});


	app.post('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/addInstance', function(req, res) {
		logger.debug("Enter post() for /organizations/%s/businessgroups/%s/projects/%s/environments/%s/addInstance", req.params.orgId, req.params.bgId, req.params.projectId, req.params.envId);
		logger.debug("Body::::"+req.body);
		logger.debug("JSON Body::::"+JSON.stringify(req.body));
		if (!(req.body.fqdn && req.body.os)) {
			res.send(400);
			return;
		}
		logger.debug('Verifying User permission set');
		var user = req.session.user;
		var category = 'instancelaunch';
		var permissionto = 'execute';

		usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function(err, data) {
			if (!err) {
				logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
				if (data == false) {
					logger.debug('No permission to ' + permissionto + ' on ' + category);
					res.send(401);

					return;
				}
			} else {
				logger.error("Hit and error in haspermission:", err);
				res.send(500);
				return;
			}
			instancesDao.getInstanceByOrgAndNodeNameOrIP(req.params.orgId, req.body.fqdn, req.body.fqdn, function(err, instances) {
				if (err) {
					logger.error("error occured while fetching instances by IP", err);
					res.status(500).send(errorResponses.db.error);
					return;
				}
				if (instances.length) {
					res.status(400).send({
						message: "An Instance with the same IP already exists."
					});
					return;
				}
				logger.debug("Received Users: %s", req.body.users);
				if (req.body.credentials && req.body.credentials.username) {
					if (!(req.body.credentials.password || req.body.credentials.pemFileData)) {
						res.send(400);
					}
				} else {
					res.send(400);
				}

				configmgmtDao.getEnvNameFromEnvId(req.params.envId, function(err, envName) {
					if (err) {
						res.send(500);
						return;
					}

					function getCredentialsFromReq(callback) {
						var credentials = req.body.credentials;
						if (req.body.credentials.pemFileData) {
							credentials.pemFileLocation = appConfig.tempDir + uuid.v4();
							fileIo.writeFile(credentials.pemFileLocation, req.body.credentials.pemFileData, null, function(err) {
								if (err) {
									logger.error('unable to create pem file ', err);
									callback(err, null);
									return;
								}
								callback(null, credentials);
							});
						} else {
							callback(null, credentials);
						}
					}

					getCredentialsFromReq(function(err, credentials) {
						if (err) {
							res.send(500);
							return;
						}
						if (!req.body.configManagmentId) {
							res.status(400).send({
								message: "Invalid Config Management Id"
							});
							return;
						}
						masterUtil.getCongifMgmtsById(req.body.configManagmentId, function(err, infraManagerDetails) {
							if (err) {
								res.send(500);
								return;
							}
							logger.debug("infraManagerDetails", infraManagerDetails);
							if (!infraManagerDetails) {
								res.send(500);
								return;
							}
							//Verifying if the node is alive
							var nodeAlive = 'running';
							var openport = 22;
							if (req.body.os === 'windows') {
								openport = 5985;
							}
							waitForPort(req.body.fqdn, openport, function(err) {
								if (err) {
									logger.debug(err);
									res.status(400).send({
										message: "Unable to SSH into instance"
									});
									return;
								}
								credentialCryptography.encryptCredential(credentials, function(err, encryptedCredentials) {
									if (err) {
										logger.error("unable to encrypt credentials", err);
										res.send(500);
										return;
									}
									if (!req.body.appUrls) {
										req.body.appUrls = [];
									}


									var appUrls = req.body.appUrls;
									if (appConfig.appUrls && appConfig.appUrls.length) {
										appUrls = appUrls.concat(appConfig.appUrls);
									}

									var instance = {
										name: req.body.fqdn,
										orgId: req.params.orgId,
										bgId: req.params.bgId,
										projectId: req.params.projectId,
										envId: req.params.envId,
										instanceIP: req.body.fqdn,
										instanceState: nodeAlive,
										bootStrapStatus: 'waiting',
										runlist: [],
										appUrls: appUrls,
										users: [req.session.user.cn], //need to change this
										hardware: {
											platform: 'unknown',
											platformVersion: 'unknown',
											architecture: 'unknown',
											memory: {
												total: 'unknown',
												free: 'unknown',
											},
											os: req.body.os
										},
										credentials: encryptedCredentials,

										blueprintData: {
											blueprintName: req.body.fqdn,
											templateId: "chef_import",
											iconPath: "../private/img/templateicons/chef_import.png"
										}
									}
									if (infraManagerDetails.configType === 'chef') {
										instance.chef = {
											serverId: infraManagerDetails.rowid,
											chefNodeName: req.body.fqdn
										}
									} else {
										instance.puppet = {
											serverId: infraManagerDetails.rowid

										}
									}
									instancesDao.createInstance(instance, function(err, data) {
										if (err) {
											logger.error('Unable to create Instance ', err);
											res.send(500);
											return;
										}
										instance.id = data._id;
										instance._id = data._id;
										var timestampStarded = new Date().getTime();
										var actionLog = instancesDao.insertBootstrapActionLog(instance.id, [], req.session.user.cn, timestampStarded);
										var logsRefernceIds = [instance.id, actionLog._id];
										logsDao.insertLog({
											referenceId: logsRefernceIds,
											err: false,
											log: "Bootstrapping instance",
											timestamp: timestampStarded
										});

										credentialCryptography.decryptCredential(encryptedCredentials, function(err, decryptedCredentials) {
											if (err) {
												logger.error("unable to decrypt credentials", err);
												var timestampEnded = new Date().getTime();
												logsDao.insertLog({
													referenceId: logsRefernceIds,
													err: true,
													log: "Unable to decrypt credentials. Bootstrap Failed",
													timestamp: timestampEnded
												});
												instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
												res.send(500);
												return;
											}
											var infraManager;
											var bootstarpOption;
											var deleteOptions;
											if (infraManagerDetails.configType === 'chef') {
												logger.debug('In chef ');
												infraManager = new Chef({
													userChefRepoLocation: infraManagerDetails.chefRepoLocation,
													chefUserName: infraManagerDetails.loginname,
													chefUserPemFile: infraManagerDetails.userpemfile,
													chefValidationPemFile: infraManagerDetails.validatorpemfile,
													hostedChefUrl: infraManagerDetails.url
												});
												bootstarpOption = {
													instanceIp: instance.instanceIP,
													pemFilePath: decryptedCredentials.pemFileLocation,
													instancePassword: decryptedCredentials.password,
													instanceUsername: instance.credentials.username,
													nodeName: instance.chef.chefNodeName,
													environment: envName,
													instanceOS: instance.hardware.os
												};
												deleteOptions = {
													privateKey: decryptedCredentials.pemFileLocation,
													username: decryptedCredentials.username,
													host: instance.instanceIP,
													instanceOS: instance.hardware.os,
													port: 22,
													cmds: ["rm -rf /etc/chef/", "rm -rf /var/chef/"],
													cmdswin: ["del "]
												}
												if (decryptedCredentials.pemFileLocation) {
													deleteOptions.privateKey = decryptedCredentials.pemFileLocation;
												} else {
													deleteOptions.password = decryptedCredentials.password;
												}

											} else {
												var puppetSettings = {
													host: infraManagerDetails.hostname,
													username: infraManagerDetails.username,
												};
												if (infraManagerDetails.pemFileLocation) {
													puppetSettings.pemFileLocation = infraManagerDetails.pemFileLocation;
												} else {
													puppetSettings.password = infraManagerDetails.puppetpassword;
												}
												logger.debug('puppet pemfile ==> ' + puppetSettings.pemFileLocation);
												bootstarpOption = {
													host: instance.instanceIP,
													username: instance.credentials.username,
													pemFileLocation: decryptedCredentials.pemFileLocation,
													password: decryptedCredentials.password,
													environment: envName
												};

												var deleteOptions = {
													username: decryptedCredentials.username,
													host: instance.instanceIP,
													port: 22,
												}

												if (decryptedCredentials.pemFileLocation) {
													deleteOptions.pemFileLocation = decryptedCredentials.pemFileLocation;
												} else {
													deleteOptions.password = decryptedCredentials.password;
												}

												infraManager = new Puppet(puppetSettings);
											}


											//removing files on node to facilitate re-bootstrap
											logger.debug("Node OS : %s", instance.hardware.os);
											logger.debug('Cleaning instance');
											infraManager.cleanClient(deleteOptions, function(err, retCode) {
												logger.debug("Entering chef.bootstarp");
												infraManager.bootstrapInstance(bootstarpOption, function(err, code, bootstrapData) {

													if (err) {
														logger.error("knife launch err ==>", err);
														instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function(err, updateData) {

														});
														if (err.message) {
															var timestampEnded = new Date().getTime();
															logsDao.insertLog({
																referenceId: logsRefernceIds,
																err: true,
																log: err.message,
																timestamp: timestampEnded
															});

														}
														var timestampEnded = new Date().getTime();
														logsDao.insertLog({
															referenceId: logsRefernceIds,
															err: true,
															log: "Bootstrap Failed",
															timestamp: timestampEnded
														});
														instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);

													} else {
														if (code == 0) {
															instancesDao.updateInstanceBootstrapStatus(instance.id, 'success', function(err, updateData) {
																if (err) {
																	logger.error("Unable to set instance bootstarp status. code 0");
																} else {
																	logger.debug("Instance bootstrap status set to success");
																}
															});

															// updating puppet node name
															var nodeName;
															if (bootstrapData && bootstrapData.puppetNodeName) {
																instancesDao.updateInstancePuppetNodeName(instance.id, bootstrapData.puppetNodeName, function(err, updateData) {
																	if (err) {
																		logger.error("Unable to set puppet node name");
																	} else {
																		logger.debug("puppet node name updated successfully");
																	}
																});
																nodeName = bootstrapData.puppetNodeName;
															} else {
																nodeName = instance.chef.chefNodeName;
															}


															var timestampEnded = new Date().getTime();
															logsDao.insertLog({
																referenceId: logsRefernceIds,
																err: false,
																log: "Instance Bootstrapped Successfully",
																timestamp: timestampEnded
															});
															instancesDao.updateActionLog(instance.id, actionLog._id, true, timestampEnded);
															var hardwareData = {};
															if (bootstrapData && bootstrapData.puppetNodeName) {
																var runOptions = {
																	username: decryptedCredentials.username,
																	host: instance.instanceIP,
																	port: 22,
																}

																if (decryptedCredentials.pemFileLocation) {
																	runOptions.pemFileLocation = decryptedCredentials.pemFileLocation;
																} else {
																	runOptions.password = decryptedCredentials.password;
																}

																infraManager.runClient(runOptions, function(err, retCode) {
																	if (decryptedCredentials.pemFileLocation) {
																		fileIo.removeFile(decryptedCredentials.pemFileLocation, function(err) {
																			if (err) {
																				logger.debug("Unable to delete temp pem file =>", err);
																			} else {
																				logger.debug("temp pem file deleted =>", err);
																			}
																		});
																	}
																	if (err) {
																		logger.error("Unable to run puppet client", err);
																		return;
																	}
																	// waiting for 30 sec to update node data
																	setTimeout(function() {
																		infraManager.getNode(nodeName, function(err, nodeData) {
																			if (err) {
																				logger.error(err);
																				return;
																			}
																			// is puppet node
																			hardwareData.architecture = nodeData.facts.values.hardwaremodel;
																			hardwareData.platform = nodeData.facts.values.operatingsystem;
																			hardwareData.platformVersion = nodeData.facts.values.operatingsystemrelease;
																			hardwareData.memory = {
																				total: 'unknown',
																				free: 'unknown'
																			};
																			hardwareData.memory.total = nodeData.facts.values.memorysize;
																			hardwareData.memory.free = nodeData.facts.values.memoryfree;
																			hardwareData.os = instance.hardware.os;
																			instancesDao.setHardwareDetails(instance.id, hardwareData, function(err, updateData) {
																				if (err) {
																					logger.error("Unable to set instance hardware details  code (setHardwareDetails)", err);
																				} else {
																					logger.debug("Instance hardware details set successessfully");
																				}
																			});
																		});
																	}, 30000);
																});

															} else {
																infraManager.getNode(nodeName, function(err, nodeData) {
																	if (err) {
																		logger.error(err);
																		return;
																	}
																	hardwareData.architecture = nodeData.automatic.kernel.machine;
																	hardwareData.platform = nodeData.automatic.platform;
																	hardwareData.platformVersion = nodeData.automatic.platform_version;
																	hardwareData.memory = {
																		total: 'unknown',
																		free: 'unknown'
																	};
																	if (nodeData.automatic.memory) {
																		hardwareData.memory.total = nodeData.automatic.memory.total;
																		hardwareData.memory.free = nodeData.automatic.memory.free;
																	}
																	hardwareData.os = instance.hardware.os;
																	instancesDao.setHardwareDetails(instance.id, hardwareData, function(err, updateData) {
																		if (err) {
																			logger.error("Unable to set instance hardware details  code (setHardwareDetails)", err);
																		} else {
																			logger.debug("Instance hardware details set successessfully");
																		}
																	});
																	if (decryptedCredentials.pemFilePath) {
																		fileIo.removeFile(decryptedCredentials.pemFilePath, function(err) {
																			if (err) {
																				logger.error("Unable to delete temp pem file =>", err);
																			} else {
																				logger.debug("temp pem file deleted");
																			}
																		});
																	}
																});
															}

														} else {
															instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function(err, updateData) {
																if (err) {
																	logger.error("Unable to set instance bootstarp status code != 0");
																} else {
																	logger.debug("Instance bootstrap status set to failed");
																}
															});

															var timestampEnded = new Date().getTime();
															logsDao.insertLog({
																referenceId: logsRefernceIds,
																err: true,
																log: "Bootstrap Failed",
																timestamp: timestampEnded
															});
															instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);

														}
													}

												}, function(stdOutData) {

													logsDao.insertLog({
														referenceId: logsRefernceIds,
														err: false,
														log: stdOutData.toString('ascii'),
														timestamp: new Date().getTime()
													});

												}, function(stdErrData) {

													logsDao.insertLog({
														referenceId: logsRefernceIds,
														err: true,
														log: stdErrData.toString('ascii'),
														timestamp: new Date().getTime()
													});
												});
											}); //end of chefcleanup

										});
										res.send(instance);
										logger.debug("Exit post() for /organizations/%s/businessgroups/%s/projects/%s/environments/%s/addInstance", req.params.orgId, req.params.bgId, req.params.projectId, req.params.envId);
									});
								});

							});
						});
					});
				});
			});
		});
	});

	app.post('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/blueprints/docker', function(req, res) {
		//validating if user has permission to save a blueprint
		logger.debug('Verifying User permission set');
		var user = req.session.user;
		var category = 'blueprints';
		var permissionto = 'create';

		usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function(err, data) {
			if (!err) {
				logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
				if (data == false) {
					logger.debug('No permission to ' + permissionto + ' on ' + category);
					res.send(401);

					return;
				}
			} else {
				logger.error("Hit and error in haspermission:", err);
				res.send(500);
				return;
			}
			logger.debug("Provider Id: ", req.body.providerId);
			var blueprintData = req.body.blueprintData;
			blueprintData.orgId = req.params.orgId;
			blueprintData.bgId = req.params.bgId;
			blueprintData.projectId = req.params.projectId;
			blueprintData.envId = req.params.envId;

			// for Docker
			blueprintData.imageId = '000000';
			blueprintData.providerId = '000000';
			blueprintData.keyPairId = '000000';
			blueprintData.subnetId = '000000';
			blueprintData.vpcId = '000000';
			blueprintData.securityGroupIds = ['000000'];
			logger.debug("Enviornment ID:: ", req.params.envId);

			if (!blueprintData.runlist) {
				blueprintData.runlist = [];
			}
			if (!blueprintData.users || !blueprintData.users.length) {
				res.send(400);
				return;
			}

			blueprintsDao.createBlueprint(blueprintData, function(err, data) {
				if (err) {
					res.send(500);
					return;
				}
				res.send(data);
			});
			logger.debug("Exit post() for /organizations/%s/businessgroups/%s/projects/%s/environments/%s/providers/%s/images/%s/blueprints", req.params.orgId, req.params.bgId, req.params.projectId, req.params.envId, req.params.providerId, req.params.imageId);
		});
	});

	// End point which will give list of all Docker instances for Org,BG,Proj and Env.
	app.get('/organizations/:orgId/businessgroups/:bgId/projects/:projectId/environments/:envId/docker/instances', function(req, res) {
		instancesDao.getInstancesByOrgBgProjectAndEnvForDocker(req.params.orgId, req.params.bgId, req.params.projectId, req.params.envId, function(err, instances) {
			if (err) {
				res.status(500).send({
					"errorCode": 500,
					"message": "Error occured while fetching docker instances."
				});
				return;
			}
			res.send(instances);
			return;
		});
	});

}

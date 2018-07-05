/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Feb 2016
 */

(function (angular) {
	"use strict";
	angular.module('chefDataFormatter', [])
		.service('responseFormatter', ['arrayUtil', function (arrayUtil) {
			return {
				formatDataForChefClientRun: function (obj) {
					var roles = [];
					var deploy = [];
					var cookbook = [];
					var r = obj.roles;
					var c = obj.cookbooks;
					var total = [];
					var t;
					if (r) {
						/*jslint forin: true */
						for (var roleKey in r) {
							t = {
								className: "role",
								value: roleKey,
								data: {key: roleKey, value: r[roleKey]}
							};
							total.push(t);
							roles.push(t);
						}
					}

					if (c) {
						var className = '';
						for (var key in c) {
							if (key.toLowerCase().indexOf('deploy') !== -1) {
								className = 'deploy';
							} else {
								className = 'cookbook';
							}
							t = {
								className: className,
								value: key,
								data: {
									key: key,
									value: c[key]
								}
							};
							total.push(t);
							if (className === "deploy") {
								deploy.push(t);
							} else {
								cookbook.push(t);
							}
						}
					}
					return total;
				},
				formatTemplateDataForChefClient: function (list) {
					if (list.length) {
						var t = [], l = list.length;
						for (var i = 0; i < l; i++) {
							t.push({
								className: "template",
								value: list[i].templatename,
								data: {
									key: list[i].templatename,
									value: list[i]
								}
							});
						}
						return t;
					}
					return [];
				},
				merge: function () {
					var totalArray = arguments;
					var l = totalArray.length;
					var mergeArray = [];
					for (var i = 0; i < l; i++) {
						var t = totalArray[i];
						if (t && typeof t === "object" && t instanceof Array) {
							for (var x = 0; x < t.length; x++) {
								mergeArray.push(t[x]);
							}
						}
					}
					return mergeArray;
				},
				formatTaskList: function (obj) {
					var list = [];
					for (var i = 0; i < obj.length; i++) {
						if (obj[i].taskType !== "composite") {
							list.push({
								className: obj[i].taskType,
								value: obj[i].name,
								data: obj[i]
							});
						}
					}
					return list;
				},
				formatInstanceList: function (obj) {
					var list = [];
					for (var i = 0; i < obj.length; i++) {
						if (obj[i].instanceState === "running" || obj[i].instanceState === "pending" || obj[i].instanceState === "unknown") {
							list.push({
								className: 'chef',
								value: obj[i].name,
								data: obj[i]._id
							});
						}
					}
					return list;
				},
				formatRunListFromComponent: function (nodesList) {
					var reqBody = {
						cookbooks: [],
						roles: [],
						deploy: [],
						templates: []
					};
					for (var i = 0; i < nodesList.length; i++) {
						if (nodesList[i].type === 'template') {
							reqBody.templates.push(nodesList[i].val);
						} else if (nodesList[i].type === 'deploy') {
							reqBody.deploy.push(nodesList[i].val);
						} else if (nodesList[i].type === 'recipe') {
							reqBody.cookbooks.push(nodesList[i].val);
						} else if (nodesList[i].type === 'role') {
							reqBody.roles.push(nodesList[i].val);
						}
					}
					return reqBody;
				},
				formatJenkinsServerList: function (list) {
					list = typeof list === "string" ? JSON.parse(list) : list;
					var newList = [];
					for (var i = 0; i < list.length; i++) {
						/*jslint forin: true */
						for (var key in list[i]) {
							newList.push({
								name: key,
								id: list[i][key]
							});
						}
					}
					return newList;
				},
				getChefList: function (list) {
					var temp = [];
					for (var i = 0; i < list.length; i++) {
						if (list[i].chef) {
							temp.push(list[i]);
						}
					}
					return temp;
				},
				getBlueprintList: function (list) {
					var temp = [];
					for (var i = 0; i < list.length; i++) {
						if (list[i]._id) {
							temp.push(list[i]);
						}
					}
					return temp;
				},
				getPuppetList: function (list) {
					var temp = [];
					for (var i = 0; i < list.length; i++) {
						if (list[i].puppet) {
							temp.push(list[i]);
						}
					}
					return temp;
				},
				identifyAvailableChefNode: function (totalNodeList, selectedNode) {
					for (var i = 0; i < totalNodeList.length; i++) {
						if (_.indexOf(selectedNode, totalNodeList[i]._id) !== -1) {
							totalNodeList[i]._isNodeSelected = true;
						} else {
							totalNodeList[i]._isNodeSelected = false;
						}
					}
					return totalNodeList;
				},
				identifyAvailableBlueprint: function (totalBlueprintList, selectedBlueprint) {
					for (var i = 0; i < totalBlueprintList.length; i++) {
						if (_.indexOf(selectedBlueprint, totalBlueprintList[i]._id) !== -1) {
							totalBlueprintList[i]._isBlueprintSelected = totalBlueprintList[i]._id;
						} else {
							totalBlueprintList[i]._isBlueprintSelected = false;
						}
					}
					return totalBlueprintList;
				},
				identifyAvailablePuppetNode: function (totalNodeList, selectedNode) {
					return this.identifyAvailableChefNode(totalNodeList, selectedNode);
				},
				identifyAvailableScript: function (totalScriptList, selectedScript) {
					for (var i = 0; i < totalScriptList.length; i++) {
						if (_.indexOf(selectedScript, totalScriptList[i]._id) !== -1) {
							totalScriptList[i]._isScriptSelected = true;
						} else {
							totalScriptList[i]._isScriptSelected = false;
						}
					}
					return totalScriptList;
				},
				formatSelectedChefRunList: function (list) {
					var l = list && list.length ? list.length : 0, t = [];
					for (var i = 0; i < l; i++) {
						if (list[i].className === "cookbook" || list[i].className === "deploy") {
							t.push('recipe[' + list[i].value + ']');
						} else if (list[i].className === "role") {
							t.push('role[' + list[i].value + ']');
						} else if (list[i].className === "template") {
							//todo
							t.push('template[' + list[i].value + ':-:' + list[i].data.value.templatescookbooks + ']');
						}

					}
					return t;
				},
				formatSelectedCookbookAttributes: function (list) {
					var t = [];
					if(list) {
                        var l = list.length;
                        for (var cb = 0; cb < l; cb++) {
                            var item = list[cb];
                            /*jslint forin: true */
                            for (var key in item.attributes) {
                                var attributeKey = key;
                                var attributeDisplay = item.attributes[key].display_name;
                                var attribValue = item.attributes[key].default;
                                if (attribValue && attribValue.length) {
                                    /*Start: Code from Cat2.0. To create request data in format expected by API*/
                                    var attribPathParts = attributeKey.split('/');
                                    var attributeObj = {};
                                    var currentObj = attributeObj;
                                    for (var i = 0; i < attribPathParts.length; i++) {
                                        if (!currentObj[attribPathParts[i]]) {
                                            if (i === attribPathParts.length - 1) {
                                                currentObj[attribPathParts[i]] = attribValue;
                                                continue;
                                            } else {
                                                currentObj[attribPathParts[i]] = {};
                                            }
                                        }
                                        currentObj = currentObj[attribPathParts[i]];
                                    }
                                    /*End: Code from Cat2.0*/
                                    t.push({
                                        name: attributeDisplay,
                                        jsonObj: attributeObj
                                    });
                                }
                            }
                        }
                    }
					return t;
				},
				getVal: function (obj, currentKey) {
					var keys = Object.keys(obj);
					if (typeof obj[keys[0]] === 'object' && !(obj[keys[0]] instanceof Array)) {
						return this.getVal(obj[keys[0]], currentKey + '/' + keys[0]);
					} else {
						var keyString = currentKey + '/' + keys[0];
						return {
							key: keyString,
							obj: obj[keys[0]]
						};
					}
				},
				formatSavedCookbookAttributes: function (attributes) {
					var allAttributeObj = {};
					for (var j = 0; j < attributes.length; j++) {
						var attributeObj = attributes[j].jsonObj;
						var keys = Object.keys(attributeObj);
						var resp = this.getVal(attributeObj[keys[0]], keys[0]);
						allAttributeObj[resp.key] = resp.obj;
					}
					return allAttributeObj;
				},
				//method to get the runlist array and then assign the className to each value.
				findDataForEditValue: function (list) {
					var runlist = list;
					var temp = [];
					if (runlist) {
						/*jslint forin: true */
						for (var i = 0; i < runlist.length; i++) {
							var className;
							if (runlist[i].indexOf('recipe') === 0) {
								className = "cookbook";
							} else if (runlist[i].indexOf('role') === 0) {
								className = "role";
							} else {
								className = "template";
							}
							var item = runlist[i];
							temp.push({
								value: item,
								className: className,
								data: {}
							});
						}
					}else {

					}
					return temp;
				},
				//formatting the name and removing the default name style coming from server.
				chefRunlistFormatter: function (list) {
					var runlist = list;
					for (var i = 0; i < runlist.length; i++) {
						var item = runlist[i];
						var indexOfBracketOpen = item.value.indexOf('[');
						if (indexOfBracketOpen !== -1) {
							var indexOfBracketClose = item.value.indexOf(']');
							if (indexOfBracketClose !== -1) {
								item.value = item.value.substring(indexOfBracketOpen + 1, indexOfBracketClose);
								var indexOfDeployCheck = item.value.indexOf('deploy');
								if (indexOfDeployCheck !== -1) {
									item.className = 'deploy';
								}
								var indexOfTemplateCheck = item.value.indexOf(':-:');
								if (indexOfTemplateCheck !== -1) {
									var templateArr = item.value.split(':-:');
									item.value = templateArr[0];
									item.data.value = {
										templatescookbooks: templateArr[1]
									};
								}
							}
						}
					}
					return runlist;
				}
			};
		}]);
})(angular);
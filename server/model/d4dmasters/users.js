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


var d4dModel = require('./d4dmastersmodel.js');
var logger = require('_pr/logger')(module);

function cusers() {
	this.getUserRole = function(callback,username,req) {
		var userrole;
		d4dModel.findOne({
			id: '7'
		}, function(err, d4dMasterJson) {
			if (err) {
				logger.debug("Hit and error:" + err);
			}
			if (d4dMasterJson) {
				var hasOrg = false;
				var userrole;
				d4dMasterJson.masterjson.rows.row.forEach(function(itm, i) {
					logger.debug("found name" + itm.field.length + ":" + username);

					for (var j = 0; j < itm.field.length; j++) {
						logger.debug(itm.field[j]["name"] == 'loginname');
						if (itm.field[j]["name"] == 'loginname') {
							if (itm.field[j]["values"].value == username) {
								logger.debug("found username: " + i + " -- " + itm.field[j]["values"].value);
								hasOrg = true;
								for (var k = 0; k < itm.field.length; k++) {
									logger.debug(itm.field[k]["name"] == 'userrolename');
									if (itm.field[k]["name"] == 'userrolename') {
										userrole = itm.field[k]["values"].value;
										req.session.cuserrole = userrole;
										logger.debug("UserRole:" + JSON.stringify(userrole));
									}
								}
							}
						}

					}
				});


			}
		});
	return(userrole);
	};
}

module.exports = new cusers();
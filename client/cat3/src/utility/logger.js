/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

angular.module('logger', []).factory('log', function () {
	"use strict";
	var isLoggingEnable = true;
	var logger = {
		debug: function () {
			window.console = window.console || function () {
				};
			//isLoggingEnable && window.console(str);
		},
		enableLog: function () {
			isLoggingEnable = !0;
		},
		disableLog: function () {
			isLoggingEnable = !1;
		}
	};

	return {
		debug: logger.debug,
		enableLog: logger.enableLog,
		disableLog: logger.disableLog
	};
});
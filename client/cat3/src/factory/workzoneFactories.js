/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	angular.module('workzone.factories', []).factory(
		'instanceFactories', [function () {
			var getActionBtnClass = function (actionType) {
				switch (actionType) {
					case 'start':
						return {
							bg: 'greenBg',
							icon: 'fa-play',
							actionType: 'start'
						};
					case 'stop':
						return {
							bg: 'redBg',
							icon: 'fa-power-off',
							actionType: 'stop'
						};
					case 'restart':
						return {
							bg: 'yellowBg',
							icon: 'fa-undo',
							actionType: 'restart'
						};
					case 'kill':
						return {
							bg: 'frontKill',
							icon: 'fa-times-circle',
							actionType: 'kill'
						};
					case 'status':
						return {
							bg: 'frontKill',
							icon: 'fa-bell-o',
							actionType: 'status'
						};
					default:
						return {

						};
				}
			};
			var getCommandActionJSON = function (serviceData) {
				var commandActions = serviceData.commandaction.split(',');
				var response = [];
				for (var i = 0; i < commandActions.length; i++) {
					var actionBtnClass = getActionBtnClass(commandActions[i]);
					response.push(actionBtnClass);
				}
				return response;
			};
			var getCookbookActionJSON = function (serviceData) {
				var response = [];
				if (serviceData.servicestart && serviceData.servicestart !== 'none') {
					response.push(getActionBtnClass('start'));
				}
				if (serviceData.servicestop && serviceData.servicestop !== 'none') {
					response.push(getActionBtnClass('stop'));
				}

				if (serviceData.servicerestart && serviceData.servicerestart !== 'none') {
					response.push(getActionBtnClass('restart'));
				}
				if (serviceData.servicekill && serviceData.servicekill !== 'none') {
					response.push(getActionBtnClass('kill'));
				}
				if (serviceData.servicestatus && serviceData.servicestatus !== 'none') {
					response.push(getActionBtnClass('status'));
				}
				return response;
			};

			return {
				getServiceActionItems: function (serviceData) {
					var commandType = serviceData.commandtype, response;
					if (commandType === 'Chef Cookbook/Recipe') {
						response = getCookbookActionJSON(serviceData);
					} else {
						response = getCommandActionJSON(serviceData);
					}
					return response;
				},
				getAllServiceActionItems: function (serviceInfo) {
					for (var i = 0; i < serviceInfo.length; i++) {
						serviceInfo[i].actionData = this.getServiceActionItems(serviceInfo[i]);
					}
					return serviceInfo;
				}
			};
		}]).factory('workzoneUIUtils', [function () {
		var makeTabScrollable = function(divID) {
			var windowHeight = $(window).innerHeight();
			var brdcrmbHeight = $('#breadcrumb-block').outerHeight();
			var headerHeight = $('#header').outerHeight();
			var instancepanelHeight = $('#' + divID + ' .panel-heading').outerHeight();
			var rightpanelPaddingtop = parseInt($("#rightPanel").css("padding-top"));
			var tabULHeight = $('#rightPanel ul').first().outerHeight();
			//Set Main Content Height
			var setMainContentHeight = windowHeight - (brdcrmbHeight + headerHeight + instancepanelHeight + tabULHeight + rightpanelPaddingtop);
			$('#' + divID + ' .scrollContent').css('height', (setMainContentHeight) + 'px');
			$('#' + divID + ' .scrollContent').css('overflow-y', 'auto');
			return setMainContentHeight;
			/*return value will be used only by few consumer methods, not all.
			(Basically wherever we are trying to set the content height)*/
		};
		return {
			makeTabScrollable : makeTabScrollable
		};
	}]);
})(angular);

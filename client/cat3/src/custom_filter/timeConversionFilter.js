/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function () {
	'use strict';
	angular.module('filter.currentTime', [])
		.filter('timestampToCurrentTime', function () {
		return function (timestamp) {
			if (!timestamp) {
				return "";
			}
			return (new Date(timestamp).toTimeString());
		};
	})
	.filter('timestampToLocaleTime',function(){
		return function(timestamp){
			if(!timestamp){
				return "";
			}
			return (new Date(timestamp).toLocaleString());
		};
	})
        .filter('timestampToLocaleTimeWith',function(){
            return function(timestamp){
                if(!timestamp){
                    return "";
                }
                if(new Date(timestamp) < new Date('1/1/2016'))
                	return (new Date(timestamp*1000).toLocaleString());
                else
                    return (new Date(timestamp).toLocaleString());
            };
        })
	.filter('timeStampTo2lines',function(){
		/*	Input : string in the format with one comma eg: 2/17/2016, 7:29:10 AM 
			Output: array eg: [2/17/2016, 7:29:10 AM] 
			output needs to be looped for display
		*/
		return function(timeDateStr){
			if(!timeDateStr){
				return "";
			}
			return (timeDateStr.split(','));
		};
	});
})();
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

/**
 * For reference of moment - http://momentjs.com
 * @author rle0374
 */

var moment = require('moment');

/*
 * Get Date in UTC Format
 * date - JavaScript Date
 * return - 2016-08-09T13:11:46Z
 */
function getDateInUTC(date) {
	if( typeof date === 'undefined' || date === null ){
		return null;
	}else{
		return moment.utc(date).format();
	}
}

/*
 * Get Start of a month in UTC
 */
function getStartOfAMonthInUTC(date) {
	if( typeof date === 'undefined' || date === null ) {
		return null;
	}else{
		var dateStartOfMonth = moment.utc(date).seconds(0);
		dateStartOfMonth = moment.utc(dateStartOfMonth).minute(0);
		dateStartOfMonth = moment.utc(dateStartOfMonth).hour(0);
		dateStartOfMonth = moment.utc(dateStartOfMonth).date(1);
		return dateStartOfMonth.format();
	}
}

function getStartOfAWeekInUTC(date) {
	if( typeof date === 'undefined' || date === null ) {
		return null;
	}else{
		var dateStartOfWeek = moment.utc(date).seconds(0);
		dateStartOfWeek = moment.utc(dateStartOfWeek).minute(0);
		dateStartOfWeek = moment.utc(dateStartOfWeek).hour(0);
		dateStartOfWeek = moment.utc(dateStartOfWeek).day(0);
		return dateStartOfWeek.format();
	}
}

function getStartOfADayInUTC(date) {
	if( typeof date === 'undefined' || date === null ){
		var err = new Error("Invalid date");
		return null;
	}else{
		var dateStartOfDay = moment.utc(date).seconds(0);
		dateStartOfDay = moment.utc(dateStartOfDay).minute(0);
		dateStartOfDay = moment.utc(dateStartOfDay).hour(0);
		return dateStartOfDay.format();
	}
}

function getStartOfAHourInUTC(date, callback) {
	if (typeof date === 'undefined' || date === null) {
		var err = new Error("Invalid date");
		callback(err, null);
	} else {
		var dateStartOfHour = moment.utc(date).second(0);
		dateStartOfHour = moment.utc(dateStartOfHour).minute(0);
		return dateStartOfHour.format();
	}
}

function getStartOfPeriod(period, date) {
	var startTime = null
	switch(period) {
		case 'month':
			startTime = getStartOfAMonthInUTC(date);
			break;
		case 'week':
			startTime = getStartOfAWeekInUTC(date);
			break;
		case 'day':
			startTime = getStartOfADayInUTC(date);
			break;
	}

	return startTime;
}

/*
 * Get Date in UTC Format
 * date - JavaScript Date
 * return - 2016-08-09T13:11:46Z
 */
function getDateInUTCAsync(date, callback) {
	if( typeof date === 'undefined' || date === null ){
		var err = new Error("Invalid date");
		callback(err, null);
	}else{
		var utcDate = moment.utc(date).format();
		callback(null, utcDate);
	}
}

/*
 * Get Start of a minute in UTC format
 * date - JavaScript Date
 * return - 2016-08-09T13:11:00Z
 * 
 */
function getStartOfAMinuteInUTCAsync(date, callback) {
	if( typeof date === 'undefined' || date === null ){
		var err = new Error("Invalid date");
		callback(err, null);
	}else{
		var dateStartOfAMinute = moment.utc(date).second(0);
		callback(null, dateStartOfAMinute.format());
	}
}

/*
 * Get Start of a hour in UTC Format
 * date - JavaScript Date
 * return - 2016-08-09T13:00:00Z
 */
function getStartOfAHourInUTCAsync(date, callback) {
	if( typeof date === 'undefined' || date === null ){
		var err = new Error("Invalid date");
		callback(err, null);
	}else{
		var dateStartOfHour = moment.utc(date).second(0);
		dateStartOfHour = moment.utc(dateStartOfHour).minute(0);
		callback(null, dateStartOfHour.format());
	}
}

/*
 * Get Start of a day in UTC
 * date - JavaScript Date
 * return - 2016-08-09T00:00:00Z
 */
function getStartOfADayInUTCAsync(date, callback) {
	if( typeof date === 'undefined' || date === null ){
		var err = new Error("Invalid date");
		callback(err, null);
	}else{
		var dateStartOfDay = moment.utc(date).seconds(0);
		dateStartOfDay = moment.utc(dateStartOfDay).minute(0);
		dateStartOfDay = moment.utc(dateStartOfDay).hour(0);
		callback(null, dateStartOfDay.format());
	}
}

/*
 * Get Start of a month in UTC
 */
function getStartOfAMonthInUTCAsync(date, callback) {
	if( typeof date === 'undefined' || date === null ){
		var err = new Error("Invalid date");
		callback(err, null);
	}else{
		var dateStartOfMonth = moment.utc(date).seconds(0);
		dateStartOfMonth = moment.utc(dateStartOfMonth).minute(0);
		dateStartOfMonth = moment.utc(dateStartOfMonth).hour(0);
		dateStartOfMonth = moment.utc(dateStartOfMonth).date(1);
		callback(null, dateStartOfMonth.format());
	}
}

/*
 * Get Start of a year in UTC
 */
function getStartOfAYearInUTCAsync(date, callback) {
	if( typeof date === 'undefined' || date === null ){
		var err = new Error("Invalid date");
		callback(err, null);
	}else{
		var dateStartOfYear = moment.utc(date).seconds(0);
		dateStartOfYear = moment.utc(dateStartOfYear).minute(0);
		dateStartOfYear = moment.utc(dateStartOfYear).hour(0);
		dateStartOfYear = moment.utc(dateStartOfYear).date(1);
		dateStartOfYear = moment.utc(dateStartOfYear).month(0);
		callback(null, dateStartOfYear.format());
	}
}

/**
 * Get date difference in days
 *
 * @param endTimestamp
 * @param startTimestamp
 */
function getDateDifferenceInDays(endTimestamp, startTimestamp) {
	if( typeof endTimestamp === 'undefined' || endTimestamp === null
		|| typeof startTimestamp === undefined || startTimestamp === null) {
		return null;
	} else {
		var endTimestampUTC = moment.utc(endTimestamp);
		var startTimestampUTC = moment.utc(startTimestamp);
		return endTimestampUTC.diff(startTimestampUTC, 'days')
	}
}

var momentDateUtil = module.exports = {};
momentDateUtil.getDateInUTC = getDateInUTC;
momentDateUtil.getDateInUTCAsync = getDateInUTCAsync;
momentDateUtil.getStartOfAMinuteInUTCAsync = getStartOfAMinuteInUTCAsync;
momentDateUtil.getStartOfAHourInUTCAsync = getStartOfAHourInUTCAsync;
momentDateUtil.getStartOfADayInUTCAsync = getStartOfADayInUTCAsync;
momentDateUtil.getStartOfAMonthInUTCAsync = getStartOfAMonthInUTCAsync;
momentDateUtil.getStartOfAYearInUTCAsync = getStartOfAYearInUTCAsync;
momentDateUtil.getStartOfAMonthInUTC = getStartOfAMonthInUTC;
momentDateUtil.getDateDifferenceInDays = getDateDifferenceInDays;
momentDateUtil.getStartOfADayInUTC = getStartOfADayInUTC;
momentDateUtil.getStartOfAHourInUTC = getStartOfAHourInUTC;
momentDateUtil.getStartOfAWeekInUTC = getStartOfAWeekInUTC;
momentDateUtil.getStartOfPeriod = getStartOfPeriod;

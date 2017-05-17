/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */
(function($) {
	"use strict";
	/*
	 Created Component Using Factory Design pattern.
	 *
	 **/

	var htmlTemplate = '<div id="container">' +
		'<div class="col-lg-12 col-md-12 col-sm-12 col-xs-12 paddingbottom15">' +
		'<div class="col-lg-6 col-md-6 col-sm-6 col-xs-12 no-padding">' +
		'<input type="text" placeholder="Search Release" id="searchBox" />' +
		'<label></label>' +
		'<div class="btn-group selectCookbooksandRecipesdivLeft">' +
		'<select id="optionSelector" size="10" multiple="multiple" class="btn-group selectCookbooksandRecipes"></select>' +
		'</div>' +
		'<div class="btn-group left-right-selection">' +
		'<button id="btnaddToRunlist" type="button" class="btn cat-btn-update anchorAdd">' +
		'' +
		'<i class="fa fa-chevron-right anchorAddi"></i>' +
		'</button>' +
		'<div class="clearfix"></div>' +
		'<button id="btnremoveFromRunlist" type="button" class="btn cat-btn-update anchorRemove">' +
		'' +
		'<i class="fa fa-chevron-left anchorRemovei"></i></button>' +
		'</div>' +
		'</div>' +
		'<div class="col-lg-6 col-md-6 col-sm-6 col-xs-12 no-padding">' +
		'<label></label>' +
		'<div class="btn-group selectCookbooksandRecipesdivRight">' +
		'<select id="selectorList" size="10" multiple="multiple" class="btn-group selectCookbooksandRecipes"></select>' +
		'</div>' +
		'<div class="btn-group left-right-selection">' +
		'<button id="btnRunlistItemUp" type="button" class="btn cat-btn-update anchorUp">' +
		'' +
		'<i class="fa fa-chevron-up anchorUpi"></i></button>' +
		'<div class="clearfix"></div>' +
		'<button id="btnRunlistItemDown" type="button" class="btn cat-btn-update anchorDown">' +
		'' +
		'<i class="fa fa-chevron-down anchorDowni"></i></button>' +
		'</div>' +
		'</div>' +
		'</div>' +
		'</div>';

	//Utility Helper Methods
	var helper = {
		getExcludeList: function(list1, list2) {
			var p = [];
			var temp;
			var x = list1;
						var initialLength;
						temp = $.grep(list2, function(object, index) {
								initialLength = x.length;
				x = ($.grep(x, function(o) {
					return o.value === object.value && o.className === object.className;
				}, true));
				if (x.length < initialLength) {
					p.push(list2[index]);
				}
				return !x.length;
			});
			return {
				exclude: x, // exclude is the list of items remaining in the main list(array)
				update: p // update is the list of items on the right side. One's that have been selected by the user.
			};
		},
		getOptionList: function(list) {
			var str = [];
			for (var i = 0; i < list.length; i++) {
				str.push(
					$('<option></option>')
					.addClass(list[i].className)
					.attr('value', list[i].value)
					.text(list[i].value)
					.data('json', list[i].data)
				);
			}
			return str;
		},
		getOptionListForMainList: function(list) {
			var str = [];
			for (var i = 0; i < list.length; i++) {

				var o = $('<option></option>')
					.addClass(list[i].className)
					.attr('value', list[i].value)
					.text(list[i].value)
					.data('json', list[i].data);

				if (!list[i].isShow) {
					str.push(o.hide());
				} else {
					str.push(o);
				}

			}
			return str;
		},
		plainArraySorter: function(list) {
			list.sort(function(a, b) {
				return a.toLowerCase().localeCompare(b.toLowerCase());
			});
			return list;
		},
		objectArraySorter: function(list, prop, asc) {
			list = list.sort(function(a, b) {
				if (asc) {
					return (a[prop] > b[prop]) ? 1 : ((a[prop] < b[prop]) ? -1 : 0);
				} else {
					return (b[prop] > a[prop]) ? 1 : ((b[prop] < a[prop]) ? -1 : 0);
				}
			});
			return list;
		}
	};

	window.chefSelectorComponent = window.chefSelectorComponent || function(
		options) {
		var lastFilterClass = '';
		var defaultOptions = {
			scopeElement: "body", //parent element which restrict the dom search scope
			optionList: [{ //Json format it will have className,value and arbitrary key(data) which can contains anything 
				className: "hi",
				value: "welcome",
				data: {}
			}],
			selectorList: [], //collections which will be available in the Left Side
			isSortList: false, //Sorting of the complete left selector list
			isSearchBoxEnable: true, //search box is enable or not
			isOverrideHtmlTemplate: true, //you can use your own html template or predefined html template available in the component
			isExcludeDataFromOption: false, //A case where you want to give raw list to left and seperate list to the right it will exclude them while showing in the dom
			idList: { //list of id's which will require when you are opting 'isOverrideHtmlTemplate' option 
				selectorList: '#selectorList', //right select list id
				optionSelector: '#optionSelector', //left select list id
				upBtn: '#btnRunlistItemUp',
				downBtn: '#btnRunlistItemDown',
				addToSelector: '#btnaddToRunlist',
				removeFromSelector: '#btnremoveFromRunlist',
				searchBox: '#searchBox'
			},
			isPriorityEnable: true //opt this option if you want to enable priority buttons these can be hide by providing false values
		};
		var eventCallBackList = [];
		var opt = $.extend(defaultOptions, options);
		var $scopeElement = $(opt.scopeElement);
		if (!$scopeElement.length) {
			throw "Scope Element is not found";
		}
		if (opt.isOverrideHtmlTemplate) {
			$scopeElement.html(htmlTemplate);
		}
		if (opt.isExcludeDataFromOption) {
			var p = helper.getExcludeList(opt.optionList, opt.selectorList);
			opt.optionList = p.exclude;
			opt.selectorList = p.update; 
		}
		var combineList = [];
		for (var i = 0; i < opt.optionList.length; i++) {
			opt.optionList[i].isShow = true;
			combineList.push(opt.optionList[i]);
		}
		for (i = 0; i < opt.selectorList.length; i++) {
			opt.selectorList[i].isShow = false;
			combineList.push(opt.selectorList[i]);
		}

		var $optionSelector = $scopeElement.find(opt.idList.optionSelector),
			$selectorList = $scopeElement.find(opt.idList.selectorList),
			$upBtn = $scopeElement.find(opt.idList.upBtn),
			$downBtn = $scopeElement.find(opt.idList.downBtn),
			$addToSelector = $scopeElement.find(opt.idList.addToSelector),
			$removeFromSelector = $scopeElement.find(opt.idList.removeFromSelector),
			$searchBox = $scopeElement.find(opt.idList.searchBox);

		if (options.isSortList) {
			opt.optionList = helper.objectArraySorter(combineList, "value", true);
			opt.selectorList = opt.selectorList;
		}

		function downBtnListener() {
			var obj = {};
			var itemsCount = $selectorList.find("option").length;
			$($selectorList.find("option:selected").get().reverse()).each(function() {
				var listItem = $(this);
				var listItemPosition = $selectorList.find("option").index(
					listItem) + 1;
				if (listItemPosition === itemsCount) {
					return false;
				}
				listItem.insertAfter(listItem.next());
				var currentList = [];
				$selectorList.find('option').each(function() {
					obj = {
						value: $(this).val(),
						className: $(this).attr('class')
					};
					currentList.push(obj);
				});
				var operationType = "down";
				broadCastRegisteredEvents(listItem, currentList, operationType);
			});
		}

		//Up selector
		function upBtnListener() {
			var obj = {};
			$selectorList.find("option:selected").each(function() {
				var listItem = $(this);
				var listItemPosition = $selectorList.find("option").index(listItem) + 1;
				if (listItemPosition === 1) {
					return false;
				}
				listItem.insertBefore(listItem.prev());
				var currentList = [];
				$selectorList.find('option').each(function() {
					obj = {
						value: $(this).val(),
						className: $(this).attr('class')
					};
					currentList.push(obj);
				});
				var operationType = "up";
				broadCastRegisteredEvents(listItem, currentList, operationType);
			});
		}

		//Add selected from optionList to SelectorList
		function addDblClickListener() {
			var currentList = [];
			var currentValue = [];
			$selectorList.find('option').each(function() {
				var obj = {
					value: $(this).val(),
					className: $(this).attr('class')
				};
				currentList.push(obj);
			});
			var $this = $(event.target);
			var obj = {
				value: $this.val(),
				className: $this.attr('class')
			};
			var duplicateCheck = false;
			if(currentList.length === 0){
				duplicateCheck = false;
			}else{
				for(var i = 0; i < currentList.length; i++){
					if(currentList[i].value === obj.value && currentList[i].className === obj.className){
						duplicateCheck = true;
					}
				}
			}
			if(duplicateCheck === false){
				$selectorList.append($this.clone().data('json', $this.data(
					'json')));
			}
			$this.hide();
			currentValue.push(obj);
			var operationType = "add";

			broadCastRegisteredEvents(currentValue, currentList, operationType);
		}

		//Remove Selected from SelectorList
		function removeDblClickListener() {
			var $this = $(event.target),
				value = $this.val(),
				classlist = $this[0].classList.toString(),
				obj = {};
			$this.remove();
			triggerSearchManually();
			$optionSelector.find('option[value="' + value + '"]').each(function() {
				if ($(this).hasClass(classlist)) {
					// findList.push(this);
					$(this).show();
				}
			});
			var currentValue = [{
				value: $this.val(),
				className: $this.attr('class')
			}];
			var currentList = [];
			$selectorList.find('option').each(function() {
				obj = {
					value: $(this).val(),
					className: $(this).attr('class')
				};
				currentList.push(obj);
			});
			var operationType = "remove";

			broadCastRegisteredEvents(currentValue, currentList, operationType);
		}

		//Add Button Listener
		function addBtnListener() {
			var $options = $optionSelector.find('option:selected');
			var currentValue = [];
			var currentList = [];
			var obj = {};
			$selectorList.find('option').each(function() {
				obj = {
					value: $(this).val(),
					className: $(this).attr('class')
				};
				currentList.push(obj);
			});
			$options.each(function() {
				var $this = $(this);
				obj = {
					value: $this.val(),
					className: $this.attr('class')
				};
				var duplicateCheck = false;
				if(currentList.length === 0){
					duplicateCheck = false;
				}else{
					for(var i = 0; i < currentList.length; i++){
						if(currentList[i].value === obj.value && currentList[i].className === obj.className){
							duplicateCheck = true;
						}
					}
				}
				if(duplicateCheck === false){
					$selectorList.append($this.clone().data('json', $this.data(
						'json')));
				}
				$this.hide();
				currentValue.push(obj);
			});
			var operationType = "add";
			broadCastRegisteredEvents(currentValue, currentList, operationType);
		}

		//Remove Button Listener
		function removeBtnListener() {
			var currentValue = [],
				obj = {};
			$selectorList.find("option:selected").each(function() {
				var $this = $(this);
				var value = $this.val();
				$this.remove();
				var classlist = $this[0].classList.toString();
				triggerSearchManually();
				$optionSelector.find('option[value="' + value + '"]').each(function() {
					if ($(this).hasClass(classlist)) {
						$(this).show();
					}
				});
				obj = {
					value: $this.val(),
					className: $this.attr('class')
				};
				currentValue.push(obj);
			});

			var currentList = [];
			$selectorList.find('option').each(function() {
				obj = {
					value: $(this).val(),
					className: $(this).attr('class')
				};
				currentList.push(obj);
			});
			var operationType = "remove";
			broadCastRegisteredEvents(currentValue, currentList, operationType);
		}

		function registerListener() {
			$optionSelector.on('dblclick', 'option', addDblClickListener);
			$selectorList.on('dblclick', 'option', removeDblClickListener);
			$addToSelector.on('click', addBtnListener);
			$removeFromSelector.on('click', removeBtnListener);
			$upBtn.on('click', upBtnListener);
			$downBtn.on('click', downBtnListener);
		}

		function applySearchBox() {
			$optionSelector.filterByText($searchBox, false);
		}

		function populateDataInList() {
			$optionSelector.html(helper.getOptionListForMainList(combineList));
			$selectorList.html(helper.getOptionList(opt.selectorList));
		}

		function triggerSearchManually() {
			searchComputing($optionSelector, $searchBox.val());
		}

		function searchComputing(select, value) {
			var options = $(select).empty().data('options');
			var search = value.trim();
			var regex = new RegExp(search, "gi");
			var l = options.length;
			var o, temp;
			var finalList = [];

			for (var i = 0; i < l; i++) {
				o = options[i];
				temp = $('<option>').text(o.text)
					.val(
						o.value).addClass(o.class).data(
						'json', o.json);
				//match found in the dom
				if (o.text.match(regex) !== null && o.class.indexOf(lastFilterClass) !== -1) {
					//checking whether that is available in the selected list
					var matchAvailable = $selectorList.find('option[value="' + o.value + '"]').is('.' + o.class);
					if (matchAvailable) {
						temp.hide();
					} else {
						temp.show();
					}
				} else {
					temp.hide();
				}
				finalList.push(temp);
			}
			$(select).append(finalList);
		}

		function init() {
			populateDataInList();
			registerListener();

			if (opt.isSearchBoxEnable) {
				if ($searchBox.length) {
					appendSearchInJquery();
					applySearchBox();
				} else {
					throw "Search box is not avialble in DOM";
				}

			} else {
				appendSearchInJquery();
				applySearchBox();
				$searchBox.hide();
			}

			if (!opt.isPriorityEnable) {
				$upBtn.hide();
				$downBtn.hide();
			}
		}

		function appendSearchInJquery() {
			//Filter the Roles/Cookbooks
			$.fn.filterByText = function(textbox) {
				return this.each(function() {
					var select = this;
					var options = [];
					$(select).find('option').each(function() {
						options.push({
							value: $(this).val(),
							text: $(this).text(),
							class: $(this).attr("class"),
							json: $(this).data('json')
						});
					});

					$(select).data('options', options);
					$(textbox).bind('change keyup', function() {
						searchComputing(select, $(this).val());
					});
				});
			};
		}

		function broadCastRegisteredEvents(currentValue, currentList, operationType) {
			var l = eventCallBackList.length;
			for (var i = 0; i < l; i++) {
				eventCallBackList[i].callback(currentValue, currentList, operationType);
			}
			console.log(currentValue + " :: " + currentList.toString() + " :: " + operationType);
		}

		function resetSearch() {
			$searchBox.val('');
		}
		init();

		//api's methods

		//get list of elements which is available right side
		this.getSelectorList = function() {
			var t = [];
			$selectorList.find('option').each(function() {
				t.push({
					value: this.value,
					className: this.classList.toString(),
					data: $(this).data('json')
				});
			});
			return t;
		};

		//get list of elements which is available left side
		this.getOptionList = function() {
			var t = [];
			$optionSelector.find('option:visible').each(function() {
				t.push({
					value: this.value,
					className: this.classList.toString(),
					data: $(this).data('json')
				});
			});
			return t;
		};

		//filter the left list through class
		this.applyFilterThroughClass = function(className) {
			this.resetFilters();
			$optionSelector.children().not('.' + className).each(function() {
				if (!$selectorList.find('option[value="' + this.value + '"]').length) {
					$(this).hide();
				}
			});
			lastFilterClass = className;
		};

		//reset all filters
		this.resetFilters = function() {
			resetSearch();
			$optionSelector.find('option').each(function() {
				if (!$selectorList.find('option[value="' + this.value + '"]').length) {
					$(this).show();
				}
			});
			lastFilterClass = '';
		};

		//register any custom event which will trigger when any update in the right list will happen
		this.addListUpdateListener = function(eventName, callback) {
			var uniqueIdentifier = (new Date()).getTime();
			callback.unique = uniqueIdentifier;
			eventCallBackList.push({
				eventName: eventName,
				callback: callback,
				unique: uniqueIdentifier
			});
		};

		//remove the custom event listener
		this.removeListUpdateListener = function(eventName, callback) {
			var l = eventCallBackList.length;
			var temp = [];
			var t;
			for (var i = 0; i < l; i++) {
				t = eventCallBackList[i];
				if (callback) {
					if (!(callback.unique === t.unique && eventName === t.eventName)) {
						//element deleted
						temp.push(t);
					}
				} else {
					if (eventName !== t.eventName) {
						temp.push(t);
					}
				}
			}
			eventCallBackList = temp;
		};
	};
})(jQuery);
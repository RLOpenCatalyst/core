// https://github.com/Gillardo/bootstrap-ui-datetime-picker
// Version: 2.4.0
// Released: 2016-06-03
angular.module('ui.bootstrap.datetimepicker', ['ui.bootstrap.dateparser', 'ui.bootstrap.position'])
    .constant('uiDatetimePickerConfig', {
        dateFormat: 'yyyy-MM-dd HH:mm',
        defaultTime: '00:00:00',
        html5Types: {
            date: 'yyyy-MM-dd',
            'datetime-local': 'yyyy-MM-ddTHH:mm:ss.sss',
            'month': 'yyyy-MM'
        },
        initialPicker: 'date',
        reOpenDefault: false,
        enableDate: true,
        enableTime: true,
        buttonBar: {
            show: true,
            now: {
                show: true,
                text: 'Now'
            },
            today: {
                show: true,
                text: 'Today'
            },
            clear: {
                show: true,
                text: 'Clear'
            },
            date: {
                show: true,
                text: 'Date'
            },
            time: {
                show: true,
                text: 'Time'
            },
            close: {
                show: true,
                text: 'Close'
            }
        },
        closeOnDateSelection: true,
        closeOnTimeNow: true,
        appendToBody: false,
        altInputFormats: [],
        ngModelOptions: { },
        saveAs: false,
        readAs: false,
    })
    .directive('datetimePicker', function () {
        return {
            restrict: 'A',
            require: ['ngModel', 'datetimePicker'],
            controller: 'DateTimePickerCtrl',
            scope: {
                isOpen: '=?',
                datepickerOptions: '=?',
                timepickerOptions: '=?',
                enableDate: '=?',
                enableTime: '=?',
                initialPicker: '=?',
                reOpenDefault: '=?',
                whenClosed: '&'
            },
            link: function (scope, element, attrs, ctrls) {
                var ngModel = ctrls[0],
                    ctrl = ctrls[1];

                ctrl.init(ngModel);
            }
        };
    }).factory('$uibPosition', ['$document', '$window', function($document, $window) {
    /**
     * Used by scrollbarWidth() function to cache scrollbar's width.
     * Do not access this variable directly, use scrollbarWidth() instead.
     */
    var SCROLLBAR_WIDTH;
    var OVERFLOW_REGEX = {
        normal: /(auto|scroll)/,
        hidden: /(auto|scroll|hidden)/
    };
    var PLACEMENT_REGEX = {
        auto: /\s?auto?\s?/i,
        primary: /^(top|bottom|left|right)$/,
        secondary: /^(top|bottom|left|right|center)$/,
        vertical: /^(top|bottom)$/
    };

    return {

        /**
         * Provides a raw DOM element from a jQuery/jQLite element.
         *
         * @param {element} elem - The element to convert.
         *
         * @returns {element} A HTML element.
         */
        getRawNode: function(elem) {
            return elem.nodeName ? elem : elem[0] || elem;
        },

        /**
         * Provides a parsed number for a style property.  Strips
         * units and casts invalid numbers to 0.
         *
         * @param {string} value - The style value to parse.
         *
         * @returns {number} A valid number.
         */
        parseStyle: function(value) {
            value = parseFloat(value);
            return isFinite(value) ? value : 0;
        },

        /**
         * Provides the closest positioned ancestor.
         *
         * @param {element} element - The element to get the offest parent for.
         *
         * @returns {element} The closest positioned ancestor.
         */
        offsetParent: function(elem) {
            elem = this.getRawNode(elem);

            var offsetParent = elem.offsetParent || $document[0].documentElement;

            function isStaticPositioned(el) {
                return ($window.getComputedStyle(el).position || 'static') === 'static';
            }

            while (offsetParent && offsetParent !== $document[0].documentElement && isStaticPositioned(offsetParent)) {
                offsetParent = offsetParent.offsetParent;
            }

            return offsetParent || $document[0].documentElement;
        },

        /**
         * Provides the scrollbar width, concept from TWBS measureScrollbar()
         * function in https://github.com/twbs/bootstrap/blob/master/js/modal.js
         *
         * @returns {number} The width of the browser scollbar.
         */
        scrollbarWidth: function() {
            if (angular.isUndefined(SCROLLBAR_WIDTH)) {
                var scrollElem = angular.element('<div class="uib-position-scrollbar-measure"></div>');
                $document.find('body').append(scrollElem);
                SCROLLBAR_WIDTH = scrollElem[0].offsetWidth - scrollElem[0].clientWidth;
                SCROLLBAR_WIDTH = isFinite(SCROLLBAR_WIDTH) ? SCROLLBAR_WIDTH : 0;
                scrollElem.remove();
            }

            return SCROLLBAR_WIDTH;
        },

        /**
         * Checks to see if the element is scrollable.
         *
         * @param {element} elem - The element to check.
         * @param {boolean=} [includeHidden=false] - Should scroll style of 'hidden' be considered,
         *   default is false.
         *
         * @returns {boolean} Whether the element is scrollable.
         */
        isScrollable: function(elem, includeHidden) {
            elem = this.getRawNode(elem);

            var overflowRegex = includeHidden ? OVERFLOW_REGEX.hidden : OVERFLOW_REGEX.normal;
            var elemStyle = $window.getComputedStyle(elem);
            return overflowRegex.test(elemStyle.overflow + elemStyle.overflowY + elemStyle.overflowX);
        },

        /**
         * Provides the closest scrollable ancestor.
         * A port of the jQuery UI scrollParent method:
         * https://github.com/jquery/jquery-ui/blob/master/ui/scroll-parent.js
         *
         * @param {element} elem - The element to find the scroll parent of.
         * @param {boolean=} [includeHidden=false] - Should scroll style of 'hidden' be considered,
         *   default is false.
         *
         * @returns {element} A HTML element.
         */
        scrollParent: function(elem, includeHidden) {
            elem = this.getRawNode(elem);

            var overflowRegex = includeHidden ? OVERFLOW_REGEX.hidden : OVERFLOW_REGEX.normal;
            var documentEl = $document[0].documentElement;
            var elemStyle = $window.getComputedStyle(elem);
            var excludeStatic = elemStyle.position === 'absolute';
            var scrollParent = elem.parentElement || documentEl;

            if (scrollParent === documentEl || elemStyle.position === 'fixed') {
                return documentEl;
            }

            while (scrollParent.parentElement && scrollParent !== documentEl) {
                var spStyle = $window.getComputedStyle(scrollParent);
                if (excludeStatic && spStyle.position !== 'static') {
                    excludeStatic = false;
                }

                if (!excludeStatic && overflowRegex.test(spStyle.overflow + spStyle.overflowY + spStyle.overflowX)) {
                    break;
                }
                scrollParent = scrollParent.parentElement;
            }

            return scrollParent;
        },

        /**
         * Provides read-only equivalent of jQuery's position function:
         * http://api.jquery.com/position/ - distance to closest positioned
         * ancestor.  Does not account for margins by default like jQuery position.
         *
         * @param {element} elem - The element to caclulate the position on.
         * @param {boolean=} [includeMargins=false] - Should margins be accounted
         * for, default is false.
         *
         * @returns {object} An object with the following properties:
         *   <ul>
         *     <li>**width**: the width of the element</li>
         *     <li>**height**: the height of the element</li>
         *     <li>**top**: distance to top edge of offset parent</li>
         *     <li>**left**: distance to left edge of offset parent</li>
         *   </ul>
         */
        position: function(elem, includeMagins) {
            elem = this.getRawNode(elem);

            var elemOffset = this.offset(elem);
            if (includeMagins) {
                var elemStyle = $window.getComputedStyle(elem);
                elemOffset.top -= this.parseStyle(elemStyle.marginTop);
                elemOffset.left -= this.parseStyle(elemStyle.marginLeft);
            }
            var parent = this.offsetParent(elem);
            var parentOffset = {top: 0, left: 0};

            if (parent !== $document[0].documentElement) {
                parentOffset = this.offset(parent);
                parentOffset.top += parent.clientTop - parent.scrollTop;
                parentOffset.left += parent.clientLeft - parent.scrollLeft;
            }

            return {
                width: Math.round(angular.isNumber(elemOffset.width) ? elemOffset.width : elem.offsetWidth),
                height: Math.round(angular.isNumber(elemOffset.height) ? elemOffset.height : elem.offsetHeight),
                top: Math.round(elemOffset.top - parentOffset.top),
                left: Math.round(elemOffset.left - parentOffset.left)
            };
        },

        /**
         * Provides read-only equivalent of jQuery's offset function:
         * http://api.jquery.com/offset/ - distance to viewport.  Does
         * not account for borders, margins, or padding on the body
         * element.
         *
         * @param {element} elem - The element to calculate the offset on.
         *
         * @returns {object} An object with the following properties:
         *   <ul>
         *     <li>**width**: the width of the element</li>
         *     <li>**height**: the height of the element</li>
         *     <li>**top**: distance to top edge of viewport</li>
         *     <li>**right**: distance to bottom edge of viewport</li>
         *   </ul>
         */
        offset: function(elem) {
            elem = this.getRawNode(elem);

            var elemBCR = elem.getBoundingClientRect();
            return {
                width: Math.round(angular.isNumber(elemBCR.width) ? elemBCR.width : elem.offsetWidth),
                height: Math.round(angular.isNumber(elemBCR.height) ? elemBCR.height : elem.offsetHeight),
                top: Math.round(elemBCR.top + ($window.pageYOffset || $document[0].documentElement.scrollTop)),
                left: Math.round(elemBCR.left + ($window.pageXOffset || $document[0].documentElement.scrollLeft))
            };
        },

        /**
         * Provides offset distance to the closest scrollable ancestor
         * or viewport.  Accounts for border and scrollbar width.
         *
         * Right and bottom dimensions represent the distance to the
         * respective edge of the viewport element.  If the element
         * edge extends beyond the viewport, a negative value will be
         * reported.
         *
         * @param {element} elem - The element to get the viewport offset for.
         * @param {boolean=} [useDocument=false] - Should the viewport be the document element instead
         * of the first scrollable element, default is false.
         * @param {boolean=} [includePadding=true] - Should the padding on the offset parent element
         * be accounted for, default is true.
         *
         * @returns {object} An object with the following properties:
         *   <ul>
         *     <li>**top**: distance to the top content edge of viewport element</li>
         *     <li>**bottom**: distance to the bottom content edge of viewport element</li>
         *     <li>**left**: distance to the left content edge of viewport element</li>
         *     <li>**right**: distance to the right content edge of viewport element</li>
         *   </ul>
         */
        viewportOffset: function(elem, useDocument, includePadding) {
            elem = this.getRawNode(elem);
            includePadding = includePadding !== false ? true : false;

            var elemBCR = elem.getBoundingClientRect();
            var offsetBCR = {top: 0, left: 0, bottom: 0, right: 0};

            var offsetParent = useDocument ? $document[0].documentElement : this.scrollParent(elem);
            var offsetParentBCR = offsetParent.getBoundingClientRect();

            offsetBCR.top = offsetParentBCR.top + offsetParent.clientTop;
            offsetBCR.left = offsetParentBCR.left + offsetParent.clientLeft;
            if (offsetParent === $document[0].documentElement) {
                offsetBCR.top += $window.pageYOffset;
                offsetBCR.left += $window.pageXOffset;
            }
            offsetBCR.bottom = offsetBCR.top + offsetParent.clientHeight;
            offsetBCR.right = offsetBCR.left + offsetParent.clientWidth;

            if (includePadding) {
                var offsetParentStyle = $window.getComputedStyle(offsetParent);
                offsetBCR.top += this.parseStyle(offsetParentStyle.paddingTop);
                offsetBCR.bottom -= this.parseStyle(offsetParentStyle.paddingBottom);
                offsetBCR.left += this.parseStyle(offsetParentStyle.paddingLeft);
                offsetBCR.right -= this.parseStyle(offsetParentStyle.paddingRight);
            }

            return {
                top: Math.round(elemBCR.top - offsetBCR.top),
                bottom: Math.round(offsetBCR.bottom - elemBCR.bottom),
                left: Math.round(elemBCR.left - offsetBCR.left),
                right: Math.round(offsetBCR.right - elemBCR.right)
            };
        },

        /**
         * Provides an array of placement values parsed from a placement string.
         * Along with the 'auto' indicator, supported placement strings are:
         *   <ul>
         *     <li>top: element on top, horizontally centered on host element.</li>
         *     <li>top-left: element on top, left edge aligned with host element left edge.</li>
         *     <li>top-right: element on top, lerightft edge aligned with host element right edge.</li>
         *     <li>bottom: element on bottom, horizontally centered on host element.</li>
         *     <li>bottom-left: element on bottom, left edge aligned with host element left edge.</li>
         *     <li>bottom-right: element on bottom, right edge aligned with host element right edge.</li>
         *     <li>left: element on left, vertically centered on host element.</li>
         *     <li>left-top: element on left, top edge aligned with host element top edge.</li>
         *     <li>left-bottom: element on left, bottom edge aligned with host element bottom edge.</li>
         *     <li>right: element on right, vertically centered on host element.</li>
         *     <li>right-top: element on right, top edge aligned with host element top edge.</li>
         *     <li>right-bottom: element on right, bottom edge aligned with host element bottom edge.</li>
         *   </ul>
         * A placement string with an 'auto' indicator is expected to be
         * space separated from the placement, i.e: 'auto bottom-left'  If
         * the primary and secondary placement values do not match 'top,
         * bottom, left, right' then 'top' will be the primary placement and
         * 'center' will be the secondary placement.  If 'auto' is passed, true
         * will be returned as the 3rd value of the array.
         *
         * @param {string} placement - The placement string to parse.
         *
         * @returns {array} An array with the following values
         * <ul>
         *   <li>**[0]**: The primary placement.</li>
         *   <li>**[1]**: The secondary placement.</li>
         *   <li>**[2]**: If auto is passed: true, else undefined.</li>
         * </ul>
         */
        parsePlacement: function(placement) {
            var autoPlace = PLACEMENT_REGEX.auto.test(placement);
            if (autoPlace) {
                placement = placement.replace(PLACEMENT_REGEX.auto, '');
            }

            placement = placement.split('-');

            placement[0] = placement[0] || 'top';
            if (!PLACEMENT_REGEX.primary.test(placement[0])) {
                placement[0] = 'top';
            }

            placement[1] = placement[1] || 'center';
            if (!PLACEMENT_REGEX.secondary.test(placement[1])) {
                placement[1] = 'center';
            }

            if (autoPlace) {
                placement[2] = true;
            } else {
                placement[2] = false;
            }

            return placement;
        },

        /**
         * Provides coordinates for an element to be positioned relative to
         * another element.  Passing 'auto' as part of the placement parameter
         * will enable smart placement - where the element fits. i.e:
         * 'auto left-top' will check to see if there is enough space to the left
         * of the hostElem to fit the targetElem, if not place right (same for secondary
         * top placement).  Available space is calculated using the viewportOffset
         * function.
         *
         * @param {element} hostElem - The element to position against.
         * @param {element} targetElem - The element to position.
         * @param {string=} [placement=top] - The placement for the targetElem,
         *   default is 'top'. 'center' is assumed as secondary placement for
         *   'top', 'left', 'right', and 'bottom' placements.  Available placements are:
         *   <ul>
         *     <li>top</li>
         *     <li>top-right</li>
         *     <li>top-left</li>
         *     <li>bottom</li>
         *     <li>bottom-left</li>
         *     <li>bottom-right</li>
         *     <li>left</li>
         *     <li>left-top</li>
         *     <li>left-bottom</li>
         *     <li>right</li>
         *     <li>right-top</li>
         *     <li>right-bottom</li>
         *   </ul>
         * @param {boolean=} [appendToBody=false] - Should the top and left values returned
         *   be calculated from the body element, default is false.
         *
         * @returns {object} An object with the following properties:
         *   <ul>
         *     <li>**top**: Value for targetElem top.</li>
         *     <li>**left**: Value for targetElem left.</li>
         *     <li>**placement**: The resolved placement.</li>
         *   </ul>
         */
        positionElements: function(hostElem, targetElem, placement, appendToBody) {
            hostElem = this.getRawNode(hostElem);
            targetElem = this.getRawNode(targetElem);

            // need to read from prop to support tests.
            var targetWidth = angular.isDefined(targetElem.offsetWidth) ? targetElem.offsetWidth : targetElem.prop('offsetWidth');
            var targetHeight = angular.isDefined(targetElem.offsetHeight) ? targetElem.offsetHeight : targetElem.prop('offsetHeight');

            placement = this.parsePlacement(placement);

            var hostElemPos = appendToBody ? this.offset(hostElem) : this.position(hostElem);
            var targetElemPos = {top: 0, left: 0, placement: ''};

            if (placement[2]) {
                var viewportOffset = this.viewportOffset(hostElem);

                var targetElemStyle = $window.getComputedStyle(targetElem);
                var adjustedSize = {
                    width: targetWidth + Math.round(Math.abs(this.parseStyle(targetElemStyle.marginLeft) + this.parseStyle(targetElemStyle.marginRight))),
                    height: targetHeight + Math.round(Math.abs(this.parseStyle(targetElemStyle.marginTop) + this.parseStyle(targetElemStyle.marginBottom)))
                };

                placement[0] = placement[0] === 'top' && adjustedSize.height > viewportOffset.top && adjustedSize.height <= viewportOffset.bottom ? 'bottom' :
                    placement[0] === 'bottom' && adjustedSize.height > viewportOffset.bottom && adjustedSize.height <= viewportOffset.top ? 'top' :
                        placement[0] === 'left' && adjustedSize.width > viewportOffset.left && adjustedSize.width <= viewportOffset.right ? 'right' :
                            placement[0] === 'right' && adjustedSize.width > viewportOffset.right && adjustedSize.width <= viewportOffset.left ? 'left' :
                                placement[0];

                placement[1] = placement[1] === 'top' && adjustedSize.height - hostElemPos.height > viewportOffset.bottom && adjustedSize.height - hostElemPos.height <= viewportOffset.top ? 'bottom' :
                    placement[1] === 'bottom' && adjustedSize.height - hostElemPos.height > viewportOffset.top && adjustedSize.height - hostElemPos.height <= viewportOffset.bottom ? 'top' :
                        placement[1] === 'left' && adjustedSize.width - hostElemPos.width > viewportOffset.right && adjustedSize.width - hostElemPos.width <= viewportOffset.left ? 'right' :
                            placement[1] === 'right' && adjustedSize.width - hostElemPos.width > viewportOffset.left && adjustedSize.width - hostElemPos.width <= viewportOffset.right ? 'left' :
                                placement[1];

                if (placement[1] === 'center') {
                    if (PLACEMENT_REGEX.vertical.test(placement[0])) {
                        var xOverflow = hostElemPos.width / 2 - targetWidth / 2;
                        if (viewportOffset.left + xOverflow < 0 && adjustedSize.width - hostElemPos.width <= viewportOffset.right) {
                            placement[1] = 'left';
                        } else if (viewportOffset.right + xOverflow < 0 && adjustedSize.width - hostElemPos.width <= viewportOffset.left) {
                            placement[1] = 'right';
                        }
                    } else {
                        var yOverflow = hostElemPos.height / 2 - adjustedSize.height / 2;
                        if (viewportOffset.top + yOverflow < 0 && adjustedSize.height - hostElemPos.height <= viewportOffset.bottom) {
                            placement[1] = 'top';
                        } else if (viewportOffset.bottom + yOverflow < 0 && adjustedSize.height - hostElemPos.height <= viewportOffset.top) {
                            placement[1] = 'bottom';
                        }
                    }
                }
            }

            switch (placement[0]) {
                case 'top':
                    targetElemPos.top = hostElemPos.top - targetHeight;
                    break;
                case 'bottom':
                    targetElemPos.top = hostElemPos.top + hostElemPos.height;
                    break;
                case 'left':
                    targetElemPos.left = hostElemPos.left - targetWidth;
                    break;
                case 'right':
                    targetElemPos.left = hostElemPos.left + hostElemPos.width;
                    break;
            }

            switch (placement[1]) {
                case 'top':
                    targetElemPos.top = hostElemPos.top;
                    break;
                case 'bottom':
                    targetElemPos.top = hostElemPos.top + hostElemPos.height - targetHeight;
                    break;
                case 'left':
                    targetElemPos.left = hostElemPos.left;
                    break;
                case 'right':
                    targetElemPos.left = hostElemPos.left + hostElemPos.width - targetWidth;
                    break;
                case 'center':
                    if (PLACEMENT_REGEX.vertical.test(placement[0])) {
                        targetElemPos.left = hostElemPos.left + hostElemPos.width / 2 - targetWidth / 2;
                    } else {
                        targetElemPos.top = hostElemPos.top + hostElemPos.height / 2 - targetHeight / 2;
                    }
                    break;
            }

            targetElemPos.top = Math.round(targetElemPos.top);
            targetElemPos.left = Math.round(targetElemPos.left);
            targetElemPos.placement = placement[1] === 'center' ? placement[0] : placement[0] + '-' + placement[1];

            return targetElemPos;
        },

        /**
         * Provides a way for positioning tooltip & dropdown
         * arrows when using placement options beyond the standard
         * left, right, top, or bottom.
         *
         * @param {element} elem - The tooltip/dropdown element.
         * @param {string} placement - The placement for the elem.
         */
        positionArrow: function(elem, placement) {
            elem = this.getRawNode(elem);

            var innerElem = elem.querySelector('.tooltip-inner, .popover-inner');
            if (!innerElem) {
                return;
            }

            var isTooltip = angular.element(innerElem).hasClass('tooltip-inner');

            var arrowElem = isTooltip ? elem.querySelector('.tooltip-arrow') : elem.querySelector('.arrow');
            if (!arrowElem) {
                return;
            }

            var arrowCss = {
                top: '',
                bottom: '',
                left: '',
                right: ''
            };

            placement = this.parsePlacement(placement);
            if (placement[1] === 'center') {
                // no adjustment necessary - just reset styles
                angular.element(arrowElem).css(arrowCss);
                return;
            }

            var borderProp = 'border-' + placement[0] + '-width';
            var borderWidth = $window.getComputedStyle(arrowElem)[borderProp];

            var borderRadiusProp = 'border-';
            if (PLACEMENT_REGEX.vertical.test(placement[0])) {
                borderRadiusProp += placement[0] + '-' + placement[1];
            } else {
                borderRadiusProp += placement[1] + '-' + placement[0];
            }
            borderRadiusProp += '-radius';
            var borderRadius = $window.getComputedStyle(isTooltip ? innerElem : elem)[borderRadiusProp];

            switch (placement[0]) {
                case 'top':
                    arrowCss.bottom = isTooltip ? '0' : '-' + borderWidth;
                    break;
                case 'bottom':
                    arrowCss.top = isTooltip ? '0' : '-' + borderWidth;
                    break;
                case 'left':
                    arrowCss.right = isTooltip ? '0' : '-' + borderWidth;
                    break;
                case 'right':
                    arrowCss.left = isTooltip ? '0' : '-' + borderWidth;
                    break;
            }

            arrowCss[placement[1]] = borderRadius;

            angular.element(arrowElem).css(arrowCss);
        }
    };
}]).controller('DateTimePickerCtrl', ['$scope', '$element', '$attrs', '$compile', '$parse', '$document', '$timeout', '$uibPosition', 'dateFilter', 'uibDateParser', 'uiDatetimePickerConfig', '$rootScope',
        function ($scope, $element, $attrs, $compile, $parse, $document, $timeout, $uibPosition, dateFilter, uibDateParser, uiDatetimePickerConfig, $rootScope) {
            var dateFormat = uiDatetimePickerConfig.dateFormat,
                ngModel, ngModelOptions, $popup, cache = {}, watchListeners = [],
                closeOnDateSelection = angular.isDefined($attrs.closeOnDateSelection) ? $scope.$parent.$eval($attrs.closeOnDateSelection) : uiDatetimePickerConfig.closeOnDateSelection,
                closeOnTimeNow = angular.isDefined($attrs.closeOnTimeNow) ? $scope.$parent.$eval($attrs.closeOnTimeNow) : uiDatetimePickerConfig.closeOnTimeNow,
                appendToBody = angular.isDefined($attrs.datepickerAppendToBody) ? $scope.$parent.$eval($attrs.datepickerAppendToBody) : uiDatetimePickerConfig.appendToBody,
                altInputFormats = angular.isDefined($attrs.altInputFormats) ? $scope.$parent.$eval($attrs.altInputFormats) : uiDatetimePickerConfig.altInputFormats,
                saveAs = angular.isDefined($attrs.saveAs) ? $scope.$parent.$eval($attrs.saveAs) || $attrs.saveAs : uiDatetimePickerConfig.saveAs,
                readAs = angular.isDefined($attrs.readAs) ? $scope.$parent.$eval($attrs.readAs) : uiDatetimePickerConfig.readAs;

            this.init = function(_ngModel) {
                ngModel = _ngModel;
                ngModelOptions = ngModel.$options || uiDatetimePickerConfig.ngModelOptions;

                $scope.buttonBar = angular.isDefined($attrs.buttonBar) ? $scope.$parent.$eval($attrs.buttonBar) : uiDatetimePickerConfig.buttonBar;

                // determine which pickers should be available. Defaults to date and time
                $scope.enableDate = angular.isDefined($scope.enableDate) ? $scope.enableDate : uiDatetimePickerConfig.enableDate;
                $scope.enableTime = angular.isDefined($scope.enableTime) ? $scope.enableTime : uiDatetimePickerConfig.enableTime;

                // determine default picker
                $scope.initialPicker = angular.isDefined($attrs.initialPicker) ? $attrs.initialPicker : ($scope.enableDate ? uiDatetimePickerConfig.initialPicker : 'time');

                // determine the picker to open when control is re-opened
                $scope.reOpenDefault = angular.isDefined($attrs.reOpenDefault) ? $attrs.reOpenDefault : uiDatetimePickerConfig.reOpenDefault;

                // check if an illegal combination of options exists
                if ($scope.initialPicker == 'date' && !$scope.enableDate) {
                    throw new Error("datetimePicker can't have initialPicker set to date and have enableDate set to false.");
                }

                // default picker view
                $scope.showPicker = !$scope.enableDate ? 'time' : $scope.initialPicker;

                var isHtml5DateInput = false;

                if (uiDatetimePickerConfig.html5Types[$attrs.type]) {
                    dateFormat = uiDatetimePickerConfig.html5Types[$attrs.type];
                    isHtml5DateInput = true;
                } else {
                    dateFormat = $attrs.datetimePicker || uiDatetimePickerConfig.dateFormat;
                    $attrs.$observe('datetimePicker', function(value) {
                        var newDateFormat = value || uiDatetimePickerConfig.dateFormat;

                        if (newDateFormat !== dateFormat) {
                            dateFormat = newDateFormat;
                            ngModel.$modelValue = null;

                            if (!dateFormat) {
                                throw new Error('datetimePicker must have a date format specified.');
                            }
                        }
                    });
                }

                if (!dateFormat) {
                    throw new Error('datetimePicker must have a date format specified.');
                }

                // popup element used to display calendar
                var popupEl = angular.element('' +
                    '<div date-picker-wrap>' +
                    '<div datepicker></div>' +
                    '</div>' +
                    '<div time-picker-wrap>' +
                    '<div timepicker style="margin:0 auto"></div>' +
                    '</div>');

                if (ngModelOptions) {
                    timezone = ngModelOptions.timezone;
                    $scope.ngModelOptions = angular.copy(ngModelOptions);
                    $scope.ngModelOptions.timezone = null;
                    if ($scope.ngModelOptions.updateOnDefault === true) {
                        $scope.ngModelOptions.updateOn = $scope.ngModelOptions.updateOn ?
                        $scope.ngModelOptions.updateOn + ' default' : 'default';
                    }

                    popupEl.attr('ng-model-options', 'ngModelOptions');
                } else {
                    timezone = null;
                }

                // get attributes from directive
                popupEl.attr({
                    'ng-model': 'date',
                    'ng-change': 'dateSelection(date)'
                });

                // datepicker element
                var datepickerEl = angular.element(popupEl.children()[0]);

                if (!$scope.datepickerOptions) {
                    $scope.datepickerOptions = {};
                }

                if (isHtml5DateInput) {
                    if ($attrs.type === 'month') {
                        $scope.datepickerOptions.datepickerMode = 'month';
                        $scope.datepickerOptions.minMode = 'month';
                    }
                }

                datepickerEl.attr('datepicker-options', 'datepickerOptions');

                // set datepickerMode to day by default as need to create watch
                // else disabled cannot pass in mode
                if (!angular.isDefined($scope.datepickerOptions.datepickerMode)) {
                    $scope.datepickerOptions.datepickerMode = 'day';
                }

                // timepicker element
                var timepickerEl = angular.element(popupEl.children()[1]);

                if (!$scope.timepickerOptions)
                    $scope.timepickerOptions = {};

                for (var key in $scope.timepickerOptions) {
                    timepickerEl.attr(cameltoDash(key), 'timepickerOptions.' + key);
                }

                // watch attrs - NOTE: minDate and maxDate are used with datePicker and timePicker.  By using the minDate and maxDate
                // with the timePicker, you can dynamically set the min and max time values.  This cannot be done using the min and max values
                // with the timePickerOptions
                angular.forEach(['minDate', 'maxDate', 'initDate'], function(key) {
                    if ($scope.datepickerOptions[key]) {
                        if (key == 'minDate') {
                            timepickerEl.attr('min', 'datepickerOptions.minDate');
                        } else if (key == 'maxDate')
                            timepickerEl.attr('max', 'datepickerOptions.maxDate');
                    }
                });

                // do not check showWeeks attr, as should be used via datePickerOptions

                if (!isHtml5DateInput) {
                    // Internal API to maintain the correct ng-invalid-[key] class
                    ngModel.$$parserName = 'datetime';
                    ngModel.$validators.datetime = validator;
                    ngModel.$parsers.unshift(parseDate);
                    ngModel.$formatters.push(function(value) {
                        if (ngModel.$isEmpty(value)) {
                            $scope.date = value;
                            return value;
                        }

                        $scope.date = uibDateParser.fromTimezone(value, ngModelOptions.timezone);

                        dateFormat = dateFormat.replace(/M!/, 'MM')
                            .replace(/d!/, 'dd');

                        return uibDateParser.filter($scope.date, dateFormat);
                    });
                } else {
                    ngModel.$formatters.push(function(value) {
                        $scope.date = uibDateParser.fromTimezone(value, ngModelOptions.timezone);
                        return value;
                    });
                }

                if (saveAs) {
                    // If it is determined closure var's need to be exposed to the parser, don't add the formatter here.
                    // Instead just call the method from within the stock parser with this context and/or any needed closure variables.
                    if (angular.isFunction(saveAs))
                        ngModel.$parsers.push(saveAs);
                    else
                        ngModel.$parsers.push(saveAsParser);

                    // Assuming if saveAs is !false, we'll want to convert, either pass the function, or the stock str/num -> Date obj formatter.
                    if (angular.isFunction(readAs))
                        ngModel.$formatters.push(readAs);
                    else
                        ngModel.$formatters.push(readAsFormatter);
                }
                // Detect changes in the view from the text box
                ngModel.$viewChangeListeners.push(function() {
                    $scope.date = parseDateString(ngModel.$viewValue);
                });

                $element.bind('keydown', inputKeydownBind);

                $popup = $compile(popupEl)($scope);
                // Prevent jQuery cache memory leak (template is now redundant after linking)
                popupEl.remove();

                if (appendToBody) {
                    $document.find('body').append($popup);
                } else {
                    $element.after($popup);
                }

                function readAsFormatter(value) {
                    if (ngModel.$isEmpty(value))
                        return value;

                    var d = new Date(value);
                    if (angular.isDate(d) && !isNaN(d))
                        return d;

                    return value;
                }

                function saveAsParser(value) {
                    if (!value || angular.isString(value) || !angular.isDate(value) || isNaN(value))
                        return value;

                    if (saveAs === 'ISO')
                        return value.toISOString();

                    if (saveAs === 'json')
                        return value.toJSON();

                    if (saveAs === 'number')
                        return value.valueOf();

                    if (!isHtml5DateInput) {
                        dateFormat = dateFormat.replace(/M!/, 'MM')
                            .replace(/d!/, 'dd');
                        return uibDateParser.filter(uibDateParser.fromTimezone(value, ngModelOptions.timezone), dateFormat);
                    } else {
                        return uibDateParser.fromTimezone(value, ngModelOptions.timezone).toLocaleString();
                    }
                }
            };

            // get text
            $scope.getText = function (key) {
                return $scope.buttonBar[key].text || uiDatetimePickerConfig.buttonBar[key].text;
            };

            // determine if button is to be shown or not
            $scope.doShow = function(key) {
                if (angular.isDefined($scope.buttonBar[key].show))
                    return $scope.buttonBar[key].show;
                else
                    return uiDatetimePickerConfig.buttonBar[key].show;
            };

            // Inner change
            $scope.dateSelection = function (dt, opt) {

                // check if timePicker is being shown and merge dates, so that the date
                // part is never changed, only the time
                if ($scope.enableTime && $scope.showPicker === 'time') {

                    // only proceed if dt is a date
                    if (dt || dt != null) {
                        // check if our $scope.date is null, and if so, set to todays date
                        if (!angular.isDefined($scope.date) || $scope.date == null) {
                            $scope.date = new Date();
                        }

                        // dt will not be undefined if the now or today button is pressed
                        if (dt && dt != null) {
                            // get the existing date and update the time
                            var date = new Date($scope.date);
                            date.setHours(dt.getHours());
                            date.setMinutes(dt.getMinutes());
                            date.setSeconds(dt.getSeconds());
                            date.setMilliseconds(dt.getMilliseconds());
                            dt = date;
                        }
                    }
                }

                if (angular.isDefined(dt)) {
                    if (!$scope.date) {
                        var defaultTime = angular.isDefined($attrs.defaultTime) ? $attrs.defaultTime : uiDatetimePickerConfig.defaultTime;
                        var t = new Date('2001-01-01 ' + defaultTime);

                        if (!isNaN(t) && dt != null) {
                            dt.setHours(t.getHours());
                            dt.setMinutes(t.getMinutes());
                            dt.setSeconds(t.getSeconds());
                            dt.setMilliseconds(t.getMilliseconds());
                        }
                    }
                    $scope.date = dt;
                }

                var date = $scope.date ? dateFilter($scope.date, dateFormat, ngModelOptions.timezone) : null;

                $element.val(date);
                ngModel.$setViewValue(date);

                if (closeOnDateSelection) {
                    // do not close when using timePicker as make impossible to choose a time
                    if ($scope.showPicker != 'time' && date != null) {
                        // if time is enabled, swap to timePicker
                        if ($scope.enableTime) {
                            $scope.open('time');
                        } else {
                            $scope.close(false);
                        }
                    } else if (closeOnTimeNow && $scope.showPicker === 'time' && date != null && opt === 'now') {
                        $scope.close(false);
                    }
                }

            };

            $scope.$watch('isOpen', function (value) {
                $scope.dropdownStyle = {
                    display: value ? 'block' : 'none'
                };

                if (value) {
                    cache['openDate'] = $scope.date;

                    var position = appendToBody ? $uibPosition.offset($element) : $uibPosition.position($element);

                    if (appendToBody) {
                        $scope.dropdownStyle.top = (position.top + $element.prop('offsetHeight')) +'px';
                    } else {
                        $scope.dropdownStyle.top = undefined;
                    }

                    $scope.dropdownStyle.left = position.left + 'px';

                    $timeout(function() {
                        $scope.$broadcast('uib:datepicker.focus');
                        $document.bind('click', documentClickBind);
                    }, 0, false);

                    $scope.open($scope.showPicker);
                } else {
                    $document.unbind('click', documentClickBind);
                }
            });

            $scope.isDisabled = function(date) {
                if (date === 'today' || date === 'now')
                    date = uibDateParser.fromTimezone(new Date(), timezone);

                var dates = {};
                angular.forEach(['minDate', 'maxDate'], function(key) {
                    if (!$scope.datepickerOptions[key]) {
                        dates[key] = null;
                    } else if (angular.isDate($scope.datepickerOptions[key])) {
                        dates[key] = uibDateParser.fromTimezone(new Date($scope.datepickerOptions[key]), timezone);
                    } else {
                        dates[key] = new Date(dateFilter($scope.datepickerOptions[key], 'medium'));
                    }
                });

                return $scope.datepickerOptions &&
                    dates.minDate && $scope.compare(date, dates.minDate) < 0 ||
                    dates.maxDate && $scope.compare(date, dates.maxDate) > 0;
            };

            $scope.compare = function(date1, date2) {
                return new Date(date1.getFullYear(), date1.getMonth(), date1.getDate()) - new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
            };

            $scope.select = function (opt) {

                var date = null;
                var isNow = opt === 'now';

                if (opt === 'today' || opt == 'now') {
                    var now = new Date();
                    if (angular.isDate($scope.date)) {
                        date = new Date($scope.date);
                        date.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
                        date.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
                    } else {
                        date = now;
                    }
                }

                $scope.dateSelection(date, opt);
            };

            $scope.open = function (picker, evt) {
                if (angular.isDefined(evt)) {
                    evt.preventDefault();
                    evt.stopPropagation();
                }

                // need to delay this, else timePicker never shown
                $timeout(function() {
                    $scope.showPicker = picker;
                }, 0);

                // in order to update the timePicker, we need to update the model reference!
                // as found here https://angular-ui.github.io/bootstrap/#/timepicker
                if (picker == 'time') {
                    $timeout(function() {
                        $scope.date = parseDateString(ngModel.$viewValue);
                    }, 50);
                }
            };

            $scope.close = function (closePressed) {
                $scope.isOpen = false;

                // if enableDate and enableTime are true, reopen the picker in date mode first
                if ($scope.enableDate && $scope.enableTime)
                    $scope.showPicker = $scope.reOpenDefault === false ? 'date' : $scope.reOpenDefault;

                // if a on-close-fn has been defined, lets call it
                // we only call this if closePressed is defined!
                if (angular.isDefined(closePressed)) {
                    $scope.whenClosed({ args: { closePressed: closePressed, openDate: cache['openDate'] || null, closeDate: $scope.date } });
                } else {
                    $element[0].focus();
                }
            };

            $scope.$on('$destroy', function () {
                if ($scope.isOpen === true) {
                    if (!$rootScope.$$phase) {
                        $scope.$apply(function() {
                            $scope.close();
                        });
                    }
                }

                watchListeners.forEach(function(a) { a(); });
                $popup.remove();
                $element.unbind('keydown', inputKeydownBind);
                $document.unbind('click', documentClickBind);
            });

            function documentClickBind(evt) {
                var popup = $popup[0];
                var dpContainsTarget = $element[0].contains(evt.target);

                // The popup node may not be an element node
                // In some browsers (IE only) element nodes have the 'contains' function
                var popupContainsTarget = popup.contains !== undefined && popup.contains(evt.target);

                if ($scope.isOpen && !(dpContainsTarget || popupContainsTarget)) {
                    $scope.$apply(function() {
                        $scope.close(false);
                    });
                }
            }

            function inputKeydownBind (evt) {
                if (evt.which === 27 && $scope.isOpen) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    $scope.$apply(function() {
                        $scope.close(false);
                    });
                    $element[0].focus();
                } else if (evt.which === 40 && !$scope.isOpen) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    $scope.$apply(function() {
                        $scope.isOpen = true;
                    });
                }
            }

            function cameltoDash(string) {
                return string.replace(/([A-Z])/g, function ($1) { return '-' + $1.toLowerCase(); });
            }

            function parseDateString(viewValue) {
                var date = uibDateParser.parse(viewValue, dateFormat, $scope.date);
                if (isNaN(date)) {
                    for (var i = 0; i < altInputFormats.length; i++) {
                        date = uibDateParser.parse(viewValue, altInputFormats[i], $scope.date);
                        if (!isNaN(date)) {
                            return date;
                        }
                    }
                }
                return date;
            }

            function parseDate(viewValue) {
                if (angular.isNumber(viewValue) && !isNaN(viewValue)) {
                    // presumably timestamp to date object
                    viewValue = new Date(viewValue);
                }

                if (!viewValue) {
                    return null;
                }

                if (angular.isDate(viewValue) && !isNaN(viewValue)) {
                    return viewValue;
                }

                if (angular.isString(viewValue)) {
                    var date = parseDateString(viewValue);
                    if (!isNaN(date)) {
                        return uibDateParser.toTimezone(date, ngModelOptions.timezone);
                    }

                    return undefined;
                } else {
                    return undefined;
                }
            }

            function validateMinMax(value) {
                if ($scope.datepickerOptions.minDate && value < $scope.datepickerOptions.minDate) {
                    return false;
                } else if ($scope.datepickerOptions.maxDate && value > $scope.datepickerOptions.maxDate) {
                    return false;
                } else {
                    return true;
                }
            }

            function validator(modelValue, viewValue) {
                var value = modelValue || viewValue;

                if (!($attrs.ngRequired || $attrs.required) && !value) {
                    return true;
                }

                if (angular.isNumber(value)) {
                    value = new Date(value);
                }

                if (!value) {
                    return true;
                } else if (angular.isDate(value) && !isNaN(value)) {
                    return validateMinMax (value);
                } else if (angular.isDate(new Date(value)) && !isNaN(new Date(value).valueOf())) {
                    return validateMinMax (new Date(value));
                } else if (angular.isString(value)) {
                    return !isNaN(parseDateString(viewValue)) && validateMinMax(parseDateString(viewVialue));
                } else {
                    return false;
                }
            }

        }])
    .directive('datePickerWrap', function () {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
           templateUrl: 'template/date-picker.html'
        };
    })

    .directive('timePickerWrap', function () {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            templateUrl: 'template/time-picker.html'
        };
    });

angular.module('ui.bootstrap.datetimepicker').run(['$templateCache', function($templateCache) {
    'use strict';

    $templateCache.put('template/date-picker.html',
        "<ul class=\"dropdown-menu dropdown-menu-left datetime-picker-dropdown\" ng-if=\"isOpen && showPicker == 'date'\" ng-style=dropdownStyle style=left:inherit><li style=\"padding:0 5px 5px 5px\" class=date-picker-menu><div ng-transclude></div></li><li style=padding:5px ng-if=buttonBar.show><span class=\"btn-group pull-left\" style=margin-right:10px ng-if=\"doShow('today') || doShow('clear')\"><button type=button class=\"btn btn-sm btn-info\" ng-if=\"doShow('today')\" ng-click=\"select('today')\" ng-disabled=\"isDisabled('today')\">{{ getText('today') }}</button> <button type=button class=\"btn btn-sm btn-danger\" ng-if=\"doShow('clear')\" ng-click=\"select('clear')\">{{ getText('clear') }}</button></span> <span class=\"btn-group pull-right\" ng-if=\"(doShow('time') && enableTime) || doShow('close')\"><button type=button class=\"btn btn-sm btn-default\" ng-if=\"doShow('time') && enableTime\" ng-click=\"open('time', $event)\">{{ getText('time')}}</button> <button type=button class=\"btn btn-sm btn-success\" ng-if=\"doShow('close')\" ng-click=close(true)>{{ getText('close') }}</button></span> <span class=clearfix></span></li></ul>"
    );


    $templateCache.put('template/time-picker.html',
        "<ul class=\"dropdown-menu dropdown-menu-left datetime-picker-dropdown\" ng-if=\"isOpen && showPicker == 'time'\" ng-style=dropdownStyle style=left:inherit><li style=\"padding:0 5px 5px 5px\" class=time-picker-menu><div ng-transclude></div></li><li style=padding:5px ng-if=buttonBar.show><span class=\"btn-group pull-left\" style=margin-right:10px ng-if=\"doShow('now') || doShow('clear')\"><button type=button class=\"btn btn-sm btn-info\" ng-if=\"doShow('now')\" ng-click=\"select('now')\" ng-disabled=\"isDisabled('now')\">{{ getText('now') }}</button> <button type=button class=\"btn btn-sm btn-danger\" ng-if=\"doShow('clear')\" ng-click=\"select('clear')\">{{ getText('clear') }}</button></span> <span class=\"btn-group pull-right\" ng-if=\"(doShow('date') && enableDate) || doShow('close')\"><button type=button class=\"btn btn-sm btn-default\" ng-if=\"doShow('date') && enableDate\" ng-click=\"open('date', $event)\">{{ getText('date')}}</button> <button type=button class=\"btn btn-sm btn-success\" ng-if=\"doShow('close')\" ng-click=close(true)>{{ getText('close') }}</button></span> <span class=clearfix></span></li></ul>"
    );

}]);
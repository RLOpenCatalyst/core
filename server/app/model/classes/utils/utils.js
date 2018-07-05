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


var util = require('util');
var utils = {
    arrayMerge: function(array1, array2) {

        var a = array1.concat(array2);
        for (var i = 0; i < a.length; ++i) {
            for (var j = i + 1; j < a.length; ++j) {
                if (a[i] === a[j])
                    a.splice(j--, 1);
            }
        }
        return a;
    },
    mergeObjects: function(objectsArray) {

        var attributeObj = {};
        var currentObj;

        function mergeObj(currentObj, obj) {
            var keys = Object.keys(obj);
            for (var j = 0; j < keys.length; j++) {
                if (!currentObj[keys[j]]) {
                    currentObj[keys[j]] = {};
                }
                if (typeof obj[keys[j]] === 'object' && !util.isArray(obj[keys[j]])) {
                    mergeObj(currentObj[keys[j]], obj[keys[j]]);
                } else {
                    currentObj[keys[j]] = obj[keys[j]];
                }
            }
        }
        for (var i = 0; i < objectsArray.length; i++) {
            currentObj = attributeObj;
            mergeObj(currentObj, objectsArray[i]);
            attributeObj = currentObj;
        }
        return attributeObj;

    }

};


module.exports = utils;


var logger = require('_pr/logger')(module);
var tasks  = null;

var normalizedUtil = function() {

    this.normalizedSort = function(jsonData,key){
        if(!tasks){
            tasks=  require('../../model/classes/tasks/tasks.js')
        }
        tasks.NormalizedTasks(jsonData, key, function (err, normalized) {
            if (err) {
                return;
            }
        });
    }

}


module.exports = new normalizedUtil();
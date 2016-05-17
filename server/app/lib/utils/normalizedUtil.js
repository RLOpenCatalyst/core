var task = null;
var instance = null;

var normalizedUtil = function() {

    this.normalizedSort = function(jsonData, key) {

        if(jsonData.id === 'tasks') {
            if (!task) {
                task = require('../../model/classes/tasks/tasks.js')
            }
            task.NormalizedTasks(jsonData, key, function (err, normalized) {
                if (err) {
                    return;
                }
            });

        }else if(jsonData.id === 'instances'){
            if (!instance) {
                instance = require('../../model/classes/instance/instance.js')
            }
            instance.NormalizedInstances(jsonData, key, function (err, normalized) {
                if (err) {
                    return;
                }
            });
        }else{
            return;
        }
    }

}


module.exports = new normalizedUtil();
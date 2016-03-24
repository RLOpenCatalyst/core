/**
 * Created by Durgesh Sharma on 29/2/16.
 */

var record_limit=10;
var max_record_limit=100;
var skip_Records=0;
var sort_instances='state';
var order='desc';
var filter_records=[{state:'running'},{region:'us-west-1'}];

module.exports.record_limit = record_limit;
module.exports.skip_Records = skip_Records;
module.exports.sort_instances = sort_instances;
module.exports.order = order;
module.exports.filter_records = filter_records;
module.exports.max_record_limit = max_record_limit;


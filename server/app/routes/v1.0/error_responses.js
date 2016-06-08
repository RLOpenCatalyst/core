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


// This file act as a error handler.


function getErrMsgObj(msg) {
    return {
        message: msg
    }
}


module.exports = {
    chef: {
        connectionError: getErrMsgObj('Unable to Connect to Chef Server'),
        corruptChefData: getErrMsgObj('Chef server data corrupted. Please add a new chef server.')
    },
    db: {
        error: getErrMsgObj('Server Behaved Unexpectedly')
    },
    instance: {
        notFound: getErrMsgObj('Instance Does Not Exist'),
        exist: getErrMsgObj('Instance Exist'),
    },
    jenkins: {
        notFound: getErrMsgObj('Jenkins Server Id Does Not Exist'),
        serverError: getErrMsgObj('Jenkins server error'),
        buildInQueue: getErrMsgObj('A build is already in queue')
    }

};
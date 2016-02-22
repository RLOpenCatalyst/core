
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


/*
Maintains a single instance of socket.io through out the application 
*/

var Server = require('socket.io');

var io;

function initAuth(io, authFunc) {
	// authorization
	if (typeof authFunc === 'function') {
		io.use(authFunc);
	}
}


module.exports.getInstance = function(httpOrPort, opts) {
	if (io) {
		return io;
	}
	if (httpOrPort) {
		io = Server(httpOrPort, opts);
	} else {
		io = Server(opts);
	}
	initAuth(io, opts.authFunc);
	return io;
};
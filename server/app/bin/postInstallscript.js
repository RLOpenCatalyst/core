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

var os = require('os');
var childProcess = require('child_process');
var fs = require('fs');


console.log('Running post installation script');



var shortLinkPath = __dirname + '/../../node_modules/_pr';
var osName = os.type();
console.log(osName + ' detected');
console.log('Removing previous shortlink');
fs.unlink(shortLinkPath, function(err) {
    console.log('Creating short links'); 
    var cmd = 'ln -s ../app ' + shortLinkPath;
    if (osName === 'Windows') {
        cmd = 'mklink /D ' + shortLinkPath + ' ..\\app';
    }

    childProcess.exec(cmd, {
        //cwd: nodeModulesDirPath
    }, function(err, stdout, stderr) {
        if (err) {
            throw err;
            return;
        }
        console.log('post installation script ran successfully');
    });
});
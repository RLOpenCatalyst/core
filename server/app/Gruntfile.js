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

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
  	pkg: grunt.file.readJSON('package.json'),

  	jshint: {
  		// http://jshint.com/docs/options/

  		options:{
  			//camelcase:true,
  			curly:true,
  			maxstatements:100,
  			newcap:true,
  			//unused:true,
  			undef:true,
  			singleGroups:true,
  			maxparams: 4,
  			maxdepth:3,
  			freeze:true,
  			node:true,
  			noarg:true,
  			//strict:true,
  			
  			// http://stackoverflow.com/questions/359494/does-it-matter-which-equals-operator-vs-i-use-in-javascript-comparisons
  			//eqeqeq:true,
  			immed:true

  		},
  		all: ['model/**/*.js', 'config/**/*.js', 'lib/**/*.js', 'routes/**/*.js']
  	}
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
};

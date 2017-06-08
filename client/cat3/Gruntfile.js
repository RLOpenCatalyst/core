/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		bower: {
			install: {}
		},
		uglify: {
			options: {
				sourceMap: false,
				sourceMapName: function(filePath) {
					return filePath + '.map';
				},
				beautify : false,
				mangle   : true
			},
			clientlib: {
				files: [{
					expand: true,
					cwd: 'lib/',
					src: ['**/*.js', '!**/*.min.js'],
					dest: 'lib/',
					ext: '.min.js'
				}]
			},
			clientbuild: {
				files: [{
					expand: true,
					cwd: 'catalyst/concatjs',
					src: ['**/*.js', '!**/*.min.js'],
					dest: 'catalyst/',
					ext: '.min.js'
				}]
			}
		},
		concat: {
			jsconcat: {
				options: {
					separator: '\n'
				},
				files: [{
					src: ['src/main.js', 'src/clientRoutes.js', 'src/factory/*.js', 'src/custom_filter/*.js', 'src/partials/globals/**/*.js', 'src/partials/sections/**/**/**/*.js', 'src/utility/*.js'],
					dest:'catalyst/concatjs/catalyst.js'
				}]
			}
		},
		concurrent: {
			dev: {
				tasks: ['watch'],
				options: {
					logConcurrentOutput: true
				}
			}
		},
		nodemon: {
			dev: {
				script: 'app.js',
				options: {
					ignore: [
						'node_modules/**',
						'dist/**'
					],
					ext: 'js',
					watch:['server'],
					delay:1000,
					legacyWatch:true
				}
			}
		},
		sass: {
			dist:{
				files:[
					{'catalyst/partials/sections/card/card.css':'src/partials/sections/card/card.scss'},
					{'catalyst/partials/sections/login/login.css':'src/partials/sections/login/login.scss'},
					{'catalyst/partials/globals/header/header.css':'src/partials/globals/header/header.scss'},
					{'catalyst/partials/global.css':'src/partials/global.scss'},
					{'catalyst/partials/globals/treeComponent/treeDirective.css':'src/partials/globals/treeComponent/treeDirective.scss'},
					{'catalyst/partials/sections/dashboard/workzone/workzone.css':'src/partials/sections/dashboard/workzone/workzone.scss'},
					{'catalyst/partials/sections/dashboard/workzone/instance/instance.css':'src/partials/sections/dashboard/workzone/instance/instance.scss'},			 
					{'catalyst/partials/sections/dashboard/workzone/blueprint/blueprint.css':'src/partials/sections/dashboard/workzone/blueprint/blueprint.scss'},
					{'catalyst/partials/sections/dashboard/workzone/cloudFormation/cloudFormation.css':'src/partials/sections/dashboard/workzone/cloudFormation/cloudFormation.scss'},
					{'catalyst/partials/sections/dashboard/workzone/container/container.css':'src/partials/sections/dashboard/workzone/container/container.scss'},
					{'catalyst/partials/sections/dashboard/workzone/orchestration/orchestration.css':'src/partials/sections/dashboard/workzone/orchestration/orchestration.scss'},
					{'catalyst/partials/sections/dashboard/workzone/application/application.css':'src/partials/sections/dashboard/workzone/application/application.scss'},
					{'catalyst/partials/sections/dashboard/analytics/analytics.css':'src/partials/sections/dashboard/analytics/analytics.scss'},
					{'catalyst/partials/sections/dashboard/design/design.css':'src/partials/sections/dashboard/design/design.scss'},
					{'catalyst/partials/sections/dashboard/bots/bots.css':'src/partials/sections/dashboard/bots/bots.scss'},
					{'catalyst/partials/sections/dashboard/services/services.css':'src/partials/sections/dashboard/services/services.scss'},
					{'catalyst/partials/sections/dashboard/setting/setting.css':'src/partials/sections/dashboard/setting/setting.scss'}
				]
			}
		},
		watch: {
			clientJS: {
				files: [					
					'src/**/*.js'
				],
				tasks: ['newer:jshint:client']
			},
			css: {
				files: 'src/**/*.scss',
				tasks: ['newer:sass']
			}
		},
		copy: {
			main: {
				files: [
				{
					expand: true,
					cwd: 'src/',
					src: ['partials/**/*.html'],
					dest: 'dist/src/',
					filter: 'isFile'
				},
				{
					expand: true,
					cwd: 'catalyst/',
					src: ['partials/**/*.css'],
					dest: 'dist/catalyst/',
					filter: 'isFile'
				},
				{
					expand: true,
					src: ['lib/**/*.js', 'lib/**/*.css'],
					dest: 'dist/',
					filter: 'isFile'
				},
				{
					expand: true,
					src: ['customlib/*.js'],
					dest: 'dist/',
					filter: 'isFile'
				},
				{
					expand: true,
					src: ['styles/**/*.*'],
					dest: 'dist/',
					filter: 'isFile'
				},
				{
					expand: true,
					src: ['data/*.json', 'images/**/*.*'],
					dest: 'dist/',
					filter: 'isFile'
				},
				{
					expand: true,
					src: ['catalyst/**/*.js'],
					dest: 'dist/',
					filter: 'isFile'
				},
				{
					src: ['uiConfig.js'],
					dest: 'dist/',
					filter: 'isFile'
				}]
			}
		},
		jshint: {
			client: {
				options: {
					jshintrc: '.jshintrc-client',
					ignores: [
						'dist/**/*.min.js'
					]
				},
				src: [
					'src/*.js',
					'src/**/*.js'
				]
			}
		},
		clean: {
			clientlib: {
				src: ['bower_components', 'lib']
			},
			serverlib: {
				src: ['node_modules']
			},
			clientbuild: {
				src: ['dist', 'catalyst', 'index.html']
			}
		},
		processhtml: {
			options: {
			},
			dist: {
				files: {
					'dist/index.html': ['main.html']
				}
			},
			prod: {
				files: {
					'index.html': ['main.html']
				}
			},
			qa: {
				files: {
					'index.html': ['main.html']
				}
			},
			dev: {
				files: {
					'index.html': ['main.html']
				}
			}
		}
	});
	grunt.loadNpmTasks('grunt-bower-task');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-nodemon');
	grunt.loadNpmTasks('grunt-newer');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-processhtml');
	grunt.registerTask('build-dev', ['clean:clientlib', 'clean:clientbuild', 'bower:install', 'sass', 'uglify:clientlib', 'processhtml:dev', 'jshint' ]);
	grunt.registerTask('build-qa', ['clean:clientlib', 'clean:clientbuild', 'bower:install', 'sass', 'concat:jsconcat', 'uglify:clientlib', 'uglify:clientbuild', 'processhtml:qa' ]);
	grunt.registerTask('build-prod', ['clean:clientlib', 'clean:clientbuild', 'bower:install', 'sass', 'concat:jsconcat', 'uglify:clientlib', 'uglify:clientbuild', 'processhtml:prod' ]);
	grunt.registerTask('default', ['clean:clientlib', 'clean:clientbuild', 'bower:install', 'sass', 'concat:jsconcat', 'uglify:clientlib', 'uglify:clientbuild', 'processhtml:prod' ]);
	grunt.registerTask('build-dist', ['clean:clientlib', 'clean:clientbuild', 'bower:install', 'sass', 'concat:jsconcat', 'uglify:clientlib', 'uglify:clientbuild', 'copy', 'processhtml:dist' ]);
	grunt.registerTask('clean-directory', ['clean:clientlib',  'clean:clientbuild', 'clean:serverlib']);
	grunt.registerTask('quality-check', ['jshint']);
	grunt.registerTask('compile-sass', ['sass']);
}
/* global module: false */

module.exports = function(grunt) {
    "use strict";

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        typescript: {
            base: {
                src: ['src/**/*.ts'],
                dest: 'build/private/gobo.js',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    basePath: 'src'
                }
            },
            'tests-local': {
                src: ['tests/local.ts', 'tests/*.test.ts'],
                dest: 'build/private/local-test.js',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    basePath: 'tests'
                }
            },
            'test-data': {
                src: ['tests/test-data.ts', 'tests/*.test.ts'],
                dest: 'build/private/test-data.js',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    basePath: 'tests'
                }
            },
            'test-framework': {
                src: ['tests/framework.ts'],
                dest: 'build/private/test-framework.js',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    basePath: 'tests'
                }
            },
            'test-server': {
                src: ['tests/test-server.ts'],
                dest: 'build/private/test-server.js',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    basePath: 'tests'
                }
            }
        },

        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            },
            dist: {
                src: ['src/**/*.ts']
            }
        },

        import: {
            dist: {
                src: 'src/wrap.js',
                dest: 'build/gobo.debug.js'
            }
        },

        uglify: {
            build: {
                src: 'build/gobo.debug.js',
                dest: 'build/gobo-<%= pkg.version %>.min.js'
            }
        },

        watch: {
            files: ['src/**/*', 'Gruntfile.js', 'tests/**/*'],
            tasks: ['default']
        },

        bytesize: {
            all: {
                src: ['build/gobo-*.min.js']
            }
        },

        mochaTest: {
            test: {
                src: ['build/private/local-test.js']
            }
        }
    });

    grunt.registerTask('test-server', function() {
        var data = require('./build/private/test-data.js')();
        var server = require('./build/private/test-server.js');
        server.start(data);
        this.async();
    });

    // Plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-bytesize');
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-import');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-tslint');

    // Default task(s).
    grunt.registerTask('default',
        ['typescript', 'import', 'tslint', 'mochaTest', 'uglify', 'bytesize']);

    grunt.registerTask('dev', ['typescript', 'import', 'watch']);
};


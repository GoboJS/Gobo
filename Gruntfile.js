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
            tests: {
                src: ['tests/**/*.ts'],
                dest: 'build/private/test.js',
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
                src: ['build/private/test.js']
            }
        },

        connect: {
            server: {
                options: {
                    port: 8080,
                    base: '.'
                }
            }
        }
    });

    // Plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-bytesize');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-import');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-tslint');

    // Default task(s).
    grunt.registerTask('default',
        ['typescript', 'tslint', 'import', 'mochaTest', 'uglify', 'bytesize']);

    grunt.registerTask('dev', ['typescript', 'connect', 'watch']);
};


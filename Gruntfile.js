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
                src: ['tests/framework/local.ts', 'tests/*.test.ts'],
                dest: 'build/private/local-test.js',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    basePath: 'tests'
                }
            },
            'test-data': {
                src: ['tests/framework/data.ts', 'tests/*.test.ts'],
                dest: 'build/private/test-data.js',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    basePath: 'tests'
                }
            },
            'test-framework': {
                src: ['tests/framework/framework.ts'],
                dest: 'build/private/test-framework.js',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    basePath: 'tests'
                }
            },
            'test-server': {
                src: ['tests/framework/server.ts'],
                dest: 'build/private/test-server.js',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    basePath: 'tests'
                }
            },
            'test-harness': {
                src: ['tests/framework/harness.ts'],
                dest: 'build/private/test-harness.js',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    basePath: 'tests'
                }
            },
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
            files: ['src/**/*', 'Gruntfile.js', 'tests/**/*.ts'],
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
        },

        'saucelabs-custom': {
            all: {
                options: {
                    urls: [ 'http://localhost:8080' ],
                    build: process.env.CI_BUILD_NUMBER || Date.now(),
                    testname: 'Gobo unit tests',
                    public: "public",
                    browsers: [
                        {
                            browserName: 'firefox',
                            platform: 'WIN8.1'
                        },
                        {
                            browserName: 'chrome',
                            platform: 'WIN8.1'
                        },
                        {
                            browserName: 'internet explorer',
                            version: '11',
                            platform: 'WIN8.1'
                        },
                        {
                            browserName: 'internet explorer',
                            version: '10',
                            platform: 'WIN8'
                        },
                        {
                            browserName: 'internet explorer',
                            version: '9',
                            platform: 'WIN7'
                        },
                        {
                            browserName: 'safari',
                            platform: 'OS X 10.10',
                            version: '8.0'
                        },
                        {
                            browserName: 'android',
                            platform: 'Linux',
                            version: '4.4',
                            deviceName: 'Android Emulator'
                        },
                        {
                            browserName: 'android',
                            platform: 'Linux',
                            version: '4.3',
                            deviceName: 'Android Emulator'
                        },
                        {
                            browserName: 'iphone',
                            platform: 'OS X 10.10',
                            version: '8.1',
                            deviceName: 'iPhone Simulator'
                        }
                    ]
                }
            }
        }
    });

    grunt.registerTask('test-server', function() {
        console.log("Starting server");
        require('./build/private/test-server.js')().start();
    });

    // Plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-bytesize');
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-import');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-tslint');
    grunt.loadNpmTasks('grunt-saucelabs');

    // Default task(s).
    grunt.registerTask('default',
        ['typescript', 'import', 'tslint', 'mochaTest', 'uglify', 'bytesize']);

    grunt.registerTask('dev', ['typescript', 'import', 'test-server', 'watch']);

    grunt.registerTask('release',
        ['default', 'test-server', 'saucelabs-custom']);
};


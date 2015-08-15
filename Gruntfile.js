'use strict';

module.exports = function (grunt) {
  require('jit-grunt')(grunt, {
    injector: 'grunt-asset-injector'
  });

  grunt.initConfig({
    app: {
      tmp: './.tmp',
      dist: './dist',
      demo: './demo',
      src: './src',
      jasmine: './jasmine'
    },
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      'default': {
        files: ['<%= app.src %>/**/*.js'],
        tasks: []
      },
      options: {
        livereload: true
      }
    },
    // Injector
    injector: {
      'jasmine-src': {
        options: {
          transform: function(filePath) {
            filePath = filePath.replace('\/\.', '..');
            return '<script src="' + filePath + '"></script>';
          },
          starttag: '<!-- injector:src -->',
          endtag: '<!-- endinjector -->'
        },
        files: {
          '<%= app.jasmine %>/SpecRunner.html': [
            [
              '<%= app.src %>/**/*.js',
              '!<%= app.src %>/**/*.spec.js'
            ]
          ]
        }
      },
      'jasmine-spec': {
        options: {
          transform: function(filePath) {
            filePath = filePath.replace('\/\.', '..');
            return '<script src="' + filePath + '"></script>';
          },
          starttag: '<!-- injector:spec -->',
          endtag: '<!-- endinjector -->'
        },
        files: {
          '<%= app.jasmine %>/SpecRunner.html': [
            [
              '!<%= app.src %>/**/*.js',
              '<%= app.src %>/**/*.spec.js'
            ]
          ]
        }
      },
      // Inject application script files into index.html (doesn't include bower)
      'demo-src': {
        options: {
          transform: function(filePath) {
            filePath = filePath.replace('\/\.', '..');
            return '<script src="' + filePath + '"></script>';
          },
          starttag: '<!-- injector:js -->',
          endtag: '<!-- endinjector -->'
        },
        files: {
          '<%= app.demo %>/index.html': [
            [
              '<%= app.dist %>/<%= pkg.name%>.js',
              '<%= app.demo %>/app/**/*.js'
            ]
          ]
        }
      }
    },
    // Automatically inject Bower components into the app
    wiredep: {
      demo: {
        src: '<%= app.demo %>/index.html',
        exclude: []
      },
      jasmine: {
        src: '<%= app.jasmine %>/SpecRunner.html',
        exclude: [/bootstrap.js/]
      }
    },
    // Clean
    clean: {
      'dist': ['dist/*']
    },
    // Concat
    concat: {
      dist: {
        options: {
          separator: '\n',
          banner: '(function(angular) {\n',
          footer: '\n})(angular);'
        },
        src: ['src/**/*.js', '!src/**/*.spec.js'],
        dest: '<%= app.dist %>/<%= pkg.name %>.js'
      }
    },
    // Uglify
    uglify: {
      dist: {
        options: {
          enclose: {angular:'angular'},
          sourceMap: true,
          sourceMapName: '<%= app.dist%>/<%= pkg.name %>.map'
        },
        files: {
          '<%= app.dist%>/<%= pkg.name %>.min.js': ['src/**/*.js', '!src/**/*.spec.js']
        }
      }
    },

    jsdoc : {
      dist : {
        src: ['src/**/*.js', '!src/**/*.spec.js'],
        options: {
          destination: 'doc'
        }
      }
    },

    eslint: {
      target: ['src/**/*.js', '!src/**/*.spec.js']
    },

    githooks: {
      all: {
        'pre-commit': 'eslint'
      }
    },

    // Test settings
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        reporters: ['spec'],
        singleRun: true
      }
    },

    connect: {
      'demo': {
        options: {
          port: 3333,
          livereload: true,
          open: true,
          base: {
            path: './',
            options: {
              index: './demo/index.html'
            }
          }
        }
      },
      'test': {
        options: {
          port: 4444,
          keepalive: true,
          open: true,
          base: {
            path: './',
            options: {
              index: './jasmine/SpecRunner.html'
            }
          }
        }
      }
    }
  });

  grunt.registerTask('build', ['eslint', 'clean:dist', 'concat:dist', 'uglify:dist']);
  grunt.registerTask('serve', ['wiredep:demo', 'injector:demo-src','connect:demo','watch']);
  grunt.registerTask('test', ['injector:jasmine-src', 'injector:jasmine-spec', 'wiredep:jasmine', 'clean:dist', 'concat:dist', 'karma:unit']);

};
'use strict';

module.exports = function (grunt) {
  require('jit-grunt')(grunt, {
    injector: 'grunt-asset-injector'
  });

  var karmaDefaultFiles = [
    'vendors/lodash/lodash.js',
    'vendors/angular/angular.js',
    'vendors/angular-mocks/angular-mocks.js'
  ];

  grunt.initConfig({
    app: {
      tmp: './.tmp',
      dist: './dist',
      demo: './demo',
      src: './src/**/*.js',
      specs: './test/**/*.spec.js',
      packageName: '<%= app.dist %>/<%= pkg.name %>.js',
      packageNameMin: '<%= app.dist %>/<%= pkg.name %>.min.js',
      packageNameMap: '<%= app.dist %>/<%= pkg.name %>.map',
      jasmine: './jasmine',
      jasmineSpecRunner: '<%= app.jasmine %>/SpecRunner.html'
    },
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/**\n' +
        ' * <%= pkg.name %>\n' +
        ' * <%= pkg.description %>\n' +
        ' * @author <%= pkg.author %>\n' +
        ' * @version v<%= pkg.version %><%= buildtag %>\n' +
        ' * @link <%= pkg.homepage %>\n' +
        ' * @license <%= pkg.license %>\n' +
        ' */'
    },
    watch: {
      'default': {
        files: ['<%= app.src %>'],
        tasks: []
      },
      options: {
        livereload: true
      }
    },
    // Injector
    injector: {
      'build': {
        options: {
          transform: function(filePath) {
            filePath = filePath.replace('\/\.', '..');
            return '<script src="' + filePath + '"></script>';
          },
          starttag: '<!-- injector:src -->',
          endtag: '<!-- endinjector -->'
        },
        files: {
          '<%= app.jasmineSpecRunner %>': '<%= app.packageNameMin %>'
        }
      },
      'src': {
        options: {
          transform: function(filePath) {
            filePath = filePath.replace('\/\.', '..');
            return '<script src="' + filePath + '"></script>';
          },
          starttag: '<!-- injector:src -->',
          endtag: '<!-- endinjector -->'
        },
        files: {
          '<%= app.jasmineSpecRunner %>': '<%= app.src %>'
        }
      },
      'spec': {
        options: {
          transform: function(filePath) {
            filePath = filePath.replace('\/\.', '..');
            return '<script src="' + filePath + '"></script>';
          },
          starttag: '<!-- injector:spec -->',
          endtag: '<!-- endinjector -->'
        },
        files: {
          '<%= app.jasmineSpecRunner %>': '<%= app.specs %>'
        }
      }
    },
    // Automatically inject Bower components into the app
    wiredep: {
      jasmine: {
        src: '<%= app.jasmineSpecRunner %>',
        exclude: [/bootstrap.js/]
      }
    },

    clean: {
      'dist': ['dist/*', 'doc/*']
    },

    concat: {
      'dist': {
        options: {
          banner: '<%= meta.banner %>\n\n'+
                  '(function (window, angular, undefined) {\n',
          footer: '})(window, window.angular);'
        },
        src: ['<%= app.src %>'],
        dest: '<%= app.packageName %>'
      }
    },

    // Uglify
    uglify: {
      dist: {
        options: {
          enclose: {angular:'angular'},
          sourceMap: true,
          sourceMapName: '<%= app.packageNameMap %>'
        },
        files: {
          '<%= app.packageNameMin %>': '<%= app.src %>'
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
      target: ['<%= app.src %>']
    },

    githooks: {
      all: {
        'pre-commit': 'eslint'
      }
    },

    // Test settings
    karma: {
      options: {
        files: karmaDefaultFiles
      },

      build:{
        configFile: 'karma.conf.js',
        reporters: ['spec'],
        singleRun: true,
        files: [
          {src: ['<%= app.packageNameMin %>']},
          {src: ['<%= app.specs %>']}
        ]
      },

      unit: {
        configFile: 'karma.conf.js',
        reporters: ['spec'],
        singleRun: true,
        files: [
          {src: ['<%= app.src %>']},
          {src: ['<%= app.specs %>']}
        ]
      }
    },

    // Allow the use of non-minsafe AngularJS files. Automatically makes it
    // minsafe compatible so Uglify does not destroy the ng references
    ngAnnotate: {
      options: {
        singleQuotes: true
      },
      dist: {
        files: [{
          expand: true,
          cwd: './dist',
          src: '*.js',
          dest: './dist'
        }]
      }
    },

    connect: {
      'test': {
        options: {
          port: 4444,
          keepalive: true,
          open: true,
          base: {
            path: './',
            options: {
              index: '<%= jasmineSpecRunner %>'
            }
          }
        }
      }
    }
  });

  grunt.registerTask('build', ['clean:dist', 'eslint', 'karma:unit', 'concat:dist', 'ngAnnotate:dist', 'uglify:dist']);

  grunt.registerTask('test', function(target){
    if (target === 'build') {
      grunt.task.run([
        'clean:dist',
        'eslint',
        'concat:dist',
        'ngAnnotate:dist',
        'uglify:dist',
        'karma:build'
      ]);
    }
    else {
      grunt.task.run([
        'injector:src',
        'injector:spec',
        'wiredep:jasmine',
        'clean:dist',
        'concat:dist',
        'karma:unit'
      ]);
    }
  });
};
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
      src: './src'
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
      // Inject application script files into index.html (doesn't include bower)
      scripts: {
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
                '<%= app.demo %>/app/**/*.js',
                '!<%= app.src %>/**/*.spec.js'
              ]
            ]
        }
      }
    },
    // Automatically inject Bower components into the app
    wiredep: {
      target: {
        src: '<%= app.demo %>/index.html',
        exclude: ['/angular-mocks/']
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
            footer: '\n})(angular);',
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
    // Test settings
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true
      }
    },
    connect: {
      'default': {
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
      }
    }
  });

  grunt.registerTask('build', ['clean:dist', 'concat:dist', 'uglify:dist']);
  grunt.registerTask('serve', ['wiredep','injector','connect','watch']);
  grunt.registerTask('test', ['clean:dist', 'concat:dist', 'karma:unit']);

};
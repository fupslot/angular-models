'use strict';

module.exports = function (grunt) {
  require('jit-grunt')(grunt, {
    injector: 'grunt-asset-injector',
  });

  grunt.initConfig({
    app: {
      demo: 'demo',
      src: 'src'
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
            filePath = filePath.replace('/src', '../src');
            filePath = filePath.replace('/demo', '../demo');
            return '<script src="' + filePath + '"></script>';
          },
          starttag: '<!-- injector:js -->',
          endtag: '<!-- endinjector -->'
        },
        files: {
          '<%= app.demo %>/index.html': [
              [
                '<%= app.src %>/**/*.js',
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
      'default': {
        options: {
            separator: '\n'
        },
        src: ['src/**/*.js', '!src/**/*.spec.js'],
        dest: './dist/<%= appFileDest %>'
      }
    },
    // Test settings
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: false
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

  grunt.registerTask('build', ['clean:dist', '']);

  grunt.registerTask('default', [
    'wiredep','injector','connect','watch'
  ]);

  grunt.registerTask('test', ['connect:unit', 'jasmine']);
};
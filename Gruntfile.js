var path = require('path');
var ip = require('ip');
var md5File = require('md5-file');
var chalk = require('chalk');
var fs = require('fs');

module.exports = function (grunt) {
  // Get the name of the creative
  var name = path.basename(__dirname);

  // Get the ip of the device
  var address = ip.address();

  // The port to use
  var PORT = 3012;

  // The md5 hash of build/creative.min.js, set in the task hash
  var md5Sum = '';

  // Allows to automatically require all the tasks
  require('load-grunt-tasks')(grunt);

  // Load all tasks
  grunt.loadTasks('scripts/tasks');
  grunt.loadNpmTasks('grunt-webpack');

  // Start configuration
  grunt.initConfig({
    // Clean the build directory
    clean: {
      main: ['build'],
    },

    // Minify the pngs
    pngmin: {
      main: {
        options: {
          colors: 128,
          ext: '.png',
          quality: '0-100',
        },
        files: [
          {
            src: 'assets/images/*',
            dest: 'build/tmp/images/',
          },
        ],
      },
    },

    // Encode the images in base64 in a JSON
    images_encoder: {
      main: {
        src: ['build/tmp/images/*'],
        dest: 'build/tmp/images.json',
      },
    },

    // Encode the spritesheets in a JSON
    spritesheets_encoder: {
      main: {
        src: ['assets/spritesheets/*'],
        dest: 'build/tmp/spritesheets.json',
      },
    },

    // Uglify the code
    uglify: {
      main: {
        options: {
          sourceMap: true,
          sourceMapIncludeSources: true,
        },
        files: {
          ['build/creative.min.js']: ['build/creative.js'],
        },
      },
    },

    // Replace
    replace: {
      main: {
        options: {
          patterns: [
            // Replace images
            {
              match: 'IMAGES',
              replacement: '<%= grunt.file.read("build/tmp/images.json") %>',
            },
            // Replace spritesheets
            {
              match: 'SPRITESHEETS',
              replacement:
                '<%= grunt.file.read("build/tmp/spritesheets.json") %>',
            },
            // Replace the script
            {
              match: 'SCRIPT',
              replacement: '<%= grunt.file.read("build/tmp/script.min.js") %>',
            },
          ],
        },
        files: [
          {
            expand: true,
            flatten: true,
            src: ['scripts/templates/creative.js'],
            dest: 'build/',
          },
        ],
      },
      html: {
        options: {
          patterns: [
            {
              match: 'CREATIVEURL',
              replacement:
                'http://' + address + ':' + PORT + '/' + 'creative.min.js',
            },
          ],
        },
        files: [
          {
            expand: true,
            flatten: true,
            src: ['scripts/templates/index.html'],
            dest: 'build/',
          },
        ],
      },
    },

    // Copy the libs (essentially motionlead) to the build directory
    copy: {
      main: {
        files: [
          {
            expand: true,
            flatten: true,
            src: ['scripts/libs/*'],
            dest: 'build/tmp/libs/',
          },
        ],
      },
    },

    // Starts the express server
    express: {
      main: {
        options: {
          bases: ['./build/'],
          hostname: '0.0.0.0',
          port: PORT,
          livereload: true,
        },
      },
    },

    // Open the dev page in the browser
    open: {
      main: {
        path: 'http://' + address + ':' + PORT + '/index.html',
      },
    },

    // Watch for changes
    watch: {
      main: {
        files: ['src/**/*'],
        tasks: ['webpack', 'replace', 'uglify'],
        options: {
          livereload: true,
        },
      },
      assets: {
        files: ['assets/**/*'],
        tasks: [
          'pngmin',
          'images_encoder',
          'spritesheets_encoder',
          'webpack',
          'replace',
          'uglify',
        ],
        options: {
          livereload: true,
        },
      },
    },

    compress: {
      main: {
        options: {
          archive: 'build/creative-src-assets.zip',
          mode: 'zip',
        },
        files: [
          {
            expand: true,
            cwd: 'assets/',
            src: '**',
            dest: 'assets/',
          },
          {
            expand: true,
            cwd: 'src/',
            src: '**',
            dest: 'src/',
          },
        ],
      },
    },

    // Upload on AWS S3
    aws_s3: {
      options: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      main: {
        options: {
          bucket: 'dsp-creatives',
          region: 'eu-west-1',
        },
        files: [
          // Overwrite the latest version of the creative
          {
            expand: true,
            cwd: 'build/',
            src: 'creative.min.js',
            dest: 'playable/' + name + '/',
          },
          // The uniquely identified version of the creative (md5sum appended)
          {
            expand: true,
            cwd: 'build/',
            src: 'creative.min.js',
            dest: 'playable/' + name + '/',
            rename: function (dest, src) {
              return (
                dest + path.basename(src, '.min.js') + '-' + md5Sum + '.min.js'
              );
            },
          },
          // The uniquely identified src/assets zip (md5sum appended)
          {
            expand: true,
            cwd: 'build/',
            src: 'creative-src-assets.zip',
            dest: 'playable/' + name + '/',
            rename: function (dest, src) {
              return dest + path.basename(src, '.zip') + '-' + md5Sum + '.zip';
            },
          },
        ],
      },
    },

    webpack: {
      main: {
        entry: './src/main.js',
        output: {
          path: path.join(__dirname, 'build/tmp'),
          filename: 'script.min.js',
        },
      },
    },
  });

  grunt.registerTask('alert_size', function () {});

  grunt.registerTask('hash', function () {
    // Update the md5Sum variable
    md5Sum = md5File('./build/creative.min.js').slice(0, 8);
  });

  grunt.registerTask('print_url', function () {
    grunt.log.writeln(
      chalk.green(
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
      )
    );
    grunt.log.writeln('Specific version url:');
    grunt.log.ok(
      chalk.cyan(
        'https://cdn-creatives.adikteev.com/playable/' +
          name +
          '/creative-' +
          md5Sum +
          '.min.js'
      )
    );
    grunt.log.writeln('Specific version assets/src archive url:');
    grunt.log.ok(
      chalk.cyan(
        'https://cdn-creatives.adikteev.com/playable/' +
          name +
          '/creative-src-assets-' +
          md5Sum +
          '.zip'
      )
    );
    grunt.log.ok(
      chalk.cyan(
        'https://cdn-creatives.adikteev.com/playable/' +
          name +
          '/creative.min.js'
      )
    );
    grunt.log.writeln(
      chalk.green(
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
      )
    );
    grunt.log.writeln('Demo Link');
    grunt.log.ok(
      chalk.cyan(
        'https://cdn-creatives.adikteev.com/Creatives/demoLink/MLEngine/index.html' +
          '?' +
          name +
          '/creative-' +
          md5Sum +
          '.min.js'
      )
    );
    grunt.log.writeln(
      chalk.green(
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
      )
    );
  });

  grunt.registerTask('alert_size', function () {
    var stats = fs.statSync('build/creative.min.js');
    var size = stats['size'] / 1000000;

    if (size > 1) {
      grunt.log.writeln(
        chalk.red(
          'Warning! Creative file is too big (' + size.toFixed(2) + 'M)'
        )
      );
    } else {
      grunt.log.writeln(
        chalk.green(
          'OK. Creative file is less than 1M (' + size.toFixed(2) + 'M)'
        )
      );
    }
  });

  grunt.registerTask('build', [
    'clean',
    'pngmin',
    'images_encoder',
    'spritesheets_encoder',
    'webpack',
    'replace',
    'uglify',
    'copy',
    'alert_size',
  ]);

  grunt.registerTask('server', ['build', 'express', 'open', 'watch']);

  grunt.registerTask('default', ['server']);

  grunt.registerTask('deploy', [
    'build',
    'compress',
    'hash',
    'aws_s3',
    'print_url',
  ]);
};

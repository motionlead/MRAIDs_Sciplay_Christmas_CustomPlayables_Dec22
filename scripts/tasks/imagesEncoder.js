var path = require('path');
var fileType = require('file-type');

module.exports = function(grunt) {
  grunt.registerMultiTask(
    'images_encoder',
    'Encode the images in a JSON in base64',
    function() {
      // Get current working directory
      var cwd = this.data.cwd || './';

      // The result image object
      var res = {};

      // Iterate over the source files
      this.filesSrc.forEach(function(file) {
        var fileObj = path.parse(cwd + file);

        // Get the content of the file
        var content = grunt.file.read(fileObj.root + fileObj.dir + '/' + fileObj.base, { encoding: null });

        // Get the type of the file (jpg, png, etc.)
        var type = fileType(content);
        if (!type) {
          grunt.log.warn('Ignoring ' + cwd + file + ', unable to read the type of the file');
          return;
        }

        // Generate the base64 string of the file
        var base64Content = 'data:' + type.mime + ';base64,' + new Buffer(content, 'binary').toString('base64');

        // Set the image in the res object
        res[fileObj.name] = base64Content;

        grunt.log.ok('Converted ' + cwd + file);
      });

      // Write the json at the destination
      grunt.file.write(this.data.dest, JSON.stringify(res));

      grunt.log.ok('Wrote file to ' + this.data.dest);
  });
};

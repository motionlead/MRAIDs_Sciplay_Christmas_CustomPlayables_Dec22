var path = require('path');

module.exports = function(grunt) {
  grunt.registerMultiTask(
    'spritesheets_encoder',
    'Encode the spritesheets in a JSON',
    function() {
      // Get current working directory
      var cwd = this.data.cwd || './';

      // The result spritesheets object
      var res = {};

      // Iterate over the source files
      this.filesSrc.forEach(function(file) {
        var fileObj = path.parse(cwd + file);

        // Get the content of the file
        var fileJSON = grunt.file.readJSON(fileObj.root + fileObj.dir + '/' + fileObj.base);

        // Delete the hash added by texturepacker
        delete fileJSON.texturepacker;

        // Delete the images array, we'll add it back at runtime once the images
        // are loaded
        delete fileJSON.images;

        // Set the spritesheet in the res object
        res[fileObj.name] = fileJSON;

        grunt.log.ok('Processed ' + cwd + file);
      });

      // Write the json at the destination
      grunt.file.write(this.data.dest, JSON.stringify(res));

      grunt.log.ok('Wrote file to ' + this.data.dest);
    }
  );
};

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-compress');

  grunt.config.set('compress', {
    transcripts: {
      options: {
        archive: 'dist/transcripts.zip'
      },
      expand: true,
      cwd: '../data/',
      src: ['**/*.txt']
    }
  });
};

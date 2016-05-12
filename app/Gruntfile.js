module.exports = function(grunt) {
  grunt.loadTasks('grunt');

  grunt.registerTask('build-env', function() {
    process.env.NODE_ENV = 'production';
  });

  grunt.registerTask('default', ['webpack-dev-server']);
  grunt.registerTask('build', ['build-env', 'webpack:build', 'compress']);
  grunt.registerTask('deploy', ['clean', 'build']);
};

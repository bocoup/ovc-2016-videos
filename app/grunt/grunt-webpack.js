module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-webpack');

  grunt.config.set('webpack', {
    build: require('../webpack.config.build')
  });

  grunt.config.set('webpack-dev-server', {
    dev: {
      host: '0.0.0.0',
      port: grunt.option('port') || 8080,
      hot: true,
      inline: true,
      keepalive: true,
      webpack: require('../webpack.config')
    }
  });
};

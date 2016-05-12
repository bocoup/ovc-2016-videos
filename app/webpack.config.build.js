var DefinePlugin = require('webpack').DefinePlugin;
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlPlugin = require('html-webpack-plugin');
var UglifyJsPlugin = require('webpack').optimize.UglifyJsPlugin;

module.exports = {
  context: __dirname,
  entry: './src',
  output: {
    path: 'dist',
    filename: 'videos-2016.js',
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.(css|scss)$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader!sass-loader'),
      },
      {
        test: /\.(svg|png)$/,
        loader: 'file-loader?name=img/video-thumbs/[name].[ext]'
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ],
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
  },
  plugins: [
    new DefinePlugin({
      'process.env.NODE_ENV': '"production"',
    }),
    new ExtractTextPlugin('videos-2016.css'),
    new HtmlPlugin({
      template: './src/index.html',
      filename: 'index.html',
    }),
    new UglifyJsPlugin(),
  ],
};

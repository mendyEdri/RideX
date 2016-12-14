var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
	entry: {
		app: "./public/app/index.js"
	},
	output: {
		filename: "public/build/bundle.js",
		sourceMapFilename: "public/build/bundle.map"
	},
	devtool: '#source-map',
	plugins: [
		new ExtractTextPlugin('styles.css')
	],
	module: {
		loaders: [
			{
				test: /\.jsx?$/,
				exclude: /(node_modules|bower_components)/,
				loader: 'babel',
				query: {
					presets: ['react', 'es2015']
				}
			},
			{
		  	test: /\.css$/,
		  	loader: 'style-loader'
			}, {
		  	test: /\.css$/,
		  	loader: 'css-loader',
		  	query: {
		    	modules: true,
		    	localIdentName: '[name]__[local]___[hash:base64:5]'
		  },
		}
		]
	}
}

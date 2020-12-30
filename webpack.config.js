const HtmlWebPackPlugin = require('html-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const path = require('path');
const APP_DIR = path.resolve(__dirname, './src');
const MONACO_DIR = path.resolve(__dirname, './node_modules/monaco-editor');

module.exports = {
	entry: {
		main: './src/app.jsx',
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
				},
			},
			{
				test: /\.html$/,
				use: [
					{
						loader: 'html-loader',
					},
				],
			},
			{
				test: /\.css$/,
				include: APP_DIR,
				use: [
					{
						loader: 'style-loader',
					},
					{
						loader: 'css-loader',
						options: {
							modules: true,
							namedExport: true,
						},
					},
				],
			},
			{
				test: /\.css$/,
				include: MONACO_DIR,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.ttf$/,
				use: ['file-loader'],
			},
		],
	},
	plugins: [
		new HtmlWebPackPlugin({
			template: './src/index.html',
			filename: './index.html',
		}),
		new MonacoWebpackPlugin({
			// available options are documented at https://github.com/Microsoft/monaco-editor-webpack-plugin#options
			languages: ['javascript', 'typescript', 'json'],
			features: ['!gotoSymbol'],
		}),
	],
};

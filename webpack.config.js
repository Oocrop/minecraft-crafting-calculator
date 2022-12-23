const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const {
	SwcWebpackMinifier: SWCMinifierPlugin,
} = require("swc-webpack-minifier");

module.exports = {
	target: ["web", "es2020"],
	mode: "production",
	entry: {
		mcCraftingCalculator: { import: "./src/index.ts" },
	},
	output: {
		filename: "[contenthash].js",
		assetModuleFilename: "assets/[contenthash][ext]",
		path: __dirname + "/dist",
		chunkLoadingGlobal: "mcCraftingCalculator",
		clean: true,
	},
	module: {
		rules: [
			{
				test: /\.s?css$/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: "css-loader",
						options: {
							esModule: true,
							modules: {
								namedExport: true,
								localIdentName: "[local]",
							},
						},
					},
					"sass-loader",
				],
			},
			{
				test: /\.[tj]sx?$/,
				// exclude: /node_modules/,
				use: {
					loader: "swc-loader",
					options: {
						jsc: {
							parser: {
								syntax: "typescript",
								decorators: true,
							},
							target: "es2022",
							externalHelpers: true,
							transform: {
								react: {
									runtime: "classic",
									pragma: "createElement",
									pragmaFrag: "Fragment",
									useBuiltins: true,
								},
							},
						},
					},
				},
			},
			{
				test: /\.(svg|png|webp)$/,
				type: "asset/resource",
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/,
				type: "asset/resource",
			},
		],
	},
	resolve: { extensions: [".tsx", ".ts", ".jsx", ".js", ".css", ".scss"] },
	plugins: [
		new MiniCssExtractPlugin({
			filename: "./css/[contenthash].css",
		}),
		new HtmlWebpackPlugin({
			template: "./src/index.html",
			filename: "index.html",
			chunks: ["mcCraftingCalculator"],
			inject: "body",
			scriptLoading: "module",
		}),
	],
	optimization: {
		concatenateModules: true,
		minimize: true,
		minimizer: [
			new SWCMinifierPlugin({
				mangle: true,
				compress: true,
				format: { comments: false },
			}),
		],
	},
};

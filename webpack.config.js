const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const MiniCSSExtractPlugin = require("mini-css-extract-plugin");
const { VueLoaderPlugin } = require("vue-loader");

/** @type {import("webpack").Configuration} */
module.exports = {
  mode: "production",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[contenthash].js",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: { appendTsSuffixTo: [/\.vue$/] },
      },
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.css$/,
        use: [
          MiniCSSExtractPlugin.loader,
          { loader: "css-loader", options: { importLoaders: 1 } },
          "postcss-loader",
        ],
      },
      {
        test: /\.png$/,
        loader: "url-loader",
      },
      {
        // wasm-bindgen 스레드 스니펫(workerHelpers.js)의 '../..' import가
        // strict ESM의 fully-specified 규칙에 걸리므로 완화
        test: /\.js$/,
        include: path.resolve(__dirname, "pkg"),
        resolve: { fullySpecified: false },
      },
    ],
  },
  resolve: { extensions: [".js", ".ts", ".vue"] },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({ patterns: [{ from: "public" }] }),
    new HTMLWebpackPlugin({ template: "index.html" }),
    new MiniCSSExtractPlugin({ filename: "[contenthash].css" }),
    new VueLoaderPlugin(),
  ],
  experiments: {
    asyncWebAssembly: true,
  },
};

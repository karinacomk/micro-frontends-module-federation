const HtmlWebpackPlugin = require("html-webpack-plugin");
const ModuleFederationPlugin = require("webpack").container
  .ModuleFederationPlugin;

const path = require("path");
const deps = require("./package.json").dependencies; // pega todas as deps
module.exports = {
  entry: "./src/index",
  mode: "development",
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    port: 3000,
    historyApiFallback: true,
    hot: false,
    hotOnly: false,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers":
        "X-Requested-With, content-type, Authorization",
    },
  },
  resolve: {
    extensions: [".js", ".mjs", ".jsx", ".css"],
    alias: {
      events: "events",
    },
  },
  output: {
    publicPath: "auto",
    chunkFilename: "[id].[contenthash].js",
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        type: "javascript/auto",
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.jsx?$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        options: {
          presets: ["@babel/preset-react"],
        },
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "shell",
      filename: "remoteEntry.js", // arquivo compartilhado entre apps
      remotes: {
        productdetails: "productdetails@http://localhost:3002/remoteEntry.js",
        productlist: "productlist@http://localhost:3001/remoteEntry.js",
        shell: "shell@http://localhost:3000/remoteEntry.js",
      },
      exposes: {
        // o que será compartilhado
        "./Shell": "./src/Shell",
        "./Service": "./src/Service",
      },
      shared: [
        // vantagem de compartilhar dependências, instância só o que precisa
        {
          ...deps,
          react: {
            singleton: true, // estratégia de compartilhamento: apenas uma instância
            requiredVersion: deps.react, // se tiver 2 microfrontens com a mesma versão, da onde vai pegar a versão
          },
          "react-dom": {
            singleton: true,
            requiredVersion: deps["react-dom"],
          },
        },
        "./src/Service",
      ],
    }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
};

// erro: Shared module is not available for eager consumption: webpack/sharing/consume/default/react/react
// erro que ocorre pq o webpack precisa saber antes da app subir como resolver essas deps,
// bidirecional: quando consume e quando exporta deps

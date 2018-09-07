const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: [path.resolve('./src/index.js')],
  output:{
    filename: 'bundle.[hash].js',
    path: path.resolve('./dist'),
    publicPath:'/',
  },
  module: {
    rules:[
      {
        test: /\.js$/,
        exclude: [path.resolve('./node_modules')],
        use: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      },
      {
        test: /\.(png|jp(e*)g|svg)$/,  
        use: [{
            loader: 'url-loader',
            options: { 
                limit: 8000, // Convert images < 8kb to base64 strings
                name: 'assets/[hash]-[name].[ext]'
            } 
        }]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve('./src/index.html'),
      filename: 'index.html'
    }),
    new webpack.DefinePlugin({
        HOST_MAIN: JSON.stringify(process.env.HOST_MAIN)
    })
  ],
  resolve:{
    modules: [
      path.resolve('./src'),
      path.resolve('./node_modules'),
    ]
  },
  devtool: 'eval-source-map',
  devServer: {
    contentBase: path.resolve('./dist'),
    watchContentBase: true,
    port: 3000,
    host: 'localhost',
    compress: true,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
}
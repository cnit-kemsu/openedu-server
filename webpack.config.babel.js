import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { DuplicatesPlugin } from 'inspectpack/plugin';

export default {
  devtool: 'inline-source-map',
  mode: 'development',
  cache: true,
  target: 'web',

  entry: './example/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: '/'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          'src',
          'node_modules/@kemsu',
          'example',
        ].map(_ => path.resolve(__dirname, _)),
        loader: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' }
        ]
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './example/index.html'
    }),
    new DuplicatesPlugin({})
  ],

  optimization: {
    namedChunks: true,
    namedModules: false,
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /node_modules/,
          name: 'vendor',
          chunks: 'all'
        }
      }
    }
  },

  resolve: {
    alias: {
      '@lib': path.resolve(__dirname, 'src/lib')
    }
  },

  devServer: {
    proxy: {
      '/api': 'http://localhost:443/graphql',
      //'/files': 'http://localhost:443/files'
    },
    historyApiFallback: true,
    watchContentBase: true,
    port: 3000
  }
};
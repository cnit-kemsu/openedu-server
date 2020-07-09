import path from 'path';
import nodeExternals from 'webpack-node-externals';

export default {
  mode: 'production',
  target: 'node',

  entry: {
    main: './src/index.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: '/'
  },

  // node: {
  //   __dirname: false,
  //   __filename: false,
  // },

  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          'src',
          'node_modules/@kemsu',
        ].map(_ => path.resolve(__dirname, _)),
        loader: 'babel-loader'
      }
    ]
  },

  // optimization: {
  //   namedChunks: true,
  //   namedModules: false,
  //   splitChunks: {
  //     cacheGroups: {
  //       vendor: {
  //         test: /node_modules/,
  //         name: 'vendor',
  //         chunks: 'all'
  //       }
  //     }
  //   }
  // },

  externals: [
    function(context, request, callback) {
      if (request === './config') callback(null, `require('./config')`);
      else if (request === '../config') callback(null, `require('./config')`);
      else if (request === '../../config') callback(null, `require('./config')`);
      else if (request === '../../../config') callback(null, `require('./config')`);
      else if (request === '../../../../config') callback(null, `require('./config')`);
      else if (request === '../../../../../config') callback(null, `require('./config')`);
      else callback();
    },
    nodeExternals({
      whitelist: ['@kemsu/graphql-server']
    })
  ]

};
'use strict';

const path = require('path'),
      utils = require('./config/utils'),
      webpack = require('webpack');

var config = require('./config/config'),
    nodeModulesPath = path.join(__dirname, 'node_modules'),
    parentNodeModulePath = path.join(path.dirname(__dirname), 'node_modules');

var HtmlResWebpackPlugin = require('html-res-webpack-plugin');
var Clean = require('clean-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var CopyWebpackPlugin = require("copy-webpack-plugin");
var WebpackMd5Hash = require('webpack-md5-hash');
var BannerWebpackPlugin = require('banner-webpack-plugin');

/**
 * [prodConfig config for production mode]
 * @type {Object}
 */
var prodConfig = {
    entry: {
        "js/index": [path.join(config.path.src, "/page/index/main.js")],
        "js/spa": [path.join(config.path.src, "/page/spa/main.js")],
        "libs/react": [path.join(config.path.src, "/libs/react.js")],
        "libs/react-dom": [path.join(config.path.src, "/libs/react-dom.js")],
    },
    output: {
        publicPath: config.cdn,
        path: path.join(config.path.pub),
        filename: "[name]" + config.chunkhash + ".js",
        chunkFilename: "chunk/[name]" + config.chunkhash + ".js",
    },
    module: {
        loaders: [
            { 
                test: /\.js?$/,
                loader: 'babel',
                query: {
                    cacheDirectory: '/webpack_cache/',
                    plugins: ['transform-decorators-legacy'],
                    presets: [
                        'es2015-loose', 
                        'react',
                    ]
                },
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                // extract style and make it stand-alone css file
                // for dev environment, inline style can be hot reload
                loader: ExtractTextPlugin.extract("style-loader", "css-loader"),
                include: path.resolve(config.path.src)
            },
            {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract("style-loader", "css-loader!less-loader"),
                include: [parentNodeModulePath, nodeModulesPath, path.resolve(config.path.src)]
            },
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract("style-loader", "css-loader!sass-loader"),
                include: [parentNodeModulePath, nodeModulesPath, path.resolve(config.path.src)]
            },
            {
                test: /\.html$/,
                loader: 'html-loader'
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                loaders: [
                    "url-loader?limit=1000&name=img/[name]" + config.hash + ".[ext]",
                    // 压缩png图片
                    'image-webpack?{progressive:true, optimizationLevel: 7, interlaced: false, pngquant:{quality: "65-90", speed: 4}}'
                ],
                include: path.resolve(config.path.src)
            },
            {
                test: /\.ico$/,
                loader: "url-loader?name=[name].[ext]",
                include: path.resolve(config.path.src)
            },
            { 
                test: /\.(woff|woff2|eot|ttf|svg)(\?.*$|$)/,  
                loader: 'url-loader?importLoaders=1&limit=10000&name=fonts/[name]' + config.hash + '.[ext]' 
            },
        ],
        noParse: [
            './libs/react',
            './libs/react-dom',
            path.join(config.path.src, "/libs/react.js"),
            path.join(config.path.src, "/libs/react-dom.js")
            // path.join(config.path.src, "/libs/react.js")
        ]
    },
    resolve: {
        moduledirectories:['node_modules', config.path.src],
        extensions: ["", ".js", ".jsx", ".es6", "css", "scss", "png", "jpg", "jpeg", "ico"],
        alias: {
            // use production version of redux
            // 'react': path.join(config.path.src, "/libs/react.js"),
            'redux': 'redux/dist/redux.min',
            'react-redux': 'react-redux/dist/react-redux',
            'classnames': 'classnames',
            'utils': path.join(config.path.src, '/js/common/utils'),
            'spin': path.join(config.path.src, '/js/common/spin'),
            'spinner': path.join(config.path.src, '/page/common/components/spinner/'),
            'report': path.join(config.path.src, '/js/common/report'),
            'touch': path.join(config.path.src, '/page/common/components/touch/'),
            'scroll':path.join(config.path.src, '/page/common/components/scroll/'),
            'immutable-pure-render-decorator': path.join(config.path.src, '/js/common/immutable-pure-render-decorator'),
            'pure-render-decorator': path.join(config.path.src, '/js/common/pure-render-decorator'),
        }
    },
    plugins: [
        new WebpackMd5Hash(),
  //       new CopyWebpackPlugin([
        //     {
        //         from: 'src/libs/',
        //         to: 'libs/'
        //     }
        // ]),
        new webpack.optimize.OccurrenceOrderPlugin(),
        // make css file standalone
        new ExtractTextPlugin("./css/[name]-[contenthash:6].css", {filenamefilter: function(filename) {
            // console.log(filename);
            return filename.replace('./js', '');
        }}),
        new webpack.NoErrorsPlugin(),
        new BannerWebpackPlugin({
            chunks: {
                'libs/react': {
                    beforeContent: 'var React = ',
                },
                'libs/react-dom': {
                    beforeContent: 'var ReactDOM = ',
                }
            }
        })
    ],
    // use external react library
    externals: {
        'react': "React",
        'react-dom': "ReactDOM",
    },
    // disable watch mode
    watch: false, //  watch mode
};

prodConfig.addPlugins = function(plugin, opt) {
    prodConfig.plugins.push(new plugin(opt));
};

config.html.forEach(function(page) {
    prodConfig.addPlugins(HtmlResWebpackPlugin, {
        filename: page + ".html",
        template: "src/" + page + ".html",
        // favicon: "src/favicon.ico",
        jsHash: "[name]" + config.chunkhash + ".js",
        cssHash:  "[name]" + config.chunkhash + ".css",
        isHotReload: false,
        templateContent: function(tpl) {
            return tpl;
        }, 
        htmlMinify: {
            removeComments: true,
            collapseWhitespace: true,
        }
    });
}); 

let pageMapping = {
    'spa': {
        'libs/react': {},
        'libs/react-dom': {},
        'js/spa': {
            attr:{
                js: "",
                css: "",
            }
        },
    },
    'index': {
        'libs/react': {},
        'libs/react-dom': {},
        'js/index': {
            attr:{
                js: "",
                css: "",
            }
        },
    }
};

config.html.forEach(function(page) {
    prodConfig.addPlugins(HtmlResWebpackPlugin, {
        filename: page + ".html",
        template: "src/" + page + ".html",
        favicon: "src/favicon.ico",
        chunks: pageMapping[page],
        templateContent: function(tpl) {
            return tpl;
        }, 
        htmlMinify: null
    });
}); 

// remove old pub folder
prodConfig.addPlugins(Clean, ['pub']); 

// file compression
// prodConfig.addPlugins(webpack.optimize.UglifyJsPlugin, {
//     compress: {
//         warnings: false
//     }
// });

// inject process.env.NODE_ENV so that it will recognize if (process.env.NODE_ENV === "production")
prodConfig.addPlugins(webpack.DefinePlugin, {
    "process.env": {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV)
    },
    "isNode": false,
    "console.dev": function(msg) {}
});

prodConfig.addPlugins(webpack.optimize.DedupePlugin);

prodConfig.addPlugins(webpack.optimize.OccurrenceOrderPlugin, true);


module.exports = prodConfig;
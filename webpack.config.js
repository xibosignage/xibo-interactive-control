const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

var config = {
    entry: './src/xibo-interactive-control.js',
    output: {
        filename: 'xibo-interactive-control.min.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    plugins: [
        new UglifyJSPlugin({
            sourceMap: true
        }),
        new CleanWebpackPlugin()
    ]
};

module.exports = (env, argv) => {

    if(argv.mode === 'development') {
        config.devtool = 'source-map';
    }

    return config;
};

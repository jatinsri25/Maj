module.exports = {
    resolve: {
        fallback: {
            "fs": false,
            "path": false,
            "crypto": false
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: 'pre',
                use: ['source-map-loader'],
                exclude: [/node_modules\/face-api\.js/]
            }
        ]
    }
};
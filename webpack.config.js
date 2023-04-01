const path = require("path");
module.exports = {
    entry: {
        gamePage: "./build/gamePage.js",
        resultPage: "./build/resultPage.js",
    },
    output: {
        path: path.resolve(__dirname, "./static"),
        filename: "[name].bundle.js",
    },
    cache: true,
};

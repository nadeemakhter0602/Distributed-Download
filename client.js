const util = require("node:util");
const http = require("http");
const args = process.argv.slice(2);
const options = {
    interface: {
        type: "string",
            short: "i",
    },
    server: {
        type: "string",
        short: "s",
    },
    url: {
        type: "string",
        short: "u",
    },
};
let localAddress;
let serverAddress;
let downloadURL;
try {
    const {
        values,
        positional
    } = util.parseArgs({
        args,
        options,
    });
    localAddress = options.interface;
    serverAddress = options.server;
    downloadURL = options.url;
} catch (error) {
    console.log(error.message);
}
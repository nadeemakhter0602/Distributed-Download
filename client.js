const util = require("node:util");
const https = require("https");
const args = process.argv.slice(2);
const options = {
    interface: {
        type: "string",
            short: "i",
            required: true,
    },
    server: {
        type: "string",
        short: "s",
        required: true,
    },
    url: {
        type: "string",
        short: "u",
        required: true,
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
    // check if all required arguments are present
    for (let [name, {
            required
        }] of Object.entries(options)) {
        if (required && !(name in values)) {
            throw new Error(`--${name} must be provided`);
        }
    }
    localAddress = options.interface;
    serverAddress = options.server;
    downloadURL = options.url;
} catch (error) {
    console.log(error.message);
}
let httpsOptions = {
    localAddress: localAddress
};
const registerURL = serverAddress + '/register';
const setFileInfoURL = serverAddress + '/setfileinfo';
const getRangeURL = serverAddress + '/getrange';
const mergeURL = serverAddress + '/merge';
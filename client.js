const util = require("node:util");
const http = require("http");
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
            console.log(`--${name} must be provided`);
            process.exit();
        }
    }
    localAddress = values.interface;
    serverAddress = values.server;
    downloadURL = values.url;
} catch (error) {
    console.log(error.message);
}
let httpOptions = {
    localAddress: localAddress,
};
const registerURL = serverAddress + "/register";
const setFileInfoURL = serverAddress + "/setfileinfo";
const getRangeURL = serverAddress + "/getrange";
const mergeURL = serverAddress + "/merge";
const request = (url, options, payload = {}) => {
    let httpModule = http;
    if (url.startsWith("https://")) {
        httpModule = https;
    }
    return new Promise((resolve, reject, httpModule) => {
        const req = httpModule.request(url, options, (res) => {
            const responseArray = [];
            res.on("data", (chunk) => {
                responseArray.push(chunk);
            });
            res.on("error", (err) => {
                reject(err.message);
            });
            res.on("end", () => {
                const response = JSON.parse(responseArray.join(""));
                resolve(response, res.headers);
            });
        });
        if (Object.keys(payload).length > 0) {
            req.end(payload);
        } else {
            req.end();
        }
    });
};
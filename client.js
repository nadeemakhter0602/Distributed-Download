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
const responseCallback = (res, resolve, reject) => {
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
};
const registerRequest = () => {
    return new Promise((resolve, reject) => {
        const req = http.get(registerURL, responseCallback(res, resolve, reject));
        req.end();
    });
};
const setFileInfoRequest = (fname, size) => {
    return new Promise((resolve, reject) => {
        const payload = {
            fname: fname,
            size: size,
        };
        const req = http.request(
            setFileInfoURL,
            responseCallback(res, resolve, reject)
        );
        req.end(JSON.stringify(payload));
    });
};
const getRangeRequest = () => {
    return new Promise((resolve, reject) => {
        const req = http.get(getRangeURL, responseCallback(res, resolve, reject));
        req.end();
    });
};
const mergeRequest = (index, data) => {
    return new Promise((resolve, reject) => {
        const payload = {
            index: index,
            data: data,
        };
        const req = http.request(mergeURL, responseCallback(res, resolve, reject));
        req.end(JSON.stringify(payload));
    });
};
const checkPartialRequest = () => {
    return new Promise((resolve, reject) => {
        const req = http.request(
            downloadURL, {
                method: "HEAD",
            },
            responseCallback(res, resolve, reject)
        );
        req.end();
    });
};
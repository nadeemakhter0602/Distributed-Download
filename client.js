const util = require("node:util");
const http = require("http");
const https = require("https");
const fs = require("fs");
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
    process.exit();
}
const registerURL = serverAddress + "/register";
const setFileInfoURL = serverAddress + "/setfileinfo";
const getRangeURL = serverAddress + "/getrange";
const mergeURL = serverAddress + "/merge";
const pieceSize = 2 ** 14;
const request = (
    url,
    options,
    payload = {},
    writeStream = null,
    promise = true
) => {
    let httpModule = http;
    if (url.startsWith("https://")) {
        httpModule = https;
    }
    if (writeStream) {
        return new Promise((resolve) => {
            req = httpModule.request(url, options, (res) => {
                if (res.statusCode === 416) {
                    resolve("Received 416 Requested Range Not Satisfiable");
                } else if (res.statusCode !== 206) {
                    resolve("Received HTTP Status", res.statusCode);
                }
                res.pipe(writeStream);
                writeStream.on("finish", () => {
                    writeStream.close();
                    resolve("File download completed");
                });
                writeStream.on("error", (err) => {
                    fs.unlink(writeStream.path);
                    resolve(err.message);
                });
            });
            req.end();
        });
    }
    if (!promise) {
        return httpModule.request(url, options, (res) => {
            const responseArray = [];
            res.on("data", (chunk) => {
                responseArray.push(chunk);
            });
            res.on("error", (err) => {
                console.log(err.message);
            });
            res.on("end", () => {
                const response = {};
                const responseData = responseArray.join("");
                const responseHeaders = res.headers;
                response["data"] = responseData;
                response["headers"] = responseHeaders;
                console.log(response);
            });
        });
    }
    return new Promise((resolve) => {
        const req = httpModule.request(url, options, (res) => {
            const responseArray = [];
            res.on("data", (chunk) => {
                responseArray.push(chunk);
            });
            res.on("error", (err) => {
                resolve(err.message);
            });
            res.on("end", () => {
                const response = {};
                const responseData = responseArray.join("");
                const responseHeaders = res.headers;
                response["data"] = responseData;
                response["headers"] = responseHeaders;
                resolve(response);
            });
        });
        if (Object.keys(payload).length > 0) {
            req.end(payload);
        } else {
            req.end();
        }
    });
};
const start = async () => {
    const registerResponse = await request(registerURL, {
        method: "GET",
    });
    const registerData = JSON.parse(registerResponse["data"]);
    if (!("token" in registerData)) {
        console.log(registerData);
        process.exit();
    }
    const token = registerData["token"];
    console.log("Client successfully registered with token:", token);
    const checkRangeSupport = await request(downloadURL, {
        method: "HEAD",
        localAddress: localAddress,
    });
    const checkHeaders = checkRangeSupport["headers"];
    if (
        !("accept-ranges" in checkHeaders) ||
        checkHeaders["Accept-Ranges"] == "none"
    ) {
        console.log("Server does not support range requests");
        process.exit();
    } else {
        console.log("Server supports range requests");
    }
    if (!("content-length" in checkHeaders)) {
        console.log("Cannot find file size");
        process.exit();
    }
    // get file size from headers
    const fSize = checkHeaders["content-length"];
    // get file name from url
    const fName = downloadURL.split("/").slice(-1)[0].split("?")[0];
    console.log("Size of file in bytes:", Number(fSize));
    console.log("Name of file:", fName);
    const fileInfoPayload = JSON.stringify({
        fSize: fSize,
        fName: fName,
    });
    const setFileInfo = await request(
        setFileInfoURL, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
        },
        fileInfoPayload
    );
    const fileInfoData = JSON.parse(setFileInfo["data"]);
    if (!("success" in fileInfoData)) {
        console.log(fileInfoData);
    }
    const getRangePayload = JSON.stringify({
        token: token,
    });
    const getRange = await request(
        getRangeURL, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
        },
        getRangePayload
    );
    const rangeData = JSON.parse(getRange["data"]);
    if ("error" in rangeData) {
        console.log(rangeData);
        process.exit();
    }
    const pieceStart = rangeData["start"];
    const pieceEnd = rangeData["end"];
    console.log("Starting piece", pieceStart);
    console.log("Ending piece", pieceEnd);
    let piecesNum = Math.floor(fSize / pieceSize);
    if (fSize % pieceSize !== 0) {
        piecesNum += 1;
    }
    const startBytes = pieceStart * pieceSize;
    const endBytes = Math.min(pieceEnd * pieceSize, fSize);
    const file = fs.createWriteStream(fName + "." + token);
    console.log("Attempting to download file from", startBytes, "to", endBytes);
    const downloadFile = await request(
        downloadURL, {
            method: "GET",
            localAddress: localAddress,
            headers: {
                range: "bytes=" + `${startBytes}-${endBytes}`,
            },
        }, {},
        (writeStream = file)
    );
    console.log(downloadFile);
    if (downloadFile !== "File download completed") {
        process.exit();
    }
    let fd = fs.openSync(fName + "." + token);
    for (let idx = pieceStart; idx <= pieceEnd; idx++) {
        const pieceBytes = Buffer.alloc(pieceSize);
        const bytesRead = fs.readSync(
            fd,
            pieceBytes,
            0,
            (length = pieceSize),
            (position = pieceSize * idx)
        );
        const fileData = pieceBytes.subarray(0, bytesRead).toString("base64");
        const jsonPayload = JSON.stringify({
            index: idx,
            data: fileData,
        });
        const fileUpload = await request(
            mergeURL, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
            },
            jsonPayload
        );
        const fileUploadData = JSON.parse(fileUpload["data"]);
        if ("success" in fileUploadData) {
            console.log("Piece", idx, "uploaded successfully");
        } else {
            console.log("Piece", idx, "upload failed");
            console.log(fileUploadData);
        }
    }
};
start();
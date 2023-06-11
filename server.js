const express = require("express");
const crypto = require("node:crypto");
const fs = require("fs");
const app = express();
// read config file
const configBuffer = fs.readFileSync("config.json");
// parse json in config file
const config = JSON.parse(configBuffer.toString());
// get user and pass and convert each to base64
const httpAuthUser = config["user"];
const httpAuthPass = config["pass"];
// get number of clients
const numOfClients = config["clients"];
// set client index to numOfClients
let clientIndex = numOfClients;
// clients object to store client data
const clients = {};
// check if user and pass exist
if (!httpAuthPass && !httpAuthUser) {
    console.log("No config file with user and pass in json format.");
    process.exit();
}
// format user and pass and convert to base64 buffer
const httpAuthPlain = httpAuthUser + ":" + httpAuthPass;
const httpAuthBase64 = "Basic " + btoa(httpAuthPlain);
const httpAuthBase64Buffer = Buffer.from(httpAuthBase64);
// create random HMAC secret
const HMACSecret = crypto.randomBytes(64).toString("hex");
// generate signature of http auth token
const httpAuthSignature = crypto
    .createHmac("sha256", HMACSecret)
    .update(httpAuthBase64Buffer)
    .digest();
// set port of app
const port = 3000;
// Express Middleware for HTTP Basic Authentication
app.use((req, res, next) => {
    // HTTP Basic Authentication
    if (!req.headers.authorization) {
        res.set("WWW-Authenticate", 'Basic realm="401"');
        return res.status(401).send(
            JSON.stringify({
                error: "authentication required",
            })
        );
    }
    // generate signature of http auth token from headers
    const reqHeaderAuthBuffer = Buffer.from(req.headers.authorization);
    const reqHeaderAuthSignature = crypto
        .createHmac("sha256", HMACSecret)
        .update(reqHeaderAuthBuffer)
        .digest();
    // use crypto.timingSafeEqual function to check equality
    if (!crypto.timingSafeEqual(httpAuthSignature, reqHeaderAuthSignature)) {
        return res.status(401).send(
            JSON.stringify({
                error: "authentication required",
            })
        );
    }
    next();
});
// Express Middleware for parsing application/json
app.use(express.json());
// Express Middleware for parsing application/x-www-form-urlencoded
app.use(
    express.urlencoded({
        extended: true,
    })
);
// set /register endpoint to register client
app.get("/register", (req, res) => {
    // generate cryptographically secure token
    let token = crypto.randomBytes(64).toString("hex");
    if (clientIndex === 0) {
        return res.send(
            JSON.stringify({
                error: "all clients already registered",
            })
        );
    }
    clients[token] = {
        index: clientIndex--,
    };
    res.setHeader("Content-Type", "application/json");
    res.end(
        JSON.stringify({
            token: token,
        })
    );
});
// set /setfileinfo endpoint to set size and name of file
app.post("/setfileinfo", (req, res) => {
    if ("size" in clients && "fname" in clients) {
        return res.send(
            JSON.stringify({
                error: "file size already set",
            })
        );
    } else if (!("size" in req.body) || !("fname" in req.body)) {
        return res.send(
            JSON.stringify({
                error: "no size or fname key found",
            })
        );
    }
    clients["size"] = Number(req.body["size"]);
    clients["fname"] = req.body["fname"];
    const interval = Math.ceil(clients["size"] / numOfClients);
    let offset = 0;
    for (const token in clients) {
        clients[token]["start"] = offset;
        offset += interval;
        clients[token]["end"] = Math.max(offset, clients["size"]);
    }
    res.end(
        JSON.stringify({
            success: "file size and name set successfully",
        })
    );
});
// start app listener
app.listen(port, () => {
    console.log("Merge server listening on port", port);
    console.log("HTTP auth username :", httpAuthUser);
    console.log("HTTP auth password :", httpAuthPass);
});
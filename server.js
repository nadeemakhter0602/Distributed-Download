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
let numOfClients = config["clients"];
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
    /**
      Use crypto.timingSafeEqual function to check equality
      to prevent Timing attack
      */
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
    if (numOfClients === 0) {
        return res.send(
            JSON.stringify({
                error: "all clients already registered",
            })
        );
    }
    clients[token] = {
        'index': numOfClients--
    };
    res.setHeader("Content-Type", "application/json");
    res.end(
        JSON.stringify({
            token: token,
        })
    );
});
// set /setfilesize endpoint to set size of file
app.post("/setfilesize", (req, res) => {
    if ("size" in clients) {
        return res.send(
            JSON.stringify({
                error: "file size already set",
            })
        );
    } else if (!("size" in req.body)) {
        return res.send(
            JSON.stringify({
                error: "no size key found",
            })
        );
    }
    clients["size"] = req.body["size"];
    res.end(
        JSON.stringify({
            success: "file size set successfully",
        })
    );
});
// start app listener
app.listen(port, () => {
    console.log("Merge server listening on port", port);
    console.log("HTTP auth username :", httpAuthUser);
    console.log("HTTP auth password :", httpAuthPass);
});
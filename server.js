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
// set /register endpoint to register client
app.get("/register", (req, res) => {
    // HTTP Basic Authentication
    if (!req.headers.authorization) {
        res.set("WWW-Authenticate", 'Basic realm="401"');
        return res.status(401).send("Authentication required.");
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
        return res.status(401).send("Authentication required.");
    }
    // generate cryptographically secure token
    let token = crypto.randomBytes(64).toString("hex");
    res.setHeader("Content-Type", "application/json");
    res.end(
        JSON.stringify({
            token: token,
        })
    );
});
// start app listener
app.listen(port, () => {
    console.log(`Merge server listening on port 3000`);
    console.log(`HTTP Auth User :`, httpAuthUser);
    console.log(`HTTP Auth Pass :`, httpAuthPass);
});
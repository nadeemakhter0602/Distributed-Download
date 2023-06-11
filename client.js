const util = require("node:util");
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
};
let localAddress;
let serverAddress;
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
} catch (error) {
    console.log(error.message);
}
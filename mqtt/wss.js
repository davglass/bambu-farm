
const { WebSocket, WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: 9999 });

let CONFIG; //Holder for machine info

const CACHE = {};

// If there is no cached response, log it
// If there is a cached response and it's different, log it
// If the cache response is the same, skip it

const log = (payload) => {
    const type = payload.type;
    const str = JSON.stringify(payload.payload);
    const event = JSON.stringify(payload);
    if (!CACHE[type] || (CACHE[type] !== str)) {
        console.log('send:', event);
        CACHE[type] = str;
    }
    if ('DEBUG' in process.env) {
        console.log('real send: ', event);
    }
};

const send = (payload) => {
    // Only log a change, but always send it to the client
    log(payload);
    wss.clients.forEach(function each(client) {
        //istanbul ignore else
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
        }
    });
};
module.exports.send = send;

const init = (config) => {
    CONFIG = config;
};
module.exports.init = init;

const CALLBACKS = [];

const connection = (cb) => {
    CALLBACKS.push(cb);
};
module.exports.connection = connection;

wss.on('connection', () => {
    send({ machines: CONFIG });
    CALLBACKS.forEach(cb => {
        cb();
    });
});

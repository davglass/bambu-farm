#!/usr/bin/env node

const { WebSocket } = require('ws');

const ws = new WebSocket('ws://127.0.0.1:9999/');

ws.on('error', console.error);

ws.on('open', () => {
    ws.send('something');
});

ws.on('message', (data) => {
    console.log('received: %s', data);
});

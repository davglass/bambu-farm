#!/usr/bin/env node

let conf = require('/app/config/config.json');

if (Array.isArray(conf)) {
    conf = { machines: conf };
}

const COUNTER = {};

const RESTART = 1000;
const STARTUP_CHECK = (1 * 15) * 1000;

if (conf.machines.length === 0) {
    console.error(`Failed to find array of machines..`);
    process.exit(1);
}

console.log(`Starting ${conf.machines.length} streaming camera services..`)

const { spawn } = require('child_process');

const handler = (machine) => {
    COUNTER[machine.id] = COUNTER[machine.id] || 0;
    COUNTER[machine.id]++;

    const log = (str) => {
        console.log(`[${COUNTER[machine.id]}][log][${machine.name}][${(new Date()).toJSON()}] ${str}`);
    };
    const error = (str) => {
        console.error(`[${COUNTER[machine.id]}][err][${machine.name}][${(new Date()).toJSON()}] ${str}`);
    };
    const url = `rtsps://bblp:${machine.token}@${machine.ip}/streaming/live/1`;
    const published = `rtsp://rtsp-server:8554/${machine.id}`;
    log(`Launching stream`);
    log(url);
    let STARTED = null;
    let KILLED = false;
    const cmd = `ffmpeg`;
    //RTSP to RTSP
    //const args = [`-hide_banner`, `-rtsp_transport`, `tcp`, `-i`, `${url}`, `-c:v`, `copy`, `-f`, `rtsp`, `${published}`];
    //RTSP to WEBRTC
    //const args = [`-hide_banner`, `-rtsp_transport`, `tcp`, `-i`, `${url}`, `-pix_fmt`, `yuv420p`, `-c:v`, `libx264`, `-preset`, `ultrafast`, `-b:v`, `600k`, `-f`, `rtsp`, `${published}` ];
    const args = [`-hide_banner`, `-fflags`, `nobuffer`, `-flags`, `low_delay`, `-analyzeduration`, `10`, `-probesize`, `3200`, `-rtsp_transport`, `tcp`, `-i`, `${url}`, `-pix_fmt`, `yuv420p`, `-c:v`, `libx264`, `-preset`, `ultrafast`, `-b:v`, `600k`, `-f`, `rtsp`, `${published}` ];
    
    log(`${cmd} ${args.join(' ')}`);
    
    const result = spawn(cmd, args);
    result.stdout.on('data', (data) => {
        data = data.toString().trim()
        log(`stdout: ${data}`);
    });

    result.stderr.on('data', (data) => {
        data = data.toString().trim()
        error(`stderr: ${data}`);
        if (data.indexOf('rtsp stream server') > -1) {
            STARTED = true;
        }
    });

    result.on('close', (code) => {
        log(`child process exited with code ${code}`);
        if (!KILLED) {
            setTimeout(() => {
                log(`Restarting stream..`);
                handler(machine);
            }, RESTART);
        }
    }); 

    setTimeout(() => {
        if (!STARTED) {
            error('------------------------------------------------');
            error(`FAILED TO FIND STREAM STARTUP!`);
            error('------------------------------------------------');
            KILLED = true;
            result.kill();
            setTimeout(() => {
                error(`Attempting to launch stream service again.`);
                handler(machine);
            }, 1000);
        }
    }, STARTUP_CHECK);
};

// Start the streams..
conf.machines.forEach(handler);

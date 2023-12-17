#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt');
const tt = require('timethat');

let CONFIG = path.join(__dirname, './config.json');

if (!fs.existsSync(CONFIG)) { //Outside docker container
    CONFIG = `../config.json`;
}

let MACHINES = require(CONFIG);

if (!Array.isArray(MACHINES)) {
    MACHINES = MACHINES.machines;
}


const wss = require('./wss.js');
wss.init(MACHINES);

const INIT = [
    {"info": {"sequence_id": "0", "command": "get_version"}},
    {"pushing": {"sequence_id": "0", "command": "pushall"}}
];

const handler = (machine) => {
    
    const BASE = `mqtts://${machine.ip}:8883`;

    const client = mqtt.connect(BASE, {
        username: 'bblp',
        password: machine.token,
        rejectUnauthorized: false
    });
    
    wss.connection(() => {
        console.log(`A new WS connection happened, send default data..`);
        //Get all the default info up front
        INIT.forEach(i => {
            client.publish(`device/${machine.id}/request`, JSON.stringify(i));
        });
    });

    client.on('error', (e) => {
        console.error(`[${machine.id}] ERROR:`, e);
    });

    client.on('reconnect', () => {
        console.log(`[${machine.id}] reconnecting to local MQTT service.`);
    });

    client.on("connect", (e) => {
        console.log(`[${machine.id}] connected to local MQTT service.`);
        client.subscribe(`device/${machine.id}/report`, (err) => {
            if (err) {
                console.error(machine.id, err);
            }
        });
    });

    client.on("message", (topic, message) => {
        const json = JSON.parse(message.toString());
        if (Object.keys(json).length === 1) {
            if ('t_utc' in json) {
                return; //Don't log this empty message
            }
        }
        if (json.print) {
            json.data = parse(json.print);
            delete json.print
        }
        json.camera = `http://127.0.0.1:8888/${machine.id}`;
        json.printer = machine;
        json.topic = topic;
        wss.send(json);
        console.log(JSON.stringify(json, null, 4));
    });
};

const parse = (json) => {
    if (json.mc_remaining_time) {
        json.mc_remaining_time = timed(json.mc_remaining_time);
    }
    Object.keys(json).forEach(key => {
        if (key.indexOf('_speed') > -1) {
            json[key] = fixFan(json[key]);
        }
        if (key.indexOf('_temper') > -1) {
            json[key] = fixTemp(json[key]);
        }
    });

    if (json.ams && json.ams.ams) {
        json.ams.ams = parseAMS(json.ams.ams);
    }

    if (json.t_utc) {
        json.t_utc = fixDate(json.t_utc);
    }

    return json;
};

const parseAMS = (ams) => {
    ams.forEach((a) => {
        Object.keys(a).forEach(b => {
            if (b.indexOf('temp') > -1) {
                a[b] = fixTemp(a[b]);
            }
            if (b === 'tray') {
                a[b].forEach((v, _id) => {
                    a[b][_id].name = FILAMENT_NAMES[a[b][_id].tray_info_idx];
                    Object.keys(a[b][_id]).forEach(k => {
                        if (k.indexOf('temp') > -1 && k !== 'bed_temp_type') {
                            a[b][_id][k] = fixTemp(a[b][_id][k]);
                        }
                        if (k === 'tray_color') {
                            a[b][_id][k] = a[b][_id][k].substr(0, 6);
                        }
                        if (k === 'cols') {
                            a[b][_id][k].forEach((c, _idx) => {
                                a[b][_id][k][_idx] = c.substr(0, 6);
                            });
                        }
                    });
                });
            }
        });
    });
    return ams;
};

const fixTemp = (t) => {
    return `${t}° C`;
};

const fixDate = (d) => {
    return (new Date(d)).toLocaleString();
};

const fixFan = (speed) => {
    speed = Number(speed);
    let percentage = (speed / 15) * 100;
    return `${Math.ceil(percentage / 10) * 10}%`;
};

const timed = (t) => {
    let stamp = (Date.now() + (t * 60) * 1000);
    return tt.calc(new Date(), stamp).replace(', 0 seconds', '');
};

const FILAMENT_NAMES = {
    "default": "Unknown",
    "GFB00": "Bambu ABS",
    "GFB01": "Bambu ASA",
    "GFN03": "Bambu PA-CF",
    "GFN05": "Bambu PA6-CF",
    "GFN04": "Bambu PAHT-CF",
    "GFC00": "Bambu PC",
    "GFT01": "Bambu PET-CF",
    "GFG00": "Bambu PETG Basic",
    "GFG50": "Bambu PETG-CF",
    "GFA11": "Bambu PLA Aero",
    "GFA00": "Bambu PLA Basic",
    "GFA03": "Bambu PLA Impact",
    "GFA07": "Bambu PLA Marble",
    "GFA01": "Bambu PLA Matte",
    "GFA02": "Bambu PLA Metal",
    "GFA05": "Bambu PLA Silk",
    "GFA08": "Bambu PLA Sparkle",
    "GFA09": "Bambu PLA Tough",
    "GFA50": "Bambu PLA-CF",
    "GFS03": "Bambu Support For PA/PET",
    "GFS02": "Bambu Support For PLA",
    "GFS01": "Bambu Support G",
    "GFS00": "Bambu Support W",
    "GFU01": "Bambu TPU 95A",
    "GFB99": "Generic ABS",
    "GFB98": "Generic ASA",
    "GFS98": "Generic HIPS",
    "GFN98": "Generic PA-CF",
    "GFN99": "Generic PA",
    "GFC99": "Generic PC",
    "GFG99": "Generic PETG",
    "GFG98": "Generic PETG-CF",
    "GFL99": "Generic PLA",
    "GFL95": "Generic PLA-High Speed",
    "GFL96": "Generic PLA Silk",
    "GFL98": "Generic PLA-CF",
    "GFS99": "Generic PVA",
    "GFU99": "Generic TPU",
    "GFL05": "Overture Matte PLA",
    "GFL04": "Overture PLA",
    "GFB60": "PolyLite ABS",
    "GFB61": "PolyLite ASA",
    "GFG60": "PolyLite PETG",
    "GFL00": "PolyLite PLA",
    "GFL01": "PolyTerra PLA",
    "GFL03": "eSUN PLA+",
    "GFSL99_01": "Generic PLA Silk",
    "GFSL99_12": "Generic PLA Silk",
};

MACHINES.forEach((machine) => {
    handler(machine);
});


const ftp = require('basic-ftp'); 
const fs = require('fs');
const path = require('path');
const config = require('./config.js');
const pretty = require('prettysize');

const REFRESH = (5 * 60 * 1000); //Refresh disk with thumbs every 5 minutes..

const MACHINES = config.machines;
const DL = config.downloads;

MACHINES.forEach(machine => {
    const thumbs = path.join(DL, machine.id);
    if (!fs.existsSync(thumbs)) {
        fs.mkdirSync(thumbs);
    }
    console.log(thumbs);
});

const connect = async (machine) => {
    const client = new ftp.Client()
    //client.ftp.verbose = true
    const secureOptions = {
        checkServerIdentity: () => { return null; },
        rejectUnauthorized: false //Needed for the Self Signed Cert
    };
    await client.access({
        host: machine.ip,
        user: 'bblp',
        password: machine.token,
        port: 990,
        secure: 'implicit',
        secureOptions: secureOptions
    });
    return client;
};

const getAllGCode = async (machine, cb) => {
    console.log(`[${machine.id}] Fetching gcode for: ${machine.name}`);
    const client = await connect(machine);
    await client.cd('/');
    const gcode = [];
    const list = await client.list();
    await client.close();
    list.forEach((f) => {
        if (f.name.startsWith('.')) {
            return; //Not sure what these are??
        }
        if (f.name.toLowerCase().indexOf('.gcode') > -1) {
            gcode.push({
                name: f.name.replace('.3mf', '').replace('.gcode', ''),
                rawName: f.name,
                size: pretty(f.size),
                stamp: f.rawModifiedAt
            });
        }
    });
    gcode.sort((a, b) => {
        const n1 = a.name.toLowerCase();
        const n2 = b.name.toLowerCase();
        if (n1 > n2) {
            return 1;
        }
        return -1;
    });
    cb(gcode);
};
module.exports.getAllGCode = getAllGCode;

const fetchThumbs = async (id) => {
    const machine = config.getMachine(id);
    console.log(`[${machine.id}] Fetching thumbnails for: ${machine.name}`);
    const dir = path.join(DL, machine.id);
    const client = await connect(machine);
    await client.cd('/timelapse/thumbnail');
    const list = await client.list();
    //console.log(list);
    const get = async () => {
        const file = list.pop();
        if (file.name.endsWith('.jpg')) {
            //Image file, download it
            const remote = `/timelapse/thumbnail/${file.name}`;
            const local = path.join(dir, file.name);
            if (!fs.existsSync(local)) {
                console.log(`[${machine.id}] Downloading ${remote} to ${local}`);
                await client.downloadTo(local, remote);
            }
        }

        if (list.length) {
            get();
        }
    };
    get();
};

const downloadFile = async (file, fileName, req, res) => {
    const id = req.params.machine;
    const machine = config.getMachine(id);
    console.log(`[${machine.id}] Fetching file: ${file}`);
    const client = await connect(machine);
    const disposition = 'attachment; filename="' + fileName + '"';
    res.setHeader('Content-Disposition', disposition);
    client.downloadTo(res, file);
};
module.exports.downloadFile = downloadFile;


const getAllThumbs = () => {
    MACHINES.forEach(machine => {
        fetchThumbs(machine.id);
    });
};
module.exports.getAllThumbs = getAllThumbs;

//Auto load this on start..
getAllThumbs();

setInterval(() => {
    getAllThumbs();
}, REFRESH);

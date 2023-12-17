const fs = require('fs');
const path = require('path');

let CONFIG = path.join(__dirname, '../config.json');

if (!fs.existsSync(CONFIG)) { //Outside docker container
    CONFIG = `../../config.json`;
}

const DL = path.join(__dirname, '../public/img/downloads');
const PORT = 9000;

if (!fs.existsSync(DL)) {
    fs.mkdirSync(DL);
}

const c = require(CONFIG)

module.exports.machines = c.machines || c;
module.exports.downloads = DL;
module.exports.port = PORT;

module.exports.getMachine = (id) => {
    let machine = null;
    module.exports.machines.forEach((m) => {
        if (m.id === id) {
            machine = m;
        }
    });
    return machine;
};

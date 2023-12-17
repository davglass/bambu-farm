#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const config = require('./lib/config.js');
const ftps = require('./lib/ftps.js');

const MACHINES = config.machines;
const PORT = config.port;
const DL = config.downloads;

const express = require('express');
const { engine } = require('express-handlebars');

const app = express();
app.use(express.static('public'));

app.engine('handlebars', engine({
    helpers: {
        json: function(context) { 
            return JSON.stringify(context, null, 4);
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use((req, res, next) => {
    res.locals.machines = MACHINES;
    res.locals.ams = ['A', 'B', 'C', 'D'];
    res.locals.trays = ['1', '2', '3', '4'];
    res.locals.themeClass = '';
    if (req.query.theme) {
        res.locals.theme = req.query.theme;
        if (['dark', 'min', 'dark-min', 'min-dark'].includes(req.query.theme)) {
            res.locals.themeClass = req.query.theme.replace('-', ' ');
            let t = res.locals.themeClass;
            if (t === 'min-dark') {
                t = 'dark-min';
            }
            let theme = `theme_${t.replace(' ', '_')}`;
            res.locals[theme] = true;;
        }
    }
    next();
});

app.get('/timelapse/:machine/:file', (req, res) => {
    const fileName = req.params.file.replace('.jpg', '.mp4');
    const file = `/timelapse/${fileName}`;
    res.setHeader('Content-Type', 'video/mp4');
    ftps.downloadFile(file, fileName, req, res);
});

app.get(`/timelapse/:machine`, (req, res) => {
    ftps.getAllThumbs();
    const m = config.getMachine(req.params.machine);
    res.locals.name = m.name;
    res.locals.machine = req.params.machine;
    const dir = path.join(DL, req.params.machine);
    fs.readdir(dir, (err, thumbs) => {
        res.locals.thumbsCount = thumbs.length;
        res.locals.thumbs = thumbs.reverse();
        res.render('timelapse');
    });
});

app.get('/gcode/:machine/:file', (req, res) => {
    const fileName = req.params.file;
    const file = `/${fileName}`;
    ftps.downloadFile(file, fileName, req, res);
});

app.get(`/gcode/:machine`, (req, res) => {
    const m = config.getMachine(req.params.machine);
    res.locals.name = m.name;
    res.locals.machine = req.params.machine;
    ftps.getAllGCode(m, (gcode) => {
        res.locals.gcode = gcode;
        res.render('gcode');
    });
});

app.get('/', (req, res) => {
    res.render('home');
});

app.listen(PORT);

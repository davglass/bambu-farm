#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

let CONFIG = path.join(__dirname, './config.json');

if (!fs.existsSync(CONFIG)) { //Outside docker container
    CONFIG = `../config.json`;
}

const MACHINES = require(CONFIG);

const PORT = 9000;

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

app.get('/', (req, res) => {
    res.locals.machines = MACHINES;
    res.locals.ams = ['A', 'B', 'C', 'D'];
    res.locals.trays = ['1', '2', '3', '4'];
    res.locals.themeClass = '';
    if (req.query.theme) {
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
    res.render('home');
});

app.listen(PORT);

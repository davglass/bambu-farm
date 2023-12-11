// Tooltips
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));


//Theme Selector
document.querySelector(`header .wrapper select`).addEventListener('change', (e) => {
    const target = e.target;
    const value = target.options[target.selectedIndex].value;
    location.href = `/?theme=${value}`;
});

// Setting the WS & video stream to the proper IP if this container
// isn't loaded from localhost..
const HOST = location.hostname;
const WS_SERVER = `ws://${HOST}:9999/`;
window.MACHINES.forEach((machine) => {
    const src = `http://${HOST}:8888/${machine.id}`;
    const sel = `.machine_${machine.id} iframe`;
    const el = document.querySelector(sel);
    el.src = src;
});

const connect = () => {
    const ws = new WebSocket(WS_SERVER);
    ws.onmessage = (event) => {
        const json = JSON.parse(event.data);
        //console.log(json.data);
        if (json.data && json.data.ams) {
            handleAMS(json);
        }
        if (json.data) {
            handleMachineInfo(json);
        }
    };

    ws.onclose = (e) => {
        console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
        setTimeout(connect, 1000);
    };

    ws.onerror = (err) => {
        console.error('Socket encountered error: ', err.message, 'Closing socket');
        ws.close();
    };
};
connect();

const handleAMS = (json) => {
    //console.log(json);
    const SEL = `.machine_${json.printer.id} .ams`;
    const AMS = json.data.ams.ams;
    const NOW = Number(json.data.ams.tray_now); //Current Loaded Filament
    let CURRENT; //Holder for current spool
    let counter = 0; //Counter for spool calculations

    //testing
    /*
    if (AMS.length == 2) {
        const ams3 = JSON.parse(JSON.stringify(AMS[0]));
        const ams4 = JSON.parse(JSON.stringify(AMS[1]));
        ams3.id = 2;
        ams4.id = 3;
        AMS.push(ams3);
        AMS.push(ams4);
    }
    */
    if (!Array.isArray(AMS)) {
        return;
    }
    AMS.forEach(ams => {
        ams.tray.forEach(tray => {
            if (counter === NOW) {
                CURRENT = {
                    ams: ams,
                    tray: tray
                };
            }
            counter++;
        });
    });
    //NOW === 255 when nothing is loaded..
    // Handle loaded filament color
    if (NOW === 255) {
        const sel = `${SEL} .tray.active`;
        document.querySelectorAll(sel).forEach(el => {
            el.classList.remove('active');
        });

    } else {
        if (CURRENT) {
            const sel = `${SEL} .ams_${CURRENT.ams.id} .tray_${CURRENT.tray.id}`;
            const el = document.querySelector(sel);
            el.classList.add('active');
        }
    }
    AMS.forEach((ams) => {
        //console.log(ams);
        const sel = `${SEL} .ams_${ams.id}`;
        document.querySelector(sel).classList.remove('visually-hidden');
        document.querySelector(`${sel} .temp`).innerHTML = ams.temp.replace(' ', '&nbsp;');
        //document.querySelector(`${sel} .humidity`).innerHTML = ams.humidity;
        const img = `/img/bambu/ams_humidity_${(ams.humidity - 1)}.svg`;
        document.querySelector(`${sel} .humidity img`).src = img;

        ams.tray.forEach((tray) => {
            const sel = `${SEL} .ams_${ams.id} .tray_${tray.id}`;
            const isEmpty = Object.keys(tray).length === 1;
            // Tooltip
            let title = `Tray is empty!`;
            if (!isEmpty) {
                let name = tray.name || tray.tray_type;
                title = `${name}<br>${tray.remain}% remaining`;
            }
            const cont = document.querySelector(`${sel} .color_box`)
            const tooltip = new bootstrap.Tooltip(cont, {
                html: true,
                title: title
            });

            if (isEmpty) { //Empty Tray
                document.querySelector(`${sel} .name`).innerHTML = 'Empty';
                document.querySelector(`${sel} .color_box`).classList.add('empty');
                return;
            }
            if (tray.tray_type) {
                document.querySelector(`${sel} .name`).innerHTML = tray.tray_type;
                document.querySelector(`${sel} .color_box`).classList.remove('empty');
            }
            if (tray.cols) {
                const el = document.querySelector(`${sel} .color`);
                let color1 = tray.cols[0];
                let color2 = tray.cols[1] || color1;
                el.style.backgroundImage = `linear-gradient(90deg, #${color1}, #${color2})`;
                let re = tray.remain;
                el.style.height = `${re}%`;
            }
        });
    });
};

const handleMachineInfo = (json) => {
    //console.log(json);

    let value;
    const data = json.data;
    const SEL = `.machine_${json.printer.id} .status`;
    const update = (_sel, value) => {
        let sel = `${SEL} ${_sel}`;
        if (sel && value) {
            const el = document.querySelector(sel);
            if (el) {
                el.innerHTML = value;
            } else {
                console.error(`Failed to find: ${sel}`);
            }
        }
    };
    if (data.upgrade_state && data.upgrade_state.ota_new_version_number) {
        const ver = data.upgrade_state.ota_new_version_number;
        console.info('New Firmware Version', ver, json.printer);
        const st = document.querySelector(SEL);
        const el = document.createElement('div');
        el.className = 'firmware-update';
        el.innerHTML = `<img src="/img/bambu/hms_notify_lv2.svg"> New Firmware Available: ${ver}`;
        st.insertBefore(el, st.firstChild);
    } else {
        const el = document.querySelector(`${SEL} .firmware-update`);
        if (el) {
            el.parentNode.removeChild(el);
        }
    }
    if (data.upgrade_state && data.upgrade_state.progress !== '0') {
        data.subtask_name = 'Firmware Updating';
        data.mc_percent = Number(data.upgrade_state.progress);
    }

    if ('mc_remaining_time' in data) {
        const sel = `.remaining`;
        value = `${data.mc_remaining_time} remaining`;
        if (data.mc_remaining_time === 0) {
            value = `machine idle`;
            data.subtask_name = 'None';
            data.total_layer_num = 0;
            data.layer_num = 0;
            data.mc_percent = 0;
        }
        update(sel, value);
    }
    if ('mc_percent' in data) {
        const sel = `${SEL} .progress .progress-bar`;
        const el = document.querySelector(sel);
        let percent = data.mc_percent + '%';
        if (percent === '100%') {
            data.mc_remaining_time = '0';       
        }
        el.innerHTML = percent;
        el.style.width = percent;
    }
    if (data.subtask_name) {
        const sel = `.task_name`;
        value = data.subtask_name.replace('.gcode.3mf', '');
        if (value === 'auto_cali_for_user_param.gcode') {
            value = 'Auto Calibration';
        }
        update(sel, value);
    }
    if (data.total_layer_num) {
        const sel = `.total_layer_num`;
        value = data.total_layer_num;
        update(sel, value);
    }
    if (data.layer_num) {
        const sel = `.active_layer`;
        value = data.layer_num;
        update(sel, value);
    }
    ['chamber', 'bed', 'bed_target', 'nozzle', 'nozzle_target'].forEach((name) => {
        const key = `${name}_temper`;
        if (data[key]) {
            const sel = `.${name}`;
            value = data[key].replace(/ /g, '&nbsp;');
            update(sel, value);
        }
    });

    if (data.lights_report) {
        const sel = `${SEL} .light`;
        data.lights_report.forEach((i) => {
            if (i.node === 'chamber_light') {
                let str = i.mode.toLowerCase();
                str = `${str.charAt(0).toUpperCase()}${str.slice(1)}`
                let img = `/img/bambu/monitor_lamp_${i.mode}.svg`;
                document.querySelector(sel).src = img;
                update(`.lamp_status`, str);
            }
        });
    }
    if ('spd_lvl' in data) {
        update(`.speed`, SPEEDS[data.spd_lvl]);
    }
};

const SPEEDS = {
    1: 'Silent',
    2: 'Normal',
    3: 'Sport',
    4: 'Ludicrous'
};

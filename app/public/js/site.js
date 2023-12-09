const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

const WS_SERVER = "ws://127.0.0.1:9999/";

const connect = () => {
    const ws = new WebSocket(WS_SERVER);
    ws.onmessage = (event) => {
        const json = JSON.parse(event.data);
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
    //testing
    /*
    if (AMS.length == 2) {
        const ams3 = JSON.parse(JSON.stringify(AMS[0]));
        const ams4 = JSON.parse(JSON.stringify(AMS[1]));
        ams3.id = 2;
        ams4.id = 3;
        AMS.push(ams3);
        AMS.push(ams4);
    }*/
    if (!Array.isArray(AMS)) {
        return;
    }
    AMS.forEach((ams) => {
        //console.log(ams);
        const sel = `${SEL} .ams_${ams.id}`;
        document.querySelector(sel).classList.remove('visually-hidden');
        document.querySelector(`${sel} .temp`).innerHTML = ams.temp;
        document.querySelector(`${sel} .humidity`).innerHTML = ams.humidity;

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
    console.log(json);

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

    if (data.mc_percent) {
        const sel = `${SEL} .progress .progress-bar`;
        const el = document.querySelector(sel);
        let percent = data.mc_percent + '%';
        if (percent === '100%') {
            data.mc_remaining_time = '0';       
        }
        el.innerHTML = percent;
        el.style.width = percent;
    }
    if (data.mc_remaining_time) {
        const sel = `.remaining`;
        value = `${data.mc_remaining_time} remaining`;
        if (data.mc_remaining_time === '0') {
            value = `machine idle`;
        }
        update(sel, value);
    }
    if (data.subtask_name) {
        const sel = `.task_name`;
        value = data.subtask_name.replace('.gcode.3mf', '');
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
    if ('spd_lv' in data) {
        update(`.speed`, SPEEDS[data.spd_lv]);
    }
};

const SPEEDS = {
    1: 'Silent',
    2: 'Normal',
    3: 'Sport',
    4: 'Ludicrous'
};

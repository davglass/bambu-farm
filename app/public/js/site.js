const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

const WS_SERVER = "ws://127.0.0.1:9999/";

const connect = () => {
    const ws = new WebSocket(WS_SERVER);
    ws.onmessage = (event) => {
        const json = JSON.parse(event.data);
        console.log(json);
        if (json.data && json.data.mc_percent) {
            const sel = `.machine_${json.printer.id} .status .progress .progress-bar`;
            const el = document.querySelector(sel);
            let percent = json.data.mc_percent + '%';
            if (percent === '100%') {
                json.data.mc_remaining_time = '0';       
            }
            el.innerHTML = percent;
            el.style.width = percent;
        }
        if (json.data && json.data.mc_remaining_time) {
            const sel = `.machine_${json.printer.id} .status .remaining`;
            document.querySelector(sel).innerHTML = `${json.data.mc_remaining_time} remaining`;
        }
        if (json.data && json.data.subtask_name) {
            const sel = `.machine_${json.printer.id} .status .task_name`;
            document.querySelector(sel).innerHTML = json.data.subtask_name.replace('.gcode.3mf', '');
        }
        if (json.data && json.data.total_layer_num) {
            const sel = `.machine_${json.printer.id} .status .total_layer_num`;
            document.querySelector(sel).innerHTML = json.data.total_layer_num;
        }
        if (json.data && json.data.layer_num) {
            const sel = `.machine_${json.printer.id} .status .active_layer`;
            document.querySelector(sel).innerHTML = json.data.layer_num;
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


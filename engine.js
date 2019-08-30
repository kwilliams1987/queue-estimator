"use strict";

let inElementChange = false;
let onElementChange = e => {
    if (inElementChange)
        return;

    try {
        inElementChange = true;

        let values = [],
            rows = document.querySelectorAll('tbody tr');

        for (let r = 0; r < rows.length; r++) {
            let timeParts = rows[r].querySelector('input[type="time"]').value.split(':').map(i => parseInt(i)),
                time = NaN;

            let queue = rows[r].querySelector('input[type="number"]').value;

            if (timeParts.length == 2) {
                time = (timeParts[0] * 60 * 60) + (timeParts[1] * 60);
            } else {
                time = (timeParts[0] * 60 * 60) + (timeParts[1] * 60) + timeParts[2];
            }

            values.push({
                time: time,
                queue: parseInt(queue)
            });
        }

        window.localStorage.setItem('results', JSON.stringify(values));
        let error = false;

        for (let v = 1; v < values.length; v++) {
            let value = values[v],
                prev = values[v - 1],
                cells = rows[v].querySelectorAll('td');
            let deltaT = value.time - prev.time,
                deltaQ = prev.queue - value.queue,
                flowRate = deltaQ / deltaT;

            if (deltaQ <= 0 || deltaT <= 0) {
                error = true;

                cells[2].innerHTML = "Error";
                cells[3].innerHTML = "N/A";
                cells[4].innerHTML = "N/A";
                cells[5].innerHTML = "N/A";
            } else {

                cells[2].innerHTML = formatSeconds(deltaT);
                cells[3].innerHTML = deltaQ;
                cells[4].innerHTML = Math.floor(flowRate * 100 * 60) / 100;
                cells[5].innerHTML = formatSeconds(Math.floor(value.time + (value.queue / flowRate)));
            }
        }

        if (values.length < 2 || error) {
            document.querySelectorAll('tfoot td')[1].innerHTML = "ERROR";
        } else {
            let time = values[values.length - 1].time,
                queue = values[values.length - 1].queue,
                deltaT = values[values.length - 1].time - values[0].time,
                deltaQ = values[0].queue - values[values.length - 1].queue,
                flowRate = deltaQ / deltaT;

            document.querySelectorAll('tfoot td')[1].innerHTML = formatSeconds(Math.floor(time + (queue / flowRate)));
        }

    } catch (e) {}

    inElementChange = false;
};

let formatSeconds = value => {
    let hours = Math.floor(value / 60 / 60),
        minutes = Math.floor((value / 60) - (hours * 60)),
        seconds = value % 60;

    return formatTime(hours, minutes, seconds);
}

let formatTime = (hours, minutes, seconds) => {
    let result = hours < 10 ? '0' : '';
    result += hours + ':';
    result += minutes < 10 ? '0' : '';
    result += minutes + ':';
    result += seconds < 10 ? '0' : '';
    result += seconds;

    return result;
}

let addRowWithValues = (timeValue, queueValue) => {
    let row = document.createElement('tr');

    if (timeValue === undefined) {
        let currentTime = new Date();

        timeValue = (currentTime.getHours() < 10 ? '0' : '') + currentTime.getHours() + ':' + (currentTime.getMinutes() < 10 ? '0' : '') + currentTime.getMinutes() + ':00';
    } else {
        timeValue = formatSeconds(timeValue);
    }

    if (queueValue === undefined) {
        queueValue = 0;
    }

    for (let c = 0; c < 7; c++) {
        let cell = document.createElement('td');
        row.appendChild(cell);

        switch (c) {
            case 0:
                let time = document.createElement('input');
                time.value = timeValue;
                time.type = 'time';
                time.required = true;
                time.onchange = onElementChange;
                cell.appendChild(time);
                break;
            case 1:
                let queue = document.createElement('input');
                queue.value = queueValue;
                queue.type = 'number';
                queue.step = 1;
                queue.min = 0;
                queue.required = true;
                queue.onchange = onElementChange;
                cell.appendChild(queue);
                break;
            case 6:
                let button = document.createElement('button');
                button.innerHTML = 'X';
                button.onclick = _ => {
                    let row = button.parentElement.parentElement;
                    row.parentElement.removeChild(row);
                    gtag('event', 'delete-row', {
                        'event_category': 'data'
                    });

                    onElementChange();
                };
                cell.appendChild(button);
        }
    }

    document.getElementsByTagName('tbody')[0].appendChild(row);
    onElementChange();
}

document.getElementById("addRow").addEventListener("click", _ => {
    gtag('event', 'create-row', {
        'date': new Date(),
        'event_category': 'data'
    });
    addRowWithValues();
}, false);

document.getElementById("clear").addEventListener("click", _ => {
    if (window.confirm("Clear existing data?")) {
        window.localStorage.setItem('results', JSON.stringify([]));
        let tbody = document.getElementsByTagName("tbody")[0];

        while (tbody.children.length > 0)
            tbody.removeChild(tbody.children[0]);
    }
}, false);

let stored = window.localStorage.getItem('results');
if (stored) {
    let current = JSON.parse(stored);

    for (let r = 0; r < current.length; r++) {
        addRowWithValues(current[r].time, current[r].queue);
    }
}
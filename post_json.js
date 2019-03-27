// Send an HTTP request to the server with POSTed json-data
// This is adapted from https://stackoverflow.com/questions/24468459/sending-a-json-to-server-and-retrieving-a-json-in-return-without-jquery
function post_json(network_data, config_data, canvas, callback)
{
    let xhr = new XMLHttpRequest();
    let url = window.location.href;
    let img = canvas.toDataURL("image/png");
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let response = xhr.responseText;
            console.log(response);
            if (callback !== null)
                callback();
        }
    };
    let joint_data = { 'network':network_data, 'config':config_data, 'image':img};
    let data = JSON.stringify(joint_data);
    xhr.send(data);
}

function post_stop()
{
    let xhr = new XMLHttpRequest();
    let url = window.location.href;
    let this_close_function = window.close;
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let response = xhr.responseText;
            console.log(response);
            this_close_function();
        }
    };
    xhr.send();
}

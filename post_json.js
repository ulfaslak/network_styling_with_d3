// Send an HTTP request to the server with POSTed json-data
// This is adapted from https://stackoverflow.com/questions/24468459/sending-a-json-to-server-and-retrieving-a-json-in-return-without-jquery
function post_json(json_data)
{
    var xhr = new XMLHttpRequest();
    var url = window.location.href;
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var json = JSON.parse(xhr.responseText);
            console.log(json);
        }
    };
    var data = JSON.stringify(json_data);
    xhr.send(data);
}

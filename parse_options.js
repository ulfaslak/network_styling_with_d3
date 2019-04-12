// =========== GET DATA AND CONFIG FROM URL PARAMETERS =================
controls = {};

var this_url =  window.location.href;
this_url = new URL(this_url);

var this_data = this_url.searchParams.get("data");
if (!((this_data == "null") || (this_data === null)))
{
    controls['file_path'] = this_data;
}

var this_config = this_url.searchParams.get("config");
if ( !((this_config == "null") || (this_config === null)))
{
    d3.json(this_config,function(data){
        Reflect.ownKeys(data).forEach(key => controls[key] = data[key]);
    });
}

vis(controls);
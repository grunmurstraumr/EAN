/*************************************************************************
* Class definitions
*************************************************************************/
class Entry{
    constructor(name, plu, ean, image_url, active){
        this.name = name;
        this.plu = plu,
        this.ean = ean
        this.image = image_url
        this.active = active
    }
    fields(){
        //Return an array with the data fields
        return [this.name, this.plu, this.ean, this.image, this.active];
    }
}

class Dialog{
    // Maybe this can be used to render itself as well based on input
    constructor(name, id){
        this.prop_name = name;
        this.prop_id = id;
    }
    set id (new_id){
        this.prop_id = new_id;
    }
    get id (){
        return `#${this.prop_id}`;
    }

}
/*************************************************************************
* Settings
*************************************************************************/
const settings = {
    'fallback-image': './images/placeholder.png',
    'page-title': 'Självscanningskoder',
    'jsbarcode-height': 60,
    'jsbarcode-width': 2,
    'barcode-height': 12,
    'barcode-width': 35,
    'image-height': 30,
    'image-width': 35,
    'text-line-height': 6,
    'heading-font-size': 14,
    'plu-font-size': 10,
    'orientation': 'portrait',
    'page-size': 'a4',
    'page-width': 210,
    'page-height': 297,
    'unit': 'mm',
    'display-value': true,
    'card-height': 60,
    'card-width': 40,
    'card-margin': 0,
    'card-padding': 2.5,
    'page-margin': 25,
    'filename': 'Självscanningskoder',
    'file-ending': '.pdf',
    'csv-separator': ';',
    'proxy': "https://cors-anywhere.herokuapp.com/",
    'font-conversion-factor': 0.353, // 1/72 inch in millimeter
    'default-save-filename': 'streckkodslista.csv',
}
settings['card-height'] = 2*settings['card-padding']+settings['barcode-height'] + settings['image-height']+ 2*settings['text-line-height'];


/*************************************************************************
* File handling
*************************************************************************/
let data = []


/*************************************************************************
* Windowing
*************************************************************************/
let window_stack = [];

/*************************************************************************
* Rendering
*************************************************************************/


/*************************************************************************
* Utility functions
*************************************************************************/
const strToBool = str => {
    const truthy = ['true', '1'];
    return truthy.indexOf(str.toLowerCase()) !== -1;
}




let find_data = (value, key) =>{
    //Searches in data for entry on specified key-value pair
    return data.find((element) =>{
        return element[key].trim() === value.trim()
    });
}



const assign_image = (URL) =>{
    let image = new Image();
    image.onerror = () =>{
        image.src = settings['fallback-image'];
    }
    image.src = URL;
    return image;
}

function render(){
    document.getElementById('items').innerHTML = "";
    let root = document.getElementById('items');
    
    for (let i = 0; i < data.length; ++i){
        let item = data[i];
        let html = document.createElement('div');
        let id = item.name.replace(/[\s\/]/g, '-') // Replaces spaces with hyphens
        html.classList.add('item');
        img = document.createElement('img');
        img = assign_image(item.image);
        html.innerHTML =`
            <h2> ${item.name} </h2>
            <p> ${item.plu} </p>
            `
        canvas = document.createElement('canvas');
        canvas.id = `${id}_barcode`;
        html.appendChild(img);
        html.appendChild(canvas);
        root.appendChild(html);
        html.addEventListener('click', () => {
            html.classList.toggle('active');
            data_representation = find_data(html.querySelector('p').innerHTML, 'plu')
            console.log(find_data(html.querySelector('p').innerHTML, 'plu'));
           
            data_representation.active = strToBool(data_representation.active) ? 'false' : 'true' ;
            console.log(`HTML: ${html}\nDATA: ${data_representation}`);
        });

        JsBarcode(`#${id}_barcode`, item.ean, {
            height: settings['jsbarcode-height'],
            width: settings['jsbarcode-width'],
            displayValue: settings['display-value'],
        });
        if (strToBool(item.active))
            html.classList.add('active')
    }
}

function load_data(){
    clear_all();
    let file = document.querySelector("#data_files input").files[0];
    let reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () =>{
        // Split file into array of data entries
        let entries = reader.result.split('\n');
        //Iterate over array and split each into sub-arrays of values
        for (let i = 0; i < entries.length; ++i){
            entries[i] = entries[i].split(settings['csv-separator']);
            // Iterate over each value and strip leading and trailing whitespaces
            for (let j = 0; j < entries[i].length; ++j){
                entries[i][j] = entries[i][j].trim();
            }
            if (entries[i].length < 5)
                entries[i].push('false')
            let [name, plu, image_url, ean, active] = entries[i];
            if (name && plu && ean)
                data.push(new Entry( name, plu, image_url, ean, active));
        }
        data.sort((a,b)=>{
            if (a.name > b.name)
                return 1
            else
                return -1});
        render();
    }

}

function load_config(){
    let file = document.querySelector("#config_files input").files[0];
    let reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () =>{
        // Split configurations into an array of lines
        console.log(reader.result)
        let pairs = reader.result.split('\n');
        console.log(pairs)
        for (let i = 0; i < pairs.length; ++i){
            // Split each line into arrays consisting of key and value
            // Key is index 0 and value is index 1
            let key_val = pairs[i].split('=');
            // Assign value to key in settings
            settings[key_val[0]]= key_val[1];
        }
    }

}

const print_page = () => {
    let selected = document.querySelectorAll('.active');
    let unselected = document.querySelectorAll('.item:not(.active)');
    for (let item of unselected){
        item.classList.add('hidden');
    }
    window.print();  
    for (let item of unselected){
        item.classList.remove('hidden');
    }
}

let get_fields_from_html = (item) => {
    //Returns an array with the data fetched from the html
    // [name, plu, ean, image_url, active]
    let search_key = item.querySelector('p').innerHTML.trim() // Search on plu, not name, Very hacky solution. Needs refactoring
    let data_item = find_data(search_key, 'plu');
    return data_item.fields();
}

let save_data = () =>{
    // Use a data-URI anchor to create a downloadable file
    let format_csv = (str_arr) => {
        output = "";
        for (let value of str_arr){
            output += `${value}; `
        }
        return output;
    }
    // Set up download anchor
    var download_anchor = document.createElement('a');
    download_anchor.style.display = 'none';
    // Get active items from html
    let data_items = Array.from(document.querySelectorAll('.item'));

    for (let i = 0; i < data_items.length; ++i){
        data_items[i] = get_fields_from_html(data_items[i]);
    }
    //data_items.map(get_fields_from_html);
    
    let output = "";
    for (let item of data_items){
        //console.log(item)
        output += `${format_csv(item)}\n`
    }
    download_anchor.setAttribute('href', 'data:text/plain;encoding=utf-8,' + encodeURIComponent(output));//'data:application/octet-stream,' + encodeURIComponent(output));
    download_anchor.setAttribute('download', settings['default-save-filename']);
    document.body.appendChild(download_anchor);
    download_anchor.click();
    document.body.removeChild(download_anchor);
    
}
let save_active = () =>{
    // Use a data-URI anchor to create a downloadable file
    let format_csv = (str_arr) => {
        output = "";
        for (let value of str_arr){
            output += `${value}; `
        }
        return output;
    }
    // Set up download anchor
    var download_anchor = document.createElement('a');
    download_anchor.style.display = 'none';
    // Get active items from html
    let active_items = Array.from(document.querySelectorAll('.active'));

    for (let i = 0; i < active_items.length; ++i){
        active_items[i] = get_fields_from_html(active_items[i]);
    }
    //active_items.map(get_fields_from_html);
    
    let output = "";
    for (let item of active_items){
        //console.log(item)
        output += `${format_csv(item)}\n`
    }
    download_anchor.setAttribute('href', 'data:text/plain;encoding=utf-8,' + encodeURIComponent(output));//'data:application/octet-stream,' + encodeURIComponent(output));
    download_anchor.setAttribute('download', settings['default-save-filename']);
    document.body.appendChild(download_anchor);
    download_anchor.click();
    document.body.removeChild(download_anchor);
    
}


let dialogs = {'load_dialog' : 'data_file_dialog',};

const show_dialog = dialog_id => {
    let dialog = document.querySelector(`#${dialog_id}`);
    window_stack.push(dialog);
    dialog.classList.remove('hidden');
    dialog.focus();

}
const close_window = () => {
    let current = window_stack.pop();
    current.classList.add('hidden');
}

const clear_all = () =>{
    document.querySelector('#items').innerHTML = "";
    data = [];
}

const escape_listener = (event) =>{
    if(event.key === 'Escape'){
        event.preventDefault();
        close_window();
    }
}
const setup_event_listeners = ()=>{
    document.addEventListener('keydown', escape_listener)
    document.querySelector('#data_files button').addEventListener('click',() => {
        load_data();
        close_window();
    })
    document.querySelector('#command_load_data_btn').addEventListener('click', () =>{
        show_dialog('data_file_dialog');
    })
    
}

document.addEventListener('DOMContentLoaded', () => {
    // Set a periodic interval to communicate with server that 
    // the application is alive. If not the server should quit
    // after a specified time
    // setInterval()
    setup_event_listeners();
    show_load_window();
});


/*************************************************************************
* Class definitions
*************************************************************************/

class Entry{
    constructor(name, plu, ean, image_url, active){
        this.name = name;
        this.plu = plu;
        this.ean = ean;
        this.image = image_url;
        this.active = active;
        this.changed = true; //Flag to detect if redrawing would be necessary
        this.id = name.replace(/[\s\/]/g, '-'); // Replace spaces with hyphens
        this.node;
    }
    fields(){
        //Return an array with the data fields
        return [this.name, this.plu, this.ean, this.image, this.active];
    }

    edit(property, value){
        changed = true;
        if (property === 'name' || property ==='id'){
            this.old_id = this.id;
        }
        try{
            this[property] = value
            if (property === 'name'){
                
            }
        }
        catch(error){
            console.error(`${property} is an unknown property.`);
        }

    }
    toHtml(parent){
        // If nothing is changed just skip the entire function.
        if (this.changed){
            if (this.node)
                parent.removeChild(this.node);

            let html = document.createElement('div');
            html.classList.add('item');
            if (strToBool(this.active))
                html.classList.add('active');
            let img = document.createElement('img');
            img = assign_image(this.image);
            html.innerHTML = `
                <h2> ${this.name} </h2>
                <p> ${this.plu}</p>
                `
            let canvas = document.createElement('canvas');
            canvas.id = `${this.id}_barcode`;
            html.appendChild(img);
            html.appendChild(canvas);
            html.addEventListener('click', () => {
                html.classList.toggle('active');
                this.active = strToBool(this.active) ? 'false' : 'true'; //Toggle true/false for active 'flag'
            });
            parent.appendChild(html);
            JsBarcode(`#${this.id}_barcode`, this.ean, {
                height: settings['jsbarcode-height'],
                width: settings['jsbarcode-width'],
                displayValue: settings['display-value'],
            });
            this.node = html;
            this.changed = false;
        }
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

const assign_image = (URL) =>{
    let image = new Image();
    image.onerror = () =>{
        image.src = settings['fallback-image'];
    }
    image.src = URL;
    return image;
}

function load_data(){
    clear_all();
    let file = document.querySelector("#data_files input").files[0];
    let reader = new FileReader();

    reader.onload = (e) =>{
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
        renderAll();

    }
    reader.readAsText(file);
}

function load_config(){
    let file = document.querySelector("#config_files input").files[0];
    let reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () =>{
        // Split configurations into an array of lines
        let pairs = reader.result.split('\n');
        for (let i = 0; i < pairs.length; ++i){
            // Split each line into arrays consisting of key and value
            // Key is index 0 and value is index 1
            let key_val = pairs[i].split('=');
            // Assign value to key in settings
            settings[key_val[0]]= key_val[1];
        }
    }

}

const clear_all = () =>{
    document.querySelector('#items').innerHTML = "";
    data = [];
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
        output += `${format_csv(item)}\n`
    }
    download_anchor.setAttribute('href', 'data:text/plain;encoding=utf-8,' + encodeURIComponent(output));//'data:application/octet-stream,' + encodeURIComponent(output));
    download_anchor.setAttribute('download', settings['default-save-filename']);
    document.body.appendChild(download_anchor);
    download_anchor.click();
    document.body.removeChild(download_anchor);
    
}

let find_data = (value, key) =>{
    //Searches in data for entry on specified key-value pair
    return data.find((element) =>{
        return element[key].trim() === value.trim()
    });
}

let get_fields_from_html = (item) => {
    //Returns an array with the data fetched from the html
    // [name, plu, ean, image_url, active]
    let search_key = item.querySelector('p').innerHTML.trim() // Search on plu, not name, Very hacky solution. Needs refactoring
    let data_item = find_data(search_key, 'plu');
    return data_item.fields();
}

/*************************************************************************
* Windowing
*************************************************************************/
let dialogs = {'load_dialog' : 'data_file_dialog',};
let window_stack = [];

const show_dialog = dialog_id => {
    let dialog = document.querySelector(`#${dialog_id}`);
    window_stack.push(dialog);
    dialog.classList.remove('hidden');
    dialog.focus();

}
const close_top_window = () => {
    let current = window_stack.pop();
    current.classList.add('hidden');
}

/*************************************************************************
* Rendering
*************************************************************************/
function renderAll(){
    document.getElementById('items').innerHTML = "";
    let root = document.getElementById('items');
    for (let i = 0; i < data.length; ++i){
        data[i].toHtml(root);
    }
}

const print_page = () => {
    let unselected = document.querySelectorAll('.item:not(.active)');
    // Hide all elements not selected
    for (let item of unselected){
        item.classList.add('no-print');
    }
    // Open print dialog. This is a blocking operation so the following for
    // loop is not executed until the print dialog is closed.
    window.print();  
    // Un-hide previously hidden items that were not selected for printing
    for (let item of unselected){
        item.classList.remove('no-print');
    }
}


/*************************************************************************
* Utility functions
*************************************************************************/
const strToBool = str => {
    const truthy = ['true', '1'];
    return truthy.indexOf(str.toLowerCase()) !== -1;
}

/*************************************************************************
* Event handlers
*************************************************************************/
const handle_key_press = (event) =>{
    if(event.key === 'Escape'){
        event.preventDefault();
        close_top_window();
    }
}

/*************************************************************************
* Event Listeners
*************************************************************************/

const setup_event_listeners = ()=>{
    document.addEventListener('keydown', handle_key_press)
    document.querySelector('#data_files input').addEventListener('change', (event)=>{
        if(event.target.files.length > 0)
            load_data();

        close_top_window();
    });
    document.querySelector('#load_data_btn').addEventListener('click', () =>{
        show_dialog('data_file_dialog');
    });
    document.querySelector('#printable_btn').addEventListener('click', () => {
        print_page();
    });
    document.querySelector('#save_data_btn').addEventListener('click', () => {
        save_data();
    });
    /*document.querySelector('#add_data_btn').addEventListener('click', () =>{
        show_dialog('add_data_dialog');
    })*/
    document.querySelectorAll('.close_x').forEach( (element) => {
        element.addEventListener('click', () =>{
            close_top_window();
        });
    });
}   
document.addEventListener('DOMContentLoaded', () => {
    setup_event_listeners();
    show_dialog('data_file_dialog');
    //show_dialog('add_data_dialog');
});


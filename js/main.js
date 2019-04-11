/*************************************************************************
* Class definitions
*************************************************************************/
class DataContainer{
    // The dataContainer is a thin wrapper around an array to provide some additional functionality
    // for the purposes of this application. 
    //  * It only allows pushing unique items
    //  * Sort has a built in comparison function
    constructor(){
        this.data = [];
    }
    push(param){
        // assume param is of type Entry
        // Check if item is already stored
        // If item already exists update with new information
        let item = this.find(param.plu, 'plu');
        if (item !== undefined){
            //First remove from parent
            try{
            let parent = item.node.parentNode;
            parent.removeChild(item);
            
            console.log(item);
            }
            catch(error){
                console.error(`Item ${item.name} is already stored in data but has no html node. Skip this part.`)
            }
            finally{
                item = param;
                item.generate_id;
            }
        }
        else{
            this.data.push(param);
        }
           
    }
    sort(){
        this.data = this.data.sort((a,b)=>{
            // Sort by name
            if (a.name.toLowerCase() > b.name.toLowerCase())
                return 1
            else
                return -1
        })
        this.data.forEach((item, index) =>{
            item.index = index;
        })
    }
    find(value, key){
        //Searches in data for entry on specified key-value pair
        return this.data.find((element) =>{
            return element[key].trim() === value.trim()
        });
    }
    exists(value, key){
        // Returns true if object exists
        if (this.data.find(element => {
            return element[key].trim() === value.trim()
        })){
            return true;
        }
        else
            return false;

    }
    remove(value, key){

        let item = this.data.splice(this.data.findIndex(element =>{
            //console.log(`Comparing ${element[key]} and ${value}`);
            return element[key].trim() === value.trim()
        }),1)[0];
        item.remove_from_html();
    }
    get length(){
        return this.data.length;
    }
    getIndex(param_index){
        if (param_index < this.data.length)
            return this.data[param_index];
        else
            throw "Index out of range";
    }

    clear(){
        this.data = [];
    }
}
class Entry{
    constructor(name, plu, ean, image_url, pactive){
        this.name = name;
        this.plu = plu;
        this.ean = ean;
        this.image = image_url;
        if (!this.image){
            this.image = settings['fallback-image'];
        }
        if (typeof pactive === 'boolean')
            this.active = pactive;
        else if(typeof pactive === 'string')
            this.active = strToBool(pactive);
        else
            this.active = false;
        this.changed = true; //Flag to detect if redrawing would be necessary
        this.html_id = this.generate_id(name); // Replace spaces with hyphens
        this.node = undefined;
        this.index = 0;

    }
    fields(){
        //Return an array with the data fields
        return [this.name, this.plu, this.ean, this.image, this.active];
    }
    generate_id(param){
        return param.replace(/[\s\/]/g, '-')
    }
    remove_from_html(){
        if (this.node){
            this.node.parentNode.removeChild(this.node);
        }
    }
    toHtml(parent){    
        if (this.node)
            parent.removeChild(this.node);

        let html = document.createElement('div');
        html.classList.add('item');
        if (this.active)
            html.classList.add('active');
        let img = document.createElement('img');
        img = assign_image(this.image);
        let edit_symbol = document.createElement('i');
        edit_symbol.title = "Ändra"; // This is automagically showns as a tooltip
        edit_symbol.classList.add('fas', 'fa-tools', 'edit_symbol');
        edit_symbol.addEventListener('click', event => {
            show_dialog('edit_data_dialog');
            initialize_edit_form(this);
            // Following is basically a hack since the click event
            // on the whole item div toggles active, this undoes that
            // in a very inefficient and not very 
            this.active = !this.active;
            html.classList.toggle('active');
        });
        let delete_symbol = document.createElement('i');
        delete_symbol.title = "Ta bort"; // This is automagically showns as a tooltip
        delete_symbol.classList.add('fas', 'fa-trash-alt', 'remove_symbol');
        delete_symbol.addEventListener('click', event =>{
            if (confirm(`Vill du verkligen radera ${this.name}?`))
                data.remove(this.plu, 'plu');
            // If item is not removed untoggle active states
            this.node.classList.toggle('active');
            this.active = !this.active;
        })
        html.innerHTML = `
            <h2> ${this.name} </h2>
            <p> ${this.plu}</p>
            `
        let canvas = document.createElement('canvas');
        canvas.id = `${this.html_id}_barcode`;
        html.appendChild(edit_symbol);
        html.appendChild(delete_symbol);
        html.appendChild(img);
        html.appendChild(canvas);
        html.addEventListener('click', () => {
            html.classList.toggle('active');
            this.active = !this.active; //Toggle true/false for active 'flag'
        });
        html.querySelector('i')
        parent.appendChild(html);
        JsBarcode(`#${this.html_id}_barcode`, this.ean, {
            height: settings['jsbarcode-height'],
            width: settings['jsbarcode-width'],
            displayValue: settings['display-value'],
        });
        this.node = html;
        this.node.style.order = this.index;
        this.changed = false;
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
    'file-ending': '.csv',
    'csv-separator': ';',
    'default-save-filename': 'streckkodslista',
}
settings['card-height'] = 2*settings['card-padding']+settings['barcode-height'] + settings['image-height']+ 2*settings['text-line-height'];


/*************************************************************************
* File handling
*************************************************************************/
let data = new DataContainer();

const add_new = () =>{
    let form = document.querySelector('#add_new_form');
    data.push(new Entry(form['add_data_name'].value, 
    form['add_data_plu'].value, 
    form['add_data_ean'].value, 
    form['add_image_url'].value, 
    form['add_data_active_check'].checked)
    );
    data.sort();
    renderAll();
    form.reset();
}

const edit_item = (id) =>{
    let item = data.find(id, 'plu');
    let form = document.querySelector('#edit_data_dialog form');
    item.name = form['edit_data_name'].value;
    item.plu = form['edit_data_plu'].value;
    item.ean = form['edit_data_ean'].value;
    item.image = form['edit_image_url'].value;
    item.active = form['edit_data_active_check'].checked;
    data.sort();
    let root_node = document.querySelector('#items');
    item.toHtml(root_node);
}


const initialize_edit_form = (entry) => {
    let form = document.querySelector('#edit_data_dialog form');
    form['edit_data_name'].value = entry.name;
    form['edit_data_plu'].value = entry.plu;
    form['edit_data_ean'].value = entry.ean;
    form['edit_image_url'].value = entry.image;
    form['edit_data_active_check'].checked = entry.active;
    form.onsubmit = (event) => {
        event.preventDefault();
        edit_item(entry.plu);
        close_top_window();
        return false;
    }
}

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
        data.sort();
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
    data.clear();
}

let save_data = () =>{
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
    let output = "";
    for (let i = 0; i < data.length; ++i){
        output += `${format_csv(data.getIndex(i).fields())}\n`
    }
    let timestamp = new Date();

    download_anchor.setAttribute('href', 'data:text/plain;encoding=utf-8,' + encodeURIComponent(output));//'data:application/octet-stream,' + encodeURIComponent(output));
    download_anchor.setAttribute('download', `${settings['default-save-filename']}_${Date.now()}${settings['file-ending']}` );
    document.body.appendChild(download_anchor);
    download_anchor.click();
    document.body.removeChild(download_anchor);
    
}

let get_fields_from_html = (item) => {
    //Returns an array with the data fetched from the html
    // [name, plu, ean, image_url, active]
    let search_key = item.querySelector('p').innerHTML.trim() // Search on plu, not name, Very hacky solution. Needs refactoring
    let data_item = find(search_key, 'plu');
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
    let root = document.getElementById('items');
    //root.innerHTML = "";
    for (let i = 0; i < data.length; ++i){
        data.getIndex(i).toHtml(root);
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
        if (window_stack.length > 0)
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
    document.querySelector('#add_data_btn').addEventListener('click', () =>{
        show_dialog('add_data_dialog');
    });
    document.querySelector('#clear_selection').addEventListener('click', () =>{
        let selected = document.querySelectorAll('.active');
        selected.forEach(element =>{
            element.classList.remove('active');
            let data_item = data.getIndex(element.style.order);
            data_item.active = !data_item.active;
        })
    })
    document.querySelector('#add_data_dialog form ').addEventListener('submit', (event) => {
        event.preventDefault();
        add_new();
        close_top_window();
    });

    document.querySelectorAll('.close_x').forEach( (element) => {
        element.addEventListener('click', () =>{
            close_top_window();
        });
    });
}   
document.addEventListener('DOMContentLoaded', () => {
    setup_event_listeners();
    //show_dialog('data_file_dialog');
    show_dialog('add_data_dialog');
});


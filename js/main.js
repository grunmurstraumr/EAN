let window_stack = [];
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
    'default-save-filename': 'streckkodslista.csv',
}

settings['card-height'] = 2*settings['card-padding']+settings['barcode-height'] + settings['image-height']+ 2*settings['text-line-height']
let data = []
let find_data = (value, key) =>{
    //Searches in data for entry on specified key-value pair
    return data.find((element) =>{
        return element[key].trim() === value.trim()
    });
}

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

strToBool = str => {
    const truthy = ['true', '1'];
    return truthy.indexOf(str.toLowerCase()) !== -1;
}

function image_exists(image_url){
    let http = new XMLHttpRequest();
    http.open('HEAD', image_url, false);
    http.send();

    return http.status != 404;
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
        if (image_exists(item.image))
            img.src = item.image;
        else
            img.src = settings['fallback-image'];
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
            data_representation = find_data(html.querySelector('p').innerHTML, 'plu');
            data_representation.active = strToBool(data_representation.active) ? 'false' : 'true' ;
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
    data.sort((a,b)=>{
        if (a.name > b.name)
            return 1
        else
            return -1});
    render();
}

const write_pdf = (name) => {
    let doc = new jsPDF({unit: settings['unit'],
        orientation: settings['orientation']});
    let list_of_active = document.querySelectorAll('.active');
    let row_offset = settings['page-margin'];
    let row_height = settings['card-height'] + settings['card-margin'];
    doc.text(settings['page-title'], settings['page-width']/2 - settings['page-title'].length, row_offset);
    row_offset += settings['text-line-height'] + settings['card-margin'];
    for (let i = 0; i < list_of_active.length; ++i){
        let current = list_of_active[i];
        let column = i % 4
        if (column === 0){
            if (i !== 0)
                row_offset += settings['card-height'] + settings['card-margin']
        }
        if (row_offset + row_height > settings['page-height'] ){
            doc.addPage();
            row_offset = settings['page-margin'];
        }
        // Draw the border
        let current_left_offset = settings['page-margin'] + 
            column *(settings['card-width'] + 
            settings['card-margin']); // + 
            //settings['card-padding'];
        let component_height_offset = row_offset + settings['card-padding'];
        doc.rect(
            current_left_offset - settings['card-padding'], 
            row_offset,
            settings['card-width'],
            settings['card-height'],
            'S')
        let text = current.querySelector('h2').innerHTML;
        if (text.length > settings['heading-font-size'])
            doc.setFontSize((settings['card-width']/text.length)*5)
        else
            doc.setFontSize(settings['heading-font-size'])
        
        // compute center
        let text_width = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
        let offset = (settings['card-width'] - settings['card-padding']*2 - text_width)/2;
        doc.text(text, 
            current_left_offset + offset,
            component_height_offset,
            {'baseline': 'top'});
        component_height_offset += settings['text-line-height'];
        // Write plu
        doc.setFontSize(settings['plu-font-size']);
        let plu = current.querySelector('p').innerHTML 
        let plu_width = doc.getStringUnitWidth(plu) * doc.internal.getFontSize() / doc.internal.scaleFactor;
        let plu_offset = (settings['card-width'] - settings['card-padding']*2 - plu_width)/2;
        doc.text(plu, 
            current_left_offset + plu_offset,
            component_height_offset,
            {'baseline': 'top'});
        component_height_offset += settings['text-line-height'];
        let image_elem = current.querySelector('img');
        let image_url = image_elem['src'];
        //console.log(image_url);

        try {
            doc.addImage(image_elem,
                'JPEG',
                current_left_offset, 
                component_height_offset, 
                settings['image-width'], 
                settings['image-height']);
        }
        catch(error){
            // Catch error but nothing needs to be done.
            console.log(error)
            // TODO add default placeholder image and uncomment following lines
            
            placeholder = document.createElement('IMG');
            placeholder.setAttribute('src', './images/placeholder.png');
            console.log(placeholder);
            doc.addImage(placeholder,
            'PNG',
            current_left_offset, 
            component_height_offset, 
            settings['image-width'], 
            settings['image-height']);
            
        }
        component_height_offset += settings['image-height']
        doc.addImage(current.querySelector('canvas'),
            current_left_offset,
            component_height_offset,
            settings['barcode-width'],
            settings['barcode-height']);

    }
    let date = new Date();
    doc.save(`${settings['filename']}${date.getDate()}-${date.getMonth()}${settings['file-ending']}`);
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

const open_dialog = (dialog_id) =>{
    let dialog = document.querySelector(`#${dialog_id}`);
    window_stack.push(dialog);
    dialog.classList.remove('hidden');
    dialog.focus();
}

let load_window_id = '#data_file_dialog';
const show_load_window = () =>{
    let dialog = document.querySelector(load_window_id);
    window_stack.push(dialog)
    dialog.classList.remove('hidden');
    dialog.focus();
}
/*
This should be safe to delete
const close_load_window = () =>{
    let dialog = document.querySelector(load_window_id);
    dialog.classList.add('hidden');
}
*/

const close_window = () => {
    let current = window_stack.pop();
    current.classList.add('hidden');
}

const clear_all = () =>{
    console.log('clear called');
    console.log(document.querySelector('#items'));
    document.querySelector('#items').innerHTML = "";
    data = [];
}

const load_window_escape_listener = (event) =>{
    if (event.key === 'Escape'){
        event.preventDefault();
        close_window();
    }
}
const setup_event_listeners = ()=>{
    document.addEventListener('keydown', load_window_escape_listener)
    
}

document.addEventListener('DOMContentLoaded', () => {
    // Set a periodic interval to communicate with server that 
    // the application is alive. If not the server should quit
    // after a specified time
    // setInterval()
    setup_event_listeners();
});


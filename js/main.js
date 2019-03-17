const a4h = 297;
const a4w = 210;
const settings = {
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
}

settings['card-height'] = 2*settings['card-padding']+settings['barcode-height'] + settings['image-height']+ 2*settings['text-line-height']
let data = []

class Entry{
    constructor(name, plu, ean, image_url){
        this.name = name;
        this.plu = plu,
        this.ean = ean
        this.image = image_url
    }

}
function render(){
    let root = document.getElementById('items');
    for (let i = 0; i < data.length; ++i){
        let item = data[i];
        let html = document.createElement('div');
        html.classList.add('item');
        html.innerHTML =`
            <h2> ${item.name} </h2>
            <p> ${item.plu} </p>
            <img  src=" ${item.image} "></img>
            <canvas crossOrigin="Anonymous" id="${item.name}_barcode"></canvas>
            `
        root.appendChild(html);
        html.addEventListener('click', () => {
            html.classList.toggle('active');
        })
        JsBarcode(`#${item.name}_barcode`, item.ean, {
            height: settings['jsbarcode-height'],
            width: settings['jsbarcode-width'],
            displayValue: settings['display-value'],
        });
    }
}
function load_data(){
    let file = document.querySelector("#data_files input").files[0];
    let reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () =>{
        // Split file into array of data entries
        let entries = reader.result.split('\n');
        for (let i = 0; i < entries.length; ++i){
            //Iterate over array and split each into sub-arrays of values
            entries[i] = entries[i].split(settings['csv-separator']);
            // Iterate over sub-array and push to data contents
            console.log(entries[i]);
            let [name, plu, image_url, ean] = entries[i];
            if (name && plu && ean)
                data.push(new Entry( name, plu, image_url, ean));
        }
        data.sort()
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


function file(f){
    let reader = new FileReader();
    reader.readAsText(f);
    reader.onload = () => {
        console.log(reader.result)
    }
}
/*
const data = [
    new Entry('test', '1234', '2092123400000', './images/test.png'),
    new Entry('Citron', '3182', '2092123400000', './images/null.jpg' ),
    new Entry('Apple', '3214', '2092321400000', './images/apple.jpg'),
    new Entry('test', '1234', '2092123400000', './images/test.png'),
    new Entry('Citron', '3182', '2092123400000', './images/citron.jpg' ),
    new Entry('test', '1234', '2092123400000', './images/test.png'),
    new Entry('Citron', '3182', '2092123400000', './images/citron.jpg' ),
    new Entry('test', '1234', '2092123400000', './images/test.png'),
    new Entry('Citron', '3182', '2092123400000', './images/citron.jpg' ),
    new Entry('test', '1234', '2092123400000', './images/test.png'),
    new Entry('Citron', '3182', '2092123400000', './images/citron.jpg' ),
    new Entry('test', '1234', '2092123400000', './images/test.png'),
    new Entry('Citron', '3182', '2092123400000', './images/citron.jpg' ),
    new Entry('test', '1234', '2092123400000', './images/test.png'),
    new Entry('Citron', '3182', '2092123400000', './images/citron.jpg' ),
    new Entry('test', '1234', '2092123400000', './images/test.png'),
    new Entry('Citron', '3182', '2092123400000', './images/citron.jpg' ),
    new Entry('test', '1234', '2092123400000', './images/test.png'),
    new Entry('Citron', '3182', '2092123400000', './images/citron.jpg' ),
    new Entry('test', '1234', '2092123400000', './images/test.png'),
    new Entry('Citron', '3182', '2092123400000', './images/citron.jpg' ),
    new Entry('test', '1234', '2092123400000', './images/test.png'),
    new Entry('Citron', '3182', '2092123400000', './images/citron.jpg' ),
    new Entry('test', '1234', '2092123400000', './images/test.png'),
    new Entry('Citron', '3182', '2092123400000', './images/citron.jpg' ),
    new Entry('test', '1234', '2092123400000', './images/test.png'),
    new Entry('Citron', '3182', '2092123400000', './images/citron.jpg' ),
    new Entry('test', '1234', '2092123400000', './images/test.png'),
    new Entry('Citron', '3182', '2092123400000', './images/citron.jpg' ),
    new Entry('test', '1234', '2092123400000', './images/test.png'),
    new Entry('Citron', '3182', '2092123400000', './images/citron.jpg' ),

]
*/

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
            settings['card-margin']) + 
            settings['card-padding'];
        let component_height_offset = row_offset + settings['card-padding'];
        doc.rect(
            current_left_offset - settings['card-padding'], 
            row_offset,
            settings['card-width'],
            settings['card-height'],
            'S');
        doc.setFontSize(settings['heading-font-size']);
        doc.text(current.querySelector('h2').innerHTML, 
            current_left_offset, 
            component_height_offset,
            {'baseline': 'top'});
        component_height_offset += settings['text-line-height'];
        doc.setFontSize(settings['plu-font-size']);
        doc.text(current.querySelector('p').innerHTML, 
            current_left_offset,
            component_height_offset,
            {'baseline': 'top'});
        component_height_offset += settings['text-line-height'];
        try {
            doc.addImage(current.querySelector('img'),
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
            /*
            doc.addImage(placeholder,
            'JPEG',
            current_left_offset, 
            component_height_offset, 
            settings['image-width'], 
            settings['image-height']);
            */
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



document.addEventListener('DOMContentLoaded', () => {
    let root = document.getElementById('items');
    for (let i = 0; i < data.length; ++i){
        let item = data[i];
        let html = document.createElement('div');
        html.classList.add('item');
        html.innerHTML =`
            <h2> ${item.name} </h2>
            <p> ${item.plu} </p>
            <img  src=" ${item.image} "></img>
            <canvas crossOrigin="Anonymous" id="${item.name}_barcode"></canvas>
            `
        root.appendChild(html);
        html.addEventListener('click', () => {
            html.classList.toggle('active');
        })
        JsBarcode(`#${item.name}_barcode`, item.ean, {
            height: settings['jsbarcode-height'],
            width: settings['jsbarcode-width'],
            displayValue: settings['display-value'],
        });
    }

});


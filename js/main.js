const a4h = 297;
const a4w = 210;
const settings = {
    'page-title': 'Själscanningskoder',
    'jsbarcode-height': 60,
    'jsbarcode-width': 2,
    'barcode-height': 15,
    'barcode-width': 35,
    'image-height': 35,
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
}

settings['card-height'] = 2*settings['card-padding']+settings['barcode-height'] + settings['image-height']+ 2*settings['text-line-height']
class Entry{
    constructor(name, plu, ean, image_url){
        this.name = name;
        this.plu = plu,
        this.ean = ean
        this.image = image_url
    }

}
const data = [
    new Entry('test', '1234', '2092123400000', './images/test.png'),
    new Entry('Citron', '3182', '2092123400000', './images/citron.jpg' ),
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

data.sort((a,b)=>{
    if (a.name > b.name)
        return 1
    else
        return -1});

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

const write_pdf = (name) => {
    let doc = new jsPDF({unit: settings['unit'],
        orientation: settings['orientation']});
    let list_of_active = document.querySelectorAll('.active');
    let row_offset = settings['page-margin'];
    let row_height = settings['card-height'] + settings['card-margin'];
    doc.text(settings['page-title'], settings['page-width']/2 - settings['page-title'].length, row_offset);
    row_offset += settings['page-margin'];
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
        doc.addImage(current.querySelector('img'),
            'JPEG',
            current_left_offset, 
            component_height_offset, 
            settings['image-width'], 
            settings['image-height']);
        component_height_offset += settings['image-height']
        doc.addImage(current.querySelector('canvas'),
            current_left_offset,
            component_height_offset,
            settings['barcode-width'],
            settings['barcode-height']);

    }
    doc.save('output.pdf');
}

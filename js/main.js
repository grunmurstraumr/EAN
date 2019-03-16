const settings = {
    'barcode-height': 60,
    'barcode-width': 2,
    'orientation': 'landscape',
    'page-size': 'a4',
    'display-value': true,

}

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
    new Entry('Citron', '3182', '2092318200000', 'https://d8gl8b5vwf3oc.cloudfront.net/500x500/a/5/a52a5afb294d3d67b7cdbf83e61c8840.jpg' )
]
document.addEventListener('DOMContentLoaded', () => {
    let root = document.getElementById('items');
    for (let i = 0; i < data.length; ++i){
        let item = data[i];
        let html = document.createElement('div');
        html.classList.add('item');
        html.innerHTML =`
            <div class="item">
                <h2> ${item.name} </h2>
                <p> ${item.plu} </p>
                <img src=" ${item.image} "></img>
                <canvas id="${item.name}_barcode"></canvas>
            </div>
            `
        root.appendChild(html);
        html.addEventListener('click', () => {
            html.classList.toggle('active');
        })
        JsBarcode(`#${item.name}_barcode`, item.ean, {
            height: settings['barcode-height'],
            width: settings['barcode-width'],
            displayValue: settings['display-value'],
        });
    }
});

const write_pdf = (name) => {
    let doc = new jsPDF();
    let list_of_active = document.querySelectorAll('.active');
    for (let i = 0; i < list_of_active.length; ++i){
        let current = list_of_active[i];
        console.log(current.querySelector('canvas'));
        doc.addImage(current.querySelector('canvas'), i*20, i*20);

    }
    doc.save('output.pdf');
}

class Entry{
    constructor(name, plu, ean, image_url){
        this.name = name;
        this.plu = plu,
        this.ean = ean
        this.image = image_url
    }

}

export const data = [
    new Entry('test', '1234', '2092123400000', './test.png'),
]
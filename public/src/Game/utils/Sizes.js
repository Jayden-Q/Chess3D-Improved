class Sizes {
    constructor(DOMElement) {
        if (!DOMElement) {
            console.warn('No dom element specified!');
            return;
        }
        
        this.DOMElement = DOMElement;
        this.width = this.DOMElement.offsetWidth;
        this.height = this.DOMElement.offsetHeight;
    }

    Resize() {
        this.width = this.DOMElement.offsetWidth;
        this.height = this.DOMElement.offsetHeight;
    }
}

export default Sizes;
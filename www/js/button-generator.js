


/**
 * @classdesc generates buttons for pages
 * @class
 */
class ButtonGenerator {

    static generateButtons(element, innerHTMLs = [], callbacks = []) {

    }

    static generateButton(callback) {
        let button = $("<button>");
        button.click(callback);
        return button;
    }
}
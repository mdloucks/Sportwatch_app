


/**
 * @classdesc generates buttons for pages
 * @class
 */
class ButtonGenerator {

    static defaultCallbackFunction() {
        console.log("THIS IS A DEFAULT CALLBACK FUNCTION, OVERRIDE ME!!!");
    }

    /**
     * This function will generate a list of buttons and append it to the given element
     * 
     * @param {String} element the element to generate the buttons on
     * @param {String} cssClass this is the css class to put on the buttons
     * @param {Array} innerHTMLs the html content of the buttons
     * @param {function} callback function to call on button press
     */
    static generateButtons(element, cssClass = "", innerHTMLs = [], callback = ButtonGenerator.defaultCallbackFunction) {
        for (let i = 0; i < innerHTMLs.length; i++) {

            let button = ButtonGenerator.generateButton(innerHTMLs[i], cssClass, callback);
            $(element).append(button);
        }
    }

    /**
     * This function will create and return a new button element to use to append
     * to an element of your choice. https://api.jquery.com/Types/#Element
     * 
     * @param {Array} innerHTML the html content of the buttons
     * @param {String} cssClass this is the css class to put on the buttons
     * @param {function} callback function to call on button press
     * 
     * @return JQuery Element 
     */
    static generateButton(innerHTML, cssClass = "", callback = ButtonGenerator.defaultCallbackFunction) {
        let button = $("<button>", {
            html: innerHTML,
            "class": cssClass
        });
        button.bind("touchend", callback.bind(this, innerHTML));
        return button;
    }
}



/**
 * @classdesc generates buttons for pages
 * @class
 */
class ButtonGenerator {

    static defaultCallbackFunction() {
        console.log("THIS IS A DEFAULT CALLBACK FUNCTION, OVERRIDE ME!!!");
    }

    static generateButtons(element, cssClass = "", innerHTMLs = [], callback = ButtonGenerator.defaultCallbackFunction) {
        for (let i = 0; i < innerHTMLs.length; i++) {

            let button = ButtonGenerator.generateButton(innerHTMLs[i], cssClass, callback);
            $(element).append(button);
        }
    }

    static generateButton(innerHTML, cssClass = "", callback = ButtonGenerator.defaultCallbackFunction) {
        let button = $("<button>", {
            html: innerHTML,
            "class": cssClass
        });
        button.bind("touchend", callback.bind(this, innerHTML));
        return button;
    }
}
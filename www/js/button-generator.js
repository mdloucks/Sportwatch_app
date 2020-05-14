


/**
 * @classdesc generates buttons for pages
 * @class
 */
class ButtonGenerator {

    static defaultCallbackFunction() {
        console.log("!!!THIS IS A DEFAULT CALLBACK FUNCTION, OVERRIDE ME!!!");
    }

    /**
     * @description This function will append a list of buttons to the given html element. These buttons will have every database row value as the innerHTML.
     * When referenced later, the elements will retain the values as its attributes, for instance $(".button_box").attr("fname");
     * The function will also have the attributes object passed into it as its first parameter which you can use to reference the values.
     * 
     * @example generateButtonsFrom Database("#app", athletes, function(athlete) {
     *     console.log(athlete.fname); // ------> "James"
     * })
     * 
     * !Important! if you wish to give each button a unique id, select rowid in the database
     * 
     * @param {String} element the element to generate the buttons on
     * @param {Object} databaseResults The results returned from the database from tx.flex-lg-row-reverse
     * @param {function} callback the function to be called when clicked
     */
    static generateButtonsFromDatabase(element, databaseResults = [], callback = ButtonGenerator.defaultCallbackFunction) {

        if (databaseResults === undefined || databaseResults === null) {
            throw new Error("Database results are undefined or null");
        } else if (databaseResults.length == 0) {
            console.log("No database entries to display for generateButtonsFromDatabase");
            return;
        }

        let keys = Object.keys(databaseResults.item(0));

        for (let i = 0; i < databaseResults.length; i++) {

            let attributes = {};
            let innerHTML = "";

            attributes.class = "generated_button";

            keys.forEach(key => {

                if (key === "rowid") {
                    attributes.id = `generated_button_${databaseResults.item(i)[key]}`;
                } else {
                    attributes[key] = databaseResults.item(i)[key];
                    innerHTML += ` ${attributes[key]}`;
                }
            });

            attributes.html = innerHTML;
            console.log(innerHTML);

            let button = ButtonGenerator.generateButton(attributes, callback);
            $(element).append(button);
        }
    }

    /**
     * This function will generate a list of buttons and append it to the given element
     * 
     * @example generateButton(#app, {innerHTML: ["This is the innerHTML of the button!, id: "#stopwatch_button""}, ...], function() {})
     * 
     * @param {String} element the element to generate the buttons on
     * @param {Object} attributes A js object containing all of the attributes for the element
     * @param {function} callback function to call on button press
     */
    static generateButtons(element, attributes = [], callback = ButtonGenerator.defaultCallbackFunction) {
        for (let i = 0; i < attributes.length; i++) {

            let button = ButtonGenerator.generateButton(attributes[i], callback);
            $(element).append(button);
        }
    }

    /**
     * This function will create and return a new button element to use to append
     * to an element of your choice. https://api.jquery.com/Types/#Element
     * 
     * @example generateButton({innerHTML: "This is the innerHTML of the button!, id: "#stopwatch_button""})
     * 
     * @param {Object} attributes A js object containing all of the attributes for the element
     * @param {function} callback function to call on button press, the attributes of the html tag will be passed through
     * 
     * @return JQuery Element 
     */
    static generateButton(attributes, callback = ButtonGenerator.defaultCallbackFunction) {
        let button = $("<button>", attributes);
        console.log("button " + JSON.stringify(attributes));
        button.bind("touchend", callback.bind(this, attributes));
        return button;
    }
}
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
     * }, "gender": {
            "m": { style: "background-color: lightblue" },
            "f": { style: "background-color: lightpink" }
        })
     * 
     * !Important! if you wish to give each button a unique id, select rowid in the database
     * 
     * @param {String} element the element to generate the buttons on
     * @param {Object} databaseResults The results returned from the database from tx.flex-lg-row-reverse
     * @param {function} callback the function to be called when clicked
     * @param {Object} conditionalAttributes an object to set the button attributes based on condition
     * @param {string} sortBy the property in the object to sort by, note: MUST USE WHEN PASSING IN ARRAY
     */
    static generateButtonsFromDatabase(element, databaseResults = [], callback = ButtonGenerator.defaultCallbackFunction,
        blackList = [], conditionalAttributes = undefined, sortBy = "") {

        if (databaseResults === undefined || databaseResults === null) {
            throw new Error("Database results are undefined or null");
        } else if (databaseResults.length == 0) {
            console.log("No database entries to display for generateButtonsFromDatabase");
            return;
        }

        let keys;
        let attributes;
        let innerHTML;
        let elements = [];

        for (let i = 0; i < databaseResults.length; i++) {

            let result;

            if(Array.isArray(databaseResults)) {
                result = databaseResults[i];
                keys = Object.keys(databaseResults[0]);
            } else {
                result = databaseResults.item(i);
                keys = Object.keys(databaseResults.item(0));
            }


            attributes = {};
            innerHTML = "";

            attributes.class = "generated_button";

            keys.forEach(key => {
                // set attributes
                if (key === "rowid") {
                    attributes.id = `generated_button_${result[key]}`;
                    attributes.rowid = result[key];
                    // exclude adding to innerHTML if it's on the blacklist
                } else if (blackList.includes(key)) {
                    attributes[key] = result[key];
                } else {
                    attributes[key] = result[key];
                    innerHTML += ` ${attributes[key]}`;
                }

                // update the existing attributes of the button based on the conditionalAttributes
                if (conditionalAttributes != undefined && conditionalAttributes[key] !== undefined) {
                    let value = result[key];

                    Object.keys(conditionalAttributes[key]).forEach(conditionalAttributeKey => {
                        if (value == conditionalAttributeKey) {
                            attributes = Object.assign({}, attributes, conditionalAttributes[key][conditionalAttributeKey]);
                        }
                    });
                }
            });

            attributes.html = innerHTML;

            
            elements.push(attributes);

            // add padding to the bottom so it doesn't undercut navbar
            if(i == databaseResults.length - 1) {
                $(element).append($("<br>"));
                $(element).append($("<br>"));
                $(element).append($("<br>"));
            }
        }
        
        elements.sort((a, b) => (a[sortBy] > b[sortBy]) ? 1 : ((b[sortBy] > a[sortBy]) ? -1 : 0));

        for (let i = 0; i < elements.length; i++) {
            let button = ButtonGenerator.generateButton(elements[i], callback);
            $(element).append(button);
        }
    }

    /**
     * This function will generate a list of buttons and append it to the given element
     * 
     * @example generateButton("#app", [{"html": "This is the HTML of the button!", "id": "#stopwatch_button", ...}, ...], function() {})
     * 
     * @param {String} element the element to generate the buttons on
     * @param {Array} attributes A js array containing all of the attribute objects for the element
     * @param {function} callback function to call on button press
     */
    static generateButtons(element, attributes = [], callback = ButtonGenerator.defaultCallbackFunction) {
        for (let i = 0; i < attributes.length; i++) {

            let button = ButtonGenerator.generateButton(attributes[i], callback);
            $(element).append(button);
        }
    }

    /**
     * @description generate a toggle on/off switch and append it to the given element
     * the check callback will be called when the button is turned on, and the uncheck
     * callback will be called when it is turned off.
     * @param {String} element element identifier to append to 
     * @param {String} prompt the prompt to display
     * @param {function} checkCallback function to be called on check
     * @param {function} uncheckCallback function to be called on uncheck
     */
    static generateToggle(element, prompt, defaultState, checkCallback, uncheckCallback) {
        
        let container = $("<div>", {class: "switch_container"});
        let text = $("<div>", {html: prompt, class: "switch_text"});
        let label = $("<label>", {class: "switch noSelect", style: "float: right;"});
        let input = $("<input>", {type: "checkbox", checked: defaultState});
        let span = $("<span>", {class: "slider round noSelect"});

        input.on("click", function(e) {
            let isChecked = $(this).is(":checked");
            // Simulate a toggle / click
            $(this).find("input").prop("checked", !isChecked); // Invert current status
            
            // Handle callbacks
            if(isChecked) {
                checkCallback.call(this);
            } else {
                uncheckCallback.call(this);
            }
        });

        label.append(input);
        label.append(span);
        container.append(text);
        container.append(label);

        $(element).append(container);
    }

    /**
     * This function will generate a select form with a given prompt and set of values
     * @param {String} element identifier of the element to append to
     * @param {String} prompt the prompt to give for selection
     * @param {Object} values string:value object containing text to show and its corresponding select value
     * @param {function} callback the function to call on submit
     */
    static generateSelectForm(element, prompt, submitText, values, callback) {

        // create form elements
        let form = $("<form>");
        let select = $("<select>", {class: "generic_select"});
        let lineBreak = $("<br>");

        let label = $("<form>", {
            html: prompt,
            class: "subheading_text"
        });
        let submit = $("<button>", {
            html: submitText,
            type: "submit",
            class: "generated_button"
        });

        $(form).submit(function(e) {
            e.preventDefault();
            callback(select);
        });

        let keys = Object.keys(values);

        keys.forEach(key => {
            let option = $("<option>", {text: key, html: key, value: values[key]});
            select.append(option);
        });

        // append elements to form
        form.append(label);
        form.append(select);
        form.append(lineBreak)
        form.append(lineBreak)
        form.append(submit);

        $(element).append(form);
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
        button.click(callback.bind(this, attributes));
        return button;
    }
}
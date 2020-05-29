

/**
 * @class
 * @classdesc This class will change the page to something that allows the user to edit certain values
 */
class ValueEditor {

    static defaultCallbackFunction() {
        console.log("!!!THIS IS A DEFAULT CALLBACK FUNCTION, OVERRIDE ME!!!");
    }

    /**
     * @description This method will append a list of input fields to the given element and will 
     * return the new values for each one when the user hits the button to the 
     * given callback function
     * 
     * @example editValues("#app", {"fname": "John", "lname"...}, ["class", "html"], {"fname": "First Name"}, function(newValues) {
     *     console.log(JSON.stringify(newValues)); // --> {"fname": "<NEW FIRST NAME>", "lname"...}
     * })
     * 
     * !IMPORTANT The generated button is of class generated_button
     * 
     * @param {String} the element to append to
     * @param {Object} valueDict a map or dictionary to route all of the different values
     * @param {Array} blackList an array of attributes to skip to adding to the edit list
     * @param {Object} rename an object to rename the given fields in key pair notation
     * @param {*} callback the function to be called when the user is done
     */
    static editValues(element, valueMap, blackList = [], rename = {}, callback = ValueEditor.defaultCallbackFunction) {

        let inputs = [];

        Object.keys(valueMap).forEach(function (key) {

            // skip items in blacklist
            if (blackList.includes(key)) {
                return;
            }

            let valueName

            if (Object.keys(rename).includes(key)) {
                valueName = $("<p>", {
                    "html": rename[key],
                });
            } else {
                valueName = $("<p>", {
                    "html": key,
                });
            }

            let input = $("<input>", {
                "value": valueMap[key],
                "name": key
            });

            inputs.push(input);

            $(element).append(valueName);
            $(element).append(input);
            $(element).append("<br>");
        });

        let button = $("<button>", { html: "Change!", class: "generated_button" });
        button.bind("touchend", ValueEditor.extractValues.bind(this, inputs, callback));

        $(element).append(button);
    }

    /**
     * Loop through the given input, extract the values from each one 
     * and then call and pass them to the given callback
     * 
     * @param {Array} valueMap the list of inputs to draw from
     * @param {function} callback the callback to be called when ready
     */
    static extractValues(inputs, callback) {

        let newValues = {};

        inputs.forEach(element => {
            newValues[element.attr("name")] = element.val();
        });

        callback(newValues);
    }
}
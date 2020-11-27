

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
     * @param {*} callback the function to be called when the user is done
     * @param {Array} blackList an array of attributes to skip to adding to the edit list
     * @param {Object} rename an object to rename the given fields in key pair notation
     */
    static editValues(element, valueMap, callback = ValueEditor.defaultCallbackFunction, blackList = [], rename = {}) {

        let inputs = [];

        Object.keys(valueMap).forEach(function (key) {

            // skip items in blacklist
            if (blackList.includes(key)) {
                return;
            }

            let valueName;

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
        button.bind("click", ValueEditor.extractValues.bind(this, inputs, callback));

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
    
    /**
     * Creates a dropdown and appends it to the specified element. It will
     * add all of the options as defined in the name and value array. If the
     * length doesn't match for these two arrays, it will log a warning to console but still
     * continue.
     * 
     * @example createDropdown("#app #signupGender", "gender", ["Male", "Female"], ["male", "female"]);
     *          --> Creates a generic Sportwatch dropdown with gender options
     * 
     * @param {String} appendToElement jQuery selection string of the element to append to
     * @param {String} dropdownId element ID and name of this select input
     * @param {Array} optionNames array of Strings that will serve as the name for each option
     * @param {Array} optionValues array of Strings that define the value for each option, corresponding to optionNames
     * @param {String} selectedValue value of the option to select by default (default = "" / 1st option given)
     * @param {String} dropdownClasses the class / classes to add to the dropdown (default = "sw_dropdown")
     */
    static createDropdown(appendToElement, dropdownId, optionNames, optionValues, selectedValue = "", dropdownClasses = "sw_dropdown") {
        
        let htmlContent = `<select id="${dropdownId}" class="${dropdownClasses}" name="${dropdownId}">`;
        
        // Do a quick check
        if(optionNames.length != optionValues.length) {
            if(DO_LOG) {
                console.log("[value-editor.js:createDropdown()]: Name and value array lengths don't match for dropdown!");
            }
        }
        
        // Add all of the options
        for(let o = 0; o < optionNames.length; o++) {
            htmlContent = htmlContent + `<option value="${optionValues[o]}"`;
            if(optionValues[o] == selectedValue) { // Select value specified
                htmlContent = htmlContent + ` selected`;
            }
            htmlContent = htmlContent + `>${optionNames[o]}</option>`;
        }
        
        // Finalize and append
        htmlContent = htmlContent + `</select>`;
        $(appendToElement).append(htmlContent);
    }
    
}
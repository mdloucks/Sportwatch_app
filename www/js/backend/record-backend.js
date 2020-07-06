// List of record definition ID's since enums don't exist in vanilla JS
const DEFINITIONS = {
    "75m": 1,
    "100m": 2,
    "200m": 3,
    "400m": 4,
    "800m": 5,
    "1500m": 6,
    "100m_hurdle": 7,
    "110m_hurdle": 8,
    "400m_hurdle": 9,
    "4x100m_relay": 10,
    "4x400m_relay": 11,
    "long_jump": 12,
    "triple_jump": 13,
    "high_jump": 14,
    "pole_vault": 15,
    "discus": 16,
    "javelin": 17,
    "hammer": 18,
    "shot_put": 19,
    "other_second": 20, // Next 5 are for miscellaneous "events"
    "other_minute": 21,
    "other_meter": 22,
    "other_foot": 23,
    "other_yard": 24
}

/**
 * @classdesc Used to interface and make calls to the backend for records / times
 * @class
 */
class RecordBackend {
    // Docs: https://www.sportwatch.us/mobile/docs#recordAction
    
    /**
     * Saves a given record with the information provided. value and a
     * definitionId are required, but all other values are either assumed
     * (like email, which defaults to the logged in user) or handled on the
     * backend. The callback should take a parameter to handle the response
     * JSON (or string in case of error). This can also be used to add relays
     * by passing in array of float values to the second parameter.
     * 
     * @example saveRecord((response) => { // Handle response }, 14.722, DEFINITIONS["100m"], "example@email.com", {"isPractice": true})
     *          saveRecord((response) => { // Handle response }, [2.000, 4.1, 5.5], DEFINITIONS["4x100m_relay"], "", {"isSplit": true})
     * 
     * @param {Function} cb callback to handle response, success or fail
     * @param {Float | Array} value float value, up to 3 decimals precision. Use array of floats for relays
     * @param {Integer} definitionId value from DEFINITIONS enum linking value with record type
     * @param {String} email [default = ""] if blank, will use logged in user. Ties user to the record
     * @param {AssociativeArray} details defines properties of record:
     *                                      isPractice {Boolean} - is the record a practice?
     *                                      isSplit {Boolean} - are the values a relay?
     *                                      id_event {Integer} - links record to an official meet
     */
    static saveRecord(cb, value, definitionId, email = "", details = { }) {
        
        // Do some basic checks
        let storage = window.localStorage;
        let userEmail = email;
        if(userEmail.length == 0) {
            userEmail = storage.getItem("email");
        }
        if(value < 0) {
            console.log("[record-backend.js:saveRecord()] value cannot be negative");
            return false;
        }
        if(Object.values(DEFINITIONS).indexOf(definitionId) == -1) {
            console.log("[record-backend.js:saveRecord()]: Invalid definitionId given");
            return false;
        }
        
        // Add them to the details array
        details.accountIdentity = {"email": userEmail};
        details.value = value;
        details.definition = definitionId;
        
        // Submit the request and call the callback
        $.ajax({
            type: "POST",
            url: Constant.URL.record_action + "?intent=0",
            timeout: Constant.AJAX_CFG.timeout,
            data: details,
            success: (response) => {
                console.log("[record-backend.js:saveRecord()] " + response);
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                cb(response);
            },
            error: (error) => {
                console.log("[record-backend.js:saveRecord()] " + error);
                cb(response);
            }
        });
        
    }
    
    /**
     * Grabs all of the records (up to 100 at a time) matching the given
     * criteria. Internally, a database command is run as "SELECT * FROM record WHERE ...<criteria>"
     * Values for criteria is as follows:
     *      accountIdentity {AssociativeArray} - collection of values to identify a user
     *      id_record {Integer} - id of the desired record (trumps other criteria)
     *      value {Float} - value to search for based on valueOperator param
     *      valueOperator {String} - required if value is given; can be "=", ">", or "<"
     *      definition {Integer} - definition to search for (i.e. 3 for all 200m records)
     *      isPractice {Boolean} - selects records that are practices
     *      isSplit {Boolean} - select relay / split records
     *      splitNumber {Integer} - selects splitNumber records (starts at 1)
     *      splitIndex {Integer} - selects the subset of a splitNumber (starts at 0)
     *      id_event {Integer} - selects records tied to the event ID
     * 
     * @example getRecord((response) => { // Process record }, {"id_record": 12})
     *          getRecord((response) => { // Process records }, {"accountIdentity": {"email": "example@email.com"}})
     * 
     * @param {Function} callback callback to handle the response (JSON or String on failure)
     * @param {AssociativeArray} criteria values used to search for and return results
     */
    static getRecord(callback, criteria) {
        // Submit the request and call the callback
        $.ajax({
            type: "POST",
            url: Constant.URL.record_action + "?intent=1",
            timeout: Constant.AJAX_CFG.timeout,
            data: criteria,
            success: (response) => {
                console.log("[record-backend.js:getRecord()] " + response);
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                callback(response);
            },
            error: (error) => {
                console.log("[record-backend.js:getRecord()] " + error);
                callback(response);
            }
        });
    }
    
    /**
     * Used to recall values from local storage and will check to make sure
     * they aren't null or empty. It will also perform a basic sanitize on
     * strings. It returns an associaitve array of the keys and values
     * 
     * @example accountData = getLocalValues(["fname", "lname", "email"]); --> ("fname" => "scott"...)
     * 
     * @param {Array} valueKeys array of string keys for values to fetch
     * @returns
     * Associative Array of the requests keys (if they weren't null) and the value
     */
    static getLocalValues(valueKeys) {
        
        // Associative array (aka object) with key: value (if exists)
        let returnArray = {}; // Not using an object fails
        let storage = window.localStorage;
        
        for(let k = 0; k < valueKeys.length; k++) {
            let key = valueKeys[k];
            
            if((storage.getItem(key) != undefined) && (storage.getItem(key) != null)) {
                let value = storage.getItem(key);
                if((typeof value == "string") && (value.length > 0)) {
                    // Filter with a generic regex (replace most special characters)
                    returnArray[key] = value.replace(/[^A-Za-z0-9@\-_\. ]/gm, "");
                    
                } else {
                    returnArray[key] = value; // Not much filtering to be done
                }
            }
        };
        
        return returnArray;
    }
    
    /**
     * Returns easy-to-read, human-readable values for certain fields. It will also
     * remove server variables (status, substatus, msg) and handle null values.
     * Should be run before showing data to a user, unless it's an error
     * 
     * @example accountInfo = BackendAgent.beautifyResponse({"status": 6, "fname": "Seth", "cellNum": "9896426863"});
     *              --> Returns {"fname": "Seth", "cellNum": "(989) 642-6863"}
     * 
     * @param {AssociativeArray} payload response directly from the server
     * @returns
     * Associative Array / Object of beautified values
     */
    static beautifyResponse(payload) {

        delete payload["status"];
        delete payload["substatus"];
        delete payload["msg"];

        // -- ACCOUNT RESPONSE -- //
        // Name
        if ("fname" in payload) {
            if ((payload["fname"] == null) || (payload["fname"] == undefined)) {
                payload["fname"] = "";
            }
        }
        if ("lname" in payload) {
            if ((payload["lname"] == null) || (payload["lname"] == undefined)) {
                payload["lname"] = "";
            }
        }
        // Gender
        if ("gender" in payload) {
            if ((payload["gender"] == null) || (payload["gender"] == undefined)) {
                payload["gender"] = "";
            } else {
                if (payload["gender"] == "M") {
                    payload["gender"] = "Male";
                } else if (payload["gender"] == "F") {
                    payload["gender"] = "Female";
                } else {
                    payload["gender"] = "Other";
                }
            }
        }
        if ("state" in payload) {
            if ((payload["state"] == null) || (payload["state"] == undefined)) {
                payload["state"] = "";
            } else {
                // TODO: Select state from dropdown menu
            }
        }
        // Date of Birth
        if ("dob" in payload) {
            if ((payload["dob"] == null) || (payload["dob"] == undefined)) {
                payload["dob"] = "";
            } else {
                let year = payload["dob"].substr(0, 4);
                let month = payload["dob"].substr(5, 2);
                let day = payload["dob"].substr(8, 2);
                payload["dob"] = month + "/" + day + "/" + year;
                // TODO: Change this to a fancy, printed version (i.e. September, 27th, 2005)
            }
        }
        // Phone number
        if ("cellNum" in payload) {
            if ((payload["cellNum"] == null) || (payload["cellNum"] == undefined)) {
                payload["cellNum"] = "";
            } else {
                let number = payload["cellNum"];
                if (number.length == 11) { // Full 10-digit with area code and country prefix
                    let prefix = "+" + number.substr(0, 1) + " (" + number.substr(1, 3) + ") ";
                    payload["cellNum"] = prefix + number.substr(4, 3) + "-" + number.substr(7, 4);
                } else if (number.length == 10) { // Full 10-digit with area code
                    payload["cellNum"] = "(" + number.substr(0, 3) + ") " + number.substr(3, 3) + "-" + number.substr(6, 4);
                } else if (number.length == 7) { // No area code
                    payload["cellNum"] = number.substr(0, 3) + "-" + number.substr(4, 4);
                } // Else leave the number as is
            }
        }

        return payload;
    }
    
    /**
     * Will cleanse and attempt to sanitize the post array values. If a value
     * is undefined, it will be deleted from the array.
     * If a value isn't valid (i.e. too short, etc.), it will return false, unless
     * removeInvalid is set to true; then it will simply be removed from the array
     * 
     * @example postArray = BackendAgent.sanitizePostRequest({"fname": "Samantha", "gender": 46}, true);
     *                      --> Will return {"fname": "Samantha"} (having removed invalid "gender")
     * 
     * @param {AssociativeArray} postArray the data being sent to the server
     * @param {Boolean} removeInvalid [default = true] should invalid values be deleted, or
     *                                 should this function just return false upon invalid?
     * 
     * @returns
     * A cleaned postArray. False, if an invalid variable was found and removeInvalid was set to false
     */
    static sanitizePostRequest(postArray, removeInvalid = true) {
        
        // -- ACCOUNT -- //
        // Name
        if("fname" in postArray) {
            let cleanedInput = this.getValidInput(postArray["fname"], /[^A-Za-z. ]/gm, 0, 60);
            if(cleanedInput !== false) {
                postArray["fname"] = cleanedInput;
            } else {
                if(removeInvalid) {
                    delete postArray["fname"];
                } else {
                    return false;
                }
            }
        }
        if("lname" in postArray) {
            let cleanedInput = this.getValidInput(postArray["lname"], /[^A-Za-z. ]/gm, 0, 60);
            if(cleanedInput !== false) {
                postArray["lname"] = cleanedInput;
            } else {
                if(removeInvalid) {
                    delete postArray["lname"];
                } else {
                    return false;
                }
            }
        }
        // Gender
        if("gender" in postArray) {
            let cleanedInput = this.getValidInput(postArray["gender"], /[^A-Za-z]/gm, 0, 15);
            if(cleanedInput !== false) {
                cleanedInput = cleanedInput.toLowerCase();
                if((cleanedInput == "male") || (cleanedInput == "m")) {
                    postArray["gender"] = "M";
                } else if((cleanedInput == "female") || (cleanedInput == "f")) {
                    postArray["gender"] = "F";
                } else {
                    postArray["gender"] = "O";
                }
            } else {
                if(removeInvalid) {
                    delete postArray["gender"];
                } else {
                    return false;
                }
            }
        }
        // State
        if("state" in postArray) {
            let cleanedInput = this.getValidInput(postArray["state"], /[^A-Za-z]/gm, 0, 2);
            if(cleanedInput !== false) {
                postArray["state"] = cleanedInput.toUpperCase();
            } else {
                if(removeInvalid) {
                    delete postArray["state"];
                } else {
                    return false;
                }
            }
        }
        // Email
        if("email" in postArray) {
            let cleanedInput = this.getValidInput(postArray["email"], /[^A-Za-z0-9.@\-_]/gm, 5, 128);
            if(cleanedInput !== false) {
                postArray["email"] = cleanedInput;
            } else {
                if(removeInvalid) {
                    delete postArray["email"];
                } else {
                    return false;
                }
            }
        }
        // Password
        if("password" in postArray) {
            let cleanedInput = this.getValidInput(postArray["password"], /[ ;\"\'\/]/gm, 7, 128);
            if(cleanedInput !== false) {
                postArray["password"] = cleanedInput;
            } else {
                if(removeInvalid) {
                    delete postArray["password"];
                } else {
                    return false;
                }
            }
        }
        // Account Type
        if("accountType" in postArray) {
            let cleanedInput = this.getValidInput(postArray["accountType"], /[^A-Za-z]/gm, 3, 30);
            if(cleanedInput !== false) {
                cleanedInput = cleanedInput.toLowerCase();
                if(cleanedInput == "coach") {
                    postArray["accountType"] = "Coach";
                } else {
                    postArray["accountType"] = "Athlete";
                }
            } else {
                if(removeInvalid) {
                    delete postArray["accountType"];
                } else {
                    return false;
                }
            }
        }
        // Date of Birth (should be formatted: mm/dd/year)
        if("dob" in postArray) {
            let cleanedInput = this.getValidInput(postArray["dob"], /[^0-9]/gm, 5, 10);
            if(cleanedInput !== false) {
                let month = cleanedInput.substr(0, 2);
                let day = cleanedInput.substr(2, 2);
                let year = cleanedInput.substr(4, 4);
                postArray["dob"] = year + "-" + month + "-" + day;
            } else {
                if(removeInvalid) {
                    delete postArray["dob"];
                } else {
                    return false;
                }
            }
        }
        // Phone Number
        if ("cellNum" in postArray) {
            let cleanedInput = this.getValidInput(postArray["cellNum"], /[^0-9]/gm, 5, 11);
            if (cleanedInput !== false) {
                postArray["cellNum"] = cleanedInput;
            } else {
                if (removeInvalid) {
                    delete postArray["cellNum"];
                } else {
                    return false;
                }
            }
        }
        
        return postArray;
    }
    
    /**
     * Validates a user input before sending to the server (or storing internally).
     * It will return the cleaned value if the sanitized input is within the length bounds (assuming
     * it's a string). False otherwise.
     * NOTE: Should only be used for strings (hard / meaningless to filter booleans, etc.)
     * 
     * @example firstName = getValidInput(response["fname"], /[^A-Za-z]/, 0, 60);
     *          --> Returns first name, removing everything that isn't a letter  (A-Za-z)
     * 
     * @param {String} input user input being sent to the server
     * @param {String|Regex} replaceChars search to remove from the input
     * @param {Integer} minLength minimum length for valid input (exclusive)
     * @param {Integer} maxLength maximum length for the input (inclusive)
     */
    static getValidInput(input, replaceChars, minLength, maxLength) {
        if ((input == null) || (input == undefined)) {
            return false;
        } else {
            input = input.replace(replaceChars, ""); // Remove based on given filter
            if ((input.length > minLength) && (input.length <= maxLength)) {
                return input;
            }
        }
        return false;
    }
    
}
// List of record definition ID's since enums don't exist in vanilla JS
const DEFINITIONS = {
    "75m": 1,
    "100m": 2,
    "200m": 3,
    "400m": 4,
    "800m": 5,
    "1500m": 6,
    "100m hurdle": 7,
    "110m hurdle": 8,
    "400m hurdle": 9,
    "4x100m relay": 10,
    "4x400m relay": 11,
    "long_jump": 12,
    "triple jump": 13,
    "high jump": 14,
    "pole vault": 15,
    "discus": 16,
    "javelin": 17,
    "hammer": 18,
    "shot put": 19,
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
            if(DO_LOG) {
                console.log("[record-backend.js:saveRecord()] value cannot be negative");
            }
            return false;
        }
        if(Object.values(DEFINITIONS).indexOf(definitionId) == -1) {
            if(DO_LOG) {
                console.log("[record-backend.js:saveRecord()]: Invalid definitionId given");
            }
            return false;
        }
        
        // Add them to the details array
        details.SID = storage.getItem("SID");
        details.accountIdentity = {"email": userEmail};
        details.value = value;
        details.definition = definitionId;
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.URL.record_action + "?intent=0",
            timeout: Constant.AJAX_CFG.timeout,
            data: details,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[record-backend.js:saveRecord()] " + response);
                }
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                cb(response);
            },
            error: (error) => {
                if(DO_LOG) {
                    console.log("[record-backend.js:saveRecord()] " + error);
                }
                cb(error);
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
     * @example getRecord({"id_record": 12}, (response) => { // Process record })
     *          getRecord({"accountIdentity": {"email": "example@email.com"}}, (response) => { // Process records })
     * 
     * @param {AssociativeArray} criteria values used to search for and return results
     * @param {Function} callback callback to handle the response (JSON or String on failure)
     */
    static getRecord(criteria, callback) {
        // Add the SID to criteria
        criteria.SID = localStorage.getItem("SID");
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.URL.record_action + "?intent=1",
            timeout: Constant.AJAX_CFG.timeout,
            data: criteria,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[record-backend.js:getRecord()] " + response);
                }
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                callback(response);
            },
            error: (error) => {
                if(DO_LOG) {
                    console.log("[record-backend.js:getRecord()] " + error);
                }
                callback(error);
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
// List of record definition ID's since enums don't exist in vanilla JS
const DEFINITIONS = {
    "60m": 1,
    "75m": 2,
    "100m": 3,
    "200m": 4,
    "400m": 5,
    "800m": 6,
    "1500m": 7,
    "1600m": 8,
    "60m hurdle": 9,
    "100m hurdle": 10,
    "110m hurdle": 11,
    "300m hurdle": 12,
    "400m hurdle": 13,
    "4x100m relay": 14,
    "4x400m relay": 15,
    "4x800m relay": 16,
    "3k": 17,
    "5k": 18,
    "6k": 19,
    "8k": 20,
    "10k": 21,
    "20k": 22,
    "half marathon": 23,
    "marathon": 24,
    "300m steeplechase": 25,
    "20km race walk": 26,
    "50km race walk": 27,
    "long jump": 28,
    "triple jump": 29,
    "high jump": 30,
    "pole vault": 31,
    "discus": 32,
    "javelin": 33,
    "hammer": 34,
    "shot put": 35,
    "pentathlon": 36,
    "heptathlon": 37,
    "decathlon": 38,
    "other": 39,
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
     * @param {String | Integer} emailOrId [default = ""] if blank, will use logged in user. Ties user to the record
     * @param {AssociativeArray} details defines properties of record:
     *                                      isPractice {Boolean} - is the record a practice?
     *                                      isSplit {Boolean} - are the values a relay?
     *                                      id_event {Integer} - links record to an official meet
     */
    static saveRecord(value, definitionId, emailOrId, cb, details = {}) {

        // Do some basic checks
        let storage = window.localStorage;
        let identityKey = "email"; // "email" if emailOrId is a string, "id_user" if it's a number

        if (typeof emailOrId == "number") {
            identityKey = "id_user";
        } else { // Assume it was an email
            if (emailOrId.length == 0) {
                emailOrId = storage.getItem("email");
            }
        }
        if (value < 0) {
            if (DO_LOG) {
                console.log("[record-backend.js:saveRecord()] Value cannot be negative");
            }
            return false;
        }
        if (Object.values(DEFINITIONS).indexOf(definitionId) == -1) {
            if (DO_LOG) {
                console.log("[record-backend.js:saveRecord()]: Invalid definitionId given");
            }
            return false;
        }

        // Add them to the details array
        details.SID = storage.getItem("SID");
        details.accountIdentity = {};
        details.accountIdentity[identityKey] = emailOrId;
        details.value = value;
        details.definition = definitionId;

        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getRecordURL() + "?intent=0",
            timeout: Constant.AJAX_CFG.timeout,
            data: details,
            success: (response) => {
                if (DO_LOG) {
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
                if (DO_LOG) {
                    console.log("[record-backend.js:saveRecord()] " + error);
                }
                cb(error);
            }
        });

    }
    
    /**
     * Adds a split to the given record. The only required parameters are
     * parentRecordId and value. The other parameters can be ommitted and will be computed
     * automatically on the backend. An existing record must exist to add a split.
     * 
     * @example addSplit(4, 17.034, "", -1, -1, (r) => { // Check r.status });
     *          --> Adds split to record #4 named "Split" (default) and index computed automatically
     * @example addSplit(4, 17.034, "100m", 37, 1, (r) => { // Check r.status });
     *          --> Adds split to record #4 named "100m", attached to user #37 with index 1
     * 
     * @param {Integer} parentRecordId backend ID of the record this split belongs to
     * @param {Float} value timestamp of this split
     * @param {String} splitName [default = ""] name for this split; if empty, backend will name is "Split"
     * @param {Integer | String} emailOrId [default = -1] the user email or ID for this split; will default
     * to the id user of the record it's being attached to if left as -1
     * @param {Integer} splitIndex [default = -1] index of the split; if left, it will be computed on the backend
     * @param {Function} cb callback to handle the response from the server
     */
    static addSplit(parentRecordId, value, splitName = "", emailOrId = -1, splitIndex = -1, cb = function() { }) {

        // Do some basic checks
        let storage = window.localStorage;
        let identityKey = "email"; // "email" if emailOrId is a string, "id_user" if it's a number
        
        if(emailOrId != -1) {
            if (typeof emailOrId == "number") {
                identityKey = "id_user";
            } else { // Assume it was an email
                if (emailOrId.length == 0) {
                    emailOrId = storage.getItem("email");
                }
            }
        }
        if (value < 0) {
            if (DO_LOG) {
                console.log("[record-backend.js:addSplit()] Value cannot be negative");
            }
            return false;
        }

        // Add to the post array
        let postArray = {};
        postArray.SID = storage.getItem("SID");
        postArray.id_record = parentRecordId;
        postArray.value = value;
        if(splitName.length > 0) {
            postArray.splitName = splitName;
        }
        if(emailOrId != -1) {
            postArray.accountIdentity = {};
            postArray.accountIdentity[identityKey] = emailOrId;
        }
        if(splitIndex != -1) {
            postArray.splitIndex = splitIndex;
        }
        

        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getRecordURL() + "?intent=1",
            timeout: Constant.AJAX_CFG.timeout,
            data: postArray,
            success: (response) => {
                if (DO_LOG) {
                    console.log("[record-backend.js:addSplit()] " + response);
                }
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                cb(response);
            },
            error: (error) => {
                if (DO_LOG) {
                    console.log("[record-backend.js:addSplit()] " + error);
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
            url: Constant.getRecordURL() + "?intent=2",
            timeout: Constant.AJAX_CFG.timeout,
            data: criteria,
            success: (response) => {
                if (DO_LOG) {
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
                if (DO_LOG) {
                    console.log("[record-backend.js:getRecord()] " + error);
                }
                callback(error);
            }
        });
    }

    /**
     * Modifies the event with the given backend ID to the updated values
     * passed in the newData object. For internal reasons, splitNumber and splitIndex
     * cannot be externally modified. Mutable values include:
     *      value {Float} - value to search for based on valueOperator param
     *      definition {Integer} - definition to search for (i.e. 3 for all 200m records)
     *      isPractice {Boolean} - selects records that are practices
     *      isSplit {Boolean} - select relay / split records
     *      id_event {Integer} - selects records tied to the event ID
     * 
     * @example modifyRecord(4, {"value": 62.034}, (response) => { // Tell user success or fail })
     *          --> Modifies record 4 by setting the value to 62.034
     * 
     * @param {Integer} recordId the ID of the record on the backend to modify
     * @param {AssociativeArray} newData values that will be used for this record
     * @param {Function} callback callback to handle the response (JSON or String on failure)
     */
    static modifyRecord(recordId, newData, callback) {

        // Set the record's ID that will be modified
        newData.id_record = recordId;
        // Add the SID to newData
        newData.SID = localStorage.getItem("SID");

        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getRecordURL() + "?intent=3",
            timeout: Constant.AJAX_CFG.timeout,
            data: newData,
            success: (response) => {
                if (DO_LOG) {
                    console.log("[record-backend.js:modifyRecord()] " + response);
                }
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                callback(response);
            },
            error: (error) => {
                if (DO_LOG) {
                    console.log("[record-backend.js:modifyRecord()] " + error);
                }
                callback(error);
            }
        });
    }

    /**
     * Ties the user identified by emailOrId (either their email or backend ID)
     * to the given record ID (backend as well). The function will determine
     * if an email or ID is given based on the type. Function is useful
     * for creating relays, etc.
     * 
     * @example attachAthlete("lafrazerl@gmail.com", 7, (result) => { // Added to relay! })
     *          --> Adds Seth's account as an owner of record 7
     * 
     * @param {String | Integer} emailOrId the user's email or ID, the user being attached
     * @param {AssociativeArray} recordId the ID of the record on the backend to modify
     * @param {Function} callback callback to handle the response (JSON or String on failure)
     */
    static attachAthlete(emailOrId, recordId, callback) {

        // Process emailOrId parameter
        let storage = window.localStorage;
        let identityKey = "email"; // "email" if emailOrId is a string, "id_user" if it's a number

        if (typeof emailOrId == "number") {
            identityKey = "id_user";
        } else { // Assume it was an email
            if (emailOrId.length == 0) {
                emailOrId = storage.getItem("email");
            }
        }

        // Add them to an array for post data
        let postData = {};
        postData.SID = storage.getItem("SID");
        postData.accountIdentity = {};
        postData.accountIdentity[identityKey] = emailOrId;
        postData.id_record = recordId;

        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getRecordURL() + "?intent=5",
            timeout: Constant.AJAX_CFG.timeout,
            data: postData,
            success: (response) => {
                if (DO_LOG) {
                    console.log("[record-backend.js:attachAthlete()] " + response);
                }
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                callback(response);
            },
            error: (error) => {
                if (DO_LOG) {
                    console.log("[record-backend.js:attachAthlete()] " + error);
                }
                callback(error);
            }
        });
    }

    /**
     * Removes any tied with the user and the given record ID (backend-based).
     * A user's email or backend ID can be given, and the function will attempt
     * to use it accordingly based on type (i.e. String vs Integer). This function
     * will probably be used to edit relay teams
     * 
     * @example detachAthlete("lafrazerl@gmail.com", 7, (result) => { // Added to relay! })
     *          --> Disassociates Seth's account with record 7
     * 
     * @param {String | Integer} emailOrId the ID of the user to detach
     * @param {AssociativeArray} recordId the ID of the record on the backend to modify
     * @param {Function} callback callback to handle the response (JSON or String on failure)
     */
    static detachAthlete(emailOrId, recordId, callback) {
        // TODO: Could probably consolidate this function with attachAthlete
        //       since the logic is identical and the only change is intent number

        // Process emailOrId parameter
        let storage = window.localStorage;
        let identityKey = "email"; // "email" if emailOrId is a string, "id_user" if it's a number

        if (typeof emailOrId == "number") {
            identityKey = "id_user";
        } else { // Assume it was an email
            if (emailOrId.length == 0) {
                emailOrId = storage.getItem("email");
            }
        }

        // Add them to an array for post data
        let postData = {};
        postData.SID = storage.getItem("SID");
        postData.accountIdentity = {};
        postData.accountIdentity[identityKey] = emailOrId;
        postData.id_record = recordId;

        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getRecordURL() + "?intent=6",
            timeout: Constant.AJAX_CFG.timeout,
            data: postData,
            success: (response) => {
                if (DO_LOG) {
                    console.log("[record-backend.js:detachAthlete()] " + response);
                }
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                callback(response);
            },
            error: (error) => {
                if (DO_LOG) {
                    console.log("[record-backend.js:detachAthlete()] " + error);
                }
                callback(error);
            }
        });
    }
    
    /**
     * Will PERMANENTLY delete the split from the backend. It will also detatch the user
     * if there are other attached athletes
     * 
     * @example deleteSplit(22, (response) => { // response.substatus > 0 means splits deleted })
     *          --> Purges split 22 from the server database
     * 
     * @param {AssociativeArray} splitId the backend ID of the split to delete
     * @param {Function} callback callback to handle the response (JSON or String on failure)
     */
    static deleteSplit(splitId, callback) {

        let storage = window.localStorage;

        // Add them to an array for post data
        let postData = {};
        postData.SID = storage.getItem("SID");
        postData.id_record = recordId;

        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getRecordURL() + "?intent=7",
            timeout: Constant.AJAX_CFG.timeout,
            data: postData,
            success: (response) => {
                if (DO_LOG) {
                    console.log("[record-backend.js:deleteSplit()] " + response);
                }
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                callback(response);
            },
            error: (error) => {
                if (DO_LOG) {
                    console.log("[record-backend.js:deleteSplit()] " + error);
                }
                callback(error);
            }
        });
    }
    
    /**
     * Will PERMANENTLY delete the record from the backend (frontend not handled).
     * Note: There are no restrictions on record deletion from the backend,
     * so be sure that the logged in user should be issuing this action!
     * 
     * @example deleteRecord(9, (response) => { // response.substatus > 0 means record deleted })
     *          --> Purges record 9 from the server database
     * 
     * @param {AssociativeArray} recordId the backend ID of the record to delete
     * @param {Function} callback callback to handle the response (JSON or String on failure)
     */
    static deleteRecord(recordId, callback) {

        let storage = window.localStorage;

        // Add them to an array for post data
        let postData = {};
        postData.SID = storage.getItem("SID");
        postData.id_record = recordId;

        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getRecordURL() + "?intent=8",
            timeout: Constant.AJAX_CFG.timeout,
            data: postData,
            success: (response) => {
                if (DO_LOG) {
                    console.log("[record-backend.js:deleteRecord()] " + response);
                }
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                callback(response);
            },
            error: (error) => {
                if (DO_LOG) {
                    console.log("[record-backend.js:deleteRecord()] " + error);
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

        for (let k = 0; k < valueKeys.length; k++) {
            let key = valueKeys[k];

            if ((storage.getItem(key) != undefined) && (storage.getItem(key) != null)) {
                let value = storage.getItem(key);
                if ((typeof value == "string") && (value.length > 0)) {
                    // Filter with a generic regex (replace most special characters)
                    returnArray[key] = value.replace(Constant.getReplaceRegex(Constant.REGEX.generic), "");

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

    /**
     * Attempt to upload all of the records stored in offline_record and offline_record_user_link
     * to the server. These two tables will then be wiped afterwards.
     */
    static uploadOfflineRecords() {
        console.log("[record-backend.js]: uploading offline records");

        let query = (`
            SELECT * FROM offline_record
            INNER JOIN offline_record_user_link
            ON offline_record.id_record = offline_record_user_link.id_record
        `);

        dbConnection.selectValues(query, []).then((results) => {

            for (let i = 0; i < results.length; i++) {
                let value = results.item(i).value;
                let defId = results.item(i).id_record_definition;
                let backendId = results.item(i).id_backend

                RecordBackend.saveRecord(value, defId, backendId, (response) => {

                    console.log("RECORD SAVED " + JSON.stringify(response));

                    if (response.status > 0) { // If success, insert into local database

                        let newRecord = {};
                        let recordData = {};
                        let linkData = {};

                        // TODO: make sure it saves to local database properly
                        // Loop through each added record and save to local database
                        for (let r = 0; r < response.addedRecords.length; r++) {
                            newRecord = response.addedRecords[r];

                            // record
                            recordData["id_record"] = Number(newRecord.id_record);
                            recordData["value"] = Number(newRecord.value);
                            recordData["id_record_definition"] = Number(newRecord.id_recordDefinition);
                            dbConnection.insertValuesFromObject("record", recordData);

                            // record_user_link
                            linkData.id_record = Number(newRecord.id_record);
                            dbConnection.insertValuesFromObject("record_user_link", linkData);
                        }
                    } else {
                        console.log("Error while saving value to backend");
                    }
                });
            }
        });

        dbConnection.executeTransaction("DELETE FROM offline_record_user_link", []);
        dbConnection.executeTransaction("DELETE FROM offline_record", []);
    }

}
/**
 * @classdesc Used to interface and make calls to the backend
 * @class
 */
class AccountBackend {
    // Docs: https://www.sportwatch.us/mobile/docs/
    
    /**
     * Submits a request to pull the account information from the backend for
     * use in the app. Likely includes state, cell, etc. since the only NEEDED
     * thing to store in local storage is the email
     * 
     * @example getAccount((response) => { $("fname").val(response.fname) });
     *          --> Returns account info for the user currently logged in as JSON (string if error)
     * 
     * @param {Function} callback function to handle the callback info
     * @param {String} email [defaults to localStorage value] email of the user to get info for
     */
    static getAccount(callback, emailOrId = "") {
        
        let storage = window.localStorage;
        let identityKey = "email"; // "email" if emailOrId is a string, "id_user" if it's a number
        
        if(typeof emailOrId == "number") {
            identityKey = "id_user";
        } else { // Assume it was an email
            if(emailOrId.length == 0) {
                emailOrId = storage.getItem("email");
            }
        }
        
        // Prepare the array
        let postArray = {};
        postArray.SID = storage.getItem("SID");
        postArray.accountIdentity = { [identityKey]: emailOrId };
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getAccountURL() + "?intent=0",
            timeout: Constant.AJAX_CFG.timeout,
            data: postArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[account-backend.js:getAccount()] " + response);
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
                    console.log("[account-backend.js:getAccount()] " + error);
                }
                callback(error);
            }
        });
    }
    
    /**
     * Makes a request to the server to update user information. The callback takes
     * a decoded JSON array, or possibly a string in case of an error. The JSON will
     * include "status", "substatus", and "msg".
     * NOTE: currentPassword is needed when changing email or password!
     * Aside: I used a callback function since I think it's cleaner than a promise,
     * but feel free to change it if you'd like. (so much for "brevity is the soul of wit"!)
     * 
     * @example updateAccount({"fname": "Joe", "email": "newmail@email.com"}, this.afterSaveFunc, "currentPass123");
     *          --> Updates Joe's email to newmail@mail.com if the password was correct
     * 
     * @param {AssociativeArray} newValues list of new values to update (technically an object)
     *                                     if left blank, it will pull everything from local storage
     * @param {Function} callback function that should handle and error or success response
     *                            (takes AssociativeArray as parameter, but may return string if response is malformed)
     * @param {String} currentPassword user's current password, needed for email & password change
     */
    static updateAccount(newValues = {}, callback = (response) => { }, currentPassword = "") {
        
        let storage = window.localStorage;
        let userEmail = storage.getItem("email");
        
        // Were new values defined; if not, pull them from local storage
        if(Object.keys(newValues).length == 0) {
            // Grab all of the values that can be set via account-action.php
            // except email and password since they require the current password
            newValues = this.getLocalValues(["fname", "lname", "gender", "state", "dob", "id_school", "id_team", "cellNum"]);
        }
        newValues = this.sanitizePostRequest(newValues, true);
        
        // If sanitation failed, return an error
        if(newValues == false) {
            let returnObj = { };
            returnObj.status = -6;
            returnObj.substatus = 5;
            returnObj.msg = "invalid params (frontend)";
            callback(returnObj);
            return;
        }
        
        // Prepare the array
        let postArray = {};
        postArray.SID = storage.getItem("SID");
        postArray.accountIdentity = {"email": userEmail};
        
        // If currentPassword isn't set, remove email and password from newValues
        if(currentPassword.length == 0) {
            delete newValues.email;
            delete newValues.password;
        } else {
            postArray["passwordOld"] = currentPassword;
        }
        
        // Push the new info (new info needs "New" appended to the end)
        let keys = Object.keys(newValues);
        for(let n = 0; n < keys.length; n++) {
            postArray[keys[n] + "New"] = newValues[keys[n]];
        }
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getAccountURL() + "?intent=1",
            timeout: Constant.AJAX_CFG.timeout,
            data: postArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[account-backend.js:updateAccount()] " + response);
                }
                try {
                    response = JSON.parse(response);
                } catch(e) {
                    // Couldn't parse, so just use string
                }
                callback(response);
            },
            error: (error) => {
                if(DO_LOG) {
                    console.log("[account-backend.js:updateAccount()] " + error);
                }
                callback(error);
            }
        });
    }
    
    /**
     * Sends a request to the backend asking for a password reset
     * email to be sent to the user (specified by the email parameter).
     * This will create a code that expires in 30 minutes, allowing the user
     * to reset their password.
     * 
     * @example requestPasswordReset("lafrazerl@gmail.com", (r) => { if(r.status > 0) { alert("Check your email!"); } });
     *          --> Sends a Reset Password email to lafrazerl@gmail.com
     * 
     * @param {String} email the email of the user requesting a password reset
     * @param {Function} callback function that should handle and error or success response
     *                            (takes AssociativeArray as parameter, but may return string if response is malformed)
     */
    static requestPasswordReset(email, callback) {
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getAccountURL() + "?intent=2",
            timeout: Constant.AJAX_CFG.timeout,
            data: {
                accountIdentity: {"email": email}
            },
            success: (response) => {
                // Remove hyphen from wacky email service
                if(response.charAt(0) == "–") {
                    response = response.substring(1, response.length);
                }
                
                if(DO_LOG) {
                    console.log("[account-backend.js:requestPasswordReset()] " + response);
                }
                try {
                    response = JSON.parse(response);
                } catch(e) {
                    // Couldn't parse, so just use string
                }
                callback(response);
            },
            error: (error) => {
                if(DO_LOG) {
                    console.log("[account-backend.js:requestPasswordReset()] " + error);
                }
                callback(error);
            }
        });
    }
    
    /**
     * Permanently deletes the user's account, along with all of their records,
     * name and email, and team data. Purchase / transaction data is saved
     * in the event that we are legally required to prove income or anything like that.
     * 
     * @example deleteAccount("lafrazerl@gmail.com", "Testing12345" (r) => { if(r.status > 0) { alert("Account deleted"); } });
     *          --> Delete's lafrazerl@gmail.com's account
     * 
     * @param {String} email the email of the user to delete
     * @param {String} password current password for the user
     * @param {Function} callback function that should handle and error or success response
     *                            (takes AssociativeArray as parameter, but may return string if response is malformed)
     */
    static deleteAccount(email, password, callback) {

        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getAccountURL() + "?intent=6",
            timeout: Constant.AJAX_CFG.timeout * 5, // This takes a while
            data: {
                SID: localStorage.getItem("SID"),
                accountIdentity: { "email": email },
                "email": email,
                "password": password
            },
            success: (response) => {
                if (DO_LOG) {
                    console.log("[account-backend.js:deleteAccount()] " + response);
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
                    console.log("[account-backend.js:deleteAccount()] " + error);
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
                    // Should be fine since passwords shouldn't be stored anyway
                    returnArray[key] = value.replace(Constant.getReplaceRegex(Constant.REGEX.generic), "");
                    
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
                payload["gender"] = payload["gender"].toUpperCase();
                // if (payload["gender"] == "M") {
                //     payload["gender"] = "Male";
                // } else if (payload["gender"] == "F") {
                //     payload["gender"] = "Female";
                // } else {
                //     payload["gender"] = "Other";
                // }
            }
        }
        if ("state" in payload) {
            if ((payload["state"] == null) || (payload["state"] == undefined)) {
                payload["state"] = "";
            }
        }
        // Date of Birth
        if ("dob" in payload) {
            if ((payload["dob"] == null) || (payload["dob"] == undefined)) {
                payload["dob"] = "2000-01-01";
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
        if("email" in payload) {
            if ((payload["email"] == null) || (payload["email"] == undefined)) {
                payload["email"] = "";
            } else {
                payload["email"] = payload["email"].toLowerCase();
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
            let cleanedInput = this.getValidInput(postArray["fname"], Constant.getReplaceRegex(Constant.REGEX.humanNameSingle), 0, 60);
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
            let cleanedInput = this.getValidInput(postArray["lname"], Constant.getReplaceRegex(Constant.REGEX.humanNameSingle), 0, 60);
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
        // School
        if("id_school" in postArray) {
            if((typeof postArray["id_school"] != "number") || (parseInt(postArray["id_school"]) < 1)) {
                if(removeInvalid) {
                    delete postArray["id_school"];
                } else {
                    return false;
                }
            }
        }
        // Email
        if("email" in postArray) {
            let cleanedInput = this.getValidInput(postArray["email"], Constant.getReplaceRegex(Constant.REGEX.emailBroad), 5, 128);
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
            let cleanedInput = this.getValidInput(postArray["password"], Constant.getReplaceRegex(Constant.REGEX.password), 7, 128);
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
                if(cleanedInput == "added") {
                    postArray["accountType"] = "added";
                } else if(cleanedInput == "deleted") {
                    postArray["accountType"] = "deleted";
                } else {
                    postArray["accountType"] = "user";
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
                let year = cleanedInput.substr(0, 4);
                let month = cleanedInput.substr(4, 2);
                let day = cleanedInput.substr(6, 2);
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
        if("cellNum" in postArray) {
            let cleanedInput = this.getValidInput(postArray["cellNum"], /[^0-9]/gm, 5, 11);
            if(cleanedInput !== false) {
                postArray["cellNum"] = cleanedInput;
            } else {
                if(removeInvalid) {
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
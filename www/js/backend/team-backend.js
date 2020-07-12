/**
 * @classdesc Used to interface and make calls to the backend regarding team functionality
 * @class
 */
class TeamBackend {
    // Docs: https://www.sportwatch.us/mobile/docs/
    
    // ---- TEAM ---- //
    
    /**
     * Attempts to create a team with the given name and details (if provided).
     * In theory, a team name is the only requirement, but a personal invite code
     * or forcing creation may be helpful at times as well. It will use the stored
     * user's email for primary coach and school for the team unless overwritten in
     * the options parameter. (more info at https://www.sportwatch.us/mobile/docs/#teamCreate)
     * 
     * @example createTeam("Rock and Roll Runners", {"primaryCoach": "example85@email.com", "force": 1});
     * 
     * @param {String} teamName name of the new team
     * @param {Function} cb the callback used to handle the server response (include status, substatus, msg)
     * @param {AssociativeArray} details can specify optional parameters to use when creating the team
     *                           primaryCoach {String} [default is logged in user] email of the primary coach
     *                           secondaryCoach {String} email of the secondary coach
     *                           inviteCode {String} 7-characters, a-z, 0-9 code for joining the team
     *                           schoolName {String} [default is user's school] school of the team (aka school of rock ^_*)
     *                           isLocked {Boolean} should the other users be unable to join the team? (toggable)
     *                           force {Boolean} should the team be created even if errors exist?
     */
    static createTeam(teamName, cb, details = { }) {
        
        // Instead of creating post array, just use details as post object
        details.teamName = teamName
        
        // Set primary coach as logged in user if not given
        if(!("primaryCoach" in details)) {
            details.primaryCoach = localStorage.getItem("email");
        }
        if(!("schoolName" in details)) {
            // TODO: Actually use the school's name in localStorage
            //       (likely change to school id instead of name)
            // details.schoolName = localStorage.getItem("school");
            details.schoolName = "Hemlock High School";
        }
        
        // Convert booleans into integers since mySQL doesn't like them
        if("isLocked" in details) {
            details.isLocked = (details.isLocked ? 1 : 0);
        }
        if("force" in details) {
            details.force = (details.force ? 1 : 0);
        }
        
        // Submit the request and call the callback
        $.ajax({
            type: "POST",
            url: Constant.URL.team_create,
            timeout: Constant.AJAX_CFG.timeout,
            data: details,
            success: (response) => {
                console.log("[team-backend.js:createTeam()] " + response);
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                cb(response);
            },
            error: (error) => {
                console.log("[team-backend.js:createTeam()] " + error);
                cb(response);
            }
        });
        
    }
    
    /**
     * Makes a request to the backend to join the team with the given
     * invite code. It will fail if the team doesn't exist or is locked. It
     * will also still succeed if the user is already in the team, but substatus
     * will be set to 2.
     * 
     * @param {String} inviteCode 7-character invite code that is unique to every team
     * @param {Function} cb callback function that takes in response JSON (or string on error)
     */
    static joinTeam(inviteCode, cb) {
        
        let requestArray = { };
        let storage = window.localStorage;
        
        // Prepare the request array
        requestArray.accountEmail = storage.getItem("email");
        requestArray.teamIdentity = { "inviteCode" : inviteCode };
        
        // Submit the request and call the callback
        $.ajax({
            type: "POST",
            url: Constant.URL.team_action + "?intent=3",
            timeout: Constant.AJAX_CFG.timeout,
            data: requestArray,
            success: (response) => {
                console.log("[team-backend.js:joinTeam()] " + response);
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                cb(response);
            },
            error: (error) => {
                console.log("[team-backend.js:joinTeam()] " + error);
                cb(response);
            }
        });
    }
    
    /**
     * Submits a request to pull the team information from the backend for
     * use in the app. Likely includes name, school, etc. since the only NEEDED
     * thing to store in local storage is the id_team
     * 
     * @example getTeamInfo((response) => { localstorage.setItem("teamName", response.teamName) }, {"inviteCode": "123aaaa"});
     *          --> Returns team info for the team with invite code "123aaaa"
     * 
     * @param {Function} cb function to handle the callback info
     * @param {AssociativeArray} teamIdentity [defaults to localStorage id_team] data (like inviteCode) to identify a team
     */
    static getTeamInfo(cb, teamIdentity = { }) {
        
        let storage = window.localStorage;
        
        // If teamIdentity is empty or omitted, try pulling the local storage value
        if(Object.keys(teamIdentity).length == 0) {
            if((storage.getItem("id_team") == null) || (storage.getItem("id_team") == undefined)) {
                console.log("[team-backend.js:getTeamInfo()] No teamIdentity given, cannot proceed!");
                // Simulate the response
                cb("{\"status\": -5, \"substatus\": 6, \"msg\": \"accuracy = 0 of 8. duplicates: false\"}");
                
            } else {
                teamIdentity = { "id_team": storage.getItem("id_team") };
            }
        }
        
        // Prepare the array
        let postArray = { };
        postArray.accountEmail = storage.getItem("email");
        postArray.teamIdentity = teamIdentity;
        
        // Submit the request and call the callback
        $.ajax({
            type: "POST",
            url: Constant.URL.team_action + "?intent=0",
            timeout: Constant.AJAX_CFG.timeout,
            data: postArray,
            success: (response) => {
                console.log("[team-backend.js:getTeamInfo()] " + response);
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                cb(response);
            },
            error: (error) => {
                console.log("[team-backend.js:getTeamInfo()] " + error);
                cb(response);
            }
        });
    }
    
    // ---- UTIL FUNCTIONs ---- //
    
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
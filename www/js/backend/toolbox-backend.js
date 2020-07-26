/**
 * @classdesc Used to interface and make miscellaneous calls to the backend, like
 *            syncing local database to backend or searching
 * @class
 */
class ToolboxBackend {
    // Docs: https://www.sportwatch.us/mobile/docs/
    
    
    static pullFromBackend() {
        
        let storage = window.localStorage;
        let email = storage.getItem("email");
        let ajaxRequest = -1; // Ajax object pushed into the array
        let ajaxCalls = []; // Used to resolve the promise to signal completion
        
        // USER //
        if((email == null) || (email == undefined)) {
            // TOD: Either log them out or attempt to find the email
            return new Promise((resolve, reject) => {
                reject(false);
            })
        }
        ajaxRequest = AccountBackend.getAccount((thisUser) => {
            if(thisUser.status > 0) {
                // Update team ID
                if(thisUser.id_team > 0) {
                    storage.setItem("id_team", thisUser.id_team);
                }
            }
        });
        ajaxCalls.push(ajaxRequest);
        
        // TEAM //
        if((storage.getItem("id_team") != null) && (storage.getItem("id_team") != undefined)) {
            // Update team info (like team name)
            ajaxRequest = TeamBackend.getTeamInfo((teamInfo) => {
                if(teamInfo.status > 0) {
                    localStorage.setItem("teamName", teamInfo.teamName);
                }
            });
            ajaxCalls.push(ajaxRequest);
            
            // Update athletes database table
            ajaxRequest = TeamBackend.getTeamRoster("fname lname gender id_user email", (teamResponse) => {
                if(teamResponse.status > 0) {
                    // Add in coaches TODO: Add in preference to omit them
                    if("primaryCoach" in teamResponse) {
                        dbConnection.insertValues("athlete", [
                            teamResponse.primaryCoach.fname,
                            teamResponse.primaryCoach.lname,
                            10, // <-- Grade Placeholder TODO: Remove
                            (teamResponse.primaryCoach.gender).toLowerCase(),
                            teamResponse.primaryCoach.id_user
                        ]);
                        // Pull the records for them and insert
                        ajaxCalls.push(ToolboxBackend.pullAndInsertRecords(teamResponse.primaryCoach.email));
                    }
                    if("secondaryCoach" in teamResponse) {
                        dbConnection.insertValues("athlete", [
                            teamResponse.secondaryCoach.fname,
                            teamResponse.secondaryCoach.lname,
                            10,
                            (teamResponse.secondaryCoach.gender).toLowerCase(),
                            teamResponse.secondaryCoach.id_user
                        ]);
                        // Pull their records and insert
                        ajaxCalls.push(ToolboxBackend.pullAndInsertRecords(teamResponse.secondaryCoach.email));
                    }
                    
                    // Add in athlete
                    if("athletes" in teamResponse) {
                        let currentAthlete = { };
                        for(let a = 0; a < teamResponse.athletes.length; a++) {
                            currentAthlete = teamResponse.athletes[a];
                            dbConnection.insertValues("athlete", [
                                currentAthlete.fname,
                                currentAthlete.lname,
                                10,
                                (currentAthlete.gender).toLowerCase(),
                                currentAthlete.id_user
                            ]);
                            // Pull their records and insert into the database
                            ajaxCalls.push(ToolboxBackend.pullAndInsertRecords(currentAthlete.email));
                            console.log("Added athlete: " + currentAthlete.fname);
                        }
                    }
                }
            });
            ajaxCalls.push(ajaxRequest);
        } // End of team sync
        
        // RECORDS //
        // Moved to pullAndInsertRecords() method and used above when grabbing team /\
        
        // Call a function (likely app.init) when the pull finishes
        return new Promise((resolve) => {
            $.when(...ajaxCalls).then(resolve);
        });
    }
    
    /**
     * Works in connection with pullFromBackend() to pull and insert
     * all of the records of a given user identified by an email
     * address. It returns the ajax request object, which can be
     * used to determine when the operations have completed.
     * 
     * @param {String} email email of the user that owns the requested records
     * 
     * @returns
     * Ajax object
     */
    static pullAndInsertRecords(email) {
        return RecordBackend.getRecord({"accountIdentity": {"email": email}}, (recordResponse) => {
            // Check status
            if(recordResponse.status < 0) {
                console.log("[toolbox-backend.js:pullFromBackend()]: Unable to pull records!");
            } else {
                
                // Make sure there is at least 1 record returned
                if("result" in recordResponse) {
                    let pulledResult = { };
                    for(let r = 0; r < recordResponse.result.length; r++) {
                        pulledResult = recordResponse.result[r]; // Hehe, pulled pork
                        
                        dbConnection.insertValues("record", [
                            pulledResult.id_user,
                            pulledResult.id_recordDefinition,
                            pulledResult.value,
                            pulledResult.isSplit,
                            pulledResult.splitNumber,
                            pulledResult.splitIndex,
                            pulledResult.lastUpdated
                        ]);
                    } // End of for loop for results
                }
            } // End of status check
        });
    }
    
    /**
     * Pulls all of the user information (id, name, cellNum, etc.) for each
     * athlete registered in the given school ID.
     * 
     * @example getUsersInSchool(1, (response) => { let name = response.matches[0].fname; })
     * 
     * @param {String} schoolId school ID to retrieve athletes for
     * @param {Function} callback function to handle the callback info
     */
    static getUsersInSchool(schoolId, callback) {
        
        let storage = window.localStorage;
        
        // Prepare the request
        let postArray = {};
        postArray.SID = storage.getItem("SID");
        postArray.searchIn = "user";
        postArray.criteria = {"id_school": schoolId};
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.URL.toolbox + "?intent=0",
            timeout: Constant.AJAX_CFG.timeout,
            data: postArray,
            success: (response) => {
                console.log("[toolbox-backend.js:getUsersInSchool()] " + response);
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                callback(response);
            },
            error: (error) => {
                console.log("[toolbox-backend.js:getUSersInSchool()] " + error);
                callback(error);
            }
        });
    }
    
    /**
     * Searches for the user's information based on the session ID. This is
     * particularly helpful after loggin in, when only the session ID is known.
     * 
     * @example getUserBySID((response) => { console.log("Name: " + response.matches[0].fname) })
     * 
     * @param {Function} cb function to handle the callback info
     * @param {String} SID [defaults to stored SID] the session ID to use for lookup
     */
    static getUserBySID(cb, SID = "") {
        
        let storage = window.localStorage;
        let sessionId = SID;
        if(sessionId.length == 0) {
            sessionId = storage.getItem("SID");
        }
        
        // Prepare the array
        let postArray = {};
        postArray.SID = storage.getItem("SID"); // Kind of silly, but still needed
        postArray.searchIn = "user_session_data";
        postArray.criteria = {"SID": sessionId};
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.URL.toolbox + "?intent=0",
            timeout: Constant.AJAX_CFG.timeout,
            data: postArray,
            success: (response) => {
                console.log("[toolbox-backend.js:getUserBySID()] " + response);
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                cb(response);
            },
            error: (error) => {
                console.log("[toolbox-backend.js:getUserBySID()] " + error);
                cb(error);
            }
        });
    }
    
    /**
     * Searches for a school whose name contains or is similar to
     * the given search string.
     * 
     * @example searchForSchool("Hem", 5, (response) => { console.log("Name: " + response.matches[0].name) })
     *          --> "Hemlock High School"
     * 
     * @param {String} searchName the string (partial name) to search for matches with
     * @param {Integer} resultLimit max number of results to return (max is 100)
     * @param {Function} cb function to handle the callback info
     */
    static searchForSchool(searchName, resultLimit, cb) {
        
        let storage = window.localStorage;
        
        // Prepare the array
        let postArray = {};
        postArray.SID = storage.getItem("SID");
        postArray.searchIn = "school";
        postArray.limitTo = resultLimit;
        postArray.criteria = {"name": searchName};
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.URL.toolbox + "?intent=0",
            timeout: Constant.AJAX_CFG.timeout,
            data: postArray,
            success: (response) => {
                console.log("[toolbox-backend.js:searchForSchool()] " + response);
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                cb(response);
            },
            error: (error) => {
                console.log("[toolbox-backend.js:searchForSchool()] " + error);
                cb(error);
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
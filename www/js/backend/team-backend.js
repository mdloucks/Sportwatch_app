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
        details.SID = localStorage.getItem("SID");
        details.teamName = teamName;
        
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
        requestArray.SID = storage.getItem("SID");
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
        postArray.SID = storage.getItem("SID");
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
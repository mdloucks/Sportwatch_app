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
     *                           schoolId {Integer} backend database id of the team's school
     *                           isLocked {Boolean} should the other users be unable to join the team? (toggable)
     *                           force {Boolean} should the team be created even if errors exist?
     *                           schoolName {String} DEPRECATED school of the team (aka school of rock ^_*)
     */
    static createTeam(teamName, cb, details = { }) {
        
        // Instead of creating post array, just use details as post object
        details.SID = localStorage.getItem("SID");
        details.teamName = teamName;
        
        // Set primary coach as logged in user if not given
        if(!("primaryCoach" in details)) {
            details.primaryCoach = localStorage.getItem("email");
        }
        // if(!("schoolName" in details)) {
        //     // TODO: Actually use the school's name in localStorage
        //     //       (likely change to school id instead of name)
        //     // details.schoolName = localStorage.getItem("school");
        //     details.schoolName = "Hemlock High School";
        // }
        
        // Convert booleans into integers since mySQL doesn't like them
        if("isLocked" in details) {
            details.isLocked = (details.isLocked ? 1 : 0);
        }
        if("force" in details) {
            details.force = (details.force ? 1 : 0);
        }
        
        console.log(details);
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getTeamCreateURL(),
            timeout: Constant.AJAX_CFG.timeout,
            data: details,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[team-backend.js:createTeam()] " + response);
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
                    console.log("[team-backend.js:createTeam()] " + error);
                }
                cb(error);
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
        return $.ajax({
            type: "POST",
            url: Constant.getTeamActionURL() + "?intent=3",
            timeout: Constant.AJAX_CFG.timeout,
            data: requestArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[team-backend.js:joinTeam()] " + response);
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
                    console.log("[team-backend.js:joinTeam()] " + error);
                }
                cb(error);
            }
        });
    }
    
    /**
     * Tells the backend that the logged in user is leaving the team
     * (I hope they leave without a fight...). It will use the local storage
     * email and team id (if they aren't set, a rejected promise is being returned)
     * The database should probably be cleared / re-pulled after such a
     * major change in position.
     * 
     * @example leaveTeam((response) => { // Confirm leave });
     * 
     * @param {Function} cb callback function that takes in response JSON (or string on error)
     * @param {Integer} teamId [defaults to local storage] the ID of the team to leave
     */
    static leaveTeam(cb, teamId = -1) {
        
        let requestArray = { };
        let storage = window.localStorage;
        
        // Check / set team ID
        if(teamId < 1) { // mySQL ID's start at 1
            teamId = storage.getItem("id_team");
        }
        
        // Prepare the request array
        requestArray.SID = storage.getItem("SID");
        requestArray.accountEmail = storage.getItem("email");
        requestArray.teamIdentity = { "id_team" : teamId };
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getTeamActionURL() + "?intent=4",
            timeout: Constant.AJAX_CFG.timeout,
            data: requestArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[team-backend.js:leaveTeam()] " + response);
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
                    console.log("[team-backend.js:leaveTeam()] " + error);
                }
                cb(error);
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
                if(DO_LOG) {
                    console.log("[team-backend.js:getTeamInfo()] No teamIdentity given, cannot proceed!");
                }
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
        return $.ajax({
            type: "POST",
            url: Constant.getTeamActionURL() + "?intent=0",
            timeout: Constant.AJAX_CFG.timeout,
            data: postArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[team-backend.js:getTeamInfo()] " + response);
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
                    console.log("[team-backend.js:getTeamInfo()] " + error);
                }
                cb(error);
            }
        });
    }
    
    /**
     * Pulls the requested information (name, gender, etc.) of the athletes
     * that are a part of the team identified by the teamIdentity (or the id_team
     * stored in local storage if teamIdentity is omitted)
     * 
     * @example getTeamRoster("fname lname gender", (r) => { // handle response });
     * 
     * @param {String} requestedFields list of space separated column names ("fname lname")
     * @param {Function} cb callback to handle the response
     * @param {AssociativeArray} teamIdentity [optional] array used to identify the team
     */
    static getTeamRoster(requestedFields, cb, teamIdentity = { }) {
        
        let storage = window.localStorage;
        
        // If teamIdentity is empty or omitted, try pulling the local storage value
        if(Object.keys(teamIdentity).length == 0) {
            if((storage.getItem("id_team") == null) || (storage.getItem("id_team") == undefined)) {
                if(DO_LOG) {
                    console.log("[team-backend.js:getTeamInfo()] No teamIdentity given, cannot proceed!");
                }
                // Simulate the response
                cb({"status": -5, "substatus": 1});
                
            } else {
                teamIdentity = { "id_team": storage.getItem("id_team") };
            }
        }
        
        // Prepare the array
        let postArray = { };
        postArray.SID = storage.getItem("SID");
        postArray.accountEmail = storage.getItem("email");
        postArray.teamIdentity = teamIdentity;
        postArray.requestedInfo = requestedFields;
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getTeamActionURL() + "?intent=1",
            timeout: Constant.AJAX_CFG.timeout,
            data: postArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[team-backend.js:getTeamRoster()] " + response);
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
                    console.log("[team-backend.js:getTeamRoster()] " + error);
                }
                cb(error);
            }
        });
    }
    
    /**
     * Attempts to send an email to the given parameter, including the team's
     * invite code and instructions on joining the team.
     * 
     * @param {String} inviteEmail the address to send the invite code email to
     * @param {Function} cb callback function that takes in response JSON (or string on error)
     */
    static inviteToTeam(inviteEmail, cb) {
        
        let requestArray = { };
        let storage = window.localStorage;
        
        // Prepare the request array
        requestArray.SID = storage.getItem("SID");
        requestArray.accountEmail = storage.getItem("email");
        requestArray.teamIdentity = { "id_team" : storage.getItem("id_team") };
        requestArray.invitedEmail = inviteEmail;
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getTeamActionURL() + "?intent=5",
            timeout: Constant.AJAX_CFG.timeout,
            data: requestArray,
            success: (response) => {
                // The current email agent prepends a hyphen (not sure why)
                // Let's remove it before processing
                if(response.charAt(0) == "–") {
                    response = response.substring(1, response.length);
                }
                
                if(DO_LOG) {
                    console.log("[team-backend.js:inviteToTeam()] " + response);
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
                    console.log("[team-backend.js:inviteToTeam()] " + error);
                }
                cb(error);
            }
        });
    }
    
    /**
     * So long as a coach is the one issuing this action, it will kick
     * the specified user from the team. Currently, there is no notification
     * of this and the user will simply "notice" when starting the app again
     * 
     * @example kickAthlete("trouble@mail.com", (data) => { // Handle response } )
     *          --> Kicks "trouble@mail.com" from the team in local storage
     * 
     * @param {String} kickedEmailOrId the email address of the user being kicked
     * @param {Function} cb callback function that takes in response JSON (or string on error)
     */
    static kickAthlete(kickedEmailOrId, cb) {
        
        let requestArray = { };
        let storage = window.localStorage;
        
        // Prepare the request array
        requestArray.SID = storage.getItem("SID");
        requestArray.accountEmail = storage.getItem("email");
        requestArray.teamIdentity = { "id_team" : storage.getItem("id_team") };
        if (typeof kickedEmailOrId == "number") {
            requestArray.kickedId = kickedEmailOrId;
        } else { // Assume it was an email
            requestArray.kickedEmail = kickedEmailOrId;
        }
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getTeamActionURL() + "?intent=6",
            timeout: Constant.AJAX_CFG.timeout,
            data: requestArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[team-backend.js:kickAthlete()] " + response);
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
                    console.log("[team-backend.js:kickAthlete()] " + error);
                }
                cb(error);
            }
        });
    }
    
    /**
     * Appoints the given user (identified by an email address) as the primary
     * coach of the team in local storage. Things to consider:
     *  - New coach must already have a Sportwatch account
     *  - Current coach will become secondary coach
     *  - Primary coach only action since it changes leadership
     * 
     * @example appointPrimaryCoach("clark@hemlock.com", (data) => { // Handle response } )
     *          --> Makes Coach Clark the primary coach of the team
     * 
     * @param {String} newCoachEmailOrId the email of the new primary coach to promote
     * @param {Function} cb callback function that takes in response JSON (or string on error)
     */
    static appointPrimaryCoach(newCoachEmailOrId, cb) {
        
        let requestArray = { };
        let storage = window.localStorage;
        
        // Prepare the request array
        requestArray.SID = storage.getItem("SID");
        requestArray.accountEmail = storage.getItem("email");
        requestArray.teamIdentity = { "id_team" : storage.getItem("id_team") };
        if (typeof newCoachEmailOrId == "number") {
            requestArray.promotedId = newCoachEmailOrId;
        } else {
            requestArray.promotedEmail = newCoachEmailOrId;
        }
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getTeamActionURL() + "?intent=7",
            timeout: Constant.AJAX_CFG.timeout,
            data: requestArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[team-backend.js:appointPrimaryCoach()] " + response);
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
                    console.log("[team-backend.js:appointPrimaryCoach()] " + error);
                }
                cb(error);
            }
        });
    }
    
    /**
     * Appoints the given user (identified by an email address) as the secondary
     * coach of the team in local storage. Things to consider:
     *  - New coach must already have a Sportwatch account
     *  - Current secondary coach will be demoted to athlete
     * 
     * @example appointSecondaryCoach("assist@hemlock.com", (data) => { // Handle response } )
     *          --> Makes Coach Assist the secondary coach of the team
     * 
     * @param {String} newCoachEmailOrId the email of the new secondary coach to promote
     * @param {Function} cb callback function that takes in response JSON (or string on error)
     */
    static appointSecondaryCoach(newCoachEmailOrId, cb) {
        
        let requestArray = { };
        let storage = window.localStorage;
        
        // Prepare the request array
        requestArray.SID = storage.getItem("SID");
        requestArray.accountEmail = storage.getItem("email");
        requestArray.teamIdentity = { "id_team" : storage.getItem("id_team") };
        if (typeof newCoachEmailOrId == "number") {
            requestArray.promotedId = newCoachEmailOrId;
        } else {
            requestArray.promotedEmail = newCoachEmailOrId;
        }
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getTeamActionURL() + "?intent=8",
            timeout: Constant.AJAX_CFG.timeout,
            data: requestArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[team-backend.js:appointSecondaryCoach()] " + response);
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
                    console.log("[team-backend.js:appointSecondaryCoach()] " + error);
                }
                cb(error);
            }
        });
    }
    
    /**
     * Asks the backend to remote the coach identified by email in the
     * first parameter. Obvious power restrictions are in play, i.e. the secondary
     * coach cannot demote the primary coach, and an athlete can't demote
     * a coach.
     * 
     * @example demoteCoach("badGuy@mail.com", (data) => { // Handle response } )
     *          --> Removes Bad Guy from his position as a coach
     * 
     * @param {String} removedCoachEmailOrId the email of the coach being demoted
     * @param {Function} cb callback function that takes in response JSON (or string on error)
     */
    static demoteCoach(removedCoachEmailOrId, cb) {
        
        let requestArray = { };
        let storage = window.localStorage;
        
        // Prepare the request array
        requestArray.SID = storage.getItem("SID");
        requestArray.accountEmail = storage.getItem("email");
        requestArray.teamIdentity = { "id_team" : storage.getItem("id_team") };
        if(typeof removedCoachEmailOrId == "number") {
            requestArray.demotedId = removedCoachEmailOrId;
        } else {
            requestArray.demotedEmail = removedCoachEmailOrId;
        }
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getTeamActionURL() + "?intent=9",
            timeout: Constant.AJAX_CFG.timeout,
            data: requestArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[team-backend.js:demoteCoach()] " + response);
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
                    console.log("[team-backend.js:demoteCoach()] " + error);
                }
                cb(error);
            }
        });
    }
    
    /**
     * This function TOGGLES the locked state of a team. Furthermore, it should
     * NOT be used to see if a team is locked - that should be TeamBackend.getTeamInfo()
     * Locking a team prevents athletes form joining the team, but not from leaving it
     * 
     * @example lockTeam((response) => { if(response.isLocked == 1) { alert("LOCKED") } })
     *          --> Will toggle the lock and alert LOCKED if the team becomes locked
     * 
     * @param {Function} cb callback function that takes in response JSON (or string on error)
     */
    static lockTeam(cb) {
        
        let requestArray = { };
        let storage = window.localStorage;
        
        // Prepare the request array
        requestArray.SID = storage.getItem("SID");
        requestArray.accountEmail = storage.getItem("email");
        requestArray.teamIdentity = { "id_team" : storage.getItem("id_team") };
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getTeamActionURL() + "?intent=10",
            timeout: Constant.AJAX_CFG.timeout,
            data: requestArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[team-backend.js:lockTeam()] " + response);
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
                    console.log("[team-backend.js:lockTeam()] " + error);
                }
                cb(error);
            }
        });
    }
    
    /**
     * Changes the team (identified by local storage / teamIdentity parameter)
     * name to the given string. Sanitation and validation will occur
     * on the backend, but it should also be checked on the frontend
     * 
     * @example changeTeamName("New Team Name", (response) => { localstorage.setItem("teamName", response.teamName) });
     *          --> Changes the name and sends it back with the response
     * 
     * @param {String} newName the new name to assign for the team
     * @param {Function} cb function to handle the callback info
     * @param {AssociativeArray} teamIdentity [defaults to localStorage id_team] data (like inviteCode) to identify a team
     */
    static changeTeamName(newName, cb, teamIdentity = { }) {
        
        let storage = window.localStorage;
        
        // If teamIdentity is empty or omitted, try pulling the local storage value
        if(Object.keys(teamIdentity).length == 0) {
            if((storage.getItem("id_team") == null) || (storage.getItem("id_team") == undefined)) {
                if(DO_LOG) {
                    console.log("[team-backend.js:changeTeamName()] No teamIdentity given, cannot proceed!");
                }
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
        postArray.newName = newName;
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getTeamActionURL() + "?intent=11",
            timeout: Constant.AJAX_CFG.timeout,
            data: postArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[team-backend.js:changeTeamName()] " + response);
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
                    console.log("[team-backend.js:changeTeamName()] " + error);
                }
                cb(error);
            }
        });
    }
    
    /**
     * Changes the team (identified by local storage / teamIdentity parameter)
     * invite code to the given string should be 7 digits long (should be checked
     * before calling this function).
     * 
     * @example changeInviteCode("lclcm3y", (response) => { console.log("New Code: " + response.inviteCode) });
     *          --> Changes the invite code (or errors) and returns it back
     * 
     * @param {String} newInviteCode the new invite code to use for the team
     * @param {Function} cb function to handle the callback info
     * @param {AssociativeArray} teamIdentity [defaults to localStorage id_team] data (like inviteCode) to identify a team
     */
    static changeInviteCode(newInviteCode, cb, teamIdentity = { }) {
        
        let storage = window.localStorage;
        
        // If teamIdentity is empty or omitted, try pulling the local storage value
        if(Object.keys(teamIdentity).length == 0) {
            if((storage.getItem("id_team") == null) || (storage.getItem("id_team") == undefined)) {
                if(DO_LOG) {
                    console.log("[team-backend.js:changeInviteCode()] No teamIdentity given, cannot proceed!");
                }
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
        postArray.newCode = newInviteCode;
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getTeamActionURL() + "?intent=12",
            timeout: Constant.AJAX_CFG.timeout,
            data: postArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[team-backend.js:changeInviteCode()] " + response);
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
                    console.log("[team-backend.js:changeInviteCode()] " + error);
                }
                cb(error);
            }
        });
    }
    
    /**
     * Changes the team (identified by local storage / teamIdentity parameter)
     * school to the matching ID given in the first parameter. The school must
     * exist on the backend for it to work.
     * 
     * @example changeTeamSchool(7, (r) => { // Handle change })
     *          --> Changes the team's school to the school with ID 7
     * 
     * @param {String} schoolId the new name to assign for the team
     * @param {Function} cb function to handle the callback info
     * @param {AssociativeArray} teamIdentity [defaults to localStorage id_team] data (like inviteCode) to identify a team
     */
    static changeTeamSchool(schoolId, cb, teamIdentity = { }) {
        
        let storage = window.localStorage;
        
        // If teamIdentity is empty or omitted, try pulling the local storage value
        if(Object.keys(teamIdentity).length == 0) {
            if((storage.getItem("id_team") == null) || (storage.getItem("id_team") == undefined)) {
                if(DO_LOG) {
                    console.log("[team-backend.js:changeTeamName()] No teamIdentity given, cannot proceed!");
                }
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
        postArray.newSchoolId = schoolId;
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getTeamActionURL() + "?intent=13",
            timeout: Constant.AJAX_CFG.timeout,
            data: postArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[team-backend.js:changeTeamSchool()] " + response);
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
                    console.log("[team-backend.js:changeTeamSchool()] " + error);
                }
                cb(error);
            }
        });
    }
    
    /**
     * Removes all of the users from the team and deletes the team from the
     * backend database. This may be changed once we start storing
     * data for teams (i.e. keep the team, but disable it or something?).
     * This action is reserved soley for the primary coach and will error
     * if anyone else tries to call it.
     * 
     * @example deleteTeam((result) => if(result.status > 0) { alert("TEAM DELETED"); })
     *          --> Tries deleting the team, displaying an alert on success
     * 
     * @param {Function} cb function to handle the callback info
     * @param {AssociativeArray} teamIdentity [defaults to localStorage id_team] data to identify a team
     */
    static deleteTeam(cb, teamIdentity = { }) {
        
        let storage = window.localStorage;
        
        // If teamIdentity is empty or omitted, try pulling the local storage value
        if(Object.keys(teamIdentity).length == 0) {
            if((storage.getItem("id_team") == null) || (storage.getItem("id_team") == undefined)) {
                if(DO_LOG) {
                    console.log("[team-backend.js:deleteTeam()] No teamIdentity given, cannot proceed!");
                }
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
        return $.ajax({
            type: "POST",
            url: Constant.getTeamActionURL() + "?intent=14",
            timeout: Constant.AJAX_CFG.timeout,
            data: postArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[team-backend.js:deleteTeam()] " + response);
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
                    console.log("[team-backend.js:deleteTeam()] " + error);
                }
                cb(error);
            }
        });
    }
    
    // ---- UTIL FUNCTIONS ---- //
    
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
/**
 * @classdesc Used to interface and make miscellaneous calls to the backend, like
 *            syncing local database to backend or searching
 * @class
 */
class ToolboxBackend {
    // Docs: https://www.sportwatch.us/mobile/docs/
    
    static syncFrontendDatabase() {
        
        let storage = window.localStorage;
        dbConnection.createNewTables();
        
        // Create a new Deferred object for each request to the backend (i.e. for each table)
        let localAccountData = $.Deferred();
        let localPlanData = $.Deferred();
        let localTeamData = $.Deferred();
        let athleteSync = $.Deferred();
        let recordSync = $.Deferred();
        let returnPromise = $.Deferred();
        
        let appData = $.Deferred();
        
        // -- Execute backend calls -- //
        
        // appData.promise().then(() => {
        //     this.getBootPayload().then((success) => {
        //         console.log("Did succeed: " + JSON.stringify(success));
        //         if(success) {
        //             localPlanData.resolve();
        //         } else {
        //             returnPromise.resolve();
        //         }
        //     });
        // });
        this.getBootPayload(appData);
        appData.promise().then((success) => {
            console.log("Did succeed: " + JSON.stringify(success));
            if(success) {
                localPlanData.resolve();
            } else {
                returnPromise.resolve();
            }
        });
        
        
        
        
        // User local storage
        localAccountData.promise().then(() => {
            AccountBackend.getAccount((userInfo) => {
                if (userInfo.status > 0) {
                    storage.setItem("id_user", userInfo.id_user);
                    // Update team ID
                    if (userInfo.id_team > 0) {
                        storage.setItem("id_team", userInfo.id_team);
                        storage.setItem("user", userInfo);
                    } else {
                        storage.removeItem("id_team");
                    }
                }
            })
            .then(() => {
                localPlanData.resolve();
                if(storage.getItem("id_team") != null) {
                    localTeamData.resolve();
                } else {
                    returnPromise.resolve();
                }
            }, () => {
                returnPromise.reject();
            });
        });
        
        // Plan local storage
        localPlanData.promise().then(() => {
            PlanBackend.getActivePlan(storage.getItem("email"), (planInfo) => {
                
                let isFreeTrial = false;
                if((planInfo.status > 0) && (planInfo.id_planTemplate == 4)) {
                    isFreeTrial = true;
                }
                
                // Check membership / usage ability
                PlanBackend.getMembershipStatus(storage.getItem("email"), (membershipInfo) => {
                    if (membershipInfo.status > 0) {

                        // Make sure the user's membership isn't from the team
                        if((membershipInfo.userHasMembership) && (isFreeTrial)) {
                            if (Number(membershipInfo.daysToExpire) <= 4 && Number(membershipInfo.daysToExpire) != 0 && membershipInfo.userHasMembership) {
                                let dayWord = "day";
                                if(Number(membershipInfo.daysToExpire) > 1) {
                                    dayWord = dayWord + "s";
                                }
                                
                                setTimeout(() => {
                                    Popup.createConfirmationPopup(`
                                        Your free trial will expire in <b>${Number(membershipInfo.daysToExpire)} ${dayWord}</b><br><br>
                                        Keep improving your team by investing in a Sportwatch Membership.
                                    `, ["Become a Member", "Not Now"], [() => {
                                        Popup.createPremiumPopup(() => { });
                                    }, () => { }]);
                                }, 2500);
                            }
                        }

                        if (membershipInfo.canUseApp) {
                            storage.setItem("validMembership", "true");
                        } else {
                            storage.setItem("validMembership", "false");
                        }
                    }
                });
            })
            .then(() => {
                returnPromise.resolve();
                // if (storage.getItem("id_team") != null) {
                //     localTeamData.resolve();
                // } else {
                //     returnPromise.resolve();
                // }
            });
        });
        
        // Team local storage
        localTeamData.promise().then(() => {
            // Update team info (like team name)
            TeamBackend.getTeamInfo((teamInfo) => {
                if (teamInfo.status > 0) {
                    storage.setItem("id_team", teamInfo.id_team);
                    storage.setItem("teamName", teamInfo.teamName);
                    storage.setItem("school", teamInfo.schoolName);
                    storage.setItem("id_school", teamInfo.id_school);
                    storage.setItem("id_coachPrimary", teamInfo.id_coachPrimary);
                    storage.setItem("id_coachSecondary", teamInfo.id_coachSecondary);
                    storage.setItem("inviteCode", teamInfo.inviteCode);

                    // get the contact info of the coach

                } else {
                    if (teamInfo.substatus == 7) {
                        // This is the code for an invalid team ID
                        // If this occurs, the team was likely deleted, so update the frontend as well
                        storage.removeItem("id_team");
                        storage.removeItem("teamName");
                        storage.removeItem("school");
                        storage.removeItem("id_school");
                        storage.removeItem("inviteCode");
                    }
                }
            })
            .then(() => {
                athleteSync.resolve();
            });
        });
        
        // Pull from backend user to frontend athlete
        athleteSync.promise().then(() => {
            
            ToolboxBackend.insertBackendTable("user", "athlete", { "id_team": storage.getItem("id_team")}, {
                "fname": "fname",
                "lname": "lname",
                "gender": "gender",
                "id_user": "id_backend"
            })
            .then(() => {
                recordSync.resolve();
            });
        });
        
        // Pull from backend to frontend record for each athlete
        recordSync.promise().then(() => {
            
            let requests = []; // Array of backend requests
            
            dbConnection.selectValues("SELECT * FROM athlete").then((athletes) => {
                
                // Grab records for each athlete
                for (let i = 0; i < athletes.length; i++) {
                    // Record table
                    requests.push(ToolboxBackend.insertBackendTable("record", "record", {
                        "record_user_link.id_user": athletes.item(i)["id_backend"]
                    }, {
                        "id_record": "id_record",
                        "value": "value",
                        "id_recordDefinition": "id_record_definition",
                        "isPractice": "is_practice",
                        "lastUpdated": "last_updated"
                    }));
                    
                    // Record User Link table
                    requests.push(ToolboxBackend.insertBackendTable("record_user_link", "record_user_link", {
                        "id_user": athletes.item(i)["id_backend"]
                    }, {
                        "id_user": "id_backend",
                        "id_record": "id_record"
                    }));
                    
                    // Split table
                    requests.push(ToolboxBackend.insertBackendTable("split", "record_split", {
                        "id_user": athletes.item(i)["id_backend"]
                    }, {
                        "id_split": "id_split",
                        "id_record": "id_record",
                        "value": "value",
                        "name": "split_name",
                        "splitIndex": "split_index",
                        "lastUpdated": "last_updated"
                    }));
                }
                
                $.when(...requests).then(() => {
                    returnPromise.resolve();
                });
            });
        });
        
        // Start promise chain here
        // localAccountData.resolve();
        // appData.resolve();
        return returnPromise.promise();
    }
    
    static getBootPayload(finishPromise) {
        
        // Prepare the array
        let postArray = {};
        postArray.SID = window.localStorage.getItem("SID");
        postArray.email = window.localStorage.getItem("email");
        
        // Make the backend request
        return $.ajax({
            type: "POST",
            url: Constant.getToolboxURL() + "?intent=3",
            timeout: Constant.AJAX_CFG.timeout * 3, // Added for bigger teams
            data: postArray,
            success: (response) => {
                if (DO_LOG) {
                    console.log("[toolbox-backend.js:getBootPayload()]");
                    console.log(response);
                }
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so we can't initialize
                    if (DO_LOG) {
                        console.log("[toolbox-backend.js:getBootPayload()] UNABLE TO PARSE BOOT PAYLOAD: " + e);
                        finishPromise.resolve(false);
                        return false; // TODO: Change this to a resolved promise or something
                    }
                }
                // Don't continue if there was an error
                if (response.status <= 0) {
                    console.log("[toolbox-backend.js:getBootPayload()] UNABLE TO FETCH BOOT PAYLOAD (" + response.msg + ")");
                    finishPromise.resolve(false);
                    return false; // TODO: Change this to a resolved promise or something
                }
                
                // -- LOCAL STORAGE VALUES -- //
                let storage = window.localStorage;
                storage.setItem("id_user", response.user.id_user);
                if(response.user.id_team > 0) {
                    storage.setItem("id_team", response.user.id_team);
                    storage.setItem("user", response.user);
                    
                    storage.setItem("teamName", response.team.teamName);
                    storage.setItem("school", response.team.schoolName);
                    storage.setItem("id_school", response.team.id_school);
                    storage.setItem("id_coachPrimary", response.team.id_coachPrimary);
                    storage.setItem("id_coachSecondary", response.team.id_coachSecondary);
                    storage.setItem("inviteCode", response.team.inviteCode);
                } else {
                    storage.removeItem("id_team");
                    storage.removeItem("teamName");
                    storage.removeItem("school");
                    storage.removeItem("id_school");
                    storage.removeItem("id_coachPrimary");
                    storage.removeItem("id_coachSecondary");
                    storage.removeItem("inviteCode");
                    
                    finishPromise.resolve(true);
                    return true; // Prevent team pull from happening below if no team exists
                }
                storage.setItem("splitComparisonMethod", "avg"); // "avg" = Average or "med" = Median
                // TODO: Save this via the backend and pull with user account info
                
                
                // -- INSERT INTO FRONTEND DATABASE -- //
                let insertObj = { };
                // Record Definitions
                Constant.recordIdentityInfo = { };
                for (let d = 0; d < response.recordDefinition.length; d++) {
                    insertObj = { };
                    insertObj.unit = response.recordDefinition[d].unit;
                    insertObj.record_identity = response.recordDefinition[d].recordIdentity;
                    dbConnection.insertValuesFromObject("record_definition", insertObj);
                    
                    Constant.recordIdentityInfo[insertObj.record_identity] = {"distance": response.recordDefinition[d].distance};
                }
                
                // User & Athletes
                for(let a = 0; a < response.team.athletes.length; a++) {
                    insertObj = { };
                    insertObj.id_backend = response.team.athletes[a].id_user;
                    insertObj.fname = response.team.athletes[a].fname;
                    insertObj.lname = response.team.athletes[a].lname;
                    insertObj.gender = response.team.athletes[a].gender;
                    dbConnection.insertValuesFromObject("athlete", insertObj);
                    
                    // Records data
                    let recordObj = { };
                    let recordPayload = response.team.records["user-" + insertObj.id_backend];
                    for(let r = 0; r < recordPayload.length; r++) {
                        // Records
                        recordObj = { };
                        recordObj.id_record = recordPayload[r].id_record;
                        recordObj.value = Number(recordPayload[r].value);
                        recordObj.id_record_definition = recordPayload[r].id_recordDefinition;
                        recordObj.is_practice = recordPayload[r].isPractice;
                        recordObj.last_updated = recordPayload[r].lastUpdated;
                        dbConnection.insertValuesFromObject("record", recordObj);
                        
                        // Record-User Link
                        recordObj = { };
                        recordObj.id_record = recordPayload[r].id_record;
                        recordObj.id_backend = insertObj.id_backend;
                        dbConnection.insertValuesFromObject("record_user_link", recordObj);
                    }
                    
                    // Splits data
                    let splitObj = { };
                    let splitPayload = response.team.splits["user-" + insertObj.id_backend];
                    for (let s = 0; s < splitPayload.length; s++) {
                        splitObj = { };
                        splitObj.id_split = splitPayload[s].id_split;
                        splitObj.id_record = splitPayload[s].id_record;
                        splitObj.value = Number(splitPayload[s].value);
                        splitObj.split_name = splitPayload[s].name;
                        // Older versions stored just the distance as the name; manually add the words here if applicable
                        if (!isNaN(Number(splitObj.split_name))) {
                            splitObj.split_name = splitObj.split_name + "m Split";
                        }
                        splitObj.split_index = splitPayload[s].splitIndex;
                        splitObj.last_updated = splitPayload[s].lastUpdated;
                        dbConnection.insertValuesFromObject("record_split", splitObj);
                    }
                }
                
                // insertObj.fname = response.user.fname;
                // insertObj.lname = response.user.lname;
                // insertObj.gender = response
                // dbConnection.insertValuesFromObject("athlete", response.user);
                finishPromise.resolve(true);
                return true;
            },
            error: (error) => {
                if (DO_LOG) {
                    console.log("[toolbox-backend.js:getBootPayload()] " + error);
                    console.log(error);
                }
                finishPromise.resolve(false);
                return false; // TODO: Change this to a resolved promise or something
            }
        });
    }
    
    /**
     * Pulls all of the records from a specific table from the backend and inserts
     * them into the corresponding frontend table. Since some of the column names
     * differ between the databases, an optional (and recommended) backToFrontKeyPairs object
     * can be used to link the backend names with the frontend to help with insertion.
     * 
     * @example Coming soon to Theatres
     * 
     * @param {String} backendTableName name of the table on the backend to pull from
     * @param {String} frontendTableName name of the table on the frontend to insert into
     * @param {Object} criteria object with key and values to narrow results (e.g. id_user: 4)
     * @param {Array | Object} backToFrontKeyPairs object linking the frontend database indices to the backend column names;
     * can also be used as a 1D array to specify column names if they match the backend
     */
    static insertBackendTable(backendTableName, frontendTableName, criteria, backToFrontKeyPairs) {
        
        let storage = window.localStorage;

        // Prepare the array
        let postArray = {};
        postArray.SID = storage.getItem("SID");
        postArray.searchIn = backendTableName;
        postArray.isStrict = true;
        postArray.criteria = criteria;

        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getToolboxURL() + "?intent=0",
            timeout: Constant.AJAX_CFG.timeout * 3, // Added for bigger teams
            data: postArray,
            success: (response) => {
                if (DO_LOG) {
                    console.log("[toolbox-backend.js:insertBackendTable()]");
                    console.log(response);
                }
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so we can't insert
                    if (DO_LOG) {
                        console.log("[toolbox-backend.js:insertBackendTable()] UNABLE TO PULL BACKEND TABLE " + backendTableName);
                        return false; // TODO: Change this to a resolved promise or something
                    }
                }
                
                // Don't continue if there was an error (or no results)
                if(response.status <= 0) {
                    console.log("[toolbox-backend.js:insertBackendTable()] UNABLE TO PULL " + backendTableName + " (" + response.msg + ")");
                    return false; // TODO: Change this to a resolved promise or something
                }
                if(response.substatus == 2) {
                    console.log("[toolbox-backend.js:insertBackendTable()] No results for " + backendTableName);
                    return false; // TODO: Change this to a resolved promise or something
                }
                
                // If backToFrontKeyPairs is a 1-D array, convert it to an object to standardize the process
                if(Array.isArray(backToFrontKeyPairs)) {
                    let newObj = { };
                    let currentValue = "";
                    // Basically, make the key and its value equal. The loop below is assuming
                    // that the key is the backend name and the value is the frontend name, so setting
                    // them equal in this object means they're the same on the front and backend
                    for(let c = 0; c < backToFrontKeyPairs.length; c++) {
                        currentValue = backToFrontKeyPairs[c];
                        newObj[currentValue] = currentValue;
                    }
                    backToFrontKeyPairs = newObj;
                }
                
                // -- INSERT INTO FRONTEND DATABASE -- //
                // Create an object to pipe the backend data in to
                let insertObj = [];
                let backendKeys = Object.keys(backToFrontKeyPairs);
                let dataValue = "";
                for(let m = 0; m < response.matches.length; m++) { // Loop through all matches
                    let currentEntry = { };
                    for(let k = 0; k < backendKeys.length; k++) { // Loop through all specified keys
                        // Get data for this match (m) with the key from backendKeys (k)
                        dataValue = response.matches[m][backendKeys[k]];
                        // Parse as float if applicable
                        if((!isNaN(dataValue)) && (!isNaN(parseFloat(dataValue)))) {
                            dataValue = parseFloat(dataValue);
                        }
                        
                        // Get the frontend column name \/ and set equal to value
                        currentEntry[backToFrontKeyPairs[backendKeys[k]]] = dataValue;
                    }
                    insertObj.push(currentEntry);
                }
                
                dbConnection.insertValuesFromObject(frontendTableName, insertObj);
            },
            error: (error) => {
                if (DO_LOG) {
                    console.log("[toolbox-backend.js:insertBackendTable()] " + error);
                    console.log(error);
                }
                return false; // TODO: Change this to a resolved promise or something
            }
        });
        
    }
    
    
    
    /**
     * Pulls any and all of the information stored on the backend
     * that is vital for the logged in user (specified by the local storage
     * variable "email"). If "email" isn't set, the promise will be rejected.
     * However, if it is set, a promise will be returned that will complete
     * after all of the ajax requests have completed.
     * NOTE: This is the ONLY method that should be called. The other "pull"
     * functions are for internal use by this function only!
     * 
     * @example ToolboxBackend.pullFromBackend().then(function() { // SUCCESS }).catch(function() { // FAIL });
     * 
     * @returns
     * A promise that will indicate when an operation fails or when
     * the data sync has been completed.
     * 
     * @deprecated Replaced by syncFrontendDatabase do to cleaner code
     */
    static pullFromBackendOld() {
        dbConnection.createNewTables();

        // Make sure the email is valid
        let email = localStorage.getItem("email");
        if ((email == null) || (email == undefined)) {
            // TODO: Either log them out or attempt to find the email
            return new Promise((resolve, reject) => {
                reject();
            })
        }

        let pullState = $.Deferred();

        // As of right now, these calls must happen sequentially in a synchronous
        // fashion. If not, it causes the stats and team page to initialize
        // before the database is fully populated
        ToolboxBackend.pullForStorage().then(() => {
            ToolboxBackend.pullForDatabase().then(() => {
                pullState.resolve();
            }).catch(() => {
                pullState.reject();
            });
        }).catch(() => {
            pullState.reject();
        });
        // ToolboxBackend.pullForDatabase().then(() => {
        //     pullState.resolve();
        // }).catch(() => {
        //     pullState.reject();
        // });

        return pullState.promise(); // Return the promise to allow for .then() and .catch()
    }

    /**
     * Submits the necessary backend requests to populate all of the
     * available local storage variables. This function NEEDS to be run
     * before the more general pullFromBackend() function is called since
     * many of the backend functions rely on local storage values (that
     * are left undefined due to the nature of asynchronous functions)
     * 
     * @returns
     * A promise and will resolve() when all requests have completed.
     * 
     * @deprecated Replaced by syncFrontendDatabase do to cleaner code
     */
    static pullForStorage() {

        // First, check to see if a valid email is defined (duplicate check, but better safe than sorry)
        let storage = window.localStorage;
        let email = storage.getItem("email");
        if ((email == null) || (email == undefined)) {
            // TODO: Either log them out or attempt to find the email
            return new Promise((resolve, reject) => {
                reject();
            })
        }

        // Then, start submitting ajax requests
        let ajaxRequest = -1; // Ajax object pushed into the array
        let ajaxArray = []; // Used to resolve the promise to signal completion

        // USER //
        ajaxRequest = AccountBackend.getAccount((userInfo) => {
            if (userInfo.status > 0) {
                // Update team ID
                if (userInfo.id_team > 0) {
                    storage.setItem("id_team", userInfo.id_team);
                    storage.setItem("user", userInfo);
                } else {
                    storage.removeItem("id_team");
                }
            }
        });
        ajaxArray.push(ajaxRequest);

        // TEAM //
        ajaxRequest.promise().then(() => { // Need the promise since account pull defined id_team
            if (storage.getItem("id_team") != null) {
                // Update team info (like team name)
                ajaxRequest = TeamBackend.getTeamInfo((teamInfo) => {
                    if (teamInfo.status > 0) {
                        localStorage.setItem("id_team", teamInfo.id_team);
                        localStorage.setItem("teamName", teamInfo.teamName);
                        localStorage.setItem("school", teamInfo.schoolName);
                        localStorage.setItem("id_school", teamInfo.id_school);
                        localStorage.setItem("id_coachPrimary", teamInfo.id_coachPrimary);
                        localStorage.setItem("id_coachSecondary", teamInfo.id_coachSecondary);
                        localStorage.setItem("inviteCode", teamInfo.inviteCode);

                        // get the contact info of the coach

                    } else {
                        if (teamInfo.substatus == 7) {
                            // This is the code for an invalid team ID
                            // If this occurs, the team was likely deleted, so update the frontend as well
                            storage.removeItem("id_team");
                            storage.removeItem("teamName");
                            storage.removeItem("school");
                            storage.removeItem("id_school");
                            storage.removeItem("inviteCode");
                        }
                    }
                });
                ajaxArray.push(ajaxRequest);
            } else {
                if (DO_LOG) {
                    console.log("[toolbox-backend.js:pullForStorage()] teamId was null");
                }
            }
        });

        ajaxRequest = TeamBackend.getTeamRoster("fname lname gender id_user email cellNum", (teamResponse) => {
            if (teamResponse.status > 0) {

                for (let i = 0; i < teamResponse.athletes.length; i++) {
                    const element = teamResponse.athletes[i];

                    if (element.id_user == localStorage.getItem("id_coachPrimary")) {
                        localStorage.setItem("coachEmail", element.email);
                        localStorage.setItem("coachPhoneNumber", element.cellNum);
                    }
                }
            }
        });

        // RECORDS //
        // No local storage integration for records at this time
        
        // PLAN //
        ajaxRequest = PlanBackend.getMembershipStatus(email, (membership) => {
            
            if(membership.status > 0) {
                
                if(membership.canUseApp) {
                    storage.setItem("validMembership", "true");
                } else {
                    storage.setItem("validMembership", "false");
                }
                
            } else {
                if (DO_LOG) {
                    console.log("[toolbox-backend.js:pullForStorage()] Unable to get Membership status");
                }
            }
        });
        ajaxArray.push(ajaxRequest);
        
        // Call a function (likely pullForDatabase()) when the pull finishes
        return new Promise((resolve, reject) => {
            $.when(...ajaxArray).then(resolve);
        });

    }

    /**
     * Pulls of the information needed to populate the DATABASE (and ONLY
     * the database, not local storage). It is necessary to split these up
     * in order to ensure the required local storage values (like id_team)
     * are set.
     * 
     * @returns
     * A promise and will resolve() when all requests have completed.
     * 
     * @deprecated Replaced by syncFrontendDatabase do to cleaner code
     */
    static pullForDatabase() {

        let storage = window.localStorage;
        let email = storage.getItem("email");
        let ajaxRequest = -1; // Ajax object pushed into the array
        let ajaxCalls = []; // Used to resolve the promise to signal completion

        // For safety, check email
        if ((email == null) || (email == undefined)) {
            // TODO: Either log them out or attempt to find the email
            return new Promise((resolve, reject) => {
                reject();
            })
        }

        // USER //
        ajaxRequest = AccountBackend.getAccount((userInfo) => {
            if (userInfo.status > 0) {
                // Add in any database operations here
            }
        });
        ajaxCalls.push(ajaxRequest);

        // TEAM //
        if ((storage.getItem("id_team") != null) && (storage.getItem("id_team") != undefined)) {
            // Update team info (like team name)
            ajaxRequest = TeamBackend.getTeamInfo((teamInfo) => {
                if (teamInfo.status > 0) {
                    // Put any database insertion here (BUT NOT local storage)
                }
            });
            ajaxCalls.push(ajaxRequest);

            // Update athletes database table
            ajaxRequest = TeamBackend.getTeamRoster("fname lname gender id_user email", (teamResponse) => {
                if (teamResponse.status > 0) {

                    if ("primaryCoach" in teamResponse) {
                        dbConnection.insertValues("athlete", [
                            teamResponse.primaryCoach.fname,
                            teamResponse.primaryCoach.lname,
                            (teamResponse.primaryCoach.gender).toLowerCase(),
                            teamResponse.primaryCoach.id_user
                        ]);
                        // Pull the records for them and insert
                        ajaxCalls.push(ToolboxBackend.pullAndInsertRecords(teamResponse.primaryCoach.email));
                    }
                    if ("secondaryCoach" in teamResponse) {
                        dbConnection.insertValues("athlete", [
                            teamResponse.secondaryCoach.fname,
                            teamResponse.secondaryCoach.lname,
                            (teamResponse.secondaryCoach.gender).toLowerCase(),
                            teamResponse.secondaryCoach.id_user
                        ]);
                        // Pull their records and insert
                        ajaxCalls.push(ToolboxBackend.pullAndInsertRecords(teamResponse.secondaryCoach.email));
                    }

                    // Add in athletes
                    if ("athletes" in teamResponse) {
                        let currentAthlete = {};
                        for (let a = 0; a < teamResponse.athletes.length; a++) {
                            currentAthlete = teamResponse.athletes[a];
                            dbConnection.insertValues("athlete", [
                                currentAthlete.fname,
                                currentAthlete.lname,
                                (currentAthlete.gender).toLowerCase(),
                                currentAthlete.id_user
                            ]);
                            // Pull their records and insert into the database
                            ajaxCalls.push(ToolboxBackend.pullAndInsertRecords(currentAthlete.email));
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
     * 
     * @deprecated Replaced by syncFrontendDatabase do to cleaner code
     */
    static pullAndInsertRecords(email) {
        return RecordBackend.getRecord({
            "accountIdentity": {
                "email": email
            }
        }, (recordResponse) => {
            // Check status
            if (recordResponse.status < 0) {
                if (DO_LOG) {
                    console.log("[toolbox-backend.js:pullFromBackend()]: Unable to pull records!");
                }
            } else {

                let recordArray = [];
                let linkDataArray = [];

                // Make sure there is at least 1 record returned
                if ("result" in recordResponse) {
                    let pulledResult = {};
                    for (let r = 0; r < recordResponse.result.length; r++) {
                        pulledResult = recordResponse.result[r]; // Hehe, pulled pork

                        // the next time you need to add a column, add it as an object key:pair
                        let recordData = {
                            "id_record": pulledResult.id_record,
                            "id_record_definition": pulledResult.id_recordDefinition,
                            "value": Number(pulledResult.value),
                            "is_practice": pulledResult.isPractice,
                            "is_split": pulledResult.isSplit,
                            "id_split": pulledResult.splitNumber,
                            "id_split_index": pulledResult.splitIndex,
                            "last_updated": pulledResult.lastUpdated
                        };

                        recordArray.push(recordData);

                        // Link any and all athletes to this record
                        let linkData = {
                            "id_record": pulledResult.id_record
                        };
                        for (let u = 0; u < pulledResult.users.length; u++) {
                            linkData.id_backend = pulledResult.users[u];

                            linkDataArray.push(linkData);
                        }

                    } // End of for loop for results

                    dbConnection.insertValuesFromObject("record", recordArray);
                    dbConnection.insertValuesFromObject("record_user_link", linkDataArray);

                }
            } // End of status check
        });
    }

    /**
     * Updates the URL endpoints that the app uses to connect to the server.
     * Since we aren't forcing users to update the app every time we push an
     * update, we should be able to offer backwards campatability, which requires
     * specifying where to make requests to in case we update or change it in the future.
     */
    static setBackendPathConstant() {

        // Prepare the request
        let postArray = {};
        postArray.SID = localStorage.getItem("SID");
        postArray.appVersion = AppVersion.version;

        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getToolboxURL() + "?intent=1",
            timeout: Constant.AJAX_CFG.timeout,
            data: postArray,
            success: (response) => {
                if (DO_LOG) {
                    console.log("[toolbox-backend.js:setBackendPathConstant()] " + response);
                }
                try {
                    response = JSON.parse(response);
                    if (response.path != null) {
                        Constant.BACKEND_PATH = response.path;
                    }
                } catch (e) {
                    // Couldn't parse, so just use string
                }
            },
            error: (error) => {
                if (DO_LOG) {
                    console.log("[toolbox-backend.js:setBackendPathConstant()] ERROR: " + error);
                    console.log(error);
                }
            }
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
        postArray.criteria = {
            "id_school": schoolId
        };

        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getToolboxURL() + "?intent=0",
            timeout: Constant.AJAX_CFG.timeout,
            data: postArray,
            success: (response) => {
                if (DO_LOG) {
                    console.log("[toolbox-backend.js:getUSersInSchool()] " + response);
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
                    console.log("[toolbox-backend.js:getUSersInSchool()] " + error);
                }
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
        if (sessionId.length == 0) {
            sessionId = storage.getItem("SID");
        }

        // Prepare the array
        let postArray = {};
        postArray.SID = storage.getItem("SID"); // Kind of silly, but still needed
        postArray.searchIn = "user_session_data";
        postArray.criteria = {
            "SID": sessionId
        };

        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getToolboxURL() + "?intent=0",
            timeout: Constant.AJAX_CFG.timeout,
            data: postArray,
            success: (response) => {
                if (DO_LOG) {
                    console.log("[toolbox-backend.js:getUserBySID()] " + response);
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
                    console.log("[toolbox-backend.js:getUserBySID()] " + error);
                }
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
        postArray.criteria = {
            "name": searchName
        };

        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.getToolboxURL() + "?intent=0",
            timeout: Constant.AJAX_CFG.timeout,
            data: postArray,
            success: (response) => {
                if (DO_LOG) {
                    console.log("[toolbox-backend.js:searchForSchool()] " + response);
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
                    console.log("[toolbox-backend.js:searchForSchool()] " + error);
                }
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

        for (let k = 0; k < valueKeys.length; k++) {
            let key = valueKeys[k];

            if ((storage.getItem(key) != undefined) && (storage.getItem(key) != null)) {
                let value = storage.getItem(key);
                if ((typeof value == "string") && (value.length > 0)) {
                    // Filter with a generic regex (replace most special characters)
                    returnArray[key] = value.replace(Constant.getReplaceRegex(Constnat.REGEX.generic), "");

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

    /**
     * Centralized method for inviting users to a team. It will display any
     * appropriate error (or success) messages. This differs from
     * TeamBackend's inviteAthlete in that it sanitizes the email
     * and displays error popups. Handy for usage throughout the
     * app, not just in the team page.
     * 
     * @param {String} email email address to send an invite to
     */
    static inviteAthleteWithFeedback(email) {
        // Validate again just to be safe
        let emailMatch = email.match(Constant.REGEX.emailParts);
        if (emailMatch == null) {
            Popup.createConfirmationPopup("Invalid email, please try again", ["OK"], [() => {}]);
            return;
        } else if (emailMatch[0].length != email.length) {
            Popup.createConfirmationPopup("Invalid email, please try again", ["OK"], [() => {}]);
            return;
        }

        TeamBackend.inviteToTeam(email, (response) => {
            if (response.status > 0) {
                if (response.substatus == 2) {
                    Popup.createConfirmationPopup("Athlete is already apart of this team", ["OK"], [() => {}]);
                } else {
                    Popup.createConfirmationPopup("Successfully invited!", ["OK"], [() => {}]);
                }
            } else {
                if (response.substatus == 3) {
                    Popup.createConfirmationPopup("Team is locked! Please unlock to invite athletes", ["Unlock Now", "Unlock Later"],
                        [() => {
                            // TODO: Unlock the team
                        }, () => {}]); // End of Popup callbacks
                } else if (response.substatus == 4) {
                    Popup.createConfirmationPopup("Invalid email, please try again", ["OK"], [() => {}]);
                } else {
                    Popup.createConfirmationPopup("We're sorry, an error occured. Please try again later", ["OK"], [() => {}]);
                }
            }
        });
    }
    
    static createAthleteWithFeedback(fname, lname, gender, email = "") {
        let faultMessage = "";
        // Clean submitted values because you can never be too safe...
        fname = fname.replace(Constant.getReplaceRegex(Constant.REGEX.humanNameSingle), "");
        lname = lname.replace(Constant.getReplaceRegex(Constant.REGEX.humanNameSingle), "");
        if((fname == false) || (lname == false)) {
            faultMessage = "Name is invalid, please try again";
        } else if((fname.length < 2) || (lname.length < 2)) {
            faultMessage = "Name is invalid, please try again";
        }
        if(gender == false) { // Sanitize as much as possible and default to male if invalid
            gender = "M";
        } else if(gender.length != 1) {
            gender = gender.subtr(0, 1).toUpperCase();
        }
        if(!((gender == "M") || (gender == "F"))) {
            gender = "M";
        }
        
        // Check to see if email was provided and is valid
        let providedEmail = true;
        let emailMatch = email.match(Constant.REGEX.emailParts);
        if (emailMatch == null) {
            providedEmail = false;
        } else if (emailMatch[0].length != email.length) {
            providedEmail = false;
        }
        if(!providedEmail) {
            email = ""; // Set to blank string to prevent it causing errors in addToTeam()
        }
        
        // Define feedback function (maybe move to Constant at some later point?)
        let feedbackFn = function(response) {
            if(response.status > 0) {
                if(response.substatus == 2) {
                    Popup.createConfirmationPopup("Athlete is already on this team", ["OK"], [() => { }]);
                } else {
                    // If a new user was created, this key will be present. Add them to the local DB
                    let action = "invited";
                    if("invitedInfo" in response) {
                        let newAthleteInfo = response.invitedInfo;
                        newAthleteInfo["id_backend"] = newAthleteInfo["id_user"];
                        delete newAthleteInfo["id_user"];
                        if("email" in newAthleteInfo) {
                            delete newAthleteInfo["email"];
                        }
                        dbConnection.insertValuesFromObject("athlete", response.invitedInfo);
                        
                        action = "added";
                    }
                    Popup.createConfirmationPopup("Successfully " + action + "!", ["OK"], [() => { }]);
                }
            } else {
                if(response.substatus == 3) {
                    Popup.createConfirmationPopup("Team is locked! Please unlock to invite athletes", ["Unlock Now", "Unlock Later"],
                        [() => {
                            TeamBackend.lockTeam((response) => {
                                if((response.status > 0) && (response.isLocked == false)) {
                                    Popup.createConfirmationPopup("Success! You can now add athletes!", ["OK"], [() => { }]);
                                } else {
                                    Popup.createConfirmationPopup("We're sorry, an error occured. Please try again later", ["OK"], [() => { }]);
                                }
                            });
                        }, () => { }]); // End of Popup callbacks
                } else if(response.substatus == 4) {
                    Popup.createConfirmationPopup("Invalid email, please try again", ["OK"], [() => { }]);
                } else {
                    Popup.createConfirmationPopup("We're sorry, an error occured. Please try again later", ["OK"], [() => { }]);
                }
            }
        }
        
        // If both athlete info and email were provided, invite with both
        if((faultMessage.length == 0) && (providedEmail)) {
            TeamBackend.addToTeam(fname, lname, gender, email, feedbackFn);
        } else if((faultMessage.length == 0) && (!providedEmail)) { // Only athlete info
            TeamBackend.addToTeam(fname, lname, gender, "", feedbackFn);
        } else if((faultMessage.length > 0) && (providedEmail)) { // Only email
            TeamBackend.inviteToTeam(email, feedbackFn);
        } else { // Error
            Popup.createConfirmationPopup(faultMessage, ["OK"], [() => { }]);
            return;
        }
    }

}
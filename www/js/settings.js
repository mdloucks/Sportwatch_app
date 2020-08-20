/**
 * @classdesc this is the settings page for out app
 * @class
 */
class Settings extends Page {
    // TODO: !! Convert to PageTransition compliant class !!
    constructor(id, pageSetObj) {
        super(id, "Settings");

        this.pageController = pageSetObj;

        this.currentPageId = "catagoryPage";

        // ---- PAGES ---- //

        this.catagoryPage = (`
            <div id="catagoryPage" class="div_page">
                <div class="generic_header">
                    <div></div>
                    <h1>Settings</h1>
                    <div></div>
                </div>
                
                <div id="cat_options">
                    <!-- Buttons will be inserted here -->
                </div>
            </div>
        `);


        // https://jsbin.com/lodusuyipo/edit?html,css,js,output
        this.editPage = (`
            <div id="editPage" class="div_page">
                <div class="generic_header">
                    <div class="back_button">&#9668;</div>
                    <h1 id="editName"></h1>
                    <div></div>
                </div>

                <div id="account_edit_inputs"></div>
            </div>
        `);

        this.pageTransition = new PageTransition("#settingsPage");
        // this.pageController.swipeHandler.addScrollPage("#settingsPage > #settingsPage");

        this.inputDivIdentifier = "#settingsPage #editPage #account_edit_inputs";
        
    } // End of constructor

    getHtml() {
        return (`
            <div id="settingsPage" class="div_page">
                ${this.catagoryPage}
                ${this.editPage}
            </div>
        `);
        //${this.devPage}
    }

    /**
     * @returns {function} the function that is called when the page changes.
     */
    start() {

        // Only add content if it isn't there yet (check if any catagories are there yet)
        // if ($("#settingsPage .cat_button").length) {
        //     return;
        // }
        
        if (this.pageTransition.getPageCount() == 0) {
            this.pageTransition.addPage("catagoryPage", this.catagoryPage, true);
            this.pageTransition.addPage("editPage", this.editPage);
        }

        // each setting category will have its own function to call to specify what happens
        this.accountButtons = {
            "My Account": this.startMyAccount,
            "Team Preferences": this.startTeamPreferences,
            // "Notifications": this.startNotifications,
            "Sign Out": this.startSignOut
            // "Delete Account": this.startDeleteAccount
        };

        // remove team preferences if there is no team.
        if(!this.doesTeamExist()) {
            delete this.accountButtons["Team Preferences"];
        }

        // add the account pages
        $("#settingsPage #cat_options").empty(); // Remove all catagory buttons
        Object.keys(this.accountButtons).forEach((key, index) => {
            this.addSettingCatagory(key, this.accountButtons[key].bind(this));
        });

        // When clicking on input, focus it
        $("#settingsPage #editPage input").click((e) => {
            $(e.target).focus();
        })

        // ---- MISC PAGE LOGIC ---- //

        $("#settingsPage .back_button").click((e) => {
            e.preventDefault();
            $("#settingsPage .cat_button").removeClass("cat_button_selected");
            this.pageTransition.slideRight("catagoryPage");
            // Scroll to the top
            $("#settingsPage").animate({
                scrollTop: 0
            }, 1000);
        });
    }

    stop() {
        // For now, don't unbind because adding the click events back is difficult
        // TODO: Change structure so it can properly unbind
        $("#settingsPage .cat_button").removeClass("cat_button_selected");
        $("#settingsPage").unbind().off();
        $("#settingsPage *").unbind().off();
    }

    /**
     * Init the given page by clearing the html and setting the title
     * 
     * @param {String} name name of the page
     */
    setupSettingsPage(name) {
        $("#settingsPage #editName").html(name);
        $("#settingsPage #editPage #account_edit_inputs").empty();
    }

    // ---- CATAGORY PAGE FUNCTIONS ---- //

    /**
     * Adds a button to a specific settings page with the provided text.
     * 
     * @return void
     * 
     * @example
     * this.addSettingCatagory("Account Settings", () => { alert("Account"); });
     * 
     * @param text {String} text of the button
     * @param callback {Function} callback when button is clicked
     * @param container {String} [default = "#cat_options"] div that buttons
     * will be added to
     */
    addSettingCatagory(text, callback, container = "#cat_options") {

        var buttonHtml = "<button class=\"cat_button\"><p class=\"cat_desc\">" + text +
            "</p><p class=\"cat_arrow\">&#9658</p></button>";
        $(container).append(buttonHtml);
        $(container + " button").last().click((e) => {
            e.preventDefault();

            let clickedElement = $(e.target);
            // If the p element was clicked, ascend to actual button element
            if (!clickedElement.hasClass("cat_button")) {
                clickedElement = clickedElement.parent();
            }

            // If button has not already been pressed
            if (!clickedElement.hasClass("cat_button_selected")) {
                $(clickedElement).addClass("cat_button_selected");
                callback();
            }
        });

        // // Add color animation
        // $(container + " button").last().click((e) => {
        //     e.preventDefault();
        //     $(e.delegateTarget).addClass("cat_button_selected");
        // });
    }

    // ---- PAGE START METHODS ---- //

    startMyAccount() {
        this.setupSettingsPage("My Account");

        // Populate the account fields and prepare edits
        AccountBackend.getAccount((accountInfo) => {

            // May have errored out
            if (accountInfo.status < 0) {
                Popup.createConfirmationPopup("Sorry, an error occured. Please try again later or sign out and re-log in", ["OK"], [() => {
                    this.pageTransition.slideRight("catagoryPage");
                }]);
                return;
            }
            accountInfo = AccountBackend.beautifyResponse(accountInfo);

            let displayNames = {
                "fname": "First Name",
                "lname": "Last Name",
                "gender": "Gender",
                "cellNum": "Phone Number",
                "state": "State",
                "dob": "Date of Birth",
                "email": "Email",
                "password": "New Password",
                "passwordConfirm": "Confirm New Password",
                "passwordOld": "Current Password"
            }; // TODO: Add account type change, and also possibly school change
            // TODO: Make state change a dropdown instead of typing, sanitize to abbreviation

            let ignoredValues = ["status", "substatus", "msg", "id_user", "accountType", "isAdmin",
                "id_school", "id_team", "schoolName", "teamName", "email", "emailVerified",
                "createDate", "lastUpdated", "lastLogin"
            ];

            let sensitiveValues = {
                "email": accountInfo["email"],
                "password": "", // The new password
                "passwordConfirm": "",
                "passwordOld": ""
            };

            // Basic values (not requiring a password)
            ValueEditor.editValues(this.inputDivIdentifier, accountInfo, (newValues) => {
                AccountBackend.updateAccount(newValues, (response) => {

                    if (response.status > 0) { // EDIT SUCCESS
                        Popup.createConfirmationPopup("Successfully saved!", ["OK"], [() => {}]);
                        if ("didSetPassword" in response) {
                            if (response.didSetPassword == 0) {
                                Popup.createConfirmationPopup("Warning: Password was not updated! Please try again", ["OK"], [() => {}]);
                                return;
                            }
                        }
                        response = AccountBackend.beautifyResponse(response);
                        // Populate fields with the updated values
                        $('#editPage input[name="First Name"]').val(response.fname);
                        $('#editPage input[name="Last Name"]').val(response.lname);
                        $('#editPage input[name="Gender"]').val(response.gender);
                        $('#editPage input[name="Phone Number"]').val(response.cellNum);
                        $('#editPage input[name="State"]').val(response.state);
                        $('#editPage input[name="Date of Birth"]').val(response.dob);

                    } else { // EDIT FAILED
                        if (response.substatus == 5) {

                            // Was the response from the backend (contains list of invalid) or frontend
                            if (response.msg.includes(":")) { // BACKEND
                                // Isolate the invalid parameters
                                let invalidParams = response.msg; // Formatted "some params invalid: fnameNew lnameNew ..."
                                invalidParams = invalidParams.substring(invalidParams.indexOf(":") + 2, invalidParams.length);
                                invalidParams = invalidParams.replace(/New/gm, ""); // Remove "New" from variable names
                                invalidParams = invalidParams.replace(/ /gm, ", "); // Add commas for pretty formatting

                                // Convert variable names to human-readable named
                                let keys = Object.keys(displayNames);
                                for (let n = 0; n < keys.length; n++) {
                                    // Replace the key with the display name
                                    invalidParams = invalidParams.replace(keys[n], displayNames[keys[n]]);
                                }

                                Popup.createConfirmationPopup("The following were invalid, please correct to save: " + invalidParams,
                                    ["OK"], [() => {}]);
                            } else { // FRONTEND
                                Popup.createConfirmationPopup("Some parameters were invalid, please try again", ["OK"], [() => {}]);
                            }

                        } else {
                            Popup.createConfirmationPopup("An unknown error occured, please try again later", ["Close"], [() => {}]);
                        }
                    }
                }); // End of Backend callback

            }, ignoredValues, displayNames);

            // Email & Password (requires current password)
            ValueEditor.editValues(this.inputDivIdentifier, sensitiveValues, (newValues) => {

                if (newValues["passwordOld"].length == 0) {
                    Popup.createConfirmationPopup("Please enter your current password", ["OK"], [() => {}]);
                } else if (newValues["passwordNew"] != newValues["passwordNew2"]) {
                    Popup.createConfirmationPopup("New passwords do not match", ["OK"], [() => {}]);
                } else {
                    let currentPassword = newValues["passwordOld"];
                    delete newValues["passwordOld"];
                    // Delete since backend doesn't need verification
                    delete newValues["passwordConfirm"];

                    // Submit the backend request if frontend checks passed
                    AccountBackend.updateAccount(newValues, (response) => {
                        if (("didSetPassword" in response) && (response.didSetPassword == 1)) {
                            Popup.createConfirmationPopup("Successfully updated!", ["OK"], [() => {}]);

                        } else { // Failure
                            if (response.substatus == 5) {
                                Popup.createConfirmationPopup("Email or password were incorrectly formatted, please try again",
                                    ["Close"], [() => {}]);
                            } else if (response.substatus == 6) {
                                Popup.createConfirmationPopup("Incorrect password, please try again", ["Close"], [() => {}]);
                            } else {
                                Popup.createConfirmationPopup("An unknown error occured, please try again later", ["Close"], [() => {}]);
                            }
                        }
                    }, currentPassword);
                } // End of edit handling if statement

            }, [], displayNames);
        }); // End of population function

        this.pageTransition.slideLeft("editPage");
        $("#settingsPage #editPage").animate({
            scrollTop: 0
        }, 1000);
    }

    startTeamPreferences() {
        let storage = window.localStorage;

        this.setupSettingsPage("Team Preferences");
        
        // Use local storage variables at first, but pull team data later
        // (see end of function for the backend pull)
        
        // ---- BUTTONS / INTERFACE SETUP ---- //
        
        // LEAVE TEAM BUTTON (only setting given to non-coaches)
        $(this.inputDivIdentifier).append(`
            <br><button class="generated_button" style="background-color: #dd3333" id="leave_team_button">Leave Team</button>
            <hr>
        `);
        
        // BASIC INFO
        // TODO: add more fields here
        let valuesToEdit = {
            "Team Name": storage.getItem("teamName"),
            "School": storage.getItem("school"),
        };
        if(valuesToEdit["Team Name"] == null) {
            valuesToEdit["Team Name"] = "";
        }
        if(valuesToEdit["School"] == null) {
            valuesToEdit["School"] = "";
        }
        // Used for editing logic later
        let isNameValid = true;
        let schoolId = storage.getItem("id_school");
        
        ValueEditor.editValues(this.inputDivIdentifier, valuesToEdit, (newValues) => {
            $("#settingsPage #editPage #changeTeamButton").prop("disabled", true);
            
            // Pre-backend filtering
            let newName = newValues["Team Name"];
            newName = newName.replace(/[^A-Za-z0-9\- ]/gm, "");
            if(newName.length < 5) {
                Popup.createConfirmationPopup("The team name is too short, please try adding to it.", ["OK"]);
            } else if(newName > 75) {
                Popup.createConfirmationPopup("The team name is too long, please shorten it.", ["OK"]);
            }
            
            let newRequest = -1;
            let saveRequests = [];
            let errorMessage = ""; // Use for popup error later
            
            // If team name was changed, submit the request
            if(valuesToEdit["Team Name"] != newName) {
                newRequest = TeamBackend.changeTeamName(newName, (r) => {
                    if(r.status > 0) {
                        storage.setItem("teamName", newName);
                    } else {
                        if(r.substatus == 3) {
                            errorMessage = "Only coaches can change the team name";
                        } else if(r.substatus == 4) {
                            errorMessage = "Team name was invalid, please try again";
                        } else {
                            errorMessage = "Sorry, an unknown error occured";
                        }
                    }
                });
                saveRequests.push(newRequest);
            }
            
            // School change
            if(valuesToEdit["School"] != newValues["School"]) {
                newRequest = TeamBackend.changeTeamSchool(schoolId, (r) => {
                    if(r.status > 0) {
                        storage.setItem("id_school", r.id_school);
                        storage.setItem("school", r.schoolName);
                    } else {
                        if(r.substatus == 3) {
                            errorMessage = "Only coaches can change the team's school";
                        } else if(r.substatus == 4) {
                            errorMessage = "We couldn't find that school, please try again";
                        } else {
                            errorMessage = "Sorry, an unknown error occured";
                        }
                    }
                });
                saveRequests.push(newRequest);
            }
            
            // Notify the user upon finish
            $.when(...saveRequests).then(() => {
                if(errorMessage.length == 0) { // Defined above
                    Popup.createConfirmationPopup("Team data successfully updated!", ["OK"]);
                } else {
                    Popup.createConfirmationPopup(errorMessage, ["OK"]);
                }
            });
            
        });
        // Add the school search results in this div \/
        $('#settingsPage #editPage input[name="School"]').after(`<div id="searchList" class="noResults"></div>`);
        $("#settingsPage #editPage .generated_button:last").prop("id", "changeTeamButton");
        $("#settingsPage #editPage #changeTeamButton").prop("disabled", true); // Disable until edited
        $(this.inputDivIdentifier).append(`<hr>`);
        
        // INVITE CODE
        let teamCode = "Unkown";
        if(storage.getItem("inviteCode") != null) {
            teamCode = storage.getItem("inviteCode");
        }
        $(`${this.inputDivIdentifier}`).append(`
            <div id="inviteCode" class="subheading_text">Invite Code: <span class="underline">${teamCode}<span></div>
        `)
        
        // INVITE VIA EMAIL
        $(`${this.inputDivIdentifier}`).append(`
            <div class="sectionWrapper">
                <h1 id="h1_emailInvite">Invite via Email</h1>
                <input id="input_athleteEmail" class="sw_text_input" type="text" placeholder="randy@sportwatch.us"></input>
                <br>
                <button id="button_sendInvite" class="sw_button" disabled>Invite</button>
            </div><br><br><br><br>
            <hr>
        `);
        
        // ---- LOGIC ---- //
        
        // LEAVE TEAM
        $(`${this.inputDivIdentifier} #leave_team_button`).click(() => {
            Popup.createConfirmationPopup("Are you sure you want to leave your team?", ["Yes", "No"], [() => {
                TeamBackend.leaveTeam((result) => {

                    // If succeeded, re-pull data and notify user
                    if (result.status > 0) {
                        // Store email and SID, then clear everything else
                        let email = localStorage.getItem("email");
                        let sessionId = localStorage.getItem("SID");
                        localStorage.clear();
                        localStorage.setItem("email", email);
                        localStorage.setItem("SID", sessionId);

                        ToolboxBackend.pullFromBackend().then(() => {
                            if (DO_LOG) {
                                console.log("[settings.js]: Backend sync finished!");
                            }
                        }).catch(function () {
                            if (DO_LOG) {
                                console.log("[settings.js]: Failed to pull from backend, localStorage email: " + localStorage.getItem("email"));
                            }
                        });
                        Popup.createConfirmationPopup("You have successfully left the team", ["OK"], [() => {
                            // Slide away so they aren't in the team page anymore
                            this.pageTransition.slideRight("catagoryPage");
                            // Remove the Team Peferences option (the one that's selected)
                            $("#settingsPage .cat_button.cat_button_selected").remove();
                        }]);

                        // Failure, let them know why
                    } else {
                        if (result.msg.indexOf("coach") != -1) {
                            // TODO: Add options to delete team or nominate other coaches
                            Popup.createConfirmationPopup("You're the only coach! You can't leave the team", ["OK"]);
                        } else {
                            Popup.createConfirmationPopup("We're sorry, an error occured on our end. Please try later", ["OK"]);
                        }
                    }
                });
                // End of leave action
            }, () => {
                // no action, they decided not to leave
            }])
        });
        
        // GENERAL INFO EDITING
        // Name input
        this.addInputCheck('#editPage input[name="Team Name"]', 5, 45, /[A-Za-z0-9& ]/gm, false, (isValid) => {
            if((isValid) && (schoolId > 0)) {
                $("#settingsPage #editPage #changeTeamButton").prop("disabled", false);
            }
        }, () => {
            document.activeElement.blur(); // On enter press
        });
        
        // School input
        $('#settingsPage #editPage input[name="School"]').on("input", (e) => {
            let input = $('#settingsPage #editPage input[name="School"]').val();
            
            // User must select a dropdown option, do disable Change button until then
            schoolId = -1;
            
            input = input.replace(/[^A-Za-z0-9. ]/gm, "");
            // Search for schools with the given input
            ToolboxBackend.searchForSchool(input, 10, (response) => {
                if (response.status > 0) {
                    if (response.substatus == 2) { // No matches, clear list and generate nothing
                        this.generateSearchResults([]); // No options, so no need to resolve promise
                        // Hide the search list since there are no results
                        let searchList = $("#settingsPage #editPage #searchList");
                        if(!searchList.hasClass("noResults")) { // Only show if not already hidden
                            searchList.addClass("noResults");
                        }
                    } else {
                        // Show and generate the list
                        $("#settingsPage #editPage #searchList").removeClass("noResults");
                        this.generateSearchResults(response.matches).then((selectedId) => {
                            $("#settingsPage #editPage #searchList").addClass("noResults");
                            schoolId = selectedId;
                            if(isNameValid) {
                                $("#settingsPage #editPage #changeTeamButton").prop("disabled", false);
                            }
                        });
                        // And hide the results after being clicked on
                        $("#settingsPage #editPage #searchList").removeClass("noResults");
                    }
                } // End of status check. Nothing we can do really if this fails
                
            });
        });
        
        // INVITE VIA EMAIL
        // Check input
        this.addInputCheck("#input_athleteEmail", 5, 65, /[A-Za-z0-9.@\-_]/gm, false, (invitedValid) => {

            let inputEmail = $(`${this.inputDivIdentifier} #input_athleteEmail`).val().trim();
            if (inputEmail.length > 0) {
                // Make sure email has all necessary parts (if given)
                let emailValidMatch = inputEmail.match(/[A-Za-z0-9\-_.]*@[A-Za-z0-9\-_.]*\.(com|net|org|us|website|io)/gm);
                if (emailValidMatch == null) {
                    invitedValid = false;
                } else if (emailValidMatch[0].length != inputEmail.length) {
                    invitedValid = false;
                }

                $(`${this.inputDivIdentifier} #button_sendInvite`).prop("disabled", !invitedValid);
            }
        }, () => { // On enter press
            document.activeElement.blur();
            $(`${this.inputDivIdentifier} #button_sendInvite`).trigger("click");
        });
        // Send email
        $(`${this.inputDivIdentifier} #button_sendInvite`).click((e) => {
            $(`${this.inputDivIdentifier} #button_sendInvite`).prop("disabled", true);
            
            let invitedEmail = $(`${this.inputDivIdentifier} #input_athleteEmail`).val();
            ToolboxBackend.inviteAthleteWithFeedback(invitedEmail);
            console.log("sent invite to " + invitedEmail);
        });
        
        
        let values = {}; // Used for the various database functions below
        
        // KICK ATHLETE
        // this function will be called when a athlete is selected for deletion
        let deleteAthlete = (rowid, id_backend) => {

            Popup.createConfirmationPopup("Are you sure you want to delete this athlete?", ["Yes", "No"], [() => {
                dbConnection.deleteValues("athlete", "WHERE rowid = ?", [rowid]);

                // TODO: seth please delete athlete
                console.log("delete " + id_backend);

            }, () => {
                // no action
            }]);
        }

        // generate select form to select an athlete, and pass its rowid to deleteAthlete
        dbConnection.selectValues("SELECT *, rowid FROM athlete").then((athletes) => {

            for (let i = 0; i < athletes.length; i++) {
                values[`${athletes.item(i).fname} ${athletes.item(i).lname}`] = athletes.item(i).rowid;
            }

            ButtonGenerator.generateSelectForm(`${this.inputDivIdentifier}`, "Remove athlete from team", "Remove Selected Athlete", values, function (form) {
                dbConnection.selectValues("SELECT id_backend FROM athlete WHERE rowid = ?", [$(form).val()]).then((athlete) => {
                    deleteAthlete($(form).val(), athlete.item(0).id_backend);
                });
            });
        });
        
        // LOCK TEAM
        ButtonGenerator.generateToggle(`${this.inputDivIdentifier}`, "Lock Team", function () {
            this.toggleLockWithFeedback();
        }.bind(this), function() {
            this.toggleLockWithFeedback();
        }.bind(this));
        $("#settingsPage #editPage .switch_container:last").prop("id", "lockTeamToggle"); // Add ID
        $("#settingsPage #editPage #lockTeamToggle").find(".switch").css("float", ""); // Clear float
        
        // Slide the page, we're ready to show the user
        this.pageTransition.slideLeft("editPage");
        $("#settingsPage #editPage").animate({
            scrollTop: 0
        }, 1000);
        
        
        // ---- BACKEND PULL ---- //
        
        // Now that the user has something to see, update the values via backend
        TeamBackend.getTeamInfo((teamData) => {
            if(teamData.status > 0) {
                // Values to set:
                //    teamName, school, inviteCode, isTeamLocked
                //    input[name="Team Name"], input[name="School"], #inviteCode, 
                
                // First, create some variables with the updated values
                let teamName = teamData.teamName;
                let schoolName = teamData.schoolName;
                schoolId = teamData.id_school; // Defined above in logic section
                let inviteCode = teamData.inviteCode;
                let isLocked = (teamData.isLocked === 1 ? true : false);
                
                // Then, populate local storage
                storage.setItem("teamName", teamName);
                storage.setItem("school", schoolName);
                storage.setItem("id_school", schoolId);
                storage.setItem("inviteCode", inviteCode);
                // Don't store "isTeamLocked"
                
                // And finally, the actual page elements (may result in a flash change, but oh well)
                $('#settingsPage #editPage input[name="Team Name"]').val(teamName);
                $('#settingsPage #editPage input[name="School"]').val(schoolName);
                $('#settingsPage #editPage #inviteCode > span').text(inviteCode);
                $('#settingsPage #editPage #lockTeamToggle').find('input').prop("checked", isLocked);
            }
        });
    }

    startNotifications() {
        this.setupSettingsPage("Notifications");

        // TODO: Matt is lazy and doesn't feel like adding the radio buttons right now, but they will be here next push maybe
        // plus we're not in the position to notify the user of anything so let it wait
        // Seth: Next push, huh? *raises eyebrow* ^_*

        // TODO: Remove later
        Popup.createConfirmationPopup("This feature is still in development. Please come back later", ["OK"], [() => {
            this.pageTransition.slideRight("catagoryPage");
            $("#settingsPage .cat_button").removeClass("cat_button_selected");
        }]);

        this.pageTransition.slideLeft("editPage");
    }

    startSignOut() {

        Popup.createConfirmationPopup("Are you sure you want to sign out?", ["Yes", "No"], [() => {
            localStorage.clear();
            dbConnection.deleteDatabase();
            /*
             * forceHaltSlide() is important and needed because when the use taps
             * "Sign Out", SwipeHandler registers it as a TAP Gesture. In MainSet,
             * PageTransition is bound to the TAP event and calls the slidePageX()
             * function (this is to "snap back" pages that aren't slid far enough).
             * However, the delay built into the slidePageX() function will re-hide
             * and re-show parts of the MainSet. forceHaltSlide() stop this
             * 
             * TL;DR: forceHaltSlide() facilitates smooth PageSet transitions
             */
            this.pageController.transitionObj.forceHaltSlide();
            this.pageController.onChangePageSet(0); // 0 for Welcome

        }, () => {
            // Do nothing since they didn't want to sign out
            $("#settingsPage .cat_button").removeClass("cat_button_selected");
        }]);

    }

    /**
     * check for a series of localstorage variables to determine if the user has a team.
     */
    doesTeamExist() {
        let storage = window.localStorage;
        let doesExist = true;
        let indicators = ["teamName", "inviteCode", "id_team"];

        indicators.map(function(value) {
            if((storage.getItem(value) == null) || ((storage.getItem(value) == undefined))) {
                doesExist = false;
            }
        })
        return doesExist;
    }

    startDeleteAccount() {
        this.setupSettingsPage("Delete Account");

        $(this.inputDivIdentifier).append("<br><br>");

        let button = ButtonGenerator.generateButton({
            html: "Delete Account",
            class: "generated_button"
        }, () => {
            Popup.createConfirmationPopup("Are you sure you want to delete your account?", ["Yes", "No"], [() => {
                // TODO: delete account here (needs password)
                console.log("DELETING ACCOUNT");
            }, () => {
                // do nothing
                console.log("CANCEL");
            }]);
        });

        $(this.inputDivIdentifier).append(button);

        // TODO: Remove later
        Popup.createConfirmationPopup("This feature is still in development. Please come back later", ["OK"], [() => {
            this.pageTransition.slideRight("catagoryPage");
            $("#settingsPage .cat_button").removeClass("cat_button_selected");
        }]);

        this.pageTransition.slideLeft("editPage");
    }
    
    // MISC FUNCTIONS
    
    /**
     * Toggles the team lock both on the backend and will update
     * the frontend with the current status of the team.
     */
    toggleLockWithFeedback() {
        TeamBackend.lockTeam((result) => {
            if(result.status > 0) {
                $('#settingsPage #editPage #lockTeamToggle').find('input').prop("checked", result.isLocked);
            } else {
                Popup.createConfirmationPopup("Only a coach can lock the team.", ["OK"]);
                // "Undo" the toggle from the user clicking it
                let isChecked = $('#settingsPage #editPage #lockTeamToggle').find('input').prop("checked");
                $('#settingsPage #editPage #lockTeamToggle').find('input').prop("checked", !isChecked);
            }
        });
    }
    
    /**
     * Generates a list of schools that match the given search. It will position
     * these slightly below the input to allow for each click access for the
     * user.
     * 
     * @param {AssociativeArray} resultsList js object returned from the backend search request
     */
    generateSearchResults(resultsList) {

        let schoolArray = []; // Array of button attribute objects [{...}, {...}, etc.]
        let currentSchool = {}; // Set to each object in the matches array
        let loopCount = 5; // Max number of results to show

        // Clear list to remove old results
        $("#settingsPage #editPage #searchList").empty();

        // Set max results to 5
        if (resultsList.length < loopCount) {
            loopCount = resultsList.length;
        }

        for (let s = 0; s < loopCount; s++) {
            currentSchool = resultsList[s];

            let innerHtml = `<span class="s_name">SCHOOL_NAME</span><br><span class="s_address">LOCATION</span>`;

            // Populate innerHtml
            if (currentSchool.name.length > 18) {
                innerHtml = innerHtml.replace("SCHOOL_NAME", currentSchool.name.substring(0, 17).trim() + "...");
            } else {
                innerHtml = innerHtml.replace("SCHOOL_NAME", currentSchool.name.trim());
            }
            if ((currentSchool.city != null) && (currentSchool.city.length > 3) && (currentSchool.state != null)) {
                innerHtml = innerHtml.replace("LOCATION", currentSchool.city.trim().toUpperCase() + ", " + currentSchool.state.trim());
            } else {
                innerHtml = innerHtml.replace("LOCATION", ""); // Hide it
            }

            // Include the image if it's present
            if ((currentSchool.logoUrl != null) && (currentSchool.logoUrl.length > 5)) {
                innerHtml = `<img class="s_logo" src="${currentSchool.logoUrl}">` + innerHtml;
            }

            let buttonId = "school_" + currentSchool.name.replace(/ /gm, "-");
            schoolArray.push(({
                "class": "searchResult",
                "id": buttonId,
                "html": innerHtml,
                "id_school": currentSchool.id_school
            }));
        }
        
        // Create a promise object so the school ID can be set
        let afterSchoolSelect = $.Deferred();
        
        // Finally, generate them
        ButtonGenerator.generateButtons("#settingsPage #editPage #searchList", schoolArray, (school) => {

            // Unfocus input, select the school, and clear search results
            document.activeElement.blur();
            afterSchoolSelect.resolve(school.id_school);
            
            let schoolName = school.id.replace("school_", "").replace(/\-/gm, " ");
            $("#settingsPage #editPage #searchList").empty();
            $('#settingsPage #editPage input[name="School"]').val(schoolName);
        });
        
        return afterSchoolSelect.promise();
    }
    
    /**
     * Checks the value / content of an input field to determine
     * if it is valid. It will return the boolean to reflect the state of the
     * input.
     * 
     * @example addInputCheck("#input_teamName", 15, 75, /[A-Za-z0-9/gm, false, () => { submitName(); });
     *          --> Will return false until name is 16-75 characters long,
     *              containing only letters or numbers, and will call the
     *              function submitName() if entered is pressed
     * 
     * @param {String} inputSelector jQuery selector for the input element
     * @param {Integer} lengthMin max length of input, exclusive
     * @param {Integer} lengthMax minimum length of input, inclusive
     * @param {Regex} acceptRegex regex expression ("/[A-Za-z0-9/gm") of accepted values
     * @param {Boolean} isOptional is the parameter optional / allowed to have a length of 0?
     * @param {Function} handleStatusCallback function that takes in a boolean (true for valid input, false otherwise)
     * @param {Function} enterActionCallback [optional] function to call when the enter key is pressed
     * 
     * @returns
     * True, if the input matches the criteria. False, otherwise
     */
    addInputCheck(inputSelector, lengthMin, lengthMax, acceptRegex, isOptional, handleStatusCallback, enterActionCallback = function () {}) {

        // Create keyup handler for enter button
        let bindingInput = $("#settingsPage " + inputSelector);
        bindingInput.on("keyup", (e) => {
            let keyCode = e.keyCode || e.charCode;
            if (keyCode == 13) { // Enter
                enterActionCallback();
            }
        });

        // Create the input event handler
        bindingInput.on("input", (e) => {

            let input = bindingInput.val();
            input = input.trim();
            // Set it as true; if it passes, it won't be set to false
            let isValid = true;

            // Check to see if it's optional and return if it's eligible
            if (isOptional) {
                if (input.length == 0) {
                    handleStatusCallback(true);
                    return;
                }
            }

            // Length
            if ((input.length < lengthMin) || (input.length > lengthMax)) {
                isValid = false;
            }
            // Special characters
            if (input.replace(acceptRegex, "").length > 0) {
                isValid = false;
            }

            handleStatusCallback(isValid);
        });
    }
    
    
}
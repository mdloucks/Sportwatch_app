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
        if ($("#settingsPage .cat_button").length) {
            return;
        }

        if (this.pageTransition.getPageCount() == 0) {
            this.pageTransition.addPage("catagoryPage", this.catagoryPage, true);
            this.pageTransition.addPage("editPage", this.editPage);
        }

        // each setting category will have its own function to call to specify what happens
        this.accountButtons = {
            "My Account": this.startMyAccount,
            "Team Preferences": this.startTeamPreferences,
            // "Notifications": this.startNotifications,
            "Sign Out": this.startSignOut,
            "Delete Account": this.startDeleteAccount
        };

        // remove team preferences if there is no team.
        if(!this.doesTeamExist()) {
            delete this.accountButtons["Team Preferences"];
        }

        // add the account pages
        Object.keys(this.accountButtons).forEach((key, index) => {
            this.addSettingCatagory(key, this.accountButtons[key].bind(this));
        });

        // When clicking on input, focus it
        $("#account_edit_inputs input").click((e) => {
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
        // $("#settingsPage").unbind().off();
        // $("#settingsPage *").unbind().off();
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
            "</p><p class=\"cat_arrow\">&#9658</p></button><br>";
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
                "id_school", "id_team", "schoolName", "teamName", "email", "lastUpdated", "lastLogin"
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
    }

    startTeamPreferences() {
        let storage = window.localStorage;

        this.setupSettingsPage("Team Preferences");

        // TODO: add more fields here
        let valuesToEdit = {
            "Team Name": storage.getItem("teamName") | "",
            "School": storage.getItem("schoolName") | "",
        };

        ValueEditor.editValues(this.inputDivIdentifier, valuesToEdit, (newValues) => {

            storage.setItem("teamName", newValues["Team Name"]);
            storage.setItem("school", newValues["School"]);

            // TODO: change user's password
            console.log("set values " + JSON.stringify(newValues));
        });

        $(this.inputDivIdentifier).append(`
            <br><button class="generated_button" style="background-color: #dd3333" id="leave_team_button">Leave Team</button>
        `);

        let teamCode = "Unkown";

        if(storage.getItem("inviteCode") != null) {
            teamCode = storage.getItem("inviteCode");
        }

        // TODO: pull from server the user's invite code if it's not in localstorage
        $(`${this.inputDivIdentifier}`).append(`
            <div class="subheading_text">Invite Code: <span class="underline">${teamCode}<span></div>
        `)

        $(`${this.inputDivIdentifier}`).append(`
            <div class="sectionWrapper">
                <h1 id="h1_emailInvite">Invite via Email</h1>
                <input id="input_athleteEmail" class="sw_text_input" type="text" placeholder="randy@sportwatch.us"></input>
                <br>
                <button id="button_sendInvite" class="sw_button">Invite</button>
            </div><br><br><br><br>
        `);

        // invite athlete to team
        $(`${this.inputDivIdentifier} #button_sendInvite`).click((e) => {

            let invitedEmail = $(`${this.inputDivIdentifier} #input_athleteEmail`).val();
            ToolboxBackend.inviteAthlete(invitedEmail);
            console.log("sent invite to " + invitedEmail);
        });

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
                        Popup.createConfirmationPopup("You have successfully left the team", ["OK"], [() => {}]);

                        // Failure, let them know why
                    } else {
                        if (result.msg.indexOf("coach") != -1) {
                            // TODO: Add options to delete team or nominate other coaches
                            Popup.createConfirmationPopup("You're the only coach! You can't leave the team", ["OK"], [() => {}]);
                        } else {
                            Popup.createConfirmationPopup("We're sorry, an error occured on our end. Please try later", ["OK"], [() => {}]);
                        }
                    }
                });
                // End of leave action

            }, () => {
                // no action
            }])
        });

        let values = {};

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

        ButtonGenerator.generateToggle(`${this.inputDivIdentifier}`, "Lock Team", function () {
            // TODO: the button is checked here, lock the user's team
            console.log("check");
        }, function() {
            console.log("uncheck");
            // TODO: the button is unchecked here, unlock the user's team
        });


        // // TODO: Remove later
        // Popup.createConfirmationPopup("This feature is still in development. Please come back later", ["OK"], [() => {
        //     this.pageTransition.slideRight("catagoryPage");
        // }]);

        this.pageTransition.slideLeft("editPage");
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
        let doesExist = false;
        let indicators = ["teamName", "inviteCode", "id_team"];

        indicators.map(function(value) {
            if(storage.getItem(value) != null) {
                doesExist = true;
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

}
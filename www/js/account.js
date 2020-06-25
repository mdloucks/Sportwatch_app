/**
 * @classdesc this is the settings page for out app
 * @class
 */
class Account extends Page {
    // TODO: !! Convert to PageTransition compliant class !!
    constructor(id, pageSetObj) {
        super(id, "Account");
        
        this.pageController = pageSetObj;
        
        this.currentPageId = "catagoryPage";

        // ---- PAGES ---- //

        this.catagoryPage = (`
            <div id="catagoryPage" class="div_page">
                <p id="title"><u>Account Settings</u></p>
                <div id="cat_options">
                    <!-- Buttons will be inserted here -->
                </div>
            </div>
        `);


        // https://jsbin.com/lodusuyipo/edit?html,css,js,output
        this.settingsPage = (`
            <div id="settingsPage" class="div_page">
                <div class="generic_header">
                    <div class="back_button">&#8592;</div>
                    <h1 id="settingsName"></h1>
                </div>

                <div id="account_edit_inputs"></div>
            </div>
        `);

        this.dbConnection = new DatabaseConnection();
        this.pageTransition = new PageTransition("#accountPage");
        // this.pageController.swipeHandler.addScrollPage("#accountPage > #settingsPage");
        
        this.inputDivIdentifier = "#accountPage #settingsPage #account_edit_inputs";

        // each setting category will have its own function to call to specify what happens
        this.accountButtons = {
            "My Account": this.startMyAccount,
            "Team Preferences": this.startTeamPreferences,
            "Notifications": this.startNotifications,
            "Sign Out": this.startSignOut,
            "Delete Account": this.startDeleteAccount
        };

    } // End of constructor

    getHtml() {
        return (`
            <div id="accountPage" class="div_page">
                ${this.catagoryPage}
                ${this.settingsPage}
            </div>
        `);
        //${this.devPage}
    }

    /**
     * @returns {function} the function that is called when the page changes.
     */
    start() {
        
        // Only add content if it isn't there yet (check if any catagories are there yet)
        if ($(".cat_button").length) {
            return;
        }

        if (this.pageTransition.getPageCount() == 0) {
            this.pageTransition.addPage("catagoryPage", this.catagoryPage, true);
            this.pageTransition.addPage("settingsPage", this.settingsPage);
        }

        // add the account pages
        Object.keys(this.accountButtons).forEach((key, index) => {
            this.addSettingCatagory(key, this.accountButtons[key].bind(this));
        });
        
        // When clicking on input, focus it
        $("#account_edit_inputs input").click((e) => {
            $(e.target).focus();
        })


        // // ---- DEVELOPER PAGE LOGIC ---- //
        this.addSettingCatagory("Developer Tools", () => {
            this.pageTransition.slideLeft("catagoryPage");

            $(this.inputDivIdentifier).html(`            
                <div id="devPage" class="div_page">
                <span class="back_button">&#8592</span>
                <br>
                <h2>Developer tools</h2>
                <br>
                
                <p>Reinstantiate tables(wipes database)</p>
                <button id="create_tables">Create tables</button><br> 

                <p>Enter Database Command</p>
                <form id="database_command">
                <input id="db_command" type="text"></input>
                <input type="submit"></submit>
                </form>
                </div>`
            );
        });

        $("#create_tables").click((e) => {
            e.preventDefault();
            this.dbConnection.createNewTables();
            console.log("Created new tables!");
        });

        $("#database_command").on("submit", function (e) {
            e.preventDefault();
            console.log($('#db_command').val());
            this.dbConnection.executeCommand($('#db_command').val());
        });

        // ---- MISC PAGE LOGIC ---- //

        $("#accountPage .back_button").click((e) => {
            e.preventDefault();
            this.pageTransition.slideRight("catagoryPage");
        });
    }

    stop() {
        // For now, don't unbind because adding the click events back is difficult
        // TODO: Change structure so it can properly unbind
        // $("#accountPage").unbind();
        // $("#accountPage *").unbind();
    }

    /**
     * Init the given page by clearing the html and setting the title
     * 
     * @param {String} name name of the page
     */
    setupSettingsPage(name) {
        $("#accountPage #settingsName").html(name);
        $("#accountPage #settingsPage #account_edit_inputs").empty();
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
            // If button has not already been pressed
            if (!e.delegateTarget.classList.contains("cat_button_selected")) {
            }
            callback();
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
            if(accountInfo.status < 0) {
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
                "id_school", "id_team", "schoolName", "teamName", "email"];
            
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
                        Popup.createConfirmationPopup("Successfully saved!", ["OK"], [() => { }]);
                        if ("didSetPassword" in response) {
                            if (response.didSetPassword == 0) {
                                Popup.createConfirmationPopup("Warning: Password was not updated! Please try again", ["OK"], [() => { }]);
                                return;
                            }
                        }
                        response = AccountBackend.beautifyResponse(response);
                        // Populate fields with the updated values
                        $('#settingsPage input[name="First Name"]').val(response.fname);
                        $('#settingsPage input[name="Last Name"]').val(response.lname);
                        $('#settingsPage input[name="Gender"]').val(response.gender);
                        $('#settingsPage input[name="Phone Number"]').val(response.cellNum);
                        $('#settingsPage input[name="State"]').val(response.state);
                        $('#settingsPage input[name="Date of Birth"]').val(response.dob);
                        
                    } else { // EDIT FAILED
                        if(response.substatus == 5) {
                            
                            // Was the response from the backend (contains list of invalid) or frontend
                            if(response.msg.includes(":")) { // BACKEND
                                // Isolate the invalid parameters
                                let invalidParams = response.msg; // Formatted "some params invalid: fnameNew lnameNew ..."
                                invalidParams = invalidParams.substring(invalidParams.indexOf(":") + 2, invalidParams.length);
                                invalidParams = invalidParams.replace(/New/gm, ""); // Remove "New" from variable names
                                invalidParams = invalidParams.replace(/ /gm, ", "); // Add commas for pretty formatting
                                
                                // Convert variable names to human-readable named
                                let keys = Object.keys(displayNames);
                                for(let n = 0; n < keys.length; n++) {
                                    // Replace the key with the display name
                                    invalidParams = invalidParams.replace(keys[n], displayNames[keys[n]]);
                                }
                                
                                Popup.createConfirmationPopup("The following were invalid, please correct to save: " + invalidParams,
                                                                ["OK"], [() => { }]);
                            } else { // FRONTEND
                                Popup.createConfirmationPopup("Some parameters were invalid, please try again", ["Close"], [() => { }]);
                            }
                            
                            
                        } else {
                            Popup.createConfirmationPopup("An unknown error occured, please try again later", ["Close"], [() => { }]);
                        }
                    }
                }); // End of Backend callback
                
            }, ignoredValues, displayNames);
            
            // Email & Password (requires current password)
            ValueEditor.editValues(this.inputDivIdentifier, sensitiveValues, (newValues) => {
                
                if(newValues["passwordOld"].length == 0) {
                    Popup.createConfirmationPopup("Please enter your current password", ["OK"], [() => { }]);
                } else if(newValues["passwordNew"] != newValues["passwordNew2"]) {
                    Popup.createConfirmationPopup("New passwords do not match", ["OK"], [() => { }]);
                } else {
                    let currentPassword = newValues["passwordOld"];
                    delete newValues["passwordOld"];
                    // Delete since backend doesn't need verification
                    delete newValues["passwordConfirm"];
                    
                    // Submit the backend request if frontend checks passed
                    AccountBackend.updateAccount(newValues, (response) => {
                        if(("didSetPassword" in response) && (response.didSetPassword == 1)) {
                            Popup.createConfirmationPopup("Successfully updated!", ["OK"], [() => { }]);
                            
                        } else { // Failure
                            if(response.substatus == 5) {
                                Popup.createConfirmationPopup("Email or password were incorrectly formatted, please try again",
                                                                ["Close"], [() => { }]);
                            } else if(response.substatus == 6) {
                                Popup.createConfirmationPopup("Incorrect password, please try again", ["Close"], [() => { }]);
                            } else {
                                Popup.createConfirmationPopup("An unknown error occured, please try again later", ["Close"], [() => { }]);
                            }
                        }
                    }, currentPassword);
                } // End of edit handling if statement
                
            }, [], displayNames);
        }); // End of population function
        
        this.pageTransition.slideLeft("settingsPage");
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

            storage.teamName = newVales["Team Name"];
            storage.schoolName = newVales["School"];

            // TODO: change user's password
            console.log("set values " + JSON.stringify(newValues));
        });
        
        // TODO: Remove later
        Popup.createConfirmationPopup("This feature is still in development. Please come back later", ["OK"], [() => {
            this.pageTransition.slideRight("catagoryPage");
        }]);
        
        this.pageTransition.slideLeft("settingsPage");
    }

    startNotifications() {
        this.setupSettingsPage("Notifications");

        // TODO: Matt is lazy and doesn't feel like adding the radio buttons right now, but they will be here next push maybe
        // plus we're not in the position to notify the user of anything so let it wait
        
        // TODO: Remove later
        Popup.createConfirmationPopup("This feature is still in development. Please come back later", ["OK"], [() => {
            this.pageTransition.slideRight("catagoryPage");
        }]);
        
        this.pageTransition.slideLeft("settingsPage");
    }

    startSignOut() {
        localStorage.removeItem("SID");
        this.pageController.onChangePageSet(0); // 0 for Welcome
    }

    startDeleteAccount() {
        this.setupSettingsPage("Delete Account");

        $(this.inputDivIdentifier).append("<br><br>");

        let button = ButtonGenerator.generateButton({ html: "Delete Account", class: "generated_button" }, () => {
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
        }]);
        
        this.pageTransition.slideLeft("settingsPage");
    }
    
}






















    // TODO: Most of this stuff below will be deprecated/remove as it's already in page-transition
    // ---- ACCOUNT PAGE ---- //

    // TODO: This section is now deprecated (sorry Seth). It will be removed in a future push
    // // Account Page
    // this.addSettingDropdown("Notification Preferences", "<p>Adjust preferences here</p><br> <p>WIP</p>", (wrapperDiv) => {
    //     // TODO: Adjust notification preferences
    // });
    // this.addSettingDropdown("Change Email Address", "<input type=\"text\" name=\"new_email\"><br> <p>WIP</p>", (wrapperDiv) => {
    //     // TODO: Update Email address based on input
    // });
    // this.addSettingDropdown("Update Phone Number", "<input type=\"text\" name=\"new_phone\"><br> <p>WIP</p>", (wrapperDiv) => {
    //     // TODO: Update Cell Phone Number based on input
    // });
    // this.addSettingDropdown("Change Password", "<input type=\"text\" name=\"current_password\"><br> " +
    //     "<input type=\"text\" name=\"new_password\"><br> <p>WIP</p>", (wrapperDiv) => {
    //         // TODO: Password based on input
    //     });
    // this.addGenericButton("Sign Out", "#settingsPage", (e) => {
    //     localStorage.removeItem("SID");
    //     console.log("User signing out");
    //     this.signout();
    // });
    // this.addSettingDropdown("Delete Account", "<input type=\"text\" name=\"current_password\"><br> " +
    //     "<input type=\"text\" name=\"new_password\"><br> <p>WIP</p>", (wrapperDiv) => {
    //         // TODO: Delete Account if password matches
    //     });

//     /**
//      * Adds a dropdown menu with a button "title".
//      * 
//      * @return Void
//      * 
//      * @example
//      * this.addSettingsDropdown("Change Email", "<input type=\"text\" name=\"newEmail\"><br> <input type=\"submit\">", (wrapperDiv) => { ... });
//      * 
//      * @param buttonName {String} display name of button / dropdown
//      * @param content {String} HTML content shown when drop is expanded
//      * @param eventsCallback {Function} function used to handle click / submit
//      * events for this dropdown only. MUST take wrapper div as parameter
//      */
//     addSettingDropdown(buttonName, content, eventsFunction) {

//         let dropdownHtml = "<div class=\"act_drop_wrapper\"><button class=\"act_drop_button\">" +
//             buttonName + "</button><div class=\"act_drop_content hidden\">" + content + "</div></div>";
//         $("#settingsPage").append(dropdownHtml);

//         $(".act_drop_button").last().bind("touchend", (e) => {
//             let wrapperObj = $(e.target).parent();

//             if (!$(wrapperObj).hasClass("dropdown_expanded")) { // Expand
//                 $(wrapperObj).addClass("dropdown_expanded");
//                 $(wrapperObj).children(".act_drop_button").addClass("drop_button_underline");
//                 $(wrapperObj).children(".act_drop_content").removeClass("hidden");

//                 $(wrapperObj).one("transitionend", () => {
//                     $(wrapperObj).children(".act_drop_content").css("opacity", "1.0");
//                 });

//             } else { // Minimize
//                 $(wrapperObj).children(".act_drop_content").css("opacity", "0.0");

//                 $(wrapperObj).children(".act_drop_content").one("transitionend", () => {
//                     $(wrapperObj).removeClass("dropdown_expanded");
//                     $(wrapperObj).children(".act_drop_content").addClass("hidden");
//                     $(wrapperObj).children(".act_drop_button").removeClass("drop_button_underline");
//                 });
//             }
//         }); // End of button click handler

//         eventsFunction($(".act_drop_wrapper").last()); // Bind the buttons

//     }


//     // ---- MISC ---- //

//     /**
//      * Adds given html content to the app. Will assume all pages are not
//      * primary unless otherwise specified.
//      * 
//      * @return Void
//      * 
//      * @example addPage(devPage);
//      * @example addPage(catagoryPage, true);
//      * 
//      * @param content {String} HTML content for this page
//      * @param isPrimary {Boolean} will this page be the focused / visible page
//      * upon open?
//      */
//     addPage(divId, isPrimary = false) {
//         // $("#app").append(content);

//         // // Find the id of the div
//         // console.log(content);
//         // let divIndex = content.indexOf("<div");
//         // let idIndex = content.indexOf("id=", divIndex);
//         // let divId = "";
//         // if ((divIndex != -1) && (idIndex != -1)) {
//         //     let endIdIndex = content.indexOf(" ", idIndex);
//         //     // +3 to remove "id="
//         //     divId = content.substring(idIndex + 3, endIdIndex);
//         //     divId = "#" + divId.replace(/\"/g, ""); // Remove all quotes
//         // } else {
//         //     console.log("Div or id index was invalid");
//         // }

//         // Perform the operations now
//         $(divId).addClass("current_page"); // Keep as "base" for simplicity
//         if (!isPrimary) {
//             $(divId).addClass("page_right");
//             $(divId).addClass("hidden");
//         }
//     }

//     /**
//      * Runs a sliding animation for the two div element id's specified.
//      * 
//      * @return Void
//      * 
//      * @example animateTransition("catagoryPage", "devPage");
//      * 
//      * @param newPageId {String} new page div's id
//      * @param rightToLeft {Boolean} [default = true] animation slide from
//      * right to left?
//      */
//     animateTransition(newPageId, rightToLeft = true) {

//         let prevPageId = this.currentPageId;
//         if (prevPageId.indexOf("#") == -1) {
//             prevPageId = "#" + prevPageId;
//         }
//         if (newPageId.indexOf("#") == -1) {
//             newPageId = "#" + newPageId;
//         }

//         // Prevent the double clicking of the button
//         if (($(prevPageId).is(":animated")) || ($(newPageId).is(":animated"))) {
//             return;
//         }
//         if (prevPageId == newPageId) {
//             this.currentPageId = "#catagoryPage";
//             console.log("Duplicate! New current page: " + this.currentPageId);
//             return;
//         }
//         $(newPageId).removeClass("hidden");

//         if (rightToLeft) {
//             $(newPageId).removeClass("page_right");
//             $(prevPageId).addClass("page_left");
//         } else if (!rightToLeft) {
//             $(newPageId).removeClass("page_left");
//             $(prevPageId).addClass("page_right");
//         }

//         // Hide old page once new page is in focus
//         $(newPageId).one("transitionend", () => {
//             $(prevPageId).addClass("hidden");
//             this.resetPage(prevPageId);
//             this.currentPageId = newPageId;
//         });
//     }

//     /**
//      * Resets a page back to its original look (i.e. reset pressed buttons)
//      * Should be called when a page is opened
//      * 
//      * @return Void
//      * 
//      * @example
//      * this.resetPage("catagoryPage");
//      * 
//      * @param pageId {String} id of the page's div
//      */
//     resetPage(pageId) {
//         if (pageId.includes("catagoryPage")) {
//             $(".cat_button").removeClass("cat_button_selected");
//         } else if (pageId.includes("settingsPage")) {
//             $(".act_drop_wrapper").removeClass("dropdown_expanded");
//             $(".act_drop_button").removeClass("drop_button_underline");
//             $(".act_drop_content").addClass("hidden");
//             $(".act_drop_content").css("opacity", "0.0");
//         }
//     }

//     /**
//      * Adds generic, basic button the end end of the container.
//      * 
//      * @return Void
//      * 
//      * @example
//      * this.addGenericButton("Sign Out", "#settingsPage", (e) => { console.log("Signed Out"); });
//      * 
//      * @param display {String} display text of button
//      * @param container {String} identifier of HTML container
//      * @param callback {Function} called when button is clicked
//      * @param styleClass {String} [default = "generic_button"] styling class
//      * applied to this button
//      */
//     addGenericButton(display, container, callback, styleClass = "generic_button") {

//         let button = "<button class=\"" + styleClass + "\">" + display + "</button>";
//         $(container).append(button);
//         $(container + " button").last().bind("touchend", (e) => {
//             e.preventDefault();
//             if (!$(e.target).hasClass("generic_selected")) {
//                 $(e.target).addClass("generic_selected");
//             } else {
//                 $(e.target).removeClass("generic_selected");
//             }

//             callback(e);
//         });
//     }

// }
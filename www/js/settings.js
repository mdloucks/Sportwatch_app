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
        
        // Define an array of states for the edit account page
        this.stateNames = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "D.C.", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];
        this.stateShort = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];
        
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
            "Membership": this.startMembership,
            "Support": this.startSupport,
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
        
        // Start the currently selected page in case it isn't the landing page
        if(this.pageTransition.getCurrentPage() != "catagoryPage") {
            let activeEditPage = $("#settingsPage #editPage #editName").text();
            if(activeEditPage.includes("Account")) {
                this.startMyAccount();
            } else if(activeEditPage.includes("Team")) {
                this.startTeamPreferences();
            } else if(activeEditPage.includes("Membership")) {
                this.startMembership();
            } else if(activeEditPage.includes("Support")) {
                this.startSupport();
            }
        }
        
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
            
            // -- PAGE CREATION -- //
            // May have errored out
            if (accountInfo.status < 0) {
                Popup.createConfirmationPopup("Sorry, an error occured. Please try again later or sign out and re-log in", ["OK"], [() => {
                    this.pageTransition.slideRight("catagoryPage");
                }]);
                return;
            }
            accountInfo = AccountBackend.beautifyResponse(accountInfo);
            if(!("schoolName" in accountInfo)) {
                accountInfo["schoolName"] = ""; // Have to set here so 'undefined' isn't shown to user
            }
            
            // Append the form
            $(this.inputDivIdentifier).append(`
                <button id="saveChanges" class="generated_button">Save</button>
                <hr>
                <p>Name</p>
                <input type="text" name="fname" value="${accountInfo["fname"]}" placeholder="John" style="width: 30%">
                <input type="text" name="lname" value="${accountInfo["lname"]}" placeholder="Witherspoon" style="width: 30%">
                <br>
                <div id="genderStateWrapper" class="twoColWrapper">
                    <div class="leftColumn">
                        <p>Competition Gender</p>
                        <!-- Dropdown added here with createDropdown() -->
                    </div>
                    <div class="rightColumn">
                        <p>State</p>
                        <!-- Dropdown added here -->
                    </div>
                </div>
                <br>
                <div id="dobPhoneWrapper" class="twoColWrapper">
                    <div class="leftColumn">
                        <p>Birthdate</p>
                        <input type="date" name="dob" value="${accountInfo["dob"]}">
                    </div>
                    <div class="rightColumn">
                        <p>Phone Number</p>
                        <input type="text" name="cellNum" value="${accountInfo["cellNum"]}" placeholder="(989) 111-2223">
                    </div>
                </div>
                <br>
                <p>School</p>
                <input type="text" name="school" value="${accountInfo["schoolName"]}" placeholder="Wayworth High School">
                <div id="schoolResults" class="noResult"></div>
                <br>
                <div id="passwordWrapper" style="height: 0; opacity: 0">
                    <p style="display: inline">Current Password</p><br>
                    <input type="password" name="password" placeholder="●●●●●●●●" disabled>
                </div>
                <p>Email</p>
                <input type="text" name="email" value="${accountInfo["email"]}" placeholder="example@sportwatch.us">
                <br>
                <p>Change Password</p>
                <input type="password" name="newPassword" placeholder="●●●●●●●●">
                <br><br><hr>
                
                <div id="deleteWrapper">
                    <h1 class="subheading_text">Delete Account</h1>
                    <p style="margin: 15px 25px">
                        Deleting your account will <b>permanently remove</b> times, records, team data, and
                        sensitive account information. You will <b>not be refunded</b> for any active Sportwatch
                        Membership. We will <b>retain the following</b> as outlined in our
                        <a href="https://sportwatch.us/privacy-policy/">Privacy Policy</a>:
                        account creation date, deletion timestamp, and transactional data.
                    </p>
                    <p style="margin: 15px 25px">
                        If needed, you may contact us via email (<a href="mailto:support@sportwatch.us">support@sportwatch.us</a>)
                        to remove the retained information.
                    </p>
                    <br>
                    <input type="text" name="email" placeholder="Enter Account Email">
                    <br>
                    <input type="password" name="password" placeholder="Enter Account Password">
                    <br>
                    <button id="deleteAccount" class="generated_button" disabled>Delete Account</button>
                    
                    <div id="postDeleteWrapper" style="opacity: 0;">
                        <p id="statusText"><i>Starting deletion...</i></p>
                        <button id="stopDelete" class="sw_button">Cancel</button>
                    </div>
                </div>
            `);
            
            // Add the dropdowns now with the dedicated method
            ValueEditor.createDropdown(this.inputDivIdentifier + " #genderStateWrapper .leftColumn", "gender",
                                        ["Male", "Female"], ["M", "F"], accountInfo["gender"]);
            ValueEditor.createDropdown(this.inputDivIdentifier + " #genderStateWrapper .rightColumn", "state",
                                        this.stateNames, this.stateShort, accountInfo["state"]);
            
            
            // -- INPUT & SUBMISSION -- //
            let newSchoolId = -1;
            let invalidMessages = ["", ""]; // Populated with input errors for user feedback ([0] = email, [1] = password)
            let schoolValid = true;
            let emailValid = true;
            let passwordValid = true; // Starts as false since it's blank to start
            
            // Configure school search
            $('#settingsPage #editPage input[name="school"]').on("input", (e) => {
                let input = $('#settingsPage #editPage input[name="school"]').val();
                
                // User must select a dropdown option, so disable Save button until then
                newSchoolId = -1;
                
                input = input.replace(/[^A-Za-z0-9. ]/gm, "");
                // Search for schools with the given input
                ToolboxBackend.searchForSchool(input, 10, (response) => {
                    if (response.status > 0) {
                        if (response.substatus == 2) { // No matches, clear list and generate nothing
                            this.generateSearchResults([], "#settingsPage #editPage #schoolResults"); // No options, so no need to resolve promise
                            // Hide the search list since there are no results
                            let searchList = $("#settingsPage #editPage #schoolResults");
                            if(!searchList.hasClass("noResults")) { // Only show if not already hidden
                                searchList.addClass("noResults");
                            }
                        } else {
                            // Show and generate the list
                            $("#settingsPage #editPage #schoolResults").removeClass("noResults");
                            this.generateSearchResults(response.matches, "#settingsPage #editPage #schoolResults").then((selectedSchool) => {
                                // Set the school name
                                let schoolName = selectedSchool.id.replace("school_", "").replace(/\-/gm, " ");
                                $("#settingsPage #editPage #schoolResults").empty();
                                $('#settingsPage #editPage input[name="school"]').val(schoolName);
                                
                                // Save school Id
                                $("#settingsPage #editPage #schoolResults").addClass("noResults");
                                newSchoolId = selectedSchool.id_school;
                                $("#settingsPage #editPage #saveChanges").prop("disabled", false);
                            });
                            // And hide the results after being clicked on
                            $("#settingsPage #editPage #schoolResults").removeClass("noResults");
                        }
                    } // End of status check. Nothing we can do really if this fails
                });
            });
            
            // If an email or password is being changed, show the current password
            $('#settingsPage #editPage input[name="email"], #settingsPage #editPage input[name="newPassword"]').on("input", (e) => {
                
                // Show or hide the current password field
                if(($('#settingsPage #editPage input[name="email"]').val().toLowerCase() == accountInfo["email"]) && 
                        ($('#settingsPage #editPage input[name="newPassword"]').val().length == 0)) {
                    // Hide the current password field
                    if($(this.inputDivIdentifier + " #passwordWrapper").css("opacity") == 1) {
                        $(this.inputDivIdentifier + " #passwordWrapper").fadeTo(250, 0, () => {
                            $('#settingsPage #editPage input[name="password"]').prop("disabled", true);
                            $(this.inputDivIdentifier + " #passwordWrapper").animate({
                                height: 0
                            }, 500, "swing");
                        });
                    }
                } else {
                    // Show the current password field
                    if($(this.inputDivIdentifier + " #passwordWrapper").css("opacity") == 0) {
                        $(this.inputDivIdentifier + " #passwordWrapper").animate({
                            height: 75
                        }, 500, "swing", () => {
                            $(this.inputDivIdentifier + " #passwordWrapper").fadeTo(250, 1);
                            $('#settingsPage #editPage input[name="password"]').prop("disabled", false);
                        });
                    }
                }
                
                // Do input processing based on which input
                let input = $(e.target).val();
                if($(e.target).prop("name") == "email") {
                    
                    if(input.toLowerCase() == accountInfo["email"]) {
                        emailValid = true;
                    } else {
                        emailValid = false;
                    }
                    
                    let emailRegex = input.match(/[A-Za-z0-9\-_.]*@[A-Za-z0-9\-_.]*\.(com|net|org|us|website|io)/gm);
                    
                    if (emailRegex == null) {
                        invalidMessages[0] = "Please enter valid email";
                    } else if (emailRegex[0].length != input.length) {
                        invalidMessages[0] = "Email can only contain: A-Z, a-z, 0-9, hyphens, underscores, periods, and the @ symbol";
                    } else if (input.length > 250) {
                        invalidMessages[0] = "Email is too long";
                    } else {
                        invalidMessages[0] = "";
                        emailValid = true;
                    }
                    
                    // New password
                } else if($(e.target).prop("name") == "newPassword") {
                    
                    if(input.length == 0) {
                        passwordValid = true;
                    } else {
                        passwordValid = false;
                    }
                    
                    if ((input.match(/[`"';<>{} ]/gm) != null) || (input.length < 10) || (input.length > 250)) {
                        invalidMessages[1] = "Password must be at least 10 characters long and cannot contain spaces or: \";\'<>{}";
                    } else if ((input.match(/[A-Z]/gm) == null) || (input.match(/[0-9]/gm) == null)) {
                        invalidMessages[1] = "Please strengthen your password (must include uppercase, and numbers)";
                    } else {
                        invalidMessages[1] = "";
                        passwordValid = true;
                    }
                }
            });
            
            // Clicking of the Save button
            $("#settingsPage #editPage #saveChanges").click((e) => {
                $("#settingsPage #editPage #saveChanges").prop("disabled", true);
                
                if((schoolValid) && (emailValid) && (passwordValid)) {
                    
                    // If the email or password was changed, make sure current password is set
                    if(($('#settingsPage #editPage input[name="email"]').val().toLowerCase() != accountInfo["email"]) || 
                            ($('#settingsPage #editPage input[name="newPassword"]').val().length > 0)) {
                        if($('#settingsPage #editPage input[name="password"]').val().length == 0) {
                            Popup.createConfirmationPopup("Your current password is required to update your email or password", ["OK"]);
                            return;
                        }
                    }
                    
                    // Now, extract the values and submit to the backend
                    let profileChanges = {};
                    profileChanges["fname"] = $(this.inputDivIdentifier + ' input[name="fname"]').val();
                    profileChanges["lname"] = $(this.inputDivIdentifier + ' input[name="lname"]').val();
                    profileChanges["gender"] = $(this.inputDivIdentifier + ' #gender').val();
                    profileChanges["state"] = $(this.inputDivIdentifier + ' #state').val();
                    profileChanges["dob"] = $(this.inputDivIdentifier + ' input[name="dob"]').val();
                    profileChanges["cellNum"] = $(this.inputDivIdentifier + ' input[name="cellNum"]').val();
                    profileChanges["id_school"] = newSchoolId;
                    profileChanges["email"] = $(this.inputDivIdentifier + ' input[name="email"]').val();
                    profileChanges["password"] = $(this.inputDivIdentifier + ' input[name="newPassword"]').val();
                    profileChanges["currentPassword"] = $(this.inputDivIdentifier + ' input[name="password"]').val();
                    // ^ Ignored if not needed, so it's easier to just include it
                    
                    AccountBackend.updateAccount(profileChanges, (response) => {
                        $("#settingsPage #editPage #saveChanges").prop("disabled", false);
                        
                        if(response.status > 0) { // EDIT SUCCESS
                            if ("didSetPassword" in response) {
                                if (response.didSetPassword == 0) {
                                    Popup.createConfirmationPopup("Warning: Password was not updated! Please try again", ["OK"], [() => {}]);
                                    return;
                                } else {
                                    Popup.createConfirmationPopup("Successfully saved!", ["OK"], [() => {}]);
                                }
                            } else {
                                Popup.createConfirmationPopup("Successfully saved!", ["OK"], [() => {}]);
                            }
                            
                            // Update email if they changed it
                            if("email" in response) {
                                localStorage.setItem("email", response.email);
                                accountInfo["email"] = response.email;
                            }
                            
                            response = AccountBackend.beautifyResponse(response);
                            // Populate fields with the updated values
                            
                        } else if(response.substatus == 5) { // EDIT FAILED
                            
                            // Was the response from the backend or faked by frontend (account-backend.js)
                            if(response.msg.includes("frontend")) {
                                Popup.createConfirmationPopup("There is an error in the form. Please correct to save", ["OK"]);
                            } else {
                                // Backend error
                                // Isolate the invalid parameters
                                let invalidParams = response.msg; // Formatted "some params invalid: fnameNew lnameNew ..."
                                invalidParams = invalidParams.substring(invalidParams.indexOf(":") + 2, invalidParams.length);
                                invalidParams = invalidParams.replace(/New/gm, ""); // Remove "New" from variable names
                                invalidParams = invalidParams.replace(/ /gm, ", "); // Add commas for pretty formatting

                                // Convert variable names to human-readable named
                                invalidParams = invalidParams.replace("fname", "First Name");
                                invalidParams = invalidParams.replace("lname", "Last Name");
                                invalidParams = invalidParams.replace("gender", "Competition Gender");
                                invalidParams = invalidParams.replace("state", "State");
                                invalidParams = invalidParams.replace("cellNum", "Phone Number");
                                invalidParams = invalidParams.replace("dob", "Birthdate");
                                invalidParams = invalidParams.replace("id_school", "School");
                                invalidParams = invalidParams.replace("email", "Email");
                                
                                Popup.createConfirmationPopup("The following were invalid, please correct to save: " + invalidParams,
                                    ["OK"], [() => {}]);
                            }
                            
                        } else if(response.substatus == 6) { // BAD PASSWORD
                            Popup.createConfirmationPopup("The current password was incorrect. Please try again", ["OK"]);
                            
                        } else { // UNKNOWN ERROR
                            Popup.createConfirmationPopup("An unknown error occured. Please try again later", ["OK"]);
                        }
                        
                    }, profileChanges["currentPassword"]);
                    
                } else {
                    // Display the appropriate error
                    if(!schoolValid) {
                        Popup.createConfirmationPopup("Please search for and select a school", ["OK"]);
                    } else if(!emailValid) {
                        Popup.createConfirmationPopup(invalidMessages[0], ["OK"]);
                    } else if(!passwordValid) {
                        Popup.createConfirmationPopup(invalidMessages[1], ["OK"]);
                    } else {
                        Popup.createConfirmationPopup("There is an error in the form. Please correct to save", ["OK"]);
                    }
                }
                
            });
            
            // Delete Account input checks
            let matchingEmail = false;
            let validPassword = false;
            $("#settingsPage #editPage #deleteWrapper input").on("input", (e) => {
                let input = $(e.target).val();
                
                // Do input checks
                if($(e.target).prop("name") == "email") {
                    let emailRegex = input.match(/[A-Za-z0-9\-_.]*@[A-Za-z0-9\-_.]*\.(com|net|org|us|website|io)/gm);
                    if((emailRegex != null) && (emailRegex[0].length == input.length) && (input.length <= 250)) {
                        matchingEmail = true;
                    }

                    if(input.toLowerCase() == accountInfo["email"].toLowerCase()) {
                        matchingEmail = true;
                    } else {
                        matchingEmail = false;
                    }
                } else if($(e.target).prop("name") == "password") {
                    if((input.match(/[`"';<>{} ]/gm) == null) && (input.length > 3) && (input.length < 250)) {
                        validPassword = true;
                    } else {
                        validPassword = false;
                    }
                }

                // Change button status
                if ((matchingEmail) && (validPassword)) {
                    $("#settingsPage #editPage #deleteWrapper #deleteAccount").prop("disabled", false);
                } else {
                    $("#settingsPage #editPage #deleteWrapper #deleteAccount").prop("disabled", true);
                }
            });

            // Delete Account button
            $("#settingsPage #editPage #deleteWrapper #deleteAccount").click((e) => {
                $("#settingsPage #editPage #deleteWrapper #deleteAccount").prop("disabled", true);

                Popup.createConfirmationPopup("Are you sure you want to permanently delete your account?", ["No", "Yes"], [
                    () => {
                        $("#settingsPage #editPage #deleteWrapper #deleteAccount").prop("disabled", false);
                    },
                    () => {
                        // Prepare styling for delete wrapper
                        $("#settingsPage #editPage #deleteWrapper #postDeleteWrapper").fadeTo(250, 1);
                        $("#settingsPage #editPage #deleteWrapper #stopDelete").css("opacity", "1");
                        $("#settingsPage #editPage #deleteWrapper #stopDelete").prop("disabled", false);
                        
                        // Objects are mutable, so we can "remotely" cancel deletion with this object
                        let cancelObject = { didCancel: false };

                        // In order to check if the username / password is right, update the account
                        let credentials = {};
                        credentials["email"] = $(`#settingsPage #editPage #deleteWrapper input[name="email"]`).val();
                        credentials["password"] = $(`#settingsPage #editPage #deleteWrapper input[name="password"]`).val();
                        AccountBackend.updateAccount(credentials, (response) => {
                            if ((response.status < 0) && (response.substatus == 6)) { // Error code for bad password
                                Popup.createConfirmationPopup("Your email or password was incorrect. Please try again", ["OK"]);
                                
                                cancelObject.didCancel = true;
                                $("#settingsPage #editPage #deleteWrapper #postDeleteWrapper").fadeTo(250, 0);
                                $("#settingsPage #editPage #deleteWrapper #deleteAccount").prop("disabled", false);
                                $("#settingsPage #editPage #deleteWrapper #stopDelete").off(); // Remove click handler
                            }
                        }, credentials["password"]);

                        $("#settingsPage #editPage #deleteWrapper #stopDelete").click((e) => {
                            cancelObject.didCancel = true;
                            $("#settingsPage #editPage #deleteWrapper #postDeleteWrapper").fadeTo(250, 0);
                            $("#settingsPage #editPage #deleteWrapper #deleteAccount").prop("disabled", false);
                            $("#settingsPage #editPage #deleteWrapper #stopDelete").off(); // Remove click handler
                        });

                        // Start account deletion routine
                        this.deleteAccountWithFeedback(cancelObject).then(() => {
                            // Called after the account has been deleted
                            Popup.createConfirmationPopup("Account successfully deleted. You will now be signed out.", ["OK"], [() => {
                                // Reset app data and restart
                                localStorage.clear();
                                dbConnection.deleteDatabase();
                                this.pageController.transitionObj.forceHaltSlide();
                                this.pageController.onChangePageSet(0); // 0 for Welcome
                                location.reload(); 
                            }]);
                        }, () => {
                            Popup.createConfirmationPopup("Sorry, an unknown error occured. Please contact support@sportwatch.us", ["OK"]);
                        });
                    }

                ]);
            });
        }); // End of population function

        this.pageTransition.slideLeft("editPage");
        $("#settingsPage #editPage").animate({
            scrollTop: 0
        }, 1000);
        let headerWidth = $("#settingsPage #editPage > .generic_header").height();
        $("#settingsPage #editPage > *:not(.generic_header)").first().css("margin-top", `calc(${headerWidth}px + 7vh)`);
    }

    startTeamPreferences() {
        let storage = window.localStorage;

        this.setupSettingsPage("Team Preferences");
        
        // Use local storage variables at first, but pull team data later
        // (see end of function for the backend pull)
        
        // ---- BUTTONS / INTERFACE SETUP ---- //
        
        // Have to use so many wrappers since many elements are added dynamically
        let baseContent = (`
            <button class="generated_button" style="background-color: #dd3333" id="leave_team_button">Leave Team</button>
            <hr>
            <div id="coachControlsWrapper" style="display: none">
                <div id="editTeamWrapper"></div>
                <br><hr>
                
                <div id="inviteCode" class="subheading_text">Invite Code: <span class="underline">Unknown<span></div>
                <div class="sectionWrapper">
                    <h1 id="h1_emailInvite">Invite via Email</h1>
                    <input id="input_athleteEmail" class="sw_text_input" type="text" placeholder="randy@sportwatch.us"></input>
                    <br>
                    <button id="button_sendInvite" class="sw_button" disabled>Invite</button>
                </div>
                <br><hr>
                
                <div id="kickWrapper"></div>
                <br><br>
                <div id="lockWrapper"></div>
                <br><hr>
                <!-- Hidden for secondary coach -->
                <div id="deleteWrapper" style="display: none">
                    <h1 class="subheading_text">Delete Team</h1>
                    <p>If you wish to delete this team, you will <b>permanently</b>
                    erase all associated settings. Athlete data (such as
                    records and times) will still be saved.</p>
                    <button id="deleteTeam" class="generated_button">Delete Team</button>
                    
                    <div id="postDeleteWrapper" style="opacity: 0;">
                        <p id="statusText"><i>Removing team data...</i></p>
                        <button id="stopDelete" class="sw_button">Cancel</button>
                    </div>
                </div>
            </div>
        `);
        $(this.inputDivIdentifier).append(baseContent);
        
        // BASIC INFO
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
        
        ValueEditor.editValues(this.inputDivIdentifier + " #editTeamWrapper", valuesToEdit, (newValues) => {
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
        $('#settingsPage #editPage #editTeamWrapper input[name="School"]').after(`<div id="searchList" class="noResults"></div>`);
        $("#settingsPage #editPage #editTeamWrapper .generated_button").prop("id", "changeTeamButton");
        $("#settingsPage #editPage #editTeamWrapper #changeTeamButton").prop("disabled", true); // Disable until edited
        
        // INVITE CODE
        let teamCode = "Unkown";
        if(storage.getItem("inviteCode") != null) {
            teamCode = storage.getItem("inviteCode");
            $(this.inputDivIdentifier + "#inviteCode").text(teamCode);
        }
        
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

                        ToolboxBackend.syncFrontendDatabase().then(() => {
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
            
            // User must select a dropdown option, so disable Change button until then
            schoolId = -1;
            
            input = input.replace(/[^A-Za-z0-9. ]/gm, "");
            // Search for schools with the given input
            ToolboxBackend.searchForSchool(input, 10, (response) => {
                if (response.status > 0) {
                    if (response.substatus == 2) { // No matches, clear list and generate nothing
                        this.generateSearchResults([], "#settingsPage #editPage #searchList"); // No options, so no need to resolve promise
                        // Hide the search list since there are no results
                        let searchList = $("#settingsPage #editPage #searchList");
                        if(!searchList.hasClass("noResults")) { // Only show if not already hidden
                            searchList.addClass("noResults");
                        }
                    } else {
                        // Show and generate the list
                        $("#settingsPage #editPage #searchList").removeClass("noResults");
                        this.generateSearchResults(response.matches, "#settingsPage #editPage #searchList").then((selectedSchool) => {
                            // Set the school name
                            let schoolName = selectedSchool.id.replace("school_", "").replace(/\-/gm, " ");
                            $("#settingsPage #editPage #searchList").empty();
                            $('#settingsPage #editPage input[name="School"]').val(schoolName);
                            
                            // Save school Id
                            $("#settingsPage #editPage #searchList").addClass("noResults");
                            schoolId = selectedSchool.id_school;
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
        });
        
        // KICK ATHLETE
        // Generate a list of athletes that can be kicked
        this.generateKickableAthletes(this.inputDivIdentifier + " #kickWrapper");
        
        // LOCK TEAM
        ButtonGenerator.generateToggle(this.inputDivIdentifier + " #lockWrapper", "Lock Team", false, function () {
            this.toggleLockWithFeedback();
        }.bind(this), function() {
            this.toggleLockWithFeedback();
        }.bind(this));
        $("#settingsPage #editPage .switch_container:last").prop("id", "lockTeamToggle"); // Add ID
        $("#settingsPage #editPage #lockTeamToggle").find(".switch").css("float", ""); // Clear float
        
        // DELETE TEAM
        $(this.inputDivIdentifier + " #deleteWrapper #deleteTeam").click((e) => {
            $(this.inputDivIdentifier + " #deleteWrapper #deleteTeam").prop("disabled", true);
            
            Popup.createConfirmationPopup("Are you sure you want to permanently delete your team?", ["No", "Yes"], [
                () => {
                    $(this.inputDivIdentifier + " #deleteWrapper #deleteTeam").prop("disabled", false);
                },
                () => {
                    // Set up postDeleteWrapper styling
                    $(this.inputDivIdentifier + " #deleteWrapper #postDeleteWrapper").fadeTo(250, 1);
                    $(this.inputDivIdentifier + " #deleteWrapper #stopDelete").css("opacity", "1");
                    $(this.inputDivIdentifier + " #deleteWrapper #stopDelete").prop("disabled", false);
                    
                    // Since objects are mutable in javascript, we can "remotely" control if
                    // the delete process finishes (there is a built in delay like gmail's "Undo send")
                    let controlObject = {"didCancel": false};
                    $(this.inputDivIdentifier + " #deleteWrapper #stopDelete").click((e) => {
                        controlObject.didCancel = true;
                        $(this.inputDivIdentifier + " #deleteWrapper #postDeleteWrapper").fadeTo(250, 0);
                        $(this.inputDivIdentifier + " #deleteWrapper #deleteTeam").prop("disabled", false);
                        $(this.inputDivIdentifier + " #deleteWrapper #stopDelete").off(); // Remove click handler
                    });
                    
                    // Call setting.js deleteTeam function
                    this.deleteTeamWithFeedback(controlObject).then(() => {
                        // Called after the team has been deleted
                        Popup.createConfirmationPopup("Team successfully deleted", ["OK"], [() => {
                            location.reload(); // Restart the app
                        }]);
                    }, () => {
                        Popup.createConfirmationPopup("Sorry, an unknown error occured. Please try again later.", ["OK"]);
                    });
                    
                }
            ]);
        });
        
        // Show control elements if the user is a coach
        if((storage.getItem("id_user") == storage.getItem("id_coachPrimary")) || 
            (storage.getItem("id_user") == storage.getItem("id_coachSecondary"))) {
            $(this.inputDivIdentifier + " #coachControlsWrapper").css("display", "block");
            
            // Only show delete option to primary coach
            if(storage.getItem("id_user") == storage.getItem("id_coachPrimary")) {
                $(this.inputDivIdentifier + " #coachControlsWrapper #deleteWrapper").css("display", "block");
            }
        }
        
        // Slide the page, we're ready to show the user
        this.pageTransition.slideLeft("editPage");
        $("#settingsPage #editPage").animate({
            scrollTop: 0
        }, 1000);
        let headerWidth = $("#settingsPage #editPage > .generic_header").height();
        $("#settingsPage #editPage > *:not(.generic_header)").first().css("margin-top", `calc(${headerWidth}px + 7vh)`);
        
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
        let headerWidth = $("#settingsPage #editPage > .generic_header").height();
        $("#settingsPage #editPage > *:not(.generic_header)").first().css("margin-top", `calc(${headerWidth}px + 7vh)`);
    }
    
    startMembership() {
        this.setupSettingsPage("Membership");
        
        // Popup.createPremiumPopup();
        
        let pageContent = (`
            <br>
            <img id="membershipGraphic" src="img/invalidSymbol.png" alt="INACTIVE">
            <h1 class="membershipHeader">
                Membership Status: 
                <span id="membershipStatus">Inactive</span>
            </h1>
            <br>
            <button id="restartMembership" class="sw_big_button">Start Your Membership</button>
            <hr>
            <h1 class="membershipHeader"><u>Details</u></h1>
            <div id="individualOwner" class="stateWrapper" style="display: inline-block">
                <p>Plan: <span id="planType">Monthly</span></p>
                <p><span id="statusHistoryWording">Last Active</span>: <span id="statusDate">1/1/2001</span></p>
                <p id="cancelMembership" class="infoText hidden">
                    <i>To cancel, go to your device's settings to manage your subscriptions. Subscription take around a minute to update.</i>
                </p>
                <br>
                <hr>
                <p>Click the button below to open your device's subscription settings.</p><br>
                <button id="goToSettings" class="subAction sw_button">Subscription Settings</button>
                <br><br>
                <hr>
                <br><br><br><br>
                <!-- <button id="refreshPurchases" class="subAction sw_button">Refresh Purchases</button> -->
            </div>
            <div id="teamOwner" class="stateWrapper" style="display: none">
                <p>Inherited from Team</p>
                <p class="infoText"><i>A user on your team has an active Sportwatch Membership, which qualifies
                    the entire team for Membership benefits. If you leave this team, you
                    may have to purchase your own membership.
                </i></p>
            </div>
            <br><br>
        `);
        $(this.inputDivIdentifier).append(pageContent);
        
        // Set up button handlers
        $(`#settingsPage #editPage #restartMembership`).click((e) => {
            Popup.createPremiumPopup();
            this.pageTransition.slideRight("catagoryPage");
            $("#settingsPage .cat_button").removeClass("cat_button_selected");
        });
        $(`#settingsPage #editPage #goToSettings`).click((e) => {
            store.manageSubscriptions();
        });
        // $(`#settingsPage #editPage #refreshPurchases`).click((e) => {
        //     Popup.createConfirmationPopup("Restoration in progress. Please wait...", ["OK"]);
        //     store.register([{
        //             // Sportwatch Monthly
        //             id: Constant.IOS_MONTHLY_ID,
        //             type: store.PAID_SUBSCRIPTION,
        //         }
        //     ]);
        //     store.refresh().finished(() => {
        //         console.log("Finished");
        //         $(".popup").fadeOut(Constant.popupFadeoutDuration, () => {
        //             $(".popup").remove();
        //         });
        //     });
        // });
        
        // Check to see who owns the plan (team or this user)
        PlanBackend.getMembershipStatus(localStorage.getItem("email"), (response) => {
            if(response.status > 0) {
                
                // Set the general info (icon, status header, etc)
                if(response.canUseApp) {
                    $(`#settingsPage #editPage #restartMembership`).addClass("hidden");
                    $(`#settingsPage #editPage #membershipGraphic`).prop("src", "img/validSymbol.png");
                    $(`#settingsPage #editPage #membershipGraphic`).prop("alt", "ACTIVE");
                    $(`#settingsPage #editPage #membershipStatus`).text("Active");
                }
                
                // Set up the details (dependent on if the membership is user or team owned)
                if(response.teamHasMembership) {
                    // Hide individual, show team (nothing else to do to protect privacy)
                    $("#settingsPage #editPage #individualOwner").css("display", "none");
                    $("#settingsPage #editPage #teamOwner").css("display", "inline-block");
                } else {
                    this.populatePlanIndividual(localStorage.getItem("email"));
                }
            } else {
                Popup.createConfirmationPopup("Sorry, an unknown error occured while fetching your Membership details.", ["OK"], [
                    () => {
                        this.pageTransition.slideRight("catagoryPage");
                }]);
            }
        });
        
        
        this.pageTransition.slideLeft("editPage");
        let headerWidth = $("#settingsPage #editPage > .generic_header").height();
        $("#settingsPage #editPage > *:not(.generic_header)").first().css("margin-top", `calc(${headerWidth}px + 7vh)`);
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

            // trying to manually reset variables on signout is annoying.
            // so we're just gonna restart the whole app lmao but it works
            location.reload(); 

        }, () => {
            // Do nothing since they didn't want to sign out
            $("#settingsPage .cat_button").removeClass("cat_button_selected");
        }]);

    }
    
    startSupport() {
        this.setupSettingsPage("Support");
        
        let pageContent = (`
            <br>
            <div id="supportWrapper">
                <p><b><i>Have a question? Need help?</i> You can contact us by:</b></p>
                <p class="contactPoint" style="font-weight: 500">
                    Email: <a href="mailto:support@sportwatch.us">support@sportwatch.us</a>
                </p>
                <br><br>
                <hr>
                <br><br>
                <p id="policiesText" style="font-weight: 500">
                    View our <a href="https://sportwatch.us/terms-of-use/">Terms of Use</a> and our
                    <a href="https://sportwatch.us/privacy-policy/">Privacy Policy</a> by tapping to view them on our website!
                </p>
                <br><br>
                <hr>
                <p id="appVersion">${device.platform} - v${AppVersion.version}</p>
            </div>
        `);
        $(this.inputDivIdentifier).append(pageContent);
        
        // Slide the page since it's set up
        this.pageTransition.slideLeft("editPage");
        let headerWidth = $("#settingsPage #editPage > .generic_header").height();
        $("#settingsPage #editPage > *:not(.generic_header)").first().css("margin-top", `calc(${headerWidth}px + 7vh)`);
    }
    
    // MISC FUNCTIONS //
    
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
     * Populates a list of kickable athletes and appends a "Remove athlete" button.
     * All of this is created inside a form HTML element and will
     * be appended o the end of the given element (in the first parameter)
     * 
     * @example generateKickableAthletes("#editPage")
     * 
     * @param {String} appendToElement jQuery selector that identifies where the form will be appended
     */
    generateKickableAthletes(appendToElement) {
        // generate select form to select an athlete, and pass its rowid to deleteAthlete
        dbConnection.selectValues("SELECT *, rowid FROM athlete").then((athletes) => {
            
            let values = { };
            for (let i = 0; i < athletes.length; i++) {
                values[`${athletes.item(i).fname} ${athletes.item(i).lname}`] = athletes.item(i).rowid;
            }

            ButtonGenerator.generateSelectForm(appendToElement, "Remove Athlete from Team", "Remove Selected Athlete", values, (form) => {
                dbConnection.selectValues("SELECT id_backend, fname FROM athlete WHERE rowid = ?", [$(form).val()]).then((athlete) => {
                    this.kickAthleteWithFeedback($(form).val(), athlete.item(0).id_backend, athlete.item(0).fname);
                });
            });
            $(".generic_select").addClass("sw_dropdown").removeClass("generic_select");
        });
    }
    
    /**
     * Kicks the athlete identified by the given local and backend database IDs.
     * It will also display popup messages that provide feedback to the user
     * in the event of any errors
     * 
     * @param {Integer} rowid local database id of the athlete
     * @param {Integer} id_backend backend database id of the athlete
     * @param {String} firstName first name of the athlete to kick; used to confirm kick
     */
    kickAthleteWithFeedback(rowid, id_backend, firstName) {
        
        Popup.createConfirmationPopup("Are you sure you want to delete this athlete?", ["Yes", "No"], [() => {
            
            // Kick the athlete with the given ID
            TeamBackend.kickAthlete(id_backend, (result) => {
                if(result.status > 0) {
                    dbConnection.deleteValues("athlete", "WHERE rowid = ?", [rowid]);
                    $(this.inputDivIdentifier).find("form").remove();
                    this.generateKickableAthletes(this.inputDivIdentifier + " #kickWrapper");
                    
                    Popup.createConfirmationPopup(firstName + " has been kicked from the team", ["OK"]);
                } else {
                    if(result.substatus == 3) {
                        if(result.msg.includes("not in team")) {
                            Popup.createConfirmationPopup("That user is no longer in the team", ["OK"]);
                        } else if(result.msg.includes("primary")) {
                            Popup.createConfirmationPopup("The primary coach cannot be kicked", ["OK"]);
                        } else {
                            Popup.createConfirmationPopup("Only coaches can kick an athlete", ["OK"]);
                        }
                    } else {
                        Popup.createConfirmationPopup("Sorry, an error occured. Please try again later"), ["OK"];
                    }
                } // End of error processing
            });
        }, () => {
            // no action, user clicked No
        }]);
    }
    
    /**
     * Puts on a small "show" or animation for 4 seconds for the user when they delete their account.
     * To stop the process, set didCancel = true in the mutable controlObject.
     * 
     * @example let controlObj = {didCancel: false}
     *          deleteAccountWithFeedback(controlObj).then(() => { // Success }).error(() => { // Failure });
     * 
     * @param {Object} controlObject should contain "didCancel" boolean property used to stop team deletion
     * 
     * @returns
     * A promise, used to clean up the app after the user's account has been deleted.
     */
    deleteAccountWithFeedback(controlObject) {

        let hasDeleted = $.Deferred();
        let textArray = ["Leaving team...", "Finding records...", "Deleting records...", "Revoking login data...", "Purging account..."];
        let delayArray = [500, 500, 1500, 1000, 1500];

        // First, change the "status" text a few times to make it seem real and give user a change to cancel
        this.delayedDelete(controlObject, this.inputDivIdentifier + " #deleteWrapper", textArray, delayArray, (shouldDelete) => {

            // Don't reject since it's used to handle errors from the backend process
            if (!shouldDelete) {
                return;
            }
            $(this.inputDivIdentifier + " #deleteWrapper #postDeleteWrapper").fadeTo(250, 0);
            
            let email = $(`#settingsPage #editPage #deleteWrapper input[name="email"]`).val();
            let password = $(`#settingsPage #editPage #deleteWrapper input[name="password"]`).val();
            AccountBackend.deleteAccount(email, password, (response) => {
                console.log(response);
                if (response.status > 0) {
                    hasDeleted.resolve();
                } else {
                    if(response.substatus == 6) {
                        Popup.createConfirmationPopup("Your email or password was incorrect. Please try again", ["OK"]);
                    } else {
                        hasDeleted.reject();
                    }
                }
            });
        });

        return hasDeleted.promise();
    }
    
    /**
     * Puts on a small "show" or animation for 2.5 seconds for the user when they delete the team.
     * To stop the process, set didCancel = true in the mutable controlObject.
     * 
     * @example let controlObj = {didCancel: false}
     *          deleteTeamWithFeedback(controlObj).then(() => { // Success }).error(() => { // Failure });
     * 
     * @param {Object} controlObject should contain "didCancel" boolean property used to stop team deletion
     * 
     * @returns
     * A promise, used to clean up the app after the team has been deleted.
     */
    deleteTeamWithFeedback(controlObject) {
        
        let hasDeleted = $.Deferred();
        let textArray = ["Kicking athletes...", "Demoting coaches...", "Erasing team structure...", "Finalizing..."];
        let delayArray = [500, 1000, 1000, 500];
        
        // First, change the "status" text a few times to make it seem real and give user a change to cancel
        this.delayedDelete(controlObject, this.inputDivIdentifier + " #deleteWrapper", textArray, delayArray, (shouldDelete) => {
            
            // Don't reject since it's used to handle errors from the backend process
            if(!shouldDelete) {
                return;
            }
            $(this.inputDivIdentifier + " #deleteWrapper #postDeleteWrapper").fadeTo(250, 0);
            
            TeamBackend.deleteTeam((response) => {
                if(response.status > 0) {
                    // Return to the calling function
                    hasDeleted.resolve();
                } else {
                    if(response.substatus == 3) {
                        Popup.createConfirmationPopup("Only the primary coach can delete the team.", ["OK"]);
                    } else {
                        hasDeleted.reject();
                    }
                }
            });
        });
        
        return hasDeleted.promise();
    }
    
    /**
     * Inspired by Gmail's Undo Send feature, this function will delay an action
     * (like deleting) while showing messages to the user to make them believe it's
     * actually being done. The user can then cancel, which should set controlObject.didCancel = true,
     * which will prevent the action from firing. The wrapper should have elements with
     * the following IDs: statusText, stopDelete
     * 
     * @example delayedDelete({didCancel: false}, "#mainPage #deleteWrapper", ["Removing Account", "Purging data"], [1000, 1000],
     *                        (shouldProceed) => { // Delete account if shouldProceed = true });
     *          --> Waits 2 seconds before deleting the account
     * 
     * @param {Object} controlObject object containing a boolean didCancel; used to stop the action from occuring
     * @param {String} deleteSelector jQuery selection string of the div containing delete elements
     * @param {Array} deleteMessages array of strings to display during the delay
     * @param {Array} messageDelays array of integers representing the delay between messages
     * @param {Function} cb function to call after the delay accepting a boolean shouldProceed
     */
    delayedDelete(controlObject, deleteSelector, deleteMessages, messageDelays, cb) {
        
        // Do some parameter checks
        if($(deleteSelector).length == 0) {
            if(DO_LOG) {
                console.log("[settings.js]: Unable to locate \"" + deleteSelector + "\" in DOM");
                cb(false);
            }
        }
        if(deleteMessages.length == 0) {
            if(DO_LOG) {
                console.log("[settings.js]: No message to display while deleting");
                cb(true); // Go forth with the action anyways
            }
        }
        while(deleteMessages.length > messageDelays.length) {
            messageDelays.push(500);
        }
        while(messageDelays.length > deleteMessages.length) {
            messageDelays.splice(0, 1); // Remove elements until the size is equal
        }
        
        // Create the timeouts to display the messages
        let durationSum = 0;
        for(let m = 0; m < deleteMessages.length; m++) {
            
            // This is what will be done in setTimeout
            // Use a variable to define, so it can be changed if it's the last message (call the callback)
            let actionFunction = () => {
                if(!controlObject.didCancel) {
                    $(deleteSelector + " #statusText").html(`<i>${deleteMessages[m]}</i>`);
                }
            }
            
            // If it's the last message, call the callback here
            if(m == (deleteMessages.length - 1)) {
                actionFunction = () => {
                    $(deleteSelector + " #statusText").html(`<i>${deleteMessages[m]}</i>`);
                    $(deleteSelector + " #stopDelete").prop("disabled", true);
                    $(deleteSelector + " #stopDelete").fadeTo(250, 0);
                    
                    // Invert didCancel since the callback accepts a shouldProceed boolean
                    // (if they cancelled, didCancel = true, but shouldProceed needs to be false)
                    cb(!controlObject.didCancel);
                }
            }
            
            setTimeout(actionFunction, durationSum);
            durationSum = durationSum + messageDelays[m];
        }
    }
    
    /**
     * Gets the plan details for the individual specified. It will then
     * populate the Membership page's Details portion, defining
     * how long the membership is valid for and how to cancel.
     * 
     * @param {String} userEmail email of the logged in user to fetch the plan for
     */
    populatePlanIndividual(userEmail) {
        
        // Get the user's individual plan
        PlanBackend.getActivePlan(userEmail, (response) => {
            if (response.status > 0) {

                // Set plan name
                let planName = response.planName;
                $(`#settingsPage #editPage #planType`).text(planName);

                // In case they've never had a plan before
                if ((response.endsOn == undefined) || (response.endsOn == "2001-01-01")) {
                    // Define a fallback date in case isActive is true for some reason
                    response.endsOn = new Date().toISOString().substr(0, 10);
                    $(`#settingsPage #editPage #statusDate`).text("NA");

                } else {
                    // Set date that plan ended / will end
                    let endsDate = response.endsOn.split("-");
                    if (parseInt(endsDate[1]) < 10) { // Remove leading 0 from month
                        endsDate[1] = endsDate[1].substr(1, 1);
                    }
                    if (parseInt(endsDate[2] < 10)) { // Remove leading 0 from day
                        endsDate[2] = endsDate[2].substr(1, 1);
                    }
                    endsDate = endsDate[1] + "/" + endsDate[2] + "/" + endsDate[0];
                    $(`#settingsPage #editPage #statusDate`).text(endsDate);
                }

                // Change wording
                if (response.isActive == true) {
                    // Set the elements to reflect an active membership
                    $(`#settingsPage #editPage #cancelMembership`).removeClass("hidden");

                    $(`#settingsPage #editPage #statusHistoryWording`).text("Next Renewal");
                    let endsDate = response.endsOn.split("-");
                    if (parseInt(endsDate[1]) < 10) { // Remove leading 0 from month
                        endsDate[1] = endsDate[1].substr(1, 1);
                    }
                    if (parseInt(endsDate[2] < 10)) { // Remove leading 0 from day
                        endsDate[2] = endsDate[2].substr(1, 1);
                    }
                    endsDate = endsDate[1] + "/" + endsDate[2] + "/" + endsDate[0];
                    $(`#settingsPage #editPage #statusDate`).text(endsDate);

                }

            } else {
                Popup.createConfirmationPopup("Sorry, an unknown error occured. Please contact support or try again later.", ["OK"]);
                return; // Don't let the page slide
            }
        });
        
    }
    
    /**
     * Generates a list of schools that match the given search. It will position
     * these slightly below the input to allow for each click access for the
     * user.
     * 
     * @param {AssociativeArray} resultsList js object returned from the backend search request
     * @param {String} resultsContainer jQuery selector for where to append the results to
     */
    generateSearchResults(resultsList, resultsContainer) {

        let schoolArray = []; // Array of button attribute objects [{...}, {...}, etc.]
        let currentSchool = {}; // Set to each object in the matches array
        let loopCount = 5; // Max number of results to show

        // Clear list to remove old results "#settingsPage #editPage #searchList"
        $(resultsContainer).empty();

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
        ButtonGenerator.generateButtons(resultsContainer, schoolArray, (school) => {

            // Unfocus input, select the school, and clear search results
            document.activeElement.blur();
            afterSchoolSelect.resolve(school);
            
            // let schoolName = school.id.replace("school_", "").replace(/\-/gm, " ");
            // $("#settingsPage #editPage #searchList").empty();
            // $('#settingsPage #editPage input[name="School"]').val(schoolName);
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
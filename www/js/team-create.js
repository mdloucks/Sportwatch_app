/**
 * @classdesc Houses specifically the creation aspect of team logic
 * @class
 */
class CreateTeam extends Page {

    constructor(id, pageSetObject, landingPageCopy) {
        super(id, "CreateTeam");

        this.pageController = pageSetObject;
        this.transitionObj = new PageTransition("#createteamPage");
        this.teamLandingCopy = landingPageCopy; // Used to get back to landing page

        // Team properties
        this.teamName = "";
        this.schoolId = -1;
        this.schoolName = ""; // TODO: Change to ID or maybe an auto-complete
        this.secondaryCoach = "";

        // Control variables
        this.nameIsValid = false;
        this.secondaryValid = false; // Secondary coach
        this.codeValid = false; // Invite code

        // Playground:  https://jsbin.com/mokimapiho/edit?html,js,output

        // ---- PAGES ---- /

        this.namePage = (`
            <div id="namePage" class="div_page">
                <h1 id="h1_giveName">Name the Team</h1><br>
                <input id="input_teamName" class="sw_text_input" type="text" placeholder="Track Team"></input>
                <input id="button_submitName" type="submit" value=" " disabled></input>
                <br>
                <p id="p_tipHeading"><u>Naming Tips</u></p><br>
                <ul class="ul_tips">
                    <li id="tip_length" class="tips bolded">Use 5-45 characters</li><br>
                    <li id="tip_specials" class="tips">Avoid special characters</li><br>
                    <li id="tip_capitalize" class="tips bolded">Capitalize significant words</li><br>
                    <li id="tip_uniqueName" class="tips">Create a unique name</li>
                </ul>
                <br>
                
                <!-- Progression Buttons -->
                <button id="nameBack" class="button_progression button_back"></button>
            </div>
        `);

        // TODO: Add "fill in" / school search and store ID instead of name
        this.schoolPage = (`
            <div id="schoolPage" class="div_page">
                <h1 id="h1_schoolName">Team's School</h1>
                <input id="input_school" class="sw_text_input" type="text" placeholder="Springtime School"></input>
                <div id="searchList">
                    <!-- School matches go here -->
                </div>
                <button id="noSchool">Tap Here to Skip</button>
                <br>
                
                <!-- Progression Buttons -->
                <button id="schoolBack" class="button_progression button_back"></button>
                <button id="schoolNext" class="button_progression button_next" disabled></button>
            </div>
        `);

        this.optionsPage = (`
            <div id="optionsPage" class="div_page">
                <!-- <h1 id="h1_secondaryCoach">Secondary Coach (Optional)</h1>
                <input id="input_secondaryCoach" class="sw_text_input" type="text" placeholder="assistant@sportwatch.us"></input>
                <br> -->
                <h1 id="h1_inviteCode">Invite Code (Optional)</h1>
                <input id="input_inviteCode" class="sw_text_input" type="text" placeholder="7 character code (lclcm3y)"></input>
                <br><br>
                <p id="p_trialInfo">
                    Once you create the team, you will have <b>15 days</b> of free unrestricted
                    access. You will <b>not be charged</b> until you purchase a Sportwatch Membership.
                </p>
                
                <!-- Progression Buttons -->
                <button id="button_createTeam">Create Team</button><br><br><br>
                <button id="optionsBack" class="button_progression button_back"></button>
            </div>
        `);

        this.postCreatePage = (`
            <div id="postCreatePage" class="div_page">
                <h1 id="h1_created">Team Created!</h1>
                <p>
                    Congratulations! You have successfully created a team!
                    Your invite code is <b><u><span id="inviteCode">Not Avaiable</span></u></b>.
                    Share this with your athletes, or invite them below!
                </p>
                
                <button id="button_goToInvite">Invite Athletes</button><br>
                <button id="button_goToMain">Done</button>
            </div>
        `);

        this.invitePage = (`
            <div id="invitePage" class="div_page">
                <!-- 
                <div id="schoolInviteWrapper" class="sectionWrapper" style="display: none;">
                    <h1 id="h1_schoolInvite">Invite from School</h1>
                    <div id="schoolAthletesList">
                        <!-- Athlete Buttons will be added here --><!--
                    </div>
                </div>
                
                <div class="sectionWrapper">
                    <h1 id="h1_emailInvite">Invite via Email</h1>
                    <input id="input_athleteEmail" class="sw_text_input" type="text" placeholder="randy@sportwatch.us"></input>
                    <br>
                    <button id="button_sendInvite" class="sw_button">Invite</button>
                </div>
                -->
                
                <div id="addAthleteWrapper" class="sectionWrapper">
                    <h1 id="h1_addAthlete">Add an Athlete</h1>
                    <p class="inputLabel">First and Last Name</p>
                    <input id="input_athleteFname" class="sw_text_input athleteName invalid" type="text" placeholder="Randy"></input>
                    <input id="input_athleteLname" class="sw_text_input athleteName invalid" type="text" placeholder="Jones"></input>
                    <p class="inputLabel">Competition Gender</p>
                    <select id="input_athleteGender" class="dropdown_input invalid" name="gender">
                        <option value="NA">-- Tap to Select --</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                    </select>
                    <p class="inputLabel">Email (Optional)</p>
                    <input id="input_athleteEmail" class="sw_text_input" type="text" placeholder="randy@sportwatch.us"></input>
                    <br>
                    
                    <button id="button_sendInvite" class="sw_button">Add Athlete</button>
                </div>
                
                <button id="button_addAthleteRoster" class="sw_button">Import Roster</button><br><br><br>
                
                <!-- Progression Buttons -->
                <button id="inviteBack" class="button_progression button_back"></button><br>
                <br><br><br><br><br><br>
            </div>
        `);
    }

    getHtml() {
        return (`
            <div id="createteamPage" class="div_page">
                <div id="banner">
                    <h1>Create Team</h1>
                    <span class="step step_selected" id="step1">1</span>
                    <span class="step" id="step2">2</span>
                    <span class="step" id="step3">3</span>
                </div>
                ${this.namePage}
                ${this.schoolPage}
                ${this.optionsPage}
                ${this.postCreatePage}
                ${this.invitePage}
            </div>
        `);
    }

    start() {

        // Only link them to pageTransition once
        if (this.transitionObj.getPageCount() == 0) {
            this.transitionObj.addPage("namePage", this.namePage, true);
            this.transitionObj.addPage("schoolPage", this.schoolPage);
            this.transitionObj.addPage("optionsPage", this.optionsPage);
            this.transitionObj.addPage("postCreatePage", this.postCreatePage);
            this.transitionObj.addPage("invitePage", this.invitePage);
        } else {
            // Hide other pages besides current (see team.js for full explanation)
            this.transitionObj.hidePages();
            this.transitionObj.showCurrentPage();
        }

        // Focus on any elements that are clicked
        this.getPageElement("input").click((e) => {
            $(e.target).focus();
        });

        // ---- VALUE POPULATION ---- //

        // Fetch account school to auto-fill
        AccountBackend.getAccount((response) => {
            if (response.status < 0) {
                if (DO_LOG) {
                    console.log("[team-create.js:start()]: Requesting account info failed");
                }
            } else {
                if(response.id_school != undefined) {
                    this.schoolName = response.schoolName;
                    this.schoolId = response.id_school;
                    this.getPageElement("#input_school").val(response.schoolName);
                    this.getPageElement("#schoolPage .button_next").prop("disabled", false);
                }
            }
        });
        
        // Get Plan info to see if the free trial has been used
        PlanBackend.getActivePlan(localStorage.getItem("email"), (planInfo) => {
            if(planInfo.status > 0) {
                if(planInfo.isActive) {
                    // Remove the free trial text since they already have a subscription
                    $("#createteamPage #p_trialInfo").html(``);
                } else if(planInfo.usedFreeTrial) {
                    $("#createteamPage #p_trialInfo").html(`You will be required to <b>purchase a Sportwatch Membership to use your
                                                            team</b> since you've already used your 15-day free trial.`);
                } else {
                    // Reset it here in case they buy a membership in the middle of creating a team
                    $("#createteamPage #p_trialInfo").html(`Once you create the team, you will have <b>15 days</b> of free unrestricted
                                                            access. You will <b>not be charged</b> until you purchase a Sportwatch Membership.`);
                }
            } else {
                $("#createteamPage #p_trialInfo").html(`You may be required to purchase a Sportwatch Membership after creating your team.`);;
            }
        });


        // ---- PROGRESSION BUTTONS ---- //

        // Progression buttons (LAST 2 PAGES)
        this.getPageElement(".button_next").click((e) => {
            let currentPage = this.transitionObj.getCurrentPage();
            document.activeElement.blur();

            if (currentPage.includes("school")) {
                this.selectPage(3);
                this.schoolName = this.getPageElement("#input_school").val().trim();
                if (this.secondaryValid) {
                    this.secondaryCoach = this.getPageElement("#input_secondaryCoach").val().trim();
                }
            } else {
                if (DO_LOG) {
                    console.log("[team-create.js:start()]: Next button not configured for page " + currentPage);
                }
            }
        });

        // Back button
        this.getPageElement(".button_back").click((e) => {
            let currentPage = this.transitionObj.getCurrentPage();
            document.activeElement.blur();

            if (currentPage.includes("name")) {
                this.teamLandingCopy.transitionObj.slideRight("landingPage", 500); // Go back to "main menu"
                this.stop();

            } else if (currentPage.includes("school")) {
                this.selectPage(1, false);
                this.getPageElement("#schoolAthletesList").html(""); // Clear in case school is changed

            } else if (currentPage.includes("options")) {
                this.selectPage(2, false);

            } else if (currentPage.includes("invite")) {
                this.transitionObj.slideRight("postCreatePage");

            } else {
                if (DO_LOG) {
                    console.log("[team-create.js:start()]: Back button not configured for page " + currentPage);
                }
            }
        });

        // Invite button
        this.getPageElement("#button_goToInvite").click((e) => {
            // Try getting a list of athletes from the school's team
            ToolboxBackend.getUsersInSchool(this.schoolId, (response) => {
                if((response.status > 0) && (this.schoolId != 2)) { // Ignore if they skipped school (id=2)
                    this.generateAthleteButtons(response);
                } else {
                    if (DO_LOG) {
                        console.log("[team-create.js:start()]: Unable to get school users, hiding that portion");
                    }
                    this.getPageElement("#schoolInviteWrapper").css("display", "none");
                }
            });

            this.transitionObj.slideLeft("invitePage");
        });

        // Exit page / go to main page button
        this.getPageElement("#button_goToMain").click((e) => {
            this.teamLandingCopy.transitionObj.slideRight("teamPage", 500); // Go back to "main menu"
            this.teamLandingCopy.mainTeam.start();

            this.stop();
            this.transitionObj.setCurrentPage("namePage");
        });

        // ---- SUBMIT LOGIC ---- //

        // Team name
        this.getPageElement("#button_submitName").on("click", (e) => {
            e.preventDefault();
            document.activeElement.blur();

            if (this.nameIsValid) {
                this.teamName = this.getPageElement("#input_teamName").val().trim();
                this.selectPage(2);
            } else {
                // Not valid, so blur (aka hide the keyboard) to show the tips
                document.activeElement.blur();
            }
        });

        // Create team (what you've all been waiting for!)
        this.getPageElement("#button_createTeam").on("submit click", (e) => {
            let teamDetails = {}; // Compose the details of the team
            teamDetails.id_school = this.schoolId;
            teamDetails.primaryCoach = localStorage.getItem("email");

            // If it's disabled, ignore the submit request
            if (this.getPageElement("#button_createTeam").prop("disabled")) {
                return; // Exit the handler, not valid
            }

            if (this.secondaryValid) {
                teamDetails.secondaryCoach = this.getPageElement("#input_secondaryCoach").val();
            }
            if (this.codeValid) {
                teamDetails.inviteCode = this.getPageElement("#input_inviteCode").val();
            }

            TeamBackend.createTeam(this.teamName, (response) => {
                if (response.status > 0) {
                    this.handleCreation(response.id_team, response.teamName, response.inviteCode);
                } else {

                    if (response.substatus == 4) { // Too similar
                        Popup.createConfirmationPopup("A team like this already exists. Would you like to create it anyway?",
                            ["Cancel", "Create Anyway"], [() => {}, () => {
                                // Force create the team
                                teamDetails.force = true;
                                TeamBackend.createTeam(this.teamName, (r) => {
                                    if (r.status > 0) {
                                        this.handleCreation(r.id_team, r.teamName, r.inviteCode);
                                    } else {
                                        Popup.createConfirmationPopup("Team creation failed!", ["OK"], [() => {}]);
                                    }
                                }, teamDetails);
                            }]);
                    } else {
                        Popup.createConfirmationPopup("An unknown error occured, please try again", ["OK"], [() => {}]);
                    }
                }
            }, teamDetails);
        });

        // ---- INPUT CHECKS ---- //

        // Tip highlighting
        this.getPageElement("#input_teamName").on("keyup", (e) => {
            let keyCode = e.keyCode || e.charCode;
            if (keyCode == 13) { // Enter
                // Focus next input field
                this.getPageElement("#button_submitName").trigger("click");
            }
        });
        this.getPageElement("#input_teamName").on("input", (e) => {

            let input = this.getPageElement("#input_teamName").val();
            input = input.trim();
            // Set it as true; if it passes, it won't be set to false
            this.nameIsValid = true;

            // Length
            if ((input.length < 5) || (input.length > 45)) {
                // Bold this tip since the criteria isn't met yet
                if (!this.getPageElement("#tip_length").hasClass("bolded")) {
                    this.getPageElement("#tip_length").addClass("bolded");
                }
                this.nameIsValid = false;
            } else {
                this.getPageElement("#tip_length").removeClass("bolded");
            }

            // Special characters (Plus &)
            if (input.replace(Constant.REGEX.teamName, "").length > 0) {
                if (!this.getPageElement("#tip_specials").hasClass("bolded")) {
                    this.getPageElement("#tip_specials").addClass("bolded");
                }
                this.nameIsValid = false;
            } else {
                this.getPageElement("#tip_specials").removeClass("bolded");
            }

            // Capitalization (suggestion, not required)
            if (!(/[A-Z]/g.test(input))) {
                if (!this.getPageElement("#tip_capitalize").hasClass("bolded")) {
                    this.getPageElement("#tip_capitalize").addClass("bolded");
                }
            } else {
                this.getPageElement("#tip_capitalize").removeClass("bolded");
            }

            if (this.nameIsValid) {
                this.getPageElement("#button_submitName").prop("disabled", false);
            } else {
                this.getPageElement("#button_submitName").prop("disabled", true);
            }
        });

        // School name checking
        this.addInputCheck("#input_school", 5, 65, Constant.REGEX.schoolName, false, (schoolValid) => {
            // Disable the input by default until a school is clicked
            this.getPageElement("#schoolPage .button_next").prop("disabled", true);

            // Search for schools with the given input
            ToolboxBackend.searchForSchool(this.getPageElement("#input_school").val(), 10, (response) => {
                if (response.status > 0) {
                    if (response.substatus == 2) { // No matches, clear list and generate nothing
                        this.generateSearchResults([]);
                    } else {
                        this.generateSearchResults(response.matches);
                    }
                }
            });

        }, () => { // Blur upon enter press
            document.activeElement.blur();
        });
        this.getPageElement("#schoolPage #noSchool").click((e) => {
            // Simulate selecting a school, but don't show the user
            // Unfocus input, select the school, and clear search results
            document.activeElement.blur();
            this.schoolId = 2; // <-- Pre-programmed "None" school
            this.schoolName = ""; // Can be blank, only used internally
            
            this.getPageElement("#searchList").empty();
            this.getPageElement("#input_school").val(this.schoolName);
            this.getPageElement("#schoolPage .button_next").trigger("click");
        });

        // Secondary coach email (Options page)
        this.addInputCheck("#input_secondaryCoach", 5, 65, Constant.REGEX.emailBroad, true, (secondaryValid) => {

            let inputEmail = this.getPageElement("#input_secondaryCoach").val().trim();
            if (inputEmail.length > 0) {
                // Make sure email has all necessary parts (if given)
                let emailValidMatch = inputEmail.match(Constant.REGEX.emailParts);
                if (emailValidMatch == null) {
                    secondaryValid = false;
                } else if (emailValidMatch[0].length != inputEmail.length) {
                    secondaryValid = false;
                }

                this.secondaryValid = secondaryValid;
                this.getPageElement("#button_createTeam").prop("disabled", !secondaryValid);

            } else { // Blank, so enable button since it's optional
                this.secondaryValid = false;
                this.getPageElement("#button_createTeam").prop("disabled", false);
            }
        }, () => { // On enter press
            document.activeElement.blur();
            // this.getPageElement("#input_inviteCode").focus(); // Doesn't seem to work on iOS
        });

        // Invite code (Options page)
        this.addInputCheck("#input_inviteCode", 7, 7, Constant.REGEX.inviteCode, true, (codeValid) => {

            let inputCode = this.getPageElement("#input_inviteCode").val().trim();
            if (inputCode.length > 0) {
                this.codeValid = codeValid;
                this.getPageElement("#button_createTeam").prop("disabled", !codeValid);
            } else {
                this.codeValid = false;
                this.getPageElement("#button_createTeam").prop("disabled", false);
            }

        }, () => { // On enter press
            document.activeElement.blur();
            this.getPageElement("#button_createTeam").trigger("click");
        });
        
        // Invite Athlete - First Name
        this.addInputCheck("#input_athleteFname", 3, 127, Constant.REGEX.humanNameSingle, false, (fnameValid) => {
            
            // Update visuals
            $(document.activeElement).removeClass("invalid");
            if(!fnameValid) {
                $(document.activeElement).addClass("invalid");
            }
            
            // Update send invite button
            if((fnameValid) && (this.getPageElement("#addAthleteWrapper *.invalid").length == 0)) {
                this.getPageElement("#button_sendInvite").prop("disabled", false);
            } else {
                this.getPageElement("#button_sendInvite").prop("disabled", true);
            }
        }, () => { // On enter press
            document.activeElement.blur();
            this.getPageElement("#input_athleteLname").focus();
            // this.getPageElement("#button_sendInvite").trigger("click");
        });
        // Invite Athlete - Last Name
        this.addInputCheck("#input_athleteLname", 3, 127, Constant.REGEX.humanNameSingle, false, (lnameValid) => {

            // Update visuals
            $(document.activeElement).removeClass("invalid");
            if(!lnameValid) {
                $(document.activeElement).addClass("invalid");
            }

            // Update send invite button
            if((lnameValid) && (this.getPageElement("#addAthleteWrapper *.invalid").length == 0)) {
                this.getPageElement("#button_sendInvite").prop("disabled", false);
            } else {
                this.getPageElement("#button_sendInvite").prop("disabled", true);
            }
        }, () => { // On enter press
            document.activeElement.blur();
            this.getPageElement("#input_athleteEmail").focus();
        });
        
        // Invite Athlete - Email
        this.addInputCheck("#input_athleteEmail", 5, 65, Constant.REGEX.emailBroad, true, (invitedValid) => {

            let inputEmail = this.getPageElement("#input_athleteEmail").val().trim();
            if(inputEmail.length > 0) {
                // Make sure email has all necessary parts (if given)
                let emailValidMatch = inputEmail.match(Constant.REGEX.emailParts);
                if(emailValidMatch == null) {
                    invitedValid = false;
                } else if(emailValidMatch[0].length != inputEmail.length) {
                    invitedValid = false;
                }
            }
            
            // Update visuals
            $(document.activeElement).removeClass("invalid");
            if(!invitedValid) {
                $(document.activeElement).addClass("invalid");
            }
            
            // Update invite button
            if((invitedValid) && (this.getPageElement("#addAthleteWrapper *.invalid").length == 0)) {
                this.getPageElement("#button_sendInvite").prop("disabled", false);
            } else {
                this.getPageElement("#button_sendInvite").prop("disabled", true);
            }
        }, () => { // On enter press
            document.activeElement.blur();
            this.getPageElement("#button_sendInvite").trigger("click");
        });
        
        // Invite Athlete - Gender
        this.getPageElement("#input_athleteGender").on("change", () => {
            let input = this.getPageElement("#input_athleteGender").val();
            
            // Check validity
            $("#input_athleteGender").removeClass("invalid");
            if(input.length != 1) { // M or F
                $("#input_athleteGender").addClass("invalid");
            }
            
            // Update invite button
            if((input.length == 1) && (this.getPageElement("#addAthleteWrapper *.invalid").length == 0)) {
                this.getPageElement("#button_sendInvite").prop("disabled", false);
            } else {
                this.getPageElement("#button_sendInvite").prop("disabled", true);
            }
        });
        
        
        // ---- MISC ---- //

        // Invite Logic //
        this.getPageElement("#button_sendInvite").click((e) => {
            let fname = $("#input_athleteFname").val();
            let lname = $("#input_athleteLname").val();
            let gender = $("#input_athleteGender").val();
            let invitedEmail = this.getPageElement("#input_athleteEmail").val();
            
            // Don't try inviting if it's disabled
            if(this.getPageElement("#button_sendInvite").prop("disabled") == true) {
                return;
            }
            ToolboxBackend.createAthleteWithFeedback(fname, lname, gender, invitedEmail);
            this.getPageElement("#button_sendInvite").prop("disabled", true);
        });
        
        this.getPageElement("#button_addAthleteRoster").click((e) => {
            Popup.createImportPopup();
        });

    }

    stop() {
        $("#createteamPage").unbind().off();
        $("#createteamPage *").unbind().off();
    }

    // OTHER FUNCTIONS

    /**
     * Handles a successful creation by saving critical team properties
     * and proceeding to the next page.
     * 
     * @param {Integer} teamId id of the newly created team for internal storage
     * @param {String} teamName name of the new team, stored internally
     * @param {String} inviteCode code to join the team, displayed to the user
     */
    handleCreation(teamId, teamName, inviteCode) {
        // Set local storage variables
        let storage = window.localStorage;
        storage.setItem("id_team", teamId);
        storage.setItem("teamName", teamName);
        storage.setItem("inviteCode", inviteCode);
        this.getPageElement(".step").not(".step_selected").addClass("step_selected");

        // Pull data from the backend to insert new team into local db
        ToolboxBackend.syncFrontendDatabase().then(() => {
            if (DO_LOG) {
                console.log("[team-create.js]: Backend sync finished!");
            }
        }).catch(function () {
            // Likely a corrupted / lost local storage, so they'll be signed out anyway
            if (DO_LOG) {
                console.log("[main.js:onReady]: Failed to pull from backend, localStorage email: " + localStorage.getItem("email"));
            }
        });

        // And slide!
        this.getPageElement("#postCreatePage #inviteCode").html(inviteCode);
        this.transitionObj.slideLeft("postCreatePage"); // Not procreate!!! Dirty mind ^_*
    }

    /**
     * Centralized method for inviting users to a team. It will display any
     * appropriate error (or success) messages
     * 
     * @param {String} email email address to send an invite to
     * 
     * @deprecated
     * Use ToolboxBackend method to incorperate the dialogues
     */
    inviteAthlete(email) {
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


    /**
     * Selects the page corresponding to the given integer. This is helpful
     * because it will also highlight the correct step number in the banner
     * 
     * @example selectPage(2, true); --> Slides left to School Team page
     *          selectPage(1, false); --> Slides right back to the Name the Team page
     * 
     * @param {Integer} stepNum 1-3 inclusive, where 1 is the starting page and 3 is the last page
     * @param {Boolean} slideLeft [default = true] slide left when progressing, right (aka false) when going back
     */
    selectPage(stepNum, slideLeft = true) {
        // Reset any scrolling that may have occured
        $("html, #teamlandingPage").animate({
            scrollTop: 0
        }, 250);
        
        if (stepNum == 1) {
            if (slideLeft) {
                this.transitionObj.slideLeft("namePage");
            } else {
                this.transitionObj.slideRight("namePage");
            }
        } else if (stepNum == 2) {
            if (slideLeft) {
                this.transitionObj.slideLeft("schoolPage");
            } else {
                this.transitionObj.slideRight("schoolPage");
            }
        } else if (stepNum == 3) {
            if (slideLeft) {
                this.transitionObj.slideLeft("optionsPage");
            } else {
                this.transitionObj.slideRight("optionsPage");
            }
        } else {
            if (DO_LOG) {
                console.log("[team-create.js:selectPage()]: Unknown page number " + stepNum);
            }
            return;
        }

        this.getPageElement(".step").removeClass("step_selected");
        this.getPageElement("#step" + stepNum).addClass("step_selected");
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
        this.getPageElement("#schoolPage #searchList").empty();

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

        // Finally, generate them
        ButtonGenerator.generateButtons("#createteamPage #schoolPage #searchList", schoolArray, (school) => {
            
            // Unfocus input, select the school, and clear search results
            document.activeElement.blur();
            this.schoolId = school.id_school;
            this.schoolName = school.id.replace("school_", "").replace(/\-/gm, " ");
            // /\ Don't worry about capitalizing, only for serverside use
            this.getPageElement("#searchList").empty();
            this.getPageElement("#input_school").val(this.schoolName);
            this.getPageElement("#schoolPage .button_next").prop("disabled", false);
        });

    }

    /**
     * Creates the buttons and their callbacks for inviting athletes
     * from the same school. This is limited to the response from
     * ToolboxBackend.getUsersInSchool() since it requires an array contianing
     * user information.
     * 
     * @param {AssociativeArray} responseObject response containing matches array of athlete information
     */
    generateAthleteButtons(responseObject) {

        let buttonArray = []; // Array of button attribute objects [{...}, {...}, etc.]
        let currentAthlete = {}; // Set to each object in the matches array

        // Check for no results
        if (responseObject.substatus == 2) {
            return;
        }

        for (let s = 0; s < responseObject.matches.length; s++) {
            currentAthlete = responseObject.matches[s];

            // Skip the logged in user since they're creating the team
            if (currentAthlete.email == localStorage.getItem("email")) {
                continue;
            }

            // Set name (ignore NULL last name, limit length)
            let athleteName = currentAthlete.fname;
            if (currentAthlete.lname != null) {
                athleteName = athleteName + " " + currentAthlete.lname;
            }
            if (athleteName.length > 25) {
                athleteName = athleteName.substring(0, 23) + "...";
            }

            let buttonId = athleteName.toLowerCase().replace(/ /gm, "");
            buttonArray.push(({
                "class": "button_schoolAthlete",
                "id": buttonId,
                "html": athleteName,
                "email": currentAthlete.email
            }));
        }

        // Show the "Invite from School" portion
        if (buttonArray.length != 0) {
            this.getPageElement("#schoolInviteWrapper").css("display", "");
        }

        // Finally, generate them
        ButtonGenerator.generateButtons("#createteamPage #invitePage #schoolAthletesList", buttonArray, (athlete) => {
            this.getPageElement("#" + athlete.id).prop("disabled", true);
            TeamBackend.inviteToTeam(athlete.email, (response) => {
                if (response.status > 0) {
                    this.getPageElement("#" + athlete.id).addClass("invited");
                } else {
                    this.getPageElement("#" + athlete.id).addClass("failed");
                    Popup.createConfirmationPopup("An unknown error occured", ["OK"], [() => {}]);
                }
            });
        });
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
     * @param {Integer} lengthMin minimum length of input, exclusive
     * @param {Integer} lengthMax max length of input, exclusive
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
        this.getPageElement(inputSelector).on("keyup", (e) => {
            let keyCode = e.keyCode || e.charCode;
            if (keyCode == 13) { // Enter
                enterActionCallback();
            }
        });

        // Create the input event handler
        this.getPageElement(inputSelector).on("input", (e) => {

            let input = this.getPageElement(inputSelector).val();
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

    /**
     * Used to get only the elements contained within this page by prepending
     * #createteamPage to every selector
     * 
     * @param {String} selector jQuery selection criteria
     */
    getPageElement(selector) {
        return $("#createteamPage " + selector);
    }

}
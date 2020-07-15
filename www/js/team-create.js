/**
 * @classdesc Houses specifically the creation aspect of team logic
 * @class
 */
class CreateTeam extends Page {
    
    constructor(id, pageSetObject) {
        super(id, "CreateTeam");
        
        this.pageController = pageSetObject;
        this.transitionObj = new PageTransition("#createteamPage");
        
        // Team properties
        this.teamName = "";
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
                <br><br>
                <p id="p_tipHeading"><u>Naming Tips</u></p><br>
                <ul class="ul_tips">
                    <li id="tip_length" class="tips bolded">Use 15-45 characters</li><br>
                    <li id="tip_specials" class="tips">Avoid special characters</li><br>
                    <li id="tip_capitalize" class="tips bolded">Capitalize significant words</li><br>
                    <li id="tip_uniqueName" class="tips">Create a unique name</li>
                </ul>
            </div>
        `);
        
        // TODO: Add "fill in" / school search and store ID instead of name
        this.schoolPage = (`
            <div id="schoolPage" class="div_page">
                <h1 id="h1_schoolName">Team's School</h1>
                <input id="team_school" class="sw_text_input" type="text" placeholder="Springtime School"></input>
                <br><br>
                
                <!-- Progression Buttons -->
                <button id="schoolBack" class="button_progression button_back"></button>
                <button id="schoolNext" class="button_progression button_next"></button>
            </div>
        `);
        
        this.optionsPage = (`
            <div id="optionsPage" class="div_page">
                <h1 id="h1_secondaryCoach">Secondary Coach (Optional)</h1>
                <input id="input_secondaryCoach" class="sw_text_input" type="text" placeholder="assistant@sportwatch.us"></input>
                <br>
                <h1 id="h1_inviteCode">Invite Code (Optional)</h1>
                <input id="input_inviteCode" class="sw_text_input" type="text" placeholder="6e3bs36"></input>
                <br><br>
                
                <!-- Progression Buttons -->
                <button id="button_createTeam">Create Team</button><br><br><br>
                <button id="schoolNext" class="button_progression button_back"></button>
            </div>
        `);
        
        this.postCreatePage = (`
            <div id="postCreatePage" class="div_page">
                <h1 id="h1_created">Team Created!</h1>
                <p>
                    Congratulations! You have successfully created a team! You
                    can invite athletes below, or share your invite code later.
                </p>
                
                <input id="input_secondaryCoach" class="sw_text_input" type="text" placeholder="assistant@sportwatch.us"></input>
                <br>
                <h1 id="h1_inviteCode">Invite Code (Optional)</h1>
                <input id="input_inviteCode" class="sw_text_input" type="text" placeholder="6e3bs36"></input>
                <br><br>
                
                <!-- Progression Buttons -->
                <button id="button_createTeam">Create Team</button><br><br>
                <button id="schoolNext" class="button_progression button_back"></button>
                <br><br>
            </div>
        `);
        
        this.invitePage = (`
            <div id="invitePage" class="div_page">
                <div id="schoolInviteWrapper" class="sectionWrapper" style="display: none;">
                    <h1 id="h1_schoolInvite">Invite from School</h1>
                    <div id="schoolAthletesList">
                        <!-- Athlete Buttons will be added here -->
                    </div>
                </div>
                
                <div class="sectionWrapper">
                    <h1 id="h1_emailInvite">Invite via Email</h1>
                    <input id="input_athleteEmail" class="sw_text_input" type="text" placeholder="randy@sportwatch.us"></input>
                    <br>
                    <button id="button_sendInvite" class="sw_button">Invite</button>
                </div>
                
                <!-- Progression Buttons -->
                <button id="button_createTeam">Create Team</button><br><br>
                <button id="schoolNext" class="button_progression button_back"></button>
                <br><br>
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
            this.transitionObj.addPage("invitePage", this.invitePage);
        } else {
            // Hide other pages besides current (see team.js for full explanation)
            this.transitionObj.hidePages();
            this.transitionObj.showCurrentPage();
        }
        
        // ---- VALUE POPULATION ---- //
        
        // Fetch account school to auto-fill
        AccountBackend.getAccount((response) => {
            if(response.status < 0) {
                console.log("[team-create.js:start()]: Requesting account info failed");
                console.log(response);
            } else {
                this.getPageElement("#team_school").val(response.schoolName);
            }
        });
        
        // let testObj = { };
        // testObj.class = "schoolAthlete";
        // testObj.html = "Test Button";
        // ButtonGenerator.generateButtons("#createteamPage #inviteAthletePage #schoolAthletesList", [testObj, testObj], (obj) => {
        //     console.log("Object selected: " + obj);
        // });
        // console.log(testObj);
        
        // ---- FUNCTIONALITY ---- //
        
        // Progression buttons (LAST 2 PAGES)
        this.getPageElement(".button_next").click((e) => {
            let currentPage = this.transitionObj.getCurrentPage();
            document.activeElement.blur();
            
            if(currentPage.includes("school")) {
                // Before moving on, grab the athletes belonging to the inputted school
                // TODO: Change "2" to actual school ID
                // ToolboxBackend.getUsersInSchool(2, (response) => {
                //     if(response.status > 0) {
                //         this.generateAthleteButtons(response);
                //     } else {
                //         console.log("[team-create.js:start()]: Unable to get school users, hiding that portion");
                //         this.getPageElement("#schoolInviteWrapper").css("display", "none");
                //     }
                // });
                
                this.selectPage(3);
                this.schoolName = this.getPageElement("#team_school").val().trim();
                if(this.secondaryValid) {
                    this.secondaryCoach = this.getPageElement("#input_secondaryCoach").val().trim();
                }
                console.log("Set School (" + this.schoolName + ") and secondary coach: " + this.secondaryCoach);
            } else {
                console.log("[team-create.js:start()]: Next button not configured for page " + currentPage);
            }
        });
        
        // Back button
        this.getPageElement(".button_back").click((e) => {
            let currentPage = this.transitionObj.getCurrentPage();
            document.activeElement.blur();
            
            if(currentPage.includes("school")) {
                this.selectPage(1, false);
                this.getPageElement("#schoolAthletesList").html(""); // Clear in case school is changed
            } else if(currentPage.includes("options")) {
                this.selectPage(2, false);
            } else {
                console.log("[team-create.js:start()]: Back button not configured for page " + currentPage);
            }
        });
        
        // Create team button (what you've all been waiting for!)
        this.getPageElement("#button_createTeam").on("submit click", (e) => {
            let teamDetails = { }; // Compose the details of the team
            teamDetails.schoolName = this.schoolName;
            teamDetails.primaryCoach = localStorage.getItem("email");
            
            if(this.secondaryValid) {
                teamDetails.secondaryCoach = this.getPageElement("#input_secondaryCoach").val();
            }
            if(this.codeValid) {
                teamDetails.inviteCode = this.getPageElement("#input_inviteCode").val();
            }
            
            console.log(teamDetails);
            TeamBackend.createTeam(this.teamName, () => {
                
            }, teamDetails);
        });
        
        // -- TEAM NAME -- //
        
        // Tip highlighting
        this.getPageElement("#input_teamName").on("keydown", (e) => {
            
            let keyCode = e.keyCode || e.charCode;
            let input = this.getPageElement("#input_teamName").val().trim();
            
            // -- Special Key Checks -- //
            if(keyCode == 8) {
                input = input.substring(0, input.length - 1);
            } else if(keyCode == 13) { // Enter
                // Focus next input field
                this.getPageElement("#button_submitName").trigger("click");
            }
            
            // -- Input Checks -- //
            // Set it as true; if it passes, it won't be set to false
            this.nameIsValid = true;
            
            // Length
            if((input.length < 15) || (input.length > 45)) {
                // Bold this tip since the criteria isn't met yet
                if(!this.getPageElement("#tip_length").hasClass("bolded")) {
                    this.getPageElement("#tip_length").addClass("bolded");
                }
                this.nameIsValid = false;
            } else {
                this.getPageElement("#tip_length").removeClass("bolded");
            }
            
            // Special characters (Plus &)
            if(input.replace(/[A-Za-z0-9& ]/gm, "").length > 0) {
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
            
            if(this.nameIsValid) {
                this.getPageElement("#button_submitName").prop("disabled", false);
            } else {
                this.getPageElement("#button_submitName").prop("disabled", true);
            }
        });
                
        // Submit logic (TEAM NAME)
        this.getPageElement("#button_submitName").on("click submit", (e) => {
            e.preventDefault();
            document.activeElement.blur();
            
            if(this.nameIsValid) {
                this.teamName = this.getPageElement("#input_teamName").val().trim();
                console.log("Saved team name: " + this.teamName);
                this.selectPage(2);
            } else {
                // Not valid, so blur (aka hide the keyboard) to show the tips
                document.activeElement.blur();
            }
        });
        
        // -- SCHOOL PAGE -- //
        
        // School name checking
        this.getPageElement("#team_school").on("keydown", (e) => {
            
            let keyCode = e.keyCode || e.charCode;
            let input = this.getPageElement("#team_school").val().trim();
            
            // -- Special Key Checks -- //
            if(keyCode == 8) {
                input = input.substring(0, input.length - 1);
            } else if(keyCode == 13) { // Enter
                // Focus next input field
                // this.getPageElement("#schoolPage .button_next").trigger("click");
            }
            
            // -- Input Checks -- //
            // Set it as true; if it passes, it won't be set to false
            let schoolIsValid = true;
            
            // Length
            if((input.length < 5) || (input.length > 65)) {
                schoolIsValid = false;
            }
            
            // Special characters (Plus .)
            if(input.replace(/[A-Za-z0-9. ]/gm, "").length > 0) {
                schoolIsValid = false;
            }
            
            if(schoolIsValid) {
                this.getPageElement("#schoolPage .button_next").prop("disabled", false);
            } else {
                this.getPageElement("#schoolPage .button_next").prop("disabled", true);
            }
        });
        
        // -- OPTIONS PAGE -- //
        
        // Secondary Coach email checks (OPTIONS PAGE)
        this.getPageElement("#input_secondaryCoach").on("keydown", (e) => {
            
            let keyCode = e.keyCode || e.charCode;
            let input = this.getPageElement("#input_secondaryCoach").val().trim();
            
            // -- Special Key Checks -- //
            if(keyCode == 8) {
                input = input.substring(0, input.length - 1);
            } else if(keyCode == 13) { // Enter
                // Focus next input field
                this.getPageElement("#input_inviteCode").focus();
            }
            
            // -- Input Checks -- //
            // Set it as true; if it passes, it won't be set to false
            this.secondaryValid = true;
            
            // Since it's optional, don't do the checks if it's blank
            if(input.length == 0) {
                this.secondaryValid = false; // Set to false to make the backend request easier
                this.getPageElement("#button_createTeam").prop("disabled", false);
            }
            
            // Length
            if((input.length < 5) || (input.length > 65)) {
                this.secondaryValid = false;
            }
            // Special characters (Plus .@-_)
            if(input.replace(/[A-Za-z0-9.@\-_]/gm, "").length > 0) {
                this.secondaryValid = false;
            }
            
            if(this.secondaryValid) {
                this.getPageElement("#button_createTeam").prop("disabled", false);
            } else {
                this.getPageElement("#button_createTeam").prop("disabled", true);
            }
        });
        
        // Invite code checks (OPTIONS PAGE)
        this.getPageElement("#input_inviteCode").on("keydown", (e) => {
            
            let keyCode = e.keyCode || e.charCode;
            let input = this.getPageElement("#input_inviteCode").val().trim();
            
            // -- Special Key Checks -- //
            if(keyCode == 8) {
                input = input.substring(0, input.length - 1);
            } else if(keyCode == 13) { // Enter
                // Focus next input field
                this.getPageElement("#button_createTeam").trigger("click");
            }
            
            // -- Input Checks -- //
            // Set it as true; if it passes, it won't be set to false
            this.codeValid = true;
            
            // Since it's optional, don't do the checks if it's blank
            if(input.length == 0) {
                this.codeValid = false;
                this.getPageElement("#button_createTeam").prop("disabled", false);
            }
            
            // Length
            if(input.length != 7) {
                this.codeValid = false;
            }
            // Special characters
            if(input.replace(/[A-Za-z0-9]/gm, "").length > 0) {
                this.codeValid = false;
            }
            
            if(this.codeValid) {
                this.getPageElement("#button_createTeam").prop("disabled", false);
            } else {
                this.getPageElement("#button_createTeam").prop("disabled", true);
            }
        });
        
        // Focus on any elements that are clicked
        this.getPageElement("input").click((e) => {
            $(e.target).focus();
        });
        
    }
    
    stop() {
        $("#createteamPage").unbind().off();
        $("#createteamPage *").unbind().off();
    }
    
    // OTHER FUNCTIONS
    
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
        if(stepNum == 1) {
            if(slideLeft) {
                this.transitionObj.slideLeft("namePage");
            } else {
                this.transitionObj.slideRight("namePage");
            }
        } else if(stepNum == 2) {
            if(slideLeft) {
                this.transitionObj.slideLeft("schoolPage");
            } else {
                this.transitionObj.slideRight("schoolPage");
            }
        } else if(stepNum == 3) {
            if(slideLeft) {
                this.transitionObj.slideLeft("optionsPage");
            } else {
                this.transitionObj.slideRight("optionsPage");
            }
        } else {
            console.log("[team-create.js:selectPage()]: Unknown page number " + stepNum);
            return;
        }
        
        this.getPageElement(".step").removeClass("step_selected");
        this.getPageElement("#step" + stepNum).addClass("step_selected");
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
        
        // Show the "Invite from School" portion
        this.getPageElement("#schoolInviteWrapper").css("display", "");
        
        let buttonArray = []; // Array of button attribute objects [{...}, {...}, etc.]
        let currentAthlete = { }; // Set to each object in the matches array
        
        for(let s = 0; s < responseObject.matches.length; s++) {
            currentAthlete = responseObject.matches[s];
            
            // Skip the logged in user since they're creating the team
            if(currentAthlete.email == localStorage.getItem("email")) {
                continue;
            }
            
            // Set name (ignore NULL last name, limit length)
            let athleteName = currentAthlete.fname;
            if(currentAthlete.lname != null) {
                athleteName = athleteName + " " + currentAthlete.lname;
            }
            if(athleteName.length > 25) {
                athleteName = athleteName.substring(0, 23) + "...";
            }
            
            buttonArray.push(({"class": "button_schoolAthlete", "html": athleteName, "email": currentAthlete.email}));
        }
        
        // Finally, generate them
        ButtonGenerator.generateButtons("#createteamPage #inviteAthletePage #schoolAthletesList", buttonArray, (athlete) => {
            console.log("Email invited: " + athlete.email);
            TeamBackend.inviteToTeam(athlete.email, () => { });
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
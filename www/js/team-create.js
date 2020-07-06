/**
 * @classdesc Houses specifically the creation aspect of team logic
 * @class
 */
class CreateTeam extends Page {
    
    constructor(id) {
        super(id, "CreateTeam");
        
        this.dbConnection = new DatabaseConnection();
        this.transitionObj = new PageTransition("#createteamPage");
        // Team properties
        this.teamName = "";
        this.schoolName = ""; // TODO: Change to ID or maybe an auto-complete
        this.secondaryCoach = "";
        
        // Control variables
        this.nameIsValid = false;
        this.secondaryValid = false; // Secondary coach
        
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
        
        this.schoolPage = (`
            <div id="schoolPage" class="div_page">
                <h1 id="h1_schoolName">Team's School Name</h1>
                <input id="team_school" class="sw_text_input" type="text" placeholder="Springtime School"></input>
                <br>
                <h1 id="h1_secondaryCoach">Secondary Coach (Optional)</h1>
                <input id="secondary_coach" class="sw_text_input" type="text" placeholder="assistant@sportwatch.us"></input>
                <br><br>
                
                <!-- Progression Buttons -->
                <button id="schoolBack" class="button_progression button_back"></button>
                <button id="schoolNext" class="button_progression button_next"></button>
                <br>
            </div>
        `);
        
        this.inviteAthletePage = (`
            <div id="inviteAthletePage" class="div_page">
                <p style="font-size: 2em; margin: 5px;">You'll be able to invite athletes here... Coming Soon</p>
                <br><br><br><br>
                
                <!-- Progression Buttons -->
                <button id="button_createTeam">Create Team</button><br>
                <button id="schoolNext" class="button_progression button_back"></button>
                <br>
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
                ${this.inviteAthletePage}
            </div>
        `);
    }
    
    start() {

        // Only link them to pageTransition once
        if (this.transitionObj.getPageCount() == 0) {
            this.transitionObj.addPage("namePage", this.namePage, true);
            this.transitionObj.addPage("schoolPage", this.schoolPage);
            this.transitionObj.addPage("inviteAthletePage", this.inviteAthletePage);
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
        
        // ---- FUNCTIONALITY ---- //
        
        // Progression buttons (LAST 2 PAGES)
        this.getPageElement(".button_next").click((e) => {
            let currentPage = this.transitionObj.getCurrentPage();
            document.activeElement.blur();
            
            if(currentPage.includes("school")) {
                this.selectPage(3);
                this.schoolName = this.getPageElement("#team_school").val().trim();
                if(this.secondaryValid) {
                    this.secondaryCoach = this.getPageElement("#secondary_coach").val().trim();
                }
                console.log("Set School (" + this.schoolName + ") and secondary coach: " + this.secondaryCoach);
            } else if(currentPage.includes("")) {
                // TODO: Configure for step 3 and submit
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
            } else if(currentPage.includes("inviteAthletePage")) { // TODO: Third page name
                this.selectPage(2, false);
            } else {
                console.log("[team-create.js:start()]: Back button not configured for page " + currentPage);
            }
        });
        
        // Tip highlighting (TEAM NAME)
        this.getPageElement("#input_teamName").on("input", (e) => {
            let input = this.getPageElement("#input_teamName").val();
            
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
        
        // TODO: Make invite athlete page (?)
        
        // Submit logic (TEAM NAME)
        this.getPageElement("#button_submitName").on("click submit", (e) => {
            e.preventDefault();
            document.activeElement.blur();
            
            console.log("Triggered");
            if(this.nameIsValid) {
                this.teamName = this.getPageElement("#input_teamName").val().trim();
                console.log("Saved team name: " + this.teamName);
                this.selectPage(2);
            } else {
                // Not valid, so blur (aka hide the keyboard) to show the tips
                document.activeElement.blur();
            }
        });
        
        // School name checking (SCHOOL PAGE)
        this.getPageElement("#team_school").on("input", (e) => {
            let input = this.getPageElement("#team_school").val();
            console.log(input);
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
            
            console.log("Is valid: " + schoolIsValid);
            if(schoolIsValid) {
                this.getPageElement("#schoolPage .button_next").prop("disabled", false);
            } else {
                this.getPageElement("#schoolPage .button_next").prop("disabled", true);
            }
        });
        // Secondary Coach email checks (SCHOOL PAGE)
        this.getPageElement("#secondary_coach").on("input", (e) => {
            let input = this.getPageElement("#secondary_coach").val();
            console.log(input);
            // Set it as true; if it passes, it won't be set to false
            this.secondaryValid = true;
            
            // Length
            if((input.length < 5) || (input.length > 65)) {
                this.secondaryValid = false;
            }
            
            // Special characters (Plus .@-_)
            if(input.replace(/[A-Za-z0-9.@\-_]/gm, "").length > 0) {
                this.secondaryValid = false;
            }
            
            if(this.secondaryValid) {
                this.getPageElement("#schoolPage .button_next").prop("disabled", false);
            } else {
                this.getPageElement("#schoolPage .button_next").prop("disabled", true);
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
                this.transitionObj.slideLeft("inviteAthletePage");
            } else {
                this.transitionObj.slideRight("inviteAthletePage");
            }
        } else {
            console.log("[team-create.js:selectPage()]: Unknown page number " + stepNum);
            return;
        }
        
        this.getPageElement(".step").removeClass("step_selected");
        this.getPageElement("#step" + stepNum).addClass("step_selected");
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
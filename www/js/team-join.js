/**
 * @classdesc Houses specifically the creation aspect of team logic
 * @class
 */
class JoinTeam extends Page {
    
    constructor(id, pageSetObject, landingCopy) {
        super(id, "JoinTeam");
        
        this.pageController = pageSetObject;
        this.transitionObj = new PageTransition("#jointeamPage");
        this.teamLandingCopy = landingCopy; // Used to get back to landing page
        
        // Misc variables
        this.codeIsValid = true;
        
        // ---- PAGES ---- /
        
        this.codePage = (`
            <div id="codePage" class="div_page">
                <br>
                <div class="generic_header">
                    <h1>Join Team</h1>
                </div><br><br>
                
                <div class="sectionWrapper">
                    <p class="sectionLabel">Enter Join Code</p>
                    <input id="input_inviteCode" class="sw_text_input" type="text" placeholder="lclcm3y"></input>
                    <br>
                    <input id="button_join" type="submit" value="JOIN" disabled></input>
                </div>
                <br><br>
                <!-- TODO: Suggested teams -->
                
                <!-- Progression Buttons -->
                <button id="nameBack" class="button_progression button_back"></button>
            </div>
        `);
        
    }
    
    getHtml() {
        return (`
            <div id="jointeamPage" class="div_page">
                ${this.codePage}
            </div>
        `);
    }
    
    start() {
        
        // When clicking on input, focus it
        this.getPageElement("input").click((e) => {
            $(e.target).focus();
        });
        
        // Back button to return to "main" page
        this.getPageElement(".button_back").click((e) => {
            document.activeElement.blur();
            this.teamLandingCopy.transitionObj.slideLeft("landingPage", 500); // Go back to "main menu"
            this.stop();
        });
        
        // Enable / disable JOIN button based on input
        this.getPageElement("#input_inviteCode").on("input", (e) => {
            let input = this.getPageElement("#input_inviteCode").val();
            
            // Set it as true; if it passes, it won't be set to false
            this.codeIsValid = true;
            
            // Length
            if(input.length != 7) {
                this.codeIsValid = false;
            }
            
            // Character filter (only allow a-z and 0-9)
            if(input.toLowerCase().replace(/[a-z0-9]/gm, "").length > 0) {
                this.codeIsValid = false;
            }
            
            // Set the disabled property
            if(this.codeIsValid) {
                this.getPageElement("#button_join").prop("disabled", false);
            } else {
                this.getPageElement("#button_join").prop("disabled", true);
            }
        });
        // Create keyup handler for enter button
        this.getPageElement("#input_inviteCode").on("keyup", (e) => {
            let keyCode = e.keyCode || e.charCode;
            if(keyCode == 13) { // Enter
                this.getPageElement("#button_join").trigger("click");
            }
        });
        
        // Join button logic
        this.getPageElement("#button_join").on("submit click", (e) => {
            e.preventDefault();
            this.getPageElement("#input_inviteCode").blur();
            
            // Make sure the code is valid
            if(!this.codeIsValid) {
                return;
            }
            // If it's disabled, ignore the click
            if (this.getPageElement("#button_join").prop("disabled")) {
                return; // Exit the handler, not valid
            }
            
            let inviteCode = this.getPageElement("#input_inviteCode").val();
            TeamBackend.joinTeam(inviteCode, (response) => {
                
                // Success
                if(response.status > 0) {
                    
                    // Pull the team information and populate local storage and database
                    TeamBackend.getTeamInfo((teamInfo) => {
                        
                        if(teamInfo.status > 0) {
                            // Set local storage values
                            let storage = window.localStorage;
                            storage.setItem("id_team", teamInfo.id_team);
                            storage.setItem("teamName", teamInfo.teamName);
                            
                            // Update the team info
                            ToolboxBackend.pullFromBackend().then(() => {
                                if(DO_LOG) {
                                    console.log("[team-join.js]: Backend sync finished!");
                                }
                            }).catch(function() {
                                if(DO_LOG) {
                                    console.log("[signup.js]: Failed to pull from backend, localStorage email: " + localStorage.getItem("email"));
                                }
                            });
                            
                            // Show confirmation to user and show team.js page
                            Popup.createConfirmationPopup("You have successfully joined the team!", ["OK"], [() => {
                                this.pageController.switchPage("TeamLanding");
                                // Which should now switch to the team.js view
                            }]);
                            
                        } else {
                            Popup.createConfirmationPopup("Sorry, an unknown error occured. Please try again later", ["OK"], [() => { }]);
                        }
                    }, {"inviteCode": inviteCode}); // <-- Team Identity
                    
                // Error
                } else {
                    
                    // Disable the button until it is edited again
                    this.codeIsValid = false;
                    this.getPageElement("#button_join").prop("disabled", true);
                    
                    if(response.substatus == 6) {
                        Popup.createConfirmationPopup("That invite code is invalid", ["OK"], [() => { }]);
                    } else {
                        Popup.createConfirmationPopup("Sorry, an unknown error occured. Please try again later", ["OK"], [() => { }]);
                    }
                }
            }); // End of joinTeam callback
        });
        
        
        
    }
    
    stop() {
        $("#jointeamPage").unbind().off();
        $("#jointeamPage *").unbind().off();
    }
    
    // OTHER FUNCTIONS
    
    
    
    /**
     * Used to get only the elements contained within this page by prepending
     * #jointeamPage to every selector
     * 
     * @param {String} selector jQuery selection criteria
     */
    getPageElement(selector) {
        return $("#jointeamPage " + selector);
    }
    
}
function createTeamPage() {
    
    CSSManager.resetStyling();
    CSSManager.addStylesheet("team_create.css");
    
    let transitionObj = new PageTransition();
    let teamName = "";
    
    // Playground:  https://jsbin.com/mokimapiho/edit?html,js,output
    
    // ---- CALLBACK / STATE BIND FUNCTIONS ---- //

    this.deconstruct = function() {
        console.log("Deconstructing...");
        // Remove event listeners
        $("#app").off();
        $("#team_name").off();
        $("#button_submitName").off();
    }
    
    // ---- PAGES ---- /
    
    let basePage = (`
        <div id="div_createBase">
            <span class="step" id="step1">1</span>
            <span class="step" id="step2">2</span>
            <span class="step" id="step3">3</span>
            <h1>Create Team</h1>
        </div>
    `);
    
    let namePage = (`
        <div id="teamName" class="div_page">
            <h1 id="h1_giveName">Name the Team</h1><br>
            <input id="team_name" class="sw_text_input" type="text"></input>
            <input id="button_submitName" type="image" src="img/arrow.png"></input>
            <br><br>
            <p id="p_tipHeading">Naming Tips:</p><br>
            <ul class="ul_tips">
                <li id="tip_length" class="tips bolded">Use 15-45 characters</li>
                <li id="tip_specials" class="tips">Avoid special characters</li>
                <li id="tip_capitalize" class="tips">Capitalize significant words</li>
                <li id="tip_uniqueName" class="tips">Create a unique name</li>
            </ul>
        </div>
    `);
    
    let schoolPage = (`
        <div id="schoolPage" class="div_page">
            <h1 id="h1_schoolName">Team's School</h1>
        </div>
    `);
    
    
    // ---- FUNCTIONALITY ---- //
    
    // Tip highlighting (TEAM NAME)
    $("#app").on("input", "#team_name", (e) => {
        let input = $("#team_name").val();
        
        // Length
        if((input.length < 15) || (input.length > 45)) {
            // Bold this tip since the criteria isn't met yet
            if(!$("#tip_length").hasClass("bolded")) {
                $("#tip_length").addClass("bolded");
            }
        } else {
            $("#tip_length").removeClass("bolded");
        }
        
        // Special characters
        if (!(/^[a-zA-Z0-9 ]*$/g.test(input))) {
            if (!$("#tip_specials").hasClass("bolded")) {
                $("#tip_specials").addClass("bolded");
            }
        } else {
            $("#tip_specials").removeClass("bolded");
        }
        
        // Capitalization
        if (!(/[A-Z]/g.test(input))) {
            if (!$("#tip_capitalize").hasClass("bolded")) {
                $("#tip_capitalize").addClass("bolded");
            }
        } else {
            $("#tip_capitalize").removeClass("bolded");
        }
    });
    
    // First page (team name)
    $("#app").on("click", "#button_submitName", (e) => {
        e.preventDefault();
        
        this.teamName = $("#team_name").val().trim();
        console.log("Saved team name: " + this.teamName);
        transitionObj.slideLeft("schoolPage");
        $("#step1").addClass("step_completed");
    });
    
    
    this.dump = function (obj) {
        let out = '';
        for (let i in obj) {
            out += i + ": " + obj[i] + "\n";
        }
        console.log(out);
    }
    
    // ---- FINAL OPERATIONS ---- //
    
    $("#app").html("");
    $("#app").html(basePage);
    
    // Add the function pages to the transition manager
    transitionObj.addPage("teamName", namePage, true);
    transitionObj.addPage("schoolPage", schoolPage);
    
    
    
}
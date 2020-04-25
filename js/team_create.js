function createTeamPage() {
    
    CSSManager.resetStyling();
    CSSManager.addStylesheet("team_create.css");
    
    let transitionObj = new PageTransition();
    let teamName = "";
    let nameIsValid = false;
    
    // Playground:  https://jsbin.com/mokimapiho/edit?html,js,output
    
    // ---- CALLBACK / STATE BIND FUNCTIONS ---- //

    this.deconstruct = function() {
        console.log("Deconstructing...");
        // Remove event listeners
        $("#app").off();
        $("#input_teamName").off();
        $("#button_submitName").off();
    }
    
    // ---- PAGES ---- /
    
    let basePage = (`
        <div id="div_createBase">
            <span class="step step_selected" id="step1">1</span>
            <span class="step" id="step2">2</span>
            <span class="step" id="step3">3</span>
            <h1>Create Team</h1>
        </div>
    `);
    
    let namePage = (`
        <div id="namePage" class="div_page">
            <h1 id="h1_giveName">Name the Team</h1><br>
            <input id="input_teamName" class="sw_text_input" type="text"></input>
            <input id="button_submitName" type="submit" src="img/arrow.png" disabled></input>
            <br><br>
            <p id="p_tipHeading">Naming Tips:</p><br>
            <ul class="ul_tips">
                <li id="tip_length" class="tips bolded">Use 15-45 characters</li><br>
                <li id="tip_specials" class="tips">Avoid special characters</li><br>
                <li id="tip_capitalize" class="tips bolded">Capitalize significant words</li><br>
                <li id="tip_uniqueName" class="tips">Create a unique name</li>
            </ul>
        </div>
    `);
    
    let schoolPage = (`
        <div id="schoolPage" class="div_page">
            <h1 id="h1_schoolName">Team's School</h1>
            <input id="team_school" class="sw_text_input" type="text"></input>
            <br>
            <h1 id="h1_joinCode">Join Code</h1>
            <input id="joinCode" class="sw_text_input" type="text"></input>
            
            <p id="p_tipHeading">Join Code Tips:</p><br>
            <ul class="ul_tips">
                <li id="tip_length" class="tips clear">Use unique 7-character code</li><br>
                <li id="tip_specials" class="tips clear">Only lowercase letters and numbers</li>
            </ul>
            <div id="div_continueCont">
                <p id="p_continue">Continue</p>
                <!-- <img id="button_submitSchool" src="img/arrow.png"></img> -->
            </div>
            <br>
        </div>
    `);
    
    
    // ---- FUNCTIONALITY ---- //
    
    // Tip highlighting (TEAM NAME)
    $("#app").on("input", "#input_teamName", (e) => {
        let input = $("#input_teamName").val();
        
        // Set it as true; if it passes, it won't be set to false
        nameIsValid = true;
        
        // Length
        if((input.length < 15) || (input.length > 45)) {
            // Bold this tip since the criteria isn't met yet
            if(!$("#tip_length").hasClass("bolded")) {
                $("#tip_length").addClass("bolded");
            }
            nameIsValid = false;
        } else {
            $("#tip_length").removeClass("bolded");
        }
        
        // Special characters
        if (!(/^[a-zA-Z0-9 ]*$/g.test(input))) {
            if (!$("#tip_specials").hasClass("bolded")) {
                $("#tip_specials").addClass("bolded");
            }
            nameIsValid = false;
        } else {
            $("#tip_specials").removeClass("bolded");
        }
        
        // Capitalization (suggestion, not required)
        if (!(/[A-Z]/g.test(input))) {
            if (!$("#tip_capitalize").hasClass("bolded")) {
                $("#tip_capitalize").addClass("bolded");
            }
        } else {
            $("#tip_capitalize").removeClass("bolded");
        }
        
        if(nameIsValid) {
            $('#button_submitName').prop('disabled', false);
        } else {
            $('#button_submitName').prop('disabled', true);
        }
    });
    
    // First page (team name)
    $("#app").on("click", "#button_submitName", (e) => {
        e.preventDefault();
        
        if(nameIsValid) {
            this.teamName = $("#input_teamName").val().trim();
            console.log("Saved team name: " + this.teamName);
            transitionObj.slideLeft("schoolPage");
            $("#step1").removeClass("step_selected");
            $("#step2").addClass("step_selected");
        } else {
            // console.log("1");
            // document.activeElement.blur();
            // console.log("2");
            // $("#button_submitName").blur();
            console.log("Not valid, no blurred");
        }
    });
    
    $("#app").on("click", "#input_teamName", (e) => {
        console.log("Clicked input");
        $("#input_teamName").focus();
    });
    
    $("#app").on("click", (e) => {
        console.log("Focused on: " + document.activeElement);
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
    transitionObj.addPage("namePage", namePage, true);
    transitionObj.addPage("schoolPage", schoolPage);
    
    
    
}
function createTeamPage() {
    
    CSSManager.resetStyling();
    CSSManager.addStylesheet("team_create.css");
    
    let transitionObj = new PageTransition();
    
    // Playground:  https://jsbin.com/mokimapiho/edit?html,js,output
    
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
            <h1 id="h1_giveName">Name the Team</h1>
            <input id="team_name" class="sw_text_input" type="text"></input>
            <input id="button_submitName" type="image" src="img/arrow.png"></input>
        </div>
    `);
    
    
    
    $("#app").html("");
    $("#app").html(basePage);
    
    // Add the function pages to the transition manager
    transitionObj.addPage("teamName", namePage, true);
    
    
    
}
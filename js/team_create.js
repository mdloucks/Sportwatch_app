function createTeamPage() {
    
    CSSManager.resetStyling();
    //CSSManager.addStylesheet("account.css");
    
    let transitionObj = new PageTransition();
    
    //$("#app").html(`Welcome to where the magic happens (where to create teams)`);
    // Playground:  https://jsbin.com/mokimapiho/edit?html,js,output
    
    let home = (`
        <div class="div_page">
            <h1>Create your team</h1>
            <button id="begin">Begin</button>
        </div>
    `);
    
    let mechanics = (`
        <div id="mechanics">
            <h1>Choose a name</h1>
            <p>Name your team: </p><br><br><br>
            <button id="back">Back</button>
        </div>
    `);
    
    $("#app").html(""); // Clear html content
    transitionObj.addPage("home", home, true);
    transitionObj.addPage("name", mechanics);
    
    $("#app").on("click", "#begin", (e) => {
        e.preventDefault();
        transitionObj.slideLeft("name");
    });
    
    $("#app").on("click", "#back", (e) => {
        e.preventDefault();
        transitionObj.slideLeft("HOmE", 500);
    });
    
    
    
}
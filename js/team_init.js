function initTeamPage() {

    CSSManager.resetStyling();
    // No .css file since this page is so small
    
    $("#app").html(`
        <br>
        <input id="join_team" type="image" src="img/joinTeam.png" 
            style="width: 250px; height: 200px; margin: 5px; padding: 15px; border: solid 2px gray; border-radius: 15px;"></input>
        <input id="create_team" type="image" src="img/createTeam.png" 
            style="width: 250px; height: 200px; margin: 5px; padding: 15px; border: solid 2px gray; border-radius: 15px;"></input>
    `);
    
    // TODO Implement page changes here when the buttons are clicked
    $("#app").on("click", "#join_team", function(e) {
        e.preventDefault();
        console.log("Joined");
    });
    
    $("#app").on("click", "#create_team", function(e) {
        e.preventDefault();
        console.log("Created");
    });
    
}
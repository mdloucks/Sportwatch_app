function initTeamPage() {

    CSSManager.resetStyling();
    // No .css file since this page is so small
    
    // ---- CALLBACK / STATE BIND FUNCTIONS ---- //

    this.joinTeam = function () {
        throw new Error("JOIN TEAM IS NOT SETUP");
    }
    this.onJoinTeam = (callback) => {
        this.joinTeam = callback;
    }

    this.createTeam = function () {
        throw new Error("CREATE TEAM IS NOT SETUP");
    }
    this.onCreateTeam = function (callback) {
        this.createTeam = callback;
    }
    
    // ---- PAGES / FUNCTIONALITY ---- //
    
    $("#app").html(`
        <br>
        <input id="join_team" type="image" src="img/joinTeam.png" 
            style="width: 250px; height: 200px; margin: 5px; padding: 15px; border: solid 2px gray; border-radius: 15px; transition: background-color 0.25s;"></input>
        <input id="create_team" type="image" src="img/createTeam.png" 
            style="width: 250px; height: 200px; margin: 5px; padding: 15px; border: solid 2px gray; border-radius: 15px; transition: background-color 0.25s;"></input>
    `);
    
    // TODO Implement page changes here when the buttons are clicked
    $("#app").on("click", "#join_team", (e) => {
        e.preventDefault();
        $("#join_team").css("background-color", "gray");
        
        setTimeout(() => {
            this.joinTeam();
        }, 200);
    });
    
    $("#app").on("click", "#create_team", (e) => {
        e.preventDefault();
        $("#create_team").css("background-color", "gray");
        
        setTimeout(() => {
            this.createTeam();
        }, 200);
    });
    
}
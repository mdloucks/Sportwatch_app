/**
 * @classdesc The team page will house everything from the team roster, join and create functionallity, individual athletes, and a team code.
 * @class
 */
class Team extends Page {

    constructor(id) {
        super(id, "Team");
        this.hasStarted = false;
    }

    getHtml() {
        // TODO: SETH!! Please find a way to display the team name here
        return (`
            <div id="teamPage" class="div_page">
                <br><br>
                <h1>Insert Team Name</h1>
                <br>
                <div class="button_box"></div>
            </div>
        `);
    }

    start() {
        if (!this.hasStarted) {
            this.generateAthleteList();
            this.hasStarted = true;
        }
    }

    generateAthleteList() {

        dbConnection.selectSingle("SELECT *, ROWID FROM athlete", []).then((athletes) => {
            ButtonGenerator.generateButtonsFromDatabase("#teamPage > .button_box", athletes, (athlete) => {
                this.startAthletePage(athlete);
            });
        });
    }

    startAthletePage(athlete) {
        $("#teamPage").html(`
        
            <div id="athlete_header">
                <div id="back_button">&#8592;</div>
                <h1>${athlete.fname} ${athlete.lname}</h1>
                <img src="img/logo.png" alt=""></img>
            </div>
            
            <h2 id="athlete_info">Grade ${athlete.grade} Gender ${athlete.gender}</h2>
            <div>Stats....</div>
        `);

        $("#back_button").bind("touchend", function (e) {
            console.log("Change");

        });
    }

    stop() {

    }
}
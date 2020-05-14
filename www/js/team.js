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

        sw_db.selectSingle("SELECT *, ROWID FROM athlete", []).then(function (athletes) {
            ButtonGenerator.generateButtonsFromDatabase("#teamPage > .button_box", athletes, function (athlete) {
                console.log("howdy " + athlete.fname);
            });
        });
    }

    startAthletePage(athleteString) {

    }

    stop() {

    }
}
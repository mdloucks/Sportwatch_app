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
        let buttonContent = [];

        sw_db.selectSingle("SELECT * FROM athlete", []).then(function (athletes) {
            for (let i = 0; i < athletes.length; i++) {

                let innerHTML = `${athletes.item(i).fname} ${athletes.item(i).lname} ${athletes.item(i).grade} ${athletes.item(i).gender}`;
                buttonContent.push(innerHTML);
            }

            ButtonGenerator.generateButtons("#teamPage > .button_box", "athlete_button", buttonContent, function (name) {
                console.log("howdy " + name);
            });
        });
    }

    startAthletePage(athleteString) {

    }

    stop() {

    }
}
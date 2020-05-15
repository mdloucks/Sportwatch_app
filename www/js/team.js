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
        let storage = window.localStorage;

        return (`
            <div id="teamPage" class="div_page">
                <br><br>
                <h1>${storage.getItem("teamName") === undefined ? "Team Page" : storage.getItem("teamName")}</h1>
                <br>
                <div class="button_box"></div>
            </div>
        `);
    }

    getAthleteHtml() {
        return (`
            <div id="athlete_header">
                <div id="back_button">&#8592;</div>
                <h1></h1>
                <img src="img/logo.png" alt=""></img>
            </div>
    
            <h2 id="athlete_info"></h2>
            <div>Stats....</div>
        `);
    }

    start() {
        if (!this.hasStarted && this.doesTeamExist()) {
            this.generateAthleteList();
            this.hasStarted = true;
            // TODO: have the user create a team.
        } else {

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

        // TODO: slide transition to page here, to the right

        $("#teamPage").html(this.getAthleteHtml());

        $("#teamPage #athlete_header h1").html(`${athlete.fname} ${athlete.lname}`);
        $("#teamPage #athlete_info").html(`${athlete.grade}th grade ${athlete.gender == 'm' ? "male" : "female"}`);

        $("#back_button").bind("touchend", (e) => {
            // TODO: slide transition back here, to the left
            $("#teamPage").html(this.getHtml());
            this.generateAthleteList();
        });
    }

    /**
     * @description check if the current user has a team at all, either on account or local
     * @returns true or false
     */
    doesTeamExist() {
        let storage = window.localStorage;

        // local check
        if (storage.getItem("teamName") === null) {
            return false;
        }

        // TODO: query server database to see if user has a team

        return true;
    }

    stop() {

    }
}
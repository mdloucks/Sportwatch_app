/**
 * @classdesc The team page will house everything from the team roster, join and create functionallity, individual athletes, and a team code.
 * @class
 */
class Team extends Page {

    constructor(id) {
        super(id, "Team");
        this.hasStarted = false;
        
        this.pageTransition = new PageTransition("#teamPage");
        
        // --- PAGES ---- //
        
        this.landingPage = (`
            <div id="landingPage" class="div_page">
                <br><br>
                <h1 id="teamName">Team Page</h1>
                <br>
                <div class="button_box"></div>
            </div>
        `);
        
        this.athletePage = (`
            <div id="athletePage" class="div_page">
                <div id="athlete_header">
                    <div id="back_button">&#8592;</div>
                    <h1 id="athleteName"></h1>
                    <img src="img/logo.png" alt=""></img>
                </div>
        
                <h2 id="athlete_info"></h2>
                <div>Stats....</div>
            </div>
        `);
        
    }

    getHtml() {
        let storage = window.localStorage;
        
        return (`
            <div id="teamPage" class="div_page">
                ${this.landingPage}
                ${this.athletePage}
            </div>
        `);
    }
    
    start() {
        
        // Only link them to pageTransition once
        if(this.pageTransition.getPageCount() == 0) {
            this.pageTransition.addPage("landingPage", this.landingPage, true);
            this.pageTransition.addPage("athletePage", this.athletePage);
        }
        
        let storage = window.localStorage;
        
        if (!this.hasStarted && this.doesTeamExist()) {
            $("#landingPage").find("#teamName").text(storage.getItem("teamName"));
            this.generateAthleteList();
            this.hasStarted = true;
            // TODO: have the user create a team.
        } else {

        }
    }

    generateAthleteList() {

        dbConnection.selectSingle("SELECT *, ROWID FROM athlete", []).then((athletes) => {
            ButtonGenerator.generateButtonsFromDatabase("#landingPage > .button_box", athletes, (athlete) => {
                this.startAthletePage(athlete);
            });
        });
    }

    startAthletePage(athlete) {
        
        // Set athlete data before sliding
        $("#athletePage").find("#athleteName").html(`${athlete.fname} ${athlete.lname}`);
        $("#athletePage > #athlete_info").html(`${athlete.grade}th grade ${athlete.gender == 'm' ? "male" : "female"}`);
        
        // After populated, slide
        this.pageTransition.slideLeft("athletePage");
        
        // Slide back; athlete page will be overwritten next select
        $("#back_button").bind("touchend", (e) => {
            this.pageTransition.slideRight("landingPage");
        });
    }

    /**
     * @description check if the current user has a team at all, either on account or local
     * @returns true or false
     */
    doesTeamExist() {
        let storage = window.localStorage;

        // local check
        if (storage.getItem("teamName") == null) {
            return false;
        }

        // TODO: query server database to see if user has a team

        return true;
    }

    stop() {

    }
}
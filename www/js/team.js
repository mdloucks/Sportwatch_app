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
                <br>
                <div class="generic_header">
                    <h1>Team</h1>
                </div><br><br>
                <br>
                <div class="button_box"></div>
            </div>
        `);

        this.athletePage = (`
            <div id="athletePage" class="div_page">
                <div id="athlete_header" class="generic_header">
                    <div id="back_button_athlete" class="back_button">&#8592;</div>
                    <h1 id="athleteName"></h1>
                </div>
        
                <h2 id="athlete_info"></h2>
                <h2 id="athlete_edit">Stats &#9999;</h2>
                <div id="athlete_stats"></div>
            </div>
        `);

        this.editAthletePage = (`
            <div id="editAthletePage" class="div_page">
                <div class="generic_header">
                    <div id="back_button_edit" class="back_button">&#8592;</div>
                    <h1 id="athleteName"></h1>
                </div>

                <div id="athlete_edit_inputs">
                </div>
            </div>
        `);

    }

    getHtml() {

        return (`
            <div id="teamPage" class="div_page">
                ${this.landingPage}
                ${this.athletePage}
                ${this.editAthletePage}
            </div>
        `);
    }

    start() {

        // Only link them to pageTransition once
        if (this.pageTransition.getPageCount() == 0) {
            this.pageTransition.addPage("landingPage", this.landingPage, true);
            this.pageTransition.addPage("athletePage", this.athletePage);
            this.pageTransition.addPage("editAthletePage", this.editAthletePage);
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

    /**
     * this function will generate a list of athletes to append to the button box on the landing page
     */
    generateAthleteList() {

        let conditionalAttributes = {
            "gender": {
                "m": { style: "background-color: lightblue; color: black; border: 1px solid black;" },
                "f": { style: "background-color: lightpink; color: black; border: 1px solid black;" }
            }
        };

        dbConnection.selectValues("SELECT *, ROWID FROM athlete", []).then((athletes) => {
            ButtonGenerator.generateButtonsFromDatabase("#teamPage #landingPage > .button_box", athletes, (athlete) => {
                this.startAthletePage(athlete);
            }, [], conditionalAttributes);
        });
    }

    startEditAthletePage(athlete) {

        // TODO: this section of the app will be subject to further review regarding what values we wish the coach to edit

        // $("#teamPage #editAthletePage #athlete_edit_inputs").empty();
        // $("#teamPage #editAthletePage #athleteName").html(`Editing ${athlete.fname} ${athlete.lname}`);

        // $("#editAthletePage p:contains('fname')").html("First Name");
        // $("#editAthletePage p:contains('lname')").html("Last Name");


        // $("#teamPage #back_button_edit").bind("touchend", (e) => {
        //     this.pageTransition.slideRight("athletePage");
        // });

        // let blackList = ["class", "id", "html"];
        // let rename = { "fname": "First Name", "lname": "Last Name", "grade": "Grade", "gender": "Gender" };

        // ValueEditor.editValues("#teamPage #editAthletePage #athlete_edit_inputs", athlete, (newValues) => {
        //     // TODO: SAVE NEW CHANGES!
        //     this.pageTransition.slideRight("athletePage");
        // }, blackList, rename);
    }

    /**
     * This function will take a athlete and display all of their stats on the screen.
     * @param {Object} athlete the athlete object to display
     */
    startAthletePage(athlete) {

        // Set athlete data before sliding
        $("#athletePage").find("#athleteName").html(`${athlete.fname} ${athlete.lname}`);
        $("#athletePage > #athlete_info").html(`${athlete.grade}th grade ${athlete.gender == 'm' ? "male" : "female"}`);

        // After populated, slide
        this.pageTransition.slideLeft("athletePage");

        $("#teamPage #athlete_edit").unbind("touchend");

        $("#teamPage #athlete_edit").bind("touchend", (e) => {
            this.pageTransition.slideLeft("editAthletePage");
            this.startEditAthletePage(athlete);
        });

        // Slide back; athlete page will be overwritten next select
        $("#back_button_athlete").bind("touchend", (e) => {
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
        // if (storage.getItem("teamName") == null) {
        //     return false;
        // }

        // TODO: query server database to see if user has a team

        return true;
    }

    stop() {

    }
}
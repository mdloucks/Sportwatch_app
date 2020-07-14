/**
 * @classdesc The team page will house everything from the team roster, join and create functionallity, individual athletes, and a team code.
 * @class
 */
class Team extends Page {
    constructor(id, pageSetObject) {
        super(id, "Team");
        this.hasStarted = false;

        this.pageController = pageSetObject;
        this.pageTransition = new PageTransition("#teamPage");

        // --- PAGES ---- //

        this.landingPage = (`
            <div id="landingPage" class="div_page">
                <div class="generic_header">
                    <div></div>
                    <h1>Team</h1>
                    <div></div>
                </div>
                <div class="button_box"></div>
            </div>
        `);

        this.athletePage = (`
            <div id="athletePage" class="div_page">
                <div id="athlete_header" class="generic_header">
                    <div id="back_button_athlete" class="back_button">&#9668;</div>
                    <h1 id="athleteName"></h1>
                    <div></div>
                </div>
        
                <h2 id="athlete_info"></h2>
                
                <div id="athlete_events"></div>
            </div>
        `);


        this.athleteStatPage = (`
        <div id="athleteStatPage" class="div_page">
            <div class="generic_header">
                <div id="back_button_athlete_stats" class="back_button">&#9668;</div>
                <h1>Athlete Stats</h1>
                <div></div>
            </div>
            <table id="athlete_stats_container"></table>
            <canvas id="athlete_stat_chart"></canvas>
        </div>
        `);

        // TODO: figure out edit stats for athletes
        // <h2 id="athlete_edit">Stats &#9999;</h2>
        // <div id="athlete_stats"></div>

        // this.editAthletePage = (`
        //     <div id="editAthletePage" class="div_page">
        //         <div class="generic_header">
        //             <div id="back_button_edit" class="back_button">&#8592;</div>
        //             <h1 id="athleteName"></h1>
        //         </div>

        //         <div id="athlete_edit_inputs">
        //         </div>
        //     </div>
        // `);

    }

    getHtml() {

        return (`
            <div id="teamPage" class="div_page">
                ${this.landingPage}
                ${this.athletePage}
                ${this.athleteStatPage}
            </div>
        `);
        // ${this.editAthletePage}
    }

    start() {

        // Only link them to pageTransition once
        if (this.pageTransition.getPageCount() == 0) {
            this.pageTransition.addPage("landingPage", this.landingPage, true);
            this.pageTransition.addPage("athletePage", this.athletePage, false);
            this.pageTransition.addPage("athleteStatPage", this.athleteStatPage, false);
            // this.pageTransition.addPage("editAthletePage", this.editAthletePage);
        } else {
            // Hide all and show (needed for new team-landing.js)
            this.pageTransition.hidePages();
            this.pageTransition.showCurrentPage();
            /*
             * Explanation: team-landing.js calls start() on all team objects
             * to set up the sub-pages for each. Consequently, this populates
             * the PageTransition page count, so when the user swipes to the
             * 'Team' tab and start() is called again, the former if branch is skipped,
             * showing every page. The latter if branch will hide the other pages
             * and only show the current page, resulting in the desired outcome
             */
        }

        let storage = window.localStorage;

        if (!this.hasStarted && this.doesTeamExist()) {
            $("#landingPage").find("#teamName").text(storage.getItem("teamName"));
            this.startLandingPage();

            this.hasStarted = true;
            // TODO: have the user create a team.
        } else {

        }
    }

    /**
     * this function will generate a list of athletes to append to the button box on the landing page
     */
    startLandingPage() {

        let conditionalAttributes = {
            "gender": {
                "m": {
                    style: "background-color: lightblue; color: black; border: 1px solid black;"
                },
                "f": {
                    style: "background-color: lightpink; color: black; border: 1px solid black;"
                }
            }
        };

        dbConnection.selectValues("SELECT *, ROWID FROM athlete", []).then((athletes) => {
            ButtonGenerator.generateButtonsFromDatabase("#teamPage #landingPage > .button_box", athletes, (athlete) => {
                this.startAthletePage(athlete);
            }, ["grade", "gender", "id_athlete_event_register"], conditionalAttributes);
        });
    }

    startEditAthletePage(athlete) {

        // TODO: this section of the app will be subject to further review regarding what values we wish the coach to edit

        // $("#teamPage #editAthletePage #athlete_edit_inputs").empty();
        // $("#teamPage #editAthletePage #athleteName").html(`Editing ${athlete.fname} ${athlete.lname}`);

        // $("#editAthletePage p:contains('fname')").html("First Name");
        // $("#editAthletePage p:contains('lname')").html("Last Name");


        // $("#teamPage #back_button_edit").bind("click", (e) => {
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

        $("#teamPage #athletePage #athlete_events").empty()

        let query = `
            SELECT * FROM event
            INNER JOIN athlete ON event_result.id_athlete = athlete.rowid
            WHERE event_result.id_event = ?
        `;

        dbConnection.selectValues("SELECT *, rowid FROM event", []).then((events) => {
            ButtonGenerator.generateButtonsFromDatabase("#teamPage #athletePage #athlete_events", events, (event) => {
                this.startAthleteStatPage(athlete, event);
            }, ["gender", "unit", "is_relay", "timestamp"]);
        });

        // Set athlete data before sliding
        $("#athletePage").find("#athleteName").html(`${athlete.fname} ${athlete.lname}`);
        $("#athletePage > #athlete_info").html(`${athlete.grade}th grade ${athlete.gender == 'm' ? "male" : "female"} &#9999;`);

        // After populated, slide
        this.pageTransition.slideLeft("athletePage");

        // $("#teamPage #athlete_edit").unbind("click");

        // $("#teamPage #athlete_edit").bind("click", (e) => {
        //     this.pageTransition.slideLeft("editAthletePage");
        //     this.startEditAthletePage(athlete);
        // });

        // Slide back; athlete page will be overwritten next select
        $("#back_button_athlete").bind("click", (e) => {
            this.pageTransition.slideRight("landingPage");
        });
    }

    startAthleteStatPage(athlete, event) {

        this.pageTransition.slideLeft("athleteStatPage");

        $("#teamPage #athleteStatPage #athlete_stats_container").empty();

        $("#teamPage #athleteStatPage #back_button_athlete_stats").bind("click", () => {
            this.pageTransition.slideRight("athletePage");
        });

        let query = `
            SELECT * FROM event_result
            INNER JOIN athlete ON event_result.id_athlete = athlete.rowid
            WHERE (event_result.id_event = ?) AND (athlete.rowid = ?)
        `;

        let length;
        let data = [];

        dbConnection.selectValues(query, [event.rowid, athlete.rowid]).then((results) => {

            length = results.length | 0;

            for (let i = 0; i < results.length; i++) {
                data.push({
                    x: i,
                    y: results.item(i).value
                });
            }

            // show different things if there is data or not
            if (length == 0) {
                $("#athlete_stat_chart").remove();
                $("#athlete_stats_container").remove();
                $("#teamPage #athleteStatPage .subheading_text").remove();

                console.log("NO DATA");

                $("#teamPage #athleteStatPage").append(`<div class="subheading_text">No data available</div>`);
            } else {
                this.showData(results, data);
            }
        });
    }

    /**
     * @description this object will display a table as well as a graph for the given results by startAthleteStatPage
     * 
     * @param {Object} data data to graph
     */
    showData(results, data) {
        $("#athlete_stat_chart").remove();
        $("#athlete_stats_container").remove();

        $("#teamPage #athleteStatPage").append(`<canvas id="athlete_stat_chart"></canvas>`);
        $("#teamPage #athleteStatPage").append(`<table id="athlete_stats_container"></table>`);

        // populate table

        $("#teamPage #athleteStatPage #athlete_stats_container").append(`
            <tr>
                <th>Date</th>
                <th>Value</th>
            </tr>
        `);

        for (let i = 0; i < results.length; i++) {
            // TODO: add date to event results
            let row = (`
                <tr>
                    <td>123</td>
                    <td>${results.item(i).value}</td>
                </tr>
            `);

            $("#teamPage #athleteStatPage #athlete_stats_container").append(row);
        }


        var canvas = document.getElementById('athlete_stat_chart');
        var ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var scatterChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    data: data,
                    fill: false,
                    borderColor: "#rgb(245, 77, 77)",
                    backgroundColor: "#e755ba",
                    pointBackgroundColor: "#55bae7",
                    pointBorderColor: "#55bae7",
                }]
            },
            options: {
                scales: {
                    xAxes: [{
                        type: 'linear',
                        position: 'bottom'
                    }]
                },
                legend: {
                    display: false
                },
                tooltips: {
                    enabled: false
                },
            }
        });
    }

    /**
     * @description check if the current user has a team at all, either on account or local
     * @returns true or false
     */
    doesTeamExist() {
        let storage = window.localStorage;

        // local check
        // TODO: Seth recommends using id_team since all other info (including teamName)
        //       can be retrieved. Plus, storing the id is better for backend integration
        // if (storage.getItem("teamName") == null) {
        //     return false;
        // }

        // TODO: query server database to see if user has a team

        return true;
    }

    stop() {

    }
}
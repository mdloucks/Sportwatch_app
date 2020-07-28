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
        this.isEditing = false;
        this.rowsToDelete = [];

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
        
                <h2 id="athlete_info" class="subheading_text"></h2>
                
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
                <canvas id="athlete_stat_chart"></canvas>
                <table class="alternating_table_shade" id="athlete_stats_container"></table>
            </div>
        `);
    }

    getHtml() {

        return (`
            <div id="teamPage" class="div_page">
                ${this.landingPage}
                ${this.athletePage}
                ${this.athleteStatPage}
            </div>
        `);
    }

    start() {

        // Only link them to pageTransition once
        if (this.pageTransition.getPageCount() == 0) {
            this.pageTransition.addPage("landingPage", this.landingPage, true);
            this.pageTransition.addPage("athletePage", this.athletePage, false);
            this.pageTransition.addPage("athleteStatPage", this.athleteStatPage, false);
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

        $("#landingPage").find("#teamName").text(storage.getItem("teamName"));
        this.startLandingPage();
    }

    /**
     * this function will generate a list of athletes to append to the button box on the landing page
     */
    startLandingPage() {

        $("#teamPage #landingPage > .button_box").empty();

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
            }, ["grade", "gender", "id_athlete_event_register", "id_backend", "rowid"], conditionalAttributes);
        });
    }


    /**
     * This function will take a athlete and display all of their events on the screen.
     * @param {Object} athlete the athlete object to display
     */
    startAthletePage(athlete) {

        $("#teamPage #athletePage #athlete_events").empty()

        // get any unique entries in record identity with values
        let query = (`
            SELECT DISTINCT record_definition.record_identity, record_definition.rowid from record_definition
            INNER JOIN record
            ON record_definition.rowid = record.id_record_definition
            WHERE record.id_athlete = ?
        `)

        dbConnection.selectValues(query, [athlete.rowid]).then((events) => {
            if(events == false) {
                $("#teamPage #athletePage #athlete_events").html("<div class='subheading_text'>There are no events for this athlete. Save a time in the stopwatch for an event to create one.</div>")
            } else {
                ButtonGenerator.generateButtonsFromDatabase("#teamPage #athletePage #athlete_events", events, (event) => {
                    this.startAthleteStatPage(athlete, event);
                }, ["gender", "unit", "is_relay", "last_updated"]);
            }
        });

        // Set athlete data before sliding
        $("#athletePage").find("#athleteName").html(`${athlete.fname} ${athlete.lname}`);
        $("#athletePage > #athlete_info").html(`${athlete.grade}th grade ${athlete.gender == 'm' ? "male" : "female"}`);

        // After populated, slide
        this.pageTransition.slideLeft("athletePage");

        // Slide back; athlete page will be overwritten next select
        $("#back_button_athlete").bind("click", (e) => {
            this.pageTransition.slideRight("landingPage");
        });
    }

    /**
     * this function will display stats for the given athlete and event
     * @param {Object} athlete db athlete results
     * @param {Object} event db event results
     */
    startAthleteStatPage(athlete, event) {

        this.pageTransition.slideLeft("athleteStatPage");

        this.tableData = [];

        $("#teamPage #athleteStatPage #athlete_stats_container").empty();

        $("#teamPage #athleteStatPage #back_button_athlete_stats").bind("click", () => {
            this.pageTransition.slideRight("athletePage");
        });

        let query = `
            SELECT *, record.rowid from record
            WHERE id_record_definition = ? AND id_athlete = ?
        `;

        let length;
        let data = [];

        dbConnection.selectValues(query, [event.rowid, athlete.rowid]).then((results) => {

            length = results.length | 0;

            for (let i = 0; i < results.length; i++) {
                data.push({
                    x: i + 1,
                    y: results.item(i).value
                });
            }

            // show different things if there is data or not
            if (length == 0) {
                $("#athlete_stat_chart").remove();
                $("#athlete_stats_container").remove();
                $("#edit_values_button").remove();
                $("#teamPage #athleteStatPage .subheading_text").remove();

                $("#teamPage #athleteStatPage").append(`<div class="subheading_text">No data available</div>`);
                // don't need to graph for a single point, only show table
            } else if (length == 1) {
                $("#athlete_stat_chart").remove();
                this.createTable(results);
                // there is enough data, graph
            } else {
                this.createGraph(data);
                this.createTable(results);
            }
        });
    }

    /**
     * @description construct a table to display the given results
     * 
     * @param {Object} results database results
     */
    createTable(results) {
        $("#athlete_stats_container").remove();
        $("#edit_values_button").remove();
        $("#teamPage #athleteStatPage").append(`<table class="alternating_table_shade" id="athlete_stats_container"></table>`);
        $("#teamPage #athleteStatPage").append(`<button class="edit_values_button" id="edit_values_button">Edit</button>`);

        $("#teamPage #edit_values_button").click(() => {

            if (this.isEditing) {
                $("#teamPage tr").each(function () {
                    $(this).children().last().remove();
                })
            } else {
                $("#teamPage tr:first-child").append("<th>Delete</th>");
                $("#teamPage tr:not(:first-child)").append("<td>X</td>");
            }

            this.toggleTableEditable();

            this.isEditing = !this.isEditing;
        });

        // populate table

        $("#teamPage #athleteStatPage #athlete_stats_container").append(`
            <tr>
                <th>Result</th>
                <th>Date</th>
                <th>Value</th>
            </tr>
        `);

        for (let i = 0; i < results.length; i++) {
            // TODO: add date to event results
            let row = (`
                <tr id_record=${results.item(i).rowid}>
                    <td>${i + 1}</td>
                    <td>${new Date(results.item(i).last_updated).toLocaleDateString("en-US")}</td>
                    <td>${results.item(i).value.toFixed(2)}</td>
                </tr>
            `);

            $("#teamPage #athleteStatPage #athlete_stats_container").append(row);
        }
    }

    /**
     * @description display a graph to #athleteStatPage
     * 
     * @param {Array} data an xy array for the data to display
     */
    createGraph(data) {
        $("#athlete_stat_chart").remove();
        $("#teamPage #athleteStatPage").append(`<canvas id="athlete_stat_chart"></canvas>`);

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
     * Allow the necessary tables to be edited. This will save the results on every other call.
     * 
     * @param {Object} event database result for atheltevent
     * @param {Object} athlete result for athlete
     */
    toggleTableEditable() {

        let _this = this;

        $("#teamPage td").each(function () {

            // names
            if (!isNaN(Number($(this).text()))) {

                // change to not editing
                if (_this.isEditing) {
                    $($(this)).attr('contenteditable', false);
                    $("#teamPage #edit_values_button").html("Edit");
                    $("#teamPage #edit_values_button").addClass("edit_values_button").removeClass("save_values_button");
                    // change to editing
                } else {
                    $($(this)).attr('contenteditable', true);
                    $("#teamPage #edit_values_button").html("Save")
                    $("#teamPage #edit_values_button").addClass("save_values_button").removeClass("edit_values_button");
                }

            } else if (isNaN(Number($(this).text()))) {
                // prohibit editing name values
            }
        });

        // when user clicks save the results
        if (this.isEditing) {

            $("#teamPage #athlete_stats_container").addClass("alternating_table_shade");
            $("#teamPage #athlete_stats_container").removeClass("delete_column_red");

            $("#athlete_stats_container td").off("click");

            // delete values in rowsToDelete
            for (let i = 0; i < this.rowsToDelete.length; i++) {
                dbConnection.deleteValues("record", "WHERE rowid = ?", [this.rowsToDelete[i]])
            }

            // save changed values
            let newData = this.tableToObject();
            
            for (let i = 0; i < newData.length; i++) {
                // check to see if it contains non-numbers

                if ((/^[0-9.]+$/).test(newData[i].value)) {
                    dbConnection.updateValues("record", ["value"], [newData[i].value], `WHERE rowid = ?`, [newData[i].rowid]);
                }
            }

            // check if there was a bad type and trigger a popup menu only once
            if(newData.some((e) => !(/^[0-9.]+$/).test(e.value))) {
                Popup.createConfirmationPopup(`Cannot Save Result ${i + 1}. Only numbers can be saved, please try again.`, ["Ok"]);
            }
        // when user clicks edit
        } else {

            $("#teamPage #athlete_stats_container").removeClass("alternating_table_shade");
            $("#teamPage #athlete_stats_container").addClass("delete_column_red");

            // delete row callback
            $("#athlete_stats_container td").click(function (e) {

                let id_record = $(this).parent().attr("id_record");

                let row = Number(e.target.parentNode.rowIndex);
                let isDeleting = $(this).text() == "X" ? true : false;

                if(isDeleting) {
                    $(this).parent().remove();
                    
                    // mark rows to delete on save
                    _this.rowsToDelete.push(id_record);
                }
            });
        }
    }

    /**
     * This function will convert the athlete data container table into an object
     * 
     */
    tableToObject() {
        return $(`#athlete_stats_container tr:has(td)`).map(function (i, v) {
            var $td = $('td', this);
            return {
                result: $td.eq(0).text(),
                date: $td.eq(1).text(),
                value: $td.eq(2).text(),
                x: $td.eq(3).text(),
                rowid: $td.parent().attr("id_record")
            }
        }).get();
    }

    /**
     * @description check if the current user has a team at all, either on account or local
     * @returns true or false
     */
    doesTeamExist() {
        let storage = window.localStorage;

        // local check
        if (storage.getItem("id_team") == null) {
            return false;
        }
        
        return true;
    }

    stop() {

    }
}
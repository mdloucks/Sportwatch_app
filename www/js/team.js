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

        this.landingPageSelector = "#teamPage #landingPage";

        this.athleteButtonsBoxSelectorMales = "#teamPage #landingPage #male_container";
        this.athleteButtonsBoxSelectorFemales = "#teamPage #landingPage #female_container";

        this.athleteBoxSelector = "#teamPage #landingPage .button_box";

        // --- PAGES ---- //

        this.landingPage = (`
            <div id="landingPage" class="div_page">
                <div class="left_container">
                    <div id="team_name" class="left_text underline">My Team</div>
                </div>

                <div class="button_box"></div>
            </div>
        `);

        //     <div class="row">
        //     <div id="male_container" class="athlete_container"></div>
        //     <div id="female_container" class="athlete_container"></div>
        // </div>

        this.athletePage = (`
            <div id="athletePage" class="div_page">
                <div id="athlete_header" class="generic_header">
                    <div id="back_button_athlete" class="back_button">&#9668;</div>
                    <h1 id="athleteName"></h1>
                    <div></div>
                </div>

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

        let teamName = storage.getItem("teamName");

        if(teamName == null) {
            teamName = "My Team";
        }

        $(`${this.landingPageSelector} #team_name`).html(teamName);
        // $(`${this.landingPageSelector} #team_name`).slideUp(1000);
        // $(`${this.landingPageSelector} #team_name`).fadeIn(1000);



        if (!this.hasStarted) {
            this.hasStarted = true;
        } else {
            this.startLandingPage(() => {
                // Animations.fadeInChildren(this.athleteButtonsBoxSelectorMales, Constant.fadeDuration, Constant.fadeIncrement);
                // Animations.fadeInChildren(this.athleteButtonsBoxSelectorFemales, Constant.fadeDuration, Constant.fadeIncrement);
                Animations.fadeInChildren(this.athleteBoxSelector, Constant.fadeDuration, Constant.fadeIncrement);
            });
        }
    }


    /**
     * @description start the landing page
     * @param {function} callback the function to be called when elements are done being generated
     */
    startLandingPage(callback) {

        $("#teamPage #landingPage #male_container").empty();
        $("#teamPage #landingPage #female_container").empty();
        $(this.athleteBoxSelector).empty();

        let conditionalAttributes = {
            "gender": {
                "m": {
                    style: "background-color: #6a81e1; color: black; border: 1px solid white;"
                },
                "f": {
                    style: "background-color: #fc99b6; color: black; border: 1px solid white;"
                }
            }
        };

        // generate list of athletes then hide them
        dbConnection.selectValues("SELECT *, ROWID FROM athlete", []).then((athletes) => {
            if (athletes != false) {
                let storage = window.localStorage;
                let teamName = "My Team";

                if (storage.getItem("teamName") != null) {
                    teamName = storage.getItem("teamName");
                }
                // separate boys and girls

                let males = [];
                let females = [];
                let array = []

                for (let i = 0; i < athletes.length; i++) {
                    array.push(athletes.item(i));
                    // if (athletes.item(i).gender == "m") {
                    //     males.push(athletes.item(i));
                    // } else if (athletes.item(i).gender == "f") {
                    //     females.push(athletes.item(i));
                    // }
                }

                $("#teamPage #landingPage .left_text").html(teamName);
                $("#teamPage #landingPage .subheading_text").remove();
                $("#teamPage #landingPage .missing_info_text").remove();

                // ButtonGenerator.generateButtonsFromDatabase("#teamPage #landingPage #male_container", males, (athlete) => {
                //     this.startAthletePage(athlete);
                // }, ["gender", "id_athlete_event_register", "id_backend", "rowid"], conditionalAttributes);

                // ButtonGenerator.generateButtonsFromDatabase("#teamPage #landingPage #female_container", females, (athlete) => {
                //     this.startAthletePage(athlete);
                // }, ["gender", "id_athlete_event_register", "id_backend", "rowid"], conditionalAttributes);


                ButtonGenerator.generateButtonsFromDatabase(this.athleteBoxSelector, array, (athlete) => {
                    this.startAthletePage(athlete);
                }, ["gender", "id_athlete_event_register", "id_backend", "rowid"], conditionalAttributes, "lname");

                // Animations.hideChildElements(this.athleteButtonsBoxSelectorMales);
                // Animations.hideChildElements(this.athleteButtonsBoxSelectorFemales);
                Animations.hideChildElements(this.athleteBoxSelector);

                callback();
            } else {
                $("#teamPage #landingPage .left_text").empty();
                if ($("#teamPage #landingPage .missing_info_text").length == 0) {
                    $("#teamPage #landingPage").append(`
                        <div class="missing_info_text">
                            There aren't any athletes on your team yet. Go to Settings -> Team Preferences to
                            invite athletes with a code, or by email.
                        </div>
                    `);
                }
            }
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
            INNER JOIN record_user_link
            ON record_user_link.id_record = record.id_record
            WHERE record_user_link.id_backend = ?
        `);

        // generate events
        dbConnection.selectValues(query, [athlete.id_backend]).then((events) => {
            if (events == false) {
                $("#teamPage #athletePage #athlete_events").html("<div class='missing_info_text'>There are no events for this athlete. Save a time in the stopwatch for an event to create one.</div>")
            } else {
                ButtonGenerator.generateButtonsFromDatabase("#teamPage #athletePage #athlete_events", events, (event) => {
                    this.startAthleteStatPage(athlete, event);
                }, ["gender", "unit", "is_relay", "last_updated"], Constant.eventColorConditionalAttributes);
            }
        });

        // Set athlete data before sliding
        $("#athletePage").find("#athleteName").html(`${athlete.fname} ${athlete.lname}`);

        // After populated, slide
        this.pageTransition.slideLeft("athletePage");
        // While transitioning, scroll to the top
        $("#teamPage").animate({
            scrollTop: 0
        }, 1000);
        // Add top padding to avoid header overlap (iOS issue)
        let headerWidth = $("#teamPage #athletePage > .generic_header").height();
        $("#teamPage #athletePage > *:not(.generic_header)").first().css("margin-top", `calc(${headerWidth}px + 5vh)`);
        
        // Slide back; athlete page will be overwritten next select
        $("#back_button_athlete").bind("click", (e) => {
            this.pageTransition.slideRight("landingPage");
            // Reset scroll
            $("#teamPage").animate({
                scrollTop: 0
            }, 1000);
        });
    }

    /**
     * this function will display stats for the given athlete and event
     * @param {Object} athlete db athlete results
     * @param {Object} event db event results
     */
    startAthleteStatPage(athlete, event) {

        this.pageTransition.slideLeft("athleteStatPage");
        // While transitioning, scroll to the top
        $("#teamPage").animate({
            scrollTop: 0
        }, 1000);
        // Padding added in createTable function

        this.tableData = [];

        $("#teamPage #athleteStatPage #athlete_stats_container").empty();

        // back button
        $("#teamPage #athleteStatPage #back_button_athlete_stats").bind("click", () => {
            // stop editing so columns don't delete
            this.isEditing = false;
            this.pageTransition.slideRight("landingPage");
            // Scroll to the top
            $("#teamPage").animate({
                scrollTop: 0
            }, 1000);
        });

        let query = `
            SELECT *, record.id_record from record
            INNER JOIN record_user_link
            ON record.id_record = record_user_link.id_record
            WHERE record.id_record_definition = ? AND record_user_link.id_backend = ?
        `;

        let length;
        let data = [];

        // generate the table and graph data for athlete
        dbConnection.selectValues(query, [event.rowid, athlete.id_backend]).then((results) => {

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
                this.createTable(athlete, results);
                // there is enough data, graph
            } else {
                this.createGraph(data);
                this.createTable(athlete, results);
            }
        });
    }

    /**
     * @description construct a table to display the given results
     * 
     * @param {Object} results database results
     */
    createTable(athlete, results) {
        $("#athlete_stats_container").remove();
        $("#edit_values_button").remove();
        $("#add_value_button").remove();
        $("#teamPage #athleteStatPage").append(`<table class="alternating_table_shade" id="athlete_stats_container"></table>`);
        $("#teamPage #athleteStatPage").append(`<button class="edit_values_button action_button" id="edit_values_button">Edit</button>`);
        $("#teamPage #athleteStatPage").append(`<button class="add_values_button action_button" id="add_value_button">Add Value</button>`);

        let addContainer = function (e) {

            let nChildren = $("#athlete_stats_container > *").length;

            $("#athlete_stats_container").append(`
                <tr isAdded="true" id_backend="${athlete.id_backend}" id_record_definition="${results.item(0).id_record_definition}">
                    <td>${nChildren}</td>
                    <td>${new Date(Date.now()).toLocaleDateString("en-US")}</td>
                    <td></td>
                </tr>
            `);
        };


        $("#add_value_button").click(addContainer);

        // click edit values button
        $("#teamPage #edit_values_button").click(() => {

            // append delete button or take them off
            if (this.isEditing) {
                $("#teamPage tr").each(function () {
                    $(this).children().last().remove();
                });

                $("#teamPage #athleteStatPage").append(`<button class="add_values_button action_button" id="add_value_button">Add Value</button>`);
                $("#add_value_button").click(addContainer);
            } else {
                $("#teamPage tr:first-child").append("<th>Delete</th>");
                $("#teamPage tr:not(:first-child)").append("<td>X</td>");
                $("#add_value_button").remove();
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

            // Parse date (first is local save, second handles server format)
            let date = new Date(results.item(i).last_updated).toLocaleDateString("en-US");
            if (date.includes("Invalid")) {
                date = this.getRecordDate(results.item(i).last_updated);
            }

            let row = (`
                <tr id_record=${results.item(i).id_record}>
                    <td>${i + 1}</td>
                    <td>${date}</td>
                    <td>${results.item(i).value.toFixed(2)}</td>
                </tr>
            `);

            $("#teamPage #athleteStatPage #athlete_stats_container").append(row);
        }
        
        // Add the padding now that the table has been created
        let headerWidth = $("#teamPage #athleteStatPage > .generic_header").height();
        $("#teamPage #athleteStatPage #athlete_stat_chart").first().css("margin-top", `calc(${headerWidth}px + 5vh)`);
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

        // change all of the styling for the table
        $("#teamPage td, #teamPage input").each(function () {

            let val = $(this).text();
            if ((val == null) || (val.length == 0)) { // Inputs use .val()
                val = $(this).val();
            }

            // strings
            if (!isNaN(Number(val))) {

                // change to not editing
                if (_this.isEditing) {
                    // $($(this)).attr('contenteditable', false);
                    $(this).replaceWith(`<td>${val}</td>`);
                    $("#teamPage #edit_values_button").html("Edit");
                    $("#teamPage #edit_values_button").addClass("edit_values_button").removeClass("save_values_button");
                    // change to editing
                } else {
                    // $($(this)).attr('contenteditable', true);
                    $(this).replaceWith(`<input value="${val}">`);
                    $("#teamPage #edit_values_button").html("Save")
                    $("#teamPage #edit_values_button").addClass("save_values_button").removeClass("edit_values_button");
                }

            } else if (isNaN(Number(val))) {
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
                // dbConnection.deleteValues("record", "WHERE record.id_record = ?", [this.rowsToDelete[i]]);
                dbConnection.runQuery("DELETE FROM record WHERE id_record = ?", [Number(this.rowsToDelete[i])]);

                RecordBackend.deleteRecord(this.rowsToDelete[i], function (response) {
                    console.log("deleted " + JSON.stringify(response));
                });
            }

            // save changed values
            let newData = this.tableToObject();

            for (let i = 0; i < newData.length; i++) {

                if (newData[i].isAdded) { // true if user clicked "Add Value"
                    // Save the record first so the frontend will have a matching id to the backend

                    RecordBackend.saveRecord(Number(newData[i].value), Number(newData[i].id_record_definition), Number(newData[i].id_backend), (response) => {
                        if (DO_LOG) {
                            console.log("RECORD SAVED " + JSON.stringify(response));
                        }
                        if (response.status > 0) { // If success, insert into local database
                            // Define default fallback values, then use actual values in loop below
                            let recordData = {
                                "id_record": Number(response["addedRecords"][0]["id_record"]),
                                "value": Number(newData[i].value),
                                "id_record_definition": Number(newData[i].id_record_definition),
                                "is_practice": true,
                                "is_split": false,
                                "id_split": null,
                                "id_split_index": null,
                                "last_updated": Date.now()
                            };
                            let linkData = {
                                "id_backend": Number(newData[i].id_backend),
                                "id_record": Number(response["addedRecords"][0]["id_record"])
                            };

                            dbConnection.insertValuesFromObject("record", recordData);
                            dbConnection.insertValuesFromObject("record_user_link", linkData);

                        } else {
                            if (DO_LOG) {
                                console.log("[stopwatch.js:saveTime()]: Unable to save time to backend");
                            }
                        }
                    });

                    // check to see if it contains non-numbers
                } else if ((/^[0-9.]+$/).test(newData[i].value)) {
                    dbConnection.updateValues("record", ["value"], [newData[i].value], `WHERE id_record = ?`, [newData[i].id_record]);
                    RecordBackend.modifyRecord(newData[i].id_record, {
                        "value": newData[i].value
                    }, (r) => {
                        if ((r.status < 0) && (DO_LOG)) {
                            console.log("[team.js:toggleTableEditable()]: Updating backend failed for ID " + newData[i].id_record);
                        }
                    });

                }
            }

            // check if there was a bad type and trigger a popup menu only once
            if (newData.some((e) => !(/^[0-9.]+$/).test(e.value))) {
                Popup.createConfirmationPopup(`Unable to update results, please try again. (There may be no duplicate result numbers)`, ["Ok"]);
                this.pageTransition.slideRight("athletePage");
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

                if (isDeleting) {
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
            var $tr = $(v).children(); // v stands for value
            return {
                result: $tr.eq(0).text(),
                date: $tr.eq(1).text(),
                value: Number($tr.eq(2).text()),
                x: $tr.eq(3).text(),
                isAdded: $tr.parent().attr("isAdded"),
                id_record: Number($tr.parent().attr("id_record")),
                id_backend: $tr.parent().attr("id_backend"),
                id_record_definition: Number($tr.parent().attr("id_record_definition"))
            };
        }).get();
    }

    /**
     * Formats a record's lastUpdated date/time to a format
     * usable for javascript Date().
     * 
     * @example getRecordDate("2020-08-20 08-56-33");
     * 
     * @param {String} rawDateTime date formatted "yyyy-mm-dd hr:mi:ss"
     * @returns
     * US Date String formatted correctly
     */
    getRecordDate(rawDateTime) {

        let year = rawDateTime.substr(0, 4);
        let month = rawDateTime.substr(5, 2) - 1; // Months are indexed weird in PHP
        let day = rawDateTime.substr(8, 2);
        let hour = rawDateTime.substr(11, 2);
        let minute = rawDateTime.substr(14, 2);
        let second = rawDateTime.substr(17, 2);
        return new Date(year, month, day, hour, minute, second).toLocaleDateString("en-US");
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
        // Animations.hideChildElements(this.athleteButtonsBoxSelectorMales);
        // Animations.hideChildElements(this.athleteButtonsBoxSelectorFemales);
        Animations.hideChildElements(this.athleteBoxSelector);

        // $(`${this.landingPageSelector} #team_name`).hide();
    }
}
/**
 * @classdesc This is the stats page
 * @class
 */
class Stats extends Page {

    constructor(id) {
        super(id, "Stats");
        this.dbConnection = new DatabaseConnection();
        this.pageTransition = new PageTransition("#statsPage");
        this.hasStarted = false;

        this.landingPage = (`
            <div id="landingPage">
                <br><br>
                <h1>Stats</h1><br><br>
                <div class="button_box"></div><br><br>
            </div>
        `);

        this.eventPage = (`
        <div id="eventPage">
            <div id="event_header" class="generic_header">
                <div id="back_button_event" class="back_button">&#8592;</div>
                <h1 id="event_name"></h1>
            </div><br><br>

            <div class="table_container sportwatch_selector">
                <div id="sort_alphabet">A-z</div>
                <div id="sort_times">0-9</div>
                <div id="sort_gender">M/F</div>
            </div><br><br>

            <table id="event_results">
                <tr class="column_names">
                    <th>Name</th>
                    <th>Best</th>
                    <th>Average</th>
                    <th>Worst</th>
                </tr>
            </table>
        </div>
        `);

        this.addEventPage = (`
            <div id="addEventPage">
                <div id="add_event_header" class="generic_header">
                    <div id="back_button_add_event" class="back_button">&#8592;</div>
                    <h1>Add Event</h1>
                </div>

                <div class="button_box">
                    <button id="create_custom_event">Custom...</button>
                </div>
            </div>
        `);

    }

    getHtml() {
        return (`
            <div id="statsPage" class="div_page">
                ${this.landingPage}
                ${this.addEventPage}
                ${this.eventPage}
            </div>
        `);
    }

    start() {

        // Only link them to pageTransition once
        if (this.pageTransition.getPageCount() == 0) {
            this.pageTransition.addPage("landingPage", this.landingPage, true);
            this.pageTransition.addPage("addEventPage", this.addEventPage);
            this.pageTransition.addPage("eventPage", this.eventPage);
        }

        if (!this.hasStarted) {
            this.startLandingPage();

            this.hasStarted = true;
        }

    }

    startLandingPage() {
        this.dbConnection.selectValues("SELECT *, rowid FROM event", []).then((events) => {
            ButtonGenerator.generateButtonsFromDatabase("#statsPage #landingPage .button_box", events, (event) => {
                this.startEventPage(event);
            }, ["gender", "unit", "is_relay", "timestamp"]);

            let addButton = ButtonGenerator.generateButton({ text: "Add Event", class: "add_event_button" }, () => {
                this.startAddEventPage();
            });

            $("#statsPage #landingPage").append(addButton);
        });
    }

    startAddEventPage() {
        // TODO: implement

    }

    startEventPage(event) {

        this.pageTransition.slideLeft("eventPage");

        this.clearResultsTable();

        $("#statsPage #eventPage #event_name").html(event.event_name);

        $("#statsPage #eventPage #back_button_event").bind("touchend", (e) => {
            this.pageTransition.slideRight("landingPage");
        });

        $("#statsPage #eventPage #sort_alphabet").unbind("touchend");
        $("#statsPage #eventPage #sort_times").unbind("touchend");
        $("#statsPage #eventPage #sort_gender").unbind("touchend");

        // Sort alphabetically
        $("#statsPage #eventPage #sort_alphabet").bind("touchend", (e) => {
            $("#statsPage #eventPage #sort_alphabet").addClass("selected");
            $("#statsPage #eventPage #sort_times").removeClass("selected");
            $("#statsPage #eventPage #sort_gender").removeClass("selected");

            this.generateAthleteTimes(event, "A-z");
        });

        // sort based on fasted time
        $("#statsPage #eventPage #sort_times").bind("touchend", (e) => {
            $("#statsPage #eventPage #sort_times").addClass("selected");
            $("#statsPage #eventPage #sort_alphabet").removeClass("selected");
            $("#statsPage #eventPage #sort_gender").removeClass("selected");

            this.generateAthleteTimes(event, "0-9");
        });

        // sort based on gender
        $("#statsPage #eventPage #sort_gender").bind("touchend", (e) => {
            $("#statsPage #eventPage #sort_gender").addClass("selected");
            $("#statsPage #eventPage #sort_alphabet").removeClass("selected");
            $("#statsPage #eventPage #sort_times").removeClass("selected");

            this.generateAthleteTimes(event, "M/F");
        });

        this.generateAthleteTimes(event);
    }

    generateAthleteTimes(event, order) {

        this.clearResultsTable();

        let query = `
            SELECT * FROM event_result
            INNER JOIN athlete ON event_result.id_athlete = athlete.rowid
            WHERE event_result.id_event = ?
        `;

        this.dbConnection.selectValues(query, [event.rowid]).then((results) => {

            let athletes = this.constructAthleteTimeArray(results, order);

            for (let i = 0; i < athletes.length; i++) {

                if (athletes[i] === null || athletes[i] === undefined) {
                    continue;
                }

                console.log(JSON.stringify(athletes[i]));

                let name = athletes[i].fname + "\t" + athletes[i].lname;
                let min = Math.min(...athletes[i].values);
                let max = Math.max(...athletes[i].values);
                let average = (athletes[i].values.reduce((a, b) => a + b, 0) / athletes[i].values.length).toFixed(2);

                let info_box;

                if (athletes[i].gender == 'm') {
                    info_box = $("<tr>", { class: "male_color" });
                } else if (athletes[i].gender == 'f') {
                    info_box = $("<tr>", { class: "female_color" });
                } else {
                    info_box = $("<tr>");
                }

                info_box.append($("<td>", { text: name }));
                info_box.append($("<td>", { text: max }));
                info_box.append($("<td>", { text: average }));
                info_box.append($("<td>", { text: min }));

                $("#statsPage #eventPage #event_results").append(info_box);
            }

        });
    }

    constructAthleteTimeArray(rows, order) {

        let array = [];

        let athlete_ids = [];

        for (let i = 0; i < rows.length; i++) {
            if (athlete_ids.includes(rows.item(i).id_athlete)) {
                array[rows.item(i).id_athlete].values.push(rows.item(i).value);

            } else if (!athlete_ids.includes(rows.item(i).id_athlete)) {
                athlete_ids.push(rows.item(i).id_athlete);
                array[rows.item(i).id_athlete] = rows.item(i);
                array[rows.item(i).id_athlete].values = [rows.item(i).value];
            }
        }

        if (order == "A-z") {
            array.sort((a, b) => (a.lname > b.lname) ? 1 : ((b.lname > a.lname) ? -1 : 0));
        } else if (order == "0-9") {
            array.sort((a, b) => (Math.max(...a.values) > Math.max(...b.values)) ? 1 : ((Math.max(b.values) > Math.max(a.values)) ? -1 : 0));
        } else if (order == "M/F") {
            array.sort((a, b) => (a.gender > b.gender) ? 1 : ((b.gender > a.gender) ? -1 : 0));
        }

        console.log(JSON.stringify(array));
        console.log(array.length);

        return array;
    }

    /**
     * will remove all of the generated entries in the results
     */
    clearResultsTable() {
        $("#statsPage #eventPage #event_results").html(`
            <tr class="column_names">
                <th>Name</th>
                <th>Best</th>
                <th>Average</th>
                <th>Worst</th>
            </tr>
        `);
    }

    addEvent(event) {

    }



    stop() {
    }
}
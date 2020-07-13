/**
 * @classdesc This is the stats page
 * @class
 */
class Stats extends Page {

    constructor(id, pageSetObject) {
        super(id, "Stats");
        this.pageController = pageSetObject;
        this.pageTransition = new PageTransition("#statsPage");
        this.hasStarted = false;

        this.landingPage = (`
            <div id="landingPage" class="div_page">
                <br>
                <div class="generic_header">
                    <h1>Stats</h1>
                </div><br><br>

                <div class="button_box"></div><br><br>
                <div id="add_event_box"></div>
            </div>
        `);

        this.eventPage = (`
        <div id="eventPage" class="div_page">
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
            <div id="addEventPage" class="div_page">
                <div id="add_event_header" class="generic_header">
                    <div id="back_button_add_event" class="back_button">&#8592;</div>
                    <h1>Add Event</h1>
                </div>

                <div class="button_box">
                    
                </div>
            </div>
        `);
        // TODO: allow user to make custom events <button id="create_custom_event">Custom...</button>

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

        this.pageTransition.slideRight("landingPage");

        $("#statsPage #landingPage .button_box").empty();
        $("#statsPage #landingPage #add_event_box").empty();

        dbConnection.selectValues("SELECT *, rowid FROM event", []).then((events) => {
            ButtonGenerator.generateButtonsFromDatabase("#statsPage #landingPage .button_box", events, (event) => {
                console.log(`EVENTS ${events}`);
                
                this.startEventPage(event);
            }, ["gender", "unit", "is_relay", "timestamp"]);

            let addButton = ButtonGenerator.generateButton({ text: "Add Event", class: "add_button" }, () => {
                this.startAddEventPage();
            });

            $("#statsPage #landingPage #add_event_box").append(addButton);
        });
    }

    /**
     * @description This function will start the event page
     * @param {row} event the event to display results for
     */
    startEventPage(event) {

        this.pageTransition.slideLeft("eventPage");

        this.clearResultsTable();

        $("#statsPage #eventPage #event_name").html(event.event_name);

        $("#statsPage #eventPage #back_button_event").bind("click", (e) => {
            this.pageTransition.slideRight("landingPage");
        });

        $("#statsPage #eventPage #sort_alphabet").unbind("click");
        $("#statsPage #eventPage #sort_times").unbind("click");
        $("#statsPage #eventPage #sort_gender").unbind("click");

        // Sort alphabetically
        $("#statsPage #eventPage #sort_alphabet").bind("click", (e) => {
            $("#statsPage #eventPage #sort_alphabet").addClass("button_selected");
            $("#statsPage #eventPage #sort_times").removeClass("button_selected");
            $("#statsPage #eventPage #sort_gender").removeClass("button_selected");

            this.generateAthleteTimes(event, "A-z");
        });

        // sort based on fasted time
        $("#statsPage #eventPage #sort_times").bind("click", (e) => {
            $("#statsPage #eventPage #sort_times").addClass("button_selected");
            $("#statsPage #eventPage #sort_alphabet").removeClass("button_selected");
            $("#statsPage #eventPage #sort_gender").removeClass("button_selected");

            this.generateAthleteTimes(event, "0-9");
        });

        // sort based on gender
        $("#statsPage #eventPage #sort_gender").bind("click", (e) => {
            $("#statsPage #eventPage #sort_gender").addClass("button_selected");
            $("#statsPage #eventPage #sort_alphabet").removeClass("button_selected");
            $("#statsPage #eventPage #sort_times").removeClass("button_selected");

            this.generateAthleteTimes(event, "M/F");
        });

        this.generateAthleteTimes(event);
    }

    /**
     * @description this will generate all of the times for the given event in the specified order 
     * and append it to the table
     * @param {row} event the event row from the database
     * @param {String} order what order to generate the times in
     */
    generateAthleteTimes(event, order) {

        this.clearResultsTable();

        // let query = `
        //     SELECT * FROM event_result
        //     INNER JOIN athlete ON event_result.id_athlete = athlete.rowid
        //     WHERE event_result.id_event = ?
        // `;

        dbConnection.selectValues(query, [event.rowid]).then((results) => {

            let athletes = this.constructAthleteTimeArray(results, order);

            for (let i = 0; i < athletes.length; i++) {

                if (athletes[i] === null || athletes[i] === undefined) {
                    continue;
                }

                let name = athletes[i].fname + "\t" + athletes[i].lname;
                let min = Math.min(...athletes[i].values).toFixed(2);
                let max = Math.max(...athletes[i].values).toFixed(2);
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
                info_box.append($("<td>", { text: min }));
                info_box.append($("<td>", { text: average }));
                info_box.append($("<td>", { text: max }));

                $("#statsPage #eventPage #event_results").append(info_box);
            }

        });
    }

    /**
     * @description This function will merge the athlete times into one array inside of the athlete object
     * instead of having multiple objects, just access .values It will also sort these values
     * @param {row} rows the event rows
     * @param {String} order what to order the rows
     */
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
            array.sort((a, b) => (a.gender < b.gender) ? 1 : ((b.gender < a.gender) ? -1 : 0));
        }

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

    /**
     * this function is called when the add event button is pressed
     */
    startAddEventPage() {
        this.pageTransition.slideLeft("addEventPage");

        dbConnection.selectValues("SELECT *, rowid FROM record_definition", []).then((record_definitions) => {
            ButtonGenerator.generateButtonsFromDatabase("#statsPage #addEventPage .button_box", record_definitions, (record_definition) => {
                this.addEvent(record_definition)
            }, ["unit"]);
        });
        
    }

    addEvent(event) {

        let is_relay = (event.record_identity.includes("relay") == true) ? true : false
        let data = [event.record_identity, "m", event.unit, is_relay, Date.now()];
        
        dbConnection.insertValues("event", data);
        this.startLandingPage();
    }



    stop() {
    }
}
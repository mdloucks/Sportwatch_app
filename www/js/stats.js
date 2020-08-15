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
        this.isEditing = false;

        this.eventButtonsBoxSelector = "#statsPage #landingPage .button_box";


        this.landingPage = (`
            <div id="landingPage" class="div_page">
                <div class="subheading_text">Your Stats By Event</div><br><br>

                <div class="button_box"></div>
            </div>
        `);

        this.eventPage = (`
        <div id="eventPage" class="div_page">
            <div id="event_header" class="generic_header">
                <div id="back_button_event" class="back_button">&#9668;</div>
                <h1 id="event_name"></h1>
                <div></div>
            </div>

            <table id="event_results">
                <tr class="column_names">
                    <th id="name_sort">Name<span>&#9660;</span>></th>
                    <th id="best_sort">Best</th>
                    <th id="avg_sort">Avg</th>
                    <th id="worst_sort">Worst</th>
                </tr>
            </table>
        </div>
        `);


        // TODO: deprecated
        this.addEventPage = (`
            <div id="addEventPage" class="div_page">
                <div id="add_event_header" class="generic_header">
                    <div id="back_button_add_event" class="back_button">&#9668;</div>
                    <h1>Add Event</h1>
                    <div></div>
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
            this.hasStarted = true;
        } else {
            this.startLandingPage(() => {
                Animations.fadeInChildren(this.eventButtonsBoxSelector, Constant.fadeDuration, Constant.fadeIncrement);
            });
        }
    }

    /**
     * @description this function will launch the landing page for the statsPage
     * @param {function} callback the callback to be called when all of the buttons are done generating
     */
    startLandingPage(callback = () => {}) {

        this.pageTransition.slideRight("landingPage");

        $("#statsPage #landingPage .button_box").empty();
        $("#statsPage #landingPage #add_event_box").empty();

        // get any unique entries in record identity
        let query = (`
            SELECT DISTINCT record_definition.record_identity, record_definition.rowid FROM record
            INNER JOIN record_definition
            ON record_definition.rowid = record.id_record_definition
        `);
        
        dbConnection.selectValues(query).then((events) => {
            if(events != false) {
                $("#statsPage #landingPage .subheading_text").html(`Your Stats By Event`);
                ButtonGenerator.generateButtonsFromDatabase("#statsPage #landingPage .button_box", events, (event) => {
                    this.startEventPage(event);
                }, [], Constant.eventColorConditionalAttributes);
                
                Animations.hideChildElements(this.eventButtonsBoxSelector);
                callback();
            } else {
                $("#statsPage #landingPage .subheading_text").html(`
                It looks like you don't have any times saved yet. 
                Go to the Stopwatch page and save a time to an event
                to have it show up here.
                `);
            }
        });
    }

    /**
     * @description This function will start the event page which will show stats
     * for an individual event
     * @param {row} event the event to display results for
     */
    startEventPage(event) {

        this.pageTransition.slideLeft("eventPage");
        // While transitioning, scroll to the top
        $("#statsPage").animate({
            scrollTop: 0
        }, 1000);
        
        this.clearResultsTable();

        $("#statsPage #eventPage #event_name").html(event.record_identity);

        $("#statsPage #eventPage #back_button_event").unbind("click");

        $("#statsPage #eventPage #back_button_event").bind("click", (e) => {
            this.pageTransition.slideRight("landingPage");
            // Reset the scroll
            $("#stopwatchPage").animate({
                scrollTop: 0
            }, 1000);
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

        // get all values from record that have an athlete value for a particular event
        let query = `
            SELECT * FROM record
            INNER JOIN athlete ON record.id_athlete = athlete.rowid
            WHERE record.id_record_definition = ?
        `;

        dbConnection.selectValues(query, [event.rowid]).then((results) => {

            if(results == false) {
                return;
            }

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
                    info_box = $("<tr>", {
                        class: "male_color"
                    });
                } else if (athletes[i].gender == 'f') {
                    info_box = $("<tr>", {
                        class: "female_color"
                    });
                } else {
                    info_box = $("<tr>");
                }

                info_box.append($("<td>", {
                    text: name
                }));
                info_box.append($("<td>", {
                    text: min
                }));
                info_box.append($("<td>", {
                    text: average
                }));
                info_box.append($("<td>", {
                    text: max
                }));

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
                <th id="name_sort">Name</th>
                <th id="best_sort">Best</th>
                <th id="avg_sort">Avg</th>
                <th id="worst_sort">Worst</th>
            </tr>
        `); // <span>&#9660;</span>
    }



    stop() {
        Animations.hideChildElements(this.eventButtonsBoxSelector);
    }
}
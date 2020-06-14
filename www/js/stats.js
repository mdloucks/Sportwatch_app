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
            <div id="landingPage" class="div_page">
                <br><br>
                <h1>Stats</h1><br><br>
                <div class="button_box"></div>
            </div>
        `);

        this.eventPage = (`
        <div id="eventPage" class="div_page">
            <div id="event_header" class="generic_header">
                <div id="back_button_event" class="back_button">&#8592;</div>
                <h1 id="event_name"></h1>
            </div><br><br>

            <div class="table_container sportwatch_selector">
                <div id="sort_alphabet">Az</div>
                <div id="sort_times">0-9</div>
                <div id="sort_gender">M/F</div>
            </div><br><br>

            <div class="table_container column_names">
                <div>Name</div>
                <div>Best</div>
                <div>Average</div>
                <div>Worst</div>
            </div>

            <div class="button_box">
                
            </div>
        </div>
        `);

        this.addEventPage = (`
            <div id="addEventPage" class="div_page">
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
        });
    }

    startAddEventPage(event) {
        // TODO: implement

        $("#statsPage #eventPage #event_name").html(event.event_name);


    }

    startEventPage(event) {
        this.pageTransition.slideLeft("eventPage");
        $("#statsPage #eventPage #event_name").html(event.event_name);

        $("#statsPage #eventPage #back_button_event").bind("touchend", (e) => {
            this.pageTransition.slideRight("landingPage");
        });

        $("#statsPage #eventPage #sort_alphabet").bind("touchend", (e) => {
            $("#statsPage #eventPage #sort_alphabet").addClass("selected");
            $("#statsPage #eventPage #sort_times").removeClass("selected");
            $("#statsPage #eventPage #sort_gender").removeClass("selected");
        });

        $("#statsPage #eventPage #sort_times").bind("touchend", (e) => {
            $("#statsPage #eventPage #sort_times").addClass("selected");
            $("#statsPage #eventPage #sort_alphabet").removeClass("selected");
            $("#statsPage #eventPage #sort_gender").removeClass("selected");

        });

        $("#statsPage #eventPage #sort_gender").bind("touchend", (e) => {
            $("#statsPage #eventPage #sort_gender").addClass("selected");
            $("#statsPage #eventPage #sort_alphabet").removeClass("selected");
            $("#statsPage #eventPage #sort_times").removeClass("selected");

        });

        this.dbConnection.selectValues("SELECT * from event_result WHERE id_event = ?", [event.rowid]).then((results) => {
            console.log(JSON.stringify(results));
        }).catch(() => {

        });
    }

    addEvent(event) {

    }



    stop() {
    }
}
/**
 * @classdesc This is the Stopwatch page
 * @class
 */
class Stopwatch extends Page {

    constructor(id, pageSetObject) {
        super(id, "Stopwatch");
        this.clockLoop = null;

        this.pageController = pageSetObject;
        this.pageTransition = new PageTransition("#stopwatchPage");
        this.lap_times = [];

        this.clock = {
            radius: 100,
            pointSize: 7,
            centerX: 0,
            centerY: 0,
            font: "30px Arial",
            textHeight: 0,
            fillStyle: "rgb(245, 77, 77)",
            lineWidth: 5,

            angle: 90,
            initialAngle: 90,
            isRunning: false,
            hasStarted: false,
            hasInitialized: false,
            start: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            epoch: 0,
        };

        this.c = null;
        this.ctx = null;

        this.landingPage = (`
            <div id="landingPage" class="div_page">
                <canvas id="stopwatch_canvas" class="stopwatch_canvas" width="400px" height="300px"></canvas>
                <div class="stopwatch_lap_times"></div>
                <div class="stopwatch_button_container">
                    <a id="stopwatch_reset" class="stopwatch_button">Reset</a>
                    <button id="stopwatch_start_stop" class="play_button noSelect"></button>
                    <a id="stopwatch_lap" class="stopwatch_button">Lap</a>
                </div>
            </div>
        `);



        this.selectAthletePage = (`
            <div id="selectAthletePage" class="div_page">
                <div class="generic_header">
                    <div class="back_button">&#9668;</div>
                    <h1>Choose An Athlete</h1>
                    <div></div>
                </div>
                <div class="button_box">

                </div><br><br>
            </div>
        `);

        this.selectEventPage = (`
        <div id="selectEventPage" class="div_page">

            <div class="generic_header">
                <div class="back_button">&#9668;</div>
                <h1>Chose An Event</h1>
                <div></div>
            </div>

            <div id="saved_events_box" class="button_box">

            </div>

            <div class="subheading_text">Save to new event</div>

            <div id="new_events_box" class="button_box">
            
            </div>
        </div>
        `);
    }

    /**
     * Returns the Html for this page (bare minimum to allow for swipe previews)
     */
    getHtml() {
        return (`
            <div id="stopwatchPage" class="div_page">
                ${this.landingPage}
                ${this.selectAthletePage}
                ${this.selectEventPage}
            </div>
        `);
    }

    /**
     * Load the necessary html for the stopwatch and return a function that must be called
     * in order to properly stop this page. 
     * 
     * @returns {function} a function that will stop the this.clock interval
     */
    start() {

        if (this.pageTransition.getPageCount() == 0) {
            this.pageTransition.addPage("landingPage", this.landingPage, true);
            this.pageTransition.addPage("selectAthletePage", this.selectAthletePage);
            this.pageTransition.addPage("selectEventPage", this.selectEventPage);
        }

        this.setupStopwatch();
    }

    stop() {
        // TODO: check to see if there is any performance issues with leaving the setInterval running
        // there shouldn't be which is why I'm just letting er rip.

        this.stopStopwatch();
    }

    /**
     * @description retreive the context for the canvas and setup necessary event listeners
     */
    setupStopwatch() {

        if (this.c == null || this.ctx == null) {
            this.c = $("#stopwatch_canvas")[0];
            this.ctx = this.c.getContext("2d");
        }

        // Switched the variable because if the user changes pages
        // before starting the stopwatch, the events are bound twice
        // I recorded a video of the issue if you wanted to see it, let me know
        if (!this.clock.hasInitialized) {

            this.clock.angleInterval = 360 / this.clock.interval;
            this.ctx.lineWidth = this.clock.lineWidth;
            this.ctx.font = this.clock.font;
            this.ctx.fillStyle = this.clock.fillStyle;

            this.clock.centerX = this.c.width / 2;
            this.clock.centerY = this.c.height / 2;

            this.clock.textHeight = this.measureTextHeight(0, 0, 50, 100);

            this.ctx.clearRect(0, 0, this.c.width, this.c.height);
            this.drawCircle();
            this.drawPoint(this.clock.initialAngle, 1);

            this.ctx.fillText("0.00", this.clock.centerX - (this.ctx.measureText("0.00").width / 2),
                this.clock.centerY + (this.clock.textHeight / 2));

            $("#stopwatch_start_stop").click((e) => {
                e.preventDefault();
                this.toggleStopwatch(this.clock);
            });

            $("#stopwatch_canvas").click((e) => {
                e.preventDefault();
                this.toggleStopwatch(this.clock);
            });

            $("#stopwatch_reset").click((e) => {
                e.preventDefault();
                this.resetStopwatch(this.clock, this.ctx);
            });

            $("#stopwatchPage .back_button").click((e) => {
                this.pageTransition.slideRight("landingPage");
            });

            $("#stopwatch_lap").click((e) => {
                e.preventDefault();

                if ($("#stopwatch_lap").html() == "Lap") {
                    let n = $(".stopwatch_lap_times")[0].childElementCount;
                    $(".stopwatch_lap_times").prepend(`
                                <div>#${n + 1}: ${this.generateClockText(this.clock)}</div>
                            `);
                    this.lap_times.push(this.clock.seconds);
                } else if ($("#stopwatch_lap").html() == "Save") {
                    this.startSelectAthletePage();
                } else {
                    throw new Error(`innerHTML: ${$("#stopwatch_lap").html()} is invalid for #stopwatch_lap`);
                }
            });

            let dt;

            let clockLoop = setInterval(() => {
                if (this.clock.isRunning) {
                    dt = Date.now() - (this.clock.start == 0 ? Date.now() : this.clock.start);
                    this.clock.start = Date.now();

                    this.ctx.clearRect(0, 0, 500, 500);
                    this.drawCircle();
                    this.drawPoint(this.clock.angle, 1);
                    this.clock.angle = -(((this.clock.seconds * 1000) % 1000) / 1000 * 360) + 90;

                    this.clock.seconds += Math.abs(dt / 1000);
                    this.clock.minutes = Math.floor(this.clock.seconds / 60);
                    this.clock.hours = Math.floor(this.clock.seconds / 3600);

                    // console.log(`hours ${this.clock.hours} minutes ${this.clock.minutes} seconds ${this.clock.seconds}`);

                    let clockText = this.generateClockText(this.clock);

                    let textX = this.clock.centerX - (this.ctx.measureText(clockText).width / 2);
                    let textY = this.clock.centerY + (this.clock.textHeight / 2);
                    this.ctx.fillText(clockText, textX, textY);
                }
            }, 10);
        }
        this.clock.hasInitialized = true; // Prevent re-binding of touchend
    }

    startStopwatch() {

        this.clock.isRunning = true;
        // Check to see if already the play button (i.e. from reset)
        if (!$("#stopwatch_start_stop").hasClass("paused")) {
            // FYI, paused is the pause button, not indicative of stopwatch state
            $("#stopwatch_start_stop").addClass("paused");
        }

        $("#stopwatch_lap").html("Lap");
        this.clock.start = 0;
    }

    stopStopwatch() {
        this.clock.isRunning = false;
        $("#stopwatch_lap").html("Save");
        $("#stopwatch_start_stop").removeClass("paused");
    }

    toggleStopwatch() {
        // on start
        if (!this.clock.isRunning) {
            this.startStopwatch();
            // on stop
        } else {
            this.stopStopwatch();
        }

        // start first time
        if (!this.clock.hasStarted) {
            this.startStopwatch();
            $("#stopwatch_start_stop").addClass("paused");
            this.clock.hasStarted = true;
            $(".stopwatch_button_container a").css("animation", "fadein 2s");
            $(".stopwatch_button_container a").css("visibility", "visible");
        }
    }

    /**
     * 
     * @param {Object} this.clock the this.clock object
     * @param {CanvasRenderingContext2D} this.ctx the canvas to reset
     */
    resetStopwatch() {
        this.clock.isRunning = false;

        this.ctx.clearRect(0, 0, 400, 400);
        this.drawCircle();
        this.drawPoint(this.clock.initialAngle, 1);

        let resetText = "0.00";

        this.ctx.fillText(resetText, this.clock.centerX - (this.ctx.measureText(resetText).width / 2),
            this.clock.centerY + (this.clock.textHeight / 2));

        this.stopStopwatch();
        $(".stopwatch_lap_times").empty();
        $("#stopwatch_lap").html("Lap");

        this.clock.angle = this.clock.initialAngle;
        this.clock.epoch = 0;
        this.clock.hours = 0;
        this.clock.minutes = 0;
        this.clock.seconds = 0;

        this.lap_times = [];
    }

    drawCircle() {
        this.ctx.beginPath();
        this.ctx.arc(this.clock.centerX, this.clock.centerY, this.clock.radius, 0, 2 * Math.PI);
        this.ctx.stroke();
    }

    drawPoint(angle, distance) {
        let x = this.clock.centerX + this.clock.radius * Math.cos(-angle * Math.PI / 180) * distance;
        let y = this.clock.centerY + this.clock.radius * Math.sin(-angle * Math.PI / 180) * distance;

        this.ctx.beginPath();
        this.ctx.arc(x, y, this.clock.pointSize, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    /**
     * @description Generate the text to display on the stopwatch given the this.clock object.
     * 
     * @param {Object} this.clock the this.clock object
     * 
     * @returns the clockText string
     */
    generateClockText() {

        let clockText;

        // hours:minutes:seconds
        if (this.clock.hours >= 1) {
            clockText = (this.clock.hours + ":" + (this.clock.minutes % 60) + ":" + (this.clock.seconds % 60).toFixed(2));
            // minutes:seconds
        } else if (this.clock.minutes >= 1) {
            clockText = (this.clock.minutes + ":" + (this.clock.seconds % 60).toFixed(2));
            // seconds
        } else if (this.clock.minutes < 1) {
            clockText = Math.abs(this.clock.seconds).toFixed(2).toString();
        } else {
            clockText = "0:00";
        }

        return clockText;
    }

    /**
     * This function will start the select athlete page
     * @param {row} event the event selected
     */
    startSelectAthletePage() {
        this.pageTransition.slideLeft("selectAthletePage");

        $("#stopwatchPage #selectAthletePage .button_box").empty();

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

        // generate a list of athletes for the user to select
        dbConnection.selectValues("SELECT *, athlete.rowid FROM athlete", []).then((athletes) => {
            ButtonGenerator.generateButtonsFromDatabase("#stopwatchPage #selectAthletePage .button_box", athletes, (athlete) => {
                this.startSelectEventPage(athlete)
            }, ["gender", "unit", "grade", "is_relay", "timestamp", "id_backend"], conditionalAttributes);
        });
    }

    /**
     * this function will start the select event page
     */
    startSelectEventPage(athlete) {

        this.pageTransition.slideLeft("selectEventPage");

        $("#stopwatchPage #selectEventPage #saved_events_box").empty();
        $("#stopwatchPage #selectEventPage #new_events_box").empty();

        // get any unique entries in record identity with values
        let query = (`
            SELECT DISTINCT record_definition.record_identity, record_definition.rowid from record_definition
            INNER JOIN record
            ON record_definition.rowid = record.id_record_definition
            WHERE record.id_athlete = ?
        `)

        // user selects an existing event
        dbConnection.selectValues(query, [athlete.rowid]).then((events) => {
            ButtonGenerator.generateButtonsFromDatabase("#stopwatchPage #selectEventPage #saved_events_box", events, (event) => {
                this.saveTime(event, athlete);
            }, ["id_athlete", "id_record_definition", "value", "is_split", "id_relay", "id_relay_index", "last_updated", "unit"]);
        });

        // get a list of every event definition and take away the ones with records already
        query = (`
            SELECT DISTINCT record_definition.record_identity, record_definition.rowid from record_definition
            INNER JOIN record
            ON (record_definition.rowid != record.id_record_definition) AND (record.id_athlete != ?)
            EXCEPT 
            SELECT DISTINCT record_definition.record_identity, record_definition.rowid from record_definition
            INNER JOIN record
            ON record_definition.rowid = record.id_record_definition
            WHERE record.id_athlete = ?
        `)

        // User selects a new event that the athlete is not already registered in
        dbConnection.selectValues(query, [athlete.rowid, athlete.rowid]).then((record_definitions) => {
            ButtonGenerator.generateButtonsFromDatabase("#stopwatchPage #selectEventPage #new_events_box", record_definitions, (record_definition) => {
                this.saveTime(record_definition, athlete);
            }, ["id_athlete", "id_record_definition", "value", "is_split", "id_relay", "id_relay_index", "last_updated", "unit"]);
        });
    }

    /**
     * @description this function is called when the user chooses an event to save 
     * 
     * @param {Object} event the event to save
     * @param {Object} athlete the event to for
     */
    saveTime(event, athlete) {
        // TODO: send these values to the server
        this.pageTransition.slideRight("landingPage");


        // save normal time
        dbConnection.insertValues("record", [athlete.rowid, event.rowid, this.clock.seconds, false, null, null, Date.now()]);
        
        let query = (`
            SELECT id_split
            FROM record
            ORDER BY id_split DESC
        `)

        if(this.lap_times.length > 0) {
            // save lap times
            dbConnection.selectValues(query).then((result) => {
                let index_value = 1;

                for (let i = 0; i < result.length; i++) {
                    console.log("HEY " + JSON.stringify(result.item(i)));
                }


                if(result.item(0).id_split != null) {
                    index_value = (result.item(0).id_split + 1);
                }

                console.log("USING INDEX " + index_value);

                for (let i = 0; i < this.lap_times.length; i++) {
                    dbConnection.insertValues("record", [athlete.rowid, event.rowid, this.lap_times[i], false, index_value, i + 1, Date.now()]);
                }

                this.resetStopwatch();
            });
        } else {
            this.resetStopwatch();
        }

        

        // TODO: create confirmation popup
        // Popup.createFadeoutPopup("Times Saved!");
    }


    /**
     * @description The sorry saps who made CanvasRenderingContext2D allow you to measure the 
     * width but not the height of text. What the frick. That's basically what this function does.
     * 
     * @param {Number} left where to start x
     * @param {Number} top where to start y
     * @param {Number} width how far to go left
     * @param {Number} height how far to go right
     * 
     * @returns the height of any text.
     */
    measureTextHeight(left, top, width, height) {

        // Draw the text in the specified area
        this.ctx.save();
        this.ctx.translate(left, top + Math.round(height * 0.8));
        this.ctx.fillText('gM', 0, 0); // This seems like tall text...  Doesn't it?
        this.ctx.restore();

        // Get the pixel data from the canvas
        var data = this.ctx.getImageData(left, top, width, height).data,
            first = false,
            last = false,
            r = height,
            c = 0;

        // Find the last line with a non-white pixel
        while (!last && r) {
            r--;
            for (c = 0; c < width; c++) {
                if (data[r * width * 4 + c * 4 + 3]) {
                    last = r;
                    break;
                }
            }
        }

        // Find the first line with a non-white pixel
        while (r) {
            r--;
            for (c = 0; c < width; c++) {
                if (data[r * width * 4 + c * 4 + 3]) {
                    first = r;
                    break;
                }
            }

            // If we've got it then return the height
            if (first != r) return last - first;
        }

        // We screwed something up...  What do you expect from free code?
        return 0;
    }
}
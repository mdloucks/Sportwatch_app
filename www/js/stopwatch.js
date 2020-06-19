/**
 * @classdesc This is the Stopwatch page
 * @class
 */
class Stopwatch extends Page {

    constructor(id) {
        super(id, "Stopwatch");
        this.clockLoop = null;

        this.dbConnection = new DatabaseConnection();
        this.pageTransition = new PageTransition("#stopwatchPage");

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
                    <button id="stopwatch_start_stop" class="play_button"></button>
                    <a id="stopwatch_lap" class="stopwatch_button">Lap</a>
                </div>
            </div>
        `);

        this.selectEventPage = (`
            <div id="selectEventPage" class="div_page">

                <div class="generic_header">
                    <div class="back_button">&#8592;</div>
                    <h1>Chose An Event</h1>
                </div>
                <div class="button_box">

                </div>
            </div>
        `);

        this.selectAthletePage = (`
            <div id="selectAthletePage" class="div_page">
                <div class="generic_header">
                    <div class="back_button">&#8592;</div>
                    <h1>Choose An Athlete</h1>
                </div>
                <div class="button_box">

                </div><br><br>
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
                ${this.selectEventPage}
                ${this.selectAthletePage}
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
            this.pageTransition.addPage("selectEventPage", this.selectEventPage);
            this.pageTransition.addPage("selectAthletePage", this.selectAthletePage);
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

            this.ctx.clearRect(0, 0, 500, 500);
            this.drawCircle();
            this.drawPoint(this.clock.initialAngle, 1);

            this.ctx.fillText("0.00", this.clock.centerX - (this.ctx.measureText("0.00").width / 2),
                this.clock.centerY + (this.clock.textHeight / 2));

            $("#stopwatch_start_stop").bind("touchend", (e) => {
                e.preventDefault();
                this.toggleStopwatch(this.clock);
            });

            $("#stopwatch_canvas").bind("touchend", (e) => {
                e.preventDefault();
                this.toggleStopwatch(this.clock);
            });

            $("#stopwatch_reset").bind("touchend", (e) => {
                e.preventDefault();
                this.resetStopwatch(this.clock, this.ctx);
            });

            $("#stopwatchPage .back_button").bind("touchend", (e) => {
                this.pageTransition.slideRight("landingPage");
            });

            $("#stopwatch_lap").bind("touchend", (e) => {
                e.preventDefault();

                if ($("#stopwatch_lap").html() == "Lap") {
                    let n = $(".stopwatch_lap_times")[0].childElementCount;
                    $(".stopwatch_lap_times").prepend(`
                                <div>#${n + 1}: ${this.generateClockText(this.clock)}</div>
                            `);
                    console.log("lap!");
                } else if ($("#stopwatch_lap").html() == "Save") {
                    this.startSelectEventPage();
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
        $("#stopwatch_start_stop").toggleClass("paused");
        $("#stopwatch_lap").html("Lap");
        this.clock.start = 0;
    }

    stopStopwatch() {
        this.clock.isRunning = false;
        $("#stopwatch_lap").html("Save");
        $("#stopwatch_start_stop").toggleClass("paused");
    }

    toggleStopwatch() {
        // on start
        if (!this.clock.isRunning) {
            console.log("Starting stopwatch");
            this.startStopwatch();
            // on stop
        } else {
            console.log("Stopping stopwatch");
            this.stopStopwatch();
        }

        if (!this.clock.hasStarted) {
            console.log("Starting stopwatch first time");
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

        $(".stopwatch_lap_times").empty();
        $("#stopwatch_lap").html("Lap");

        this.clock.angle = this.clock.initialAngle;
        this.clock.epoch = 0;
        this.clock.hours = 0;
        this.clock.minutes = 0;
        this.clock.seconds = 0;
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
     * this function will start the select event page
     */
    startSelectEventPage() {

        this.pageTransition.slideLeft("selectEventPage");
        $("#stopwatchPage #selectEventPage .button_box").empty();

        this.dbConnection.selectValues("SELECT *, rowid FROM event", []).then((events) => {
            ButtonGenerator.generateButtonsFromDatabase("#stopwatchPage #selectEventPage .button_box", events, (event) => {
                this.startSelectAthletePage(event);
            }, ["gender", "unit", "is_relay", "timestamp"]);
        });
    }

    /**
     * This function will start the select athlete page
     * @param {row} event the event selected
     */
    startSelectAthletePage(event) {
        this.pageTransition.slideLeft("selectAthletePage");

        $("#stopwatchPage #selectAthletePage .button_box").empty();

        let query = (`
            SELECT *, athlete.rowid FROM athlete
            INNER JOIN athlete_event_register
            ON athlete.id_athlete_event_register = athlete_event_register.rowid
            WHERE athlete_event_register.event_id_1 = ? 
            OR athlete_event_register.event_id_2 = ?
            OR athlete_event_register.event_id_3 = ?
            OR athlete_event_register.event_id_4 = ?
            OR athlete_event_register.event_id_5 = ?
        `);

        this.dbConnection.selectValues(query, [event.rowid, event.rowid, event.rowid, event.rowid, event.rowid]).then((athletes) => {

            ButtonGenerator.generateButtonsFromDatabase("#stopwatchPage #selectAthletePage .button_box", athletes, (athlete) => {

                // TODO: send these values to the server
                this.pageTransition.slideRight("landingPage");
                this.dbConnection.insertValues("event_result", [event.rowid, athlete.rowid, this.clock.seconds]);
                console.log("VALUES INSERTED " + event.rowid + " " + athlete.rowid + " " + this.clock.seconds);

                // TODO: create confirmation popup
                // Popup.createFadeoutPopup("Times Saved!");

            }, ["event_id_1", "event_id_2", "event_id_3", "event_id_4", "event_id_5", "id_athlete_event_register"]);
        });
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

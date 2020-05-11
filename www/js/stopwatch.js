/**
 * @classdesc This is the Stopwatch page
 * @class
 */
class Stopwatch extends Page {

    constructor(id) {
        super(id, "Stopwatch");
        this.clockLoop = null;

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
            start: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            epoch: 0,
        };

        this.c = null;
        this.ctx = null;
    }

    /**
     * Returns the Html for this page (bare minimum to allow for swipe previews)
     */
    getHtml() {
        return (`
            <div id="stopwatchPage" class="div_page">
                <canvas id="stopwatch_canvas" class="stopwatch_canvas" width="400px" height="300px"></canvas>
                <div class="stopwatch_lap_times"></div>
                <div class="stopwatch_button_container">
                    <a id="stopwatch_reset" class="stopwatch_button">Reset</a>
                    <button id="stopwatch_start_stop" class="stopwatch_button">&#9654;</button>
                    <a id="stopwatch_lap" class="stopwatch_button">Lap</a>
                </div>
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

        if (!this.clock.hasStarted) {

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

            $("#stopwatch_lap").bind("touchend", (e) => {
                e.preventDefault();

                if ($("#stopwatch_lap").html() == "Lap") {
                    let n = $(".stopwatch_lap_times")[0].childElementCount;
                    $(".stopwatch_lap_times").prepend(`
                                <div>#${n + 1}: ${this.generateClockText(this.clock)}</div>
                            `);
                    console.log("lap!");
                } else if ($("#stopwatch_lap").html() == "Save") {
                    // TODO: take the user to save their data
                    console.log("SAVE!");
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
    }

    startStopwatch() {
        this.clock.isRunning = true;
        $("#stopwatch_start_stop").html("&#9632");
        $("#stopwatch_lap").html("Lap");
        this.clock.start = 0;
    }

    stopStopwatch() {
        this.clock.isRunning = false;
        $("#stopwatch_lap").html("Save");
        $("#stopwatch_start_stop").html("&#9654");
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
        $("#stopwatch_start_stop").html("&#9654");

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

/**
 * @classdesc This is the Stopwatch page
 * @class
 */
class Stopwatch extends Page {

    constructor(id) {
        super(id, "Stopwatch");
        this.clockLoop = null;
    }

    /**
     * Load the necessary html for the stopwatch and return a function that must be called
     * in order to properly stop this page. 
     * 
     * @returns {function} a function that will stop the clock interval
     */
    start() {

        // TODO allow the user to save the results for later
        $("#app").html(`
            <canvas id="stopwatch_canvas" class="stopwatch_canvas" width="400px" height="300px"></canvas>
            <div class="stopwatch_button_container">
                <a id="stopwatch_reset" class="stopwatch_button">Reset</a>
                <button id="stopwatch_start_stop" class="stopwatch_button">&#9654;</button>
                <a id="stopwatch_lap" class="stopwatch_button">Lap</a>
            </div>
            <div class="stopwatch_lap_times"></div>
        `);

        let style = document.getElementById("style_stopwatch");
        style.disabled = false;

        this.clock_loop = this.startStopwatch();
    }

    stop() {
        let style = document.getElementById("style_stopwatch");
        style.disabled = true;

        if (this.clockLoop === undefined || this.clockLoop === null) {
            // TODO: fix this
            // console.log("PLEASE LOOK AT THIS, THIS SHOULDN'T HAPPEN!!!");
        } else {
            clearInterval(this.clockLoop);
        }
    }

    startStopwatch() {

        let c = $("#stopwatch_canvas")[0];
        let ctx = c.getContext("2d");

        let clock = {
            radius: 100,
            pointSize: 7,
            centerX: c.width / 2,
            centerY: c.height / 2,
            font: "30px Arial",
            textHeight: 0,
            fillStyle: "crimson",
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

        clock.angleInterval = 360 / clock.interval;
        ctx.lineWidth = clock.lineWidth;
        ctx.font = clock.font;
        ctx.fillStyle = clock.fillStyle;

        clock.textHeight = this.measureTextHeight(ctx, 0, 0, 50, 100);

        ctx.clearRect(0, 0, 500, 500);
        this.drawCircle(clock, ctx);
        this.drawPoint(clock, ctx, clock.initialAngle, 1);

        ctx.fillText("0.00", clock.centerX - (ctx.measureText("0.00").width / 2),
            clock.centerY + (clock.textHeight / 2));


        let dt;

        let clock_loop = setInterval(() => {
            if (clock.isRunning) {
                dt = Date.now() - (clock.start == 0 ? Date.now() : clock.start);
                clock.start = Date.now();

                ctx.clearRect(0, 0, 500, 500);
                this.drawCircle(clock, ctx);
                this.drawPoint(clock, ctx, clock.angle, 1);
                clock.angle = -(((clock.seconds * 1000) % 1000) / 1000 * 360) + 90;

                clock.seconds += Math.abs(dt / 1000);
                clock.minutes = Math.floor(clock.seconds / 60);
                clock.hours = Math.floor(clock.seconds / 3600);

                // console.log(`hours ${clock.hours} minutes ${clock.minutes} seconds ${clock.seconds}`);

                let clockText = this.generateClockText(clock);

                let textX = clock.centerX - (ctx.measureText(clockText).width / 2);
                let textY = clock.centerY + (clock.textHeight / 2);
                ctx.fillText(clockText, textX, textY);
            }
        }, 10);

        $("#stopwatch_start_stop").click((e) => {
            e.preventDefault();
            this.startStopStopwatch(clock);
        });

        $("#stopwatch_canvas").click((e) => {
            e.preventDefault();
            this.startStopStopwatch(clock);
        });

        $("#stopwatch_reset").click((e) => {
            e.preventDefault();
            this.resetStopwatch(clock, ctx);
        });

        $("#stopwatch_lap").click((e) => {
            e.preventDefault();

            if ($("#stopwatch_lap").html() == "Lap") {
                let n = $(".stopwatch_lap_times")[0].childElementCount;
                $(".stopwatch_lap_times").prepend(`
                    <div>#${n + 1}: ${this.generateClockText(clock)}</div>
                `);
                console.log("lap!");
            } else if ($("#stopwatch_lap").html() == "Save") {
                // TODO: take the user to save their data
                console.log("SAVE!");
            } else {
                throw new Error(`innerHTML: ${$("#stopwatch_lap").html()} is invalid for #stopwatch_lap`);
            }
        });

        return clock_loop;
    }

    startStopStopwatch(clock) {
        // on start
        if (!clock.isRunning) {
            // TODO: fix the super annoying size changing on the start/stop button
            $("#stopwatch_start_stop").html("&nbsp&#9632&nbsp");
            $("#stopwatch_lap").html("Lap");
            clock.start = 0;
            // on stop
        } else {
            $("#stopwatch_lap").html("Save");
            $("#stopwatch_start_stop").html("&#9654");
        }

        if (!clock.hasStarted) {
            clock.hasStarted = true;
            $(".stopwatch_button_container a").css("animation", "fadein 2s");
            $(".stopwatch_button_container a").css("visibility", "visible");
        }

        clock.isRunning = !clock.isRunning;
    }

    /**
     * 
     * @param {Object} clock the clock object
     * @param {CanvasRenderingContext2D} ctx the canvas to reset
     */
    resetStopwatch(clock, ctx) {
        clock.isRunning = false;

        ctx.clearRect(0, 0, 400, 400);
        this.drawCircle(clock, ctx);
        this.drawPoint(clock, ctx, clock.initialAngle, 1, "A");

        let resetText = "0.00";

        ctx.fillText(resetText, clock.centerX - (ctx.measureText(resetText).width / 2),
            clock.centerY + (clock.textHeight / 2));

        $(".stopwatch_lap_times").empty();
        $("#stopwatch_lap").html("Lap");
        $("#stopwatch_start_stop").html("&#9654");

        clock.angle = clock.initialAngle;
        clock.epoch = 0;
        clock.hours = 0;
        clock.minutes = 0;
        clock.seconds = 0;
    }

    drawCircle(clock, ctx) {
        ctx.beginPath();
        ctx.arc(clock.centerX, clock.centerY, clock.radius, 0, 2 * Math.PI);
        ctx.stroke();
    }

    drawPoint(clock, ctx, angle, distance) {
        let x = clock.centerX + clock.radius * Math.cos(-angle * Math.PI / 180) * distance;
        let y = clock.centerY + clock.radius * Math.sin(-angle * Math.PI / 180) * distance;

        ctx.beginPath();
        ctx.arc(x, y, clock.pointSize, 0, 2 * Math.PI);
        ctx.fill();
    }

    /**
     * @description Generate the text to display on the stopwatch given the clock object.
     * 
     * @param {Object} clock the clock object
     * 
     * @returns the clockText string
     */
    generateClockText(clock) {

        let clockText;

        // hours:minutes:seconds
        if (clock.hours >= 1) {
            clockText = (clock.hours + ":" + (clock.minutes % 60) + ":" + (clock.seconds % 60).toFixed(2));
            // minutes:seconds
        } else if (clock.minutes >= 1) {
            clockText = (clock.minutes + ":" + (clock.seconds % 60).toFixed(2));
            // seconds
        } else if (clock.minutes < 1) {
            clockText = Math.abs(clock.seconds).toFixed(2).toString();
        } else {
            clockText = "0:00";
        }

        return clockText;
    }

    /**
     * @description The sorry saps who made CanvasRenderingContext2D allow you to measure the 
     * width but not the height of text. What the frick. That's basically what this function does.
     * 
     * @param {CanvasRenderingContext2D} ctx rendering context
     * @param {Number} left where to start x
     * @param {Number} top where to start y
     * @param {Number} width how far to go left
     * @param {Number} height how far to go right
     * 
     * @returns the height of any text.
     */
    measureTextHeight(ctx, left, top, width, height) {

        // Draw the text in the specified area
        ctx.save();
        ctx.translate(left, top + Math.round(height * 0.8));
        ctx.fillText('gM', 0, 0); // This seems like tall text...  Doesn't it?
        ctx.restore();

        // Get the pixel data from the canvas
        var data = ctx.getImageData(left, top, width, height).data,
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

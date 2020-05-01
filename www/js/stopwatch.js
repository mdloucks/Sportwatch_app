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
            <button class="stopwatch_start_stop">&#9654;</button>
            <button class="stopwatch_lap">Lap</button>
            <button class="stopwatch_reset">Reset</button>
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
            pointSize: 6,
            centerX: c.width / 2,
            centerY: c.height / 2,
            font: "30px Arial",
            fillStyle: "rgb(245, 77, 77)",
            lineWidth: 5,

            angle: 90,
            interval: 1,
            isRunning: false,
            start: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            epoch: 0,
            deltaAngle: 0
        }

        clock.angleInterval = 360 / clock.interval;
        ctx.lineWidth = clock.lineWidth;

        ctx.clearRect(0, 0, 500, 500);
        this.drawCircle(clock, ctx);
        this.drawPoint(clock, ctx, clock.angle, 1);

        ctx.font = clock.font;
        ctx.fillStyle = clock.fillStyle;

        ctx.fillText("0.00", clock.centerX - (ctx.measureText("0.00").width / 2),
            clock.centerY);

        let dt;
        let clockText;

        let clock_loop = setInterval(() => {
            if (clock.isRunning) {
                dt = Date.now() - (clock.start == 0 ? Date.now() : clock.start);
                clock.start = Date.now();

                ctx.clearRect(0, 0, 500, 500);
                this.drawCircle(clock, ctx);
                this.drawPoint(clock, ctx, clock.angle, 1, "A");
                clock.deltaAngle = clock.angleInterval * (dt / 1000);
                clock.angle -= clock.deltaAngle;

                clock.seconds += (dt / 1000);
                clock.minutes = Math.floor(clock.seconds / 60);
                clock.hours = Math.floor(clock.seconds / 3600);

                console.log(`hours ${clock.hours} minutes ${clock.minutes} seconds ${clock.seconds.toFixed(2)}`);

                if (clock.hours >= 1) {
                    clockText = (clock.hours + ":" + clock.minutes + ":" + clock.seconds.toFixed(1) * 10);
                } else if (clock.minutes >= 1) {
                    clockText = (clock.minutes + ":" + clock.seconds.toFixed(2));
                } else if (clock.minutes < 1) {
                    clockText = (clock.seconds.toFixed(2)).toString();
                } else {
                    clockText = "0:00";
                }

                let textX = clock.centerX - (ctx.measureText(clockText).width / 2);
                let textY = clock.centerY;
                ctx.fillText(clockText, textX, textY);

                if (clock.angle <= -270) {
                    clock.angle = 90;
                }
            }
        }, 10);

        $(".stopwatch_start_stop").click((e) => {
            e.preventDefault();
            this.startStopStopwatch(clock);
        });

        $("#stopwatch_canvas").click((e) => {
            e.preventDefault();
            this.startStopStopwatch(clock);
        });

        $(".stopwatch_reset").click((e) => {
            e.preventDefault();
            this.resetStopwatch(clock, ctx);
        });

        $(".stopwatch_lap").click(function (e) {
            e.preventDefault();
            let n = $(".stopwatch_lap_times")[0].childElementCount;
            $(".stopwatch_lap_times").append(`
            <div>#${n + 1}: ${clock.minutes + "." + clock.seconds}</div>
            `);
            console.log("lap!");
        });

        return clock_loop;
    }

    startStopStopwatch(clock) {
        if (!clock.isRunning) {
            clock.start = 0;
        }

        clock.isRunning = !clock.isRunning;
    }

    resetStopwatch(clock, ctx) {
        clock.isRunning = false;

        ctx.clearRect(0, 0, 400, 400);
        this.drawCircle(clock, ctx);
        this.drawPoint(clock, ctx, 90, 1, "A");
        ctx.fillText("0.00", clock.centerX, clock.centerY);

        $(".stopwatch_lap_times").empty();

        clock.angle = 90;
        clock.deltaAngle = 0;
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
}

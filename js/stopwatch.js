
/**
 * this will be responsable for handling the stopwatch.
 * The stopwatch page will just be the standalone stopwatch
 */
let stopwatch = {

    /**
     * Load the necessary html for the stopwatch and return a function that must be called
     * in order to properly stop this page. 
     * 
     * @returns {function} a function that will stop the clock interval
     */
    initStopwatch: function () {

        // TODO allow the user to save the results for later
        $("#app").html(`
            <canvas id="stopwatch_canvas" class="stopwatch_canvas" width="400px" height="300px"></canvas>
            <button class="stopwatch_start_stop">&#9654;</button>
            <button class="stopwatch_reset">Reset</button>
            <button class="stopwatch_lap">Lap</button>
            <div class="stopwatch_lap_times"></div>
        `);

        CSSManager.resetStyling();
        CSSManager.addStylesheet("stopwatch.css");

        let clock_loop = this.startStopwatch();

        let exit_callback = function () {
            clearInterval(clock_loop);
        }

        return exit_callback;
    },

    startStopwatch: function () {

        let c = $("#stopwatch_canvas")[0];
        let ctx = c.getContext("2d");

        let clock = {
            radius: 100,
            point_size: 6,
            center_x: c.width / 2,
            center_y: c.height / 2,
            font_size: "50px",

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

        this.drawCircle = function () {
            ctx.beginPath();
            ctx.arc(clock.center_x, clock.center_y, clock.radius, 0, 2 * Math.PI);
            ctx.stroke();
        }

        this.drawPoint = function (angle, distance) {
            let x = clock.center_x + clock.radius * Math.cos(-angle * Math.PI / 180) * distance;
            let y = clock.center_y + clock.radius * Math.sin(-angle * Math.PI / 180) * distance;

            ctx.beginPath();
            ctx.arc(x, y, clock.point_size, 0, 2 * Math.PI);
            ctx.fill();
        }

        ctx.clearRect(0, 0, 500, 500);
        this.drawCircle();
        this.drawPoint(clock.angle, 1);

        ctx.font = clock.font_size;
        ctx.fillText("0.00", clock.center_x, clock.center_y);

        let start;
        let dt;
        let finish;

        let clock_loop = setInterval(() => {
            finish = Date.now();
            dt = finish - (start === undefined ? finish : start);
            start = Date.now();

            if (clock.isRunning) {

                ctx.clearRect(0, 0, 500, 500);
                this.drawCircle();
                this.drawPoint(clock.angle, 1, "A");
                clock.deltaAngle = clock.angleInterval * (dt / 1000);
                clock.angle -= clock.deltaAngle;

                // get dt between start of clock and now
                clock.epoch = (Date.now() - clock.start) / 1000;
                clock.hours = Math.floor(clock.epoch / 3600);
                clock.minutes = Math.floor(clock.epoch / 60);
                clock.seconds = clock.epoch - (clock.minutes * 60).toFixed(2);

                ctx.font = clock.font_size;
                ctx.fillText(clock.hours + ":" + clock.minutes + ":" + clock.seconds, clock.center_x, clock.center_y);


                if (clock.angle <= -270) {
                    clock.angle = 90;
                }
            }
        }, 0);

        $(".stopwatch_start_stop").click(function (e) {
            e.preventDefault();

            if (clock.isRunning && clock.epoch > 0) {
                clock.isRunning = false;
                $(".stopwatch_start_stop").html(`&#9654;`);
                // stopwatch is paused
            } else if (!clock.isRunning && clock.epoch === 0) {
                $(".stopwatch_start_stop").html(`&#9660;`);
                clock.isRunning = true;
                clock.start = Date.now();
            } else if (!clock.isRunning) {
                clock.isRunning = true;
                $(".stopwatch_start_stop").html(`&#9660;`);
            }
        });

        $(".stopwatch_reset").click((e) => {
            e.preventDefault();
            clock.isRunning = false;

            ctx.clearRect(0, 0, 400, 400);
            this.drawCircle();
            this.drawPoint(90, 1, "A");
            ctx.fillText("0.00", clock.center_x, clock.center_y);

            $(".stopwatch_lap_times").empty();

            clock.angle = 90;
            clock.deltaAngle = 0;
            clock.epoch = 0;
            clock.hours = 0;
            clock.minutes = 0;
            clock.seconds = 0;
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
    },
}

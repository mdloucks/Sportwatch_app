
/**
 * this will be the entry point for starting a meet and it's respective stopwatch 
 * It will look for the next upcoming meet and ask if the user is ready to start
 * it will change the text of startmeet on the navigation menu to the name of the meet after it begins
 * 
 * General flow of the page
 * ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 * 1. User is presented with next chronological meet and can either switch it with another or begin the meet.
 * 2. Meet is confirmed and the user can select what meet they are timing for from a list of events.
 * 3. Once an event is selected, a stopwatch shows up and the user can then proceed to begin the event and record their times.
 * 4. Once all of the runners in an event are done, the stopwatch circle condenses and shows the final race time.
 * 5. The times of all of the athletes is shown and the user is then prompted to return to go to the girls/boys or go back to the list.
 * 6. Once all events are exhausted, the best records from each event are presented in a summary. This data is all saved
 * 7. Prompt the user at the end to also go to the stats page we analyze their results. For a price (͡ ͜ʖ ͡ )
 * ..............................................................................................
 */
function BeginMeetPage() {

    // this is the meet that will display after first loading
    let displayMeet;
    // event that the user has selected to time
    let currentEvent;
    let eventList = [];
    let selectedAthlete;
    // list of athletes for the timer to reference
    let athleteList = [];
    // TODO: select meet doesn't work
    this.loadBeginMeetUI = function () {

        $("#app").html(`
            <div class="beginmeet_meet_name_container">
            </div>
    
            <div class="beginmeet_meet_start_container">
                <button class="beginmeet_meet_begin">Begin Meet</button><br>
                <button class="beginmeet_meet_list">Select Meet</button>
            </div>
        `);

        if (displayMeet !== undefined) {
            $(".beginmeet_meet_name_container").html(displayMeet.meet_name);
        }
    };

    this.loadBeginMeetUI();

    /**
     * populate the eventList array with events
     */
    this.fetchEvents = () => {
        return new Promise((resolve, reject) => {
            sw_db.getEvent("*").then((events) => {

                for (let i = 0; i < events.length; i++) {

                    eventList.push({
                        "id_meet": events.item(i).id_meet,
                        "event_name": events.item(i).event_name,
                        "gender": events.item(i).gender,
                        "is_relay_team": events.item(i).is_relay_team,
                        "rowid": events.item(i).rowid
                    });
                }
                resolve();
            }).catch(() => {
                // TODO: catch
                console.log("something bad :(");
            });
        });
    }

    /**
     * load a list of events for the user to select from for them to time
     */
    this.loadSelectEventUI = () => {

        $("#app").empty();
        $("#app").append("Select An Event<br>");
        console.log(eventList.length);
        for (let i = 0; i < eventList.length; i++) {

            $("#app").append(`
                <button id="beginmeet_event_container_${i}" class="beginmeet_event_container">${eventList[i].event_name} - ${eventList[i].gender}</button><br>
            `);

            $(`#beginmeet_event_container_${i}`).click((e) => {
                e.preventDefault();
                console.log("selected event");
                currentEvent = eventList[i];
                console.log(JSON.stringify(currentEvent));

                this.loadStopwatchUI();
            });
            // TODO: highligh event on selection then add a start button
        }

    };

    /**
     * load the timer interface to record times for the event
     */
    this.loadStopwatchUI = () => {
        $("#app").html(`
            <div class="beginmeet_stopwatch_header">
                <canvas id="stopwatch_canvas" class="stopwatch_canvas" width="400px" height="300px"></canvas>
            </div>
            <div class="beginmeet_stopwatch_buttons">
                <button class="beginmeet_start_record">&#9654;</button>
            </div>
            <div class="beginmeet_athlete_container"></div>
            <div class="beginmeet_stopwatch_time_container"></div>
        `);

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
            epoch: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            // dt is the difference between clock start and the current time in seconds
            dt: 0,
            deltaAngle: 0
        };

        clock.angleInterval = 360 / clock.interval;

        this.drawCircle = function () {
            ctx.beginPath();
            ctx.arc(clock.center_x, clock.center_y, clock.radius, 0, 2 * Math.PI);
            ctx.stroke();
        };

        this.drawPoint = function (angle, distance) {
            let x = clock.center_x + clock.radius * Math.cos(-angle * Math.PI / 180) * distance;
            let y = clock.center_y + clock.radius * Math.sin(-angle * Math.PI / 180) * distance;

            ctx.beginPath();
            ctx.arc(x, y, clock.point_size, 0, 2 * Math.PI);
            ctx.fill();

            // ctx.font = clock.font_size;
            // ctx.fillText(label, x + 10, y);
        };

        /**
         * format the time from seconds to m:s
         * 
         * @returns {String} time
         */
        this.formatTime = function (time) {
            let minutes = Math.floor(time / 60);
            let seconds = (time - (minutes * 60)).toFixed(2);
            return `${minutes}:${seconds}`;
        };

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
            intervalDelta = finish - (start === undefined ? finish : start);
            start = Date.now();

            if (clock.isRunning) {

                ctx.clearRect(0, 0, 500, 500);
                this.drawCircle();
                this.drawPoint(clock.angle, 1, "A");
                clock.deltaAngle = clock.angleInterval * (intervalDelta / 1000);
                clock.angle -= clock.deltaAngle;

                // get delta time between start of clock and now in seconds
                clock.dt = (Date.now() - clock.epoch) / 1000;
                clock.hours = Math.floor(clock.dt / 3600);
                clock.minutes = Math.floor(clock.dt / 60);
                clock.seconds = (clock.dt - (clock.minutes * 60)).toFixed(2);

                ctx.font = clock.font_size;
                ctx.fillText(clock.hours + ":" + clock.minutes + ":" + (clock.seconds), clock.center_x, clock.center_y);


                if (clock.angle <= -270) {
                    clock.angle = 90;
                }
            }
        }, 0);

        $(".beginmeet_start_record").click((e) => {
            e.preventDefault();

            if (!clock.isRunning) {
                $(".beginmeet_start_record").html(`Record Time`);

                // TODO: take split for athlete
                // $(".beginmeet_stopwatch_buttons").append(`
                //     <button class="beginmeet_split">Take Split</button>
                // `);

                // $(".beginmeet_split").click(function (e) { 
                //     e.preventDefault();

                // });

                clock.epoch = Date.now();
                clock.isRunning = true;
            } else {
                $(".beginmeet_stopwatch_time_container").append(`
                    <br><div class="beginmeet_stopwatch_time">${selectedAthlete.fname} ${clock.dt}</div>
                `);
                // remove the selected athlete from list
                // console.log("selected athlete: " + JSON.stringify(selectedAthlete));
                $(`#beginmeet_athlete_${selectedAthlete.index}`).remove();
                // console.log("before " + JSON.stringify(athleteList));
                athleteList.splice(athleteList.indexOf(selectedAthlete), 1);
                // console.log("after " + JSON.stringify(athleteList));
                // TODO: record times here with selected athlete

                // if it's last athlete
                if (athleteList.length === 0) {
                    clock.isRunning = false;
                    console.log("DONE !---------------------------------------");
                    $(".beginmeet_stopwatch_buttons").empty();
                    $(".beginmeet_stopwatch_header").html(`
                        <p>Race Finished!</p>
                        <p>${this.formatTime(clock.dt)}</p>
                    `);

                    $("#app").append(`
                        <button id="beginmeet_stopwatch_view_events">View Events</button>
                    `);

                    // the event is finished and recorded, it's time to remove it and go back to list
                    $("#beginmeet_stopwatch_view_events").click((e) => {
                        e.preventDefault();
                        eventList.splice(eventList.indexOf(currentEvent), 1);
                        this.loadSelectEventUI();
                    });

                } else {
                    // the selected athlete will rotate to the next one in the list
                    let lowestIndex = 10000000;
                    for (let i = 0; i < athleteList.length; i++) {
                        if (athleteList[i].index < lowestIndex) {
                            lowestIndex = athleteList[i].index;
                        }
                    }
                    // find the athlete in the array by the index property, not [index]
                    let nextSelectedAthlete = athleteList.filter(obj => {
                        return obj.index === lowestIndex;
                    });
                    // console.log(JSON.stringify(nextSelectedAthlete[0]));
                    selectedAthlete = nextSelectedAthlete[0];
                    // console.log("selected is now " + JSON.stringify(selectedAthlete));
                }
            }
        });

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // Load all of the athletes from the current event and add them to the list
        // 
        // athletes in the array are have an index property used to identify them during in the stopwatch
        // this is used instead of array index so that they may be referred to properly in css
        // the arrays automatically resize themself with new indexes upon removal which is no good
        //..............................................................
        sw_db.getAthletesInEvent(currentEvent.rowid).then((athletes) => {

            if (athletes.length === 0) {
                // TODO: check this
            }
            // TODO: sort athletes by fastest time if avaliable

            for (let i = 0; i < athletes.length; i++) {

                athleteList.push({
                    "fname": athletes.item(i).fname,
                    "lname": athletes.item(i).lname,
                    "gender": athletes.item(i).gender,
                    "grade": athletes.item(i).grade,
                    "index": i
                });

                if (i === 0) {
                    selectedAthlete = athleteList[0];
                    console.log("first" + JSON.stringify(selectedAthlete));
                }

                $(".beginmeet_athlete_container").append(`
                    <button id="beginmeet_athlete_${i}">${athletes.item(i).fname + " " + athletes.item(i).lname}</button>
                `);

                $(`#beginmeet_athlete_${i}`).click(function (e) {
                    e.preventDefault();

                    let nextSelectedAthlete = athleteList.filter(obj => {
                        return obj.index === i;
                    })[0];
                    console.log("selected athlete: " + nextSelectedAthlete.index);
                    selectedAthlete = nextSelectedAthlete;
                });
            }

        }).catch(() => {
            // TODO:: fix this
            console.log("orange man bad :(");
        });

        // TODO:: clear interval after finish
    };

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // will set the current displayMeet variable to a meet in the db
    // if a parameter is passed, it will set it to the given meet
    // otherwise it will set it to the next chronological meet
    //............................................................
    this.getDisplayedMeet = (meet_id) => {
        // retrieve a specific meet
        if (meet_id !== undefined) {
            sw_db.getMeet(meet_id).then((meet) => {
                console.log("displaying: " + meet.meet_name);
                displayMeet = meet;
                $(".beginmeet_meet_name_container").html(meet.meet_name);
            }).catch(function () {
                console.log("The meet you specified currently does not exist");
            });
        } else {
            sw_db.getNextMeet().then((meet) => {

                if (meet === false) {
                    // createConfirmationPopup("You don't have any meets schedualed, to start recording stats for your team, start by creating a meet")
                    // TODO:: go directly to timer
                    // TODO:: add popup
                    console.log("sorry boss nothing found");
                }

                console.log("displaying: " + meet.meet_name);
                displayMeet = meet;
                $(".beginmeet_meet_name_container").html(meet.meet_name);
            }).catch(function () {
                console.log("could not retreive next meet. No future meets found");
            });
        }
    };

    /**
     * begin the meet and show the user a list of events to choose from
     */
    $(".beginmeet_meet_begin").click((e) => {
        e.preventDefault();
        this.fetchEvents().then(() => {
            this.loadSelectEventUI();
        }).catch((err) => {
            console.log("something went wrong");
            //TODO: fix me pls
        });
    });

    $(".beginmeet_meet_list").click((e) => {
        e.preventDefault();
        $("#app").html(`
            <h1 style="font-size:3.5em; font-weight: bold;">Meets</h1>
        `);

        sw_db.getMeet("*").then((meets) => {
            console.log("generating stuff");

            for (let i = 0; i < meets.length; i++) {
                let name = meets.item(i).meet_name;
                let time = meets.item(i).meet_time;
                let address = meets.item(i).meet_address;

                $("#app").append(`
                    <div id="beginmeet_meet_container_${i}" class="beginmeet_meet_container">${name}</div><br>
                `);

                // create callback for each button to reset the ui with specified meet
                $(`#beginmeet_meet_container_${i}`).click((e) => {
                    e.preventDefault();
                    console.log("load meet " + name);
                    displayMeet = meets.item(i);
                    this.loadBeginMeetUI();
                });
            }

        }).catch(function () {
            console.log("something went wrong");
        });
    });

    this.getDisplayedMeet();
}
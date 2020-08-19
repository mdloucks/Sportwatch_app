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

        this.chooseEventSlideAmount = 40;
        this.chooseEventTransitionDuration = 650;
        this.isChooseEventsActive = false;

        this.stopButtonPath = "img/stop_button.png";
        this.playButtonPath = "img/play_button.png";
        this.upArrowPath = "img/up_arrow.png";
        this.downArrowPath = "img/down_arrow.png";

        this.unsavedEventsQuery = (`
            SELECT DISTINCT record_definition.record_identity, record_definition.rowid from record_definition
            WHERE record_definition.unit = ?
            EXCEPT 
            SELECT DISTINCT record_definition.record_identity, record_definition.rowid from record_definition
            INNER JOIN record
            ON record_definition.rowid = record.id_record_definition
            INNER JOIN record_user_link
            ON record_user_link.id_record = record.id_record
            WHERE record_user_link.id_backend = ?
        `);

        this.savedEventsQuery = (`
            SELECT DISTINCT record_definition.record_identity, record_definition.rowid from record_definition
            INNER JOIN record
            ON record_definition.rowid = record.id_record_definition
            INNER JOIN record_user_link
            ON record_user_link.id_record = record.id_record
            WHERE record_user_link.id_backend = ?
        `);

        this.clock = {
            radius: 100,
            pointSize: 7,
            centerX: 0,
            centerY: 0,
            font: "30px Arial",
            textHeight: 0,
            fillStyle: "dd3333",
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

                <div class="table_container">
                    <a id="stopwatch_reset" class="stopwatch_button">Reset</a>
                    <img src="${this.playButtonPath}" alt="" id="stopwatch_start_stop" class="play_button noSelect"></img>
                    <a id="stopwatch_lap" class="stopwatch_button">Lap</a>
                </div>

                <img src="${this.upArrowPath}" alt="" id="choose_event_arrow"></img>
                <div id="choose_event" class="choose_event_contracted">Choose An Event</div>
                <div id="choose_event_selection_div"></div>
            </div>
        `);

        // <div id="stopwatch_start_stop" class="play_button noSelect">${this.playHtmlCode}</div>

        this.selectAthletePage = (`
            <div id="selectAthletePage" class="div_page">
                <div class="generic_header">
                    <div class="back_button">&#9668;</div>
                    <h1>Choose An Athlete</h1>
                    <div></div>
                </div>
                <div class="button_box">

                </div><br><br>
                <div class="subheading_text"></div>
            </div>
        `);

        this.selectEventPage = (`
        <div id="selectEventPage" class="div_page">

            <div class="generic_header">
                <div class="back_button">&#9668;</div>
                <h1>Chose An Event</h1>
                <div></div>
            </div>

            <div id="saved_events_box" class="button_box new_event">

            </div>

            <div class="subheading_text">Save To New Event</div>

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
        this.setupSelectEvent();
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

        this.resetStopwatch();

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

                dt = Date.now() - (this.clock.start == 0 ? Date.now() : this.clock.start);
                this.clock.start = Date.now();

                if (this.clock.isRunning) {

                    this.clock.seconds += Math.abs(dt / 1000);
                    this.clock.minutes = Math.floor(this.clock.seconds / 60);
                    this.clock.hours = Math.floor(this.clock.seconds / 3600);
                }

                let clockText = this.generateClockText(this.clock);
                this.ctx.clearRect(0, 0, this.c.width, this.c.height);
                this.ctx.strokeStyle = this.clock.fillStyle;
                this.drawCircle();
                this.clock.angle = (-((this.clock.seconds % 1) * 360)) + 90;
                this.drawPoint(this.clock.angle, 1);

                let textX = this.clock.centerX - (this.ctx.measureText(clockText).width / 2);
                let textY = this.clock.centerY + (this.clock.textHeight / 2);
                this.ctx.fillText(clockText, textX, textY);
            });
        }
        this.clock.hasInitialized = true; // Prevent re-binding of touchend
    }

    setupSelectEvent() {

        $("#choose_event_arrow").unbind("click");
        $("#choose_event").unbind("click");

        $("#choose_event_arrow").click((e) => { 
            this.slideUpSelectEvent();
        });

        $("#choose_event").click((e) => { 
            this.slideUpSelectEvent();
        });
    }

    slideUpSelectEvent() {
        // slide down
        if(this.isChooseEventsActive) {

            $("#choose_event_arrow").attr("src", this.upArrowPath);
            $("#choose_event").removeClass('choose_event_expanded');
            $("#choose_event").addClass('choose_event_contracted');

            $("#choose_event, #choose_event_arrow").animate({ 
                bottom: `-=${this.chooseEventSlideAmount}%`,
            }, {duration: this.chooseEventTransitionDuration, queue: false});

            $("#stopwatchPage #landingPage #choose_event_selection_div").animate({ 
                height: "0%"
            }, {duration: this.chooseEventTransitionDuration, queue: false, complete: function() {
                // get selected event
            }});
            // slide up
        } else {

            $("#choose_event_arrow").attr("src", this.downArrowPath);
            $("#choose_event").removeClass('choose_event_contracted');
            $("#choose_event").addClass('choose_event_expanded');

            $("#choose_event, #choose_event_arrow").animate({ 
                bottom: `+=${this.chooseEventSlideAmount}%`,
            }, {duration: this.chooseEventTransitionDuration, queue: false});

            $("#stopwatchPage #landingPage #choose_event_selection_div").animate({ 
                height: `${this.chooseEventSlideAmount + 7}%`
            }, {duration: this.chooseEventTransitionDuration, queue: false, complete: () => {
                this.loadAvaliableEventsToSlideup();
            }});
        }

        this.isChooseEventsActive = !this.isChooseEventsActive;
    }

    loadAvaliableEventsToSlideup() {

        let unsavedEventsQuery = (`
            SELECT DISTINCT record_definition.record_identity, record_definition.rowid from record_definition
            WHERE record_definition.unit = ?
            EXCEPT 
            SELECT DISTINCT record_definition.record_identity, record_definition.rowid from record_definition
            INNER JOIN record
            ON record_definition.rowid = record.id_record_definition
            INNER JOIN record_user_link
            ON record_user_link.id_record = record.id_record
        `);

        let savedEventsQuery = (`
            SELECT DISTINCT record_definition.record_identity, record_definition.rowid from record_definition
            INNER JOIN record
            ON record_definition.rowid = record.id_record_definition
            INNER JOIN record_user_link
            ON record_user_link.id_record = record.id_record
        `);

        dbConnection.selectValues(savedEventsQuery).then((record_identities) => {
            console.log(record_identities.length);
        });

        dbConnection.selectValues(unsavedEventsQuery).then((record_identities) => {
            console.log(record_identities.length);
        });
    }

    startStopwatch() {

        this.clock.isRunning = true;

        $("#stopwatchPage #landingPage #stopwatch_start_stop").removeClass("paused");

        $("#stopwatchPage #landingPage #stopwatch_start_stop").attr("src", this.stopButtonPath);
        $("#stopwatchPage #landingPage #stopwatch_lap").html("Lap");
        this.clock.start = 0;
    }

    stopStopwatch() {
        $("#stopwatchPage #landingPage #stopwatch_start_stop").attr("src", this.playButtonPath);

        this.clock.isRunning = false;
        $("#stopwatchPage #landingPage #stopwatch_lap").html("Save");
        $("#stopwatchPage #landingPage #stopwatch_start_stop").addClass("paused");
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
            this.clock.hasStarted = true;
            $("#stopwatchPage #landingPage .table_container a").css("animation", "fadein 2s");
            $("#stopwatchPage #landingPage .table_container a").css("visibility", "visible");
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
        this.ctx.fillStyle = "#000000"; // Set dot to be black
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
            clockText = (this.clock.hours + ":" + this.pad(Math.floor(this.clock.minutes % 60), 2) + "." + this.pad(Math.floor(this.clock.seconds % 60), 2));
            // minutes:seconds
        } else if (this.clock.minutes >= 1) {
            clockText = (this.clock.minutes + ":" + this.pad(Math.floor(this.clock.seconds % 60), 2));
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
        $("#stopwatchPage #selectAthletePage .subheading_text").empty();

        let conditionalAttributes = {
            "gender": {
                "m": {
                    style: "background-color: #6a81e1; color: black; border: 1px solid white;"
                },
                "f": {
                    style: "background-color: #fc99b6; color: black; border: 1px solid white;"
                }
            }
        };

        // generate a list of athletes for the user to select
        dbConnection.selectValues("SELECT *, athlete.rowid FROM athlete", []).then((athletes) => {
            if (athletes != false) {
                $("#stopwatchPage #selectAthletePage .subheading_text").remove();
                ButtonGenerator.generateButtonsFromDatabase("#stopwatchPage #selectAthletePage .button_box", athletes, (athlete) => {
                    this.startSelectEventPage(athlete)
                }, ["gender", "unit", "is_relay", "timestamp", "id_backend"], conditionalAttributes, "lname");
            } else {
                $("#stopwatchPage #selectAthletePage .subheading_text").html(`
                You have no athletes on your team yet. Go to the Team page and invite some athletes to join!
                `)
            }
        });
    }

    /**
     * this function will start the select event page
     */
    startSelectEventPage(athlete) {

        this.pageTransition.slideLeft("selectEventPage");
        // While transitioning, scroll to the top
        $("#stopwatchPage").animate({
            scrollTop: 0
        }, 1000);

        $("#stopwatchPage #selectEventPage #saved_events_box").empty();
        $("#stopwatchPage #selectEventPage #new_events_box").empty();

        // get any unique entries in record identity with values
        // user selects an existing event
        dbConnection.selectValues(this.savedEventsQuery, [athlete.rowid]).then((events) => {

            if ((events.length == 0) || (events == false)) {
                return;
            }

            ButtonGenerator.generateButtonsFromDatabase("#stopwatchPage #selectEventPage #saved_events_box", events, (event) => {
                this.saveTime(event, athlete);
            }, ["id_record_definition", "value",
                "is_split", "id_relay", "id_relay_index", "last_updated", "unit"
            ], Constant.eventColorConditionalAttributes, "class");
        });

        // get a list of every event definition and take away the ones with records already
        // User selects a new event that the athlete is not already registered in
        dbConnection.selectValues(this.unsavedEventsQuery, ["second", athlete.rowid]).then((record_definitions) => {
            if (record_definitions != false) {
                ButtonGenerator.generateButtonsFromDatabase("#stopwatchPage #selectEventPage #new_events_box", record_definitions, (record_definition) => {
                    this.saveTime(record_definition, athlete);
                }, ["id_record_definition", "value", "is_split",
                    "id_relay", "id_relay_index", "last_updated", "unit"
                ], Constant.eventColorConditionalAttributes);
            } else {
                if (DO_LOG) {
                    console.log("record_definition table is empty");
                }
                Popup.createConfirmationPopup("Something went wrong, try saving your time again.", ["Ok"], () => {});
            }
        });
    }

    /**
     * @description this function is called when the user chooses an event to save 
     * 
     * @param {Object} event the event to save
     * @param {Object} athlete the event to for
     */
    saveTime(event, athlete) {

        this.pageTransition.slideRight("landingPage");
        
        // Save the record first so the frontend will have a matching id to the backend
        RecordBackend.saveRecord(this.clock.seconds, event.rowid, athlete.id_backend, (response) => {
            if (DO_LOG) {
                console.log("RECORD SAVED " + JSON.stringify(response));
            }
            if(response.status > 0) { // If success, insert into local database
                let recordData = {
                    "value": this.clock.seconds,
                    "id_record_definition": event.rowid,
                    "is_practice": true,
                    "is_split": false,
                    "id_split": null,
                    "id_split_index": null,
                    "last_updated": Date.now()
                };
                let linkData = {
                    "id_backend": athlete.id_backend
                };
                
                // Loop through each added record ID and save to local database
                // TODO: Change backend to link users with the record for relays... this will get messy
                for(let r = 0; r < response.addedRecordIds.length; r++) {
                    recordData["id_record"] = response.addedRecordIds[r];
                    dbConnection.insertValuesFromObject("record", recordData);
                    
                    linkData.id_record = response.addedRecordIds[r];
                    dbConnection.insertValuesFromObject("record_user_link", linkData);
                }
            }
        });

        let query = (`
            SELECT id_split
            FROM record
            ORDER BY id_split DESC
        `)

        // save lap times if they exist
        // if (this.lap_times.length > 0) {

        //     dbConnection.selectValues(query).then((result) => {
        //         let index_value = 1;

        //         for (let i = 0; i < result.length; i++) {
        //             if (DO_LOG) {
        //                 console.log("HEY " + JSON.stringify(result.item(i)));
        //             }
        //         }

        //         if (result.item(0).id_split != null) {
        //             index_value = (result.item(0).id_split + 1);
        //         }

        //         if (DO_LOG) {
        //             console.log("USING INDEX " + index_value);
        //         }

        //         for (let i = 0; i < this.lap_times.length; i++) {
        //             let recordData = {
        //                 "id_athlete": athlete.rowid,
        //                 "id_record_definition": event.rowid,
        //                 "value": this.lap_times[i],
        //                 "is_split": true,
        //                 "id_split": index_value,
        //                 "id_split_index": i + 1,
        //                 "last_updated": Date.now()
        //             };

        //             dbConnection.insertValuesFromObject("record", recordData);
        //         }

        //         this.resetStopwatch();
        //     });
        // } else {
        //     this.resetStopwatch();
        // }



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

    pad(n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
      }
}
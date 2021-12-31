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

        this.offlineRecordRowid = 1;

        // the length of the slidedown
        this.chooseEventSlideAmount = 40;
        this.chooseEventTransitionDuration = 550;
        this.isSlideupActive = false;
        this.isSlideupTransitioning = false;

        // paths
        this.stopButtonPath = "img/stop_button.png";
        this.playButtonPath = "img/play_button.png";
        this.upArrowPath = "img/up_arrow_transparent.png";
        this.downArrowPath = "img/down_arrow_transparent.png";

        this.defaultSlideupText = "Choose Event";
        this.currentSlideupText = this.defaultSlideupText;

        this.selectedAthleteId = null;
        this.selectedRecordDefinitionId = null;
        this.selectedRecordDefinitionGender = null;

        this.landingPageSelector = "#stopwatchPage #landingPage";
        this.carouselContainerSelector = `${this.landingPageSelector} #slideup_content`;

        this.defaultStopwatchToggleFunction = () => {
            // this.toggleStopwatch();

            if (!this.isSlideupActive) {
                this.toggleSlideup();
            } else if(this.isSlideupActive) {
                Popup.createConfirmationPopup(`
                Select an event from the list below to get started. 
                Click on the athlete's name when they finish to record a time!
                `, ["OK"], [() => {}]);
            }
        };

        this.unsavedEventsQuery = (`
            SELECT record_definition.record_identity, record_definition.rowid FROM record_definition
            WHERE record_definition.unit = ?
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
            centerX: 0,
            centerY: 0,
            // Styles moved to stopwatch.css

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
                <div id="stopwatch_wrapper">
                    <span id="stopwatch_point"></span>
                    <span id="stopwatch_time">0:00</span>
                </div>

                <img src="${this.upArrowPath}" alt="" id="slideup_arrow" class="slideup_arrow_up"></img>
                <div id="slideup" class="slideup_contracted"></div>

                <div id="slideup_content" style="height: 7%;">
                </div>
            </div>
        `);

        //     <div class="table_container">
        //     <a id="stopwatch_reset" class="stopwatch_button">Reset</a>
        //     <img src="${this.playButtonPath}" alt="" id="stopwatch_start_stop" class="play_button noSelect"></img>
        //     <a id="stopwatch_lap" class="stopwatch_button">Save</a>
        // </div>

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

                <div class="subheading_text"></div>

                <div id="new_events_box" class="button_box">
                
                </div>
            </div>
        `);

        // <div id="saved_events_box" class="button_box new_event">

        // </div>
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
        
        this.resetSlideup();

        if (this.pageTransition.getPageCount() == 0) {
            this.pageTransition.addPage("landingPage", this.landingPage, true);
            this.pageTransition.addPage("selectAthletePage", this.selectAthletePage);
            this.pageTransition.addPage("selectEventPage", this.selectEventPage);
        }
        $("html").scrollTop(0); // Fixes bug on iOS that shows scrollbar after login
        
        $("#slideup").addClass('slideup_contracted');
        $("#slideup").addClass('slideup_expanded');


        // this.setupStopwatch(this.defaultStopwatchToggleFunction);
        this.setupCssStopwatch(this.defaultStopwatchToggleFunction);
        this.setupSlideup();

        
        // $(`${this.landingPageSelector} .table_container`).addClass("hidden");
    }

    stop() {
        this.resetSlideup();
        // TODO: stop is called multiple times on startup, stop that, also lower slideup on switch
    }
    
    setupCssStopwatch(stopCallback) {
        
        $("#stopwatch_wrapper").unbind("click");
        $("#stopwatch_wrapper").unbind("dblclick");
        
        // Remove any old loops
        if(this.clockLoop !== null) {
            clearInterval(this.clockLoop);
            this.clockLoop = null;
        }
        
        // Start loop that will check the state of clock.isRunning
        this.clockLoop = setInterval(() => {
            let dt = Date.now() - (this.clock.start == 0 ? Date.now() : this.clock.start);
            this.clock.start = Date.now();
            
            // Update numerical display of the time
            if(this.clock.isRunning) {
                this.clock.seconds += Math.abs(dt / 1000);
                this.clock.minutes = Math.floor(this.clock.seconds / 60);
                this.clock.hours = Math.floor(this.clock.seconds / 3600);
            }
            let timeDisplay = (Math.round((this.clock.seconds % 60) * 100)) / 100; // Report to 3 decimal places
            timeDisplay = timeDisplay.toString();
            if(this.clock.minutes > 0) {
                timeDisplay = this.clock.minutes + ":" + timeDisplay;
            }
            if(this.clock.hours > 0) {
                timeDisplay = this.clock.hours + ":" + timeDisplay;
            }
            // Add trailing 00's if they're missing
            if(!timeDisplay.includes(".")) {
                timeDisplay = timeDisplay + ".00";
            }
            $("#stopwatch_time").text(timeDisplay);
            
            // Move the dot around the circle
            let secondPart = (this.clock.seconds % 1); // Returns decimal component of second
            let targetAngle = secondPart * Math.PI * 2; // Radians; fraction of a full second & full turn
            let vh = $("#app").height() / 100; // CSS viewport height (window changes after app close, use "#app instead")
            let radius = (vh * 15) + 10; // Radius from .css file, +10 from experimenting
            let pointPosOffset = $("#stopwatch_wrapper").width() / 2;
            let pointCenterOffset = $("#stopwatch_point").height() / 2; // Center point on circle
            
            // Translate point (origin is upper left of the wrapper)
            let x = radius + (radius * Math.sin(targetAngle)) - pointPosOffset;
            let y = radius - (radius * Math.cos(targetAngle)) - pointCenterOffset;
            $("#stopwatch_point").css("left", x + "px");
            $("#stopwatch_point").css("top", y + "px");
        });
        
        
        $("#stopwatch_wrapper").bind("dblclick", (e) => {

            if (this.isSlideupTransitioning) {
                setTimeout(() => {
                    this.resetStopwatch();
                    this.resetSlideup();
                }, this.chooseEventTransitionDuration);
            } else {
                this.resetStopwatch();
                this.resetSlideup();
            }
            
        });
        
        $("#stopwatch_wrapper").bind("click", (e) => {
            stopCallback();
        });


        this.clock.hasInitialized = true; // Not really used anymore
    }
    
    /**
     * @description retreive the context for the canvas and setup necessary event listeners
     * 
     * @deprecated Due to lag induced by the canvas element (for unknown reasons) on
     * iOS, a CSS alternative was implemented. This has the added benefit of translating
     * more easily to other device sizes and solving the lag issue. This method
     * can likely be removed in time, but was preserved in case we need to revert
     */
    setupStopwatch(stopCallback) {
        
        if(DO_LOG) {
            console.log("[stopwatch.js]: Deprecated stopwatch method is being called! Please use CSS revision!");
        }
        
        if (this.c == null || this.ctx == null) {
            this.c = $("#stopwatch_canvas")[0];
            this.ctx = this.c.getContext("2d");
        }

        if (!this.clock.hasInitialized) {

            // set the canvas size dynamically to accomodate various screen sizes
            let windowWidth = window.screen.availWidth;
            let windowHeight = window.screen.availHeight;


            let prefWidth = windowWidth;
            // make sure that the height is being scaled properly 
            // (0.38 comes from the percent of the screen that the stopwatch occupies) found in stopwatch.css
            let prefHeight = windowHeight * 0.40;

            this.c.width = prefWidth;
            this.c.height = prefHeight;

            // find the largest scale size we can reasonable accomodate
            let scale = Math.max(this.c.width / 480, this.c.height / 720);

            /**^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
             * these values are used to shift the canvas back to its original position
             * in order compensate for the fact that everything is being scaled and stretched
             * 
             * Math (prefWidth * scale) -> this is the size of the new canvas after being transformed
             * Take away the prefWidth to find the size of the original canvas
             * divide that by two to find how far the canvas has shifted
             * ...............................................................................................................
             */
            const translate = {
                x: -((prefWidth * scale) - prefWidth) / 2,
                y: -((prefHeight * scale) - prefHeight) / 2
            }

            // console.log("Canvas resolution: " + windowWidth + "x" + windowHeight);
            // console.log("Canvas dimensions: " + prefWidth + "x" + prefHeight);
            // console.log("scale: " + scale);
            // console.log("translate x: " + translate.x + " translate y: " + translate.y);

            // apply the transformation
            this.ctx.setTransform(scale, 0, 0, scale, translate.x, translate.y);


            // init clock constants
            this.clock.angleInterval = 360 / this.clock.interval;
            this.ctx.lineWidth = this.clock.lineWidth;
            this.ctx.font = this.clock.font;
            this.ctx.fillStyle = this.clock.fillStyle;


            this.clock.centerX = Math.min(this.c.width / 2);
            this.clock.centerY = Math.min(this.c.height / 2);

            this.clock.textHeight = this.measureTextHeight(0, 0, 50, 100);


            this.ctx.clearRect(0, 0, this.c.width, this.c.height);
            this.drawCircle();
            this.drawPoint(this.clock.initialAngle, 1);

            this.ctx.fillText("0.00", this.clock.centerX - (this.ctx.measureText("0.00").width / 2),
                this.clock.centerY + (this.clock.textHeight / 2));

            $("#stopwatchPage .back_button").click((e) => {
                this.pageTransition.slideRight("landingPage");
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
                this.ctx.clearRect(-this.c.width, -this.c.width, this.c.width * 5, this.c.height * 5);
                this.ctx.strokeStyle = this.clock.circleColor;
                this.drawCircle();
                this.ctx.strokeStyle = this.clock.dotColor;
                this.clock.angle = (-((this.clock.seconds % 1) * 360)) + 90;
                this.drawPoint(this.clock.angle, 1);

                let textX = this.clock.centerX - (this.ctx.measureText(clockText).width / 2);
                let textY = this.clock.centerY + (this.clock.textHeight / 2);
                this.ctx.fillText(clockText, textX, textY);
            });
        }

        $("#stopwatch_canvas").unbind("click");
        $("#stopwatch_canvas").unbind("dblclick");

        $("#stopwatch_canvas").bind("dblclick", (e) => {

            if (this.isSlideupTransitioning) {
                setTimeout(() => {
                    this.resetStopwatch();
                    this.resetSlideup();
                }, this.chooseEventTransitionDuration);
            } else {
                this.resetStopwatch();
                this.resetSlideup();
            }

        });

        $("#stopwatch_canvas").bind("click", (e) => {
            stopCallback();
        });


        this.clock.hasInitialized = true; // Prevent re-binding of touchend
    }

    saveLapTime() {
        let n = $(".stopwatch_lap_times")[0].childElementCount;
        $(".stopwatch_lap_times").prepend(`
                                <div>#${n + 1}: ${this.generateClockText(this.clock)}</div>
                            `);
        this.lap_times.push(this.clock.seconds);
    }

    setupSlideup() {

        $("#slideup_arrow").unbind("click");
        $("#slideup").unbind("click");
        $("#slideup").html(this.defaultSlideupText);

        let slideupCallback = () => {
            this.toggleSlideup();
        }

        $("#slideup_arrow").click(slideupCallback);
        $("#slideup").click(slideupCallback);
    }

    toggleSlideup(onFinishCallback = () => {}) {
        $("#slideup").html(this.currentSlideupText);

        // don't toggle if slideup already moving (it creates big problems for clicking twice)
        if (this.isSlideupTransitioning) {
            return;
        }

        this.isSlideupTransitioning = true;

        // slide down
        if (this.isSlideupActive) {
            this.lowerSlideup(onFinishCallback);
            // slide up
        } else {

            // start the slideup for events by default on slide up
            // but when the record id exists, then slideup for athletes
            if (this.selectedRecordDefinitionId == null) {
                this.startSlideupForEvents((record_definition, gender) => {
                    this.selectedRecordDefinitionId = record_definition;
                    this.selectedRecordDefinitionGender = gender;
                    this.startSlideupForAthletes(record_definition, gender);
                });
            }

            this.raiseSlideup(onFinishCallback);
        }


        this.isSlideupActive = !this.isSlideupActive;
    }

    resetSlideup() {
        this.currentSlideupText = this.defaultSlideupText;
        $("#slideup").html(this.currentSlideupText);

        this.selectedAthleteId = null;
        this.selectedRecordDefinitionId = null;
        this.selectedRecordDefinitionGender = null;

        if (this.isSlideupActive) {
            this.toggleSlideup();
        }

        $(`${this.landingPageSelector} #slideup_content`).empty();

        $("#slideup").removeClass('male_color');
        $("#slideup").removeClass('female_color');
        $("#slideup").removeClass('slideup_both_genders');
    }

    /**
     * This function will lower the slideup using appropriate animations
     * as well as changing various styling and text
     */
    raiseSlideup(onFinishCallback) {

        // change button direction and change styling
        $("#slideup_arrow").attr("src", this.downArrowPath);
        $("#slideup_arrow").removeClass('slideup_arrow_up');
        $("#slideup_arrow").addClass('slideup_arrow_down');


        // animate to slide up
        $("#slideup, #slideup_arrow").animate({
            bottom: `+=${this.chooseEventSlideAmount}%`,
        }, {
            duration: this.chooseEventTransitionDuration,
            queue: false,
            complete: () => {
                $("#slideup").removeClass('slideup_contracted');
                $("#slideup").addClass('slideup_expanded');
                $("#slideup").removeClass('slideup_both_genders');

                this.isSlideupTransitioning = false;
                onFinishCallback();
            }
        });

        $("#stopwatchPage #landingPage #slideup_content").animate({
            height: `${this.chooseEventSlideAmount + 7}%`
        }, {
            duration: this.chooseEventTransitionDuration,
            queue: false
        });
    }

    /**
     * This function will lower the slideup using appropriate animations
     * as well as changing various styling and text
     */
    lowerSlideup(onFinishCallback) {
        // change arrow direction
        $("#slideup_arrow").attr("src", this.upArrowPath);
        $("#slideup_arrow").removeClass('slideup_arrow_down');
        $("#slideup").removeClass('male_color');
        $("#slideup").removeClass('female_color');

        $("#slideup_arrow").addClass('slideup_arrow_up');

        $("#slideup, #slideup_arrow").animate({
            bottom: `-=${this.chooseEventSlideAmount}%`,
        }, {
            duration: this.chooseEventTransitionDuration,
            queue: false
        });

        let _this = this;

        $("#stopwatchPage #landingPage #slideup_content").animate({
            height: "7%" // Makes it the width of the navbar so slideup_arrow and container move at the same rate
        }, {
            duration: this.chooseEventTransitionDuration,
            queue: false,
            complete: () => {
                this.isSlideupTransitioning = false;

                $("#slideup").removeClass('slideup_expanded');

                if (_this.selectedRecordDefinitionGender) {

                    if (_this.selectedRecordDefinitionGender == 'M') {
                        $("#slideup").addClass('male_color');
                    } else if (_this.selectedRecordDefinitionGender == 'F') {
                        $("#slideup").addClass('female_color');
                    }
                    // on both genders selected
                } else if (_this.selectedRecordDefinitionGender == '') {
                    $("#slideup").addClass('slideup_both_genders');
                } else {
                    $("#slideup").addClass('slideup_contracted');
                }

                onFinishCallback();
            }
        });
    }

    /**
     * This method will raise the slideup and populate it with a list of avaliable events to pick from
     * It will select gender based on two different toggle buttons. 
     * 
     * A long click on a button will allow the user to select a list of events rather than a single one.
     * The given callback will be called once the user has made a decision.
     * 
     * @param {function} callback the callback that will be called when an event, or list of events is selected. 
     * Will pass record_definition or list of definitions, and gender
     */
    startSlideupForEvents(callback) {

        $(`${this.landingPageSelector} #slideup_content`).html(`
            <div class="toggle_box">
                <div class="boys_box"><div>
                <div class="girls_box"><div>
                <div class="splits_box"><div>
            </div>
        `);

        let isSelectingMultipleEvents = false;

        // callback for startSlideupForAthletes to start on event click
        let onSlideDoneFunction = function () {
            $(`${this.landingPageSelector} .slideup_top_bar`).remove();
            callback(eventConfig);
        }.bind(this);

        let eventConfig = {
            // if the user selected multiple events, they will be held here
            selectedEvents: {},
            // eventRowid -> array full of split names. This is so you can potentiall run multiple events with splits
            selectedSplits: {},
            // split times will be separated by event, then by athlete id_backend. Each split will correspond with its selectedSplitsIndex
            // eventRowid : {id_backend : [selectedSplit1, selectedSplit2, ...]}
            splitTimes: {},
            isGirls: true,
            isBoys: true,
            isSplits: false
        }

        // Toggle boys
        ButtonGenerator.generateToggle(`${this.landingPageSelector} #slideup_content .boys_box`, "Boys", true, () => {
            eventConfig.isBoys = true;
        }, () => {
            eventConfig.isBoys = false;
        });


        // Toggle girls
        ButtonGenerator.generateToggle(`${this.landingPageSelector} #slideup_content .girls_box`, "Girls", true, () => {
            eventConfig.isGirls = true;
        }, () => {
            eventConfig.isGirls = false;
        });

        // Toggle splits
        ButtonGenerator.generateToggle(`${this.landingPageSelector} #slideup_content .splits_box`, "Splits", false, () => {
            if (isSelectingMultipleEvents) {
                Popup.createConfirmationPopup(`
                We currently do not support running splits with multiple events.
                Let us know if you would like this feature by emailing support@sportwatch.us
                `, ["OK"], [() => {}]);
                this.resetSlideup();
                this.resetStopwatch();
            }
            eventConfig.isSplits = true;
        }, () => {
            eventConfig.isSplits = false;
        });

        dbConnection.selectValues(this.unsavedEventsQuery, ["second"]).then((record_definitions) => {

            if (record_definitions != false) {
                // this callback will handle single click, and therefore single event functionality
                ButtonGenerator.generateButtonsFromDatabase(`${this.landingPageSelector} #slideup_content`, record_definitions, (record_definition) => {

                    let gender = this.getGender(eventConfig.isBoys, eventConfig.isGirls);

                    this.selectedRecordDefinitionGender = gender;
                    this.currentSlideupText = record_definition.record_identity

                    eventConfig.selectedEvents[record_definition.rowid] = record_definition.record_identity;

                    // if the user selected splits, select them here
                    if (eventConfig.isSplits) {
                        this.selectSplits(eventConfig, () => {
                            this.toggleSlideup(onSlideDoneFunction);
                        });
                    } else {
                        this.toggleSlideup(onSlideDoneFunction);
                    }

                }, ["id_record_definition", "value", "is_split",
                    "id_relay", "id_relay_index", "last_updated", "unit"
                ], Constant.eventColorConditionalAttributes, "class");

                // longclick for selecting multiple events
                $(`${this.landingPageSelector} #slideup_content button`).bind("longclick", (e) => {

                    // TODO: be default prevent multiple events from being used with splits
                    if (eventConfig.isSplits) {
                        Popup.createConfirmationPopup("We currently do not support running splits with multiple events.", ["OK"], [() => {}]);
                        this.resetSlideup();
                        this.resetStopwatch();
                        return;
                    }

                    if (!isSelectingMultipleEvents) {
                        $(`${this.landingPageSelector} #slideup_content`).prepend(`
                            <button class="slideup_top_bar select_events">Use Selected Events</button>
                        `);

                        // rebind the click event on event buttons to add it to the list
                        $(`${this.landingPageSelector} #slideup_content button:not(:first-child)`).each((index, element) => {

                            $(element).unbind("click");

                            $(element).addClass("available_button");

                            // new click event for buttons. Highlight or remove highlighting on click
                            $(element).click((e) => {

                                if ($(element).hasClass("selected_button")) {
                                    $(element).removeClass("selected_button");
                                    delete eventConfig.selectedEvents[Number($(element).attr("rowid"))];
                                } else {
                                    eventConfig.selectedEvents[Number($(element).attr("rowid"))] = $(element).attr("record_identity");
                                    $(element).addClass("selected_button");
                                }

                                navigator.vibrate(25);

                                if ($("#stopwatchPage .selected_button").length == 0) {
                                    $("#stopwatchPage .slideup_top_bar").remove();
                                    this.resetSlideup();
                                }
                            });
                        });

                        // remove double any other conflicting click event
                        $("#stopwatchPage .slideup_top_bar").unbind("click");

                        // done selecting events: start athlete slideup
                        $("#stopwatchPage .slideup_top_bar").click((e) => {
                            // stop selecting multiple events 
                            isSelectingMultipleEvents = false;

                            this.currentSlideupText = "Multi-Event";

                            let gender = this.getGender(eventConfig.isBoys, eventConfig.isGirls);

                            this.selectedRecordDefinitionGender = gender;

                            // this will move to the next stage when the slideup is in the down position
                            // if the user selected splits, select them here
                            if (eventConfig.isSplits) {
                                this.selectSplits(eventConfig, () => {
                                    this.toggleSlideup(onSlideDoneFunction);
                                });
                            } else {
                                this.toggleSlideup(onSlideDoneFunction);
                            }
                        });

                        let id = $(e.target).attr("id");

                        // format the longclick button and add it to the list
                        if (id != undefined) {
                            $(`#stopwatchPage #${id}`).removeClass();
                            $(`#stopwatchPage #${id}`).addClass("generated_button available_button selected_button");
                            eventConfig.selectedEvents[Number($(`#stopwatchPage #${id}`).attr("rowid"))] = $(`#stopwatchPage #${id}`).attr("record_identity");
                        }
                    }

                    isSelectingMultipleEvents = true;
                });

                $(`${this.landingPageSelector} #slideup_content`).append("<br><br><br><br><br><br>");
            } else {
                if (DO_LOG) {
                    console.log("record_definition table is empty");
                }
                Popup.createConfirmationPopup("Something went very wrong, try restarting the app :(", ["Ok"], [() => {}]);
            }
        });
    }

    /**
     * generate a string 'M' or 'F' depending on the boolean. 
     * it will be blank if both or neither are present
     * 
     * @param {Boolean} isBoys are the boys selected
     * @param {Boolean} isGirls are the girls selected
     */
    getGender(isBoys, isGirls) {
        let gender = '';

        if (isBoys && !isGirls) {
            gender = 'M';
        } else if (!isBoys && isGirls) {
            gender = 'F';
        } else {
            gender = '';
        }

        return gender;
    }

    /**
     * This function will populate the slideup for the given event.
     * This will also start the stopwatch.
     * 
     * @param {Object} eventConfig the configuration that gives information on the events being run and other metadata
     */
    startSlideupForAthletes(eventConfig) {

        // begin generating the athletes to actually start the stopwatch
        let genderConditionalQuery;
        let eventConditionalQuery;
        let savedRecordsArray;
        let unsavedRecordsArray;

        let selectedEvent;
        let gender = this.getGender(eventConfig.isBoys, eventConfig.isGirls);

        $(`${this.landingPageSelector} #slideup_content`).empty();


        let ids = Object.keys(eventConfig.selectedEvents);
        let eventNames = Object.values(eventConfig.selectedEvents);

        // if record_defininition is an array and isn't a record_definition object
        if (ids.length > 1) {

            // add the selector box to the slideup
            $(`${this.landingPageSelector} #slideup_content`).append(`
                <table class="slideup_top_bar change_saved_event"></table>
            `);

            // loop through the list of record definitions and add them to the slideup top bar
            for (let i = 0; i < ids.length; i++) {
                
                if (i == 0 || i % Constant.stopwatchSelectEventColumnCount == 0) {
                    $(`${this.landingPageSelector} .slideup_top_bar.change_saved_event`).append(`<tr></tr>`);
                }

                let tdObject = {
                    "id_record_definition": ids[i],
                    "html": eventNames[i]
                };

                // first element highlighted
                if (i == 0) {
                    tdObject["class"] = "selected_event";
                    eventConfig.selectedEvent = Number(ids[0]);
                }

                // create a cell for the event and bind it to a click event
                // which will set the color for it
                let td = $("<td>", tdObject);

                td.click((e) => {
                    let recordId = $(e.target).attr("id_record_definition");
                    $("#stopwatchPage .selected_event").removeClass("selected_event");
                    eventConfig.selectedEvent = Number(recordId);

                    $(e.target).addClass("selected_event");
                });

                // append to the last row added, which occurs ever three elements
                $(`${this.landingPageSelector} .slideup_top_bar.change_saved_event tr:last-child`).append(td);
            }


            // configure WHERE condition
            if (gender != undefined || gender != null) {
                // alter the condition based on presence of gender
                if (gender == 'M' || gender == 'F') {
                    genderConditionalQuery = "WHERE athlete.gender = ?";
                    eventConditionalQuery = `AND (record.id_record_definition = ? 
                        ${"OR record.id_record_definition = ?".repeat(ids.length - 1)})`;

                    savedRecordsArray = [gender].concat(ids);
                    unsavedRecordsArray = [gender, gender].concat(ids);
                    // gender not selected, only use record definition to select
                } else if (gender == '') {

                    genderConditionalQuery = "";

                    eventConditionalQuery = `WHERE (record.id_record_definition = ? 
                        ${"OR record.id_record_definition = ?".repeat(ids.length - 1)})`;

                    savedRecordsArray = ids;
                    unsavedRecordsArray = ids;
                }
            }

            // only a single record definition is passed, configure normally
        } else {

            let record_definition;

            // rewrite the array to a single value
            if (ids.length == 1) {
                record_definition = ids[0];
            }
            eventConfig.selectedEvent = Number(record_definition);

            genderConditionalQuery = "";
            // default to select only by record definition
            eventConditionalQuery = "WHERE record.id_record_definition = ?";
            savedRecordsArray = [];
            unsavedRecordsArray = [];

            // configure WHERE condition
            if (gender != undefined || gender != null) {
                // alter the condition based on presence of gender
                if (gender == 'M' || gender == 'F') {
                    genderConditionalQuery = "WHERE (athlete.gender = ?)";
                    eventConditionalQuery = "AND (record.id_record_definition = ?)";

                    savedRecordsArray = [gender, Number(record_definition)];
                    unsavedRecordsArray = [gender, gender, Number(record_definition)];
                    // gender not selected, only use record definition to select
                } else {
                    savedRecordsArray = [Number(record_definition)];
                    unsavedRecordsArray = [Number(record_definition)];
                }
            }
        }

        let generateSplitBoxes = (rowid) => {

            eventConfig.selectedSplits[rowid].push("Finish");
            let selectedSplitsCopy = eventConfig.selectedSplits[rowid].slice();

            // loop through the list of record definitions and add them to the slideup top bar
            for (let i = 0; i < selectedSplitsCopy.length; i++) {

                if (i == 0 || i % Constant.stopwatchSelectEventColumnCount == 0) {
                    $(`${this.landingPageSelector} .slideup_top_bar.change_saved_split`).append(`<tr></tr>`);
                }

                let tdObject = {
                    "html": selectedSplitsCopy[i] + (i != selectedSplitsCopy.length - 1 ? " Meter Split" : ""),
                    "index": i + 1
                };

                let buttonBoxObject = {
                    "id": `split_button_box_${i + 1}`,
                    "class": "button_box " + (i != 0 ? "hidden" : "")
                };

                // because there are splits, we need to create a button box for each set of athletes for each split
                // since we have access to the element here, we can define the toggle behavior
                let buttonBox = $("<div>", buttonBoxObject);

                // console.log("splits " + JSON.stringify(tdObject));

                // first element highlighted
                if (i == 0) {
                    tdObject["class"] = "selected_split";
                    eventConfig["buttonBoxes"] = {};
                    eventConfig["buttonBoxes"][rowid] = [buttonBox];

                    // make sure that this is indicated as the first split selected
                    eventConfig["selectedSplit"] = i + 1;
                    eventConfig["selectedSplitName"] = selectedSplitsCopy[i];

                    buttonBox["class"] = "button_box";
                    // set every button box after the first to be hidden
                } else {
                    eventConfig["buttonBoxes"][rowid].push(buttonBox);
                }

                // create a cell for the event and bind it to a click event
                // which will set the color for it
                let td = $("<td>", tdObject);


                td.click((e) => {
                    $("#stopwatchPage .selected_split").removeClass("selected_split");

                    // hide every button box, then unhide the selected one
                    $("#stopwatchPage .button_box").addClass("hidden");
                    $(`#split_button_box_${i + 1}`).removeClass("hidden");

                    // this will set the selected split to be a string in the selected splits, ex. "100" "200" etc
                    eventConfig["selectedSplit"] = i + 1;
                    eventConfig["selectedSplitName"] = selectedSplitsCopy[i];

                    $(e.target).addClass("selected_split");
                });

                // append to the last row added, which occurs ever three elements
                $(`${this.landingPageSelector} .slideup_top_bar.change_saved_split tr:last-child`).append(td);
            }
        }

        // add tooltip text and make it fade out
        $("#stopwatchPage #stopwatch_wrapper").after(`
            <div class="missing_info_text info_text">Tap clock to start. <br> Tap twice to reset.</div>
        `);

        setTimeout(() => {
            $("#stopwatchPage .missing_info_text").fadeOut(Constant.popupFadeoutDuration, function () {
                $(this).remove();
            });
        }, Constant.popupFadeoutDelay);


        // set watch to slide up, then only change stopwatch
        this.setupCssStopwatch(() => {
            this.toggleStopwatch();

            if (!this.isSlideupActive) {
                this.toggleSlideup();
            }
        });

        // set all of the information necessary to query the database
        eventConfig.unsavedRecordsArray = unsavedRecordsArray;
        eventConfig.savedRecordsArray = savedRecordsArray;
        eventConfig.genderConditionalQuery = genderConditionalQuery;
        eventConfig.eventConditionalQuery = eventConditionalQuery;

        let splitEvents = Object.keys(eventConfig.selectedSplits);

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // generate the select split boxes if they exist
        // selectedSplit structure is as follows:
        // {"41" -> rowid : ["400 Meters", "600 Meters"]}
        // the rowid is the key, and corresponds to an array of measurements
        //..................................................................................................
        if (splitEvents.length > 0) {
            // console.log("generating split boxes");
            $(`${this.landingPageSelector} #slideup_content`).append(`
                <table class="slideup_top_bar change_saved_split"></table>
            `);
            // generate the split selection buttons for the first event by default
            generateSplitBoxes(splitEvents[0]);
        }


        this.generateAthletes(eventConfig);
    }

    /**
     * This method will populate the slideup with the appropriate athletes in the appropriate events
     * It will be a more generic function, but will primarily be used by the startSlideupForAthletes method
     * 
     * @param {Object} eventConfig the configuration of the event(s) that are being run
     */
    generateAthletes(eventConfig) {

        // query for athletes with saved records which orders them by value
        let savedRecordsQuery = (`
            SELECT fname, lname, athlete.id_backend, gender, athlete.rowid from athlete
            INNER JOIN record_user_link
            ON record_user_link.id_backend = athlete.id_backend
            INNER JOIN record
            ON record_user_link.id_record = record.id_record
            ${eventConfig.genderConditionalQuery} ${eventConfig.eventConditionalQuery}
            GROUP BY athlete.lname
            ORDER BY record.value DESC
        `);

        // query for athletes with no records saved in the event at all
        let unsavedRecordsQuery = (`
            SELECT fname, lname, athlete.id_backend, gender, athlete.rowid from athlete
            ${eventConfig.genderConditionalQuery} 
            EXCEPT
            SELECT fname, lname, athlete.id_backend, gender, athlete.rowid from athlete
            INNER JOIN record_user_link
            ON record_user_link.id_backend = athlete.id_backend
            INNER JOIN record
            ON record_user_link.id_record = record.id_record
            ${eventConfig.genderConditionalQuery} ${eventConfig.eventConditionalQuery}
            GROUP BY athlete.lname
            ORDER BY athlete.lname ASC
        `);

        let savedRecordsPromise = dbConnection.selectValues(savedRecordsQuery, eventConfig.savedRecordsArray);
        let unsavedRecordsPromise = dbConnection.selectValues(unsavedRecordsQuery, eventConfig.unsavedRecordsArray);

        let isSavedRecordsEmpty = false;
        let isUnsavedRecordsEmpty = false;

        Promise.all([savedRecordsPromise, unsavedRecordsPromise]).then((athletesArray) => {

            // check to see if both saved and unsaved queries are empty
            // since there are two queries, the length of athletesArray will always equal 2

            if ((athletesArray[0] == false || athletesArray[0].length == undefined)) {
                isSavedRecordsEmpty = true;
            }

            if ((athletesArray[1] == false || athletesArray[1].length == undefined)) {
                isUnsavedRecordsEmpty = true;
            }

            // for the two sets of saved and unsaved athletes
            for (let i = 0; i < athletesArray.length; i++) {
                const athletes = athletesArray[i];


                if (isSavedRecordsEmpty && i == 0) {
                    continue;
                }

                if (isUnsavedRecordsEmpty && i == 1) {
                    continue;
                }

                //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                // each type of split will have their own button box which will be hidden when the user switches to a different split
                // There will be a default generic button box if there are no splits to be found
                // 
                // The button box will be passed through by another function so that it may choose when to swap the list of athletes.
                //............................................................................................................................................

                let splitEvents = Object.keys(eventConfig.selectedSplits);

                let nBoxes = 1;

                if (splitEvents.length > 0) {
                    // first and only event by default TODO: let them do multiple splits and events
                    nBoxes = eventConfig.selectedSplits[splitEvents[0]].length;
                }

                let isUsingSplits = (nBoxes != 1 ? true : false);
                
                for (let j = 0; j < nBoxes; j++) {
                    // append the button box jquery object here, so then it may be controlled by the callback in the other function
                    
                    let buttonBoxSelector;

                    if (isUsingSplits) {
                        // console.log("using splits, making button box " + JSON.stringify(eventConfig.buttonBoxes[splitEvents[0]][j]));
                        $(`${this.landingPageSelector} #slideup_content`).append(eventConfig.buttonBoxes[splitEvents[0]][j]);
                        buttonBoxSelector = `#split_button_box_${j + 1}`;
                        // console.log($(`${this.landingPageSelector} #slideup_content`).html());
                        // add only 1 button box for a single split event
                    } else if(i == 0 || (i == 1 && isSavedRecordsEmpty)) {
                        $(`${this.landingPageSelector} #slideup_content`).append(`<div class="button_box"></div>`);
                        buttonBoxSelector = " .button_box";
                    } else {
                        buttonBoxSelector = ".button_box";
                    }

                    console.log("SPLIT BOX SELECTOR IS " + buttonBoxSelector);

                    // populate the athletes and set the callback on click
                    ButtonGenerator.generateButtonsFromDatabase(`${this.landingPageSelector} #slideup_content ${buttonBoxSelector}`, athletes, (athlete) => {

                        navigator.vibrate(25);

                        // console.log($(`${this.landingPageSelector} #slideup_content ${buttonBoxSelector}`).html());
                        // console.log($(`${this.landingPageSelector} #slideup_content ${buttonBoxSelector}`).parent().html());
                        
                        // do a final record save on finish
                        if ((eventConfig.selectedSplitName == "Finish" && isUsingSplits) || !isUsingSplits) {
                            this.saveTime(eventConfig, athlete);

                            // save for a split
                            // note "finish" should never be a split_name in the split_record table
                        } else if (isUsingSplits) {
                            let currentEventRowId = eventConfig.selectedEvent;

                            // create object if it doesn't exist for the current event
                            if (eventConfig["splitTimes"][currentEventRowId] === undefined) {
                                eventConfig["splitTimes"][currentEventRowId] = {};
                            }

                            // create array otherwise append time to it
                            if (eventConfig["splitTimes"][currentEventRowId][athlete.id_backend] === undefined) {
                                eventConfig["splitTimes"][currentEventRowId][athlete.id_backend] = [this.clock.seconds];
                            } else {
                                // subtract 1 because selectedSplit is indexed starting at one, and js arrays are 0 indexed
                                eventConfig["splitTimes"][currentEventRowId][athlete.id_backend][Number(eventConfig.selectedSplit) - 1] = this.clock.seconds
                            }
                        }

                        let nAthletesRemaining = $(`${this.landingPageSelector} #slideup_content ${buttonBoxSelector} > button`).length - 1;

                        console.log("athletes left: " + nAthletesRemaining);

                        // Delete the specific button we are looking for
                        $(`${this.landingPageSelector} #slideup_content ${buttonBoxSelector} #${athlete.id}`).remove();

                        // no more athletes in the current box, remove it
                        if (nAthletesRemaining == 0) {
                            this.selectedRecordDefinitionId = null;
                            this.selectedRecordDefinitionGender = null;

                            if (isUsingSplits) {
                                $(`${this.landingPageSelector} #slideup_content .selected_split`).remove();
                                $(`${this.landingPageSelector} .slideup_top_bar.change_saved_split tr:first-child td:first-child`).trigger("click");
                            }

                            $(`${this.landingPageSelector} ${buttonBoxSelector}`).remove();
                        }


                        let nButtonBoxesRemaining = $(`${this.landingPageSelector} #slideup_content > .button_box`).length;

                        // no more button boxes remaining, clear the clock and reset
                        if (nButtonBoxesRemaining == 0) {
                            this.currentSlideupText = this.defaultSlideupText;
                            this.toggleSlideup();
                            this.resetStopwatch();

                            Popup.createConfirmationPopup(`
                                Results saved sucessfully!<br><br>
                                <i>Go to the stats page to see the results!</i><br>
                                <i>A graph of the athlete's progress can be found on the team page</i>
                            `, ["OK"], [() => {}]);
                        }

                    }, ["gender", "unit", "is_relay", "timestamp", "id_backend"]);


                    if (i == 0 && (!isUnsavedRecordsEmpty)) {
                        $(`${this.landingPageSelector} #slideup_content ${buttonBoxSelector}`).append(`
                        <br><br><br><hr style="height: 8px;">
                        <h2 style="text-align: center">Athletes without times in this event</h2>
                        `);
                    }
                }
            }

            if (isSavedRecordsEmpty && isUnsavedRecordsEmpty) {
                $("#slideup").removeClass('male_color');
                $("#slideup").removeClass('female_color');
                $("#slideup").addClass('slideup_contracted');
                this.resetStopwatch();
                this.resetSlideup();
                Popup.createConfirmationPopup("You're not on a team yet! Go to the team tab and become a part of a team to start recording times.", ["Ok"], [() => {}]);

                return;
            }


            $(`${this.landingPageSelector} #slideup_content`).append("<br><br><br><br><br><br>");
        });
    }

    /**
     * this method will ask the user where they wish to record their splits in the 
     * slideup dialogue and will return an object containing all of the marks.
     * 
     * @param {Object} eventConfig the event configuration
     * @param {Function} callback the callback to be called when the user is done selecting their splits
     */
    selectSplits(eventConfig, callback) {

        $(`${this.landingPageSelector} #slideup_content`).empty();

        let eventNames = Object.values(eventConfig.selectedEvents);
        let eventIds = Object.keys(eventConfig.selectedEvents);

        $(`${this.landingPageSelector} #slideup_content`).prepend(`
            <br><button id="confirm_selected_splits_button" class="generated_button" style="background-color: #68be9a;">Confirm Splits</button><br>
            <!-- <h2 style="text-align: center; padding-left: 5px; padding-right: 5px;">
            Click the "Add Split" button and enter a number representing the distance
            </h2> -->
        `);

        $("#confirm_selected_splits_button").click(function (e) {
            e.preventDefault();
            // console.log("CONFIRM SPLITS");
            callback(eventConfig.selectedSplits);
        });

        for (let i = 0; i < eventIds.length; i++) {
            
            // Make sure the selected event is distance-based and valid to add splits to
            if(!(eventNames[i] in Constant.recordIdentityInfo)) {
                Popup.createConfirmationPopup(`Splits are not currently supported for ${eventNames[i]}`, ["OK"], [
                    () => {
                        // Reset the stopwatch
                        $("#stopwatchPage #stopwatch_wrapper").trigger("dblclick");
                    }]);
                return;
            }
            
            let sectionId = `add_splits_section_${i}`;
            let inputId = `splits_input_${i}`;

            $(`${this.landingPageSelector} #slideup_content`).append(`
                <br><br>    
                <div id="${sectionId}">
                    <h1>${eventNames[i]}</h1>
                    <hr>
                    <button class="generated_button" style="margin-bottom: 100px;">Add Split to ${eventNames[i]}</button>
                </div><br><br><br><br>
            `);

            $(`#${sectionId}`).find("button:last").attr("nClicks", 0);

            // button to add split to the event
            $(`#${sectionId}`).find("button:last").click((e) => {
                let clickNumber = Number($(`#${sectionId}`).find("button:last").attr("nClicks")) + 1;
                $(`#${sectionId}`).find("button:last").attr("nClicks", clickNumber);

                $(e.target).before(`
                    <br>
                    <div class="input_splits_box">
                        <!-- Use type="text" to allow for proper parsing even if letters are entered -->
                        <b>Split ${clickNumber}:</b> <input class="sw_text_input split_input" type="text" id="${inputId}">Meters</input>
                    </div>
                `);
                // TODO: Add preset splits (i.e. every mile for 3k)
                
                // Hide the Add split button until the field is completed
                $(`#${sectionId}`).find("button:last").fadeTo(Constant.fadeDuration, 0);
                // focus the input and change it to a div on onfocus
                $(`#${inputId}`).focus();
                
                
                let onInputFinish = function () {
                    
                    let splitDistance = $(this).val();
                    // If blank, just close unfocus
                    if(splitDistance.trim().length == 0) {
                        return;
                    }
                    splitDistance = parseInt(splitDistance.replace(/[^0-9]/gm, ""));;
                    
                    // Sanitize entry to make sure its a valid number
                    if((isNaN(splitDistance)) || (!Number.isInteger(splitDistance))) {
                        Popup.createConfirmationPopup("Please enter a number for the split distance eg. 100", ["OK"], [() => {}]);
                        return;
                    }
                    
                    // Prevent splits that are longer than max event length
                    if(eventNames[i] in Constant.recordIdentityInfo) {
                        let eventMaxDistance = Constant.recordIdentityInfo[eventNames[i]].distance;
                        if(splitDistance >= eventMaxDistance) {
                            Popup.createConfirmationPopup(`Split cannot equal or exceed event length of ${eventMaxDistance}m`, ["OK"], [() => { }]);
                            $(`#${inputId}`).val(""); // Clear input box
                            return;
                        }
                    }
                    
                    // Make sure it isn't already added
                    if((clickNumber > 1) && (eventConfig.selectedSplits[eventIds[i]].includes(splitDistance.toString()))) {
                        Popup.createConfirmationPopup(`${splitDistance}m split has already been added`, ["OK"], [() => { }]);
                        $(`#${inputId}`).val("");
                        return;
                    }
                    
                    $(this).parent().find("b").after(`
                        <span>${splitDistance}</span>
                    `);


                    // create an array of split names for each event rowid so 800m : [400m split, 600m split, etc...]
                    if (clickNumber == 1) {
                        eventConfig.selectedSplits[eventIds[i]] = [`${splitDistance}`];
                    } else {
                        eventConfig.selectedSplits[eventIds[i]].push(`${splitDistance}`);
                    }
                    
                    // Remove the input field and re-show the add button
                    $(`#${sectionId}`).find("button:last").fadeTo(Constant.fadeDuration, 1);
                    $(this).remove();
                }
                
                
                $(`#${inputId}`).blur(onInputFinish);
                $(`#${inputId}`).submit(onInputFinish);
                $(`#${inputId}`).on('keydown', (e) => {
                    if (Number(e.which) == 13) {
                        $(`#${inputId}`).trigger("blur");
                    }
                });
            });

            
        }

        // scroll to top of the slideup
        $(`${this.landingPageSelector} #slideup_content`).scrollTop(0);
    }

    startStopwatch() {

        this.clock.isRunning = true;

        // $("#stopwatchPage #landingPage #stopwatch_start_stop").removeClass("paused");

        // $("#stopwatchPage #landingPage #stopwatch_start_stop").attr("src", this.stopButtonPath);
        // $("#stopwatchPage #landingPage #stopwatch_lap").html("Lap");
        this.clock.start = 0;
    }

    stopStopwatch() {
        // $("#stopwatchPage #landingPage #stopwatch_start_stop").attr("src", this.playButtonPath);

        this.clock.isRunning = false;
        // $("#stopwatchPage #landingPage #stopwatch_lap").html("Save");
        // $("#stopwatchPage #landingPage #stopwatch_start_stop").addClass("paused");
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
            // $("#stopwatchPage #landingPage .table_container a").css("animation", "fadein 2s");
            // $("#stopwatchPage #landingPage .table_container a").css("visibility", "visible");
        }
    }

    /**
     * 
     * @param {Object} this.clock the this.clock object
     * @param {CanvasRenderingContext2D} this.ctx the canvas to reset
     */
    resetStopwatch() {
        
        // this.ctx.clearRect(0, 0, 400, 400);
        // this.drawCircle();
        // this.drawPoint(this.clock.initialAngle, 1);

        // let resetText = "0.00";

        // this.ctx.fillText(resetText, this.clock.centerX - (this.ctx.measureText(resetText).width / 2),
        //     this.clock.centerY + (this.clock.textHeight / 2));

        this.stopStopwatch();
        this.setupCssStopwatch(this.defaultStopwatchToggleFunction);

        // this.clock.angle = this.clock.initialAngle;
        // this.clock.epoch = 0;
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
        let headerWidth = $("#stopwatchPage #selectAthletePage > .generic_header").height();
        $("#stopwatchPage #selectAthletePage > *:not(.generic_header)").first().css("margin-top", `calc(${headerWidth}px + 5vh)`);

        $("#stopwatchPage #selectAthletePage .button_box").empty();
        $("#stopwatchPage #selectAthletePage .subheading_text").empty();

        // generate a list of athletes for the user to select
        dbConnection.selectValues("SELECT *, athlete.rowid FROM athlete", []).then((athletes) => {
            if (athletes != false) {
                $("#stopwatchPage #selectAthletePage .subheading_text").remove();
                ButtonGenerator.generateButtonsFromDatabase("#stopwatchPage #selectAthletePage .button_box", athletes, (athlete) => {
                    this.startSelectEventPage(athlete, (event, athlete) => {
                        this.saveTime(event, athlete);
                    })
                }, ["gender", "unit", "is_relay", "timestamp", "id_backend"], {}, "lname");
            } else {
                $("#stopwatchPage #selectAthletePage .subheading_text").html(`
                You have no athletes on your team yet. Go to the Team page and invite some athletes to join!
                `)
            }
        });
    }

    /**
     * @description this function is called when the user chooses an event to save 
     * 
     * the eventConfig object needs to have a few properties
     * 
     * selectedEvent: "32" -> a rowid
     * 
     * This function will also save any split times associated with an event if they are 
     * present in the eventConfig. It will loop through all of them and save them for the particular athlete
     * Keep in mind that the athlete is the only thing that should really differ. The configuration shouldn't change much
     * 
     * @param {Object} event the event configuration to save for
     * @param {Object} athlete the event to for
     */
    saveTime(eventConfig, athlete) {


        if (this.pageTransition.currentPage != "landingPage") {
            this.pageTransition.slideRight("landingPage");
        }

        // console.log("EVENT: " + JSON.stringify(eventConfig));

        let eventRowid = eventConfig.selectedEvent;

        // Define default values, then use actual values in loop below after server response
        let recordData = {
            "value": 0.000, // Clock gets reset before call can complete, so use backend value below
            "id_record_definition": 1,
            "is_practice": 1,
            "last_updated": this.getCurrentDateTime()
        };

        let linkData = {
            "id_backend": athlete.id_backend
        };


        if (NetworkInfo.isOnline()) {
            // Save the record first so the frontend will have a matching id to the backend
            RecordBackend.saveRecord(this.clock.seconds, eventRowid, athlete.id_backend, (response) => {

                console.log("RECORD SAVED " + JSON.stringify(response));

                if (response.status > 0) { // If success, insert into local database

                    let newRecord = {};

                    // Loop through each added record and save to local database
                    for (let r = 0; r < response.addedRecords.length; r++) {
                        newRecord = response.addedRecords[r];

                        // record
                        recordData["id_record"] = Number(newRecord.id_record);
                        recordData["value"] = Number(newRecord.value);
                        recordData["id_record_definition"] = Number(newRecord.id_recordDefinition);
                        dbConnection.insertValuesFromObject("record", recordData);

                        // record_user_link
                        linkData.id_record = Number(newRecord.id_record);
                        dbConnection.insertValuesFromObject("record_user_link", linkData);
                        
                        // If it's a single record, return from this function since no more
                        // processing needs to be done
                        if(!eventConfig.isSplits) {
                            return;
                        }
                        
                        // check to see if there are any splits. If so save those with this record.

                        if (Object.keys(eventConfig.splitTimes) != 0) {
                            // console.log("there are splits!");
                            let athleteSplits = eventConfig.splitTimes[eventRowid][athlete.id_backend];

                            // loop through every split for the athlete. n will be equal to the number of splits that were requested
                            // for instance if the user wants a split at the 100 and the 200, n = 2
                            for (let i = 0; i < athleteSplits.length; i++) {
                                // this is the time in seconds for the split
                                let athleteSplitTime = Number(athleteSplits[i]);
                                let splitName = String(eventConfig.selectedSplits[eventRowid][i]);
                                
                                // Add the split to the backend, then store the id_split in frontend
                                RecordBackend.addSplit(newRecord.id_record, athleteSplitTime, splitName, -1, -1, (response) => {
                                    if(response.status > 0) {
                                        let splitObject = response.addedSplit;
                                        splitObject["id_split"] = Number(splitObject["id_split"]);
                                        splitObject["id_record"] = Number(splitObject["id_record"]);
                                        splitObject["value"] = Number(splitObject["value"]);
                                        splitObject["split_name"] = splitObject["name"];
                                        splitObject["split_index"] = Number(splitObject["splitIndex"]);
                                        splitObject["last_updated"] = this.getCurrentDateTime();
                                        delete splitObject["name"];
                                        delete splitObject["splitIndex"];
                                        delete splitObject["id_user"];
                                        
                                        // insert the record into the database
                                        dbConnection.insertValuesFromObject("record_split", splitObject);
                                    }
                                });
                                
                                // insert the record into the database
                                // dbConnection.insertValuesFromObject("record_split", recordSplit);
                            }
                        } else {
                            // console.log("No split times for " + athlete.fname + "; not saving times for them");
                        }
                    }
                } else {
                    console.log("Error while saving value to backend");
                }
            }); // end of saveRecord
            // the phone is offline, save it to the local database for later use.
        } else {

            recordData["id_record"] = Number(this.offlineRecordRowid);
            recordData["value"] = Number(this.clock.seconds);
            recordData["id_record_definition"] = Number(eventRowid);
            dbConnection.insertValuesFromObject("offline_record", recordData);

            linkData["id_record"] = Number(this.offlineRecordRowid);
            dbConnection.insertValuesFromObject("offline_record_user_link", linkData);

            this.offlineRecordRowid += 1;
        }


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
    
    // Used to set last_updated of records; formatted "year/mm/dd hr:mm:ss"
    getCurrentDateTime() {
        let dateObj = new Date();
        let updateTime = dateObj.getFullYear() + "-";
        updateTime = updateTime + ((dateObj.getMonth() + 1) < 10 ? "0" : "") + (dateObj.getMonth() + 1) + "-";
        updateTime = updateTime + (dateObj.getDate() < 10 ? "0" : "") + dateObj.getDate() + " ";
        updateTime = updateTime + (dateObj.getHours() < 10 ? "0" : "") + dateObj.getHours() + ":";
        updateTime = updateTime + (dateObj.getMinutes() < 10 ? "0" : "") + dateObj.getMinutes() + ":";
        updateTime = updateTime + (dateObj.getSeconds() < 10 ? "0" : "") + dateObj.getSeconds();
        return updateTime;
    }
    
}
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
        this.isSlideupActive = false;
        this.isSlideupTransitioning = false;

        this.stopButtonPath = "img/stop_button.png";
        this.playButtonPath = "img/play_button.png";
        this.upArrowPath = "img/up_arrow_transparent.png";
        this.downArrowPath = "img/down_arrow_transparent.png";

        this.defaultSlideupText = "Choose An Event";
        this.currentSlideupText = this.defaultSlideupText;

        this.selectedAthleteId = null;
        this.selectedRecordDefinitionId = null;
        this.selectedRecordDefinitionGender = null;

        this.landingPageSelector = "#stopwatchPage #landingPage";
        this.carouselContainerSelector = `${this.landingPageSelector} #slideup_content`;

        this.defaultStopwatchToggleFunction = () => {
            this.toggleStopwatch();
        };

        this.unsavedEventsQuery = (`
            SELECT record_definition.record_identity, record_definition.rowid from record_definition
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
            radius: 100,
            pointSize: 7,
            centerX: 0,
            centerY: 0,
            font: "30px Arial",
            textHeight: 0,
            fillStyle: "dd3333",
            circleColor: "#dd3333",
            dotColor: "#000000",
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
        
        this.setupStopwatch(this.defaultStopwatchToggleFunction);

        this.setupSlideup();

        // $(`${this.landingPageSelector} .table_container`).addClass("hidden");
    }

    stop() {
        this.resetSlideup();
        // TODO: stop is called multiple times on startup, stop that, also lower slideup on switch
    }

    /**
     * @description retreive the context for the canvas and setup necessary event listeners
     */
    setupStopwatch(stopCallback) {

        if (this.c == null || this.ctx == null) {
            this.c = $("#stopwatch_canvas")[0];
            this.ctx = this.c.getContext("2d");
        }

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


            // $("#stopwatch_reset").click((e) => {
            //     e.preventDefault();
            //     this.resetStopwatch(this.clock, this.ctx);
            // });

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
                this.ctx.clearRect(0, 0, this.c.width, this.c.height);
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
            this.resetStopwatch();
            this.resetSlideup();
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
        if(this.isSlideupTransitioning) {
            return;
        }

        this.isSlideupTransitioning = true;

        // slide down
        if (this.isSlideupActive) {

            this.lowerSlideup(onFinishCallback);
            // slide up
        } else {
            
            if(this.selectedRecordDefinitionId == null) {
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

        if(this.isSlideupActive) {
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

                if(_this.selectedRecordDefinitionGender) {

                    if(_this.selectedRecordDefinitionGender == 'm') {
                        $("#slideup").addClass('male_color');
                    } else if(_this.selectedRecordDefinitionGender == 'f') {
                        $("#slideup").addClass('female_color');
                    }
                    // on both genders selected
                } else if(_this.selectedRecordDefinitionGender == '') {
                    $("#slideup").addClass('slideup_both_genders');
                } else {
                    $("#slideup").addClass('slideup_contracted');
                }

                onFinishCallback();
            }
        });
    }

    startSlideupForEvents(callback) {

        $(`${this.landingPageSelector} #slideup_content`).html(`
            <div class="toggle_box">
                <div class="boys_box"><div>
                <div class="girls_box"><div>
            </div>
        `);

        // select both genders by default
        let isBoys = true;
        let isGirls = true;

        // Toggle boys
        ButtonGenerator.generateToggle(`${this.landingPageSelector} #slideup_content .boys_box`, "Include Boys", () => {
            isBoys = true;
        }, () => {
            isBoys = false;
        });


        // Toggle girls
        ButtonGenerator.generateToggle(`${this.landingPageSelector} #slideup_content .girls_box`, "Include Girls", () => {
            isGirls = true;
        }, () => {
            isGirls = false;
        });     

        dbConnection.selectValues(this.unsavedEventsQuery, ["second"]).then((record_definitions) => {

            if (record_definitions != false) {
                ButtonGenerator.generateButtonsFromDatabase(`${this.landingPageSelector} #slideup_content`, record_definitions, (record_definition) => {

                    let gender = '';

                    if(isBoys && !isGirls) {
                        gender = 'm';
                    } else if(!isBoys && isGirls) {
                        gender = 'f';
                    } else {
                        gender = '';
                    }

                    this.currentSlideupText = record_definition.record_identity
                    this.selectedRecordDefinitionGender = gender;

                    let onSlideDoneFunction = function() {
                        callback(record_definition, gender);
                    }.bind(this);
                    
                    this.toggleSlideup(onSlideDoneFunction);
                }, ["id_record_definition", "value", "is_split",
                    "id_relay", "id_relay_index", "last_updated", "unit"
                ], Constant.eventColorConditionalAttributes, "class");

                $(`${this.landingPageSelector} #slideup_content`).append("<br><br><br><br><br><br>");
            } else {
                if (DO_LOG) {
                    console.log("record_definition table is empty");
                }
                Popup.createConfirmationPopup("Something went very wrong, try restarting the app :(", ["Ok"], () => {});
            }
        });
    }

    /**
     * This function will populate the slideup for the given event.
     * This will also start the stopwatch.
     * @param {Number} record_definition this is the id of the event that will be loaded
     * @param {string} gender gender of athletes to load possible values: 'm' 'f' or ''
     */
    startSlideupForAthletes(record_definition, gender) {

        $("#stopwatchPage #stopwatch_canvas").after(`
            <div class="missing_info_text">Tap clcock to start. <br> Tap twice to reset.</div>
        `);

        setTimeout(() => {
            $("#stopwatchPage .missing_info_text").fadeOut(Constant.popupFadeoutDuration, function() {
                $(this).remove();
            });
        }, Constant.popupFadeoutDelay);

        

        $(`${this.landingPageSelector} #slideup_content`).empty();
        
        // set watch to slide up, then only change stopwatch
        this.setupStopwatch(() => {
            this.toggleStopwatch();

            if(!this.isSlideupActive) {
                this.toggleSlideup();
            }
        });

        let genderConditionalQuery = "";
        let eventConditionalQuery = "WHERE record.id_record_definition = ?";
        let savedRecordsArray = [];
        let unsavedRecordsArray = [];

        // set specific gender query
        if(gender != undefined || gender != null) {
            if(gender == 'm' || gender == 'f') {
                genderConditionalQuery = "WHERE athlete.gender = ?";
                eventConditionalQuery = "AND record.id_record_definition = ?";

                savedRecordsArray = [gender, record_definition.rowid];
                unsavedRecordsArray = [gender, gender, record_definition.rowid];
                // gender not selected, only use record definition to select
            } else {
                savedRecordsArray = [record_definition.rowid];
                unsavedRecordsArray = [record_definition.rowid];
            }
        }

        // query for athletes with saved records which orders them by value
        let savedRecordsQuery = (`
            SELECT fname, lname, athlete.id_backend, gender, athlete.rowid from athlete
            INNER JOIN record_user_link
            ON record_user_link.id_backend = athlete.id_backend
            INNER JOIN record
            ON record_user_link.id_record = record.id_record
            ${genderConditionalQuery} ${eventConditionalQuery}
            GROUP BY athlete.lname
            ORDER BY record.value DESC
        `);

        // query for athletes with no records saved in the event at all
        let unsavedRecordsQuery = (`
            SELECT fname, lname, athlete.id_backend, gender, athlete.rowid from athlete
            ${genderConditionalQuery} 
            EXCEPT
            SELECT fname, lname, athlete.id_backend, gender, athlete.rowid from athlete
            INNER JOIN record_user_link
            ON record_user_link.id_backend = athlete.id_backend
            INNER JOIN record
            ON record_user_link.id_record = record.id_record
            ${genderConditionalQuery} ${eventConditionalQuery}
            GROUP BY athlete.lname
            ORDER BY athlete.lname ASC
        `);

        let savedRecordsPromise = dbConnection.selectValues(savedRecordsQuery, savedRecordsArray);
        let unsavedRecordsPromise = dbConnection.selectValues(unsavedRecordsQuery, unsavedRecordsArray);
        
        let isSavedRecordsEmpty = false;
        let isUnsavedRecordsEmpty = false;

        Promise.all([savedRecordsPromise, unsavedRecordsPromise]).then((athletesArray) => {
            
            // check to see if both saved and unsaved queries are empty

            if((athletesArray[0] == false || athletesArray[0].length == undefined)) {
                isSavedRecordsEmpty = true;
            }

            if((athletesArray[1] == false || athletesArray[1].length == undefined)) {
                isUnsavedRecordsEmpty = true;
            }

            for (let i = 0; i < athletesArray.length; i++) {
                const athletes = athletesArray[i];
                

                if(isSavedRecordsEmpty && i == 0) {
                    continue;
                } 
                
                if(isUnsavedRecordsEmpty && i == 1) {
                    continue;
                }


                ButtonGenerator.generateButtonsFromDatabase(`${this.landingPageSelector} #slideup_content`, athletes, (athlete) => {
                    this.saveTime(record_definition, athlete);
                    
                    $(`${this.landingPageSelector} #slideup_content #${athlete.id}`).remove();

                    let nAthletesRemaining = $(`${this.landingPageSelector} #slideup_content > button`).length;

                    if(nAthletesRemaining == 0) {
                        this.selectedRecordDefinitionId = null;
                        this.selectedRecordDefinitionGender = null;
                        let eventName = this.currentSlideupText;
                        
                        this.currentSlideupText = this.defaultSlideupText;
                        this.toggleSlideup();
                        this.resetStopwatch();

                        Popup.createConfirmationPopup(`Successfully saved times for the ${eventName}!`, ["Ok"], [() => {
                        }]);

                        // stop here
                    }

                }, ["gender", "unit", "is_relay", "timestamp", "id_backend"], Constant.genderColorConditionalAttributes)

                if(i == 0 && (!isUnsavedRecordsEmpty && !isSavedRecordsEmpty)) {
                    $(`${this.landingPageSelector} #slideup_content`).append(`<br><br><br><hr style="height: 8px;">`);
                }
            }

            if(isSavedRecordsEmpty && isUnsavedRecordsEmpty) {
                $("#slideup").removeClass('male_color');
                $("#slideup").removeClass('female_color');
                $("#slideup").addClass('slideup_contracted');
                this.resetStopwatch();
                this.resetSlideup();
                Popup.createConfirmationPopup("You're not on a team yet! Go to the team tab and become a part of a team to start recording times.", ["Ok"], [() => {
                }]);

                return;
            }


            $(`${this.landingPageSelector} #slideup_content`).append("<br><br><br><br><br><br>");
        });
        

    }

    generateCarousel(element, array, isRecordDefinitions) {

        $(element).html(`
            <div class="carousel_container">

                <div class="carousel_arrow arrow_left">\<</div>
                <div class="carousel_arrow arrow_right">\></div>

                <div class="carousel_content" id="carousel_content">

                </div>
            </div>
        `);

        for (let i = 0; i < array.length; i++) {
            // generate items for events 
            if (isRecordDefinitions) {
                $(`${this.landingPageSelector} #carousel_content`).append(`
                    <div index="${i}" class="carousel_item ${array[i].class}">
                        ${array[i].innerHTML}
                    </div>
                `);
                // athletes
            } else {
                $(`${this.landingPageSelector} #carousel_content`).append(`
                    <div index="${i}" class="carousel_item ${array[i].class}">
                        ${array[i].fname} ${array[i].lname}
                    </div>
                `);
            }
        }

        $(`${this.landingPageSelector} #carousel_content`).append(`
            <div class="carousel_item_empty"></div>
        `);

        // set css for the left and right buttons
        $(`${this.landingPageSelector} .carousel_content`).css("min-width", `calc(15em * ${array.length})`);
        $(`${this.landingPageSelector} .carousel_content`).css("marginLeft", "15em");

        let clickedIndex = -1;

        $(`${this.landingPageSelector} .arrow_left`).click((e) => {
            if (clickedIndex > -1) {
                clickedIndex = clickedIndex - 1;
                $(`${this.landingPageSelector} .carousel_content`).css("marginLeft", -15 * clickedIndex + "em");
            }
        });

        $(`${this.landingPageSelector} .arrow_right`).click((e) => {
            if (clickedIndex < array.length - 3) {
                clickedIndex = clickedIndex + 1;
                $(`${this.landingPageSelector} .carousel_content`).css("marginLeft", -15 * clickedIndex + "em");
            }
        });

        let _this = this;

        // user clicks on an event to lock, lower the slider!
        $(`${this.landingPageSelector} .carousel_item`).click(function (e) {
            // get the object corresponding to button in list
            let arrayObject = array[Number($(this).attr("index"))];

            // generate for events
            if (isRecordDefinitions) {
                _this.selectedRecordDefinitionId = arrayObject.id;
                _this.currentSlideupText = arrayObject.innerHTML;
                _this.selectedRecordDefinitionGender = arrayObject.gender
                _this.toggleSlideup();
                // generate for athlete
            } else {
                
                _this.saveTime(arrayObject, arrayObject); // Save before resetting stopwatch
                
                // on last athlete save
                if(Number($(this).parent().children().length) - 2 == 0) {
                    _this.resetStopwatch();
                    Popup.createConfirmationPopup(`Successfully saved times for the ${_this.currentSlideupText}!`, ["Ok"], [function() {
                        _this.resetSlideup();
                        _this.toggleSlideup();
                    }]);
                }

                // if (clickedIndex < array.length - 3) {
                //     clickedIndex = clickedIndex + 1;
                //     $(`${_this.landingPageSelector} .carousel_content`).css("marginLeft", -5 * clickedIndex + "em");
                // }

                // _this.saveTime(arrayObject, arrayObject);
                $(this).remove();
            }
        });
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
        this.clock.isRunning = false;

        this.ctx.clearRect(0, 0, 400, 400);
        this.drawCircle();
        this.drawPoint(this.clock.initialAngle, 1);

        let resetText = "0.00";

        this.ctx.fillText(resetText, this.clock.centerX - (this.ctx.measureText(resetText).width / 2),
            this.clock.centerY + (this.clock.textHeight / 2));

        this.stopStopwatch();
        this.setupStopwatch(this.defaultStopwatchToggleFunction);

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
                }, ["gender", "unit", "is_relay", "timestamp", "id_backend"], Constant.genderColorConditionalAttributes, "lname");
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
    startSelectEventPage(athlete = undefined, callback = () => {}) {

        this.pageTransition.slideLeft("selectEventPage");
        // While transitioning, scroll to the top
        $("#stopwatchPage").animate({
            scrollTop: 0
        }, 1000);
        let headerWidth = $("#stopwatchPage #selectEventPage > .generic_header").height();
        $("#stopwatchPage #selectEventPage > *:not(.generic_header)").first().css("margin-top", `calc(${headerWidth}px + 5vh)`);

        // $("#stopwatchPage #selectEventPage #saved_events_box").empty();
        $("#stopwatchPage #selectEventPage #new_events_box").empty();


        // get any unique entries in record identity with values
        // user selects an existing event
        // dbConnection.selectValues(this.savedEventsQuery, [athlete.rowid]).then((events) => {
        //     if ((events.length == 0) || (events == false)) {
        //         return;
        //     }

        //     ButtonGenerator.generateButtonsFromDatabase("#stopwatchPage #selectEventPage #saved_events_box", events, (event) => {
        //         callback(event, athlete);
        //     }, ["id_record_definition", "value",
        //         "is_split", "id_relay", "id_relay_index", "last_updated", "unit"
        //     ], Constant.eventColorConditionalAttributes, "class");
        // });

        // get a list of every event definition and take away the ones with records already
        // User selects a new event that the athlete is not already registered in
        dbConnection.selectValues(this.unsavedEventsQuery, ["second"]).then((record_definitions) => {
            if (record_definitions != false) {
                ButtonGenerator.generateButtonsFromDatabase("#stopwatchPage #selectEventPage #new_events_box", record_definitions, (record_definition) => {
                    callback(record_definition, athlete);
                }, ["id_record_definition", "value", "is_split",
                    "id_relay", "id_relay_index", "last_updated", "unit"
                ], Constant.eventColorConditionalAttributes, "class");
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
            if (response.status > 0) { // If success, insert into local database
                // Define default fallback values, then use actual values in loop below
                let recordData = {
                    "value": 0.000, // Clock gets reset before call can complete, so use backend value below
                    "id_record_definition": 1,
                    "is_practice": true,
                    "is_split": false,
                    "id_split": null,
                    "id_split_index": null,
                    "last_updated": Date.now()
                };
                let linkData = {
                    "id_backend": athlete.id_backend
                };
                let newRecord = { };
                
                // Loop through each added record and save to local database
                // TODO: Change backend to link users with the record for relays... this will get messy
                for(let r = 0; r < response.addedRecords.length; r++) {
                    newRecord = response.addedRecords[r];
                    
                    // record
                    recordData["id_record"] = Number(newRecord.id_record);
                    recordData["value"] = Number(newRecord.value);
                    recordData["id_record_definition"] = Number(newRecord.id_recordDefinition);
                    dbConnection.insertValuesFromObject("record", recordData);
                    
                    // record_user_link
                    linkData.id_record = Number(newRecord.id_record);
                    dbConnection.insertValuesFromObject("record_user_link", linkData);
                }
                
                // Loop through each added record ID and save to local database
                // TODO: Change backend to link users with the record for relays... this will get messy
                // for (let r = 0; r < response.addedRecordIds.length; r++) {
                //     recordData["id_record"] = response.addedRecordIds[r];
                //     dbConnection.insertValuesFromObject("record", recordData);

                //     linkData.id_record = response.addedRecordIds[r];
                //     dbConnection.insertValuesFromObject("record_user_link", linkData);
                // }
            } else {
                if(DO_LOG) {
                    console.log("[stopwatch.js:saveTime()]: Unable to save time to backend");
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
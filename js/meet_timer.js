
let timer_isCallbacksLoaded = false;

/**
 * this will be responsable for handling the timer page
 */
function TimerPage() {

    // this is the meet that will display after first loading
    let display_meet;

    // load the ui for the meet
    this.loadMeetUI = function (meet_id) {
        $("#app").empty();
        // let meet_name_format = meet.meet_name.replace(/ /g, "<br>");

        $("#app").append(`
            <div class="timer_meet_name_container">
                ${display_meet.meet_name}
            </div>

            <div class="timer_meet_start_container">
                <button class="timer_meet_begin">Begin Meet</button><br>
                <button class="timer_meet_list">Select Meet</button>
                <button class="timer_meet_begin_practice">Start A Practice Meet</button>
            </div>
        `);
    }

    // shows events that are registered for meet
    this.loadEventsUI = function() {

    }


    // main timer application
    this.loadTimerUI = function(event_id) {
        $("#app").empty();

        $("#app").append(`
        
        `);
    }

    // get the meet that will display on the screen from db
    this.getDisplayedMeet = (meet_id) => {
        // retrieve a specific meet
        if (meet_id !== undefined) {
            sw_db.getMeet(meet_id).then((meet) => {
                console.log("displaying: " + meet.meet_name);
                display_meet = JSON.stringify(JSON.parse(meet));
                this.loadMeetUI();
            }).catch(function () {
                console.log("The meet you specified currently does not exist");
            });
        } else {
            sw_db.getNextMeet().then((meet) => {

                if(meet === false) {
                    // createConfirmationPopup("You don't have any meets schedualed, to start recording stats for your team, start by creating a meet")
                    // TODO go directly to timer
                }

                console.log("displaying: " + meet.meet_name);

                display_meet = meet;

                this.loadMeetUI();
            }).catch(function () {
                console.log("could not retreive next meet. No future meets found");
            });
        }
    }


    if (!timer_isCallbacksLoaded) {
        $(document).on("click", ".timer_meet_begin", () => {
            this.loadTimerUI();
        });

        $(document).on("click", ".timer_meet_list", () => {
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
                        <div id="timer_meet_container_${i}" class="timer_meet_container">${name}</div><br>
                    `);

                    // create callback for each button to reset the ui with specified meet
                    $(document).on("click", `#timer_meet_container_${i}`, () => {
                        console.log("load meet " + name);
                        display_meet = meets.item(i);
                        this.loadMeetUI();
                    });
                }

            }).catch(function () {
                console.log("something went wrong");
            });

        });

        $(document).on("click", ".timer_meet_begin_practice", () => {

        });

        timer_isCallbacksLoaded = true;
    }

    // $("#app").append(`
    //     <div id="button_container" style="margin-bottom: 4em;">
    //         <button id="start_stop">Start Timer</button> 
    //     </div>
    // `);


    // $("#start_stop").click((e) => { 
    //     e.preventDefault();

    //     let start = Date.now();

    //     $("#start_stop").html("Record Time");
    //     $("#button_container").append(`<p id="timer_time" style="font-size: 3em;"></p>`);

    //     // update the timer display and clear it once we are out of athletes
    //     let timerInterval = setInterval(function() {
    //         let epoch = (Date.now() - start) / 1000;
    //         let minutes = Math.floor(epoch / 60);
    //         let seconds = epoch - (minutes * 60);
    //         $("#timer_time").html(`${minutes}:${seconds.toFixed(2)}`);
    //         // $("#timer_time").html(epoch);
    //         if($(".athlete_container").length === 0 || $(".athlete_container").length === null) {
    //             $("#timer_time").html(`Race Finished in ${minutes}:${seconds.toFixed(2)}`);
    //             clearInterval(timerInterval);
    //         }
    //     }, 0);

    //     // remove the original event handler
    //     $("#start_stop").off('click');

    //     $("#start_stop").click((e) => { 
    //         e.preventDefault();

    //         if($(".athlete_container").length === 0) {
    //             return;
    //         }

    //         // select an athlete if none are
    //         if(_this.selectedAthlete === null) {
    //             _this.selectedAthlete = $(".athlete_container").first();
    //             _this.selectedAthleteName = $(".athlete_container").first().html().substring(0, $(".athlete_container").first().html().indexOf(":")).trim();
    //         }

    //         $(_this.selectedAthlete).remove();

    //         if($(".athlete_container").length === 0) {
    //             return;
    //         }

    //         // set the selected athlete to the next one in line
    //         _this.selectedAthlete = $(".athlete_container").first();
    //         let htmlContent = $(".athlete_container").first().html();
    //         _this.selectedAthleteName = htmlContent.substring(0, $(".athlete_container").first().html().indexOf(":")).trim();

    //         // remove the background on the rest of the div's
    //         let athletes = document.getElementsByClassName("athlete_container");
    //         for (let i = 0; i < athletes.length; i++) {
    //             $(athletes[i]).css("background-color", "transparent");
    //         }

    //         // set the selected background
    //         $(_this.selectedAthlete).css("background-color", "red");
    //     });
    // });

    // $(".athlete_container").click(function(e) { 
    //     e.preventDefault();

    //     // the name of the althlete
    //     _this.selectedAthleteName = $(this).html().substring(0, $(this).html().indexOf(":")).trim();
    //     _this.selectedAthlete = this;

    //     // remove all selected colors then change selected to red
    //     let athletes = document.getElementsByClassName("athlete_container");
    //     for (let i = 0; i < athletes.length; i++) {
    //         $(athletes[i]).css("background-color", "transparent");
    //     }

    //     $(_this).css("background-color", "red");
    // });

    this.getDisplayedMeet();
}
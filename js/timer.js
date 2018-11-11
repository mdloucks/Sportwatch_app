
/**
 * this will be responsable for handling the timer page
 */
function TimerPage() {

    $("#app").empty();

    sw_db.getNextMeet().then(function(meet) {

        let meet_name_format = meet.meet_name.replace(/ /g, "<br>");

        $("#app").append(`
            <div class="timer_meet_name_container">
                ${meet.meet_name}
            </div>

            <div class="timer_meet_start_container">
                <button class="timer_meet_begin">Begin</button><br>
                <button class="timer_meet_list">View Meets</button>
            </div>
        `);
    }).catch(function() {

    });

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
}
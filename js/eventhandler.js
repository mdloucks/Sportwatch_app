
/////////////////////////
// DEPRECATED
/////////////////////////

// /**
//  * this will be used for handling events across every state
//  * each method name will be prefixed with the state that method 
//  * is operating under
//  * 
//  * It is important to not have an infinite callback to where 
//  * you nest the same functions within each other!
//  * 
//  * there will also be a few buffer objects within this to serve as temporary storage for the state
//  */
// let EventHandler = {

//     // a temporary place for storage between the event handlers
//     timer_tmp : {
//     },

//     timer_startButton(e) {
//         e.preventDefault();

//         let start = Date.now();

//         $("#start_stop").html("Record Time");
//         $("#button_container").append(`<p id="timer_time" style="font-size: 3em;"></p>`);

//         // update the timer display and clear it once we are out of athletes
//         let timerInterval = setInterval(function() {
//             let epoch = (Date.now() - start) / 1000;
//             let minutes = Math.floor(epoch / 60);
//             let seconds = epoch - (minutes * 60);
//             $("#timer_time").html(`${minutes}:${seconds.toFixed(2)}`);
//             // $("#timer_time").html(epoch);
//             if($(".athlete_container").length === 0 || $(".athlete_container").length === null) {
//                 $("#timer_time").html(`Race Finished in ${minutes}:${seconds.toFixed(2)}`);
//                 clearInterval(timerInterval);
//             }
//         }, 0);

//         // remove the original event handler
//         $("#start_stop").off('click');

//         $("#start_stop").click((e) => { 
//             e.preventDefault();

//             if($(".athlete_container").length === 0) {
//                 return;
//             }

//             let epoch = (Date.now() - start) / 1000;
//             let minutes = Math.floor(epoch / 60);
//             let seconds = epoch - (minutes * 60);

//             // select an athlete if none are
//             if(this.timer_tmp.selectedAthlete === null) {
//                 this.timer_tmp.selectedAthlete = $(".athlete_container").first();
//                 is.timer_tmp.selectedAthleteName = $(".athlete_container").first().html().substring(0, $(".athlete_container").first().html().indexOf(":")).trim();
//             }
            
//             $(this.timer_tmp.selectedAthlete).remove();

//             if($(".athlete_container").length === 0) {
//                 return;
//             }

//             // set the selected athlete to the next one in line
//             this.timer_tmp.selectedAthlete = $(".athlete_container").first();
//             let htmlContent = $(".athlete_container").first().html();
//             this.timer_tmp.selectedAthleteName = htmlContent.substring(0, $(".athlete_container").first().html().indexOf(":")).trim();

//             let athletes = document.getElementsByClassName("athlete_container");
//             for (let i = 0; i < athletes.length; i++) {
//                 $(athletes[i]).css("background-color", "transparent");
//             }
    
//             $(this.timer_tmp.selectedAthlete).css("background-color", "red");
//         });
//     },

//     timer_athleteButton(e, _this) {
//         e.preventDefault();
//         // let target = event.target || event.srcElement;
//         this.timer_tmp.selectedAthleteName = $(_this).html().substring(0, $(_this).html().indexOf(":")).trim();
//         console.log(this.timer_tmp.selectedAthleteName);
//         this.timer_tmp.selectedAthlete = _this;

//         // remove all selected colors then change selected to red
//         let athletes = document.getElementsByClassName("athlete_container");
//         for (let i = 0; i < athletes.length; i++) {
//             $(athletes[i]).css("background-color", "transparent");
//         }

//         $(_this).css("background-color", "red");
//     }
// }
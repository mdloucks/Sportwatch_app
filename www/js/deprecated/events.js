function eventsPage() {

    let event_list = [];
    let _this = this;

    this.addEvent = function () {
        throw new Error("addEvent is not yet initialized in eventsPage");
    }

    this.onAddEvent = (cb) => {
        this.addEvent = cb;
    }

    this.addAthlete = function () {
        throw new Error("addAthlete is not yet initialized in eventsPage");
    }

    this.onAddAthlete = (cb) => {
        this.addAthlete = cb;
    }

    // TODO check which sport the user has selected
    // and make decision based on that 

    $("#app").html(`        
        <h1>Track Events<button id="event_track_add" class="event_track_add">&#43;</button></h1><br>
        <div class="event_container"></div>
    `);
    
    CSSManager.resetStyling();
    CSSManager.addStylesheet("events.css");
    
    // check if there are meets registered
    sw_db.getNumberOfMeets().then((length) => {
        // TODO: add popup for this!
        if (length > 0) {
            this.loadEvents();
        } else if (length === 0) {
            // TODO add popup
            $("#app").append(`
                <p id="warning_add_meet">Looks like you don't have any meets schedualed, return to the meets page and add a meet before you add an event</p>
            `);
        }
    }).catch(function () {
        // TODO redirect the user to the meets page
    });

    // load events from db and display them
    this.loadEvents = () => {
        sw_db.getEvent("*").then((events) => {

            //load the elements on the app
            for (let i = 0; i < events.length; i++) {

                let id_meet = events.item(i).id_meet;
                let name = events.item(i).event_name;
                let gender = events.item(i).gender;

                event_list.push({
                    "id_meet": id_meet,
                    "name": name,
                    "gender": gender,
                    "id_event": events.item(i).rowid,
                    "index": i
                });

                $("#app").append(`
                    <div id="event_subcontainer_${i}" class="event_subcontainer">
                        ${name + " " + gender}
                        <button class="event_delete" id="event_delete_${i}">Delete Event</button>
                    </div><br>
                    <div id="event_athlete_container_${i}" class="event_athlete_container"></div> 
                `);

                // bind event handlers to delete button
                $(`#event_delete_${i}`).click((e) => {
                    e.preventDefault();

                    $(`#event_subcontainer_${i}`).remove();
                    $(`#event_athlete_container_${i}`).remove();
                    sw_db.deleteEvent([events.item(i).rowid]);
                });
            }

            this.loadAthletes();

        }).catch((error) => {
            console.log(error);
        });
    }

    /**
     * this function will load the athletes into their respective event boxes
     */
    this.loadAthletes = () => {

        // get athletes registered in an event, will not fire unless there are registered athletes
        sw_db.getAthletesInEvents().then((athletes) => {
            // no athletes for that event
            if (athletes !== false) {

                // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                // generate the buttons for each athlete for each event
                // this is fairly slow being a nested for loop O(n^2)
                //.............................................................................................
                for (let i = 0; i < event_list.length; i++) {

                    for (let a = 0; a < athletes.length; a++) {

                        // check if the athletes 
                        if (athletes.item(a).id_event === event_list[i].id_event) {

                            let fname = athletes.item(a).fname;
                            let lname = athletes.item(a).lname;

                            $(`#event_athlete_container_${event_list[i].index}`).append(`
                                <div id="event_athlete_subcontainer_${event_list[i].index}_${a}" class="event_athlete_subcontainer">
                                    ${fname + " " + lname}
                                </div>
                                <button id="event_athlete_delete_${event_list[i].index}_${a}" class="event_athlete_delete">X</button> 
                            `);

                            // delete individual athlete in event
                            $(`#event_athlete_delete_${event_list[i].index}_${a}`).click(function (e) { 
                                e.preventDefault();

                                console.log("deleting " + event_list[i].index);

                                $(`#event_athlete_subcontainer_${event_list[i].index}_${a}`).remove();
                                $(`#event_athlete_delete_${event_list[i].index}_${a}`).remove();
                                sw_db.deleteAthleteInEvent(athletes.item(a).rowid, event_list[i].id_event);
                            });
                        }
                    }                 
                }

                // generate empty athlete boxes to append buttons to
            } else {
                // no athletes registered
            }

            // add an add button for each event container
            event_list.forEach(event => {
                
                $(`#event_athlete_container_${event.index}`).append(`
                    <br><button id="event_athlete_add_${event.index}" class="event_athlete_add">Add Athlete</button>
                `);

                $(`#event_athlete_add_${event.index}`).click((e) => {
                    e.preventDefault();
                    this.addAthlete(event);
                });                    
            });
        }).catch(function () {
            // TODO catch
            console.log("could not load the athletes from each event");
        });
    }


    $("#event_track_add").click((e) => {
        e.preventDefault();
        this.addEvent("add_track_event");
    });

    $("#field_events_add").click((e) => {
        e.preventDefault();
        this.addEvent("add_field_event");
    });

    $("#cross_events_add").click((e) => {
        e.preventDefault();
        this.addEvent("add_cross_event");
    });

    // &#9660; down facing arrow


    // generate events list

    // <div>&#9658; 800m Splits 400m Add Athlete</div>
    // <div></div>

    // continue using this
    // https://www.w3schools.com/jquery/tryit.asp?filename=tryjquery_slide_down
}
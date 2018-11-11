function eventsPage() {

    this.addEvent = function () {
        throw new Error("addEvent is not yet initialized in eventsPage");
    }

    this.onAddEvent = (cb) => {
        this.addEvent = cb;
    }

    
    // TODO check which sport the user has selected
    // and make decision based on that 

    $("#app").html(`        
        <h1>Track Events<button id="event_track_add" class="event_track_add">&#43;</button></h1><br>
        <div class="event_container"></div>
    `);
    // $("#app").append(`        
    //     <h1>Field Events</h1>
    //     <button id="field_events_add" class="addButton">&#43;</button>
    //     <hr>
    // `);
    // $("#app").append(`       
    //     <h1>Cross Country Events</h1>
    //     <button id="cross_events_add" class="addButton">&#43;</button>
    //     <hr>
    //     <div id="field_events"></div>
    // `);

    // check if there are meets registered
    sw_db.getNumberOfMeets().then(function(length) {
        // TODO: add popup for this!
        if(length > 0) {
            loadContent();
        } else if(length === 0) {
            // TODO add popup
            $("#app").append(`
                <p id="warning_add_meet">Looks like you don't have any meets schedualed, return to the meets page and add a meet before you add an event</p>
            `);
        }

    }).catch(function() {
        // TODO catch stuff
    });

    function loadContent() {
        // generate events
        sw_db.getEvent("*").then((events) => {

            if(events.length === 0) {
                $("#app").append(`
                    <p id="warning_add_events">Looks like you don't have any events schedualed, hit the arrow to add your first event!</p>
                `);
                return;
            } else {
                $("#warning_add_events").remove();
            }
            
            //load the elements on the app
            for (let i = 0; i < events.length; i++) {
            
                
                let id_meet = events.item(i).id_meet;
                let name = events.item(i).event_name;
                let gender = events.item(i).gender;

                $("#app").append(`
                    <div class="event_subcontainer" id="event_subcontainer_${i}">${name + " " + gender}
                    <button class="event_delete" id="delete_event_${i}">Delete Event</button>
                    <div><br>  
                `);

                // bind event handlers to delete button
                $(`#delete_event_${i}`).click((e) => { 
                    e.preventDefault();
                    
                    $(`#event_subcontainer_${i}`).remove();
                    sw_db.deleteEvent([events.item(i).rowid]);
                });
            }

        }).catch((error) => {
            console.log(error);
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
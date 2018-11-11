function add_TrackEventPage() {
    this.addEvent = function () {
        throw new Error("addEvent is not yet initialized");
    }

    this.onEventAdded = (cb) => {
        this.addEvent = cb;
    }

    this.events = [
        "100m",
        "200m",
        "400m",
        "800m",
        "1600m",
        "3200m",
        "4x100m",
        "4x200m",
        "4x400m",
        "4x800m",
        "100m_hurdles",
        "300m_hurdles"
    ];

    let track_events_add_ui = "";
    let checked_events = [];

    track_events_add_ui += `
        <input type="checkbox" name="male">Male</input>
        <input type="checkbox" name="female">Female</input>
        <form id="track_events_form">
    `;
    
    // create list of buttons with same name and id as event
    for (let i = 0; i < this.events.length; i++) {
        let event_name = this.events[i];
        // replace the underscore with a space in the text. The id needs an underscore so it's valid
        track_events_add_ui += `<input id="event_${i}" type="checkbox" name="event" class="event_button" id="${event_name}">${event_name.replace(/_/g, " ")}</input><br>`;

        // add checked or unchecked boxes from the list when they are clicked
        $(document).on("change", `#event_${i}`, function () {
            // add or remove the event name from the checked list
            if (checked_events.includes(event_name)) {
                checked_events.splice(checked_events.indexOf(event_name), 1);
            } else {
                checked_events.push(event_name);
            }
        });
    }

    track_events_add_ui += `<button type="submit">Add Event</button>`;
    track_events_add_ui += `</form>`;

    $("#app").html(track_events_add_ui);

    $("#track_events_form").on("submit", (e) => {
        e.preventDefault();


        sw_db.getNextMeet().then((meet) => {

            if(meet === undefined) {
                console.log("oh heck naw");
            }

            console.log("retrieved meet data");

            // add an event for each checked list
            for (let i = 0; i < checked_events.length; i++) {

                if ($("input[name=male]:checked").length > 0) {
                    sw_db.addEvent([meet.rowid, checked_events[i], "m"]);
                    // console.log(`INSERT ${meet.rowid + " " + checked_events[i] + " " + "m"}`);
                }

                if ($("input[name=female]:checked").length > 0) {
                    sw_db.addEvent([meet.rowid, checked_events[i], "f"]);
                    // console.log(`INSERT ${meet.rowid + " " + checked_events[i] + " " + "f"}`);
                }
            }

            this.addEvent();

        }).catch(function () {
            console.log("Could not retrieve the next chronological event.");
        });
    });
}
function add_CrossEventPage() {
    this.addEvent = function () {
        throw new Error("addEvent is not yet initialized");
    }

    this.onEventAdded = (cb) => {
        this.addEvent = cb;
    }

    this.events = [
        "3km",
        "4km",
        "5km",
        "8km",
        "10km"
    ];

    let cross_events_add_ui = "";
    let checked_events = [];

    cross_events_add_ui += `
        <input type="checkbox" name="male">Male</input>
        <input type="checkbox" name="female">Female</input>
        <form id="cross_events_form">
    `;

    // create list of buttons with same name and id as event
    for (let i = 0; i < this.events.length; i++) {
        let event_name = this.events[i];
        // replace the underscore with a space in the text. The id needs an underscore so it's valid
        cross_events_add_ui += `<input id="event_${i}" type="checkbox" name="event" class="event_button" id="${event_name}">${event_name}</input><br>`;

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

    cross_events_add_ui += `<button type="submit">Add Event</button>`;
    cross_events_add_ui += `</form>`;

    $("#app").html(cross_events_add_ui);

    $("#cross_events_form").on("submit", function (e) {
        e.preventDefault();

        sw_db.getNextMeet().then(function (meet) {

            if(meet === undefined) {
                console.log("oh heck naw");
            }

            console.log("retrieved meet data");

            // add an event for each checked list
            for (let i = 0; i < checked_events.length; i++) {

                if ($("input[name='male']:checked").length > 0) {
                    sw_db.addEvent(meet.rowid, checked_events[i], "m");
                    console.log("added men's " + checked_events[i] + " for " + meet.meet_name);
                }

                if ($("input[name='female']:checked").length > 0) {
                    sw_db.addEvent(meet.rowid, checked_events[i], "f");
                    console.log("added men's " + checked_events[i] + " for " + meet.meet_name);
                }
            }

        }).catch(function () {
            console.log("Could not retrieve the next chronological event.");
        });
    });
}
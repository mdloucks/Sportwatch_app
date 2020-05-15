function events_add_athletePage(event) {

    this.addAthlete = function () {
        throw new Error("addAthlete is not yet initialized in events_add_athlete");
    }

    this.onAddAthlete = (cb) => {
        this.addAthlete = cb;
    }

    $("#app").html(`
        <div id="events_add_athlete_counter">
            Choose Athletes
        </div>
    `);

    this.athletes = [];
    this.selected_athletes = [];
    this.event = event;

    // console.log(JSON.stringify(event));


    /**
     * populate the athletes array with all of the athletes in the database
     */
    this.fetchAthletes = () => {
        sw_db.getAthletesAndEventsByGender(event.gender).then((values) => {

            // seperate athletes and events into respective arrays
            athlete_data = values[0];
            event_data = values[1];

            if (athlete_data === false || athlete_data === undefined) {
                console.log("no athletes");
                // TODO: leave blank page or tell user to go to athletes page
                return;
            }

            for (let i = 0; i < athlete_data.length; i++) {

                let isInEvent = false;

                // loop through all event data and see if an athlete is in the selected one before appending them to the add list
                if (event_data !== false && event_data !== undefined) {

                    for (let c = 0; c < event_data.length; c++) {
                        
                        // check if 1. it's the same event as this and 2. if the athlete is in this event
                        if (event_data.item(c).id_event === event.id_event && athlete_data.item(i).rowid == event_data.item(c).id_athlete) {
                            isInEvent = true;
                            break;
                        }
                    }
                }

                if(isInEvent) {
                    continue;
                }

                let fname = athlete_data.item(i).fname;
                let lname = athlete_data.item(i).lname;
                let grade = athlete_data.item(i).grade;
                let gender = athlete_data.item(i).gender;
                let rowid = athlete_data.item(i).rowid;

                // TODO add onclick name goto their events
                this.athletes.push({
                    "fname": fname,
                    "lname": lname,
                    "grade": grade,
                    "gender": gender,
                    "rowid": rowid,
                });
            }
            this.generateAthletes();
        });
    }

    /**
     * this takes loops through  the athletes and generates html and callbacks for each of them
     */
    this.generateAthletes = () => {
        for (let i = 0; i < this.athletes.length; i++) {

            $("#app").append(`
                <div id="events_add_athlete_athlete_container_${i}" class="athlete_athlete_entry_${event.gender === "m" ? "male" : "female"}">
                    <span class="athlete_information">${this.athletes[i].fname} ${this.athletes[i].lname} ${this.athletes[i].grade} ${this.athletes[i].gender}</span>
                </div>
            `);

            // change color of athlete box when clicked
            $(`#events_add_athlete_athlete_container_${i}`).click((e) => {
                e.preventDefault();
                let index = this.selected_athletes.indexOf(this.athletes[i]);

                // change styling and add or remove the item from the array if clicked
                if (index === -1) {
                    this.selected_athletes.push(this.athletes[i]);
                    $(`#events_add_athlete_athlete_container_${i}`).addClass("athlete_athlete_entry_selected").removeClass(`athlete_athlete_entry_${event.gender === "m" ? "male" : "female"}`);
                } else {
                    this.selected_athletes.splice(index, 1);
                    $(`#events_add_athlete_athlete_container_${i}`).addClass(`athlete_athlete_entry_${event.gender === "m" ? "male" : "female"}`).removeClass("athlete_athlete_entry_selected");
                }
            });
        }

        $("#app").append(`
            <br>
            <button class="sw_button" id="events_add_athlete_add_selected">Add Selected Athletes</button><br><br>
            <button class="sw_button" id="events_add_athlete_cancel_selected">cancel</button>
        `);


        // insert selection in the database and return to events page
        $("#events_add_athlete_add_selected").click((e) => {
            e.preventDefault();
            this.selected_athletes.forEach(athlete => {
                let isRelay = false;
                if (event.name.endsWith("relay")) {
                    isRelay = true;
                }

                sw_db.addAthleteEvent([athlete.rowid, event.id_event, isRelay]);
            });

            this.addAthlete();
        });

        // no action and return to events page
        $("#events_add_athlete_cancel_selected").click((e) => {
            e.preventDefault();
            this.addAthlete();
        });
    }

    this.fetchAthletes();
}
function meetsPage() {

    this.addMeet = function () {
        throw new Error("onAddMeet NOT DEFINED YET");
    }

    this.onAddMeet = (cb) => {
        this.addMeet = cb;
    }

    this.meets = [];


    $("#app").empty();
    $("#app").html(`
        <button style="background: lightgray; border-radius: 15px; font-size: 1.5em";" id="add_meet">Add Meet</button>
        <hr>
    `);

    sw_db.getMeet("*").then((meets) => {
        if (meets !== null) {
            for (let i = 0; i < meets.length; i++) {
                let name = meets.item(i).meet_name;
                let time = meets.item(i).meet_time;
                let address = meets.item(i).meet_address;

                this.meets.push([name, time, address])

                $("#app").append(`
                    <div id="meet_container_${i}" style="background: gray; border-radius: 20px; margin: auto; width: 75%; margin-top: 1em;">
                        <span id="meet_${i}" style="font-size:3em;">${name}</span>
                        <button id="meet_exit_${i}" style="background: black; color: white; margin-left: 2em; margin-bottom: 0.75em; border-radius: 20px;">X</button>
                    </div>
                    <div id="meet_info_${i}" style="display: none; font-size: 2em">${address} at ${time}</div>
                `);

                $(`meet_info_${i}`).hide();

                $(`#meet_${i}`).click(function (e) { 
                    e.preventDefault();

                    if($(`#meet_info_${i}`).is(":visible")) {
                        $(`#meet_info_${i}`).slideUp(250);
                    } else {
                        $(`#meet_info_${i}`).slideDown(250);
                    }
                });

                $(`#meet_exit_${i}`).click((e) => { 
                    e.preventDefault();
                    $(`#meet_container_${i}`).remove();
                    $(`#meet_info_${i}`).remove();

                    console.log("deleteing " + JSON.stringify(this.meets[i]));
                    // remove from database
                    sw_db.deleteMeet(this.meets[i]).then(function() {
                        console.log("could not delete meet :(");
                    });
                });
            }
        } else {
            $("#app").append(`<h2>There are currently no meets registered for you</h2>`);
        }
    }).catch(function () {

    });

    $("#add_meet").click((e) => {
        e.preventDefault();
        this.addMeet();
    });
}
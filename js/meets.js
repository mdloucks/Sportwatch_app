function meetsPage() {

    this.addMeet = function () {
        throw new Error("onAddMeet NOT DEFINED YET");
    }

    this.onAddMeet = (cb) => {
        this.addMeet = cb;
    }

    this.meet_list = [];

    $("#app").empty();
    $("#app").html(`
        <button id="meet_add">Add Meet</button>
        <hr>
    `);

    // TODO MAKE SURE MEET IS IN THE FUTURE!
    sw_db.getMeet("*").then((meets) => {
        if (meets !== null) {
            for (let i = 0; i < meets.length; i++) {
                let name = meets.item(i).meet_name;
                let time = meets.item(i).meet_time;
                let address = meets.item(i).meet_address;

                this.meet_list.push([name, time, address])

                $("#app").append(`
                    <div class="meet_container" id="meet_container_${i}"">
                        <span class="meet_name" id="meet_${i}">${name}</span>
                        <button class="meet_delete" id="meet_exit_${i}">X</button>
                    </div>
                    <div class="meet_info" id="meet_info_${i}">${address} at ${time}</div>
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

                    console.log("deleteing " + JSON.stringify(this.meet_list[i]));
                    // remove from database
                    sw_db.deleteMeet(this.meet_list[i]).then(function() {
                        console.log("could not delete meet :(");
                    });
                });
            }
        } else {
            $("#app").append(`<h2>There are currently no meets registered for you</h2>`);
        }
    }).catch(function () {

    });

    $("#meet_add").click((e) => {
        e.preventDefault();
        this.addMeet();
    });
}
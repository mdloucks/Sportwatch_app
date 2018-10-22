function add_MeetPage() {

    this.addMeet = function () {
        throw new Error("onAddMeet NOT DEFINED YET");
    }

    this.onMeetAdded = (cb) => {
        this.addMeet = cb;
    }

    $("#app").html(`
        <form id="add_meet_form">
        Name<input id="meet_name" type="text"></input>
        Time<input id="meet_time" type="datetime-local"></input>
        Address<input id="meet_address" type="text"></input>
        <button type="submit">Add Meet</button>
        </form>
        <hr>    
    `);

    $("#add_meet_form").on("submit", () => {
        let name = $("#meet_name").val();
        let time = $("#meet_time").val();
        let address = $("#meet_address").val();

        sw_db.addMeet([name, time, address]);
        this.addMeet();
    });
}
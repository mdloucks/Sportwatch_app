/**
 * this will be used for an easy interface for all of the athletes on the team
 */
function athletePage() {

    let _this = this;

    this.loadContent();

    // switch to new scene basically
    $("add_athlete").click(function (e) {
        e.preventDefault();
        // https://codepen.io/w3programmings/pen/zzRKpy COOL STUFFS
        $("#app").html(`
            <form>
                <input type="text" name="fname"></input>
                <input type="text" name="lname"></input>
                <input type="radio" name="grade"></input>
                <input type="text"></input>
            </form>
        `);
    });

    this.loadContent = function() {
        $("#app").html(`
            <button id="add_athlete">Add Athlete</button>
        `);

        let db = new DatabaseConnection();
        // TODO ADD reject
        db.getAthlete("*").then(function(athletes) {
            for (let index = 0; index < athletes.length; index++) {
                // TODO add onclick name goto their events
                $("#app").append(`
                    <p>${athletes.item(index).fname} ${athletes.item(index).lname} ${athletes.item(index).grade} ${athletes.item(index).gender}</p>
                `);
            }
        });
    }
}
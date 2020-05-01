/**
 * @classdesc The team page will house everything from the team roster, join and create functionallity, individual athletes, and a team code.
 * @class
 */
class Team extends Page {

    constructor(id) {
        super(id, "Team");
    }

    start() {
        $("#app").html("<h1>This is the team page!</h1>");

        let style = document.getElementById("style_team");
        style.disabled = false;
    }

    stop() {
        let style = document.getElementById("style_team");
        style.disabled = true;
    }
}
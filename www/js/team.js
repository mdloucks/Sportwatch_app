/**
 * @classdesc The team page will house everything from the team roster, join and create functionallity, individual athletes, and a team code.
 * @class
 */
class Team extends Page {

    constructor(id) {
        super(id, "Team");
    }
    
    getHtml() {
        return (`
            <div id="teamPage" class="div_page">
                <br><br>
                <h1>Team Page</h1>
                <br>
                <p>Coming Soon!</p>
            </div>
        `);
    }
    
    start() {
        // $("#app").html("<h1>This is the team page!</h1>");

        let style = document.getElementById("style_team");
        style.disabled = false;
    }

    stop() {
        let style = document.getElementById("style_team");
        style.disabled = true;
    }
}
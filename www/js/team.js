/**
 * The team page will house everything from the team roster, join and create functionallity,
 * individual athletes, and a team code.
 */
let team = {
    /**
     * @returns {function} the function that is called when the page changes.
     */
    initTeam: function () {
        $("#app").html("<h1>This is the team page!</h1>");

        let style = document.getElementById("style_team");
        style.disabled = false;

        let exit_callback = function () {
            style.disabled = true;
        }

        return exit_callback;
    }
}
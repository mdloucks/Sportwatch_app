/**
 * @classdesc This is the stats page
 * @class
 */
class Stats extends Page {

    constructor(id) {
        super(id, "Stats");
    }

    start() {
        $("#app").html("<h1>This is the stats page!</h1>");

        let style = document.getElementById("style_stats");
        style.disabled = false;
    }

    stop() {
        let style = document.getElementById("style_stats");
        style.disabled = true;
    }
}
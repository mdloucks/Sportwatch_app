/**
 * @classdesc This is the stats page
 * @class
 */
class Stats extends Page {

    constructor(id) {
        super(id, "Stats");
    }

    getHtml() {
        return (`
            <div id="statsPage" class="div_page">
                <br><br>
                <h1>This is the Stats page!</h1><br><br>
                <div class="button_box"></div>
            </div>
        `);
    }

    start() {

        let names = [
            "James",
            "Marcus",
            "Sam",
            "Jack",
            "Joe",
            "Brad",
            "Billy",
            "Clyde"
        ];

        ButtonGenerator.generateButtons("#statsPage > .button_box", "stats_button", names, function (name) {
            console.log("howdy " + name);
        });
    }

    stop() {
    }
}
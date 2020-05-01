/**
 * @classdesc Template for each of our main pages.
 * @class
 */
class Page {
    constructor(id = -1, name = "Unnamed") {
        this.name = name;
        this.id = id;
    }

    /**
     * @description This is the first method that is called when the page is first constructed.
     */
    start() {
        console.log("//////////////////////////////////////////////////////");
        console.log(`This is the default start function for ${this.name} OVERRIDE ME!`);
        console.log(".....................................................");

        $("#app").html(`<h1>This is a blank page named ${this.name}`);
    }

    /**
     * @description This is called when the page is being switched
     */
    stop() {
        console.log("//////////////////////////////////////////////////////");
        console.log(`This is the default stop function for ${this.name} OVERRIDE ME!`);
        console.log(".....................................................");

        $("#app").empty();
    }
}
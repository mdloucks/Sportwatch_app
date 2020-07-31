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
     * Returns the HTML content for the page which will be added into the page
     * transition object for swiping. NOTE: Html should be surrounded in a div
     * with the page id. Ex:  <div id="settingsPage"> ... </div>
     */
    getHtml() {
        console.log("//////////////////////////////////////////////////////");
        console.log(`This is the default getHtml function for ${this.name} OVERRIDE ME!`);
        console.log(".....................................................");
        return (`<div id="blankPage><h1>Blank page named ${this.name}</h1></div>`);
    }
    
    /**
     * @description This is the first method that is called when the page is first constructed.
     */
    start() {
        console.log("//////////////////////////////////////////////////////");
        console.log(`This is the default start function for ${this.name} OVERRIDE ME!`);
        console.log(".....................................................");

        // $("#app").html(`<h1>This is a blank page named ${this.name}`);
    }
    
    /**
     * @description This is called when the page is being switched
     */
    stop() {
        console.log("//////////////////////////////////////////////////////");
        console.log(`This is the default stop function for ${this.name} OVERRIDE ME!`);
        console.log(".....................................................");

        // $("#app").empty();
    }
}
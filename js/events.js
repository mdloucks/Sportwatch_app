function eventsPage() {

    this.addEvent = function () {
        throw new Error("addEvent is not yet initialized in eventsPage");
    }

    this.onAddEvent = (cb) => {
        this.addEvent = cb;
    }

    $("#app").html(`
        <h1>Track Events<button id="track_events_add" class="addButton">&#43;</button></h1>
        <hr>
        <div id="track_events"></div>
        <h1>Field Events<button id="field_events_add" class="addButton">&#43;</button></h1>
        <hr>
        <h1>Cross Country Events<button id="cross_events_add" class="addButton">&#43;</button></h1>
        <hr>
        <div id="field_events"></div>
    `);

    $("#track_events_add").click((e) => { 
        e.preventDefault();
        this.addEvent("add_track_event");
    });

    $("#field_events_add").click((e) => { 
        e.preventDefault();
        this.addEvent("add_field_event");
    });

    $("#cross_events_add").click((e) => { 
        e.preventDefault();
        this.addEvent("add_cross_event");
    });

    // &#9660; down facing arrow


    // generate events list

    // <div>&#9658; 800m Splits 400m Add Athlete</div>
    // <div></div>

    // continue using this
    // https://www.w3schools.com/jquery/tryit.asp?filename=tryjquery_slide_down

    CSSManager.styleEventsPage();
}
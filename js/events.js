function eventsPage() {
    $("#app").html(`
        <h1>Track Events<button id="track_events_add" class="addButton">&#43;</button></h1>
        <hr>
        <div id="track_events"></div>
        <h1>Field Events<button id="field_events_add" class="addButton">&#43;</button></h1>
        <hr>
        <div id="field_events"></div>
    `);

    $("#track_events_add").click(function (e) { 
        e.preventDefault();
        
    });

    $("#field_events_add").click(function (e) { 
        e.preventDefault();
        
    });

    CSSManager.styleEventsPage();
}


function accountPage() {

    this.signout = function () {
        throw new Error("SIGNOUT IS NOT SETUP");
    }

    this.onSignout = (callback) => {
        this.signout = callback;
    }

    // TODO remove dev stuff before launch
    // $("#app").html(`
    //     <button id="sign_out">Sign Out</button>

    //     <h2>Developer tools</h2>
    //     <hr>

    //     <p>Reinstantiate tables(wipes database)</p>
    //     <button id="create_tables">Create tables</button><br> 

    //     <p>Enter Database Command</p>
    //     <form id="database_command">
    //     <input id="db_command" type="text"></input>
    //     <input type="submit"></submit>
    //     </form>
    // `);
    
    // ---- PAGES ---- //
    
    var catagoryPage = (`
        <div id="catagoryPage" class="div_page">
            <p id="title"><u>Account Settings</u></p>
            <div id="cat_options">
                <!-- Buttons will be inserted here -->
            </div>
        </div>
    `);
    
    // TODO: Account settings, manage team page
    
    var devPage = (`
        <div id="devPage" class="div_page">
            <h2>Developer tools</h2>
            <br>

            <p>Reinstantiate tables(wipes database)</p>
            <button id="create_tables">Create tables</button><br> 

            <p>Enter Database Command</p>
            <form id="database_command">
            <input id="db_command" type="text"></input>
            <input type="submit"></submit>
            </form>
        </div>
    `);
    
    
    // ---- CATAGORY PAGE ---- //
    
    // Adds a new catagory button to the options
    this.addSettingCatagory = function(text, callback, container = "#cat_options") {
        
        var buttonHtml = "<button class=\"cat_button\"><p class=\"cat_desc\">" + text +
                        "</p><p class=\"cat_arrow\">&#9658</p></button><br>";
        $(container).append(buttonHtml);
        $(container + " button").last().click((e) => {
            e.preventDefault();
            callback();
        });
        
        // Add animation
        $(container + " button").last().click((e) => {
            // TOOD: Polish; make sure it's not just the <p> element
            e.preventDefault();
            $(e.target).css("background-color", "red");
        });
    }
    
    /**
     * Runs a sliding animation for the two div element id's specified.
     * 
     * @return Void
     * 
     * @example animateTransition("catagoryPage", "devPage");
     * 
     * @param prevPageId {String} current page (that will be replaced) id
     * @param newPageId {String} new page div's id
     * @param rightToLeft {Boolean} [default = true] animatino slide from
     * right to left?
     */
    this.animateTransition = function(prevPageId, newPageId, rightToLeft = true) {
        
        if(prevPageId.indexOf("#") == -1) {
            prevPageId = "#" + prevPageId;
        }
        if(newPageId.indexOf("#") == -1) {
            newPageId = "#" + newPageId;
        }
        
        // TODO: Implement rightToLeft logic
        
        $(prevPageId).animate(
            {right: "100%"},
            {duration: 200, queue: false, complete: 
                () => {
                    $(prevPageId).css("right", "");
                    $(prevPageId).css("left", "100%");
                }
            }
        );
        $(newPageId).animate(
            {left: "0%"},
            {duration: 200, queue: false}
        );
        
        
    }
    

    
    // TODO: Move to Account settings page
    // $("#sign_out").click((e) => { 
    //     e.preventDefault();
    //     localStorage.removeItem("SID");
    //     console.log("user signing out");
    //     this.signout();
    // });
    
    // ---- DEVELOPER PAGE ---- //
    
    $("#create_tables").click(function (e) { 
        e.preventDefault();
        sw_db.createNewTables();
    });

    $("#database_command").submit(function (e) { 
        e.preventDefault();
        console.log($('#db_command').val());
        sw_db.executeCommand($('#db_command').val());
    });
    
    // TOOD: Add back button
    
    
    // ---- MISC ---- //
    
    /**
     * Adds given html content to the app. Will assume all pages are not
     * primary unless otherwise specified.
     * 
     * @return Void
     * 
     * @example addPage(devPage);
     * @example addPage(catagoryPage, true);
     * 
     * @param content {String} HTML content for this page
     * @param isPrimary {Boolean} will this page be the focused / visible page
     * upon open?
     */
    this.addPage = function(content, isPrimary = false) {
        $("#app").append(content);
        if(!isPrimary) {
            // Find the id of the div
            divIndex = content.indexOf("<div");
            idIndex = content.indexOf("id=", divIndex);
            if((divIndex != -1) && (idIndex != -1)) {
                endIdIndex = content.indexOf(" ", idIndex);
                // +3 to remove "id="
                divId = content.substring(idIndex + 3, endIdIndex);
                divId = "#" + divId.replace(/\"/g, ""); // Remove all quotes
                
                // Actually perform the operations now
                $(divId).css("position", "absolute");
                $(divId).css("left", "100%");
                
            } else {
                console.log("Div or id index was invalid");
            }
        }
    }
    
    
    // ---- OPERATIONS ---- //
    
    // Add all the html pages here
    $("#app").html(""); // Clear html content
    //$("#app").append(devPage);
    this.addPage(devPage);
    //$("#app").append(catagoryPage); // Assign initial account page
    this.addPage(catagoryPage, true);
    
    
    this.addSettingCatagory("Account Settings", function () {
        console.log("Account Settings");
    });
    this.addSettingCatagory("Manage Team", function () {
        console.log("Manage Team");
    });
    this.addSettingCatagory("Developer Tools", () => {
        this.animateTransition("catagoryPage", "devPage");
    });
    
}
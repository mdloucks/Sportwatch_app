

function accountPage() {
    
    this.signout = function () {
        throw new Error("SIGNOUT IS NOT SETUP");
    }

    this.onSignout = (callback) => {
        this.signout = callback;
    }
    
    var currentPageId = "catagoryPage";
    
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
    
    // TODO: Remove before launch
    var devPage = (`
        <div id="devPage" class="div_page">
            <span class="back_arrow">&#8592</span>
            <br>
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
    
    // Adds a new catagory button to the options div
    this.addSettingCatagory = function(text, callback, container = "#cat_options") {
        
        var buttonHtml = "<button class=\"cat_button\"><p class=\"cat_desc\">" + text +
                        "</p><p class=\"cat_arrow\">&#9658</p></button><br>";
        $(container).append(buttonHtml);
        $(container + " button").last().click((e) => {
            e.preventDefault();
            // If button has not already been pressed
            if(!e.delegateTarget.classList.contains("cat_button_selected")) {
                callback();
            }
        });
        
        // Add animation
        $(container + " button").last().click((e) => {
            e.preventDefault();
            $(e.delegateTarget).addClass("cat_button_selected");
        });
    }
    
    /**
     * Runs a sliding animation for the two div element id's specified.
     * 
     * @return Void
     * 
     * @example animateTransition("catagoryPage", "devPage");
     * 
     * @param newPageId {String} new page div's id
     * @param rightToLeft {Boolean} [default = true] animatino slide from
     * right to left?
     */
    this.animateTransition = function(newPageId, rightToLeft = true) {
                
        let prevPageId = currentPageId;
        if(prevPageId.indexOf("#") == -1) {
            prevPageId = "#" + prevPageId;
        }
        if(newPageId.indexOf("#") == -1) {
            newPageId = "#" + newPageId;
        }
        
        // Prevent the double clicking of the button
        if(($(prevPageId).is(":animated")) || ($(newPageId).is(":animated"))) {
            return;
        }
        if (prevPageId == newPageId) {
            this.currentPageId = "#catagoryPage";
            console.log("Duplicate! New current page: " + this.currentPageId);
            return;
        }
        $(newPageId).removeClass("hidden");
        
        // TODO: Reset functions for each page
        
        if(rightToLeft) {
            $(newPageId).removeClass("page_right");
            $(prevPageId).addClass("page_left");
        } else if(!rightToLeft) {
            $(newPageId).removeClass("page_left");
            $(prevPageId).addClass("page_right");
        }
        
        // Is finishing 20% early, for some reason
        // $(prevPageId).on("transitionend", () => {
        //     console.log("Prev page finished " + $(prevPageId).css("left"));
            // $(prevPageId).addClass("hidden");
        //     currentPageId = newPageId;
        // });
        
        // Fixes the clipping / early animation finish
        $(newPageId).one("transitionend", () => {
            $(prevPageId).addClass("hidden");
            this.resetPage(prevPageId);
            currentPageId = newPageId;
        });
        
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
        
        // Find the id of the div
        let divIndex = content.indexOf("<div");
        let idIndex = content.indexOf("id=", divIndex);
        let divId = "";
        if ((divIndex != -1) && (idIndex != -1)) {
            endIdIndex = content.indexOf(" ", idIndex);
            // +3 to remove "id="
            divId = content.substring(idIndex + 3, endIdIndex);
            divId = "#" + divId.replace(/\"/g, ""); // Remove all quotes
        } else {
            console.log("Div or id index was invalid");
        }
        
        // Perform the operations now
        $(divId).addClass("current_page"); // Keep as "base" for simplicity
        if(!isPrimary) {
            $(divId).addClass("page_right");
            $(divId).addClass("hidden");
        }
    }
    
    // Have to use .on
    // https://stackoverflow.com/questions/19393656/span-jquery-click-not-working
    $("#app").on("click", ".back_arrow", (e) => {
        e.preventDefault();
        this.animateTransition("catagoryPage", false);
    });
    
    // Reset page functions
    this.resetPage = function (pageId) {
        if(pageId.includes("catagoryPage")) {
            $(".cat_button").removeClass("cat_button_selected");
        }
    }
    
    // TODO: Remove once page is complete
    this.dump = function(obj) {
        let out = '';
        for (let i in obj) {
            out += i + ": " + obj[i] + "\n";
        }
        console.log(out);
    }
    
    
    // ---- OPERATIONS ---- //
    
    // Add all the html pages here
    $("#app").html(""); // Clear html content
    this.addPage(devPage);
    this.addPage(catagoryPage, true);
    
    
    this.addSettingCatagory("Account Settings", function () {
        console.log("Account Settings");
    });
    this.addSettingCatagory("Manage Team", function () {
        console.log("Manage Team");
    });
    this.addSettingCatagory("Developer Tools", () => {
        this.animateTransition("devPage");
    });
    
}
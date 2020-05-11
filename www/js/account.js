/**
 * @classdesc this is the settings page for out app
 * @class
 */
class Account extends Page {

    constructor(id) {
        super(id, "Account");

        this.currentPageId = "catagoryPage";

        // ---- PAGES ---- //

        this.catagoryPage = (`
            <div id="catagoryPage" class="div_page">
                <p id="title"><u>Account Settings</u></p>
                <div id="cat_options">
                    <!-- Buttons will be inserted here -->
                </div>
            </div>
        `);


        // https://jsbin.com/lodusuyipo/edit?html,css,js,output
        this.settingsPage = (`
            <div id="settingsPage" class="div_page">
                <span class="back_arrow">&#8592</span>
                <br>
                <h2>Account Settings</h2>
                
                <!-- Add different settings here -->
                
            </div>
        `);

        // TODO: Manage team page

        // TODO: Remove before launch
        this.devPage = (`
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
    } // End of constructor

    getHtml() {
        return (`
            <div id="accountPage" class="div_page">
                ${this.catagoryPage}
                ${this.settingsPage}
                ${this.devPage}
            </div>
        `);
    }

    /**
     * @returns {function} the function that is called when the page changes.
     */
    start() {

        let style = document.getElementById("style_account");
        style.disabled = false;

        // Only add content if it isn't there yet (check if any catagories are there yet)
        if ($(".cat_button").length) {
            return;
        }

        this.addPage("#catagoryPage", true);
        this.addPage("#settingsPage");
        this.addPage("#devPage");

        // ---- OPERATIONS ---- //

        // Add all the html pages here
        // TODO: Make a proper fix for page length / screen (parent div expand with dropdowns)

        // Catagory Page
        this.addSettingCatagory("Account Settings", () => {
            this.animateTransition("settingsPage");
        });
        this.addSettingCatagory("Manage Team", () => {
            this.manageTeam();
        });
        this.addSettingCatagory("Developer Tools", () => {
            this.animateTransition("devPage");
        });

        // Account Page
        this.addSettingDropdown("Notification Preferences", "<p>Adjust preferences here</p><br> <p>WIP</p>", (wrapperDiv) => {
            // TODO: Adjust notification preferences
        });
        this.addSettingDropdown("Change Email Address", "<input type=\"text\" name=\"new_email\"><br> <p>WIP</p>", (wrapperDiv) => {
            // TODO: Update Email address based on input
        });
        this.addSettingDropdown("Update Phone Number", "<input type=\"text\" name=\"new_phone\"><br> <p>WIP</p>", (wrapperDiv) => {
            // TODO: Update Cell Phone Number based on input
        });
        this.addSettingDropdown("Change Password", "<input type=\"text\" name=\"current_password\"><br> " +
            "<input type=\"text\" name=\"new_password\"><br> <p>WIP</p>", (wrapperDiv) => {
                // TODO: Password based on input
            });
        this.addGenericButton("Sign Out", "#settingsPage", (e) => {
            localStorage.removeItem("SID");
            console.log("User signing out");
            this.signout();
        });
        this.addSettingDropdown("Delete Account", "<input type=\"text\" name=\"current_password\"><br> " +
            "<input type=\"text\" name=\"new_password\"><br> <p>WIP</p>", (wrapperDiv) => {
                // TODO: Delete Account if password matches
            });


        // ---- DEVELOPER PAGE LOGIC ---- //

        $("#create_tables").bind("touchend", (e) => {
            e.preventDefault();
            sw_db.createNewTables();
            console.log("Created new tables!");
        });

        $("#database_command").on("submit", function (e) {
            e.preventDefault();
            console.log($('#db_command').val());
            sw_db.executeCommand($('#db_command').val());
        });

        // ---- MISC PAGE LOGIC ---- //

        $(".back_arrow").bind("touchend", (e) => {
            e.preventDefault();
            this.animateTransition("catagoryPage", false);
        });

        // ---- CALLBACK / STATE BIND FUNCTIONS ---- //

        // this.signout = function () {
        //     throw new Error("SIGNOUT IS NOT SETUP");
        // }
        // this.onSignout = (callback) => {
        //     this.signout = callback;
        // }

        // this.manageTeam = function () {
        //     throw new Error("MANAGE TEAM IS NOT SETUP");
        // }
        // this.onManageTeam = function (callback) {
        //     this.manageTeam = callback;
        // }

    }

    stop() {
        // $("#app").off();
        // $("#accountPage").html(""); // Clear; start() will re-add pages
        // $("button").off();
        // $(".act_drop_button").off();
        // $("#database_command").off();

        // let style = document.getElementById("style_account");
        // style.disabled = true;
    }

    // ---- CATAGORY PAGE FUNCTIONS ---- //

    /**
     * Adds a button to a specific settings page with the provided text.
     * 
     * @return void
     * 
     * @example
     * this.addSettingCatagory("Account Settings", () => { alert("Account"); });
     * 
     * @param text {String} text of the button
     * @param callback {Function} callback when button is clicked
     * @param container {String} [default = "#cat_options"] div that buttons
     * will be added to
     */
    addSettingCatagory(text, callback, container = "#cat_options") {

        var buttonHtml = "<button class=\"cat_button\"><p class=\"cat_desc\">" + text +
            "</p><p class=\"cat_arrow\">&#9658</p></button><br>";
        $(container).append(buttonHtml);
        $(container + " button").last().bind("touchend", (e) => {
            e.preventDefault();
            // If button has not already been pressed
            if (!e.delegateTarget.classList.contains("cat_button_selected")) {
                callback();
            }
        });

        // Add color animation
        $(container + " button").last().bind("touchend", (e) => {
            e.preventDefault();
            $(e.delegateTarget).addClass("cat_button_selected");
        });
    }

    // ---- ACCOUNT PAGE ---- //

    /**
     * Adds a dropdown menu with a button "title".
     * 
     * @return Void
     * 
     * @example
     * this.addSettingsDropdown("Change Email", "<input type=\"text\" name=\"newEmail\"><br> <input type=\"submit\">", (wrapperDiv) => { ... });
     * 
     * @param buttonName {String} display name of button / dropdown
     * @param content {String} HTML content shown when drop is expanded
     * @param eventsCallback {Function} function used to handle click / submit
     * events for this dropdown only. MUST take wrapper div as parameter
     */
    addSettingDropdown(buttonName, content, eventsFunction) {

        let dropdownHtml = "<div class=\"act_drop_wrapper\"><button class=\"act_drop_button\">" +
            buttonName + "</button><div class=\"act_drop_content hidden\">" + content + "</div></div>";
        $("#settingsPage").append(dropdownHtml);

        $(".act_drop_button").last().bind("touchend", (e) => {
            let wrapperObj = $(e.target).parent();

            if (!$(wrapperObj).hasClass("dropdown_expanded")) { // Expand
                $(wrapperObj).addClass("dropdown_expanded");
                $(wrapperObj).children(".act_drop_button").addClass("drop_button_underline");
                $(wrapperObj).children(".act_drop_content").removeClass("hidden");

                $(wrapperObj).one("transitionend", () => {
                    $(wrapperObj).children(".act_drop_content").css("opacity", "1.0");
                });

            } else { // Minimize
                $(wrapperObj).children(".act_drop_content").css("opacity", "0.0");

                $(wrapperObj).children(".act_drop_content").one("transitionend", () => {
                    $(wrapperObj).removeClass("dropdown_expanded");
                    $(wrapperObj).children(".act_drop_content").addClass("hidden");
                    $(wrapperObj).children(".act_drop_button").removeClass("drop_button_underline");
                });
            }
        }); // End of button click handler

        eventsFunction($(".act_drop_wrapper").last()); // Bind the buttons

    }


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
    addPage(divId, isPrimary = false) {
        // $("#app").append(content);

        // // Find the id of the div
        // console.log(content);
        // let divIndex = content.indexOf("<div");
        // let idIndex = content.indexOf("id=", divIndex);
        // let divId = "";
        // if ((divIndex != -1) && (idIndex != -1)) {
        //     let endIdIndex = content.indexOf(" ", idIndex);
        //     // +3 to remove "id="
        //     divId = content.substring(idIndex + 3, endIdIndex);
        //     divId = "#" + divId.replace(/\"/g, ""); // Remove all quotes
        // } else {
        //     console.log("Div or id index was invalid");
        // }

        // Perform the operations now
        $(divId).addClass("current_page"); // Keep as "base" for simplicity
        if (!isPrimary) {
            $(divId).addClass("page_right");
            $(divId).addClass("hidden");
        }
    }

    /**
     * Runs a sliding animation for the two div element id's specified.
     * 
     * @return Void
     * 
     * @example animateTransition("catagoryPage", "devPage");
     * 
     * @param newPageId {String} new page div's id
     * @param rightToLeft {Boolean} [default = true] animation slide from
     * right to left?
     */
    animateTransition(newPageId, rightToLeft = true) {

        let prevPageId = this.currentPageId;
        if (prevPageId.indexOf("#") == -1) {
            prevPageId = "#" + prevPageId;
        }
        if (newPageId.indexOf("#") == -1) {
            newPageId = "#" + newPageId;
        }

        // Prevent the double clicking of the button
        if (($(prevPageId).is(":animated")) || ($(newPageId).is(":animated"))) {
            return;
        }
        if (prevPageId == newPageId) {
            this.currentPageId = "#catagoryPage";
            console.log("Duplicate! New current page: " + this.currentPageId);
            return;
        }
        $(newPageId).removeClass("hidden");

        if (rightToLeft) {
            $(newPageId).removeClass("page_right");
            $(prevPageId).addClass("page_left");
        } else if (!rightToLeft) {
            $(newPageId).removeClass("page_left");
            $(prevPageId).addClass("page_right");
        }

        // Hide old page once new page is in focus
        $(newPageId).one("transitionend", () => {
            $(prevPageId).addClass("hidden");
            this.resetPage(prevPageId);
            this.currentPageId = newPageId;
        });
    }

    /**
     * Resets a page back to its original look (i.e. reset pressed buttons)
     * Should be called when a page is opened
     * 
     * @return Void
     * 
     * @example
     * this.resetPage("catagoryPage");
     * 
     * @param pageId {String} id of the page's div
     */
    resetPage(pageId) {
        if (pageId.includes("catagoryPage")) {
            $(".cat_button").removeClass("cat_button_selected");
        } else if (pageId.includes("settingsPage")) {
            $(".act_drop_wrapper").removeClass("dropdown_expanded");
            $(".act_drop_button").removeClass("drop_button_underline");
            $(".act_drop_content").addClass("hidden");
            $(".act_drop_content").css("opacity", "0.0");
        }
    }

    /**
     * Adds generic, basic button the end end of the container.
     * 
     * @return Void
     * 
     * @example
     * this.addGenericButton("Sign Out", "#settingsPage", (e) => { console.log("Signed Out"); });
     * 
     * @param display {String} display text of button
     * @param container {String} identifier of HTML container
     * @param callback {Function} called when button is clicked
     * @param styleClass {String} [default = "generic_button"] styling class
     * applied to this button
     */
    addGenericButton(display, container, callback, styleClass = "generic_button") {

        let button = "<button class=\"" + styleClass + "\">" + display + "</button>";
        $(container).append(button);
        $(container + " button").last().bind("touchend", (e) => {
            e.preventDefault();
            if (!$(e.target).hasClass("generic_selected")) {
                $(e.target).addClass("generic_selected");
            } else {
                $(e.target).removeClass("generic_selected");
            }

            callback(e);
        });
    }

}






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
    
    // TODO: _+_+_++_ TRY THIS: https://api.jquery.com/animate/ _+_+_+_
    
    
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
        <h2>Developer tools</h2>
        <br>

        <p>Reinstantiate tables(wipes database)</p>
        <button id="create_tables">Create tables</button><br> 

        <p>Enter Database Command</p>
        <form id="database_command">
        <input id="db_command" type="text"></input>
        <input type="submit"></submit>
        </form>
    `);
    
    
    $("#app").html(catagoryPage); // Assign initial account page
    
    
    // ---- CATAGORY PAGE ---- //
    
    // Adds a new catagory button to the options
    this.addSettingCatagory = function(text, callback) {
        
        var buttonHtml = "<button class=\"cat_option\"><p class=\"cat_desc\">" + text +
                        "</p><p class=\"cat_arrow\">&#9658</p></button><br>";
        $("#cat_options").append(buttonHtml);
        $("#cat_options button").last().click((e) => {
            e.preventDefault();
            callback();
        });
        
    }
    
    this.addSettingCatagory("Account Settings", function() {
        console.log("Account Settings");
    });
    this.addSettingCatagory("Manage Team", function() {
        console.log("Manage Team");
    });
    this.addSettingCatagory("Developer Tools", function () {
        $("#app").html(devPage); // TODO: Make fancy slide transition
    });
    $(".cat_option").click((e) => {
        // TOOD: Polish; make sure it's not just the <p> element
        e.preventDefault();
        $(e.target).css("background-color", "red");
        console.log(e.target.nodeName);
    });
    
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
    
    
    
    
}
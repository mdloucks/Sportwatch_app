

function accountPage() {

    this.signout = function () {
        throw new Error("SIGNOUT IS NOT SETUP");
    }

    this.onSignout = (callback) => {
        this.signout = callback;
    }

    // TODO remove dev stuff before launch
    $("#app").html(`
        <h1>Welcome to the account page</h1>
        <button id="sign_out">Sign Out</button>

        <h2>Developer tools</h2>
        <hr>

        <p>Reinstantiate tables(wipes database)</p>
        <button id="create_tables">Create tables</button><br> 

        <p>Enter Database Command</p>
        <form id="database_command">
        <input id="db_command" type="text"></input>
        <input type="submit"></submit>
        </form>
    `);

    $("#sign_out").click((e) => { 
        e.preventDefault();
        localStorage.removeItem("SID");
        console.log("user signing out");
        this.signout();
    });

    $("#create_tables").click(function (e) { 
        e.preventDefault();
        sw_db.createNewTables();
    });

    $("#database_command").submit(function (e) { 
        e.preventDefault();
        console.log($('#db_command').val());
        sw_db.executeCommand($('#db_command').val());
    });
}
class App {

    constructor() {
        this.exit_callback = () => { };
    }

    initialize(params) {
        // bind sets the value of 'this' inside the function to this object
        document.addEventListener('deviceready', this.onReady.bind(this), false);
        document.addEventListener('pause', this.onPause.bind(this), false);
        document.addEventListener('resume', this.onResume.bind(this), false);
    }

    onReady() {
        console.log("DEVICE READY");
        sw_db.init();
        FastClick.attach(document.body);

        $(".loader").remove();
        
        let swipeTest = new SwipeHolder("#app");
        
        // TODO: pass a callback function into initNavbar to switch between pages
        navbar.initNavbar(this.switchPage.bind(this));
    }

    /**
     * This is called whenever the user switches to a new page and will receive
     * the name of of it in the "page" argument.
     * 
     * @param {string} page 
     */
    switchPage(page) {

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // This "exit_callback" is called in order to notify a page when switchPage is called
        // and allows them to make the appropriate changes through a function when it happens
        //.............................................................................................
        if (typeof exit_callback == "function") {
            exit_callback();
        }

        $("#app").empty();
        console.log(`switching to ${page}`);

        if (page == "stopwatch") {
            this.exit_callback = stopwatch.initStopwatch();
        } else if (page === "stats") {
            this.exit_callback = stats.initStats();
        } else if (page === "team") {
            this.exit_callback = team.initTeam();
        } else if (page === "account") {
            this.exit_callback = account.initAccount();
        } else {
            this.exit_callback = () => { };
        }
    }

    checkSession() {
        // // check if there's a session
        // if(Authentication.hasSession()) {
        //     Authentication.validateSID(Authentication.getSID()).then(function(response) {
        //         console.log("Login complete");
        //         StateManager.setState("home");
        //     }).catch(function(error) {
        //         // they have most likely have an invalid SID, so just wipe it and log them back in
        //         console.log("invalid sid: " + Authentication.getSID());
        //         localStorage.removeItem("SID");
        //         StateManager.setState("login");
        //     });
        // } else {
        // }
    }

    /**
     * check to make sure a few js things are avaliable
     */
    checkRequirements() {
    }



    onPause() {
        console.log("Device is paused");
    }

    onResume() {
        console.log("Device is resumed");
    }
}

// this is the main entry point for the app
let app = new App();
app.initialize();

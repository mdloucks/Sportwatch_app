class App {

    constructor() {
        this.exit_callback = () => { };
        this.swipeHandler;
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
        
        this.swipeHandler = new SwipeHolder("#app");
        
        // TODO: pass a callback function into initNavbar to switch between pages
        navbar.initNavbar(this.switchPage.bind(this));
        this.switchPage("stopwatch");
    }

    /**
     * This is called whenever the user switches to a new page and will receive
     * the name of of it in the "page" argument.
     * 
     * @param {string} page 
     */
    switchPage(page) {
        
        // Blur the page for a page change
        for (let c = 0; c < 101; c++) {
            $("#app").css("filter", "blur(" + (c / 2) + "px)"); // CSS3 Support
            $("#app").css("-webkit-filter", "blur(" + (c / 2) + "px)"); // Chrome, Safari
        }
        
        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        // This "exit_callback" is called in order to notify a page when switchPage is called
        // and allows them to make the appropriate changes through a function when it happens
        //.............................................................................................
        if (typeof exit_callback == "function") {
            exit_callback();
        }
        
        // Add delay for a smooth-ish transition from page to page
        setTimeout(() => {
            
            $("#app").empty();
            console.log(`switching to ${page}`);

            if (page == "stopwatch") {
                this.exit_callback = stopwatch.initStopwatch();
                
                navbar.focusButton("#stopwatch");
                this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPELEFT, () => {
                    this.switchPage("stats");
                });
            } else if (page === "stats") {
                this.exit_callback = stats.initStats();
                
                navbar.focusButton("#stats");
                this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPERIGHT, () => {
                    this.switchPage("stopwatch");
                });
                this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPELEFT, () => {
                    this.switchPage("team");
                });
            } else if (page === "team") {
                this.exit_callback = team.initTeam();
                
                navbar.focusButton("#team");
                this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPERIGHT, () => {
                    this.switchPage("stats");
                });
                this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPELEFT, () => {
                    this.switchPage("account");
                });
            } else if (page === "account") {
                this.exit_callback = account.initAccount();
                
                navbar.focusButton("#account");
                this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPERIGHT, () => {
                    this.switchPage("team");
                });
            } else {
                this.exit_callback = () => { };
                console.log(`[main.js:switchPage()]: Undefined page "${page}", ERRORS EXPECTED`);
            }
        }, 500);
        
        // Now unblur (since css transitions don't work well with filters)
        setTimeout(() => {
            for (let c = 100; c > -1; c--) {
                $("#app").css("filter", "blur(" + (c / 2) + "px)");
                $("#app").css("-webkit-filter", "blur(" + (c / 2) + "px)");
            }
        }, 1000);
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

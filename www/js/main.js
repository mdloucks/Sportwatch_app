class App {

    constructor() {
        this.pages = [];
        this.currentPageID = 0;
        this.navbar = new Navbar();
        this.swipeHandler = new SwipeHolder("#app");
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

        this.navbar.initNavbar(this.switchPage.bind(this));
        this.constructPages();
        this.initializeFirstPage();
    }

    /**
     * @description This will set the first page. It must be called before switching to another may happen.
     */
    initializeFirstPage() {
        this.setCurrentPageID(0);
        this.startCurrentPage();
    }

    /**
     * @description This is called whenever the user switches to a new page and will receive
     * the name of of it in the "page" argument.
     * 
     * @param {string} pageName 
     */
    switchPage(pageName) {
        console.log(`switching to ${pageName}`);
        $("#app").empty();
        this.transitionPage(pageName);
        this.StopPreviousPage();
        this.setCurrentPageID(this.getPage(pageName).id);
        this.startCurrentPage();
    }

    /**
     * @description Handle any transition display while moving from one page to another. 
     * @param {String} pageName name of the page to transition to
     */
    transitionPage(pageName) {
        // Blur the page for a page change
        for (let c = 0; c < 101; c++) {
            $("#app").css("filter", "blur(" + (c / 2) + "px)"); // CSS3 Support
            $("#app").css("-webkit-filter", "blur(" + (c / 2) + "px)"); // Chrome, Safari
        }

        // Add delay for a smooth-ish transition from page to page
        setTimeout(() => {

            if (pageName == "Stopwatch") {

                this.navbar.focusButton("#stopwatch");
                this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPERIGHT, () => { });
                this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPELEFT, () => {
                    this.switchPage("stats");
                });
            } else if (pageName === "Stats") {

                this.navbar.focusButton("#stats");
                this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPERIGHT, () => {
                    this.switchPage("stopwatch");
                });
                this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPELEFT, () => {
                    this.switchPage("team");
                });
            } else if (pageName === "Team") {

                this.navbar.focusButton("#team");
                this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPERIGHT, () => {
                    this.switchPage("stats");
                });
                this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPELEFT, () => {
                    this.switchPage("account");
                });
            } else if (pageName === "Account") {

                this.navbar.focusButton("#account");
                this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPERIGHT, () => {
                    this.switchPage("team");
                });
                this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPELEFT, () => { });
            } else {
                console.log(`[main.js:switchPage()]: Undefined page "${pageName}", ERRORS EXPECTED`);
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

    /**
     * @description create a new object for each page and populate the array.
     * 
     * @param {String} pageName The name of the page
     * 
     */
    constructPages(pageName) {
        this.pages = [Stopwatch, Stats, Team, Account].map((page, i) => new page(i));
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


    /**
     * Returns a page by passing in an integer id or string name
     * 
     * @throws an exception if the parameter is not an integer or string
     * 
     * @param {Number | String} identifier 
     */
    getPage(identifier) {
        if (typeof identifier == "string") {
            for (let i = 0; i < this.pages.length; i++) {
                if (this.pages[i].name == identifier) {
                    return this.pages[i];
                }
            }

            throw new Exception(`Could not find ${identifier} inside of pages`);
        } else if (typeof identifier == "number" && number.isInteger()) {
            for (let i = 0; i < this.pages.length; i++) {
                if (this.pages[i].id == identifier) {
                    return this.pages[i];
                }
            }

            throw new Exception(`Could not find ${identifier} inside of pages`);
        } else {
            throw new Exception(`Incorrect datatype entered for getPage, expected integer or string, you entered ${typeof identifier}`);
        }
    }

    setCurrentPageID(id) {
        this.currentPageID = id;
    }

    /**
     * @description invoke the start() method on the current page
     */
    startCurrentPage() {
        this.pages[this.currentPageID].start();
    }

    /**
     * @description invoke the stop() method on the previous page, provided this is called before updating the pageID
     */
    StopPreviousPage() {
        this.pages[this.currentPageID].stop();
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

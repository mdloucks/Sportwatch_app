class App {

    constructor() {
        this.pages = [];
        this.welcomePages = [];
        this.currentPageID = 0;
        this.activePageSet = 0; // 0=welcome, 1=main
        
        this.dbConnection;
        this.navbar = new Navbar();
        this.mainPageSet = new PageTransition();
        this.welcomePageSet = new PageTransition();
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
        this.dbConnection = new DatabaseConnection();
        this.dbConnection.createNewTables();
        this.dbConnection.insertDummyValues();
        FastClick.attach(document.body);

        $(".loader").remove();
        $("#app").html(""); // Clear so it's a clean slate to add to
        
        // Main page initialization
        this.navbar.initNavbar(this.switchPage.bind(this));
        $(".navbar").css("display", "none"); // Hide until page set is found
        this.swipeHandler = new SwipeHolder("#app"); // Has to be after onReady
        this.constructPages();
        // this.initializeFirstPage();
        
        // Welcome / login page initialization
        this.constructWelcomePageSet();
        
        this.determinePageSet();
        
    }
    
    /**
     * Attempts to log in the user based on SID. If invalid, it will
     * set the page set to the login / welcome pages
     */
    determinePageSet() {
        
        // If session is present, attempt to log in
        if(Authentication.hasSession()) {
            let sid = Authentication.getSID();
            // Authenticate and handle response (then = success)
            Authentication.validateSID(sid).then((response) => {
                console.log("[main.js:determinePageSet()] Valid log in data");
                this.setActivePageSet(1); // Bring to main screen
                return;
                
            }).catch((error) => {
                console.log("[main.js:determinePageSet()] Invalid SID, logging out");
            });
            
        } else {
            console.log("[main.js:determinePageSet()] No SID data");
        }
        
        this.setActivePageSet(0); // Default to login
    }
    
    /**
     * Sets the active page and calls all functions needed to prepare
     * for usability for the given set. Useful as a callback for logging
     * in or out as page sets change
     * 
     * @param {Integer} pageSetId page set id (0-1 inclusive)
     */
    setActivePageSet(pageSetId) {
        // First, hide all pages
        this.mainPageSet.hidePages();
        this.welcomePageSet.hidePages();
        
        if(pageSetId == 0) {        // Welcome
            this.welcomePageSet.showCurrentPage();
            this.welcomePages[0].start(); // TODO: clean this up
            this.welcomePages[1].start();
            this.activePageSet = 0;
        } else if(pageSetId == 1) { // Main
            this.mainPageSet.showCurrentPage();
            this.initializeFirstPage();
            this.activePageSet = 1;
        } else {
            console.log("[main.js:setActivePageSet()] Invalid page set Id: " + pageSetId);
            this.welcomePageSet.showCurrentPage();
            this.activePageSet = 0;
        }
    }
    
    /**
     * @description This will set the first page. It must be called before switching to another may happen.
     */
    initializeFirstPage() {
        this.setCurrentPageID(0);
        this.startCurrentPage();
        this.defineSwipes(0);
    }

    /**
     * @description This is called whenever the user switches to a new page and will receive
     * the name of of it in the "page" argument.
     * 
     * @param {string} pageName 
     */
    switchPage(pageName) {
        this.transitionPage(pageName);
        this.stopPreviousPage();
        this.setCurrentPageID(this.getPage(pageName).id);
        this.startCurrentPage();
    }

    /**
     * @description Handle any transition display while moving from one page to another. 
     * @param {String} pageName name of the page to transition to
     */
    transitionPage(pageName) {

        this.navbar.focusButton("#" + pageName.toLowerCase());
        if (this.getPage(pageName).id > this.currentPageID) {
            this.mainPageSet.slideLeft(pageName.toLowerCase() + "Page", 200);
        } else if (this.getPage(pageName).id < this.currentPageID) {
            this.mainPageSet.slideRight(pageName.toLowerCase() + "Page", 200);
        } else {
            console.log("[main.js:transitionPage()]: Tried to switch page! Page ID is already current!!");
        }
        this.defineSwipes(this.getPage(pageName).id);

    }

    /**
     * @description create a new object for each page and populate the array.
     * 
     * @param {String} pageName The name of the page
     * 
     */
    constructPages(pageName) {
        this.pages = [Stopwatch, Stats, Team, Account].map((page, i) => new page(i));
        this.pages.forEach((pageObj, pageIndex) => {
            let shouldShow = false; // Should be page be visible at start? (only for first page)
            if (pageIndex == 0) {
                shouldShow = true;
            }
            this.mainPageSet.addPage((pageObj.name.toLowerCase() + "Page"), pageObj.getHtml(), shouldShow);
        });
    }
    
    
    /**
     * Defines the mainPageSet actions for this page (left, right, moving)
     * 
     * @example this.defineSwipes(this.getPage(nextPage).id); --> sets up handlers for new / next page
     * 
     * @param {Ingeger} pageIndex the numerical index corresponding to pages Map object
     */
    defineSwipes(pageIndex) {

        // Going left (swiping right)
        if (pageIndex > 0) {
            this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPERIGHT, () => {
                this.switchPage(this.getPage(pageIndex - 1).name);
            });
        } else {
            // Blank since 0 is left-most page
            this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPERIGHT, () => { });
        }

        // Going right (swiping left)
        if (pageIndex < this.pages.length) {
            this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPELEFT, () => {
                this.switchPage(this.getPage(pageIndex + 1).name);
            });
        } else {
            this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPELEFT, () => { });
        }

        // Moving (Left / Right)
        // dx > 0 ==> Swiping right to left,   dx < 0 ==> Left to right
        this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.MOVE, (dx, dy) => {
            if ((dx > 0) && (pageIndex < this.pages.length - 1)) {
                this.mainPageSet.slidePageX(this.getPage(pageIndex + 1).name.toLowerCase() + "Page", true, Math.abs(dx));
            } else if ((dx < 0) && (pageIndex > 0)) {
                this.mainPageSet.slidePageX(this.getPage(pageIndex - 1).name.toLowerCase() + "Page", false, Math.abs(dx));
            } else {
                this.mainPageSet.slidePageX(this.getPage(pageIndex).name.toLowerCase() + "Page", true, 0);
            }
        });
        
        // If the gesture was classified as a tap, snap it back / reset it
        this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.TAP, () => {
            this.mainPageSet.slidePageX(this.getPage(pageIndex).name.toLowerCase() + "Page", true, 0);
        });

    }
    
    constructWelcomePageSet() {
        
        console.log("init welcome set");
        this.welcomePages = [Welcome, Signup, Login].map((page, i) => new page(i, this.welcomePageSet));
        this.welcomePages.forEach((pageObj, pageIndex) => {
            let shouldShow = false; // Should be page be visible at start? (only for first page)
            if (pageIndex == 0) {
                shouldShow = true;
            }
            this.welcomePageSet.addPage((pageObj.name.toLowerCase() + "Page"), pageObj.getHtml(), shouldShow);
        });
        
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

            throw new Error(`Could not find ${identifier} inside of pages`);
        } else if (typeof identifier == "number" && Number.isInteger(identifier)) {
            for (let i = 0; i < this.pages.length; i++) {
                if (this.pages[i].id == identifier) {
                    return this.pages[i];
                }
            }

            throw new Error(`Could not find ${identifier} inside of pages`);
        } else {
            throw new Error(`Incorrect datatype entered for getPage, expected integer or string, you entered ${typeof identifier}`);
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
    stopPreviousPage() {
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
setTimeout(() => {
    let app = new App();
    app.initialize();
}, 2000);
// let app = new App();
// app.initialize();

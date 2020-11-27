class App {

    constructor() {
        this.pages = [];
        this.activePageSet = 0; // 0=welcome, 1=main

        this.swipeHandler;

        // Page Sets
        this.mainSet;
        this.welcomeSet;
    }

    initialize(params) {
        // bind sets the value of 'this' inside the function to this object
        document.addEventListener('deviceready', this.onReady.bind(this), false);
        document.addEventListener('pause', this.onPause.bind(this), false);
        document.addEventListener('resume', this.onResume.bind(this), false);

        document.addEventListener("online", NetworkInfo.onOnline.bind(this), false);
        document.addEventListener("offline", NetworkInfo.onOffline.bind(this), false);
    }

    onReady() {
        // Update the API path in case the backend version changed
        ToolboxBackend.setBackendPathConstant().then(() => {
            this.startApp();
        }).catch(() => {
            if (DO_LOG) {
                console.log("[main.js:onReady]: Failed to load backend API path, errors likely!");
                this.startApp();
            }
        });
    }

    startApp() {
        // Have to initialize database here after device is ready
        dbConnection = new DatabaseConnection();

        this.swipeHandler = new SwipeHolder("#app");
        PaymentHandler.initPlans();
        if (device.platform != "iOS") {
            FastClick.attach(document.body); // iOS double clicks don't work with this plugin
        }

        if (NetworkInfo.isOnline()) {

            $(".loader_container > h1").text("Synchronizing results...");

            // Pull data from the backend, then start the app
            ToolboxBackend.pullFromBackend().then(() => {
                this.initializeUI();
                $(".loader_container > h1").text("Starting Sportwatch...");

                if (DO_LOG) {
                    console.log("[main.js:startApp()]: Backend sync finished!");
                }
            }).catch(() => {
                // Likely a corrupted / lost local storage, so they'll be signed out anyway
                if (DO_LOG) {
                    console.log("[main.js:onReady]: Failed to pull from backend, localStorage email: " + localStorage.getItem("email"));
                }
                this.initializeUI();
            });
        } else {
            NetworkInfo.onOffline();

            this.initializeUI();
        }
    }

    initializeUI() {

        setTimeout(() => {
            $(".loader_container").fadeOut(1500, function () {
                
            });
        }, 5000);
        
        // ---- PAGE SETS ---- //
        this.mainSet = new MainSet(this.swipeHandler, this.setActivePageSet, this, () => {
            console.log("DONE CONSTRUCTING");
        });

        this.mainSet.constructPages();

        this.welcomeSet = new WelcomeSet(this.swipeHandler, this.setActivePageSet, this, () => {

        });

        this.welcomeSet.constructPages();

        this.determinePageSet();

        // Test Requests for Plan Usage (Remove as needed)
        // PlanBackend.getActivePlan("will@sportwatch.us", (r) => {
        //     console.log(r.status);
        // });
        // PlanBackend.changePlan("", 1, (r) => {
        //     console.log(r.planName);
        // });
        // PlanBackend.approvePayment("", 3.99, (r) => {
        //     console.log(r);
        // });
        // PlanBackend.makePayment("", 3.99, (r) => {
        //     console.log(r.substatus);
        // });

    }

    /**
     * Attempts to log in the user based on SID. If invalid, it will
     * set the page set to the login / welcome pages
     */
    determinePageSet() {

        // If session is present, attempt to log in
        if (Authentication.hasSession()) {
            let sid = Authentication.getSID();
            // Authenticate and handle response (then = success)
            Authentication.validateSID(sid).then((response) => {
                if (DO_LOG) {
                    console.log("[main.js:determinePageSet()] Valid log in data");
                }
                this.setActivePageSet(1); // Bring to main screen
                return;

            }).catch((error) => {
                if (DO_LOG) {
                    console.log("[main.js:determinePageSet()] Invalid SID, logging out");
                }
                this.setActivePageSet(0); // Go back to welcome page
            });

        } else {
            if (DO_LOG) {
                console.log("[main.js:determinePageSet()] No SID data");
            }
            this.setActivePageSet(0); // Direct to welcome page
        }

        // NOTE: Authentication.validateSID is asyncronous, so anything put here
        //       to be executed should not modify significant variables
    }

    /**
     * Sets the active page and calls all functions needed to prepare
     * for usability for the given set. Useful as a callback for logging
     * in or out as page sets change
     * 
     * @param {Integer} pageSetId page set id (0-1 inclusive)
     * @param {App} _this [default = this] Used by PageSets to make sure
     *                    the value of "this" is correctly set
     */
    setActivePageSet(pageSetId, _this = this) {
        // First, disable all sets
        _this.welcomeSet.disable();
        _this.mainSet.disable();


        // Then enable the selected set
        if (pageSetId == 0) { // Welcome
            _this.welcomeSet.activate();
            _this.activePageSet = 0;
        } else if (pageSetId == 1) { // Main
            _this.mainSet.activate();
            _this.activePageSet = 1;
        } else {
            if (DO_LOG) {
                console.log("[main.js:setActivePageSet()] Invalid page set Id: " + pageSetId);
            }
            _this.welcomeSet.activate();
            _this.activePageSet = 0;
        }
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

    onPause() {
        console.log("Device is paused");
    }

    onResume() {
        console.log("Device is resumed");
    }
}

// Main entry point for the app
let app = new App();
let dbConnection; // Can't initialize yet since device isn't ready
let DO_LOG = true;

app.initialize(); // Simply binds the onReady, onPause, etc. functions
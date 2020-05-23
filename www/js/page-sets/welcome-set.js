
class WelcomeSet extends PageSet {
    
    /**
     * Contains the welcome pages and handles login / signup.
     * 
     * @param {SwipeHolder} swipeAgent - SwipeHolder object for handling user gestures
     * @param {Function} changeCallback - callback used to chage states / Page Sets
     * @param {App} appCopy - a copy of the App instance to allow for page changes
     */
    constructor(swipeAgent, changeCallback, appCopy) {
        super("WelcomeSet", swipeAgent, appCopy);
        this.onChangePageSet = function(newId) {
            changeCallback(newId, this.appCopy);
        };
        
        this.START_PAGE = 0; // Default page index to show
        
        // this.swipeHandler  (PageSet parent variable)
    }

    // ---- OVERRIDE METHODS ---- //

    constructPages() {
        // NOTE: Order is important, as it makes configuring page switches
        //       and swipes easier
        this.pageArray = [Welcome, Signup, Login].map((page, i) => new page(i, this));
        this.pageArray.forEach((pageObj, pageIndex) => {
            let shouldShow = false; // Should be page be visible at start? (only for first page)
            if (pageIndex == this.START_PAGE) { // Change this to default page (Welcome)
                shouldShow = true;
            }
            this.transitionObj.addPage((pageObj.name.toLowerCase() + "Page"), pageObj.getHtml(), shouldShow);
        });
    }

    activate() {
        this.transitionObj.showCurrentPage();
        this.currentPageId = this.START_PAGE;
        this.pageArray[this.currentPageId].start();
        // this.defineSwipes(0); // No swipes for now
    }

    disable() {
        this.transitionObj.hidePages();
        this.clearSwipes();
    }

    switchPage(pageName) { // Ex.  Signup (no astrix, no "Page", Capitalized)
        this.pageArray[this.currentPageId].stop(); // Stop current page
        this.transitionPage(pageName); // Begin transition
        this.currentPageId = (this.getPage(pageName).id);
        this.pageArray[this.currentPageId].start();
    }


    // ---- SET SPECIFIC METHODS ---- //

    /**
     * @description Handle any transition display while moving from one page to another. 
     * @param {String} pageName name of the page to transition to
     */
    transitionPage(pageName) {

        if (this.getPage(pageName).id > this.currentPageId) {
            this.transitionObj.slideLeft(pageName.toLowerCase() + "Page", 200);
        } else if (this.getPage(pageName).id < this.currentPageId) {
            this.transitionObj.slideRight(pageName.toLowerCase() + "Page", 200);
        } else {
            console.log("[main-set.js:transitionPage()]: Tried to switch page! Page ID is already current!!");
        }
        // In all reality, if we decide we want swipes, uncomment below
        // this.defineSwipes(this.getPage(pageName).id);

    }

    /**
     * NOT CURRENTLY IN USE!! TODO: If wanting to use, actually update the logic
     * Defines the transitionObj actions for this page (left, right, moving)
     * 
     * @example this.defineSwipes(this.getPage(nextPage).id); --> sets up handlers for new / next page
     * 
     * @param {Ingeger} pageIndex the numerical index corresponding to pageArray Map object
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
        if (pageIndex < this.pageArray.length) {
            this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPELEFT, () => {
                this.switchPage(this.getPage(pageIndex + 1).name);
            });
        } else {
            this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPELEFT, () => { });
        }

        // Moving (Left / Right)
        // dx > 0 ==> Swiping right to left,   dx < 0 ==> Left to right
        this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.MOVE, (dx, dy) => {
            if ((dx > 0) && (pageIndex < this.pageArray.length - 1)) {
                this.transitionObj.slidePageX(this.getPage(pageIndex + 1).name.toLowerCase() + "Page", true, Math.abs(dx));
            } else if ((dx < 0) && (pageIndex > 0)) {
                this.transitionObj.slidePageX(this.getPage(pageIndex - 1).name.toLowerCase() + "Page", false, Math.abs(dx));
            } else {
                this.transitionObj.slidePageX(this.getPage(pageIndex).name.toLowerCase() + "Page", true, 0);
            }
        });

        // If the gesture was classified as a tap, snap it back / reset it
        this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.TAP, () => {
            this.transitionObj.slidePageX(this.getPage(pageIndex).name.toLowerCase() + "Page", true, 0);
        });

    }



}
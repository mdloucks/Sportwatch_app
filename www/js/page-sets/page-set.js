/**
 * @classdesc Template for each page set.
 * @class
 */
class PageSet {
    
    /**
     * Each set will contain an array of the pages and a transition object
     * dedicated for this set. It's main job is to handle switching of pages.
     * These should only be used at the #app level, not for sub-transitions
     * 
     * @example set = new PageSet("Welcome", this.swipeAgent, this);
     * 
     * @param {String} name - name of this page set (used for error logged, etc.)
     * @param {SwipeHolder} swipeAgent - swipeHolder object defined in main
     * @param {App} appCopy - a copy of main.js (App), used to maintain context of "this"
     */
    constructor(name, swipeAgent, appInstCopy) {
        this.name = name;
        this.swipeHandler = swipeAgent;
        this.appCopy = appInstCopy;
        this.transitionObj = new PageTransition();
        
        this.pageArray = []; // Array of Page Instances
        this.currentPageId = 0;
    }
    
    /**
     * Initializes the Page objects and pushes to the array. It will also
     * add the HTML for each page (via getHtml()) to the transition object.
     */
    constructPages() {
        console.log("//////////////////////////////////////////////////////");
        console.log(`This is the default constructPages() function for Page Set ${this.name} OVERRIDE ME!`);
        console.log(".....................................................");
    }
    
    /**
     * Shows the desired first page and starts it (basically initializeFirstPage())
     * transitionObj.showCurrentPage() should be called here.
     */
    activate() {
        console.log("//////////////////////////////////////////////////////");
        console.log(`This is the default activate() function for Page Set ${this.name} OVERRIDE ME!`);
        console.log(".....................................................");
    }
    
    /**
     * Stops all page activity and will hide every page so a different page
     * can take the stage. transitionObj.hidePages()   and   this.clearSwipes()
     * should be called in this function
     */
    disable() {
        console.log("//////////////////////////////////////////////////////");
        console.log(`This is the default disable() function for Page Set ${this.name} OVERRIDE ME!`);
        console.log(".....................................................");
    }
    
    /**
     * Acts as a way for the current page set to move to another. This function should
     * be defined in the constructor to call a callback located in main.js (or the parent class)
     * 
     * @param {Integer} setId - the ID of the new set
     */
    onChangePageSet(setId) {
        console.log("//////////////////////////////////////////////////////");
        console.log(`This is the default onChangePageSet() function for Page Set ${this.name} OVERRIDE ME!`);
        console.log(".....................................................");
    }
    
    /**
     * Should be called every time a page switch occurs (swipes, button clicks, etc.)
     * 
     * @param {String} pageName - name of page to be switched to (id without #)
     */
    switchPage(pageName) {
        console.log("//////////////////////////////////////////////////////");
        console.log(`This is the default switchPage() function for Page Set ${this.name} OVERRIDE ME!`);
        console.log(".....................................................");
    }
    
    /**
     * Returns a page by passing in an integer id or string name
     * (shouldn't override this function, it's a piece of gold!)
     * 
     * @throws an exception if the parameter is not an integer or string
     * 
     * @param {Number | String} identifier 
     */
    getPage(identifier) {
        if (typeof identifier == "string") {
            for (let i = 0; i < this.pageArray.length; i++) {
                if (this.pageArray[i].name == identifier) {
                    return this.pageArray[i];
                }
            }
            console.log(this.pageArray);
            throw new Error(`Could not find ${identifier} inside of pageArray`);
        } else if (typeof identifier == "number" && Number.isInteger(identifier)) {
            for (let i = 0; i < this.pageArray.length; i++) {
                if (this.pageArray[i].id == identifier) {
                    return this.pageArray[i];
                }
            }
            
            throw new Error(`Could not find ${identifier} inside of pageArray`);
        } else {
            throw new Error(`Incorrect datatype entered for getPage, expected integer or string, you entered ${typeof identifier}`);
        }
    }
    
    /**
     * Removes (or rather, re-defined to empty) callbacks for each Gesture.
     * Failing to do so could result in pages within different states / sets
     * to appear incorrectly. (Override not needed)
     */
    clearSwipes() {
        // Clear all swipes to they aren't accidentally triggered in next set
        this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.BEGIN, () => { });
        this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.MOVE, () => { });
        this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.STOP, () => { });
        this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.TAP, () => { });
        this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPEUP, () => { });
        this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPERIGHT, () => { });
        this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPEDOWN, () => { });
        this.swipeHandler.bindGestureCallback(this.swipeHandler.Gestures.SWIPELEFT, () => { });
    }
    
    
}


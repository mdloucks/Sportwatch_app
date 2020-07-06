/**
 * This class should be used in a static context to retrieve touch
 * information, particularly concerning swipes / gestures
 */
class SwipeHolder {

    constructor(attachedElement = "") {
        // TODO: change to class
        //       threshold to consider a "swipe" a swipe (ex. change > 50)

        // VARIABLES
        this.MAX_HISTORY = 20; // Max length of arrays
        this.MIN_PERCENT_DIFFERENCE = 0.15; // percent change needed to trigger a swipe
        this.currentTouch = []; // [x, y]  (Max length of 2)
        this.touchHistory = []; // Formatted as [0: [{initX, initY}, {endX, endY}], 1: ...]
        this.gestureHistory = []; // Consists of Gestures enum
        // Most recent will be at index 0

        // Fired during certain events
        this.callbacks = [];
        this.scrollPages = []; // Pages that can scroll
        this.lastScrollOffset = 0;
        
        this.Gestures = { // Enum
            BEGIN: 0,
            MOVE: 1,
            STOP: 2,
            TAP: 3,
            SWIPEUP: 4,
            SWIPERIGHT: 5,
            SWIPEDOWN: 6,
            SWIPELEFT: 7
        };

        // Define dummy callbacks
        this.callbacks[this.Gestures.BEGIN] = () => { };
        this.callbacks[this.Gestures.MOVE] = () => { };
        this.callbacks[this.Gestures.STOP] = () => { };
        this.callbacks[this.Gestures.TAP] = () => { };
        this.callbacks[this.Gestures.SWIPEUP] = () => { };
        this.callbacks[this.Gestures.SWIPERIGHT] = () => { };
        this.callbacks[this.Gestures.SWIPEDOWN] = () => { };
        this.callbacks[this.Gestures.SWIPELEFT] = () => { };

        if (attachedElement != "") {
            this.attachToElement(attachedElement);
        }
    }

    /**
     * Attach this behavior / class to a given HTML element. The provided
     * parameter should be the id of a present element (commonly #app) with the
     * selector (#-->id, .-->class) included. It will then define the different
     * events that will populate the arrays in this object
     *
     * @example attachToElement("#app"); --> gestures on #app will be store
     *
     * @param {String} elementId - id the of the target element with selector included
     */
    attachToElement(elementId) {
        // START TOUCH
        $(elementId).bind("touchstart", (e) => {
            // Now, add to the arrays for each touch
            for (let t = 0; t < e.changedTouches.length; t++) {
                let touch = e.changedTouches[t];
                this.currentTouch = touch;
                this.touchHistory.unshift([touch, null]); // Set endTouch null, for now
                if (this.touchHistory.length > this.MAX_HISTORY) {
                    this.touchHistory.pop();
                }
            }
        });
        // MOVING TOUCH
        $(elementId).bind("touchmove", (e) => {
            e.preventDefault();
            /* preventDefault() is VITAL for smooth transitions when swiping between
               pages!! It is also, however, the thing prohibiting native scrolling
               and overflow for tall pages. I currently don't have a solution...
            */
            
            let touch = e.changedTouches[0];
            this.tryScrolling(touch);
            this.currentTouch = touch; // So current finger position can be ascertained
            
            let dx = this.touchHistory[0][0].pageX - touch.pageX;
            let dy = this.touchHistory[0][0].pageY - touch.pageY;
            this.callbacks[this.Gestures.MOVE](dx, dy);
        });
        // END TOUCH
        $(elementId).bind("touchend", (e) => {
            e.preventDefault(); // Helps prevent "double clicking"
            e.stopPropagation();
            
            for (let l = 0; l < e.changedTouches.length; l++) {
                let touch = e.changedTouches[l];
                // Update the touchHistory, setting the ending touch (index 1)
                let currentTouchIndex = this.getIndexFromId(touch.identifier);
                this.touchHistory[currentTouchIndex][1] = touch;
                let gesture = this.evaluateGesture(currentTouchIndex);
                
                // Trigger click event (fixes issue on Android)
                if(gesture == this.Gestures.TAP) {
                    $(e.target).trigger("click");
                }
            }
            this.callbacks[this.Gestures.STOP]();
        });
    };
    
    /**
     * Loops through the pages that are registered to scroll. If a page
     * is active, it will try scrolling the page until the top / bottom
     * is reached (relative to dy). Pages must be registered with
     * addScrollPage() first
     * 
     * @param {Integer} dy change in y of the touch
     */
    tryScrolling(newTouch) {
        
        let dy = newTouch.pageY - this.currentTouch.pageY;
        let viewportHeight = $(window).height() - $(".navbar").height();
        let scrollingPage;
        let currentOffset;
        
        for(let p = 0; p < this.scrollPages.length; p++) {
            // If not hidden, see if it can / should scroll
            if(!$(this.scrollPages[p]).hasClass("hidden")) {
                scrollingPage = $(this.scrollPages[p]);
                currentOffset = scrollingPage.offset().top;
                
                if((dy > 0) && (currentOffset < 0)) { // Scrolls up
                    scrollingPage.css("top", currentOffset + dy);
                } else if((dy < 0) && (currentOffset > (viewportHeight - scrollingPage.height()))) { // Scrolls down
                    scrollingPage.css("top", currentOffset + dy);
                }
            }
        }
    }
    
    /**
     * Adds a page that may be eligible for vertical scrolling. It will be handled if active
     * on touchmove events. The page selector should be very specific, i.e. "#accountPage > #settingsPage"
     * 
     * @example addScrollPage("#accountPage > #settingsPage");
     * 
     * @param {String} pageSelector specific selector for an individual div_page
     */
    addScrollPage(pageSelector) {
        this.scrollPages.push(pageSelector);
    }
    
    /**
     * Evaluates the given gesture and attempts to classify it into one of
     * the Gesture enum classifications based on start / end position.
     * The index specifies which touch transaction needs evaluating from the touchHistory
     * array. NOTE: For internal class use only!
     *
     * @example evaluateGesture(e.changedTouches[0].identifier); --> Returns resulting Gesture
     *
     * @param {Integer} historyIndex - index of the start/stop touches in touchHistory
     *
     * @returns
     * The resulting Gesture enum
     */
    evaluateGesture(historyIndex) {
        let startTouch = this.touchHistory[historyIndex][0];
        let endTouch = this.touchHistory[historyIndex][1];
        let screenWidth = $(window).width();
        let screenHeight = $(window).height();
        let dx = endTouch.pageX - startTouch.pageX;
        let dy = endTouch.pageY - startTouch.pageY;
        
        
        // Check to see the greater rate of change, then log gesture
        if ((Math.abs(dx) >= Math.abs(dy)) && (Math.abs(dx) > screenWidth * this.MIN_PERCENT_DIFFERENCE)) { // Horizontal movement
            if (dx > 0) { // Rightward swipe
                this.gestureHistory.unshift(this.Gestures.SWIPERIGHT);
            } else if (dx < 0) { // Leftware swipe
                this.gestureHistory.unshift(this.Gestures.SWIPELEFT);
            }

        } else if ((Math.abs(dy) >= Math.abs(dx)) && (Math.abs(dy) > screenHeight * this.MIN_PERCENT_DIFFERENCE)) { // Vertical movement
            if (dy > 0) { // Downard swipe
                this.gestureHistory.unshift(this.Gestures.SWIPEDOWN);
            }
            else if (dy < 0) { // Upward swipe
                this.gestureHistory.unshift(this.Gestures.SWIPEUP);
            }

        } else { // No movement
            this.gestureHistory.unshift(this.Gestures.TAP);
        }
        if (this.gestureHistory.length > this.MAX_HISTORY) {
            this.gestureHistory.pop();
        }

        // Execute callback for gesture
        this.callbacks[this.gestureHistory[0]]();
        return this.gestureHistory[0]; // Return gesture
    };

    /**
     * Binds the given callback function to the Gesture enum given. Will overwrite
     * any existing callbacks for said Gesture.
     * 
     * @param {Gesture} targetGesture gesture for which the callback will be fired
     * @param {Function} callbackFunc function that will be called after given gesture
     */
    bindGestureCallback(targetGesture, callbackFunc) {
        this.callbacks[targetGesture] = callbackFunc;
    }

    /**
     * Gets the index of the touch from touchHistory array based on the
     * unique touch identifier assigned to each interaction. It will compare the
     * given id to the starting touch's id (found at index 0 in each sub-array)
     *
     * @example getIndexFromId(e.changedTouches[0].identifier); --> 2 (index in touchHistory)
     *
     * @param {String} id - identifier of the desired touch
     *
     * @returns
     * An integer representing the index in touchHistory of the initial touch.
     * If no matching touch was found, it'll return false.
     */
    getIndexFromId(id) {
        for (let h = 0; h < this.touchHistory.length; h++) {
            // Get current loop object, then get initial touch ID for comparison
            if (this.touchHistory[h][0].identifier == id) {
                return h;
            }
        }
        console.log("[swipeHolder.js:getIndexFromId]: Touch ID was not found");
        return false;
    };

}




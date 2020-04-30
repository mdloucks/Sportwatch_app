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
        this.currentTouch = []; // [x, y]  (Max length of 2)
        this.touchHistory = []; // Formatted as [0: [{initX, initY}, {endX, endY}], 1: ...]
        this.gestureHistory = []; // Consists of Gestures enum
        // Most recent will be at index 0

        this.Gestures = { // Enum
            TAP: 0,
            SWIPEUP: 1,
            SWIPERIGHT: 2,
            SWIPEDOWN: 3,
            SWIPELEFT: 4
        };
        
        if(attachedElement != "") {
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
            for(let t = 0; t < e.changedTouches.length; t++) {
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
            let touch = e.changedTouches[0];
            this.currentTouch = touch; // So current finger position can be ascertained
        });
        // END TOUCH
        $(elementId).bind("touchend", (e) => {
            e.preventDefault();
            for(let l = 0; l < e.changedTouches.length; l++) {
                let touch = e.changedTouches[l];
                // Update the touchHistory, setting the ending touch (index 1)
                let currentTouchIndex = this.getIndexFromId(touch.identifier);
                this.touchHistory[currentTouchIndex][1] = touch;
                this.evaluateGesture(currentTouchIndex);
            }
        });
    };
    
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
        let dx = endTouch.pageX - startTouch.pageX;
        let dy = endTouch.pageY - startTouch.pageY;
        // Check to see the greater rate of change, then log gesture
        if(Math.abs(dx) > Math.abs(dy)) { // Horizontal movement
            if(dx > 0) { // Rightward swipe
                this.gestureHistory.unshift(this.Gestures.SWIPERIGHT);
            } else if(dx < 0) { // Leftware swipe
                this.gestureHistory.unshift(this.Gestures.SWIPELEFT);
            }
            console.log("Latest gesture: " + this.gestureHistory[0]);
        } else if(Math.abs(dy) > Math.abs(dx)) { // Vertical movement
            if(dy > 0) { // Downard swipe
                this.gestureHistory.unshift(this.Gestures.SWIPEDOWN);
            }
            else if(dy < 0) { // Upward swipe
                this.gestureHistory.unshift(this.Gestures.SWIPEUP);
            }
            console.log("Latest gesture: " + this.gestureHistory[0]);
        } else { // No movement
            this.gestureHistory.unshift(this.Gestures.TAP);
        }
        if(this.gestureHistory.length > this.MAX_HISTORY) {
            this.gestureHistory.pop();
        }
        return this.gestureHistory[0]; // Return gesture
    };
    
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
        for(let h = 0; h < this.touchHistory.length; h++) {
            // Get current loop object, then get initial touch ID for comparison
            if(this.touchHistory[h][0].identifier == id) {
                return h;
            }
        }
        console.log("[swipeHolder.js:getIndexFromId]: Touch ID was not found");
        return false;
    };

}




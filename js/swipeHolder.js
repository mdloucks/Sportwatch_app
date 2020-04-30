/**
 * This class should be used in a static context to retrieve touch
 * information, particularly concerning swipes / gestures
 */
function SwipeHolder() {
    
    let currentTouch = []; // [x, y]  (Max length of 2)
    let touchHistory = []; // Formatted as [0: [{initX, initY}, {endX, endY}], 1: ...]
    let gestureHistory = []; // Consists of Gestures enum
    // Most recent will be at index 0
    
    const Gestures = {
        TAP: 0,
        SWIPEUP: 1,
        SWIPERIGHT: 2,
        SWIPEDOWN: 3,
        SWIPELEFT: 4
    };
    
    // TODO: document, and also add limits to array size, change to class
    //       threshold to consider a "swipe" a swipe (ex. change > 50)
    
    /**
     * 
     */
    this.attachToElement = function(elementId) {
        
        // START TOUCH
        $(elementId).bind("touchstart", (e) => {
                        
            // Now, add to the arrays for each touch
            for(let t = 0; t < e.changedTouches.length; t++) {
                let touch = e.changedTouches[t];
                currentTouch = touch;
                touchHistory.unshift([touch, null]); // Set endTouch null, for now
            }
            
        });
        
        // MOVING TOUCH
        $(elementId).bind("touchmove", (e) => {
            e.preventDefault();
            let touch = e.changedTouches[0];
            currentTouch = touch; // So current finger position can be ascertained
        });
        
        // END TOUCH
        $(elementId).bind("touchend", (e) => {
            e.preventDefault();
            
            for (let l = 0; l < e.changedTouches.length; l++) {
                let touch = e.changedTouches[l];
                
                // Update the touchHistory, setting the ending touch (index 1)
                let currentTouchIndex = this.getIndexFromId(touch.identifier);
                touchHistory[currentTouchIndex][1] = touch;
                this.evaluateGesture(currentTouchIndex);
            }
        });
    } // End of attach function
    
    
    this.evaluateGesture = function(historyIndex) {
        let startTouch = touchHistory[historyIndex][0];
        let endTouch = touchHistory[historyIndex][1];
        
        let dx = endTouch.pageX - startTouch.pageX;
        let dy = endTouch.pageY - startTouch.pageY;
        
        // Check to see the greater rate of change, then log gesture
        if(Math.abs(dx) > Math.abs(dy)) { // Horizontal movement
            if(dx > 0) { // Rightward swipe
                gestureHistory.push(Gestures.SWIPERIGHT);
            } else if(dx < 0) { // Leftware swipe
                gestureHistory.push(Gestures.SWIPELEFT);
            }
            $("#swipe").text("You swiped " + (dx > 0 ? "right" : "left"));
            
        } else if(Math.abs(dy) > Math.abs(dx)) { // Vertical movement
            if (dy > 0) { // Downard swipe
                gestureHistory.push(Gestures.SWIPEDOWN);
            } else if (dy < 0) { // Upward swipe
                gestureHistory.push(Gestures.SWIPEUP);
            }
            $("#swipe").text("You swiped " + (dy > 0 ? "down" : "up"));
            
        } else { // No movement
            gestureHistory.push(Gestures.TAP);
        }
        
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
    this.getIndexFromId = function(id) {
        for(let h = 0; h < touchHistory.length; h++) {
            // Get current loop object, then get initial touch ID for comparison
            if(touchHistory[h][0].identifier == id) {
                return h;
            }
        }
        console.log("Returning false :(");
        return false;
    }
    
    
}




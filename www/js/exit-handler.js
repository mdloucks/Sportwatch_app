
/* Simple class defined globally for pages and functions to
 * define behavior when the app is closed ("Paused") and
 * re-opened "Resumed")
 */
class ExitHandler {
    
    constructor() {
        // Array of functions to call on their respect events
        this.onPauseFunctions = [];
        this.onResumeFunctions = [];
    }
    
    // Adds a function to be executed when app is closed
    addPauseFunction(fn, context) {
        this.onPauseFunctions.push(fn.bind(context));
    }
    // Adds a functino to be executed when app is re-opened
    addResumeFunction(fn, context) {
        this.onResumeFunctions.push(fn.bind(context));
    }
    
    // Executes all the functions for the onPause event
    executeOnPause() {
        for(let f = 0; f < this.onPauseFunctions.length; f++) {
            this.onPauseFunctions[f]();
        }
    }
    // Executes all the functions for the onResume event
    executeOnResume() {
        for(let f = 0; f < this.onResumeFunctions.length; f++) {
            this.onResumeFunctions[f]();
        }
    }
    
}


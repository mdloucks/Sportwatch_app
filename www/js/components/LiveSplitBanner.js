/**
 * @class
 * @classdesc Used to display real-time split data while recording a race / workout
 */
class LiveSplitBanner {
    
    /**
     * Instantiates an object that can be used to manage the visual
     * banner that displays real-time split data. A separate class
     * is needed (instead of using Popup.js) because its fade criteria
     * is dependent on when the last split was taken (i.e. not a constant time)
     * 
     * In the first iteration,
     * it will be at the top of the screen on all devices. However, if time
     * permits, it would be nice to create space to the side on larger
     * devices (like iPads) and have this class automatically adjust.
     */
    constructor() {
        
        this.DISPLAY_TIME = 5000; // Time in milliseconds the banner persists for
        this.ANIM_TIME = 1000; // Time in milliseconds that animations are completed
        this.isShown = false;
        this.isMoving = false; // To ensure it isn't double transitioned
        this.hideTimerId = -1; // Used to reset setTimeout if new data is added
        
        this.bannerHtml = (`
            <div id="liveSplitBanner" class="popupBanner">
                <table>
                    <tr>
                        <th>Name</th>
                        <th>Split</th>
                        <th>Current</th>
                        <th>Historic</th>
                    </tr>
                    <!-- Split rows will be added here -->
                </table>
            </div>
        `);
        
    }
    
    /**
     * Adds data to the split banner popup. It will also handle hiding or showing
     * the popup or animating the addition of the data. All times should be
     * provided in the absolute format; they will be converted to relative
     * times within the class.
     * 
     * @param {String} athleteName name of the athlete who just recorded the split
     * @param {Double} split time of the split
     * @param {Double} lastSplit time of the last split (not relative)
     * @param {Double} historicSplit time of the mean or median split for this time (not relative)
     */
    addData(athleteName, split, lastSplit, historicSplit) {
        // Convert to relative units
        lastSplit = split - lastSplit;
        historicSplit = split - historicSplit;
        
        // If the popup isn't shown, show it; if already shown, reset the hide timer
        if (!this.isShown) {
            // Show the popup (needs to be done first in order to add the table HTML)
            this.showBanner();
        } else {
            this.refreshHideTimer();
        }
        
        // Add the data to the UI
        this.displayDataOnPopup(athleteName, split, lastSplit, historicSplit, this.isShown);
    }
    
    displayDataOnPopup(name, split, lastSplit, historicSplit, doAnimateIn = true) {
        
        // Assimilate into an array to make it loop-able
        let data = [split, lastSplit, historicSplit];
        
        // Round the numerical values to two decimal points
        for (let d = 0; d < data.length; d++) {
            data[d] = this.roundToHundredths(data[d]);
        }
        // Add in name to data so it can be added in the loop
        data.unshift(name);
        
        // Create a unique ID for the row; add random number for increased randomness
        let id = name.toLowerCase().replace(/[^a-z]/gm, "") + "-" + (Math.round(Math.random() * 100));
        
        // Add the row (make the display none if it needs to be animated)
        if (doAnimateIn) {
            $("#liveSplitBanner table").append(`<tr id="${id}" style="display: none"></tr>`);
        } else {
            $("#liveSplitBanner table").append(`<tr id="${id}"></tr>`);
        }
        
        // Add the necessary table elements
        for (let t = 0; t < data.length; t++) {
            let rowClass = "";
            if (t > 1) { // Ignore name and split data
                if (data[t] > 0) {
                    rowClass = "positiveSplit";
                    data[t] = "+" + data[t]; // Add plus sign for increased readability
                } else if (data[t] < 0) {
                    rowClass = "negativeSplit";
                }
            }
            
            $("#liveSplitBanner tr#" + id).append(`<td class="${rowClass}">${data[t]}</td>`);
        }
        
        // If this row needed to be animated, do that now
        if (doAnimateIn) {
            $("tr#" + id).fadeIn(this.ANIM_TIME);
        }
        
        // Remove the row after the specified display time
        setTimeout(() => {
            $("tr#" + id).fadeOut(this.ANIM_TIME);
        }, this.DISPLAY_TIME);
    }
    
    /**
     * Shows the banner if it isn't already shown or being transitioned. This
     * function will automatically facilitate a smooth animation.
     */
    showBanner() {
        if (this.isShown) {
            return;
        }
        // If it isn't part of the HTML yet, add it now
        if ($("#liveSplitBanner").length == 0) {
            $("#app").append(this.bannerHtml);
            $("#liveSplitBanner").css("top", this.getOffscreenPosition() + "px");
        }
        
        
        // If moving, find out a way to show it once it stops moving
        
        // Move the banner into view and update status
        $("#liveSplitBanner").css("transition", (this.ANIM_TIME / 1000) + "s top");
        $("#liveSplitBanner").css("top", "50px");
        this.isShown = true;
        this.refreshHideTimer();
    }
    
    
    /**
     * Transitions the banner off the top of the screen. Ideally, this
     * should be done before the last data entry is removed.
     */
    hideBanner() {
        if (!this.isShown) {
            return;
        }
        // If it isn't part of the HTML yet, nothing can be hidden
        if ($("#liveSplitBanner").length == 0) {
            return;
        }
        
        // Get the height of the split banner currently
        let height = $("#liveSplitBanner").outerHeight(true); // "true" includes margins
        $("#liveSplitBanner").css("top", (-height) + "px");
        this.isShown = false;
    }
    
    /**
     * Resets the hide timer. Should be used when new data is added to the
     * banner to prevent it from disappearing too quickly. This function
     * will update the hideTimerId member variable.
     */
    refreshHideTimer() {
        if (this.hideTimerId != -1) {
            clearInterval(this.hideTimerId);
        }
        
        this.hideTimerId = setTimeout(() => {
            this.hideBanner();
        }, this.DISPLAY_TIME);
    }
    
    /**
     * Returns the pixel value needed to place the split banner up
     * off the top of the screen.
     * 
     * @example getOffscreenPosition()
     *          --> -104 (for iPhone 12, for example)
     * 
     * @returns {Integer}
     * Returns a negative integer that can be used in the "top" CSS property
     * to move the banner off screen
     */
    getOffscreenPosition() {
        return (-1 * $("#liveSplitBanner").outerHeight(true)); // "true" includes margins
    }
    
    /**
     * Roudns a given number to the hundredths place (two decimals).
     * Handy since Math.round only rounds to the nearest integer by default.
     * 
     * @example roundToHundredths(82.039155)
     *          --> 82.04
     * 
     * @param {Double} num - the number to round to two decimal points
     * @returns {Double}
     * The number, rounded to the second decimal place.
     */
    roundToHundredths(num) {
        num = num * 100; // Two decimal point promotion
        num = Math.round(num);
        return num / 100;
    }
    
    
}




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
        
        this.DISPLAY_TIME = 10000; // Time in milliseconds the banner persists for
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
                        <th>Last</th>
                        <th>Historic</th>
                    </tr>
                    <!-- Split rows will be added here -->
                </table>
            </div>
        `);
        
    }
    
    /**
     * Adds a new row to the live split banner and displays it for the configured
     * amount of time. This function will grab the name of the athlete, as well
     * as their more recent split, their mean / median, and last split and comput the
     * respective differences for each. This is the best way to add data to the
     * banner as it handles banner transitions and formatting.
     * 
     * @example addData(28, eventConfig);
     *          --> Displays split data for user #28
     * 
     * @param {Integer} athleteId backend ID of the athlete that just saved a split time
     * @param {EventConfig} eventConfig copy / reference of the EventConfig object used by the stopwatch
     */
    addData(athleteId, eventConfig) {
        
        // Prepare the info needed to pull and populate the banner
        let recordDefinitionId = eventConfig.getActiveEvent().definitionId;
        let athleteSplits = eventConfig.getSplitTimesByAthleteId(athleteId);
        let splitCount = athleteSplits.length - 1; // -1 to make compatible with arrays (0-indexed)
        let splitDistance = eventConfig.getSelectedSplits()[splitCount].distance; // -1 to convert to array index
        let currentSplit = athleteSplits[splitCount];
        let lastSplit = 0.00;
        if (splitCount >= 1) {
            lastSplit = athleteSplits[splitCount - 1]; // -1 to go back a split
        }
        
        // Grab everything we need in one big PHat database call (to avoid nested promises)
        let query = (`
            SELECT athlete.fname, athlete.lname, record_split.value FROM athlete
            INNER JOIN record_user_link ON athlete.id_backend = record_user_link.id_backend
            INNER JOIN record ON record_user_link.id_record = record.id_record
            INNER JOIN record_split ON record.id_record = record_split.id_record
            WHERE athlete.id_backend = ? AND
            record.id_record_definition = ? AND
            record_split.split_name LIKE ?
        `);
        dbConnection.selectValuesAsObject(query, [athleteId, recordDefinitionId, `${splitDistance}m%`]).then((splitData) => {
            if (splitData.length == 0) {
                return; // Nothing to display
            }
            
            // Create a label with first name initial and last name (ex. "S. Byrne")
            let athleteLabel = splitData[0].fname[0] + ". " + splitData[0].lname;
            let historicComparison = 0.00; // Either the mean or average of this athlete's splits
            
            for (let s = 0; s < splitData.length; s++) {
                // TODO: Add support for median usage instead of just the mean
                historicComparison = historicComparison + splitData[s].value;
            }
            historicComparison = historicComparison / splitData.length;
            historicComparison = currentSplit - historicComparison; // Need the non-relative currentSplit here
            
            // Make current split and last split relative now (only if splitCount is large enough)
            if (splitCount >= 1) {
                currentSplit = currentSplit - athleteSplits[splitCount - 1];
            }
            if (splitCount >= 2) {
                lastSplit = lastSplit - athleteSplits[splitCount - 2];
            }
            if (lastSplit != 0) {
                lastSplit = currentSplit - lastSplit;
            }
            
            // Add it to the banner
            this.addDataVerbose(athleteLabel, currentSplit, lastSplit, historicComparison);
            
        }).catch((err) => {
            // Do nothing; the athlete doesn't have a matching split for this event
        });
        
    }
    
    /**
     * Adds data to the split banner popup. It will also handle hiding or showing
     * the popup or animating the addition of the data. All times should be
     * provided in the absolute format; they will be converted to relative
     * times within the class.
     * 
     * @param {String} athleteName name of the athlete who just recorded the split
     * @param {Double} split time of the split (relative to the last split)
     * @param {Double} lastSplitDiff difference between the last split and the new split
     * @param {Double} historicSplitDiff difference between the mean or median and the split
     */
    addDataVerbose(athleteName, split, lastSplitDiff, historicSplitDiff) {
        // If the popup isn't shown, show it; if already shown, reset the hide timer
        if (!this.isShown) {
            // Show the popup (needs to be done first in order to add the table HTML)
            this.showBanner();
        } else {
            this.refreshHideTimer();
        }
        
        // Add the data to the UI
        this.displayDataOnPopup(athleteName, split, lastSplitDiff, historicSplitDiff, this.isShown);
    }
    
    /**
     * Adds a new row to the split banner with the given information about the
     * athlete's current split time. It will handle time formatting, so all
     * values should be provided in seconds only. Additionally, it will take
     * care of any applicable animations.
     * Note: This is an internal function. To safely add a time, use addData()
     * 
     * @example displayDataOnPopup("T. Williams", 64.08, 2.11, -0.88)
     *          --> Shows split time of 1:04.08, with differences of +2.11 and -0.88
     * 
     * @param {String} name label for the athlete
     * @param {Double} split relative time (compared to last split) of this split
     * @param {Double} lastSplit difference between the last split and the new split
     * @param {Double} historicSplit difference between this athlete's mean / median and the new split
     * @param {Boolean} doAnimateIn [default = true] should the row be animated in or added immediately?
     */
    displayDataOnPopup(name, split, lastSplit, historicSplit, doAnimateIn = true) {
        
        // Assimilate into an array to make it loop-able below
        let data = [name, split, lastSplit, historicSplit];
        
        // Create a unique ID for the row; add random number for increased randomness
        let randomId = (Math.round(Math.random() * 100));
        let id = name.toLowerCase().replace(/[^a-z]/gm, "") + "-" + randomId;
        if ($("#liveSplitBanner tr#" + id).length != 0) {
            randomId = randomId + 100; // Increment outside of normal random range (0-100)
            id = name.toLowerCase().replace(/[^a-z]/gm, "") + "-" + randomId;
        }
        
        // Add the row (make the display none if it needs to be animated)
        if (doAnimateIn) {
            $("#liveSplitBanner table").append(`<tr id="${id}" style="display: none"></tr>`);
        } else {
            $("#liveSplitBanner table").append(`<tr id="${id}"></tr>`);
        }
        
        // Add the necessary table elements
        for (let t = 0; t < data.length; t++) {
            let rowClass = "";
            let dataPrefix = ""; // "+" or "-" for better readability; difference comparison
            
            if (t > 1) { // Ignore name and split data
                if (data[t] > 0) {
                    rowClass = "positiveSplit";
                    dataPrefix = "+"; // Add plus sign for increased readability
                } else if (data[t] < 0) {
                    rowClass = "negativeSplit";
                    dataPrefix = "-";
                } else if ((data[t] == 0) && (t == 2)) { // Index of last split, which is blank for first split save
                    data[t] = "--";
                }
            }
            
            // Format the numbers before adding
            if (typeof data[t] == "number") {
                data[t] = dataPrefix + this.formatTime(data[t]);
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
     * Converts the total number of seconds (given by the stopwatch) into an easy-to-read
     * format of hr:mm:ss:ms. The function will also automatically show and "hide"
     * parts of the time based on relevancy. I.e., if the time in seconds is in the hours,
     * the seconds and milliseconds will not be given in the final string.
     * Note: the absolute value of the time is used, so be sure to preserve the
     * sign before passing to this function
     * 
     * @example formatTime(6.4)
     *          --> "6.40"
     * @example formatTime(67.896)
     *          --> "1:08" (1 minute, 8 seconds)
     * @example formatTime(5081.9994)
     *          --> "1:25" (1 hour, 25 minutes)
     * 
     * @param {Double} timeInSeconds raw time given in total seconds
     * @returns {String}
     * A formatted and cleaned string representing the given time provided in seconds.
     */
    formatTime(timeInSeconds) {
        // Make sure it isn't negative
        timeInSeconds = Math.abs(timeInSeconds);
        
        // Grab each component
        let hours = Math.floor(timeInSeconds / 3600);
        let minutes = Math.floor((timeInSeconds - (hours * 3600)) / 60);
        let seconds = Math.floor(timeInSeconds % 60);
        // Subtract off all the time to get just the decimals
        let decimalSeconds = timeInSeconds - seconds - (minutes * 60) - (hours * 3600);
        decimalSeconds = Math.round(decimalSeconds * 100);
        
        
        // Begin crafting the formatted time (string for concatenation)
        let formattedTime = "";
        if (hours > 0) {
            // Only hours and minutes displayed, so round decimal and seconds up
            if (decimalSeconds >= 50) {
                seconds = seconds + 1;
            }
            decimalSeconds = "";
            if (seconds >= 30) {
                minutes = minutes + 1;
            }
            seconds = "";
            
            // Make sure minutes are two digits long
            let separator = ":";
            if (minutes < 10) {
                separator = ":0";
            }
            minutes = separator + minutes;
            
        } else if (minutes > 0) {
            // Only minutes and seconds displayed; remove the decimal
            if (decimalSeconds >= 50) {
                seconds = seconds + 1;
            }
            decimalSeconds = "";
            
            // Make sure seconds are two digits long
            let separator = ":";
            if (seconds < 10) {
                separator = ":0";
            }
            seconds = separator + seconds;
            
        } else {
            // Seconds and decimals are display; make sure decimals are two-digits long
            let separator = ".";
            if (decimalSeconds.toString().length < 2) {
                separator = ".0";
            }
            decimalSeconds = separator + decimalSeconds;
        }
        
        return hours + minutes + seconds + decimalSeconds;
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




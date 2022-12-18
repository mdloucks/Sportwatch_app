
/**
 * @classdesc Holds information about the selected event when using
 * the stopwatch page. Mainly used to ensure property consistency instead
 * of using associative arrays / random objects
 * @class
 */
class EventConfig {

    /**
     * Holds the state, variables, status, and other information needed to
     * run and save a stopwatch event. It is structured as a class to
     * ensure needed variables are present and defined, as well as provide
     * documentation about the use of each variable.
     */
    constructor() {
        // to be written by some magic fairy named Larry
        
        this.isBoys = true;
        this.isGirls = true;
        
        this.activeSelectionIndex = 0; // Corresponds to selected event or split in the stopwatch
                                       // Since splits / multi events are exclusive, no need to differentiate
        this.wantsMultipleEvents = false; // Did the user longpress the events page?
        this.selectedEvents = []; // Array of objects: {name: "Event Name", definitionId: <id>}
        
        this.wantsSplits = false; // Tracks if the user opted for splits or not to help setup splits
        this.selectedSplits = []; // Array of split objects {name: "400m", distance: 400}
        this.savedSplits = {}; // Object indexed by athlete Id: {<id>: [4.104, 8.114, ... (split times)]}
        
    }
    
    /*
      TODO: Saved times array (unless they're saved dynamically? Probably only for multiple events)
            Queries (gender, saved records (?), etc.) (better to have in slider component)
    */

    /* Single / multi events are saved immediately. Splits are saved on Finish.
        Split saved record structure: {<definitionId>: {athleteId: [4.55, 8.99, 18.31, ...]}}
        
        Multiple events are set up and handled by callbacks in startSlideupForAthletes(). generateAthletes()
        handles split logic, but treats single/multi events the same since they both rely on selectedEvent index
    */
    
    /**
     * Adds a given event / record identity to the configuration, which will
     * be run by the stopwatch unless removed
     * 
     * @example addEventById(3)
     *          --> (adds 100m dash to config)
     * 
     * @param {Integer} recordDefinitionId id corresponding to the event type
     * 
     * @return {Boolean}
     * If the event could not be found, false is returned. True is otherwise the default
     */
    addEventById(recordDefinitionId) {
        // Get the name of the event
        let eventNames = Object.keys(Constant.recordIdentityInfo);
        if ((recordDefinitionId < 0) || (recordDefinitionId > eventNames.length - 1)) {
            if (DO_LOG) {
                console.log("[EventConfig.js]: Unknown record identity with ID " + recordDefinitionId);
            }
            return false;
        }
        
        // Convert database Id (starts at 1) to array index (starts at 0)
        let eventName = eventNames[recordDefinitionId - 1];
        this.selectedEvents.push({definitionId: recordDefinitionId, name: eventName});
        return true;
    }
    
    /**
     * Adds a given event to the configuration to be recorded by the name
     * of the event (instead of the ID)
     * 
     * @example addEventByName("400m")
     *          --> Adds the 400m race to the configuration
     * 
     * @param {String} recordIdentity name of the event (including "m") to be added
     * 
     * @returns {Boolean}
     * If the event name did not match or couldn't be found, false is
     * returned. True otherwise is returned
     */
    addEventByName(recordIdentity) {
        recordIdentity = recordIdentity.toLowerCase()
        
        // Get the keys of the events, then find the index of the name
        let eventNames = Object.keys(Constant.recordIdentityInfo);
        if (!recordIdentity in eventNames) {
            if (DO_LOG) {
                console.log("[EventConfig.js]: Unable to find event by name of \"" + recordIdentity + "\"");
            }
            return false;
        }
        
        let recordDefinitionId = eventNames.indexOf(recordIdentity);
        this.selectedEvents.push({definitionId: recordDefinitionId, name: recordIdentity});
        return true;
    }
    
    /**
     * Removes the given even from the selectedEvents array. This is mainly used
     * after all of the athletes have been recorded for a given event and is no
     * longer needed on the stopwatch display
     * 
     * @example removeEventById(4)
     *          --> true (Removes "200m" from the selected events)
     * 
     * @param {Integer} recordDefinitionId record definition id of the event to remove from selected
     * 
     * @returns {Boolean}
     * True, if the event was found and removed. False otherwise
     */
    removeEventById(recordDefinitionId) {
        // Since selectedEvents is comparatively small, just loop through it
        // Because we're looping, we don't need to convert it to an array format
        let matchedIndex = this.getSpecificEventIndex(recordDefinitionId);
        if (matchedIndex != -1) {
            this.selectedEvents.splice(matchedIndex, 1);
            return true;
        }
        
        // Match not found, return false
        if (DO_LOG) {
            console.log("[EventConfig.js]: Event was not selected with ID " + recordDefinitionId);
        }
        return false;
    }
    
    /**
     * Wrapper for removeObjectByName(). See that function for full documentation
     */
    removeEventByName(recordIdentity) {
        return this.removeObjectByName(recordIdentity);
    }
    
    /**
     * Wrapper for removeObjectByName(). See that function for full documentation
     */
    removeSplitByName(splitName) {
        return this.removeObjectByName(splitName, "splits");
    }
    
    /**
     * Removes the given event from the selectedEvents array. Another alternative
     * to remove an event from the stopwatch display after the user is finished
     * with it.
     * 
     * @example removeEventByName("1600m")
     *          --> true (Removes "1600m" from the stopwatch display)
     * 
     * @param {String} objectIdentity name of the event or split to remove
     * @param {String} objectType [default = "events"] array to search in: "events" or "splits"
     * 
     * @returns {Boolean}
     * True, if the object was selected and successfully removed. False otherwise
     */
    removeObjectByName(objectIdentity, objectType = "events") {
        objectIdentity = objectIdentity.toLowerCase()
        
        let workingObject = this.selectedEvents;
        if (objectType == "splits") {
            workingObject = this.selectedSplits;
        }
        
        // Loop through the workingObject array
        for (let s = 0; s < workingObject.length; s++) {
            if (workingObject[s].name == objectIdentity) {
                
                // Update the appropriate array
                if (objectType == "splits") {
                    this.selectedSplits.splice(s, 1);
                } else {
                    this.selectedEvents.splice(s, 1);
                }
                return true;
            }
        }

        // Match not found, return false
        if (DO_LOG) {
            console.log("[EventConfig.js]: Event or split was not selected with name " + objectIdentity);
        }
        return false;
    }
    
    /**
     * Wrapper for removeActiveObject(), mostly unnecessary, but for namesake, it's
     * a nice to have
     */
    removeActiveEvent() {
        return this.removeActiveObject();
    }
    
    /**
     * Wrapper for removeActiveObject(), mostly unnecessary, but who cares
     */
    removeActiveSplit() {
        return this.removeActiveObject();
    }
    
    /**
     * Removes the currently-active event or split. It will decrement the active
     * event index if needed.
     * 
     * @example removeActiveEvent()
     *          --> true (Removes the selected event)
     * 
     * @returns {Boolean}
     * True, if the active event index was valid and was removed. False otherwise
     */
    removeActiveObject() {
        // Determine if there are multiple events or multiple splits
        let workingObject = this.selectedEvents;
        if (this.hasSplits()) {
            workingObject = this.selectedSplits;
        }
        
        // Do a quick check to make sure the active selected event is a valid index
        if ((this.activeSelectionIndex < 0) || (this.activeSelectionIndex > workingObject.length - 1)) {
            if (DO_LOG) {
                console.log("[EventConfig.js]: Selected event / split index was invalid: " + this.activeSelectionIndex);
                this.activeSelectionIndex = 0; // Try to salvage it for future calls
            }
            return false;
        }
        
        // Splice, then adjust activeSelectionIndex if needed
        if (this.hasSplits()) {
            this.selectedSplits.splice(this.activeSelectionIndex, 1);
        } else {
            this.selectedEvents.splice(this.activeSelectionIndex, 1);
        }
        // Update the active index
        if ((this.activeSelectionIndex > this.selectedEvents.length - 1) && (this.activeSelectionIndex > 0)) {
            this.activeSelectionIndex--;
        }
        
        return true;
    }
    
    /**
     * Wrapper for getActiveObject() to preserve naming consistency
     */
    getActiveEvent() {
        // If using splits, can't use getActiveObject since the index is tracking splits
        if (this.hasSplits()) {
            return this.selectedEvents[0];
        }
        return this.getActiveObject();
    }

    /**
     * Wrapper for getActiveObject() because two is better than one
     */
    getActiveSplit() {
        // Print a warning if this function is being used improperly
        if (!this.hasSplits()) {
            console.log("[EventConfig.js]: No splits have been configured; events are likely being returned");
        }
        return this.getActiveObject();
    }

    /**
     * Gets the selected / active event or split, based on the user's selection
     * in the stopwatch slideup UI. The object depends on if the stopwatch
     * is using multiple events or splits. If the activeSelectionIndex is
     * invalid, false will be returned
     * 
     * @example getActiveEvent()
     *          --> {name: "400m", definitionId: 4} (multiple events)
     * @example getActiveEvent()
     *          --> {name: "100m Split", distance: 100} (splits)
     * @example getActiveEvent()
     *          --> false (activeSelectionIndex was invalid)
     * 
     * @returns {Object}
     * An object corresponding to an event or split, depending on the configuration;
     * false is returned if the activeSelectionIndex was invalid
     */
    getActiveObject() {
        // Multiple events or multiple splits
        let workingObject = this.selectedEvents;
        if (this.hasSplits()) {
            workingObject = this.selectedSplits;
        }

        // Check to make sure the active selected event is a valid index
        if ((this.activeSelectionIndex < 0) || (this.activeSelectionIndex > workingObject.length - 1)) {
            if (DO_LOG) {
                console.log("[EventConfig.js]: Selected event / split index was invalid: " + this.activeSelectionIndex);
                this.activeSelectionIndex = 0; // Try to salvage it for future calls
            }
            return false;
        }
        
        return workingObject[this.activeSelectionIndex];
    }
    
    /**
     * Adds a split to the configuration, making sure it doesn't already exist.
     * 
     * @example addSplit(200, "200m")
     *          --> true (Adds a split at 200m named "200m")
     * @example addSplit(200, "Leg 1 Relay")
     *          --> false (200m split already exists)
     * 
     * @param {Integer} splitDistance distance of the split, in meters
     * @param {Strig} splitName name of the split; if not provided, it will default to <distane>m
     * 
     * @returns {Boolean}
     * True, if the split was added. False if the split distance or name was already
     * defined.
     */
    addSplit(splitDistance, splitName = "") {
        
        // Sanitize distance
        if (typeof splitDistance == "string") {
            splitDistance = parseInt(splitDistance.replace(/[^0-9]/gm, ""));
        }
        
        // If splitName was not provided, generate it from splitDistance
        if (splitName == "") {
            splitName = splitDistance + "m Split"; // May need to one day change it from meters to a variable unit
        }
        
        // Make sure the split isn't already added (do it twice to act in an "or" fashion)
        if ((this.getSpecificSplitIndex(splitDistance) > 0) || (this.getSpecificSplitIndex(0, splitName) > 0)) {
            return false;
        }
        
        // Add the split
        this.selectedSplits.push({name: splitName, distance: splitDistance});
        return true;
    }
    
    /**
     * Removes a split based on the provided distance (in meters). Good for
     * when all of the athletes have completed the split and it is no longer
     * needed in the stopwatch UI
     * 
     * @example removeSplitByDistance(100)
     *          --> Removes 100m split
     * 
     * @param {Integer} splitDistance distance of the split to remove
     * 
     * @returns {Boolean}
     * True, if the split existed and was successfully removed. False otherwise
     */
    removeSplitByDistance(splitDistance) {
        // Find if an index matches it
        let matchedIndex = this.getSpecificSplitIndex(splitDistance);
        if (matchedIndex != -1) {
            this.selectedSplits.splice(matchedIndex, 1);
            return true;
        }

        // Match not found, return false
        if (DO_LOG) {
            console.log("[EventConfig.js]: Split was not defined with distance " + splitDistance);
        }
        return false;
    }
    
    /**
     * Removes a split based on the provided name (case insensitive). Good for
     * when all of the athletes have completed the split
     * 
     * @example removeSplitByDistance("200m")
     *          --> Removes 200m split
     * 
     * @param {Integer} splitName name of the split to remove
     * 
     * @returns {Boolean}
     * True, if the split existed and was successfully removed. False otherwise
     */
    removeSplitByName(splitName) {
        // Find if an index matches it
        let matchedIndex = this.getSpecificSplitIndex(0, splitName);
        if (matchedIndex != -1) {
            this.selectedSplits.splice(matchedIndex, 1);
            return true;
        }
        
        // Match not found, return false
        if (DO_LOG) {
            console.log("[EventConfig.js]: Split was not defined with name " + splitName);
        }
        return false;
    }
    
    /**
     * Saves a split time to the configuration, which will be used later when
     * the record is saved. Splits can only be added once a record exists, and
     * as such as the only data type that needs to be stored and retroactively
     * saved. Everything else can be saved as it happens
     * 
     * @example saveSplitTime(6, 16.024)
     *          --> (saves the time)
     * 
     * @param {Integer} athleteId backend id of the athlete's time being saved
     * @param {Double} runTime time on the stopwatch being saved for the athlete
     */
    saveSplitTime(athleteId, runTime) {
        // If there isn't an index for this athlete yet, create one
        if (!(athleteId in this.savedSplits)) {
            this.savedSplits[athleteId] = [];
        }
        
        // Do a quick sanity check to make sure times are being saved correctly
        if (Object.keys(this.savedSplits[athleteId]).length == this.selectedSplits.length) {
            if (DO_LOG) {
                console.log("[EventConfig.js]: Athlete #" + athleteId + " has already reached split count max");
                // We can continue, but it is likely that things will break later when
                // pushing to the backend
            }
        }
        
        // Add the time
        this.savedSplits[athleteId].push(Number(runTime));
    }
    
    /**
     * Gets all of the splits saved to the configuration for the given athlete Id.
     * That's it, really. Why'd you keep reading? What more do you expect this to say?
     * 
     * @example getSplitTimesByAthleteId(6)
     *          --> [16.024, 33.1845, 49.001] (split times for athlete #6)
     * 
     * @param {Integer} athleteId row id / backend id of the athlete to return splits for
     * 
     * @returns {Array}
     * Returns a 1D traditional array of doubles representing the time of each
     * split for the athlete, ordered from least to greatest.
     */
    getSplitTimesByAthleteId(athleteId) {
        if (!(athleteId in this.savedSplits)) {
            if (DO_LOG) {
                console.log("[EventConfig.js]: Athlete " + athleteId + " doesn't have any splits saved");
                return [];
            }
        }
        
        return this.savedSplits[athleteId];
    }
    
    /**
     * Indicates if the event with the given details exists in the selectedEvents
     * array. One or both parameters (definition id or name) can be matched.
     * 
     * @example getSpecificEventIndex(4)
     *          --> 2 (400m event has been added)
     * @example getSpecificEventIndex(0, "800m")
     *          --> 0 (800m event has been added; definition is ignored)
     * 
     * @param {Integer} recordDefinitionId record definition id of the event to match
     * @param {String} eventName name of the event
     * 
     * @returns {Integer}
     * The index of the matched event, if it exists. -1 otherwise if not found
     */
    getSpecificEventIndex(recordDefinitionId = 0, eventName = "") {
        if ((recordDefinitionId == 0) && (eventName == "")) {
            return -1;
        }
        
        // Loop through all splits, making sure to match all criteria provided
        for (let l = 0; l < this.selectedEvents.length; l++) {
            let matched = true;
            if ((recordDefinitionId != 0) && (recordDefinitionId != this.selectedEvents[l].definitionId)) {
                matched = false;
            }
            if ((eventName != "") && (eventName.toLowerCase() != this.selectedEvents[l].name.toLowerCase())) {
                matched = false;
            }

            if (matched) {
                return l;
            }
        }

        return -1;
    }
    
    /**
     * Indicates if the split with the given details exists in the selectedSplits
     * array. One or both parameters (distance or name) can be matched.
     * 
     * @example getSpecificSplitIndex(100)
     *          --> 0 (A split with a distance of 100m exists)
     * @example getSpecificSplitIndex(400, "Leg 1 4x400")
     *          --> 2 (Relay split "Leg 3 4x400" exists)
     * 
     * @param {Integer} splitDistance distance of the split in meters
     * @param {String} splitName name of the split, most commonly "<distance>m"
     * 
     * @returns {Integer}
     * The index of the matched split, if it exists. -1 otherwise if not found
     */
    getSpecificSplitIndex(splitDistance = 0, splitName = "") {
        if (typeof splitDistance == "string") {
            splitDistance = parseInt(splitDistance);
        }
        if ((splitDistance == 0) && (splitName == "")) {
            return -1;
        }
        
        // Loop through all splits, making sure to match all criteria provided
        for (let l = 0; l < this.selectedSplits.length; l++) {
            let matched = true;
            if ((splitDistance != 0) && (splitDistance != this.selectedSplits[l].distance)) {
                matched = false;
            }
            if ((splitName != "") && (splitName.toLowerCase() != this.selectedSplits[l].name.toLowerCase())) {
                matched = false;
            }
            
            if (matched) {
                return l;
            }
        }
        
        return -1;
    }
    
    /**
     * Wrapper for getSelectedObjectNames(). See that function for full details
     */
    getSelectedEventNames() {
        return this.getSelectedObjectNames();
    }
    
    /**
     * Wrapper for getSelectedObjectNames(). See that function for full details
     */
    getSelectedSplitNames() {
        return this.getSelectedObjectNames();
    }
    
    /**
     * Compiles a 1D array of the names of the selected objects (either events
     * or splits). This is useful when generating the buttons on the stopwatch
     * slider.
     * 
     * @example getSelectedObjectNames()
     *          --> ["100m Split", "200m Split", "300m Split"]
     * 
     * @returns {Array}
     */
    getSelectedObjectNames() {
        let names = [];
        let workingObject = this.selectedEvents;
        if (this.hasSplits()) {
            workingObject = this.selectedSplits;
        }
        
        for (let o = 0; o < workingObject.length; o++) {
            let currentName = workingObject[o].name;
            // if ((this.hasSplits()) && (workingObject[o].name.toLowerCase() != "finish")) {
            //     currentName = currentName + " Meter Split";
            // }
            names.push(currentName);
        }
        
        return names;
    }
    
    /**
     * Indicates whether or not the user has selected multiple events for the given
     * time.
     * 
     * @example hasMultipleEvents()
     *          --> true
     * 
     * @returns {Boolean}
     * True, if more than one selected events are saved; false otherwise
     */
    hasMultipleEvents() {
        if (this.selectedEvents.length > 1) {
            return true;
        } else {
            return false;
        }
    }
    
    /**
     * Indicates if the user has defined any splits to be recorded during the workout.
     * 
     * @example hasSplits()
     *          --> true
     * 
     * @returns {Boolean}
     * True, if any splits have been selected by the user; false otherwise
     */
    hasSplits() {
        if (this.selectedSplits.length > 0) {
            return true;
        } else {
            return false;
        }
    }
    
    /**
     * Generates and returns a conditional snippet for a database
     * query that filters by the configured gender. This will not
     * include the "WHERE" operator. It can be paired with
     * getGenderDbValue() for query-value insertion
     * 
     * @example getGenderDbQuery()
     *          --> "" (no gender filter)
     * @example getGenderDbQuery()
     *          --> "(athlete.gender = ?)" (with a gender filter)
     * 
     * @returns {String}
     * A conditional query that filters by gender, if applicable
     */
    getGenderDbQuery() {
        if (this.isBoys && this.isGirls) {
            return ""; // No condition
        } else {
            return "(athlete.gender = ?)";
        }
    }
    
    /**
     * Gets the necessary database query value to filter by gender, if configured.
     * This function should be paired with getGenderDbQuery() when populating
     * the database query
     * 
     * @example getGenderDbValue()
     *          --> "" (no gender filter)
     * @example getGenderDbValue()
     *          --> "F" (girls only selected)
     * 
     * @returns {Array}
     * Either ["M"] or ["F"] for men or women's events, respectively, or [] if no
     * filtering was specified
     */
    getGenderDbValue() {
        if (this.isBoys && this.isGirls) {
            return [];
        }
        
        let gender = "M";
        if (this.isGirls) {
            gender = "F";
        }
        return [gender];
    }
    
    /**
     * Generates the event database conditional query to filter by the selected
     * events according to this configuration. It will automatically add the "AND"
     * operator if gender filtering is also enabled (see stopwatch.js generateAthletes() for
     * the reasoning behind "AND")
     * 
     * @example getEventDbQuery()
     *          --> "(record.id_record_definition = ?)" (query for single event)
     * @example getEventDbQuery()
     *          --> "AND (record.id_record_definition = ? OR record..." (gender filtering and multi events)
     * 
     * @returns {String}
     * The portion of a database query tailored for event selection based
     * on the selected events in this Config class.
     */
    getEventDbQuery() {
        let eventQuery = "(";
        // Add in "AND" if gender sorting is also specified
        if (this.isBoys != this.isGirls) {
            eventQuery = "AND (";
        }
        
        eventQuery = eventQuery + ("record.id_record_definition = ? OR ").repeat(this.selectedEvents.length);
        // Remove trailing " OR " and close with parentheses
        eventQuery = eventQuery.substring(0, eventQuery.length - (" OR ").length) + ")";
        return eventQuery;
    }
    
    /**
     * Gets an array of recordDefinitionIds from the selected events, which can
     * be used in conjunction with getEventDbQuery() to search the database
     * for the selected events
     * 
     * @example getEventDbValue()
     *          --> [4] (single event)
     * @example getEventDbValue()
     *          --> [4, 5, 9] (multiple event race)
     * 
     * @returns {Array}
     * A 1D array of record definition ids corresponding to the selected events
     * in this Config class.
     */
    getEventDbValue() {
        let values = [];
        for (let e = 0; e < this.selectedEvents.length; e++) {
            values.push(Number(this.selectedEvents[e].definitionId));
        }
        return values;
    }
    
    
    // GET / SET METHODS //
    
    setIsBoys(newIsBoys) {
        this.isBoys = newIsBoys;
    }
    getIsBoys() {
        return this.isBoys;
    }
    
    setIsGirls(newIsGirls) {
        this.isGirls = newIsGirls;
    }
    getIsGirls() {
        return this.isGirls;
    }
    
    setActiveEventByDefinitionId(definitionId) {
        let eventIndex = this.getSpecificEventIndex(definitionId);
        if (eventIndex != -1) {
            this.setActiveSelectionIndex(eventIndex);
        } else {
            if (DO_LOG) {
                console.log("[EventConfig.js]: Event not found with definition ID " + definitionId);
            }
        }
    }
    setActiveSelectionIndex(index) {
        let workingObject = this.selectedEvents;
        if (this.hasSplits()) {
            workingObject = this.selectedSplits;
        }

        // Do a quick danger check
        if (index > workingObject.length - 1) {
            if (DO_LOG) {
                console.log("[EventConfig.js]: Active index was out of range: " + index);
            }
            index = workingObject.length - 1;
        } else if (index < 0) {
            if (DO_LOG) {
                console.log("[EventConfig.js]: Active index was out of range: " + index);
            }
            index = 0;
        }

        // Set the index
        this.activeSelectionIndex = Number(index);
    }
    getActiveSelectionIndex() {
        return this.activeSelectionIndex;
    }
    
    getSelectedEvents() {
        return this.selectedEvents;
    }
    getSelectedSplits() {
        return this.selectedSplits;
    }
    
    setWantsMultipleEvents(newWantsMultipleEvents) {
        this.wantsMultipleEvents = newWantsMultipleEvents;
    }
    getWantsMultipleEvents() {
        return this.wantsMultipleEvents;
    }
    
    setWantsSplits(newWantsSplits) {
        this.wantsSplits = newWantsSplits;
    }
    getWantsSplits() {
        return this.wantsSplits;
    }
    
    
};
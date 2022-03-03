
class ScreenshotMaker {

    /**
     * Used to manipulate the app, simulating a user, in order to generate
     * specific screens to make screenshot capture easier and more consistent.
     */
    constructor() {
        
        // Every manipulated element should be listed here to allow for easy
        // changes when needed and safety checks
        this.refElements = {
            "App": {
                "stopwatchTab": "body > .navbar #stopwatch",
                "statsTab": "body > .navbar #stats",
                "teamTab": "body > .navbar #teamlanding",
                "settingsTab": "body > .navbar #settings"
            },
            "Stopwatch": {
                "stopwatch": "#stopwatchPage #stopwatch_wrapper",
                "arrow": "#stopwatchPage #slideup_arrow",
                "eventWrapper": "#stopwatchPage #slideup_content",
                "sliderTitle": "#stopwatchPage #slideup",
                "multipleButton": "#stopwatchPage #slideup_content .slideup_top_bar.select_events"
            },
            "Stats": {
                "eventButtons": "#statsPage #landingPage .button_box",
                "headerName": "#statsPage #eventPage #event_header #event_name",
                "backButton": "#statsPage #eventPage #event_header #back_button_event",
                "todaysStatsButton": "#statsPage #landingPage .button_box .generated_button.coaches_button",
                "popupClose": ".popup .popup_content #popup_button_0"
            },
            "Team": {
                "childPages": "#teamlandingPage > .div_page",
                "createPage": "#teamlandingPage > #createteamPage",
                "createChildPages": "#teamlandingPage > #createteamPage > .div_page",
                "postCreatePage": "#teamlandingPage > #createteamPage > #postCreatePage",
                "bannerSteps": "#teamlandingPage #createteamPage #banner .step",
                "inviteCode": "#teamlandingPage #createteamPage #postCreatePage #inviteCode",
                "athletePage": "#teamlandingPage > #teamPage > #landingPage",
                "athleteButton": "#teamlandingPage > #teamPage > #landingPage button[fname='Janice']",
                "eventsPage": "#teamlandingPage > #teamPage > #athletePage",
                "eventWrapper": "#teamlandingPage #athletePage #athlete_events_registered",
                "graphPage": "#teamlandingPage > #teamPage > #athleteStatPage"
            },
            "Settings": {
                
            }
        };
        
    }
    
    
    /**
     * @description Handle any transition display while moving from one page to another. 
     * @param {String} pageName name of the page to transition to
     */
    runWorkflow() {
        
        // Make sure the main page set is active and not the welcome page
        let mainPageSets = ["stopwatchPage", "statsPage", "teamlanding", "settingsPage"];
        if(!mainPageSets.includes($("#app > .div_page").not(".hidden").prop("id"))) {
            if(DO_LOG) {
                console.log("[screenshot-maker.js:runWorkflow()]: Unable to run workflow in Welcome Page Set");
            }
            return;
        }
        if(DO_LOG) {
            console.log("[screenshot-maker.js:runWorkflow()]: Starting screenshot maker workflow");
        }
        
        // Update database to the ideal, screenshot-ready condition
        this.setupDatabase();
        
        // Obejcts that will be set to their respective promise objects below
        let stopwatchSinglePs = $.Deferred();
        let stopwatchMultiplePs = $.Deferred();
        let statsPreviewPs = $.Deferred();
        let todaysStatsPs = $.Deferred();
        let createdTeamPs = $.Deferred();
        let showedGraphPs = $.Deferred();
        
        this.delayAction(3000).then(() => {
            this.stopwatchSingle().then(() => {
                stopwatchSinglePs.resolve();
            });
        });
        stopwatchSinglePs.then(() => {
            if(DO_LOG) {
                console.log("[screenshot-maker.js:runWorkflow()]: Stopwatch Single screenshot completed");
            }

            this.stopwatchMultiple().then(() => {
                stopwatchMultiplePs.resolve();
            });
        });
        stopwatchMultiplePs.then(() => {
            if(DO_LOG) {
                console.log("[screenshot-maker.js:runWorkflow()]: Stopwatch Multiple screenshot completed");
            }

            this.statsPreview().then(() => {
                statsPreviewPs.resolve();
            });
        });
        statsPreviewPs.then(() => {
            if(DO_LOG) {
                console.log("[screenshot-maker.js:runWorkflow()]: Stats screenshot completed");
            }
            
            this.todaysStats().then(() => {
                todaysStatsPs.resolve();
            });
        });
        todaysStatsPs.then(() => {
            if(DO_LOG) {
                console.log("[screenshot-maker.js:runWorkflow()]: Today's Stats screenshot completed");
            }
            
            this.athleteGraph().then(() => {
                showedGraphPs.resolve();
            });
        });
        showedGraphPs.then(() => {
            if(DO_LOG) {
                console.log("[screenshot-maker.js:runWorkflow()]: Athlete Graph screenshot completed");
            }
            
            this.createdTeam().then(() => {
                showedGraphPs.resolve();
            });
        });
        createdTeamPs.then(() => {
            if (DO_LOG) {
                console.log("[screenshot-maker.js:runWorkflow()]: Team Creation screenshot completed");
            }
        });
        
        
    }
    
    // Inserts dummy data into the database for screenshot capture
    setupDatabase() {
        
        let dateObj = new Date();
        let currentDate = dateObj.getFullYear() + "-" +
            ((dateObj.getMonth() + 1) < 10 ? "0" : "") + (dateObj.getMonth() + 1) + "-" +
            (dateObj.getDate() < 10 ? "0" : "") + dateObj.getDate();
        
        // Athlete table
        dbConnection.deleteValues("athlete", "");
        let newAthletes = [
            {"fname": "Janice", "lname": "Calhoun", "gender": "F", "id_backend": 2},
            {"fname": "M-J", "lname": "Jones", "gender": "F", "id_backend": 3},
            {"fname": "May", "lname": "Sonnet", "gender": "F", "id_backend": 4},
            {"fname": "Jim", "lname": "Tellsdale", "gender": "M", "id_backend": 5},
            {"fname": "Veronica", "lname": "Thames", "gender": "F", "id_backend": 6},
            {"fname": "Charles", "lname": "Wellsworth", "gender": "M", "id_backend": 7},
            {"fname": "Thomas", "lname": "Pines", "gender": "M", "id_backend": 8}
        ];
        dbConnection.insertValuesFromObject("athlete", newAthletes);
        
        // Records
        dbConnection.deleteValues("record", "");
        let newRecords = [
            // Janice
            {"id_record": 1, "value": 1371.005, "id_record_definition": 18, "is_practice": 0, "last_updated": "2021-09-04 17:00:00"},
            {"id_record": 2, "value": 1391.414, "id_record_definition": 18, "is_practice": 0, "last_updated": "2021-09-05 17:00:00"},
            {"id_record": 3, "value": 1385.610, "id_record_definition": 18, "is_practice": 0, "last_updated": "2021-09-06 17:00:00"},
            {"id_record": 4, "value": 1310.994, "id_record_definition": 18, "is_practice": 0, "last_updated": "2021-09-09 17:00:00"},
            {"id_record": 5, "value": 1307.714, "id_record_definition": 18, "is_practice": 0, "last_updated": currentDate + " 17:00:00"},
            {"id_record": 6, "value": 1310.551, "id_record_definition": 18, "is_practice": 0, "last_updated": currentDate + " 17:45:00"},
            // May
            {"id_record": 7, "value": 11.518, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-14 17:00:00"},
            {"id_record": 8, "value": 13.823, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-14 17:30:00"},
            {"id_record": 9, "value": 10.491, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-15 17:00:00"},
            {"id_record": 10, "value": 10.138, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-15 17:30:00"},
            {"id_record": 11, "value": 8.671, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-16 17:00:00"},
            // Jim
            {"id_record": 12, "value": 1281.042, "id_record_definition": 18, "is_practice": 0, "last_updated": "2021-09-04 17:00:00"},
            {"id_record": 13, "value": 1276.371, "id_record_definition": 18, "is_practice": 0, "last_updated": "2021-09-05 17:00:00"},
            {"id_record": 14, "value": 1258.991, "id_record_definition": 18, "is_practice": 0, "last_updated": "2021-09-06 17:00:00"},
            {"id_record": 15, "value": 1256.005, "id_record_definition": 18, "is_practice": 0, "last_updated": "2021-09-08 17:00:00"},
            {"id_record": 16, "value": 1268.522, "id_record_definition": 18, "is_practice": 0, "last_updated": currentDate + " 17:00:00"},
            // Veronica
            {"id_record": 17, "value": 15.340, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-22 17:00:00"},
            {"id_record": 18, "value": 15.660, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-22 17:30:00"},
            {"id_record": 19, "value": 11.880, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-23 17:00:00"},
            {"id_record": 20, "value": 14.970, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-23 17:30:00"},
            {"id_record": 21, "value": 12.860, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-24 17:00:00"},
            {"id_record": 22, "value": 12.640, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-24 17:30:00"},
            {"id_record": 23, "value": 11.520, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-25 17:00:00"},
            // Charles
            {"id_record": 24, "value": 1243.334, "id_record_definition": 18, "is_practice": 0, "last_updated": "2021-09-04 17:00:00"},
            {"id_record": 25, "value": 1238.190, "id_record_definition": 18, "is_practice": 0, "last_updated": "2021-09-05 17:00:00"},
            {"id_record": 26, "value": 1239.654, "id_record_definition": 18, "is_practice": 0, "last_updated": "2021-09-06 17:00:00"},
            {"id_record": 27, "value": 1236.141, "id_record_definition": 18, "is_practice": 0, "last_updated": "2021-09-09 17:00:00"},
            {"id_record": 28, "value": 1227.891, "id_record_definition": 18, "is_practice": 0, "last_updated": currentDate + " 17:00:00"},
            // Thomas
            {"id_record": 29, "value": 12.663, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-14 17:00:00"},
            {"id_record": 30, "value": 12.519, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-14 17:30:00"},
            {"id_record": 31, "value": 13.390, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-15 17:00:00"},
            {"id_record": 32, "value": 9.828, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-15 17:30:00"},
            {"id_record": 33, "value": 9.607, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-16 17:00:00"},
            {"id_record": 34, "value": 10.114, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-16 17:30:00"},
            {"id_record": 35, "value": 10.994, "id_record_definition": 3, "is_practice": 0, "last_updated": "2021-04-17 17:00:00"}
            
        ];
        dbConnection.insertValuesFromObject("record", newRecords);
        
        // Splits
        dbConnection.deleteValues("record_split", "");
        let newSplits = [
            // Janice (5k splits)
            {"id_split": 1, "id_record": 1, "value": 460.441, "split_name": "1600", "split_index": 0, "last_updated": "2021-09-04 17:00:00"},
            {"id_split": 2, "id_record": 1, "value": 874.891, "split_name": "3200", "split_index": 1, "last_updated": "2021-09-04 17:00:00"},
            {"id_split": 3, "id_record": 1, "value": 1255.301, "split_name": "4800", "split_index": 2, "last_updated": "2021-09-04 17:00:00"},
            {"id_split": 4, "id_record": 2, "value": 399.504, "split_name": "1600", "split_index": 0, "last_updated": "2021-09-05 17:00:00"},
            {"id_split": 5, "id_record": 2, "value": 760.552, "split_name": "3200", "split_index": 1, "last_updated": "2021-09-05 17:00:00"},
            {"id_split": 6, "id_record": 2, "value": 1240.891, "split_name": "4800", "split_index": 2, "last_updated": "2021-09-05 17:00:00"},
            {"id_split": 7, "id_record": 3, "value": 445.449, "split_name": "1600", "split_index": 0, "last_updated": "2021-09-06 17:00:00"},
            {"id_split": 8, "id_record": 3, "value": 858.845, "split_name": "3200", "split_index": 1, "last_updated": "2021-09-06 17:00:00"},
            {"id_split": 9, "id_record": 3, "value": 1227.810, "split_name": "4800", "split_index": 2, "last_updated": "2021-09-06 17:00:00"},
            {"id_split": 10, "id_record": 4, "value": 506.337, "split_name": "1600", "split_index": 0, "last_updated": "2021-09-09 17:00:00"},
            {"id_split": 11, "id_record": 4, "value": 866.144, "split_name": "3200", "split_index": 1, "last_updated": "2021-09-09 17:00:00"},
            {"id_split": 12, "id_record": 4, "value": 1248.899, "split_name": "4800", "split_index": 2, "last_updated": "2021-09-09 17:00:00"},
            {"id_split": 13, "id_record": 5, "value": 488.999, "split_name": "1600", "split_index": 0, "last_updated": currentDate + " 17:00:00"},
            {"id_split": 14, "id_record": 5, "value": 887.411, "split_name": "3200", "split_index": 1, "last_updated": currentDate + " 17:00:00"},
            {"id_split": 15, "id_record": 5, "value": 1180.994, "split_name": "4800", "split_index": 2, "last_updated": currentDate + " 17:00:00"},
            {"id_split": 16, "id_record": 6, "value": 447.801, "split_name": "1600", "split_index": 0, "last_updated": currentDate + " 17:00:00"},
            {"id_split": 17, "id_record": 6, "value": 771.368, "split_name": "3200", "split_index": 1, "last_updated": currentDate + " 17:00:00"},
            {"id_split": 18, "id_record": 6, "value": 1140.340, "split_name": "4800", "split_index": 2, "last_updated": currentDate + " 17:00:00"}
            
        ];
        dbConnection.insertValuesFromObject("record_split", newSplits);
        
        // Record User Link
        dbConnection.deleteValues("record_user_link", "");
        let newLinks = [
            // Janice
            {"id_backend": 2, "id_record": 1},
            {"id_backend": 2, "id_record": 2},
            {"id_backend": 2, "id_record": 3},
            {"id_backend": 2, "id_record": 4},
            {"id_backend": 2, "id_record": 5},
            {"id_backend": 2, "id_record": 6},
            // May
            {"id_backend": 4, "id_record": 7},
            {"id_backend": 4, "id_record": 8},
            {"id_backend": 4, "id_record": 9},
            {"id_backend": 4, "id_record": 10},
            {"id_backend": 4, "id_record": 11},
            // Jim
            {"id_backend": 5, "id_record": 12},
            {"id_backend": 5, "id_record": 13},
            {"id_backend": 5, "id_record": 14},
            {"id_backend": 5, "id_record": 15},
            {"id_backend": 5, "id_record": 16},
            // Veronica
            {"id_backend": 6, "id_record": 17},
            {"id_backend": 6, "id_record": 18},
            {"id_backend": 6, "id_record": 19},
            {"id_backend": 6, "id_record": 20},
            {"id_backend": 6, "id_record": 21},
            {"id_backend": 6, "id_record": 22},
            {"id_backend": 6, "id_record": 23},
            // Charles
            {"id_backend": 7, "id_record": 24},
            {"id_backend": 7, "id_record": 25},
            {"id_backend": 7, "id_record": 26},
            {"id_backend": 7, "id_record": 27},
            {"id_backend": 7, "id_record": 28},
            // Thomas
            {"id_backend": 8, "id_record": 29},
            {"id_backend": 8, "id_record": 30},
            {"id_backend": 8, "id_record": 31},
            {"id_backend": 8, "id_record": 32},
            {"id_backend": 8, "id_record": 33},
            {"id_backend": 8, "id_record": 34},
            {"id_backend": 8, "id_record": 35}
        ];
        dbConnection.insertValuesFromObject("record_user_link", newLinks);
        
    }
    
    // -- SCREENSHOT WORKFLOWS -- //
    
    // Pauses the stopwatch at 11.41 seconds with the 100m event and with a
    // specified roster
    stopwatchSingle() {
        
        let actionFinished = $.Deferred();
        
        // Make sure we're on the Stopwatch page and reset it
        $(this.refElements["App"]["stopwatchTab"]).trigger("click");
        $(this.refElements["Stopwatch"]["stopwatch"]).trigger("dblclick");
        
        // Delay to allow page transition to finish, then select the event
        let eventSelected = $.Deferred();
        this.delayAction(2000).then(() => {
            // Open event slider
            $(this.refElements["Stopwatch"]["arrow"]).trigger("click");
            this.delayAction(2000).then(() => {
                // Select 100m
                $(this.refElements["Stopwatch"]["eventWrapper"] + " .generated_button[record_identity='75m']").trigger("click");
                this.delayAction(2000).then(() => {
                    eventSelected.resolve();
                });
            });
        });
        
        // Start the event, wait for 11.41, then pause to allow a screenshot to be captured
        let stopwatchPaused = $.Deferred();
        eventSelected.then(() => {
            // Start the event
            $(this.refElements["Stopwatch"]["stopwatch"]).trigger("click");
            this.delayAction(11415).then(() => {
                // Pause the stopwatch
                $(this.refElements["Stopwatch"]["stopwatch"]).trigger("click");
                stopwatchPaused.resolve();
            });
        });
        
        // Populate with pre-defined athletes and then clear the remaining athletes
        stopwatchPaused.then(() => {
            
            // Change it from the 75m event (no athletes with former times) to 100m (more common event)
            $(this.refElements["Stopwatch"]["sliderTitle"]).text("100m");
            
            this.delayAction(4000).then(() => {
                $(this.refElements["Stopwatch"]["stopwatch"]).trigger("dblclick");
                actionFinished.resolve();
            });
        });
        
        return actionFinished;
    }
    
    // Loads the stopwatch page with 75m and 100m dash multiple event
    // pages with a pre-programmed roster
    stopwatchMultiple() {

        let actionFinished = $.Deferred();

        // Make sure we're on the Stopwatch page and reset it
        $(this.refElements["App"]["stopwatchTab"]).trigger("click");
        $(this.refElements["Stopwatch"]["stopwatch"]).trigger("dblclick");

        // Delay to allow page transition to finish, then select the event
        let eventSelected = $.Deferred();
        this.delayAction(2000).then(() => {
            // Open event slider
            $(this.refElements["Stopwatch"]["arrow"]).trigger("click");
            this.delayAction(2000).then(() => {
                // Select 75m and 100m multiple events
                $(this.refElements["Stopwatch"]["eventWrapper"] + " .generated_button[record_identity='100m']").trigger("longclick");
                $(this.refElements["Stopwatch"]["eventWrapper"] + " .generated_button[record_identity='75m']").trigger("click");
                this.delayAction(1000).then(() => {
                    $(this.refElements["Stopwatch"]["multipleButton"]).trigger("click");
                });
                this.delayAction(2000).then(() => {
                    eventSelected.resolve();
                });
            });
        });

        // Start the event, wait for 5.78, then pause to allow a screenshot to be captured
        let stopwatchPaused = $.Deferred();
        eventSelected.then(() => {
            // Start the event
            $(this.refElements["Stopwatch"]["stopwatch"]).trigger("click");
            this.delayAction(5780).then(() => {
                // Pause the stopwatch
                $(this.refElements["Stopwatch"]["stopwatch"]).trigger("click");
                stopwatchPaused.resolve();
            });
        });

        // Populate with pre-defined athletes and then clear the remaining athletes
        stopwatchPaused.then(() => {
            
            this.delayAction(4000).then(() => {
                $(this.refElements["Stopwatch"]["stopwatch"]).trigger("dblclick");
                actionFinished.resolve();
            });
        });

        return actionFinished;
    }
    
    // Shows stats page for 100m event
    statsPreview() {
        
        let actionFinished = $.Deferred();
        
        // Make sure we're on the Stopwatch page
        $(this.refElements["App"]["statsTab"]).trigger("click");
        
        // Delay to allow page transition to finish, then show the 100m event page
        this.delayAction(2000).then(() => {
            // Click the first event to set up the basic Event Page table elements
            $(this.refElements["Stats"]["eventButtons"] + " .generated_button[record_identity='100m']").trigger("click");
            
            // Wait for screenshot capture
            this.delayAction(4000).then(() => {
                $(this.refElements["Stats"]["backButton"]).trigger("click");
                actionFinished.resolve();
            });
        });
        
        return actionFinished;
    }
    
    // Opens the "Today's Stats popup"
    todaysStats() {

        let actionFinished = $.Deferred();

        // Make sure we're on the Stopwatch page
        $(this.refElements["App"]["statsTab"]).trigger("click");

        // Delay to allow page transition to finish, then open the popup
        this.delayAction(2000).then(() => {
            // Open the "Today's Times" popup dialog
            $(this.refElements["Stats"]["todaysStatsButton"]).trigger("click");

            // Wait for screenshot capture
            this.delayAction(4000).then(() => {
                // Reset page and finish action
                $(this.refElements["Stats"]["popupClose"]).trigger("click");
                actionFinished.resolve();
            });
        });
        
        return actionFinished;
    }
    
    // Shows the screen present after a team is created
    createdTeam() {
        
        let actionFinished = $.Deferred();
        
        // Navigate to the team page
        $(this.refElements["App"]["teamTab"]).trigger("click");
        
        // Allow the page to transition, then forcefully show the teamCreate sub-page
        this.delayAction(2000).then(() => {
            
            // Hide all pages except the successful team creation page
            $(this.refElements["Team"]["childPages"]).not(this.refElements["Team"]["createPage"]).addClass("hidden");
            $(this.refElements["Team"]["createPage"]).removeClass("hidden");
            $(this.refElements["Team"]["createChildPages"]).not(this.refElements["Team"]["postCreatePage"]).addClass("hidden");
            
            // Set banner and invite code
            $(this.refElements["Team"]["bannerSteps"]).addClass("step_selected");
            $(this.refElements["Team"]["inviteCode"]).text("lclcm3y");
            
            // Delay to allow for screenshot
            this.delayAction(4000).then(() => {
                // Undo manual page manipulation
                $(this.refElements["Team"]["createPage"]).addClass("hidden");
                $(this.refElements["Team"]["createChildPages"]).removeClass("hidden");
                
                // Re-swipe to the Team page to reset page visibility
                $(this.refElements["App"]["settingsTab"]).trigger("click");
                this.delayAction(2000).then(() => {
                    $(this.refElements["App"]["teamTab"]).trigger("click");
                    this.delayAction(2000).then(() => {
                        actionFinished.resolve();
                    });
                });
            });
            
        });
        
        return actionFinished;
    }
    
    // Shows graph for the 5k event for Janice with splits
    athleteGraph() {

        let actionFinished = $.Deferred();

        // Make sure we're on the Stopwatch page
        $(this.refElements["App"]["teamTab"]).trigger("click");

        // Delay to allow page transition to finish, then click Janice on the athlete page
        this.delayAction(2000).then(() => {
            // Click the first event to set up the basic Event Page table elements
            $(this.refElements["Team"]["athleteButton"]).trigger("click");
            console.log(this.refElements["Team"]["athleteButton"]);
            
            // Wait for transition, then select first event button (should be 5k)
            this.delayAction(2000).then(() => {
                $(this.refElements["Team"]["eventWrapper"] + " .generated_button:first").trigger("click");
                
                // Wait for screenshot capture, then move back out of pages
                this.delayAction(4000).then(() => {
                    $(this.refElements["Team"]["graphPage"] + " .back_button").trigger("click");
                    this.delayAction(2000).then(() => {
                        $(this.refElements["Team"]["eventsPage"] + " .back_button").trigger("click");
                        this.delayAction(2000).then(() => {
                            actionFinished.resolve();
                        });
                    });
                });
            });
        });
        
        return actionFinished;
    }
    
    
    // -- UTIL FUNCTIONS -- //
    
    /**
     * Used to delay execution while somewhat maintaining indentation and providing
     * a semi-synchronous delay structure
     * 
     * @example
     * delayAction(1000).then(() => { console.log("1 second has passed") })
     * 
     * @param {Integer} timeout delay in milliseconds to wait before resolving the promise
     * @returns 
     * A Promise object. Use .then() to continue execution after the delay
     * has elapsed
     */
    delayAction(timeout) {
        return new Promise((delayDone) => {
            setTimeout(() => {
                delayDone();
            }, timeout);
        });
    }
    
}
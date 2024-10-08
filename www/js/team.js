/**
 * @classdesc The team page will house everything from the team roster, join and create functionallity, individual athletes, and a team code.
 * @class
 */
class Team extends Page {
    constructor(id, pageSetObject) {
        super(id, "Team");
        this.hasStarted = false;

        this.pageController = pageSetObject;
        this.pageTransition = new PageTransition("#teamPage");
        this.isEditing = false;
        this.rowsToDelete = [];
        this.rowsToModify = [];

        this.landingPageSelector = "#teamPage #landingPage";

        this.athleteButtonsBoxSelectorMales = "#teamPage #landingPage #male_container";
        this.athleteButtonsBoxSelectorFemales = "#teamPage #landingPage #female_container";

        this.athleteBoxSelector = "#teamPage #landingPage .button_box";

        // --- PAGES ---- //

        this.landingPage = (`
            <div id="landingPage" class="div_page">
                <div class="left_container">
                    <div id="team_name" class="left_text underline">My Team</div>
                </div>

                <button id="invite_athletes" class="generated_button">Invite Athletes +</button>
                <button id="import_roster" class="generated_button">Import Roster +</button>

                <div class="button_box"></div>
            </div>
        `);

        //     <div class="row">
        //     <div id="male_container" class="athlete_container"></div>
        //     <div id="female_container" class="athlete_container"></div>
        // </div>

        this.athletePage = (`
            <div id="athletePage" class="div_page">
                <div id="athlete_header" class="generic_header">
                    <div id="back_button_athlete" class="back_button">&#9668;</div>
                    <h1 id="athleteName"></h1>
                    <div></div>
                </div>
                <div id="paddingDiv"></div>
                <div id="athlete_events_registered"></div>
                <div id="athlete_events_remaining"></div>
            </div>
        `);


        this.athleteStatPage = (`
            <div id="athleteStatPage" class="div_page">
                <div class="generic_header">
                    <div id="back_button_athlete_stats" class="back_button">&#9668;</div>
                    <h1>Athlete Stats</h1>
                    <div></div>
                </div>
                
                <div id="paddingDiv"></div>
                <canvas id="athlete_stat_chart"></canvas>
                <table class="alternating_table_shade" id="athlete_stats_container"></table>
            </div>
        `);
        
        this.membershipRequired = (`
            <div id="membershipPage" class="div_page">
                <img id="sorryImg" src="img/logo-sad.png" alt="">
                <br>
                <h1>Membership Required</h1>
                <p id="statusText">The team you're on no longer has a membership.
                </p>
                <p>You can still edit your account or team preferences in the Settings
                    tab at any time.
                </p>
                <button id="openPremiumPopup" class="sw_big_button">Continue Improving</button>
            </div>
        `);
    }

    getHtml() {

        return (`
            <div id="teamPage" class="div_page">
                ${this.landingPage}
                ${this.athletePage}
                ${this.athleteStatPage}
            </div>
        `);
    }

    start() {
        
        // Only link them to pageTransition once
        if (this.pageTransition.getPageCount() == 0) {
            this.pageTransition.addPage("landingPage", this.landingPage, true);
            this.pageTransition.addPage("athletePage", this.athletePage, false);
            this.pageTransition.addPage("athleteStatPage", this.athleteStatPage, false);
            this.pageTransition.addPage("membershipPage", this.membershipRequired, false);
        } else {
            // Hide all and show (needed for new team-landing.js)
            this.pageTransition.hidePages();
            this.pageTransition.showCurrentPage();
            /*
             * Explanation: team-landing.js calls start() on all team objects
             * to set up the sub-pages for each. Consequently, this populates
             * the PageTransition page count, so when the user swipes to the
             * 'Team' tab and start() is called again, the former if branch is skipped,
             * showing every page. The latter if branch will hide the other pages
             * and only show the current page, resulting in the desired outcome
             */
        }

        let storage = window.localStorage;

        let teamName = storage.getItem("teamName");

        if (teamName == null) {
            teamName = "My Team";
        }

        $(`${this.landingPageSelector} #team_name`).html(teamName);
        // $(`${this.landingPageSelector} #team_name`).slideUp(1000);
        // $(`${this.landingPageSelector} #team_name`).fadeIn(1000);
        
        // If the membership has expired, show the Membership page and setup logic
        if (storage.getItem("validMembership") == "false") {
            this.startMembershipPage();
            return;
        } else if(this.pageTransition.getCurrentPage() == "membershipPage") {
            this.pageTransition.slideLeft("landingPage");
        }
        
        if (!this.hasStarted) {
            this.hasStarted = true;

            let teamCode = "Unknown";
            if (storage.getItem("inviteCode") != null) {
                teamCode = storage.getItem("inviteCode");
            }


            $("#teamPage #invite_athletes").click(function (e) {
                Popup.createConfirmationPopup(`
                    <div id="inviteCode" class="subheading_text">
                        Invite Code: <span class="underline">${teamCode}</span>
                        <br><br>Have your athletes create an account and enter this code!
                    </div>
                `, ["Ok"], [() => {}]);
            });
            $("#teamPage #import_roster").click(function (e) {
                Popup.createImportPopup();
            });
        }
        
        // Show the icons
        this.startLandingPage(() => {
            Animations.fadeInChildren(this.athleteBoxSelector, Constant.fadeDuration, Constant.fadeIncrement);
        });
    }


    /**
     * @description start the landing page
     * @param {function} callback the function to be called when elements are done being generated
     */
    startLandingPage(callback) {

        $("#teamPage #landingPage #male_container").empty();
        $("#teamPage #landingPage #female_container").empty();
        $(this.athleteBoxSelector).empty();

        // generate list of athletes then hide them
        dbConnection.selectValues("SELECT *, ROWID FROM athlete", []).then((athletes) => {
            if (athletes != false) {
                let storage = window.localStorage;
                let teamName = "My Team";

                if (storage.getItem("teamName") != null) {
                    teamName = storage.getItem("teamName");
                }

                let array = []

                for (let i = 0; i < athletes.length; i++) {
                    if (athletes.item(i).id_backend != localStorage.id_coachPrimary) {
                        array.push(athletes.item(i));
                    } else {
                        // generate custom button for the coach
                        let coach = athletes.item(i);

                        let coachButton = $("<div>", {
                            html: "Coach " + " " + coach.lname,
                            class: "generated_button coaches_button"
                        });

                        coachButton.click(() => {
                            Popup.createConfirmationPopup(`
                                Coach ${coach.lname}<br><br>

                                ${localStorage.getItem("schoolName") === null ? "" : ("Head coach for " + localStorage.getItem("schoolName"))}<br><br>

                                `, ["View Profile", "Close"], [ () => {
                                // consider having the coach's contact information here
                                // Email: ${localStorage.getItem("coachEmail") | "N/A"}<br>
                                // Phone: ${localStorage.getItem("coachPhoneNumber") | "N/A"}
                                this.startAthletePage(athletes.item(i));
                            }, () => { /* Close, do nothing */ }])
                        });

                        $(this.athleteBoxSelector).append(coachButton);
                        console.log("coach is " + JSON.stringify(athletes.item(i)));
                    }
                }

                $("#teamPage #landingPage .left_text").html(teamName);
                $("#teamPage #landingPage .subheading_text").remove();
                $("#teamPage #landingPage .missing_info_text").remove();

                ButtonGenerator.generateButtonsFromDatabase(this.athleteBoxSelector, array, (athlete) => {
                    this.startAthletePage(athlete);
                }, ["gender", "id_athlete_event_register", "id_backend", "rowid"], Constant.genderColorConditionalAttributes, "lname");

                // Animations.hideChildElements(this.athleteButtonsBoxSelectorMales);
                // Animations.hideChildElements(this.athleteButtonsBoxSelectorFemales);
                Animations.hideChildElements(this.athleteBoxSelector);

                callback();
            } else {
                $("#teamPage #landingPage .left_text").empty();
                if ($("#teamPage #landingPage .missing_info_text").length == 0) {
                    $("#teamPage #landingPage").append(`
                        <div class="missing_info_text">
                            There aren't any athletes on your team yet. If you haven't invited anyone yet, hit the "Invite Athletes" button to get started!
                        </div>
                    `);
                }
            }
        });
    }


    /**
     * This function will take a athlete and display all of their events on the screen.
     * @param {Object} athlete the athlete object to display
     */
    startAthletePage(athlete) {

        $("#teamPage #athletePage #athlete_events_registered").empty()
        $("#teamPage #athletePage #athlete_events_remaining").empty()

        // get any unique entries in record identity with values
        let registeredEventsQuery = (`
            SELECT DISTINCT record_definition.record_identity, record_definition.rowid from record_definition
            INNER JOIN record
            ON record_definition.rowid = record.id_record_definition
            INNER JOIN record_user_link
            ON record_user_link.id_record = record.id_record
            WHERE record_user_link.id_backend = ?
        `);

        let remainingEventsQuery = (`
            SELECT DISTINCT record_definition.record_identity, record_definition.rowid from record_definition
            WHERE record_definition.unit = ?
            EXCEPT
            SELECT DISTINCT record_definition.record_identity, record_definition.rowid from record_definition
            INNER JOIN record
            ON record_definition.rowid = record.id_record_definition
            INNER JOIN record_user_link
            ON record_user_link.id_record = record.id_record
            WHERE record_user_link.id_backend = ?
        `);

        let registeredEventsPromise = dbConnection.selectValues(registeredEventsQuery, [athlete.id_backend]);
        let remainingEventsPromise = dbConnection.selectValues(remainingEventsQuery, ["second", athlete.id_backend]);


        // generate events
        Promise.all([registeredEventsPromise, remainingEventsPromise]).then((events) => {

            // generate registered events
            ButtonGenerator.generateButtonsFromDatabase("#teamPage #athletePage #athlete_events_registered", events[0], (event) => {
                this.startAthleteStatPage(athlete, event);
            }, ["gender", "unit", "is_relay", "last_updated"], Constant.eventColorConditionalAttributes, "class");

            $("#teamPage #athletePage #athlete_events_registered").append(`
                <br><br>
                <div class="subheading_text">Other Events</div>
                <hr>
            `);

            $("#teamPage #athletePage #athlete_events_registered").prepend(`
                <div class="subheading_text">Events With Saved Times</div>
            `);

            // generate remaining events
            ButtonGenerator.generateButtonsFromDatabase("#teamPage #athletePage #athlete_events_remaining", events[1], (event) => {
                this.startAthleteStatPage(athlete, event);
            }, ["gender", "unit", "is_relay", "last_updated"], Constant.eventColorConditionalAttributes, "class");
        });

        // Set athlete data before sliding
        $("#athletePage").find("#athleteName").html(`${athlete.fname} ${athlete.lname}`);

        // After populated, slide
        this.pageTransition.slideLeft("athletePage");
        // While transitioning, scroll to the top
        $("#teamPage").animate({
            scrollTop: 0
        }, 1000);
        
        // Add top padding to avoid header overlap (iOS issue)
        let headerWidth = $("#teamPage #athletePage > .generic_header").height();
        $("#teamPage #athletePage > #paddingDiv").first().css("margin-top", `calc(${headerWidth}px + 5vh)`);

        // Slide back; athlete page will be overwritten next select
        $("#back_button_athlete").off("click");
        $("#back_button_athlete").bind("click", (e) => {
            this.pageTransition.slideRight("landingPage");
            // Reset scroll
            $("#teamPage").animate({
                scrollTop: 0
            }, 1000);
        });
    }

    /**
     * this function will obtain the appropriate data for the given athlete and event
     * and initialize the page. It will also call "generateAthleteStatPageContent"
     * 
     * @param {Object} athlete db athlete results
     * @param {Object} event db event results
     */
    startAthleteStatPage(athlete, event) {

        this.pageTransition.slideLeft("athleteStatPage");
        // While transitioning, scroll to the top
        $("#teamPage").animate({
            scrollTop: 0
        }, 1000);
        // Padding added in createTable function

        this.tableData = [];
        
        $("#teamPage #athleteStatPage *").off("click");
        $("#teamPage #athleteStatPage #athlete_stats_container").empty();
        $("#teamPage #athleteStatPage .missing_info_text").remove();

        // back button
        $("#teamPage #athleteStatPage #back_button_athlete_stats").bind("click", () => {
            // stop editing so columns don't delete
            this.isEditing = false;
            this.pageTransition.slideRight("athletePage");
            // Scroll to the top
            $("#teamPage").animate({
                scrollTop: 0
            }, 1000);
        });
        
        // Add padding for iOS's weird screens (10vh to account for missing graph if there's only the table)
        let headerHeight = $("#teamPage #athleteStatPage > .generic_header").height();
        $("#teamPage #athleteStatPage #paddingDiv").first().css("margin-top", `calc(${headerHeight}px + 7.5vh)`);
        
        let datasets = [];

        let recordsPromise = dbConnection.selectValues(Constant.queryRecordsForAthleteEvent, [event.rowid, athlete.id_backend]);
        let splitRecordsPromise = dbConnection.selectValues(Constant.querySplitRecordsForAthleteEvent, [event.rowid, athlete.id_backend]);
        
        Promise.all([recordsPromise, splitRecordsPromise]).then((records) => {

            let results = records[0];
            let splits = records[1];
            
            // no records, don't show a graph or table.
            if ((results == false || results.length == undefined)) {
                $("#athlete_stat_chart").remove();
                $("#athlete_stats_container").remove();
                $("#edit_values_button").remove();
                $("#teamPage #athleteStatPage .missing_info_text").remove();

                this.createTable(athlete, results, splits, event.rowid);
                $("#teamPage #athleteStatPage").append(`<div class="missing_info_text">No times for this athlete's events. Add them here or at the stopwatch.</div>`);

                return;
                // records exist, fill the data array
            } else {
                let length = results.length | 0;

                // Graph.js takes an array of objects for datasets, and the "data" property for each object is an array of objects 
                // with an x and y property
                // this dataset will always be there
                let recordData = {
                    data: [],
                    label: "Race Times"
                };
                let idOnAxisMapping = []; // Maps record ids to their x coordinate to correctly position splits ([id] => x-val)

                for (let i = 0; i < length; i++) {
                    recordData["data"].push({
                        x: i + 1,
                        y: results.item(i).value
                    });
                    idOnAxisMapping[results.item(i).id_record] = i + 1;
                }

                datasets.push(recordData);

                // only push results, no splits
                if (splits != false || splits.length != undefined) {
                    // create an object of objects that will go into the datasets property array.
                    // this is so it's easy to map the split name to an object without having to track indices
                    let splitObject = {};

                    for (let i = 0; i < splits.length; i++) {

                        // console.log("SPLIT " + i + ": " + JSON.stringify(splits.item(i)));
                        let splitKey = splits.item(i).split_name;

                        if (splitObject[splitKey] === undefined) {
                            splitObject[splitKey] = {
                                data: [],
                                label: splitKey
                                // label: splitKey + " Meter Split"
                            };
                        }

                        splitObject[splitKey]["data"].push({
                            x: (idOnAxisMapping[splits.item(i).id_record]),
                            y: splits.item(i).value
                        });
                    }

                    let keys = Object.keys(splitObject);
                    keys.forEach(key => {
                        datasets.push(splitObject[key]);
                    });
                }
            }
            
            // console.log("DATASETS " + JSON.stringify(datasets));
            // console.log("datasets length " + datasets.length);

            // don't show graph if there is only a single point
            if (results.length == 1) {
                $("#athlete_stat_chart").remove();
                this.createTable(athlete, results, splits, event.rowid);
                // there is enough data, graph
            } else if (results.length != 0) {
                this.createGraph(datasets);
                this.createTable(athlete, results, splits, event.rowid);
            }
        });
    }
    
    
    startMembershipPage() {
        this.pageTransition.forceHaltSlide();
        this.pageTransition.hidePages();
        this.pageTransition.setCurrentPage("membershipPage");
        this.pageTransition.showCurrentPage();
        let storage = window.localStorage;
        
        // Customize content to reflect the user (are they a coach, user, etc.)
        let statusText = "The team that you're on no longer has a membership. ";
        let customizedContent = ``;
        if((storage.getItem("id_user") == storage.getItem("id_coachPrimary")) || 
            (storage.getItem("id_user") == storage.getItem("id_coachSecondary"))) {
            customizedContent = `You currently have <u>a few days to reactivate</u> your membership.
                                After that, any athlete can purchase a membership for the team.`;
            $("#teamPage #membershipPage #openPremiumPopup").css("display", "inline-block");
        } else {
            customizedContent = `Your coach has a few days to renew their membership. After that,
                                you'll be able to purchase a membership for the team.`;
            $("#teamPage #membershipPage #openPremiumPopup").css("display", "none");
        }
        
        // Submit a backend request to get the number of days left
        PlanBackend.getMembershipStatus(storage.getItem("email"), (response) => {
            if(response.status > 0) {
                let daysLeft = 7 - response.daysSinceExpire;
                if(daysLeft <= 0) {
                    customizedContent = `It has been over one week since the team membership expired.
                                        Any athlete can now purchase a membership for the team.`;
                    $("#teamPage #membershipPage #openPremiumPopup").css("display", "inline-block");
                } else {
                    let dayWord = "days";
                    if(daysLeft == 1) { // Define here so it doesn't say "1 days"
                        dayWord = "day"
                    }
                    customizedContent = customizedContent.replace("a few days", daysLeft + " " + dayWord);
                }
            }
            statusText = statusText + customizedContent;
            $("#teamPage #membershipPage #statusText").html(statusText);
        });
        
        // Define click handler
        $("#teamPage #membershipPage #openPremiumPopup").off(); // Remove any old handlers
        $("#teamPage #membershipPage #openPremiumPopup").click((e) => {
            Popup.createPremiumPopup();
        });
        
        $("#app").off("didPurchase"); // Remove old event to prevent duplicates
        $("#app").on("didPurchase", () => {
            console.log(this.pageTransition.getCurrentPage());
            this.pageTransition.setCurrentPage("landingPage");
            this.start();
        });
        
        // Set up a loop so that when they unlock the app, we switch to the landing page
        // let membershipCheckLoop = setInterval(() => {
        //     if(storage.getItem("validMembership") == "true") {
        //         this.pageTransition.slideLeft("landingPage");
        //         clearInterval(membershipCheckLoop);
        //     }
        // }, 5000);
    }

    /**
     * @description construct a table to display the given results
     * 
     * @param {Object} athlete db athlete info
     * @param {Object} results database results
     * @param {Object} splits db splits info for the event
     * @param {Object} id_record_definition event id
     */
    createTable(athlete, results, splits, id_record_definition) {
        $("#athlete_stats_container").remove();
        $("#edit_values_button").remove();
        $("#add_value_button").remove();
        $("#cancel_edit_button").remove();
        $("#teamPage #athleteStatPage").append(`<table class="alternating_table_shade" id="athlete_stats_container"></table>`);
        $("#teamPage #athleteStatPage").append(`<button class="edit_values_button action_button" id="edit_values_button">Edit</button>`);
        $("#teamPage #athleteStatPage").append(`<button class="add_values_button action_button" id="add_value_button">Add Value</button>`);

        let addContainer = function (e) {
            $("#athlete_stats_container").append(`
                <tr isAdded="true" id_backend="${athlete.id_backend}" id_record_definition="${id_record_definition}">
                    <td>${new Date(Date.now()).toLocaleDateString("en-US")}</td>
                    <td></td>
                </tr>
            `);
        };

        $("#add_value_button").click(addContainer);

        // click edit values button
        $("#teamPage #athleteStatPage").off("click", "#cancel_edit_button, #edit_values_button");
        $("#teamPage #athleteStatPage").on("click", "#cancel_edit_button, #edit_values_button", (e) => {
            if($(e.target).prop("id") == "cancel_edit_button") {
                this.rowsToDelete = []; // Clear the deletion array
                $("#teamPage #athlete_stats_container tr").css("display", "");
            }
            
            // append delete button or take them off
            if (this.isEditing) {
                // Revert the table to its former, non-editing state
                $("#teamPage tr").each(function () {
                    $(this).children().last().remove();
                });
                
                $("#teamPage #athleteStatPage #cancel_edit_button").remove();
                $("#teamPage #athleteStatPage").append(`<button class="add_values_button action_button" id="add_value_button">Add Value</button>`);
                $("#add_value_button").click(addContainer);
            } else {
                // Change the table to editing mode
                $("#teamPage tr:first-child").append("<th>-</th>");
                $("#teamPage tr:not(:first-child)").append("<td>X</td>");
                $("#add_value_button").remove();
                $("#teamPage #athleteStatPage").append(`<button class="action_button" id="cancel_edit_button">Cancel</button>`)
            }

            this.toggleTableEditable();

            this.isEditing = !this.isEditing;
        });

        // populate table

        $("#teamPage #athleteStatPage #athlete_stats_container").append(`
            <tr>
                <th>Date</th>
                <th>Time</th>
            </tr>
        `);
        
        let splitNames = []; // // Tabulate split names to be sorted for coloring later
        for (let i = 0; i < results.length; i++) {
            
            // Parse date (first is local save, second handles server format)
            let date = new Date(results.item(i).last_updated).toLocaleDateString("en-US");
            if (date.includes("Invalid")) {
                date = this.getRecordDate(results.item(i).last_updated);
            }
            
            // Add the record time
            let recordRow = (`
                <tr id_record=${results.item(i).id_record}>
                    <td>${date}</td>
                    <td>${Clock.secondsToTimeString(results.item(i).value)}</td>
                </tr>
            `);
            $("#teamPage #athleteStatPage #athlete_stats_container").append(recordRow);
            
            // Check for and add any splits
            for(let s = 0; s < splits.length; s++) {
                if(splits.item(s).id_record == results.item(i).id_record) {
                    let splitRow = (`
                        <tr class="splitRow" id_record="${splits.item(s).id_record}" id_split="${splits.item(s).id_split}" split_name="${splits.item(s).split_name}">
                            <td>${splits.item(s).split_name}</td>
                            <td>${Clock.secondsToTimeString(splits.item(s).value)}</td>
                        </tr>
                    `);
                    $("#teamPage #athleteStatPage #athlete_stats_container").append(splitRow);
                    
                    if(jQuery.inArray(splits.item(s).split_name, splitNames) == -1) {
                        splitNames.push(splits.item(s).split_name);
                    }
                    
                }
            }
        }
        // Determine split colors
        splitNames.sort();
        for (let n = 0; n < splitNames.length; n++) {
            let splitColor = this.hexToRGBString(Constant.graphColors[n + 1]); // +1 to ignore Race Time graph color
            splitColor = `rgba(${splitColor}, 0.5)`; // Lighten the color by 50% opacity
            $(`#teamPage #athleteStatPage #athlete_stats_container tr[split_name="${splitNames[n]}"] > *`).css("background-color", splitColor);
        }

    }

    /**
     * @description display a graph to #athleteStatPage
     * 
     * @param {Array} data an xy array for the data to display
     */
    createGraph(datasets) {
        $("#athlete_stat_chart").remove();
        $("#teamPage #athleteStatPage").append(`<canvas id="athlete_stat_chart"></canvas>`);

        var canvas = document.getElementById('athlete_stat_chart');
        var ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // set an alternating style for each dataset
        for (let i = 0; i < datasets.length; i++) {
            let dataCopy = JSON.parse(JSON.stringify(datasets[i]));

            if (Constant.graphConfigurations[i] !== undefined) {
                datasets[i] = Object.assign({}, dataCopy, Constant.graphConfigurations[i]);
            } else {
                datasets[i] = Object.assign({}, dataCopy, Constant.defaultGraphConfiguration);
            }
        }

        var scatterChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: datasets
            },
            options: {
                scales: {
                    xAxes: [{
                        type: 'linear',
                        position: 'bottom',
                    }]

                    // use this for a chronological graph with dates! replace x with t in data
                    // xAxes: [{
                    //     type: 'time',
                    //     position: 'bottom',
                    //     distribution: 'linear',
                    //     time: {
                    //         unit: 'day',
                    //         displayFormats: {
                    //             quarter: 'MMM D'
                    //         }
                    //     }
                    // }]
                },
                legend: {
                    display: true,
                },
                tooltips: {
                    enabled: false
                },
                ticks: {
                    precision: 0
                },
                animation: {
                    duration: 1000,
                    easing: 'linear',
                    from: 1,
                    to: 0,
                }
            }
        });
    }

    /**
     * Allow the necessary tables to be edited. This will save the results on every other call.
     * 
     * @param {Object} event database result for atheltevent
     * @param {Object} athlete result for athlete
     */
    toggleTableEditable() {

        let _this = this;

        // change all of the styling for the table
        $("#teamPage td, #teamPage input").each(function () {

            let val = $(this).text();
            if ((val == null) || (val.length == 0)) { // Inputs use .val()
                val = $(this).val();
            }
            if ((val == null) || (val.length == 0)) { // Table Data uses .text()
                val = $(this).find("td").text();
            }

            // Skip the delete button
            if (val.includes("X")) {
                return;
            }
            
            // Save the color for any split rows
            let rowColor = $(this).css("background-color");
            
            // Since the times are now being formatted as strings, make all fields editable
            if (_this.isEditing && $(this).is("input")) { // Editing to not editing change
                $(this).parent().replaceWith(`<td style="background-color: ${rowColor}">${val}</td>`);
                
            } else if (!_this.isEditing && $(this).is("td")) { // Not editing --> Editing changes
                $(this).replaceWith(`<td><input value="${val}" style="background-color: ${rowColor}"></td>`);
            }
        });

        // when user clicks save the results
        if (this.isEditing) {

            $("#teamPage #edit_values_button").html("Edit");
            $("#teamPage #edit_values_button").addClass("edit_values_button").removeClass("save_values_button");

            $("#teamPage #athlete_stats_container").addClass("alternating_table_shade");
            $("#teamPage #athlete_stats_container").removeClass("delete_column_red");

            $("#athlete_stats_container td").off("click");

            // delete values in rowsToDelete
            for (let i = 0; i < this.rowsToDelete.length; i++) {
                
                let dataType = this.rowsToDelete[i][0]; // [0] = type, [1] = id to delete, [2] = deletion scope
                
                // Remove from local database
                if(this.rowsToDelete[i][2].includes("local")) {
                    let localTableName = ((dataType == "record") ? "record" : "record_split");
                    dbConnection.runQuery(`DELETE FROM ${localTableName} WHERE id_${dataType} = ?`, [Number(this.rowsToDelete[i][1])]);
                    $(`#teamPage #athlete_stats_container tr[id_${dataType}=${Number(this.rowsToDelete[i][1])}]`).remove();
                }
                
                // Delete from cloud server
                if(this.rowsToDelete[i][2].includes("server")) {
                    if(dataType == "record") {
                        RecordBackend.deleteRecord(this.rowsToDelete[i][1], (response) => {
                            if(response.status < 0) {
                                Popup.createConfirmationPopup("An error occurred while removing some records. Please try again later", ["OK"]);
                                i = this.rowsToDelete.length; // End loop tp prevent multiple popups (can't use break due to callback)
                            }
                        });
                    } else {
                        RecordBackend.deleteSplit(this.rowsToDelete[i][1], (response) => {
                            if(response.status < 0) {
                                Popup.createConfirmationPopup("An error occurred while removing some splits. Please try again later", ["OK"]);
                                i = this.rowsToDelete.length;
                            }
                        });
                    }
                }
            }
            // Clear the array after deleting
            this.rowsToDelete = [];
            
            // TODO: editing splits
            
            // save new values
            let newData = this.getAddedRecordsObject();
            for (let i = 0; i < newData.length; i++) {
                let value = Number(Clock.timeStringToSeconds(newData[i].value));

                // check if there was a bad type and trigger a popup menu only once
                if (value == null || value == undefined) {
                    Popup.createConfirmationPopup(`Unable to update results, please try again. (Is your time formatted correctly?)`, ["OK"]);
                    this.pageTransition.slideRight("athletePage");
                    break;
                }
                
                // Save the record first so the frontend will have a matching id to the backend
                RecordBackend.saveRecord(value, Number(newData[i].id_record_definition), Number(newData[i].id_backend), (response) => {
                    if (DO_LOG) {
                        console.log("RECORD SAVED " + JSON.stringify(response));
                    }
                    if (response.status > 0) { // If success, insert into local database
                        // Define default fallback values, then use actual values in loop below
                        let recordData = {
                            "id_record": Number(response["addedRecords"][0]["id_record"]),
                            "value": value,
                            "id_record_definition": Number(newData[i].id_record_definition),
                            "is_practice": true,
                            "last_updated": this.getCurrentDateTime()
                        };
                        let linkData = {
                            "id_backend": Number(newData[i].id_backend),
                            "id_record": Number(response["addedRecords"][0]["id_record"])
                        };

                        dbConnection.insertValuesFromObject("record", recordData);
                        dbConnection.insertValuesFromObject("record_user_link", linkData);

                    } else {
                        if (DO_LOG) {
                            console.log("[team.js:saveTime()]: Unable to save time to backend");
                        }
                    }
                });
            }
            
            // Save changed records
            for(let m = 0; m < this.rowsToModify.length; m++) {
                let dataType = this.rowsToModify[m][0]; // [0] = type, [1] = id to delete, [2] = deletion scope
                let rowId = this.rowsToModify[m][1];
                let value = null;
                if(dataType == "record") {
                    value = Clock.timeStringToSeconds($(`#teamPage #athlete_stats_container tr[id_record=${rowId}]:not(.splitRow) td:nth(1)`).text());
                    value = Number(value);
                } else if(dataType == "split") {
                    value = Clock.timeStringToSeconds($(`#teamPage #athlete_stats_container tr[id_split=${rowId}] td:nth(1)`).text());
                    value = Number(value);
                }
                
                // Check if there was a bad type and trigger a popup menu only once
                if (value == null || value == undefined) {
                    Popup.createConfirmationPopup(`Unable to update results, please try again. (Is your time formatted correctly?)`, ["OK"]);
                    this.pageTransition.slideRight("athletePage");
                    break;
                }
                
                // Update the local and server values
                if(this.rowsToModify[m][2].includes("local")) {
                    let localTableName = ((dataType == "record") ? "record" : "record_split");
                    dbConnection.updateValues(localTableName, ["value"], [value], `WHERE id_${dataType} = ?`, [Number(rowId)]);
                }
                if(this.rowsToModify[m][2].includes("server")) {
                    if(dataType == "record") {
                        RecordBackend.modifyRecord(rowId, {
                            "value": value
                        }, (r) => {
                            if((r.status < 0) && (DO_LOG)) {
                                console.log("[team.js:toggleTableEditable()]: Updating backend record failed for ID " + rowId);
                            }
                        });
                    } else if(dataType == "split") {
                        RecordBackend.modifySplit(rowId, {
                            "value": value
                        }, (r) => {
                            if((r.status < 0) && (DO_LOG)) {
                                console.log("[team.js:toggleTableEditable()]: Updating backend split failed for ID " + rowId);
                            }
                        });
                    }
                }
            }
            this.rowsToModify = [];
            
            
            // when user clicks edit
        } else {

            $("#teamPage #athlete_stats_container").removeClass("alternating_table_shade");
            $("#teamPage #athlete_stats_container").addClass("delete_column_red");

            $("#teamPage #edit_values_button").html("Save")
            $("#teamPage #edit_values_button").addClass("save_values_button").removeClass("edit_values_button");

            // Edit & delete row callback
            $("#athlete_stats_container td").click(function (e) {
                
                let rowType = ($(this).parent().hasClass("splitRow") ? "split" : "record");
                let rowId = $(this).parent().attr("id_" + rowType);

                // let row = Number(e.target.parentNode.rowIndex);
                let isDeleting = $(this).text() == "X" ? true : false;
                
                if(!isDeleting) { // Editing
                    _this.rowsToModify.push([rowType, rowId, "server-local"]);
                } else { // Deleting
                    $(this).parent().css("display", "none"); // Hide until saved

                    // mark rows to delete on save
                    _this.rowsToDelete.push([rowType, rowId, "server-local"]);
                    // Array format: ["split" | "record", id_record/split, "server" | "local" | "server-local"]
                    if(rowType == "record") {
                        let splitRows = $(`#teamPage #athlete_stats_container tr[id_record=${rowId}].splitRow`).toArray();
                        for(let r = 0; r < splitRows.length; r++) {
                            // Remove them locally only; they are automatically removed by the server due to parent record
                            _this.rowsToDelete.push(["split", $(splitRows[r]).attr("id_split"), "local"]);
                            $(splitRows[r]).css("display", "none");
                        }
                    }
                }
                
            });
        }
    }

    /**
     * This function will convert the athlete data container table into an object
     * 
     */
    getAddedRecordsObject() {
        return $(`#athlete_stats_container tr[isAdded]:has(td)`).map(function (i, v) {
            var $tr = $(v).children(); // v stands for value

            return {
                date: $tr.eq(0).text(),
                value: $tr.eq(1).text(),
                isAdded: $tr.parent().attr("isAdded"),
                id_record: Number($tr.parent().attr("id_record")),
                id_backend: $tr.parent().attr("id_backend"),
                id_record_definition: Number($tr.parent().attr("id_record_definition"))
            };
        }).get();
    }

    /**
     * Formats a record's lastUpdated date/time to a format
     * usable for javascript Date().
     * 
     * @example getRecordDate("2020-08-20 08-56-33");
     * 
     * @param {String} rawDateTime date formatted "yyyy-mm-dd hr:mi:ss"
     * @returns
     * US Date String formatted correctly
     */
    getRecordDate(rawDateTime) {

        let year = rawDateTime.substr(0, 4);
        let month = rawDateTime.substr(5, 2) - 1; // Months are indexed weird in PHP
        let day = rawDateTime.substr(8, 2);
        let hour = rawDateTime.substr(11, 2);
        let minute = rawDateTime.substr(14, 2);
        let second = rawDateTime.substr(17, 2);
        return new Date(year, month, day, hour, minute, second).toLocaleDateString("en-US");
    }
    
    // Used to set last_updated of records; formatted "year/mm/dd hr:mm:ss"
    getCurrentDateTime() {
        let dateObj = new Date();
        let updateTime = dateObj.getFullYear() + "-";
        updateTime = updateTime + ((dateObj.getMonth() + 1) < 10 ? "0" : "") + (dateObj.getMonth() + 1) + "-";
        updateTime = updateTime + (dateObj.getDate() < 10 ? "0" : "") + dateObj.getDate() + " ";
        updateTime = updateTime + (dateObj.getHours() < 10 ? "0" : "") + dateObj.getHours() + ":";
        updateTime = updateTime + (dateObj.getMinutes() < 10 ? "0" : "") + dateObj.getMinutes() + ":";
        updateTime = updateTime + (dateObj.getSeconds() < 10 ? "0" : "") + dateObj.getSeconds();
        return updateTime;
    }
    
    /**
     * @description check if the current user has a team at all, either on account or local
     * @returns true or false
     */
    doesTeamExist() {
        let storage = window.localStorage;

        // local check
        if (storage.getItem("id_team") == null) {
            return false;
        }

        return true;
    }
    
    // Converts a hex string to an RGB string (copied from Stack Overflow)
    hexToRGBString(hex) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if(result !== false) {
            return (parseInt(result[1], 16) + ", " + parseInt(result[2], 16) + ", " + parseInt(result[3], 16));
        } else {
            return "0, 0, 0";
        }
    }
    
    stop() {
        // this.pageTransition.slideRight("landingPage");
        Animations.hideChildElements(this.athleteBoxSelector);
    }
}


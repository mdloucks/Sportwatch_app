/**
 * @classdesc This is the stats page
 * @class
 */
class Stats extends Page {

    constructor(id, pageSetObject) {
        super(id, "Stats");
        this.pageController = pageSetObject;
        this.pageTransition = new PageTransition("#statsPage");
        this.hasStarted = false;
        this.isEditing = false;

        this.eventButtonsBoxSelector = "#statsPage #landingPage .button_box";
        this.headerText = `Stats`;
        this.csvLocation = ""; // For iOS sharing reference

        this.athleteRecordQuery = (`
            select * from record
            INNER JOIN record_user_link
            ON record_user_link.id_record = record.id_record
            INNER JOIN athlete
            ON athlete.id_backend = record_user_link.id_backend
            WHERE record.id_record_definition = ?;
        `);

        this.athleteRecordQueryAll = (`
            select * from record
            INNER JOIN record_user_link
            ON record_user_link.id_record = record.id_record
            INNER JOIN athlete
            ON athlete.id_backend = record_user_link.id_backend
        `);

        this.landingPage = (`
            <div id="landingPage" class="div_page">
                <div class="left_container">
                    <div class="left_text underline">Stats</div><br><br>
                </div>

                <div class="button_box"></div>
            </div>
        `);

        this.eventPage = (`
            <div id="eventPage" class="div_page">
                <div id="event_header" class="generic_header">
                    <div id="back_button_event" class="back_button">&#9668;</div>
                    <h1 id="event_name"></h1>
                    <div></div>
                </div>

                <button id="save_csv" class="generated_button">Save to CSV file</button><br><br>

                <table id="event_results" class="display striped compact">
                </table>
            </div>
        `);

        // <h2>Days:</h2> <input type="number" id="stats_summary_interval" value="7" step="1" name="stats_summary_interval"></input><br>
        // <div id="stats_summary"></div>

        // <tr class="column_names">
        //     <th id="name_sort">Name<span>&#9660;</span>></th>
        //     <th id="best_sort">Best</th>
        //     <th id="avg_sort">Avg</th>
        //     <th id="worst_sort">Worst</th>
        // </tr>

        // TODO: deprecated
        this.addEventPage = (`
            <div id="addEventPage" class="div_page">
                <div id="add_event_header" class="generic_header">
                    <div id="back_button_add_event" class="back_button">&#9668;</div>
                    <h1>Add Event</h1>
                    <div></div>
                </div>

                <div class="button_box">
                    
                </div>
            </div>
        `);
        // TODO: allow user to make custom events <button id="create_custom_event">Custom...</button>
    }

    getHtml() {
        return (`
            <div id="statsPage" class="div_page">
                ${this.landingPage}
                ${this.addEventPage}
                ${this.eventPage}
            </div>
        `);
    }

    start() {

        // Only link them to pageTransition once
        if (this.pageTransition.getPageCount() == 0) {
            this.pageTransition.addPage("landingPage", this.landingPage, true);
            this.pageTransition.addPage("addEventPage", this.addEventPage);
            this.pageTransition.addPage("eventPage", this.eventPage);
        }


        if (!this.hasStarted) {
            this.hasStarted = true;


        } else {
            this.startLandingPage(() => {
                Animations.fadeInChildren(this.eventButtonsBoxSelector, Constant.fadeDuration, Constant.fadeIncrement);
            });

            // show the user the number of offline entries
            if (!NetworkInfo.isOnline()) {

                dbConnection.executeTransaction("SELECT Count(*) FROM offline_record", []).then((values) => {
                    let nOfflineRecords = Number(values.item(0)["Count(*)"]);

                    if (nOfflineRecords != undefined && nOfflineRecords != 0) {
                        $("#statsPage #landingPage #stats_summary").before(`
                            <div id="internet_required_prompt" class="info_box">
                                You have ${nOfflineRecords} entries that need to be uploaded.
                                Please connect to the internet.
                            </div>
                        `);
                    } else {
                        $("#statsPage #landingPage #internet_required_prompt").remove();
                    }
                });

            } else {
                $("#statsPage #landingPage #internet_required_prompt").remove();
            }
        }
    }

    /**
     * @description this function will launch the landing page for the statsPage
     * @param {function} callback the callback to be called when all of the buttons are done generating
     */
    startLandingPage(callback = () => {}) {
        
        if(this.pageTransition.getCurrentPage() != "landingPage") {
            this.pageTransition.slideRight("landingPage");
        }

        $("#statsPage #landingPage .button_box").empty();
        $("#statsPage #landingPage #add_event_box").empty();

        // get any unique entries in record identity
        let query = (`
            SELECT DISTINCT record_definition.record_identity, record_definition.rowid FROM record
            INNER JOIN record_definition
            ON record_definition.rowid = record.id_record_definition
        `);

        dbConnection.selectValues(query).then((events) => {
            // if records exist for any event
            if (events != false) {
                $("#statsPage #landingPage .left_text").html(this.headerText);
                $("#statsPage #landingPage .missing_info_text").remove();

                // convert the database construct into an array
                let array = [];

                for (let i = 0; i < events.length; i++) {
                    array.push(events.item(i));
                }


                ButtonGenerator.generateButtonsFromDatabase("#statsPage #landingPage .button_box", array, (event) => {
                    this.startEventPage(event);
                }, [], Constant.eventColorConditionalAttributes, "class");

                Animations.hideChildElements(this.eventButtonsBoxSelector);

                callback();
                // there are no events that have any records 
            } else {
                $("#statsPage #landingPage .left_text").empty();

                if ($("#statsPage #landingPage .missing_info_text").length == 0) {
                    $("#statsPage #landingPage").append(`
                    <div class="missing_info_text">
                        <h2>No Times Saved Yet</h2>
                        It looks like you don't have any times saved yet. <br><br>
                        Go to the Stopwatch page and save a time to get started.
                    </div>
                    `);
                }

            }
        });
    }

    updateStatsSummary(interval) {

        console.log("INTERVAL " + interval);

        dbConnection.selectValues(this.athleteRecordQueryAll, []).then((results) => {

            if (results == false || results.length == 0) {
                return;
            }

            let athletes = this.constructAthleteTimeArray(results);
            let slopes = [];

            // generate time array for each athlete
            for (let i = 0; i < athletes.length; i++) {

                if (athletes[i] === null || athletes[i] === undefined) {
                    continue;
                }

                // change the unit of the dates depending on interval
                // if user selects 7 days, the time unit will be weeks (improvement per week)
                let adjustedDates = [];

                for (let j = 0; j < athletes[i].dates.length; j++) {
                    adjustedDates.push(athletes[i].dates[j] / (60 * 60 * 24 * interval * 1000))
                }

                // calculate derivative
                slopes.push({
                    name: athletes[i].fname + " " + athletes[i].lname,
                    slope: this.linearRegression(athletes[i].values, adjustedDates).slope
                });

                // find average percentage improvement of athletes. 
                console.log("athlete times " + JSON.stringify(athletes[i].values));

                // console.log("athlete " + JSON.stringify(athletes[i]));
                // console.log("athlete " + Date.parse(athletes[i].last_updated));

                // let name = athletes[i].fname + "\t" + athletes[i].lname;
                // let min = Clock.secondsToTimeString(Math.min(...athletes[i].values).toFixed(2));
                // let max = Clock.secondsToTimeString(Math.max(...athletes[i].values).toFixed(2));
                // let average = Clock.secondsToTimeString((athletes[i].values.reduce((a, b) => a + b, 0) / athletes[i].values.length).toFixed(2));
            }

            let dayInterval = (60 * 60 * 24) * 1000;
            let weekInterval = (60 * 60 * 24 * 7) * 1000;
            let monthInterval = (60 * 60 * 24 * 30) * 1000;

            let generalInterval = (60 * 60 * 24 * interval) * 1000

            let selectedInterval = generalInterval;
            let nRecords = 0;

            // loop through records to count the number of them.
            for (let i = 0; i < results.length; i++) {

                if (Date.parse(results.item(i).last_updated) > (Date.now() - selectedInterval)) {
                    nRecords += 1;
                }
            }

            $("#statsPage #landingPage #stats_summary").html(`
                <div>Results of the past (${interval}) days</div>
                <div>
                    Number of results saved: ${nRecords}
                </div>
            `);

            // for (let i = 0; i < slopes.length; i++) {
            //     $("#statsPage #stats_summary").append(`
            //         <br><b>${slopes[i].name}:</b> ${slopes[i].slope} seconds
            //     `);
            // }
        });
    }


    /**
     * @description This function will start the event page which will show stats
     * for an individual event
     * @param {row} event the event to display results for
     */
    startEventPage(event) {

        this.pageTransition.slideLeft("eventPage");
        // While transitioning, scroll to the top
        $("#statsPage").animate({
            scrollTop: 0
        }, 1000);
        // Add top padding to avoid header overlap (iOS issue)
        let headerWidth = $("#statsPage #eventPage > .generic_header").height();
        $("#statsPage #eventPage > *:not(.generic_header)").first().css("margin-top", `calc(${headerWidth}px + 10vh)`);

        this.clearResultsTable();

        $("#statsPage #eventPage #event_name").html(event.record_identity);

        $("#statsPage #eventPage #back_button_event").unbind("click");
        $("#statsPage #eventPage #save_csv").unbind("click");

        $("#statsPage #eventPage #back_button_event").bind("click", (e) => {
            this.pageTransition.slideRight("landingPage");
            $("#event_results").empty();
            // Reset the scroll
            $("#stopwatchPage").animate({
                scrollTop: 0
            }, 1000);
        });

        $("#statsPage #eventPage #save_csv").bind("click", (e) => {
            $("#statsPage #eventPage #save_csv").prop("disabled", true);

            let query = (`
                select * from record
                INNER JOIN record_user_link
                ON record_user_link.id_record = record.id_record
                INNER JOIN athlete
                ON athlete.id_backend = record_user_link.id_backend
                INNER JOIN record_definition
                ON record_definition.rowid = record.id_record_definition
                WHERE record.id_record_definition = ?;
            `);

            dbConnection.selectValues(query, [event.rowid]).then((results) => {

                let athletes = this.constructAthleteTimeArray(results, "");
                this.saveCSV("data.csv", athletes, false);

                // If it's iOS, share the saved file with native "share" dialog
                if (device.platform) {
                    let shareOptions = {
                        files: [this.csvLocation]
                    };

                    window.plugins.socialsharing.shareWithOptions(shareOptions, (result) => {
                        if (DO_LOG) {
                            console.log("On success");
                            console.log(result);
                        }
                        $("#statsPage #eventPage #save_csv").prop("disabled", false);
                    }, (msg) => {
                        if (DO_LOG) {
                            console.log("On fail");
                            console.log(msg);
                        }
                        $("#statsPage #eventPage #save_csv").prop("disabled", false);
                    });
                } else { // End of iOS share logic
                    $("#statsPage #eventPage #save_csv").prop("disabled", false);
                }

            });
        });

        // this.generateEventPageStatSummary(event);
        this.generateAthleteTimes(event);
    }


    /**
     * this method iwll generate the stats for the summary for the individual event pages
     * rather than the overview
     * 
     * @param {Object} event the object database result
     * @param {Integer} interval the day interval to consider
     */
    generateEventPageStatSummary(event, interval = 1) {

        interval = Number($("#statsPage #eventPage #stats_summary_interval").val());

        // on input change, set the interval and regenerate stats
        $("#statsPage #eventPage #stats_summary_interval").off("input propertychange");

        $("#statsPage #eventPage #stats_summary_interval").on("input propertychange", (e) => {
            this.generateEventPageStatSummary(event, Number($(e.target).val()));
        });

        console.log("GENERATING FOR INTERVAL " + interval);

        dbConnection.selectValues(this.athleteRecordQuery, [event.rowid]).then((results) => {

            if (results == false) {
                return;
            }

            let athletes = this.constructAthleteTimeArray(results);
            let slopes = [];

            let average = (array) => array.reduce((a, b) => a + b) / array.length;

            let percentChangeAverages = [];

            let dayInterval = (60 * 60 * 24) * 1000;
            let weekInterval = (60 * 60 * 24 * 7) * 1000;
            let monthInterval = (60 * 60 * 24 * 30) * 1000;

            let generalInterval = (60 * 60 * 24 * interval) * 1000

            let selectedInterval = generalInterval;

            // generate time array for each athlete
            for (let i = 0; i < athletes.length; i++) {

                if (athletes[i] === null || athletes[i] === undefined) {
                    continue;
                }

                // change the unit of the dates depending on interval
                // if user selects 7 days, the time unit will be weeks
                let adjustedDates = [];

                for (let j = 0; j < athletes[i].dates.length; j++) {
                    adjustedDates.push(athletes[i].dates[j] / (60 * 60 * 24 * interval * 1000))
                }

                // calculate derivative
                slopes.push({
                    name: athletes[i].fname + " " + athletes[i].lname,
                    slope: this.linearRegression(athletes[i].values, adjustedDates).slope
                });

                // find average percent change of athletes. 
                let percentChange = [];

                for (let j = 0; j < athletes[i].values.length - 1; j++) {

                    // skip this entry if it's outside of the specified date range
                    if (athletes[i].dates[j] < (Date.now() - selectedInterval)) {
                        console.log("date " + Date.parse(athletes[i].dates[j]) + " is out of date range");
                        continue;
                    }

                    // get two values to find difference
                    let a = athletes[i].values[j];
                    let b = athletes[i].values[j + 1];

                    // negative percentage is good
                    percentChange.push(((a - b) / b) * 100);
                }

                if (percentChange.length != 0) {
                    athletes[i].percentChange = percentChange;
                    athletes[i].percentChangeAverage = average(percentChange);
                    percentChangeAverages.push(athletes[i].percentChangeAverage)
                }

                // console.log(athletes[i].lname + " " + athletes[i].percentChangeAverage);


                // console.log("athlete " + JSON.stringify(athletes[i]));
                // console.log("athlete " + Date.parse(athletes[i].last_updated));

                // let name = athletes[i].fname + "\t" + athletes[i].lname;
                // let min = Clock.secondsToTimeString(Math.min(...athletes[i].values).toFixed(2));
                // let max = Clock.secondsToTimeString(Math.max(...athletes[i].values).toFixed(2));
                // let average = Clock.secondsToTimeString((athletes[i].values.reduce((a, b) => a + b, 0) / athletes[i].values.length).toFixed(2));
            }

            let nRecords = 0;

            // loop through records to count the number of them.
            for (let i = 0; i < results.length; i++) {

                if (Date.parse(results.item(i).last_updated) > (Date.now() - selectedInterval)) {
                    nRecords += 1;
                }
            }

            let teamPercentChange = 0;
            let teamPercentChangeString = "";

            if(percentChangeAverages.length != 0) {
                teamPercentChange = average(percentChangeAverages).toFixed(2);
                teamPercentChangeString = "";
            }

            // display message based on percentage
            if (teamPercentChange < 0) {
                teamPercentChangeString = `Your team improved in this event by <b><span style="color: rgb(48, 208, 88);">${Math.abs(teamPercentChange)}%</span></b>`;
            } else if (teamPercentChange > 0) {
                teamPercentChangeString = `Your team worsened in this event by <b><span style="color: darkred;">${Math.abs(teamPercentChange)}%</span></b>`;
            } else if(teamPercentChange == 0) {
                teamPercentChangeString = `Your team's performance has not changed in the given period of time`;
            } else if(!isFinite(teamPercentChange) || isNaN(teamPercentChange)) {
                teamPercentChangeString = `Your team's improvements in this event cannot be determined. (are there any results with a time of zero?)`;
            } else {
                teamPercentChangeString = `Your team's improvements in this event cannot be determined.`;
            }


            $("#statsPage #eventPage #stats_summary").html(`
                <div><b>Results of the past (${interval}) </b>days</div>
                <div>
                    Number of results saved: <b>${nRecords}</b><br><br>
                    ${teamPercentChangeString}
                </div>
            `);

            // for (let i = 0; i < slopes.length; i++) {
            //     $("#statsPage #stats_summary").append(`
            //         <br><b>${slopes[i].name}:</b> ${slopes[i].slope} seconds
            //     `);
            // }
        });
    }

    onErrorCreateFile() {
        Popup.createConfirmationPopup(`Unable to download CSV file. Could not create file.`, ["Ok"], [function () {}]);
    };

    onErrorLoadFs() {
        Popup.createConfirmationPopup(`Unable to download CSV file. Could not load File System.`, ["Ok"], [function () {}]);
    };

    createFile(fileName, callback) {
        window.requestFileSystem(window.PERSISTENT, 5 * 1024 * 1024, (fs) => {

            if (DO_LOG) {
                console.log('file system open: ' + fs.name);
            }

            // Creates a new file or returns the file if it already exists.
            fs.root.getFile(fileName, {
                create: true,
                exclusive: false
            }, (fileEntry) => {
                this.csvLocation = fileEntry.nativeURL;
                callback(fileEntry);
            }, this.onErrorCreateFile);

        }, this.onErrorLoadFs);
    }

    // reference this https://github.com/apache/cordova-plugin-file
    saveCSV(fileName, dataObj, showPopup = true) {
        this.createFile(fileName, (fileEntry) => {

            // Create a FileWriter object for our FileEntry (log.txt).
            fileEntry.createWriter((fileWriter) => {

                fileWriter.onwriteend = function () {
                    if (!showPopup) return; // Don't show for iOS
                    Popup.createConfirmationPopup(`Successfully downloaded CSV file. Find it in your Documents folder.`, ["Ok"], [function () {}]);
                };

                fileWriter.onerror = function (e) {
                    Popup.createConfirmationPopup(`Unable to download CSV file. Sorry for the inconvenience`, ["Ok"], [function () {}]);
                };

                if (DO_LOG) {
                    console.log("saving csv...");
                }

                let csv = "";
                // append headers
                csv += "Event,First Name,Last Name,unit,Last Updated,Value\n";


                // append data
                for (let i = 0; i < dataObj.length; i++) {

                    if (dataObj[i] == undefined || dataObj[i] == null) {
                        continue;
                    } else {
                        let obj = dataObj[i];

                        for (let j = 0; j < obj.values.length; j++) {
                            csv += [obj.record_identity, obj.fname, obj.lname, obj.unit, obj.last_updated, obj.values[j]].join(',') + "\n";
                        }
                    }
                }

                if (DO_LOG) {
                    console.log(csv);
                }


                let csvBlob = new Blob([csv], {
                    type: 'text/plain'
                });

                fileWriter.write(csvBlob);
            });
        });
    }

    /**
     * @description this will generate all of the times for the given event in the specified order 
     * and append it to the table
     * @param {row} event the event row from the database
     */
    generateAthleteTimes(event) {

        this.clearResultsTable();

        $("#statsPage #eventPage #event_results").empty();

        // get all values from record that have an athlete value for a particular event
        dbConnection.selectValuesAsObject(this.athleteRecordQuery, [event.rowid]).then((results) => {

            // populate the table with the specified data.
            let tabulator = new Tabulator();
            tabulator.generateTable("#statsPage #eventPage #event_results", results, [{
                    data: "fname",
                    title: "Name",
                    render: function (data, type, row) {
                        // console.log(JSON.stringify(row));
                        // console.log("data " + JSON.stringify(data));
                        return `${row["fname"]} ${row["lname"]}`
                    }
                },
                {
                    data: "value",
                    title: "Value"
                },
                {
                    data: "last_updated",
                    title: "Date",
                    render: function (data, type, row) {
                        return data.substring(0, 10);
                    }
                }
            ]);
        });
    }

    /**
     * @description This function will merge the athlete times into one array inside of the athlete object
     * instead of having multiple objects, just access .values It will also sort these values
     * @param {row} rows the event rows
     * @param {String} order what to order the rows
     */
    constructAthleteTimeArray(rows, order) {

        let array = [];

        let athlete_ids = [];
        let dates = [];

        for (let i = 0; i < rows.length; i++) {
            // push if the array already exists
            if (athlete_ids.includes(rows.item(i).id_backend)) {
                array[rows.item(i).id_backend].values.push(rows.item(i).value);
                array[rows.item(i).id_backend].dates.push(Date.parse(rows.item(i).last_updated));

                // if the array doesn't exist inside, create one
            } else if (!athlete_ids.includes(rows.item(i).id_backend)) {
                athlete_ids.push(rows.item(i).id_backend);
                array[rows.item(i).id_backend] = rows.item(i);

                array[rows.item(i).id_backend].dates = [Date.parse(rows.item(i).last_updated)];
                array[rows.item(i).id_backend].values = [rows.item(i).value];
            }

            dates.push(rows.item(i).last_updated);

            let orderedDates = dates.sort(function (a, b) {
                return Date.parse(a) > Date.parse(b);
            });

            array[rows.item(i).id_backend].last_updated = orderedDates[orderedDates.length - 1];
        }


        if (order == "A-z") {
            array.sort((a, b) => (a.lname > b.lname) ? 1 : ((b.lname > a.lname) ? -1 : 0));
        } else if (order == "0-9") {
            array.sort((a, b) => (Math.max(...a.values) > Math.max(...b.values)) ? 1 : ((Math.max(b.values) > Math.max(a.values)) ? -1 : 0));
        } else if (order == "M/F") {
            array.sort((a, b) => (a.gender < b.gender) ? 1 : ((b.gender < a.gender) ? -1 : 0));
        }

        return array;
    }

    /**
     * run a simple linear R squared regression on the given set of data
     * @param {array} y y data
     * @param {array} x x data
     */
    linearRegression(y, x) {
        var lr = {};
        var n = y.length;
        var sum_x = 0;
        var sum_y = 0;
        var sum_xy = 0;
        var sum_xx = 0;
        var sum_yy = 0;

        for (var i = 0; i < y.length; i++) {

            sum_x += x[i];
            sum_y += y[i];
            sum_xy += (x[i] * y[i]);
            sum_xx += (x[i] * x[i]);
            sum_yy += (y[i] * y[i]);
        }

        lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
        lr['intercept'] = (sum_y - lr.slope * sum_x) / n;
        lr['r2'] = Math.pow((n * sum_xy - sum_x * sum_y) / Math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y)), 2);

        return lr;
    }

    /**
     * will remove all of the generated entries in the results
     */
    clearResultsTable() {

        // $("#statsPage #eventPage #event_results").html(`
        //     <tr class="column_names">
        //         <th id="name_sort">Name</th>
        //         <th id="best_sort">Best</th>
        //         <th id="avg_sort">Avg</th>
        //         <th id="worst_sort">Worst</th>
        //     </tr>
        // `); // <span>&#9660;</span>
    }



    stop() {
        // this.pageTransition.slideRight("landingPage");
        Animations.hideChildElements(this.eventButtonsBoxSelector);
    }
}
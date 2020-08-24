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
        this.headerText = `Events`;
        this.csvLocation = ""; // For iOS sharing reference
        
        this.athleteRecordQuery = (`
            select * from record
            INNER JOIN record_user_link
            ON record_user_link.id_record = record.id_record
            INNER JOIN athlete
            ON athlete.id_backend = record_user_link.id_backend
            WHERE record.id_record_definition = ?;
        `)

        this.landingPage = (`
            <div id="landingPage" class="div_page">
                <div class="left_container">
                    <div class="left_text underline">Events</div><br><br>
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
            
            <button id="save_csv" class="generated_button">Save to CSV file</button>

            <table id="event_results">
                <tr class="column_names">
                    <th id="name_sort">Name<span>&#9660;</span>></th>
                    <th id="best_sort">Best</th>
                    <th id="avg_sort">Avg</th>
                    <th id="worst_sort">Worst</th>
                </tr>
            </table>
        </div>
        `);


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
        }
    }

    /**
     * @description this function will launch the landing page for the statsPage
     * @param {function} callback the callback to be called when all of the buttons are done generating
     */
    startLandingPage(callback = () => {}) {

        this.pageTransition.slideRight("landingPage");

        $("#statsPage #landingPage .button_box").empty();
        $("#statsPage #landingPage #add_event_box").empty();

        // get any unique entries in record identity
        let query = (`
            SELECT DISTINCT record_definition.record_identity, record_definition.rowid FROM record
            INNER JOIN record_definition
            ON record_definition.rowid = record.id_record_definition
        `);
        
        dbConnection.selectValues(query).then((events) => {
            if(events != false) {
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
            } else {
                $("#statsPage #landingPage .left_text").empty();

                if($("#statsPage #landingPage .missing_info_text").length == 0) {
                    $("#statsPage #landingPage").append(`
                    <div class="missing_info_text">
                        It looks like you don't have any times saved yet. 
                        Go to the Stopwatch page and save a time.
                    </div>
                    `);
                }
                
            }
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
                if(device.platform == "iOS") {
                    let shareOptions = {
                        files: [this.csvLocation]
                    };
                    
                    window.plugins.socialsharing.shareWithOptions(shareOptions, (result) => {
                        if(DO_LOG) {
                            console.log("On success");
                            console.log(result);
                        }
                        $("#statsPage #eventPage #save_csv").prop("disabled", false);
                    }, (msg) => {
                        if(DO_LOG) {
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

        this.generateAthleteTimes(event);
    }

    onErrorCreateFile() {
        Popup.createConfirmationPopup(`Unable to download CSV file. Could not create file.`, ["Ok"], [function() {
        }]);
    };
    
    onErrorLoadFs () {
        Popup.createConfirmationPopup(`Unable to download CSV file. Could not load File System.`, ["Ok"], [function() {
        }]);
    };

    createFile(fileName, callback) {
        window.requestFileSystem(window.PERSISTENT, 5 * 1024 * 1024, (fs) => {
            
            if(DO_LOG) {
                console.log('file system open: ' + fs.name);
            }

            // Creates a new file or returns the file if it already exists.
            fs.root.getFile(fileName, {create: true, exclusive: false}, (fileEntry) => {
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
                
                fileWriter.onwriteend = function() {
                    if(!showPopup) return; // Don't show for iOS
                    Popup.createConfirmationPopup(`Successfully downloaded CSV file. Find it in your Documents folder.`, ["Ok"], [function() {
                    }]);
                };
                
                fileWriter.onerror = function (e) {
                    Popup.createConfirmationPopup(`Unable to download CSV file. Sorry for the inconvenience`, ["Ok"], [function() {
                    }]);
                };
                
                if(DO_LOG) {
                    console.log("saving csv...");
                }
    
                let csv = "";
                // append headers
                csv += "record_identity,fname,lname,unit,last_updated,value\n";

    
                // append data
                for (let i = 0; i < dataObj.length; i++) {
                    
                    if(dataObj[i] == undefined || dataObj[i] == null) {
                        continue;
                    } else {
                        let obj = dataObj[i];

                        for (let j = 0; j < obj.values.length; j++) {
                            csv += [obj.record_identity, obj.fname, obj.lname, obj.unit, obj.last_updated, obj.values[j]].join(',') + "\n";
                        }
                    }
                }
                
                if(DO_LOG) {
                    console.log(csv);
                }
    
    
                let csvBlob = new Blob([csv], { type: 'text/plain' });
        
                fileWriter.write(csvBlob);
            });
        });
    }

    /**
     * @description this will generate all of the times for the given event in the specified order 
     * and append it to the table
     * @param {row} event the event row from the database
     * @param {String} order what order to generate the times in
     */
    generateAthleteTimes(event, order) {

        this.clearResultsTable();

        // get all values from record that have an athlete value for a particular event

        dbConnection.selectValues(this.athleteRecordQuery, [event.rowid]).then((results) => {

            if(results == false) {
                return;
            }

            let athletes = this.constructAthleteTimeArray(results, order);

            for (let i = 0; i < athletes.length; i++) {

                if (athletes[i] === null || athletes[i] === undefined) {
                    continue;
                }

                let name = athletes[i].fname + "\t" + athletes[i].lname;
                let min = Math.min(...athletes[i].values).toFixed(2);
                let max = Math.max(...athletes[i].values).toFixed(2);
                let average = (athletes[i].values.reduce((a, b) => a + b, 0) / athletes[i].values.length).toFixed(2);

                let info_box;

                if (athletes[i].gender == 'm') {
                    info_box = $("<tr>", {
                        class: "male_color_alternate"
                    });
                } else if (athletes[i].gender == 'f') {
                    info_box = $("<tr>", {
                        class: "female_color_alternate"
                    });
                } else {
                    info_box = $("<tr>");
                }

                info_box.append($("<td>", {
                    text: name
                }));
                info_box.append($("<td>", {
                    text: min
                }));
                info_box.append($("<td>", {
                    text: average
                }));
                info_box.append($("<td>", {
                    text: max
                }));

                $("#statsPage #eventPage #event_results").append(info_box);
            }
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

        for (let i = 0; i < rows.length; i++) {
            if (athlete_ids.includes(rows.item(i).id_backend)) {
                array[rows.item(i).id_backend].values.push(rows.item(i).value);

            } else if (!athlete_ids.includes(rows.item(i).id_backend)) {
                athlete_ids.push(rows.item(i).id_backend);
                array[rows.item(i).id_backend] = rows.item(i);
                array[rows.item(i).id_backend].values = [rows.item(i).value];
            }
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
     * will remove all of the generated entries in the results
     */
    clearResultsTable() {

        $("#statsPage #eventPage #event_results").html(`
            <tr class="column_names">
                <th id="name_sort">Name</th>
                <th id="best_sort">Best</th>
                <th id="avg_sort">Avg</th>
                <th id="worst_sort">Worst</th>
            </tr>
        `); // <span>&#9660;</span>
    }



    stop() {
        Animations.hideChildElements(this.eventButtonsBoxSelector);
    }
}
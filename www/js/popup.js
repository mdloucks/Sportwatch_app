/**
 * @class
 * @classdesc this class will be used to create popups and confirmation dialogues, perhaps tutorials 
 */
class Popup {

    /**
     * This function is used as a wrapper in order to clean up the popup once the user makes a choice. 
     * @param {String} element id, class, etc of the popup element
     * @param {function} callback the callback function to call when the button is clicked
     */
    static callbackCleanupWrapper(element, callback) {
        callback();
        $(element).fadeOut(300, function () {
            $(this).remove();
        });
    }

    /**
     * Will display a confirmation popup for the user
     * 
     * will take an array of button names and callbacks for each button
     * 
     * @param {String} tooltip Flavor text at the top of the popup
     * @param {Array} buttons Array containing text of buttons
     * @param {Array} callbacks Array containing callback functions for each respective button
     */
    static createConfirmationPopup(tooltip, buttons, callbacks = [() => {}], options) {

        if (buttons.length != callbacks.length) {
            throw new Error(`OutOfBounds exception, improper length. buttons: ${buttons.length} callbacks: ${callbacks.length}`);
        }

        // Assign an ID so it doesn't intefere with other popups
        let popupId = $(".popup").length + 1;

        $("#app").append(`
            <div class="popup" id="popup_${popupId}">
    
                <div class="popup_content">
                    <p class="popup_tooltip">${tooltip}</p><br>
                </div>
            </div>
        `);

        for (let i = 0; i < buttons.length; i++) {

            let button = ButtonGenerator.generateButton({
                id: `popup_button_${i}`,
                class: "sw_big_button",
                html: buttons[i]
            }, function () {
                Popup.callbackCleanupWrapper("#popup_" + popupId, callbacks[i]);
            });

            $("#popup_" + popupId + " .popup_content").append(button);
        }

        $("#popup_" + popupId).css("display", "block");
    }

    /**
     * This function will create a simple popup which will fade out immediately
     * @param {String} text the text to be displayed
     */
    static createFadeoutPopup(element, text, callback = () => {}) {
        $(element).append(`
            <div class="popup">
                <div class="popup_content">
                    ${text}
                </div>
            </div>
        `);

        $(".popup:first").fadeOut(Constant.popupFadeoutDuration, function () {
            $(this).remove();
            callback();
        });
    }

    /**
     * This function will prompt the user with a sportwatch premium
     * which will include info, and payment options.
     * 
     * @param {function} callback callback when done
     */
    static createPremiumPopup(callback) {

        $(".navbar").addClass("hidden");

        // this is the text at the bottom that lets the user know about the purchase, different for iOS and android
        let paymentInfo = "";

        if (device.platform == "iOS") {
            paymentInfo = (`
                Subscriptions will be charged to your iTunes account on purchase confirmation
                in an amount listed above for the selected plan.
                Subscriptions will automatically renew unless cancelled within
                24 hours before the end of the current period. You can cancel at anytime
                in your iTunes account settings. Any unused portion of a free trial will be
                forfeited if you purchase a subscription. For more information, view our
                <a href="https://sportwatch.us/privacy-policy">Privacy Policy</a> and
                <a href="https://sportwatch.us/terms-of-use/">Terms of Use</a>.
            `);
        } else {
            paymentInfo = (`
                Subscription renews every month. <a href="https://support.google.com/googleplay/answer/7018481?co=GENIE.Platform%3DAndroid&hl=en">Cancel at any time</a>.
                For more information, view our <a href="https://sportwatch.us/privacy-policy">Privacy Policy</a> and
                <a href="https://sportwatch.us/terms-of-use/">Terms of Use</a>.
            `);
        }

        $("#app").append(`
            <div id="premiumPopup" class="popup white_background">

                <img id="logoImg" width=25% src="img/logo.png" alt=""></img>

                <div class="premium_popup_description">
                    <b>Your membership is no longer active.</b>
                    <br>
                    Continue to improve with a Sportwatch Membership.
                </div>
            
                <div id="planOptions">
                </div>

                <br>
                <div class="payment_footer">
                    <div class="premium_deny_text">
                        No Thanks
                    </div><br>

                    <div id="legalText">
                        ${paymentInfo}
                    </div>

                </div>
            </div>
        `);

        // Re-open the app of the user didn't make a purchase
        $(".premium_deny_text").click(function (e) {
            $("#premiumPopup").fadeOut(Constant.popupFadeoutDuration, () => {
                $("#premiumPopup").remove();
                $(".navbar").removeClass("hidden");
            });
        });

        // -- PURCHASE SETUP -- //
        // Add a title and button for each plan (since Apple doesn't allow hard-coding)
        let plans = PaymentHandler.PLANS;
        // There is a rather annoying bug where the plans sometimes don't load
        if (plans.length == 0) {
            Popup.createConfirmationPopup("An error occured while fetching the available plans. Please restart the app and try again. " +
                "If the issue persists, please contact support@sportwatch.us", ["Restart App"], [() => {
                    location.reload();
                }]);
            return;
        }

        for (let p = 0; p < plans.length; p++) {

            // Don't add the plan more than once
            if ($("#" + plans[p].id).length != 0) {
                return;
            }
            
            // Check for missing title
            if(plans[p].title.length == 0) {
                plans[p].title = "Sportwatch Annual Membership";
            }
            
            // Append the content
            $(".popup #planOptions").append(`
                <button id="${plans[p].id}" class="premium_purchase_button">
                    ${plans[p].title}<br>${plans[p].price}/${plans[p].billingPeriodUnit}
                </button>
            `);
            break; // TODO: Remove after Apple approves the first in app purchase
        }


        // -- BUTTON CLICK -- //
        // Prevent the user from spamming a button
        $(".premium_purchase_button").click(function (e) {
            $(e.target).prop("disabled", true);

            let planId = $(e.target).prop("id");
            store.order(planId).then((param) => {
                $("#premiumPopup #logoImg").prop("src", "vid/logo-loading.gif");
            }).error(() => {
                Popup.createConfirmationPopup("Sorry, an unknown error occured. Please try again later", ["OK"]);
            });

        });

        // $(".premium_purchase_button:first").click(function (e) { 
        //     console.log("BUY MONTHLY");
        //     store.order(Constant.MONTHLY_ID).then(() => {

        //     }).error((err) => {

        //     });
        // });
        // $(".premium_purchase_button:last").click(function (e) { 
        //     console.log("BUY ANNUALLY");
        //     store.order(Constant.ANNUALLY_ID);            
        // });

        // -- SUBSCRIPTION PLANS -- //
        // $(".popup .premium_purchase_button").click((e) => {
        //     let subId = $(e.target).prop("id");
        //     console.log($(e.target));
        //     console.log(subId);
        //     store.order(Constant.MONTHLY_ID);
        // });

    }
    
    static createImportPopup() {
        
        // Prevent scrolling since roster spreadsheet needs to pan
        evaluateSwipes = false; // From swipe-holder.js (I know, messy :( )
        
        // Assign an ID so it doesn't intefere with other popups
        let popupId = "popup_" + ($(".popup").length + 1);
        // Get existing athletes; used in import to skip existing people
        let existingAthletes = [];
        dbConnection.selectValuesAsObject("SELECT * FROM athlete").then((resultSet) => {
            existingAthletes = resultSet;
        });
        
        $("#app").append(`
            <div class="popup" id="${popupId}">
    
                <div id="importRosterPopup" class="popup_content">
                    <h1 class="subheading_text">Import from CSV</h1>
                    <br>
                    <input id="csvUpload" type="file"></input>
                    <br>
                    <div id="tableWrapper">
                        <table id="rosterTable" border=0 cellspacing=0>
                            <!-- CSV content will be added here -->
                            <td>Upload roster above</td>
                        </table>
                    </div>
                    <br>
                    <span class="selectorLabel">Start Row:</span>
                    <select id="startRow" class="sw_dropdown rosterColSelector">
                        <option value="-1">--</option>
                    </select><br>
                    <span id="fnameSelector" class="selectorColor fnameCol">&nbsp;</span>
                    <span class="selectorLabel">First Name Column:</span>
                    <select id="roster_fname" class="sw_dropdown rosterColSelector">
                        <option value="-1">--</option>
                    </select><br>
                    <span id="lnameSelector" class="selectorColor lnameCol">&nbsp;</span>
                    <span class="selectorLabel">Last Name Column:</span>
                    <select id="roster_lname" class="sw_dropdown rosterColSelector">
                        <option value="-1">--</option>
                    </select><br>
                    <span id="genderSelector" class="selectorColor genderCol">&nbsp;</span>
                    <span class="selectorLabel">Gender Column:</span>
                    <select id="roster_gender" class="sw_dropdown rosterColSelector">
                        <option value="-1">--</option>
                    </select><br>
                    <span id="emailSelector" class="selectorColor emailCol">&nbsp;</span>
                    <span class="selectorLabel">Email Column (optional):</span>
                    <select id="roster_email" class="sw_dropdown rosterColSelector">
                        <option value="-1">--</option>
                    </select><br>
                    <br>
                    <button id="importCSVRoster" class="generated_button">Import</button><br>
                    <button id="cancelImport" class="generated_button">Cancel</button>
                </div>
            </div>
        `);
        popupId = "#" + popupId;
        $(popupId).css("display", "block");
        
        let tableEl = popupId + " #importRosterPopup #rosterTable";
        let roster = []; // Populated below
        let rowMax = 6; // Max number of rows before clipping occurs
        let blankRows = []; // Used to truncate any blank rows / columns
        let blankColumns = [];
        
        // When a file is selected, add the data to the table
        $(popupId + " #importRosterPopup #csvUpload").change((e) => {
            
            Tabulator.readCSVFromFile($(e.target), (readData) => {
                roster = readData;
                
                // Pre-import setup
                $(tableEl).empty();
                $("#importRosterPopup #startRow").empty();
                $("#importRosterPopup select.rosterColSelector:not(#startRow)").empty().append(`<option value="-1">--</option>`);
                
                // Add it to the table
                for(let r = 0; r < roster.length; r++) {
                    $(tableEl).append(`<tr id="r-row-${r}"></tr>`);

                    for(let c = 0; c < roster[r].length; c++) {
                        let cellVal = roster[r][c];
                        if(r > rowMax) {
                            cellVal = ". . .";
                        }
                        $(tableEl + ` #r-row-${r}`).append(`<td class="r-col-${c}">${cellVal}</td>`);

                        // Update blank / nonblank data
                        if((c == 0) && (r <= rowMax)) {
                            blankRows.push(r);
                        }
                        if(r == 0) {
                            blankColumns.push(c);
                        }
                        if((r <= rowMax) && (cellVal.length > 0)) { // Exclude rowMax that has "..." cells
                            if(blankRows.includes(r)) {
                                blankRows.splice(blankRows.indexOf(r), 1);
                            }
                            if(blankColumns.includes(c)) {
                                blankColumns.splice(blankColumns.indexOf(c), 1);
                            }
                        }
                    }
                    // Append filler cell so it filles the entire wrapper
                    $(tableEl + ` #r-row-${r}`).append("<td></td>");

                    // If row max has been exceeded, end the loop
                    if(r > rowMax) {
                        break;
                    }
                }
                
                // Remove blank rows & columns
                for(let d = 0; d < blankRows.length; d++) {
                    $(tableEl + " #r-row-" + blankRows[d]).remove();
                }
                for(let d = 0; d < blankColumns.length; d++) {
                    $(tableEl + " .r-col-" + blankColumns[d]).remove();
                }
                
                // Add row start options
                let newRowNum = 0;
                for(let p = 0; p < roster.length; p++) {
                    if(blankRows.includes(p)) {
                        continue;
                    }
                    $("#importRosterPopup #startRow").append(`<option value="${newRowNum}">${newRowNum + 1}</option>`);
                    newRowNum++;
                }
                // Add column selector options
                let newColNum = 0;
                for (let p = 0; p < roster[0].length; p++) {
                    if (blankColumns.includes(p)) {
                        continue;
                    }
                    $("#importRosterPopup select.rosterColSelector:not(#startRow)").append(`<option value="${newColNum}">${newColNum + 1}</option>`);
                    newColNum++;
                }

                // Bind coloring of roster
                $("#importRosterPopup select.rosterColSelector").change((e) => {
                    let importVal = $(e.target).prop("id").replace("roster_", ""); // Ex. "fname", "lname", etc.
                    let colNumber = parseInt($(e.target).val()) + 1;
                    
                    // Calculate the start row
                    $(tableEl + " tr").removeClass("excludedRow");
                    for(let e = 0; e < parseInt($("#importRosterPopup #startRow").val()); e++) {
                        $(tableEl + " tr:nth-child(" + (e + 1) + ")").addClass("excludedRow");
                    }
                    // End operations if this is the start row selector
                    if(importVal == "startRow") {
                        return;
                    }
                    
                    $(tableEl + " td").removeClass(importVal + "Col");
                    $(tableEl + " td:nth-child(" + colNumber + ")").addClass(importVal + "Col");
                });
            });
            
        });
        
        // Import button
        $(popupId + " #importCSVRoster").click((e) => {
            // Disable button
            $(e.target).prop("disabled", true).css("background-color", "lightgray");
            
            // Make sure a file has been selected
            if($(popupId + " #importRosterPopup #tableWrapper td").length == 1) {
                Popup.createConfirmationPopup("Please select a CSV file to import", ["OK"]);
                $(e.target).prop("disabled", false).css("background-color", "");
                return;
            }
            
            // Fetch the column numbers based on user input
            let columnMappings = [];
            let columnSelectors = ["fname", "lname", "gender", "email"];
            let readableName = ["first name", "last name", "gender", "email"];
            for(let c = 0; c < columnSelectors.length; c++) {
                let assignedCol = $(popupId + " #importRosterPopup #roster_" + columnSelectors[c]).val();
                
                // Make sure the required fields are present
                if((assignedCol == -1) && (c < 3)) { // Ignore if email is -1 (email is index 3)
                    Popup.createConfirmationPopup("Please specify all required columns", ["OK"]);
                    $(e.target).prop("disabled", false).css("background-color", "");
                    return;
                }
                // If email column wasn't given, exit early (avoids out of bounds error below)
                if(assignedCol == -1) {
                    columnMappings[c] = assignedCol;
                    continue;
                }
                
                // Since the preview display has blank columns removed, re-map the
                // selection back to the original column
                assignedCol = $(popupId + " #importRosterPopup td:nth-child(" + (parseInt(assignedCol) + 1) + "):first").prop("class");
                if(assignedCol.indexOf(" ")) {
                    assignedCol = assignedCol.substring(0, assignedCol.indexOf(" "));
                }
                assignedCol = parseInt(assignedCol.replace("r-col-", ""));
                
                // Make sure there isn't overlap
                if (columnMappings.indexOf(assignedCol) != -1) {
                    let dupValue = readableName[columnMappings.indexOf(assignedCol)];
                    let curVal = readableName[c];
                    Popup.createConfirmationPopup("The same column cannot be used for both the " + dupValue + " and " + curVal, ["OK"]);
                    $(e.target).prop("disabled", false).css("background-color", "");
                    return;
                }
                
                columnMappings[c] = assignedCol;
            }
            
            // Convert the starting row to the actual row (without blanks removed)
            let startingRow = $("#importRosterPopup #startRow").val();
            startingRow = $(popupId + " #importRosterPopup tr:nth-child(" + (parseInt(startingRow) + 1) + "):first").prop("id");
            startingRow = parseInt(startingRow.replace("r-row-", ""));
            
            // Import variables
            let finalImportCount = 0; // Used to track when backend import finished
            let currentImportCount = 0;
            
            // Now, start the actual import :D
            importLoop:
            for(let i = startingRow; i < roster.length; i++) {
                
                if(blankRows.includes(i)) {
                    continue;
                }
                
                let importFname = roster[i][columnMappings[0]];
                let importLname = roster[i][columnMappings[1]];
                let importGender = roster[i][columnMappings[2]];
                let importEmail = "";
                
                // If they already exist, don't import them (TODO: Optimize this)
                for(let d = 0; d < existingAthletes.length; d++) {
                    let testCase = existingAthletes[d];
                    if((testCase.fname == importFname) && (testCase.lname == importLname) && (testCase.gender == importGender)) {
                        continue importLoop;
                    }
                }
                // Include email (if defined)
                if(columnMappings[3] != -1) {
                    importEmail = roster[i][columnMappings[3]];
                }
                
                // Add user to backend
                TeamBackend.addToTeam(importFname, importLname, importGender, importEmail, (response) => {
                    // Increment added athlete count and display finished message when done
                    currentImportCount++;
                    if(currentImportCount == finalImportCount) {
                        Popup.createConfirmationPopup("Successfully imported " + currentImportCount + " athletes!", ["Close"], [() => {
                            // Trigger close button to re-enable swipes and close import dialog
                            $("#importRosterPopup #cancelImport").trigger("click");
                        }]);
                    }
                    
                    // Add to local database
                    let newAthleteInfo = response.invitedInfo;
                    newAthleteInfo["id_backend"] = newAthleteInfo["id_user"];
                    delete newAthleteInfo["id_user"];
                    if("email" in newAthleteInfo) {
                        delete newAthleteInfo["email"];
                    }
                    dbConnection.insertValuesFromObject("athlete", response.invitedInfo);
                    
                });
                
                // Need to create an object to match existing database format
                let importAthlete = {
                    fname: importFname,
                    lname: importLname,
                    gender: importGender,
                    email: importEmail
                };
                existingAthletes.push(importAthlete);
                finalImportCount++;
            }
            
            if(finalImportCount == 0) {
                Popup.createConfirmationPopup("No new athletes were added because they already exist on the team.", ["OK"], [() => {
                    $("#importRosterPopup #cancelImport").trigger("click");
                }]);
            }
        });
        
        // Cancel button
        $(popupId + " #cancelImport").click((e) => {
            evaluateSwipes = true;
            Popup.callbackCleanupWrapper(popupId, () => { /* Nothing */ });
        })
        
        
    }
    
    
    
}
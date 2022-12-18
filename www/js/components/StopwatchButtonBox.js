/**
 * @class
 * @classdesc Contains button boxes for multiple events and splits on the
 * stopwatch page
 */
class StopwatchButtonBox {
    
    /**
     * Will assist in the generation of the button boxes and athlete
     * lists used for multiple events and splits on the stopwatch.
     * 
     * @param {String} pageSelector - CSS selector to target the HTML stopwatch page
     */
    constructor(pageSelector = "#stopwatchPage #landingPage") {
        
        this.labels = [];
        
        this.PAGE_SELECTOR = pageSelector;
        this.SLIDEUP_CLASS = "slideup_top_bar";
        
        this.containerHtml = (`<table class="${this.SLIDEUP_CLASS}"></table>`);
        
    }
    
    /**
     * Creates (and appends) buttons to the top of the stopwatch slider interface
     * based on the provided labels. The onClickCallback will be passed the button
     * index integer (starts at 0). This function automatically adds the
     * "selected_button" class, as well as showing and hiding the necessary button
     * boxes when using splits. As a result, the onClickCallback need only handle
     * updating the event config with the active index.
     * This function is not purely functional as it modifies the DOM independently,
     * but it seems like the most efficient layout for the function
     * 
     * @example generateButtons(["100m", "400m", false, (index) => { ... }]);
     *          --> (multiple event call)
     * @example generateButtons(["100 Meter split", "200 Meter Split" "Finish"], true, (index) => { ... });
     *          --> (splits setup)
     * 
     * @param {Array} labels - array of strings used to label the buttons on the slider top bar
     * @param {Boolean} isSplits - are these buttons being used for splits?
     * @param {Function} onClickCallback - function to be executed when a button is clicked; should
     *                                     accept the button index integer as a parameter
     */
    generateButtons(labels, isSplits, onClickCallback) {
        
        for (let i = 0; i < labels.length; i++) {
            
            // Add a new row if needed
            if (i == 0 || i % Constant.stopwatchSelectEventColumnCount == 0) {
                $(`${this.PAGE_SELECTOR} .${this.SLIDEUP_CLASS}`).append(`<tr></tr>`);
            }
            
            
            // Define the button properties before adding it to the slider
            let buttonProps = {
                "html": labels[i],
                "data-index": i // Used with EventConfig to determine which button was pressed
            };
            // If this is the first button, highlight it
            if (i == 0) {
                buttonProps["class"] = "selected_button";
            }

            // Create a cell for the event and bind it to a click event
            // which will set the color for it
            let buttonObject = $("<td>", buttonProps);
            buttonObject.click((e) => {
                // Highlight it
                $(`${this.PAGE_SELECTOR} .${this.SLIDEUP_CLASS} td.selected_button`).removeClass("selected_button");
                $(e.target).addClass("selected_button");
                let butttonIndex = $(e.target).attr("data-index");
                
                // If these are splits, show the appropriate button box
                if (isSplits) {
                    // Hide the current button box, then show the new one
                    $(`${this.PAGE_SELECTOR} .button_box:not(.hidden)`).addClass("hidden");
                    $(`.button_box[data-split-index="${butttonIndex}"]`).removeClass("hidden");
                }
                
                // Call the callback with the given index
                onClickCallback(butttonIndex);
            });
            // buttonObject.click((e) => {
            //     let recordId = $(e.target).attr("id_record_definition");
            //     $("#stopwatchPage .selected_event").removeClass("selected_event");
            //     // eventConfig.selectedEvent = Number(recordId);
            //     eventConfig.setActiveEventByDefinitionId(Number(recordId));

            //     $(e.target).addClass("selected_event");
            // });

            // Append to the last row added
            $(`${this.PAGE_SELECTOR} .${this.SLIDEUP_CLASS} tr:last-child`).append(buttonObject);
            
            // If these are split buttons, add a button box to the stopwatch slider
            // since all athletes need to be present for each split
            if (isSplits) {
                let buttonBoxProps = {
                    "class": "button_box " + (i != 0 ? "hidden" : ""),
                    "data-split-index": i
                };
                let buttonBoxObject = $("<div>", buttonBoxProps);
                $(`${this.PAGE_SELECTOR} #slideup_content`).append(buttonBoxObject);
            }
        }
        
    }
    
    
}




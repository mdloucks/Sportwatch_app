
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
    
                <div class="popup_content popup_top_position">
                    <span class="close">&times;</span>
                    <p class="popup_tooltip">${tooltip}</p><br>
                </div>
            </div>
        `);
        
        for (let i = 0; i < buttons.length; i++) {

            let button = ButtonGenerator.generateButton({ id: `popup_button_${i}`, class: "popup_button", html: buttons[i] }, function () {
                Popup.callbackCleanupWrapper("#popup_" + popupId, callbacks[i]);
            });

            $("#popup_" + popupId + " .popup_content").append(button);
        }

        $("#popup_" + popupId).css("display", "block");

        $("#popup_" + popupId + " .close:first").on("click", function (e) {
            e.preventDefault();
            $("#popup_" + popupId + " .close").unbind();            
            $("#popup_" + popupId).fadeOut(300, function () { $(this).remove(); });
        });
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
}



/**
 * Will display a confirmation popup for the user
 * 
 * will take an array of button names and callbacks for each button
 * 
 * @param {String} tooltip Flavor text at the top of the popup
 * @param {Array} buttons Array containing text of buttons
 * @param {Array} callbacks Array containing callback functions for each respective button
 */
function createConfirmationPopup(tooltip, buttons, callbacks) {

    let buttons_html = "";

    for (let i = 0; i < buttons.length; i++) {
        buttons_html += `<button class="popup_button" id="popup_button_${i}">${buttons[i]}</button><br><br>`;

        $(document).on("click", `#popup_button_${i}`, function (e) {
            e.preventDefault();
            callbacks[i](); 
        });
    }
    
    $("#app").append(`
        <div class="popup">

            <!-- Modal content -->
            <div class="popup-content">
                <span class="close">&times;</span>
                <p class="popup_tooltip">${tooltip}</p><br>
                ${buttons_html}
            </div>
        </div>
    `);

    $(".popup:first").css("display", "block");

    $(document).on("click", `.close:first`, function (e) {
        console.log("close");
        e.preventDefault();
        $(".popup:first").fadeOut();
    });
}
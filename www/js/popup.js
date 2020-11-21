
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

        if(device.platform == "iOS") {
            paymentInfo = (`
                Subscriptions will be charged to your iTunes account on purchase confirmation
                in an amount listed above for the selected plan.
                Subscriptions will automatically renew unless cancelled within
                24 hours before the end of the current period. You can cancel at anytime
                in your iTunes account settings. Any unused portion of a free trial will be
                forfeited if you purchase a subscription. For more information, view our
                <a href="https://sportwatch.us/privacy-policy">Privacy Policy</a> and
                <a href="https://sportwatch.us/terms-and-conditions/">Terms of Service</a>.
            `);
        } else {
            paymentInfo = (`
                Subscription renews every month. <a href="https://support.google.com/googleplay/answer/7018481?co=GENIE.Platform%3DAndroid&hl=en">Cancel at any time</a>.
                For more information, view our <a href="https://sportwatch.us/privacy-policy">Privacy Policy</a> and
                <a href="https://sportwatch.us/terms-and-conditions/">Terms of Service</a>.
            `);
        }
        
        $("#app").append(`
            <div id="membershipPopup" class="popup white_background">

                <img width=45% src="img/logo.png" alt=""></img>

                <div class="premium_popup_description">
                    <b>Your free trial has expired.</b><br><br>
                    Continue to improve with Sportwatch Premium.<br><br><br>
                </div>

                <button class="premium_purchase_button">1 Month - $3.99 / month</button>

                <button class="premium_purchase_button">1 Year - $39.99 / year</button>

                <div id="planOptions">
                </div>

                <br>
                <div class="payment_footer">
                    <div class="premium_deny_text">
                        No Thanks
                    </div><br>

                    <div>
                        ${paymentInfo}
                    </div>

                </div>
            </div>
        `);

        // close the app if the user does not make a purchase
        $(".premium_deny_text").click(function (e) { 
            Popup.createConfirmationPopup("Sportwatch requires a premium membership in order to use. Do you want to go back to using a clipboard?",
             ["No, take me back!", "Yes"], [function() {
                return;
            }, function() {
                // TODO: open a link that prompts the user for a reason why they don't want to keep using the app.
                navigator.app.exitApp();
            }])
        });

        $(".premium_purchase_button:first").click(function (e) { 
            console.log("BUY MONTHLY");
            store.order(Constant.MONTHLY_ID);
        });

        $(".premium_purchase_button:last").click(function (e) { 
            console.log("BUY ANNUALLY");
            store.order(Constant.ANNUALLY_ID);            
        });

        // continue this here https://purchase.cordova.fovea.cc/use-cases/subscription-android 
        
        // -- PURCHASE SETUP -- //
        // Add a title and button for each plan
        // let plans = PaymentHandler.PLANS;
        // for(let p = 0; p < plans.length; p++) {
            
        //     // Don't add the plan more than once
        //     if($("#" + plans[p].id).length != 0) {
        //         return;
        //     }
            
        //     // Append the content
        //     $(".popup #planOptions").append(`
        //         <p style="margin: 0; font-size: 2em;">${plans[p].title}</p>
        //         <button id="${plans[p].id}" class="premium_purchase_button">
        //             ${plans[p].price}
        //         </button><br><br>
        //     `);
        // }
        
        // -- SUBSCRIPTION PLANS -- //
        // $(".popup .premium_purchase_button").click((e) => {
        //     let subId = $(e.target).prop("id");
        //     console.log($(e.target));
        //     console.log(subId);
        //     store.order(Constant.MONTHLY_ID);
        // });
        
    }   
}

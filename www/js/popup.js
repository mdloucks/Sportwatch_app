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
}
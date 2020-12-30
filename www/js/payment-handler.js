/**
 * @class
 * @classdesc used to handle in app purchases and subscriptions
 */
class PaymentHandler {

    /**
     * Sets up the Fovea receipt validator / in-app purchase setup. This should
     * be called as soon as possible to handle purchases at any point in the app
     * cycle. It will NOT define any beahvior for updating
     * app information once a subscription is purchased.
     */
    static initPlans() {
        
        // Add plans (annual, seasonal) here \/
        store.register([{
                // Sportwatch Monthly
                id: Constant.MONTHLY_ID,
                type: store.PAID_SUBSCRIPTION,
            },
            {
                // Sportwatch annually
                id: Constant.ANNUALLY_ID,
                type: store.PAID_SUBSCRIPTION,
            }
        ]);

        // Setup the receipt validator service.
        store.validator = Constant.getValidateURL();
        store.applicationUsername = localStorage.getItem("email");

        // Log the error
        store.error(function (error) {
            console.log("THERE WAS AN ERROR #" + error.code + ": " + error.message);
            console.log(error);
        });

        // Update the status of each subscription when updated
        store.when("subscription").updated(() => {
            PaymentHandler.PLANS = []; // Clear the array to re-register the plans
            PaymentHandler.PLANS.push(store.get(Constant.MONTHLY_ID));
            PaymentHandler.PLANS.push(store.get(Constant.ANNUALLY_ID));
        });
        
        // Good docs: https://github.com/j3k0/cordova-plugin-purchase/blob/master/doc/api.md#order
        
        // Check to see if they own any of the plans
        store.when(Constant.MONTHLY_ID).updated((product) => {
            if((product.owned) && (product.state == "owned") && (!product.isExpired)) {
                this.handlePremiumSetup();
            }
        });
         store.when(Constant.ANNUALLY_ID).updated((product) => {
            if((product.owned) && (product.state == "owned") && (!product.isExpired)) {
                this.handlePremiumSetup();
            }
        });
        
        // Set up the logic for when a plan is ordered (i.e. initiated by button press)
        store.when(Constant.MONTHLY_ID).approved((product) => {
            // console.log("Monthly approved");
            // console.log(product);
            product.verify();
        });
        store.when(Constant.ANNUALLY_ID).approved((product) => {
            
        });
        
        store.when(Constant.MONTHLY_ID).verified((product) => {
            product.finish();
            // console.log("Is verified");
            // this.handlePremiumSetup();
        });
        store.when(Constant.ANNUALLY_ID).verified((product) => {
        });
        
        // Load informations about products and purchases
        store.refresh();
    }
    
    /**
     * Function that will handle the logic after purchasing a membership / premium.
     * It sets up the event listener for when a product is updated.
     * 
     * @param {String} planId unique ID of the plan (defined in Constant object)
     */
    static handlePremiumSetup(planId) {
        console.log("Premium member!");
        // If the popup is open, we know the user just bought a membership
        // Make sure it's ONLY the premium popup; don't want to thank the user twice
        if(($("#premiumPopup").length != 0) && ($(".popup:not(#premiumPopup)").length == 0)) {
            
            Popup.createConfirmationPopup("Welcome to Sportwatch Premium! Thank you for your purchase!", ["Start Tracking!"], [function() {
                // After clicking the button, remove the premium popup too
                $("#premiumPopup").fadeOut(1500, function() {
                    $("#premiumPopup").remove();
                    $(".navbar").removeClass("hidden");
                });
            }]);
            
        }
        // Else, they already have an active subscription, so don't pester them
    }
    
    
    
}

PaymentHandler.PLANS = []; // Will be populated by initPlans()
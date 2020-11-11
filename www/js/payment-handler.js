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
        });

        // Update the status of each subscription when updated
        store.when("subscription").updated(() => {
            PaymentHandler.PLANS.push(store.get(Constant.MONTHLY_ID));
            PaymentHandler.PLANS.push(store.get(Constant.ANNUALLY_ID));
        });

        // Load informations about products and purchases
        store.refresh();
    }

}

PaymentHandler.PLANS = []; // Will be populated by initPlans()
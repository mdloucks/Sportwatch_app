/**
 * @classdesc Used to interface and make calls to the backend for plan / subscription purposes
 * @class
 */
class PlanBackend {
    // Docs: https://www.sportwatch.us/mobile/docs#plan
    
    // More detailed documentation coming in the future
    // For now, know that callback should take a boolean: does the user have a paid subscription (true/false)?
    static isPremiumMember(targetEmailOrId, callback) {
        
        // Placeholder function until Seth can write a fully worked out solution
        if(true) {
            callback(true);
        }
    }
    
    /**
     * Submits a request to the backend to retrieve the user's active subscription
     * plan. The email address or numerical ID of the user can be given in the first
     * parameter. The response will be an object with properties / keys of
     * status (+10 for success, -10 for failure), isActive (plan, 1 or 0),
     * and the endsOn of the plan (may be null if no active plan)
     * 
     * @example getActivePlan("loucks@sportwatch.us", (response) => { // Process plan info })
     *          getActivePlan(1, (response) => { // Process plan pt. 2 })
     * 
     * @param {AssociativeArray} targetEmailOrId email or ID of the user
     * @param {Function} callback callback to handle the response (JSON or String on failure)
     */
    static getActivePlan(targetEmailOrId, callback) {
        
        let storage = window.localStorage;
        let identityKey = "email"; // "email" if targetEmailOrId is a string, "id_user" if it's a number
        
        if(typeof targetEmailOrId == "number") {
            identityKey = "id_user";
        } else { // Assume it was an email
            if(targetEmailOrId.length == 0) {
                targetEmailOrId = storage.getItem("email");
            }
        }
        
        // Prepare the array
        let requestArray = {};
        requestArray.SID = storage.getItem("SID");
        requestArray.accountIdentity = { [identityKey]: targetEmailOrId };
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.URL.plan_action + "?intent=0",
            timeout: Constant.AJAX_CFG.timeout,
            data: requestArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[plan-backend.js:getActivePlan()] " + response);
                }
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                callback(response);
            },
            error: (error) => {
                if(DO_LOG) {
                    console.log("[plan-backend.js:getActivePlan()] " + error);
                }
                callback(error);
            }
        });
    }
    
    /**
     * Changes the plan for the given user. This won't affect the end date of
     * the current plan, but it will change the price and name associated with
     * the user. Probably best only to issue this call when the user is making
     * a purchase. (i.e. Buy a seasonal pass:  changePlan(), approvePayment(), makePayment())
     * 
     * @example changePlan("loucks@sportwatch.us", 1, (r) => { // Proceed with payment })
     *          --> Will change the plan on the backend and return new plan info in response
     * 
     * @param {AssociativeArray} targetEmailOrId email or ID of the user
     * @param {Integer} newPlanId the ID of the new subscription plan for this user (1=monthly, 2=seasonally)
     * @param {Function} callback callback to handle the response (JSON or String on failure)
     */
    static changePlan(targetEmailOrId, newPlanId, callback) {
        
        let storage = window.localStorage;
        let identityKey = "email"; // "email" if targetEmailOrId is a string, "id_user" if it's a number
        
        if(typeof targetEmailOrId == "number") {
            identityKey = "id_user";
        } else { // Assume it was an email
            if(targetEmailOrId.length == 0) {
                targetEmailOrId = storage.getItem("email");
            }
        }
        
        // Prepare the array
        let requestArray = {};
        requestArray.SID = storage.getItem("SID");
        requestArray.accountIdentity = { [identityKey]: targetEmailOrId };
        requestArray.newPlanId = newPlanId;
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.URL.plan_action + "?intent=1",
            timeout: Constant.AJAX_CFG.timeout,
            data: requestArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[plan-backend.js:changePlan()] " + response);
                }
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                callback(response);
            },
            error: (error) => {
                if(DO_LOG) {
                    console.log("[plan-backend.js:changePlan()] " + error);
                }
                callback(error);
            }
        });
    }
    
    /**
     * NOTE: SHOULD BE CALLED BEFORE MAKING AN OFFICIAL PAYMENT
     * This function will communicate with the server to make sure an amount of money
     * is acceptable to be paid. This is necessary as we won't want user's over-paying
     * or under-paying, as there is no way of tracking a running "balance."
     * Also, if a user does over or under pay, there's no easy way to revoke that
     * once Android or Apple takes the money. If approved, a positive status = 10 will
     * be returned
     * 
     * @example approvePayment("loucks@sportwatch.us", 9.99, (r) => { // Decide to proceed or not });
     *          --> Returns negative substatus since loucks is on monthly plan
     * 
     * @param {AssociativeArray} targetEmailOrId email or ID of the user
     * @param {Double} amount amount in USD the user is about to pay
     * @param {Function} callback callback to handle the response (JSON or String on failure)
     */
    static approvePayment(targetEmailOrId, amount, callback) {
        
        let storage = window.localStorage;
        let identityKey = "email"; // "email" if targetEmailOrId is a string, "id_user" if it's a number
        
        if(typeof targetEmailOrId == "number") {
            identityKey = "id_user";
        } else { // Assume it was an email
            if(targetEmailOrId.length == 0) {
                targetEmailOrId = storage.getItem("email");
            }
        }
        
        // Prepare the array
        let requestArray = {};
        requestArray.SID = storage.getItem("SID");
        requestArray.accountIdentity = { [identityKey]: targetEmailOrId };
        requestArray.proposedAmount = amount;
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.URL.plan_action + "?intent=2",
            timeout: Constant.AJAX_CFG.timeout,
            data: requestArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[plan-backend.js:approvePayment()] " + response);
                }
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                callback(response);
            },
            error: (error) => {
                if(DO_LOG) {
                    console.log("[plan-backend.js:approvePayment()] " + error);
                }
                callback(error);
            }
        });
    }
    
    /**
     * NOTE: approvePayment() SHOULD BE CALLED PRIOR TO THIS
     * This will likely be called after the user has successfully paid money via
     * Android or Apple store. This will record the payment in a database log, as well
     * as activate their plan and determine the ending date (endsOn)
     * 
     * @example makePayment("loucks@sportwatch.us", 3.99, (r) => { // Notify user })
     *          --> Activates the monthly plan for Loucks and returns the updated plan info
     * 
     * @param {AssociativeArray} targetEmailOrId email or ID of the user
     * @param {Double} amount amount of money (USD) paid
     * @param {Function} callback callback to handle the response (JSON or String on failure)
     */
    static makePayment(targetEmailOrId, amount, callback) {
        
        let storage = window.localStorage;
        let identityKey = "email"; // "email" if targetEmailOrId is a string, "id_user" if it's a number
        
        if(typeof targetEmailOrId == "number") {
            identityKey = "id_user";
        } else { // Assume it was an email
            if(targetEmailOrId.length == 0) {
                targetEmailOrId = storage.getItem("email");
            }
        }
        
        // Prepare the array
        let requestArray = {};
        requestArray.SID = storage.getItem("SID");
        requestArray.accountIdentity = { [identityKey]: targetEmailOrId };
        requestArray.amountPaid = amount;
        
        // Submit the request and call the callback
        return $.ajax({
            type: "POST",
            url: Constant.URL.plan_action + "?intent=3",
            timeout: Constant.AJAX_CFG.timeout,
            data: requestArray,
            success: (response) => {
                if(DO_LOG) {
                    console.log("[plan-backend.js:makePayment()] " + response);
                }
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    // Couldn't parse, so just use string
                }
                callback(response);
            },
            error: (error) => {
                if(DO_LOG) {
                    console.log("[plan-backend.js:makePayment()] " + error);
                }
                callback(error);
            }
        });
    }
    
    /**
     * Used to recall values from local storage and will check to make sure
     * they aren't null or empty. It will also perform a basic sanitize on
     * strings. It returns an associaitve array of the keys and values
     * 
     * @example accountData = getLocalValues(["fname", "lname", "email"]); --> ("fname" => "scott"...)
     * 
     * @param {Array} valueKeys array of string keys for values to fetch
     * @returns
     * Associative Array of the requests keys (if they weren't null) and the value
     */
    static getLocalValues(valueKeys) {
        
        // Associative array (aka object) with key: value (if exists)
        let returnArray = {}; // Not using an object fails
        let storage = window.localStorage;
        
        for(let k = 0; k < valueKeys.length; k++) {
            let key = valueKeys[k];
            
            if((storage.getItem(key) != undefined) && (storage.getItem(key) != null)) {
                let value = storage.getItem(key);
                if((typeof value == "string") && (value.length > 0)) {
                    // Filter with a generic regex (replace most special characters)
                    returnArray[key] = value.replace(/[^A-Za-z0-9@\-_\. ]/gm, "");
                    
                } else {
                    returnArray[key] = value; // Not much filtering to be done
                }
            }
        };
        
        return returnArray;
    }
    
    /**
     * Validates a user input before sending to the server (or storing internally).
     * It will return the cleaned value if the sanitized input is within the length bounds (assuming
     * it's a string). False otherwise.
     * NOTE: Should only be used for strings (hard / meaningless to filter booleans, etc.)
     * 
     * @example firstName = getValidInput(response["fname"], /[^A-Za-z]/, 0, 60);
     *          --> Returns first name, removing everything that isn't a letter  (A-Za-z)
     * 
     * @param {String} input user input being sent to the server
     * @param {String|Regex} replaceChars search to remove from the input
     * @param {Integer} minLength minimum length for valid input (exclusive)
     * @param {Integer} maxLength maximum length for the input (inclusive)
     */
    static getValidInput(input, replaceChars, minLength, maxLength) {
        if ((input == null) || (input == undefined)) {
            return false;
        } else {
            input = input.replace(replaceChars, ""); // Remove based on given filter
            if ((input.length > minLength) && (input.length <= maxLength)) {
                return input;
            }
        }
        return false;
    }
    
}

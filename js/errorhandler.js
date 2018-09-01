/**
 * a file for handling and reporting various errors.
 */


var ErrorHandler = {

    native_errors: {
        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        //  Ajax Errors
        //....................................................................................
        ajax: [
            function AjaxTimeoutError() {
                this.errorMessage = "Network Timeout: request took too long, check your internet connection.";
            },

            function AjaxParseError() {
                this.errorMessage = "Parse Error: We could not understand the response send back by our servers.";
            }
        ],
        //=====================================================================================
    },


    /**
     * this file contains many custom errors we may encounter while running the app.
     * This may include basic things such as network timeouts/unavaliable or ui stuff
     *
     * They will also all include errorMessage in order to print them neatly into our app
     */
    sw_errors: {
        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        //  SID Errors
        //....................................................................................
        SID: [
            function invalidSID() {
                this.errorMessage = "You've submitted a session ID that doesn't exist, better luck next time!";
            },
            function loginExpiredSession() {
                this.errorMessage = "You haven't logged into your account for a long time. We want to make sure this is you.";
            }
        ],

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        //  Login Errors
        //....................................................................................
        login: [
            function loginWrongCredentials() {
                this.errorMessage = "Invalid email or password.";
            },

            function loginDifferentDevice() {
                this.errorMessage = "We want to make sure this device belongs to the real you. Go to your email and click on the verification link sent to you to validate this device. Protecting your data and privacy means a lot to us.";
            }
        ],

        //=====================================================================================

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        //  Signup Errors
        //....................................................................................
        signup: [
            function signupInvalidEmailError() {
                this.errorMessage = "The email you entered is not formatted correctly.";
            },
            function signupNonexistantEmailError() {
                this.errorMessage = "The email at the domain you entered does not exist.";
            },
            function signupDuplicateError() {
                // TODO create hyperlink for sign in
                this.errorMessage = "We already have a user with that username! Try another one or sign in.";
            },
            function signupWeakPasswordError() {
                this.errorMessage = "Sorry, the password you entered does not comply with our security standards. At least 8 characters.";
            }
        ],
        //=====================================================================================

        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        //  Internal Server Errors
        //....................................................................................
        server: [
            /**
            * this is a catch all error that we may send if we have no idea what the problem is.
            */
            function serverGenericError() {
                this.errorMessage = "Something went wrong with our servers. Please try again or contact us if the problem persists. We are truely sorry for the inconvenience :(";
            },

            function serverMaintainenceError() {
                this.errorMessage = "Our servers are undergoing schedualed maintainence. They should be done in roughly: ";
            }
        ]
        //=====================================================================================
    },

    // for greater error reporting results and visibility
    debugMode: true,

    /**
     * Will find the error and report it in the given jqXHR request
     * "success", "notmodified", "error", "timeout", "abort", or"parsererror" on textStatus
     * 
     * @param JqXHR
     */
    handleAjaxError(error) {

        try {
            var errorType = this.native_errors["ajax"];

            switch (error.statusText) {
                case "success":
                    return;
                case "notmodified":
                case "timeout":
                    throw new errorType.AjaxTimeoutError();
                case "abort":
                case "timeout":
                case "parsererror":
                    throw new errorType.AjaxParseError();
                case "error":
            }
        } catch (e) {
            this.resolveError(e);
        }
    },

    /**
     * 
     * checks if the status code indicates a successful login, if it is unsuccessful, report the error.
     * 
     * @param {JSON} response from the sportwatch server
     */
    handleServerStatusCodeError(response) {
        try {
            switch (response["status"]) {
                case -1:
                    let SIDError = new this.sw_errors.SID[response["substatus"]]();
                    SIDError.response = response;
                    throw SessionIDError;
                case -2:
                    let loginError = new this.sw_errors.login[response["substatus"]]();
                    loginError.response = response;
                    throw loginError;
                case -3:
                    let signupError = new this.sw_errors.signup[response["substatus"]]();
                    signupError.response = response;
                    throw signupError;
            }                
        } catch (e) {
            this.resolveError(e);
        }
    },


    /**
     * Generic function which will take an error and report it to the console and do any
     * cleanup necessary as required by that function
     */
    resolveError(error) {

        if (!this.debugMode) {
            this.reportError(error);
        } else {
            this.reportErrorDebug(error);
        }
    },

    /**
     * will report the error in a more user friendly fashion and maybe execute some cleanup code
     * 
     * note: this function takes a custom sw-error
     * 
     * @param {sw_errors} error
     */
    reportError(error) {
        console.log(error.errorMessage);
    },

    /**
     * this one is for the code gremlins
     */
    reportErrorDebug(error) {
        console.log(`
                                    ERROR
        ===============================================================
        ${error.errorMessage}
        ===============================================================
        
                                Server Response
        ===============================================================
        ${JSON.stringify(error.response)}
        ===============================================================
        `);

        $("#app").append(`<p style="font-size: 2em; color: red;">${error.errorMessage}</p>`);
    }

};
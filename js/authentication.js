
/**
 * this object deals with authenticating our users with the server. Any login or attempt to say "I'm this user" must go through this
 */
var Authentication = {

    /**
     * 
     * Will send the given JSON credentials to the server in attempt to login
     * 
     * NOTE: all ajax request errors will be dealt with by this file. 
     * When you fullfill or reject the promise, its either a yes or no. 
     * 
     * @param {JSON} credentials 
     */
    login(email, password) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: "POST",
                url: sw_urls.login,
                timeout: ajax_config.timeout,
                data: {
                    email : email,
                    password : password
                },
                success: (response) => {    

                    // check for valid json
                    let data;

                    try {
                        data = JSON.parse(response);
                    } catch(e) {
                        console.log(`
                            ${data}
                        `);
                        reject();
                    }

                    if(this.validateServerStatusCode(data)) {
                        this.setSID(data["SID"]);     
                        resolve(data);
                    } else {
                        ErrorHandler.handleServerStatusCodeError(data);
                        reject(data);
                    }
                },
                error: (response) => {
                    console.log("login ajax error");
                    let data = JSON.parse(response);
                    ErrorHandler.handleAjaxError(data);
                    reject(data);
                }
            });
        });
    },

    /**
     * destroys the user's SID and sends them back to the welcome screen
     */
    logout() {
        localStorage.removeItem("SID");
        StateManager.setState("welcome");
    },

    validateSID(SID) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: "POST",
                url: sw_urls.login,
                timeout: ajax_config.timeout,
                data: {
                    SID : SID
                },
                success: (response) => {
                    let data = JSON.parse(response);

                    if(this.validateServerStatusCode(data)) {
                        resolve(data);
                    } else {
                        ErrorHandler.handleServerStatusCodeError(data);
                        reject(data);
                    }
                },
                error: (response) => {
                    let data = JSON.parse(response);
                    ErrorHandler.handleAjaxError(data);
                    reject(data);
                }
            });
        });        
    },

    /**
     * Send an ajax post request to the sportwatch servers to sign the user up
     * 
     * @param {String} email The user's email
     * @param {String} password The user's password
     * @param {String} account_type The user's account type ("coach or athlete")
     */
    signup(email, password, account_type) {
        console.log("Signing up user...");
        return new Promise((resolve, reject) => {
            $.ajax({
                type: "POST",
                url: sw_urls.signup,
                timeout: ajax_config.timeout,
                data: {
                    email: email,
                    password: password,
                    account_type: account_type
                },
                success: (response) => {

                    let data = JSON.parse(response);

                    if(this.validateServerStatusCode(data)) {
                        this.setSID(data["SID"]);
                        resolve(data);
                    } else {
                        ErrorHandler.handleServerStatusCodeError(data);
                        reject(data);
                    }
                    resolve(data);
                },
                error: (response) => {
                    let data = JSON.parse(response);
                    ErrorHandler.handleAjaxError(data);
                    reject(data);
                }
            });
        });
    },

    /**
     * will verify a given session id with the server
     * TODO: finish this
     */
    verifySessionId: function (SID, cb) {
        $.post(sw_urls.login, { SID: SID },
            cb(data, textStatus, jqXHR),
            "application/json"
        );
    },

    /**
     * will take a given JSON response and check if there is an error or not
     * 
     * @param {JSON} response 
     */
    validateServerStatusCode(response) {
        if(response.status < 0) {
            return false;
        } else {
            return true;
        }
    },

    hasSession: function () {
        if (this.getSID() === null || this.getSID() === undefined || this.getSID() === "undefined") {
            return false;
        } else {
            return true;
        }
    },

    setSID: function (SID) {
        localStorage.setItem("SID", SID);
        console.log("New SID has been set: " + SID);
    },

    getSID() {
        return localStorage.getItem("SID");
    }
};

/**
 * this object deals with authenticating our users with the server. Any login or attempt to say "I'm this user" must go through this
 */
class Authentication {

    /**
     * 
     * Will send the given JSON credentials to the server in attempt to login
     * 
     * NOTE: all ajax request errors will be dealt with by this file. 
     * When you fullfill or reject the promise, its either a yes or no. 
     * 
     * @param {JSON} credentials 
     */
    static login(email, password) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: "POST",
                url: Constant.URL.login,
                timeout: Constant.AJAX_CFG.timeout,
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
                        if(DO_LOG) {
                            console.log(`${response}`);
                        }
                        reject(data);
                    }

                    if(this.validateServerStatusCode(data)) {
                        this.setSID(data["SID"]);
                        localStorage.setItem("email", email);
                        resolve(data);
                    } else {
                        // ErrorHandler.handleServerStatusCodeError(data);
                        reject(data);
                    }
                },
                error: (response, status) => {
                    if(DO_LOG) {
                        console.log("login ajax error");
                    }
                    //let data = JSON.parse(response);
                    // ErrorHandler.handleAjaxError(response);
                    reject(response);
                }
            });
        });
    }

    /**
     * destroys the user's SID and sends them back to the welcome screen
     */
    static logout() {
        if(DO_LOG) {
            console.log("[authentication.js:logout()] DEPRECATED lougout method");
        }
        localStorage.removeItem("SID");
        StateManager.setState("welcome");
    }

    static validateSID(SID) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: "POST",
                url: Constant.URL.login,
                timeout: Constant.AJAX_CFG.timeout,
                data: {
                    SID : SID
                },
                success: (response) => {
                    let data = JSON.parse(response);

                    if(this.validateServerStatusCode(data)) {
                        localStorage.setItem("email", data.email);
                        resolve(data);
                    } else {
                        // ErrorHandler.handleServerStatusCodeError(data);
                        reject(data);
                    }
                },
                error: (response) => {
                    // TODO: redo this to handle no internet connection
                    // $("#app").html(`<p>Invalid SID or Connection Error</p>`);
                    if(DO_LOG) {
                        console.log(response);
                    }
                    // let data = JSON.parse(response);
                    // ErrorHandler.handleAjaxError(response);
                    reject(response);
                }
            });
        });        
    }

    /**
     * Send an ajax post request to the sportwatch servers to sign the user up
     * 
     * @param {String} fname The user's first name
     * @param {String} lname The user's last name
     * @param {String} gender 
     * @param {String} email The user's email
     * @param {String} password The user's password
     */
    static signup(fname, lname, gender, email, password) {
        if(DO_LOG) {
            console.log("[authentication.js:signup()] Signing up user...");
        }
        return new Promise((resolve, reject) => {
            $.ajax({
                type: "POST",
                url: Constant.URL.signup,
                timeout: Constant.AJAX_CFG.timeout,
                data: {
                    fname: fname,
                    lname: lname,
                    gender: gender,
                    email: email,
                    password: password
                },
                success: (response) => {
                    if(DO_LOG) {
                        console.log(response);
                    }
                    // Remove the hyphen prepnded by the current email handler (not sure why)
                    if(response.charAt(0) == "–") {
                        response = response.substring(1, response.length);
                    }
                    
                    let data = JSON.parse(response);
                    
                    if(this.validateServerStatusCode(data)) {
                        this.setSID(data["SID"]);
                        localStorage.setItem("email", email);
                        resolve(data);
                    } else {
                        // ErrorHandler.handleServerStatusCodeError(data);
                        reject(data);
                    }
                },
                error: (response) => {
                    if(DO_LOG) {
                        console.log("[authentication.js:signup(): ERROR");
                        console.log(response);
                    }
                    let data = JSON.parse(response);
                    // ErrorHandler.handleAjaxError(data);
                    reject(data);
                }
            });
        });
    }

    /**
     * will verify a given session id with the server
     * TODO: finish this
     */
    static verifySessionId(SID, cb) {
        $.post(sw_urls.login, { SID: SID },
            cb(data, textStatus, jqXHR),
            "application/json"
        );
    }

    /**
     * will take a given JSON response and check if there is an error or not
     * 
     * @param {JSON} response 
     */
    static validateServerStatusCode(response) {
        if(response.status < 0) {
            return false;
        } else {
            return true;
        }
    }

    static hasSession() {
        if (this.getSID() == undefined || this.getSID() == "undefined") {
            return false;
        } else {
            return true;
        }
    }

    static setSID(SID) {
        localStorage.setItem("SID", SID);
        if(DO_LOG) {
            console.log("New SID has been set: " + SID);
        }
    }

    static getSID() {
        return localStorage.getItem("SID");
    }
}


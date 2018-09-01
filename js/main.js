var app = {

    isReady : false,

    init : function (params) {
        // bind sets the value of 'this' inside the function to this object
        document.addEventListener('deviceready', this.onReady.bind(this), false);
        document.addEventListener('pause', this.onPause.bind(this), false);
        document.addEventListener('resume', this.onResume.bind(this), false);


    },

    // when cordova has been fully loaded
    onReady() { 
        console.log("Device is ready");

        // if has not been initialized yet to prevent double loading
        if(!this.isReady) {

            // check if there's a session
            if(Authentication.hasSession()) {
                Authentication.validateSID(Authentication.getSID()).then(function(response) {
                    console.log("Login complete");
                    StateManager.setState("home");
                }).catch(function(error) {
                    // they have most likely have an invalid SID, so just wipe it and log them back in
                    console.log("invalid sid: " + Authentication.getSID());
                    localStorage.removeItem("SID");
                    StateManager.setState("login");
                });
            } else {
                StateManager.setState("welcome");
            }

            // TODO check if sqlite is installed/working
        }

        this.isReady = true;
    },


    /**
     * check to make sure a few js things are avaliable
     */
    checkRequirements() {
        let results = {};

        if(typeof Storage === undefined) {
            results["storage"] = false;
        }

        return results;
    },



    onPause() {
        console.log("Device is paused");
    },

    onResume() {
        console.log("Device is resumed");
    }
};

// this is the main entry point for the app
app.init();
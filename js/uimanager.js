/**
 * this file will be for dynamic page updates for our single page app
 * 
 * this will not handle ALL of our ui updates, just the large ones
 * which dictate the state as well as the layout of the page.
 * 
 */
var UIManager = {

    isNavigationMenuReady : false,

    /**
     * Switches ui layout to the welcome screen
     * will take a callback function that will return the 
     * state that has been selected on the navigation menu
     * 
     * @returns Promise
     * 
     * @param {Function} cb 
     */
    switchToHome(cb) {
        return new Promise((resolve, reject) => {
            $("#app").html("<p>Sportwatch Home page</p>");

            $("header").html(`
                <span id="navigation_menu_open">&#9776;</span>
                <p>Sportwatch</p>
            `);

            CSSManager.unstyleHeader();
            CSSManager.styleHomeHeader();

            // return the selected page from the navigation menu as a string. pass it back to stateManager
            this.setupNavigationMenu(function(selection) {
                cb(selection);
            });

            resolve();
        });        
    },

    /**
     * Will switch to the welcome page
     * The callback function will be passed through a string of either 'login' or 'signup'
     * This is dependant on which button they click
     * 
     * @param {function} cb 
     */
    switchToWelcome() {
        return new Promise((resolve, reject) => {
            this.clearAppBody();

            $("#app").load(sw_config.ui_dir + "welcome.html", () => {

                $("header > span").remove();
                CSSManager.styleWelcomeHeader();

                $("#signup").click((e) => { 
                    e.preventDefault();
                    resolve("signup");
                });
    
                $("#login").click((e) => { 
                    e.preventDefault();
                    resolve("login");
                });
            });
        });
    },

    /**
     * @param {function} Callback
     */
    switchToLogin : function() {
        return new Promise((resolve, reject) => {
            this.clearAppBody();

            // back arrow
            $("header").prepend(`
                <span>&#8592</span>
            `);

            $("header > span").click(function (e) { 
                e.preventDefault();
                resolve("welcome");
            });

            $("#app").load(sw_config.ui_dir + "login.html", () => {

                // this is just for testing
                $("input[name=email]").val("bromansalaam@gmail.com");
                $("input[name=password]").val("testing12345");

                $("form").on("submit", function (e) {
                    e.preventDefault();
        
                    var email = $("input[name=email]").val();
                    var password = $("input[name=password]").val();
        
                    Authentication.login(email, password).then((response) => {
                        resolve("home");
                    }).catch((response) => {
                        reject(response);
                    });
                });
            });
        });
    },

    switchToSignup() {
        return new Promise((resolve, reject) => {
            this.clearAppBody();
    
            $("#app").load(sw_config.ui_dir + "signup.html", function() {

                // back arrow
                $("header").prepend(`
                    <span>&#8592</span>
                `);

                $("header > span").click(function (e) { 
                    e.preventDefault();
                    resolve("welcome");
                });

                
                $("form").on("submit", function (e) {
                    e.preventDefault();
        
                    var email = $("input[type=email]").val();
                    var password = $("input[type=password]").val();
                    var account_type = $("input[name=account_type]:checked").val();
                    
                    Authentication.signup(email, password, account_type).then((response) => {
                        localStorage.setItem("email", email);
                        localStorage.setItem("account_type", account_type);
                        resolve("postsignup");
                    }).catch(function(error) {
                        reject(response);
                    });
                });  
            });
        });
    },

    switchToTimer() {

    },

    switchToTeam() {
        this.clearAppBody();
        $("#app").html("<p>Welcome to the team page</p>");
    },

    switchToStats() {
        this.clearAppBody();
        $("#app").html("<p>Welcome to the stats page</p>");
    },

    switchToAthletes() {
        this.clearAppBody();

        
    },

    switchToMeets() {
        this.clearAppBody();
        $("#app").html("<p>Welcome to the meets page</p>");
    },

    switchToProgress() {
        this.clearAppBody();
        $("#app").html("<p>Welcome to the progress page</p>");
    },

    switchToAccount() {
        return new Promise((resolve, reject) => {
            this.clearAppBody();
            $("#app").html(`
                <h1>Welcome to the account page</h1>
                <button id="sign_out">Sign Out</button>
            `);
    
            $("#sign_out").click((e) => { 
                e.preventDefault();
                localStorage.removeItem("SID");
                this.removeNavigationMenu();
                console.log("user signing out");
                resolve("welcome");
            });
        });
    },

    switchToPostSignup() {
        return new Promise((resolve, reject) => {
            $("#app").load(sw_config + "firstwelcome.html", () => {
                $("button").click(function (e) { 
                    e.preventDefault();
                    resolve(e);
                });
            });
        });
    },

    /**
     * removes menu and resets isready back to false
     */
    removeNavigationMenu() {
        $("#navigation_menu").empty();
        $("header > span").remove();
    },

    closeNavigationMenu() {
        document.getElementById("navigation_menu").style.width = "0";
    },


    clearAppBody : function() {
        $("#app").empty();
    },
};

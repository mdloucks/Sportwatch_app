
class Login extends Page {

    /**
     * Page where users can log in and receive an SID
     * 
     * @param {Integer} id - number for this page
     * @param {PageSet} pageSetObj - PageSet object for transitions, etc.
     */
    constructor(id, pageSetObj) {
        super(id, "Login");

        this.pageController = pageSetObj;

        // Misc variables
        this.dialogInterval = 0;
    }

    getHtml() {
        return (`
            <div id="loginPage" class="div_page">
                <br>
                <h1>Login</h1>
                <form>
                    <label id="label_email" for="email">Email</label><br>
                    <input class="sw_text_input" type="email" name="email" placeholder="you@example.com">
                    <br>
                    <label id="label_password" for="password">Password</label><br>
                    <input class="sw_text_input" type="password" name="password" placeholder="●●●●●●●●">
                    <br>
                    
                    <input id="login_button" class="sw_big_button invalid" type="submit" value="Log In">
                </form>
                <br>
                <span id="label_forgotPassword">Forgot Password? Tap Here</span>
                <div id="passResetWrapper" style="width: 0; height: 0; opacity: 0;">
                    <label id="label_email" for="email">Enter Your Email</label><br>
                    <input id="reset_input" class="sw_text_input" type="email" name="resetEmail" placeholder="you@example.com">
                    <br>
                    
                    <button id="resetPass_button" class="sw_big_button invalid">Reset Password</button>
                </div>
                
                <button id="returnWelcome" class="backButton">Back</button>
                <br><br>
                
                <!-- Invalid dialog here (hidden by default) -->
                <div class="invalidDialog" style="display: none;">
                    <p id="d_message"></p>
                </div>
            </div>
        `);
    }

    start() {

        // Back Button
        this.getPageElement("#returnWelcome").click((e) => {
            e.preventDefault();
            this.pageController.switchPage("Welcome");
        });

        // When clicking on input, focus it
        this.getPageElement("input").click((e) => {
            $(e.target).focus();
        })

        // Input Handling
        this.getPageElement("form input").on("input", (e) => {

            // Check to make sure the fields are filled in
            this.getPageElement("#login_button").removeClass("invalid");

            // Loop through inputs to check length
            this.getPageElement("form input").each((index) => {
                let inputEl = this.getPageElement("form input").get(index); // Returns JS object, use $(...)
                if (($(inputEl).val().length < 3) && (!this.getPageElement("#login_button").hasClass("invalid"))) {
                    this.getPageElement("#login_button").addClass("invalid");
                }
            });
        });
        // Input - Forgot email
        this.getPageElement("#reset_input").on("input", (e) => {
            let resetEmail = this.getPageElement("#reset_input").val();
            let testMatch = resetEmail.match(/[A-Za-z0-9\-_.]*@[A-Za-z0-9\-_.]*\.(com|net|org|us|website|io)/gm);
            
            // Enable / Disable the button
            if ((testMatch == null) || (testMatch[0].length != resetEmail.length) || (resetEmail.length > 250)) {
                if(!this.getPageElement("#resetPass_button").hasClass("invalid")) {
                    this.getPageElement("#resetPass_button").addClass("invalid");
                }
            } else {
                this.getPageElement("#resetPass_button").removeClass("invalid");
            }
        });
        this.getPageElement("#reset_input").on("keyup", (e) => {
            let keyCode = e.keyCode || e.charCode;
            if (keyCode == 13) { // Enter
                document.activeElement.blur();
                this.getPageElement("#resetPass_button").trigger("click");
            }
        });

        // Animate the button to simulate a "press"
        this.getPageElement("#login_button").click((e) => {
            this.getPageElement("#login_button").addClass("pressed");
        });
        this.getPageElement("#login_button").click((e) => {
            this.getPageElement("#login_button").removeClass("pressed");
        });
        
        this.getPageElement("form").on("submit", function (e) {
            e.preventDefault();

            if (this.getPageElement("#login_button").hasClass("invalid")) {
                return; // Exit the handler, not valid
            }

            let email = this.getPageElement("input[name=email]").val();
            let password = this.getPageElement("input[name=password]").val();

            Authentication.login(email, password).then(function (response) {
                localStorage.setItem("email", email); // Set the email
                // Then pull data to update the frontend
                ToolboxBackend.pullFromBackend().then(() => {
                    console.log("[login.js]: Backend sync finished!");
                    
                    this.pageController.transitionObj.forceHaltSlide(); // See settings.js for explanation
                    this.pageController.onChangePageSet(1); // 1 for Main logic
                    
                    // And finally, clear the inputs
                    this.getPageElement("input").not("#login_button").val("");
                    this.getPageElement("#login_button").addClass("invalid");
                    
                }).catch(function() {
                    console.log("[login.js]: Failed to pull from backend, localStorage email: " + localStorage.getItem("email"));
                });
            }.bind(this),
                function (error) {
                    console.log("[login.js:start()] Login fail");
                    console.log(error);
                    this.handleLoginError(error.substatus, error.msg);
                }.bind(this));
        }.bind(this)); // Binding this is CRITICAL for changing state, etc.
        
        // Reset password start
        this.getPageElement("#label_forgotPassword").click((e) => {
            this.getPageElement("#passResetWrapper").css("width", "");
            this.getPageElement("#passResetWrapper").animate({
                height: 200
            }, 500, "swing", () => {
                this.getPageElement("#passResetWrapper").fadeTo(250, 1);
            });
        });
        
        // Reset password submission
        this.getPageElement("#resetPass_button").click((e) => {
            if(this.getPageElement("#resetPass_button").hasClass("invalid")) {
                return; // Don't do anything if the email isn't valid
            }
            
            let email = this.getPageElement("#reset_input").val();
            email = email.replace(/[^A-Za-z0-9\-_.@]/gm, "");
            AccountBackend.requestPasswordReset(email, (response) => {
                if(response.status > 0) {
                    Popup.createConfirmationPopup("An email has been sent to you with a password reset link. It will expire in thirty minutes", ["OK"]);
                } else {
                    if(response.substatus == 9) {
                        Popup.createConfirmationPopup("We couldn't find an account with that email. Try re-entering it or Sign Up for an account", ["OK"]);
                    } else {
                        Popup.createConfirmationPopup("Sorry, an error occured on our end. Please contact support or try later", ["OK"]);
                    }
                }
            });
        }); // End of reset button logic
        
    };

    stop() {
        this.getPageElement("#passResetWrapper").finish(); // Stop any animations
        this.getPageElement("#passResetWrapper").css("width", "0").css("height", "0").css("opacity", "0");
        $("#loginPage").unbind().off();
        $("#loginPage *").unbind().off();
    }

    // ---- CUSTOM FUNCTIONS ---- //

    /**
     * Opens a warning dialog when an input is invalid
     * 
     * @example openInvalidMessage("No spaces allowed in password", "#i_password");
     *          --> Displays above password input field
     * 
     * @param {String} message - what the dialog will say
     * @param {String} anchorElement - [default = null] id of the anchor element (should be the invalidSymbol)
     *                                  if left null, it will center the dialog
     */
    openMessageDialog(message, anchorElement = null) {

        let dialog = this.getPageElement(".invalidDialog");
        // This prevents showing the dialog if it's not ready / transitioning
        if ((dialog.css("opacity") != "0") && (dialog.css("opacity") != "1")) {
            return;
        }

        // Set dialog properties
        this.getPageElement(".invalidDialog > #d_message").html(message);
        dialog.css("width", "60%"); // Make sure it's before grabbing width

        // Set position
        let x = ($(window).width() / 2) - (dialog.width() / 2);
        let y = $(window).height() / 2;
        // If set, use the anchor element's position
        if (anchorElement != null) {

            // Convert to jQuery object if it's a selector
            if (typeof anchorElement == "string") {
                anchorElement = this.getPageElement(anchorElement);
            }

            // Subtract 15 to add some padding around popup
            x = this.getPageElement(anchorElement).position().left - dialog.width();
            y = this.getPageElement(anchorElement).position().top - dialog.height() - 15;
        }
        dialog.css("left", x + "px");
        dialog.css("top", y + "px");
        dialog.fadeIn(1000);

        // Prevents previous timeouts from closing the new dialog
        if (this.dialogInterval != 0) {
            clearInterval(this.dialogInterval);
        }

        // And disappear in a few seconds
        this.dialogInterval = setTimeout(() => {
            dialog.fadeOut(1000, () => {
                dialog.css("width", "0");
            });
        }, 5000);
    }

    /**
     * Handles and displays error message for signing up. It will default
     * to opening a dialog with a vague error message.
     * 
     * @example handleSignupError(response.substatus, $response.msg);
     * 
     * @param {Integer} substatus - number representing the error for signing up
     * @param {String} msg - [default = ""] the response message from the server
     */
    handleLoginError(substatus, msg) {

        switch (substatus) {
            case 1:
                this.openMessageDialog("Invalid credentials, please try again");
                this.getPageElement("#button_signup").addClass("invalid");
                break;
            default:
                if ((msg == undefined) || (msg.length > 0)) {
                    msg = "(" + msg + ")";
                }
                this.openMessageDialog("An unknown error occured, please try again later " + msg);
                this.getPageElement("#button_signup").addClass("invalid");
                break;
        }
    }

    /**
     * Used to get only the elements contained within this page by prepending
     * #loginPage to every selector
     * 
     * @param {String} selector jQuery selection criteria
     */
    getPageElement(selector) {
        return $("#loginPage " + selector);
    }

}
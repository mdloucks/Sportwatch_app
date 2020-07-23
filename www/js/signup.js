

class Signup extends Page {

    /**
     * Allows the user to signup. It needs the PageSet object copy
     * so it can move and manipulate pages as buttons are pressed
     * 
     * @param {Integer} id - page id
     * @param {PageSet} pageSetObj - copy of controlling PageSet object
     */
    constructor(id, pageSetObj) {
        super(id, "Signup");

        this.pageController = pageSetObj;

        // Misc variables
        this.dialogInterval = 0;
    }

    getHtml() {
        return (`
            <div id="signupPage" class="div_page">
                <br>
                <h1>Sportwatch</h1>
                <form>
                    <label id="label_name" for="fname">First Name</label><br>
                    <input class="sw_text_input i_name" type="text" name="fname" placeholder="Jim">
                    <img id="i_fname" class="invalidSym" src="img/invalidSymbol.png">
                    <br>
                    <label id="label_email" for="email">Email</label><br>
                    <input class="sw_text_input" type="email" name="email" placeholder="you@website.com">
                    <img id="i_email" class="invalidSym" src="img/invalidSymbol.png">
                    <br>
                    <label id="label_password" for="password">Password</label><br>
                    <input class="sw_text_input" type="password" name="password" placeholder="●●●●●●●●">
                    <img id="i_password" class="invalidSym" src="img/invalidSymbol.png">
                    <br><br><br>
                    
                    <input id="button_signup" class="sw_big_button invalid" type="submit" value="Sign Up">
                </form>
                <br>
                <p>
                    By clicking Sign Up, you agree to our <a href="https://sportwatch.us/privacy-policy/">
                    Privacy Policy</a>.
                </p>
                <br>
                <button id="returnWelcome" class="backButton">Back</button>
                
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

        // INPUT HANDLING
        // Name
        this.getPageElement("input[name=fname").on("input", () => {
            let input = this.getPageElement("input[name=fname]").val();

            if (input.replace(/[A-Za-z.]/gm, "") != "") {
                this.setupInvalidSymbol("#i_fname", false, "Please only use letters in your name.");
            } else if (input.length > 127) {
                this.setupInvalidSymbol("#i_fname", false, "Name is too long");
            } else if (input.length < 3) {
                this.setupInvalidSymbol("#i_fname", false, "Please enter your full first name");
            } else {
                this.setupInvalidSymbol("#i_fname", true, "Nice to meet you!");
            }
        });
        // Add starting dialog when clicked (if empty)
        this.getPageElement("#i_fname.invalidSym").click((e) => {
            this.openInvalidMessage("Please enter your name", "#i_fname");
        });

        // Email
        this.getPageElement("input[name=email]").on("input", () => {
            let input = this.getPageElement("input[name=email]").val();

            let testMatch = input.match(/[A-Za-z0-9\-_.]*@[A-Za-z0-9\-_.]*\.(com|net|org|us|website|io)/gm);
            if (testMatch == null) {
                this.setupInvalidSymbol("#i_email", false, "Please enter a valid email");
            } else if (testMatch[0].length != input.length) {
                this.setupInvalidSymbol("#i_email", false,
                    "Email can only contain: A-Z, a-z, 0-9, hyphens, underscores, periods, and the @ symbol");
            } else if (input.length > 250) {
                this.setupInvalidSymbol("#i_email", false, "Email is too long");
            } else {
                this.setupInvalidSymbol("#i_email", true, "Looks good!");
            }
        });
        this.getPageElement("#i_email.invalidSym").click((e) => {
            this.openInvalidMessage("Please enter your email", "#i_email");
        });

        // Password
        this.getPageElement("input[name=password]").on("input", () => {
            let input = this.getPageElement("input[name=password]").val();

            if ((input.match(/[`"';<>{} ]/gm) != null) || (input.length < 10) || (input.length > 250)) {
                this.setupInvalidSymbol("#i_password", false,
                    "Password must be at least 10 characters long and cannot contain spaces or: \";\'<>{}");
            } else if ((input.match(/[A-Z]/gm) == null) || (input.match(/[0-9]/gm) == null)) {
                this.setupInvalidSymbol("#i_password", false, "Please strengthen your password (must include uppercase, and numbers)");
            } else {
                this.setupInvalidSymbol("#i_password", true, "Great choice!");
            }
        });
        this.getPageElement("#i_password.invalidSym").click((e) => {
            this.openInvalidMessage("Please create a <b>unique</b> password", "#i_password");
        });

        // REST OF FORM
        // Animate the button to simulate a "press"
        this.getPageElement("#button_signup").click((e) => {
            this.getPageElement("#button_signup").addClass("pressed");
        });
        this.getPageElement("#button_signup").click((e) => {
            this.getPageElement("#button_signup").removeClass("pressed");
        });

        this.getPageElement("form").on("submit", function (e) {
            e.preventDefault();

            if (this.getPageElement("#button_signup").hasClass("invalid")) {
                return; // Exit the handler, not valid
            }

            // Validate inputs (one last safety check)
            let firstName = this.getPageElement("input[name=fname]").val();
            let email = this.getPageElement("input[name=email]").val();
            let password = this.getPageElement("input[name=password]").val();

            if (firstName.length < 3) {
                this.setupInvalidSymbol("#i_fname", false, "Please enter your full first name");
                return;
            }
            if (email.indexOf("@") == -1) {
                this.setupInvalidSymbol("#i_email", false, "Please enter a valid email");
                return;
            }
            if (password.length < 10) {
                this.setupInvalidSymbol("#i_password", false, "Password must be at least 10 characters");
                return;
            }

            Authentication.signup(firstName, email, password).then(function (response) {
                localStorage.setItem("email", email);
                this.pageController.transitionObj.forceHaltSlide();
                this.pageController.onChangePageSet(1); // 1 for Main logic
            }.bind(this),
                function (error) {
                    console.log("[signup.js:start()] Unable to complete signup request");
                    this.handleSignupError(error.substatus, error.msg);
                }.bind(this));

        }.bind(this)); // Binding this is CRITICAL for changing state, etc.

    }

    stop() {
        $("#signupPage").unbind().off();
        $("#signupPage *").unbind().off();
    }

    // ---- CUSTOM FUNCTIONS ---- //

    /**
     * Defines the symbol behavior for an input.
     * 
     * @example setupInvalidSymbol("#i_email", false, "No spaces allowed");
     *      --> Displays that message above email input
     * 
     * @param {String} symbolId - ID of the symbol element (ex. #i_email)
     * @param {Boolean} isValid - is the given input valid?
     * @param {String} errMessage - message to display if invalid
     */
    setupInvalidSymbol(symbolId, isValid, errMessage) {

        // Prevents double binding
        this.getPageElement(symbolId + ".invalidSym").unbind().off();
        if (isValid) {
            this.getPageElement(symbolId + ".invalidSym").prop("src", "img/validSymbol.png");
            clearInterval(this.dialogInterval);
            this.getPageElement(".invalidDialog").fadeOut(1000, () => {
                this.getPageElement(".invalidDialog").css("width", "0"); // Will block clicks otherwise
            })

        } else {
            this.getPageElement(symbolId + ".invalidSym").prop("src", "img/invalidSymbol.png");
            // Show dialog and set up click event
            this.openInvalidMessage(errMessage, symbolId);
            this.getPageElement(symbolId + ".invalidSym").click((e) => {
                this.openInvalidMessage(errMessage, e.target);
            });
        }

        // Update submit button class / click ability
        this.getPageElement("#button_signup").removeClass("invalid"); // Remove here to prevent adding multiple invalid classes
        this.getPageElement(".invalidSym").each((index) => {
            let symbol = this.getPageElement(".invalidSym").get(index); // Returns JS object, use $(...)
            if (($(symbol).prop("src").includes("invalid")) && (!this.getPageElement("#button_signup").hasClass("invalid"))) {
                this.getPageElement("#button_signup").addClass("invalid");
            }
        });
    }

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
    openInvalidMessage(message, anchorElement = null) {

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
            x = $(anchorElement).position().left - dialog.width();
            y = $(anchorElement).position().top - dialog.height() - 15;
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
     * @example handleSignupError(response.substatus, response.msg);
     * 
     * @param {Integer} substatus - number representing the error for signing up
     * @param {String} msg - [default = ""] the response message from the server
     */
    handleSignupError(substatus, msg) {

        switch (substatus) {
            case 2:
                this.openInvalidMessage("The email format was invalid, please re-enter it and try again");
                this.setupInvalidSymbol("#i_email", false, "Please enter a valid email");
                break;
            case 3:
                this.openInvalidMessage("The entered email doesn't exist, please try again");
                this.setupInvalidSymbol("#i_email", false, "Please enter a valid email");
                break;
            case 4:
                this.openInvalidMessage("An account with that email already exists. Please login or reset your password");
                this.setupInvalidSymbol("#i_email", false, "Please log in or enter a different email");
                break;
            case 5:
                this.openInvalidMessage("The entered password was too weak, please add complexity");
                this.setupInvalidSymbol("#i_password", false, "Please enter a strong password");
                break;
            default:
                if ((msg == undefined) || (msg.length > 0)) {
                    msg = "(" + msg + ")";
                }
                this.openInvalidMessage("An unknown error occured, please try again later " + msg);
                this.getPageElement("#button_signup");
                break;
        }
    }

    /**
     * Used to get only the elements contained within this page by prepending
     * #signupPage to every selector
     * 
     * @param {String} selector jQuery selection criteria
     */
    getPageElement(selector) {
        return $("#signupPage " + selector);
    }

}
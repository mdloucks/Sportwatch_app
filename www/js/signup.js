

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
                <h1>Signup</h1>
                <form>
                    <label id="label_name" for="fname">Name</label><br>
                    <input class="sw_text_input nameInput" type="text" name="fname" placeholder="First">
                    <input class="sw_text_input nameInput" type="text" name="lname" placeholder="Last">
                    <img id="i_name" class="invalidSym" src="img/invalidSymbol.png">
                    <br>
                    <label id="label_email" for="email">Email</label><br>
                    <input class="sw_text_input" type="email" name="email" placeholder="you@website.com">
                    <img id="i_email" class="invalidSym" src="img/invalidSymbol.png">
                    <br>
                    <label id="label_password" for="password">Password</label><br>
                    <input class="sw_text_input" type="password" name="password" placeholder="●●●●●●●●">
                    <img id="i_password" class="invalidSym" src="img/invalidSymbol.png">
                    <br>
                    <label id="label_gender" for="gender">Gender</label><br>
                    <select class="dropdown_input" name="gender" style="padding-left: 6vw">
                        <option value="NA">-- Tap to Select --</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                    </select>
                    <img id="i_gender" class="invalidSym" src="img/invalidSymbol.png">
                    <br><br>
                    
                    <input id="button_signup" class="sw_big_button invalid" type="submit" value="Sign Up">
                </form>
                <p id="privacyPolicy">
                    By clicking Sign Up, you agree to our <a href="https://sportwatch.us/privacy-policy/">
                    Privacy Policy</a>.
                </p>
                <br>
                <button id="returnWelcome" class="backButton">Back</button>
                
                <!-- Invalid dialog here (hidden by default) -->
                <div class="invalidDialog" style=" width: 0; opacity: 0">
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
        this.getPageElement("input[name=fname], input[name=lname]").on("input", () => {
            let firstName = this.getPageElement("input[name=fname]").val();
            let lastName = this.getPageElement("input[name=lname]").val();
            let input = firstName + lastName;

            if (input.replace(/[A-Za-z.\-]/gm, "") != "") {
                this.setupInvalidSymbol("#i_name", false, "Please only use letters in your name.");
            } else if (input.length > 127) {
                this.setupInvalidSymbol("#i_name", false, "Name is too long");
            } else if(firstName.length < 3) {
                this.setupInvalidSymbol("#i_name", false, "Please enter your full first name");
            } else if (lastName.length < 3) {
                this.setupInvalidSymbol("#i_name", false, "Please enter your full last name");
            } else {
                this.setupInvalidSymbol("#i_name", true, "Nice to meet you!");
            }
        });
        // Add starting dialog when clicked (if empty)
        this.getPageElement("#i_name.invalidSym").click((e) => {
            this.openInvalidMessage("Please enter your name", "#i_name");
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
        
        // Gender
        this.getPageElement("select[name=gender]").on("change", () => {
            let input = this.getPageElement("select[name=gender]").val();
            
            // Center the input text
            if(input == "M") {
                this.getPageElement("select[name=gender").css("padding-left", "20vw");
            } else if(input == "F") {
                this.getPageElement("select[name=gender").css("padding-left", "17vw");
            } else if(input == "O") {
                this.getPageElement("select[name=gender").css("padding-left", "19vw");
            } else {
                // Handles the "-- Tap to Select --" option
                this.getPageElement("select[name=gender").css("padding-left", "6vw");
            }
            
            // Check validity
            if(input.length == 1) {
                this.setupInvalidSymbol("#i_gender", true, "Saved!");
            } else {
                this.setupInvalidSymbol("#i_gender", false, "Plese select a gender!");
            }
        });
        // Add starting dialog when clicked (if empty)
        this.getPageElement("#i_gender.invalidSym").click((e) => {
            this.openInvalidMessage("Please select a gender", "#i_gender");
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
            this.getPageElement("#button_signup").addClass("invalid"); // Prevent double clicks

            // Validate inputs (one last safety check)
            let firstName = this.getPageElement("input[name=fname]").val();
            let lastName = this.getPageElement("input[name=lname]").val();
            let gender = this.getPageElement("select[name=gender]").val();
            let email = this.getPageElement("input[name=email]").val();
            let password = this.getPageElement("input[name=password]").val();

            if (firstName.length < 3) {
                this.setupInvalidSymbol("#i_name", false, "Please enter your full first name");
                return;
            }
            if (lastName.length < 3) {
                this.setupInvalidSymbol("#i_name", false, "Please enter your full last name");
                return;
            }
            if(gender.length > 1) { // length of 1 signifies "M", "F", "O"
                this.setupInvalidSymbol("#i_gender", true, "Saved!");
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

            Authentication.signup(firstName, lastName, gender, email, password).then(function (response) {
                localStorage.setItem("email", email);
                // Then pull data (probably not much, but just do it!)
                ToolboxBackend.pullFromBackend().then(() => {
                    if(DO_LOG) {
                        console.log("[signup.js]: Backend sync finished!");
                    }
                    
                    this.pageController.transitionObj.forceHaltSlide(); // See settings.js for explanation
                    this.pageController.onChangePageSet(1); // 1 for Main logic
                    
                    // And finally, clear the inputs
                    this.getPageElement("input").not("#button_signup").val("");
                    this.getPageElement("#button_signup").addClass("invalid");
                    
                }).catch(function() {
                    if(DO_LOG) {
                        console.log("[signup.js]: Failed to pull from backend, localStorage email: " + localStorage.getItem("email"));
                    }
                });
            }.bind(this),
                function (error) {
                    if(DO_LOG) {
                        console.log("[signup.js:start()] Unable to complete signup request");
                    }
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
            this.getPageElement(".invalidDialog").fadeTo(1000, 0, () => {
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
            // There is an iOS bug that halts the fadeIn operation very early
            // This if statement fixes it by ignoring a near-zero opacity (return if greater)
            // if(parseFloat(dialog.css("opacity")) > 0.001) {
            //     dialog.stop();
            //     return;
            // } else {
            //     dialog.css("opacity", "1");
            // }
            return;
        }
        
         // Prevents previous timeouts from closing the new dialog
        if (this.dialogInterval != 0) {
            clearInterval(this.dialogInterval);
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
        // Use animate method to ensure the dialog is 60% in width
        dialog.animate({
            opacity: 1
        }, {
            duration: 1000,
            start: function() {
                dialog.css("width", "60%");
            }
        });
        
        
        // And disappear in a few seconds
        this.dialogInterval = setTimeout(() => {
            dialog.fadeTo(1000, 0, () => {
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


class Signup extends Page {
    
    /**
     * Allows the user to signup. It needs the PageSet object copy
     * so it can move and manipulate pages as buttons are pressed
     * 
     * @param {Integer} id - page id
     * @param {PageTransition} pageSetObj - copy of controlling PageSet object
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
                    <label id="label_name" for="fname">Name</label><br>
                    <input class="sw_text_input i_name" type="text" name="fname" placeholder="Jim">
                    <img id="i_fname" class="invalidSym" src="img/invalidSymbol.png">
                    <br>
                    <label id="label_email" for="email">Email</label><br>
                    <input class="sw_text_input" type="email" name="email" placeholder="yourname@website.com">
                    <img id="i_email" class="invalidSym" src="img/invalidSymbol.png">
                    <br>
                    <label id="label_password" for="password">Password</label><br>
                    <input class="sw_text_input" type="password" name="password" placeholder="●●●●●●●●">
                    <img id="i_password" class="invalidSym" src="img/invalidSymbol.png">
                    <br>
                    
                    <p id="p_accountType">Select Role</p>
                    <button id="athlete" class="account_type_button selected" type="button">Athlete</button>
                    <button id="coach" class="account_type_button" type="button">Coach</button>
                    <br><br><br>
                    
                    <input id="button_signup" class="sw_big_button invalid" type="submit" value="Sign Up">
                </form>
                <br><br>
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
        $("#signupPage > #returnWelcome").bind("touchend", (e) => {
            e.preventDefault();
            this.pageController.switchPage("Welcome");
        });
        
        // When clicking on input, focus it
        $("input").bind("touchend", (e) => {
            $(e.target).focus();
        })
        
        // INPUT HANDLING
        // Name
        $("input[name=fname]").on("input", () => {
            let input = $("input[name=fname]").val();

            if (input.replace(/[A-Za-z.]/gm, "") != "") {
                this.setupInvalidSymbol("#i_fname", false, "Please only use letters in your name.");
            } else if(input.length > 127) {
                this.setupInvalidSymbol("#i_fname", false, "Name is too long");
            } else {
                this.setupInvalidSymbol("#i_fname", true, "Nice to meet you!");
            }
        });
        // Add starting dialog when clicked (if empty)
        $("#i_fname.invalidSym").bind("touchend", (e) => {
            this.openInvalidMessage("Please enter your name", "#i_fname");
        });
        // TODO: Make regex actually work, fix thin dialog showing (toggling quickly)
        // Email
        $("input[name=email]").on("input", () => {
            let input = $("input[name=email]").val();
            
            let testMatch = input.match(/[A-Za-z0-9\-_.]*@[A-Za-z0-9\-_.]*\.(com|net|org|us|website|io)/gm);
            if(testMatch == null) {
                this.setupInvalidSymbol("#i_email", false, 
                                        "Email can only contain: A-Z, a-z, 0-9, hyphens, underscores, periods, and the @ symbol");
            } else if(testMatch[0].length != input.length) {
                this.setupInvalidSymbol("#i_email", false,
                    "Email can only contain: A-Z, a-z, 0-9, hyphens, underscores, periods, and the @ symbol");
            }else if(input.length > 250) {
                this.setupInvalidSymbol("#i_email", false, "Email is too long");
            } else {
                this.setupInvalidSymbol("#i_email", true, "Looks good!");
            }
        });
        $("#i_email.invalidSym").bind("touchend", (e) => {
            this.openInvalidMessage("Please enter your email", "#i_email");
        });
        
        // Password
        $("input[name=password]").on("input", () => {
            let input = $("input[name=password]").val();

            if ((input.match(/[`"';<>{} ]/gm) != null) || (input.length < 8) || (input.length > 250)) {
                this.setupInvalidSymbol("#i_password", false, 
                                        "Password must be at least 8 characters long and cannot contain spaces or: \";\'<>{}");
            } else if((input.match(/[A-Z]/gm) == null) || (input.match(/[0-9]/gm) == null) || (input.match(/!@#$%&*/gm) == null)) {
                this.setupInvalidSymbol("#i_password", false, "Please strengthen your password (ex. add uppercase, numbers, or symbols)");
            } else {
                this.setupInvalidSymbol("#i_password", true, "Great choice!");
            }
        });
        $("#i_password.invalidSym").bind("touchend", (e) => {
            this.openInvalidMessage("Please create a <b>unique</b> password", "#i_password");
        });
        
        // REST OF FORM
        // "Radio button" logic for account types
        $(".account_type_button").bind("touchend", (e) => {
            // Remove .selected from both buttons
            $(".account_type_button").removeClass("selected");
            $(e.target).addClass("selected");
        });
        
        $("#signupPage > form").on("submit", function (e) {
            e.preventDefault();
            // Animate the button to simulate a "press"
            $("#signupPage").find("#button_signup").animate({
                backgroundColor: "crimson"
            }, 500, function() {
                $("#button_signup").css("background-color", "initial");
            });
            
            
            let email = $("input[type=email]").val();
            let password = $("input[type=password]").val();
            let account_type = $(".account_type_button[class*=selected]").text().toLowerCase();
            // TODO PASSWORD STRENGTH TEST IS WEIRD
            Authentication.signup(email, password, account_type).then((response) => {
                localStorage.setItem("email", email);
                localStorage.setItem("account_type", account_type);
                console.log(response);
                // TODO: Finish / implement post signup. Errors out right now
            }).catch(function (error) {
                console.log(error);
                console.log("[signup.js:start()] Unable to complete signup request");
            });
        });
        
    }
    
    stop() {
        $("#signupPage").unbind();
        $("#signupPage *").unbind();
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
        $(symbolId + ".invalidSym").unbind();
        if(isValid) {
            $(symbolId + ".invalidSym").prop("src", "img/validSymbol.png");
            clearInterval(this.dialogInterval);
            $(".invalidDialog").fadeOut(1000, () => {
                $(".invalidDialog").css("width", "0"); // Will block clicks otherwise
            })
            
        } else {
            $(symbolId + ".invalidSym").prop("src", "img/invalidSymbol.png");
            // Show dialog and set up click event
            this.openInvalidMessage(errMessage, symbolId);
            $(symbolId + ".invalidSym").bind("touchend", (e) => {
                this.openInvalidMessage(errMessage, e.target);
            });
        }
        
        // Update submit button class / click ability
        $("#button_signup").removeClass("invalid"); // Remove here to prevent adding multiple invalid classes
        $(".invalidSym").each((index) => {
            let symbol = $(".invalidSym").get(index); // Returns JS object, use $(...)
            if (($(symbol).prop("src").includes("invalid")) && (!$("#button_signup").hasClass("invalid"))) {
                $("#button_signup").addClass("invalid");
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
     * @param {String} anchorElement - id of the anchor element (should be the invalidSymbol)
     */
    openInvalidMessage(message, anchorElement) {
        
        let dialog = $(".invalidDialog");
        // This prevents showing the dialog if it's not ready / transitioning
        if((dialog.css("opacity") != "0") && (dialog.css("opacity") != "1")) {
            return;
        }
        
        // Get position of anchor element
        let x = $(anchorElement).position().left;
        let y = $(anchorElement).position().top;
        
        // Set dialog properties
        $(".invalidDialog > #d_message").html(message);
        dialog.css("width", "60%"); // Make sure it's before grabbing width
        dialog.css("left", (x - dialog.width()) + "px");
        dialog.css("top", (y - dialog.height() - 15) + "px");
        dialog.fadeIn(1000);
        
        // Prevents previous timeouts from closing the new dialog
        if(this.dialogInterval != 0) {
            clearInterval(this.dialogInterval);
        }
        
        // And disappear in a few seconds
        this.dialogInterval = setTimeout(() => {
            dialog.fadeOut(1000, () => {
                dialog.css("width", "0");
            });
        }, 5000);
    }
    
    
}
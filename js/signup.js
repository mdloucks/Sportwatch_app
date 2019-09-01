

function signupPage() {
    return new Promise((resolve, reject) => {
        
        CSSManager.resetStyling();
        CSSManager.addStylesheet("signup.css");
        
        $("#app").html(`
            <br><br>
            <h1>Sportwatch</h1>
            <br>
            <span class="back_arrow">&#8592</span>
            <p>Please enter your information below</p>
            <form>
                <label id="label_email" for="email">Email: &nbsp</label>
                <input class="sw_text_input" type="email" name="email">
                <br>
                <label id="label_password" for="password">Password: &nbsp;</label>
                <input class="sw_text_input" type="password" name="password">
                <br>
                
                <p id="p_accountType">I am a...</p>
                <button id="athlete" class="account_type_button selected" type="button">Athlete</button>
                <button id="coach" class="account_type_button" type="button">Coach</button>
                <br><br><br>
                <!-- <label for="coach">Coach</label>
                <input type="radio" name="account_type" value="coach">
                <label for="athlete">Athlete</label>
                <input type="radio" name="account_type" value="athlete"> -->
                
                <input id="button_signup" class="sw_big_button" type="submit" value="Sign Up">
            </form>
        `);
        // TODO: Add place for error message
        
        
        // Use set timeout to prevent page moving upon load (https://bit.ly/2Qf7PS9)
        setTimeout(function() {
            $(".account_type_button").css("transition", "border 1s");
        }, 100); // Not sure, but this can't be too low
        
        $(".back_arrow").click(function (e) {
            e.preventDefault();
            resolve("welcome");
        });
        
        // "Radio button" logic for account types
        $(".account_type_button").click((e) => {
            // Remove .selected from both buttons
            $(".account_type_button").removeClass("selected");
            $(e.target).addClass("selected");
        });
        
        $("form").on("submit", function (e) {
            e.preventDefault();

            var email = $("input[type=email]").val();
            var password = $("input[type=password]").val();
            var account_type = $(".account_type_button[class*=selected]").text().toLowerCase();
            // TODO PASSWORD STRENGTH TEST IS WEIRD
            Authentication.signup(email, password, account_type).then((response) => {
                localStorage.setItem("email", email);
                localStorage.setItem("account_type", account_type);
                resolve("postsignup");
                // TODO: Finish / implement post signup. Errors out right now
            }).catch(function (error) {
                reject(error);
            });
        });
    });
}
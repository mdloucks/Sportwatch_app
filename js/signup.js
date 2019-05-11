

function signupPage() {
    return new Promise((resolve, reject) => {

        $("#app").html(`
            <br><br>
            <h1>Sportwatch</h1>
            <br>
            <span class="back_arrow">&#8592</span>
            <p>Please enter your information below</p>
            <form>
                <div class="form_holder">
                    <label for="email">Email</label>
                    <input type="email" name="email">
                </div> <br>
                <div class="form_holder">
                    <label for="password">Password</label>
                    <input type="password" name="password">
                </div> <br>
                <p>I am a...</p>
                <button id="athlete" class="account_type_button" type="button">Athlete</button>
                <button id="coach" class="account_type_button" type="button">Coach</button>
                <!-- <label for="coach">Coach</label>
                <input type="radio" name="account_type" value="coach">
                <label for="athlete">Athlete</label>
                <input type="radio" name="account_type" value="athlete"> -->
                <input type="submit" value="Sign Up">
            </form>
        `);

        //CSSManager.styleLoginPage();
        CSSManager.resetStyling();
        CSSManager.addStylesheet("signup.css");
        
        $(".back_arrow").click(function (e) {
            e.preventDefault();
            resolve("welcome");
        });
        
        $("form").on("submit", function (e) {
            e.preventDefault();

            var email = $("input[type=email]").val();
            var password = $("input[type=password]").val();
            var account_type = $("input[name=account_type]:checked").val();
            // TODO PASSWORD STRENGTH TEST IS WEIRD
            Authentication.signup(email, password, account_type).then((response) => {
                localStorage.setItem("email", email);
                localStorage.setItem("account_type", account_type);
                resolve("postsignup");
            }).catch(function (error) {
                reject(error);
            });
        });
    });
}
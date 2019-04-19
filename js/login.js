

function loginPage() {
    return new Promise((resolve, reject) => {
        
        $("#app").html(`
            <br><br>
            <h1>Sportwatch</h1>
            <br>
            <span class="back_arrow">&#8592</span>
            <p>Enter your login information</p>
            <form>
                <!-- <label for="email">Email</label> -->
                <input class='text_input' type='email' name='email' placeholder='Email'><br>
                <!-- <label for="password">Password</label> -->
                <input class='text_input' type='password' name='password' placeholder='Password'><br>
                <input id='login_button' type='submit' value='Login'>
            </form>
        `);
        
        CSSManager.resetStyling();
        CSSManager.addStylesheet("login.css");
        // CSSManager.styleLoginPage();
        
        $(".back_arrow").click(function (e) {
            e.preventDefault();
            resolve("welcome");
        });
        
        // this is just for testing
        $("input[name=email]").val("bromansalaam@gmail.com");
        $("input[name=password]").val("testing123");

        $("form").on("submit", function (e) {
            e.preventDefault();

            let email = $("input[name=email]").val();
            let password = $("input[name=password]").val();

            Authentication.login(email, password).then((response) => {
                resolve("home");
            }).catch((response) => {
                reject(response);
            });
        });
    });

}
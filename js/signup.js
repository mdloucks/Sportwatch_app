

function signupPage() {
    return new Promise((resolve, reject) => {

        // back arrow
        $("header").prepend(`
            <span style="font-size: 2em;">&#8592</span>
        `);

        $("header > span").click(function (e) {
            e.preventDefault();
            resolve("welcome");
        });

        $("#app").html(`
            <form>
                <label for="email">Email</label>
                <input type='email' name='email'><br>
                <label for="password">Password</label>
                <input type='password' name='password'><br>
                <label for="coach">Coach</label>
                <input type="radio" name="account_type" value="coach">
                <label for="athlete">Athlete</label>
                <input type="radio" name="account_type" value="athlete">
                <input type='submit' value='Sign Up'>
            </form>
        `);

        CSSManager.styleLoginPage();


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
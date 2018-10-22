

function loginPage() {
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
                <input type='submit' value='Login'>
            </form>
        `);

        CSSManager.styleLoginPage();

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
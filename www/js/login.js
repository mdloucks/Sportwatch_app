

class Login extends Page {
    
    constructor(id, pageTransObj) {
        super(id, "Login");
        
        this.transitionObj = pageTransObj;
    }
    
    getHtml() {
        return (`
            <div id="loginPage" class="div_page">
                <br><br>
                <h1>Sportwatch</h1>
                <br>
                <span class="back_arrow">&#8592</span>
                <p>Enter your login information</p>
                <form>
                    <!-- <label for="email">Email</label> -->
                    <input class='sw_text_input' type='email' name='email' placeholder='Email'><br>
                    <!-- <label for="password">Password</label> -->
                    <input class='sw_text_input' type='password' name='password' placeholder='Password'><br>
                    <input id='login_button' class='sw_big_button' type='submit' value='Login'>
                </form>
            </div>
        `);
    }
    
    start() {
        
        $("#loginPage > .back_arrow").bind("touchend", (e) => {
            e.preventDefault();
            this.transitionObj.slideRight("welcomePage", 200);
        });
        
        // this is just for testing
        $("input[name=email]").val("bromansalaam@gmail.com");
        $("input[name=password]").val("testing123");
        
        $("form").on("submit", function (e) {
            e.preventDefault();

            let email = $("input[name=email]").val();
            let password = $("input[name=password]").val();

            Authentication.login(email, password).then((response) => {
                console.log("Success!");
                // TODO: Switch to main page set
            }).catch((response) => {
                console.log("Login fail");
                // TODO: Show error
            });
        });
    };
    
    stop() {
        
    }

}
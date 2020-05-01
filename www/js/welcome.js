function welcomePage() {

    this.selectState = function () {
        throw new Error("WELCOME SELECT STATE IS NOT SETUP");
    }

    this.onStateSelect = function(callback) {
        this.selectState = callback;
    }

    $("#app").html(`
        <br><br>
        <img src="img/logo-2.png" alt="Sportwatch Logo" style="width: 40%; height: 40%;">
        <br>
        <h1 style="font-size: 4em">Sportwatch</h1>
        <br><br>
        <div class="selection">
            <button id='signup' class='sw_big_button' type='button'>Sign Up</button>
            <button id='login' class='sw_big_button' type='button'>Login</button>
        </div>
    `); // TODO: Implement guest login

    $("header > span").remove();
    CSSManager.unstyleHeader();
    CSSManager.resetStyling();
    //CSSManager.styleWelcomePage(); Deprecated
    CSSManager.addStylesheet("welcome.css");

    $("#signup").click((e) => { 
        e.preventDefault();
        this.selectState("signup");
    });

    $("#login").click((e) => { 
        e.preventDefault();
        this.selectState("login");
    });
}
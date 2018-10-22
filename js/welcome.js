function welcomePage() {

    this.selectState = function () {
        throw new Error("WELCOME SELECT STATE IS NOT SETUP");
    }

    this.onStateSelect = function(callback) {
        this.selectState = callback;
    }

    $("#app").html(`
        <div class="selection">
            <button id='signup' type='button'>Sign Up</button>
            <button id='login' type='button'>Login</button>
        </div> 
    `);

    $("header > span").remove();
    CSSManager.unstyleHeader();
    CSSManager.styleWelcomePage();

    $("#signup").click((e) => { 
        e.preventDefault();
        this.selectState("signup");
    });

    $("#login").click((e) => { 
        e.preventDefault();
        this.selectState("login");
    });
}
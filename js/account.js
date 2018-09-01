

function accountPage() {

    this.signout = function () {
        throw new Error("SIGNOUT IS NOT SETUP");
    }

    this.onSignout = (callback) => {
        this.signout = callback;
    }

    $("#app").html(`
        <h1>Welcome to the account page</h1>
        <button id="sign_out">Sign Out</button>
    `);

    $("#sign_out").click((e) => { 
        e.preventDefault();
        localStorage.removeItem("SID");
        console.log("user signing out");
        this.signout();
    });
}
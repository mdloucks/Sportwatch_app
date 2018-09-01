
/**
 * Home is mainly loading the navigation bar and other things that are part of the app
 * In order to load the content for the actual homepage you must call loadContent()
 * 
 * homePage.onStateSelect() will accept a callback function that passes back the selected state
 */
function homePage() {

    this.selectState = function () {
        throw new Error("HOME SELECT STATE IS NOT SETUP");
    }

    this.onStateSelect = (callback) => {
        this.selectState = callback;
    }

    this.loadContent = function() {
        $("#app").html("<p>Sportwatch Home page</p>");
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // This is all navigation menu things
    //......................................................
    $("header").html(`
        <span id="navigation_menu_open">&#9776;</span>
        <p>Sportwatch</p>
    `);

    CSSManager.unstyleHeader();
    CSSManager.styleHomeHeader();

    $("#navigation_menu").html(`
        <a id="navigation_menu_close">&times;</a>
        <a class="navigation_menu_link" id="link_team">Team</a>
        <a class="navigation_menu_link" id="link_athletes">Athletes</a>
        <a class="navigation_menu_link" id="link_meets">Meets</a>
        <a class="navigation_menu_link" id="link_stats">Stats</a>
        <a class="navigation_menu_link" id="link_timer">Timer</a>
        <a class="navigation_menu_link" id="link_account">Acccount</a>
    `);
    
    CSSManager.styleNavigationMenu();

    // TODO DO THIS
    let links = document.getElementsByClassName("navigation_menu_link");

    // for (let i = 0; i < link.length; i++) {

    // }

    $("#link_team").click((e) => {
        e.preventDefault();
        this.closeNavigationMenu();
        this.selectState("team");
    });

    $("#link_athletes").click((e) => {
        e.preventDefault();
        this.closeNavigationMenu();
        this.selectState("athletes");
    });

    $("#link_meets").click((e) => {
        e.preventDefault();
        this.closeNavigationMenu();
        this.selectState("meets");
    });

    $("#link_stats").click((e) => {
        e.preventDefault();
        this.closeNavigationMenu();
        this.selectState("stats");
    });

    $("#link_account").click((e) => {
        e.preventDefault();
        this.closeNavigationMenu();
        this.selectState("account");
    });

    $("#link_timer").click((e) => {
        e.preventDefault();
        this.closeNavigationMenu();
        this.selectState("timer");
    });


    $("#navigation_menu_close").click(function (e) {
        e.preventDefault();
        document.getElementById("navigation_menu").style.width = "0";
    });

    $("#navigation_menu_open").click(function (e) {
        e.preventDefault();
        document.getElementById("navigation_menu").style.width = "250px";
    });

    this.closeNavigationMenu = () => {
        document.getElementById("navigation_menu").style.width = "0";
    }

    this.removeNavigationMenu = () => {
        $("#navigation_menu").remove();
        $("header > span").remove();
    }
}
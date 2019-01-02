
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
        $("#app").html(`
            <p>Welcome to Sportwatch!</p>
            <button id="testbutton">Test Button</button>
        `);
    }
    
    $("header").empty(); // When coming from logging or signing in
    
    $(document).on("click", "#testbutton", function (e) {
        e.preventDefault();
        createConfirmationPopup("Are you sure you want to delete your meet?", ["Yes", "No"], [function() {
            console.log("Yes");
        }, function() {
            console.log("No");
        }]);
    });

    // check if the header contains anything
    if($("header").html().trim().length === 0) {
        $("header").html(`
            <span id="navigation_menu_open">&#9776;</span>
            <p>Sportwatch</p>
        `);
    }

    // if the nav menu is empty
    if($("#navigation_menu").html().trim().length === 0) {
        $("#navigation_menu").html(`
            <a id="navigation_menu_close">&times;</a>
            <a class="navigation_menu_link" id="link_home">Home</a>
            <a class="navigation_menu_link" id="link_meets">Meets</a>
            <a class="navigation_menu_link" id="link_events">Events</a>
            <a class="navigation_menu_link" id="link_athletes">Athletes</a>
            <a class="navigation_menu_link" id="link_stopwatch">Stopwatch</a>
            <a class="navigation_menu_link" id="link_beginmeet">Begin Meet</a>
            <a class="navigation_menu_link" id="link_stats">Stats</a>
            <a class="navigation_menu_link" id="link_account">Acccount</a>
        `);

        $("#link_home").click((e) => {
            e.preventDefault();
            this.closeNavigationMenu();
            this.selectState("home");
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
    
        $("#link_events").click((e) => {
            e.preventDefault();
            this.closeNavigationMenu();
            this.selectState("events");
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
    
        $("#link_stopwatch").click((e) => {
            e.preventDefault();
            this.closeNavigationMenu();
            this.selectState("stopwatch");
        });

        $("#link_beginmeet").click((e) => {
            e.preventDefault();
            this.closeNavigationMenu();
            this.selectState("beginmeet");
        });
    
        $("#navigation_menu_close").click(function (e) {
            e.preventDefault();
            document.getElementById("navigation_menu").style.width = "0";
        });
    
        $("#navigation_menu_open").click(function (e) {
            e.preventDefault();
            document.getElementById("navigation_menu").style.width = "250px";
        });
    }


    // TODO DO THIS
    // let links = document.getElementsByClassName("navigation_menu_link");

    // for (let i = 0; i < link.length; i++) {

    // }

    this.closeNavigationMenu = () => {
        document.getElementById("navigation_menu").style.width = "0";
    }

    this.removeNavigationMenu = () => {
        $("#navigation_menu").remove();
        $("header > span").remove();
    }
}
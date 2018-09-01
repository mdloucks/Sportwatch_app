

/**
 * this class will be for simply adding in styles for different pages
 */
let CSSManager = {

    styleTimer() {

        $("#start_stop").css({
            "min-width": "100%",
            "min-height": "3.5em",
            "margin-top": "1em",
            "padding": "0"
        });

        $(".athlete_container").css({
            "font-size": "3.2em",
            "min-width": "100%",
            "margin-top": "0.5em"
        });

        $("#button_container").css({
            "text-align": "center",
        });
    },

    styleHomeHeader() {

        $("header").css({
            "margin" : "0 auto",
            "min-width" : "100%",
            "text-align": "center"
        });

        $("header > span").css({
            "margin-right": "0.5em",
            "font-size": "3.5em",
            "display": "inline-block"
        });

        $("header > p").css({
            "font-size": "3.5em",
            "display": "inline-block"
        });

        $("#app").css({
            "text-align": "center"
        });
    },

    /**
     * removes the styling for elements in the header
     */
    unstyleHeader() {
        $("header *").css({
            "all": "initial"
        });
    },

    styleWelcomePage() {

        $("header").css({
            "text-align": "center",
        });

        $("header > span").css({
            "margin-left": "0em",
            "margin-right": "0em",
            "font-size": "4em",
            "display": "inline-block"
        });

        $("header > p").css({
            "margin-left": "auto",
            "font-size": "3.5em",
            "display": "inline-block"
        });

        $(".selection").css({
            "display": "flex",
            "align-items": "center",
            "justify-content": "center"    
        });

        $("button").css({
            "background-color": "red",
            "color": "white",
            "padding": "15px 32px",
            "border-radius": "10%"
        });
    },

    styleLoginPage() {
        $("#app").css({
            "text-align": "center"
        });

        $("form").css({
            "display": "inline-block"
        });
    },

    styleNavigationMenu() {
        $("#navigation_menu").css({
            "height": "100%",
            "width": "0",
            "position": "fixed",
            "z-index": "1",
            "top": "0",
            "left": "0",
            "background-color": "#111",
            "overflow-x": "hidden",
            "transition": "0.5s",
            "padding-top": "60px"
        });

        $(".navigation_menu_link").css({
            "padding": "8px 8px 8px 32px",
            "text - decoration": "none",
            "font - size": "25px",
            "color": "#818181",
            "display": "block",
            "transition": "0.3s"
        });

        $("#navigation_menu").css({
            "position": "absolute",
            "top": "0",
            "right": "25px",
            "font-size": "36px",
        });

        $("#navigation_menu_close").css({
            "position": "absolute",
            "top": "0",
            "right": "25px",
            "font-size": "1.75em",
            "color" : "white"
        });
    },
};
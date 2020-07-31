

/**
 * @deprecated please stop using this.
 * 
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




    /**
     * removes the styling for elements in the header
     */
    unstyleHeader() {
        $("header *").css({
            "all": "initial"
        });
    },

    /**
     * Adds the given CSS file to the current page dynamically.
     * 
     * @example addStylesheet("login.css");  will add the login stylesheet
     * 
     * @param {String} cssFileName name of CSS file; include extension, but not "css/"
     */
    addStylesheet(cssFileName) {
        $("head").append("<link rel='stylesheet' type='text/css' href='css/" + cssFileName + "'>");
    },

    /**
     * Will attempt to remove any specific-page stylesheets. Does NOT remove:
     * generic_elements.css
     * index.css
     * popup.css
     * 
     * Should be called when a new page in the app changes or loads.
     */
    resetStyling() {
        $("link[rel=stylesheet][href='css/settings.css']").remove();
        $("link[rel=stylesheet][href='css/athlete.css']").remove();
        $("link[rel=stylesheet][href='css/events.css']").remove();
        $("link[rel=stylesheet][href='css/home.css']").remove();
        $("link[rel=stylesheet][href='css/login.css']").remove();
        $("link[rel=stylesheet][href='css/meet.css']").remove();
        $("link[rel=stylesheet][href='css/signup.css']").remove();
        $("link[rel=stylesheet][href='css/stats.css']").remove();
        $("link[rel=stylesheet][href='css/team_create.css']").remove();
        $("link[rel=stylesheet][href='css/stopwatch.css']").remove();
        $("link[rel=stylesheet][href='css/welcome.css']").remove();
    },

    styleWelcomePage() { // Deprecated; use addStyleSheet() instead

        console.log("styleWelcomePage() is DEPRECATED");

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

    styleAthlete_addPage() {

        $("#app").css({
            "text-align": "center"
        });
        $("form").css({
            "display": "inline-block"
        });
        $("input").css({
            "margin-top": "1em",
            "border": "1.5px solid black"
        });
    },

    styleAthletePage() {

        $("#athlete_container").css({
            "font-size": "2em",
        });

        $("#app").css({
            "background-color": "light gray"
        });

        // $(".switch").css({
        //     "position": "relative",
        //     "display": "inline-block",
        //     "width": "60px",
        //     "height": "34px"
        // });

        // $(".switch input").css({"display": "none"});

        // $(".slider").css({
        //     "position": "absolute",
        //     "cursor": "pointer",
        //     "top": "0",
        //     "left": "0",
        //     "right": "0",
        //     "bottom": "0",
        //     "background-color": "#ccc",
        //     "-webkit-transition": ".4s",
        //     "transition": ".4s"
        // });

        // $(".slider:before").css({
        //     "position": "absolute",
        //     "content": "",
        //     "height": "26px",
        //     "width": "26px",
        //     "left": "4px",
        //     "bottom": "4px",
        //     "background-color": "white",
        //     "-webkit-transition": ".4s",
        //     "transition": ".4s"
        // });

        // $("input:checked + .slider").css({
        //     "background-color": "#2196F3"
        // });

        // $("input:focus + .slider").css({
        //     "box-shadow": "0 0 1px #2196F3"
        // });

        // $("input:checked + .slider:before").css({
        //     "-webkit-transform": "translateX(26px)",
        //     "-ms-transform": "translateX(26px)",
        //     "transform": "translateX(26px)"
        // });
    },
};
let stats = {
    /**
     * @returns {function} the function that is called when the page changes.
     */
    initStats: function () {
        $("#app").html("<h1>This is the stats page!</h1>");

        let style = document.getElementById("style_stats");
        style.disabled = false;

        let exit_callback = function () {
            style.disabled = true;
        }

        return exit_callback;
    }
}
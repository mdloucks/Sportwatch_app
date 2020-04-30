let navbar = {

    pageIDs: [],

    /**
     * 
     * Set a callback to each navbar button to set the style. Pass in a callback function in order to 
     * get a change page functionallity. This function will pass in the name of the selected page as a parameter
     * ex. myFunction(pageID) -> initNavbar(myFunction)
     * 
     * @param {function} cb the function to call when a button is pressed; the function will pass in a page name
     */
    initNavbar: function (cb) {

        // read all of the pages that are listed on the .navbar into an array
        let _this = this;

        let pageIDsLength = $(".navbar div").length;

        $(".navbar").children('div').each(function (index) {
            _this.pageIDs.push("#".concat(this.id));

            if (index === pageIDsLength - 1) {
                _this.disablePageStyles();
            }
        });

        // create a callback for each of them
        for (let i = 0; i < this.pageIDs.length; i++) {

            let id = this.pageIDs[i];

            $(id).click((e) => {
                e.preventDefault();
                this.focusButton(id);
                cb(id.replace('#', ''));
            });
        }
    },

    /**
     * will set the selected button to a color and change the rest back to default.
     * 
     * @param {String} buttonID ID of the navbar button being passed in
     */
    focusButton: function (buttonID) {
        // $(buttonID).css("background-color", "green");
        $(".navbar > *").removeClass("active"); // Un-select all buttons
        $(buttonID).addClass("active"); // Select the clicked one

        // let remainingIDs = this.pageIDs.slice();
        // remainingIDs.splice(remainingIDs.indexOf(buttonID), 1);

        // for (let i = 0; i < remainingIDs.length; i++) {
        //     let id = remainingIDs[i];
        //     $(id).css("background-color", "rgb(245, 77, 77)");
        // }
    },

    /**
     * disables all of the css for all of the pages
     */
    disablePageStyles: function () {

        for (let i = 0; i < this.pageIDs.length; i++) {
            let id = this.pageIDs[i];
            id = id.replace('#', '');

            let style = document.getElementById(`style_${id}`);
            style.disabled = true;
        }
    }
}


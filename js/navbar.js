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

        let _this = this;


        $(".navbar").children('div').each(function () {
            _this.pageIDs.push("#".concat(this.id));
        });

        for (let i = 0; i < this.pageIDs.length; i++) {

            let id = this.pageIDs[i];

            $(id).click((e) => {
                e.preventDefault();
                this.focusButton(id);
                cb(id);
            });
        }
    },

    /**
     * will set the selected button to a color and change the rest back to default.
     * 
     * @param {String} buttonID ID of the navbar button being passed in
     */
    focusButton: function (buttonID) {
        $(buttonID).css("background-color", "green");

        let remainingIDs = this.pageIDs.slice();
        remainingIDs.splice(remainingIDs.indexOf(buttonID), 1);

        for (let i = 0; i < remainingIDs.length; i++) {
            let id = remainingIDs[i];
            $(id).css("background-color", "rgb(245, 77, 77)");
        }
    }
}


class Navbar {

    constructor() {
        this.pageIDs = [];
        this.pageNames = [];
    }


    /**
     * @description Set a callback to each navbar button to set the style. Pass in a callback function in order to 
     * get a change page functionallity. This function will pass in the name of the selected page as a parameter
     * @example myFunction(pageID) -> initNavbar(myFunction)
     * 
     * @param {function} cb the function to call when a button is pressed; the function will pass in a page name
     * @param {Array} pageNames allows manual specification of page names (i.e. CreateTeam for Team button)
     */
    initNavbar(cb, pageNames = []) {

        // read all of the pages that are listed on the .navbar into an array
        let _this = this;

        let pageIDsLength = $(".navbar div").length;

        $(".navbar").children('div').each(function (index) {
            _this.pageIDs.push("#".concat(this.id));
            _this.pageNames.push(this.innerHTML);
        });
        
        // Overwrite page names if manual was given
        if(_this.pageNames.length != 0) {
            _this.pageNames = pageNames;
        }
        
        if (this.pageIDs.length != this.pageNames.length) {
            throw new Exception("Length mismatch between page names and ID's!");
        }

        // create a callback for each of them
        for (let i = 0; i < this.pageIDs.length; i++) {

            let id = this.pageIDs[i];

            $(id).click((e) => {
                e.preventDefault();
                this.focusButton(id);
                cb(this.pageNames[i]);
            });
        }
    }

    /**
     * will set the selected button to a color and change the rest back to default.
     * 
     * @param {String} buttonID ID of the navbar button being passed in
     */
    focusButton(buttonID) {
        /* Not a big deal right now, but this function is being called twice
           during click events. Once, from the click event defined above, and
           again when transitionPage() is called within each Page Set
        */
        // $(buttonID).css("background-color", "green");
        $(".navbar > *").removeClass("active"); // Un-select all buttons
        $(".navbar > " + buttonID).addClass("active"); // Select the clicked one
    }
}


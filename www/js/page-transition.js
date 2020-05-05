

/**
 * Used for page transitions, including sliding and fade effects.
 * NOTE: the id of the div_page and the key for that page MUST match! If they
 * don't, it will be corrected for.
 *
 * @example
 * let accountTransitions = new PageTransition("settings", "<p>Settings Page</p><button>Click to activate</button>");
 * accountTransitions.addPage("create_team", "<p>Create your awesome, unique team here!</p>");
 * accountTransitions.slideRight("create_team", 500);
 * 
 * @param {String} sourceEl default = "". element which new pages will be added to (ex "#app")
 * @param {String} firstPageHtml default = "". first / default page html content
 * @param {String} firstPageKey default = "".  first / default page displayed name
 */
class PageTransition {
    
    constructor(sourceEl = "", firstPageHtml = "", firstPageKey = "") {
        // All page keys should NOT include the #. When referring to pages with
        // jQuery, add in a #.  All keys should also be lowercase
        this.pages = new Map();
        this.currentPage = "";
        this.sourceElement = ""; // Usually #app or parent page div
        // Set source element, or at least assume something
        if (sourceEl !== "") {
            this.sourceElement = "#" + sourceEl.replace("#", "");
        } else {
            this.sourceElement = "#app";
        }
        // // Attempt to add the default page if given
        if(firstPageHtml !== "") {
            this.addPage(firstPageKey, firstPageHtml, true);
        }
    }
    /**
     * Adds a page to the pages map for use when transitioning
     * NOTE: the id of the div_page and the key for that page MUST match! If they
     * don't, it will be corrected for.
     *
     * @example
     * addPage("coach", "<div id="coach" class="div_page"> <h1>Coach's Stop Here!</h1> </div>);
     *
     * @param {String} pageKey key for this page
     * @param {String} pageHtml html content for the new page
     * @param {Boolean} showPage should the page be shown after it is added?
     */
    addPage(pageKey, pageHtml, showPage = false) {
        // Make sure these values were set
        if((pageKey !== "") && (pageHtml !== "")) {
            // This is the provided div_page id found in pageHtml
            // It needs to match pageKey to work correctly
            let rawPageId = this.verifyPageKey(pageHtml);
            pageKey = pageKey.replace("#", ""); // Remove any hashtags
            // If the div_page is missing, wrap the content in it
            if(!pageHtml.includes("div_page")) {
                pageHtml = "<div id=\"" + pageKey + "\" class=\"div_page\">" + pageHtml + "</div>";
                // If the div_page is missing an id, add one
            } else if(rawPageId == "") {
                let classIndex = pageHtml.indexOf("div_page");
                let divIndex = pageHtml.lastIndexOf("<div", classIndex) + 4;
                // + 4 to remove <div from processing
                pageHtml = pageHtml.substring(0, divIndex) + " id=\"" + pageKey + "\"" + pageHtml.substring(divIndex, pageHtml.length);
                // If the div_page id doesn't match the key, correct it
            } else if(pageKey != rawPageId) {
                let currentIdIndex = pageHtml.indexOf(rawPageId);
                let endIdIndex = currentIdIndex + rawPageId.length;
                pageHtml = pageHtml.substring(0, currentIdIndex) + pageKey + pageHtml.substring(endIdIndex, pageHtml.length);
            }
            this.pages.set(pageKey, pageHtml);
            
            $(this.sourceElement).append(pageHtml);
            // Keep as base starting point for simplicity
            $("#" + pageKey).addClass("current_page");
            if(!showPage) {
                // $(divId).addClass("page_right");
                $("#" + pageKey).addClass("hidden");
            } else {
                this.currentPage = pageKey;
            }
        } else if(pageHtml !== "") {
            if(this.verifyPageKey(pageHtml) !== "") {
                // Set the page with its id
                this.pages.set(this.verifyPageKey(pageHtml), pageHtml);
            }
            // Else don't set since the pageHtml isn't given
        } else {
            console.log("[PageTransition][addPage()]: Unable to add page due to missing parameters");
        }
    }
    /**
     * Removes a page from the pages Map based on key value.
     *
     * @example
     * removePage("createTeam");
     *
     * @param {String} pageKey name of the page to be removed
     *
     * @return {Boolean} True, if success. False, if the page key didn't exist
     */
    removePage(pageKey) {
        return this.pages.delete(pageKey);
    }
    /**
     * Slides the new page in from the right TO the left.
     *
     * @example
     * slideLeft("accountSettings", 500);
     *
     * @param {String} targetPageKey lowercase string of new page id
     * @param {Integer} duration [default = 1000] delay of transition play
     */
    slideLeft(targetPageKey, duration = 1000) {
        this.slidePage(targetPageKey, true, duration);
    }
    /**
     * Slides the new page in from the left TO the right.
     *
     * @example
     * slideRight("mainPage", 500);
     *
     * @param {String} targetPageKey lowercase string of new page id
     * @param {Integer} duration [default = 1000] delay of transition play
     */
    slideRight(targetPageKey, duration = 1000) {
        this.slidePage(targetPageKey, false, duration);
    }
    /**
     * Internal method used to slide a page left or right, depending on the
     * second boolean parameter. slideLeft() and slideRight() should be
     * used instead of this function.
     *
     * @param {String} targetPageKey the target page name (in pages Map) of
     * the new page
     * @param {Boolean} slideLeft should the page slide to the left? (i.e. right to left)
     * @param {Integer} duration the duration of the transition, in milliseconds
     */
    slidePage(targetPageKey, slideLeft, duration) {
        // Create ID's for previous and new page after removing any sneaky #'s
        let prevPageId = "#" + this.currentPage.replace("#", "");
        let targetPageId = "#" + targetPageKey.replace("#", "");
        // Prevent the double clicking of the button
        if(($(prevPageId).is(":animated")) || ($(targetPageId).is(":animated"))) {
            return;
        }
        if(prevPageId == targetPageId) {
            console.log("[PageTransition][slidePage()]: Duplicate! New current page: " + this.currentPage);
            return;
        }
        
        // Check to see if any sliding occured. If not, position pages
        if(($(targetPageId).css("left") == "0px") && ($(prevPageId).css("left") == "0px")) {
            $(targetPageId).css("left", "");
            $(prevPageId).css("left", "");
            
            // Set up location (opposite of direction of the slide)
            $(".div_page").css("transition", "left 0s");
            if(slideLeft) {
                $(targetPageId).css("left", "100%");
            } else {
                $(targetPageId).css("left", "-100%");
            }
        }
        // Update transition time for all pages and convert duration to seconds
        // Have to use setTimeout to allow for the pages to get into position
        setTimeout(() => {
            $(".div_page").css("transition", "left " + (duration / 1000) + "s");
        }, 1);
        
        // Use setTimeout to avoid instant appearance of new page
        // Kind of jimmy-rigged, but I don't know how to solve the root problem :(
        setTimeout(() => {
            if(slideLeft) {
                $(targetPageId).removeClass("hidden");
                $(targetPageId).css("left", "0");
                $(prevPageId).css("left", "-100%");
            } else {
                $(targetPageId).removeClass("hidden");
                $(targetPageId).css("left", "0");
                $(prevPageId).css("left", "100%");
            }
        }, 2);
        
        // Hide old page once new page is in focus
        setTimeout(() => {
            $(prevPageId).addClass("hidden");
            // Remove transition time in order to set up page locations
            $(".div_page").css("transition", "");
            if(slideLeft) {
                $(prevPageId).css("left", "0");
            } else {
                $(prevPageId).css("left", "0");
            }
            this.currentPage = targetPageId.replace("#", "");
        }, duration);
    }
    
    /**
     * Moves the target page the given value in pixels. This is NOT
     * a full transition, but rather, should be called in conjunction
     * with a touchmove event to update page appearance
     * 
     * @example slidePageX("Stats", true, 23); --> Moves Stopwatch & Stats 23 pixels left
     * 
     * @param {String} targetPageKey key of new page (often page ID.toLowerCase() + "Page")
     * @param {Boolean} slideLeft should the pages slide from left to right? (false for opposite)
     * @param {Integer} dx change to horizontal motion to move pages (often called with touchmove)
    */
    slidePageX(targetPageKey, slideLeft, dx) {
        
        // Find ID's for previous and new page
        let prevPageId = "#" + this.currentPage.replace("#", "");
        let targetPageId = "#" + targetPageKey.replace("#", "");
        // Prevent the double clicking of the button
        if (($(prevPageId).is(":animated")) || ($(targetPageId).is(":animated"))) {
            return;
        }
        // Set up location (opposite of direction of the slide)
        $(".div_page").css("transition", "left 0s");
        if (slideLeft) {
            $(targetPageId).css("left", "100%");
        } else {
            $(targetPageId).css("left", "-100%");
        }
        
        if(dx == 0) {
            console.log("[page-transition:slidePageX()]: Reset");
            $(".div_page").addClass("hidden");
            $(prevPageId).removeClass("hidden"); // Reset all styling
            $(targetPageId).css("left", "");
            $(prevPageId).css("left", "");
            return; // Clear the CSS transition so sliding works properly
        }
        
        // Use setTimeout to avoid instant appearance of new page
        // Kind of jimmy-rigged, but I don't know how to solve the root problem :(
        $(targetPageId).removeClass("hidden");
        setTimeout(() => {
            if (slideLeft) {
                $(targetPageId).css("left", (($(window).width() - dx) + "px"));
                $(prevPageId).css("left", (-1 * dx + "px"));
            } else {
                $(targetPageId).css("left", (((-1 * $(window).width()) + dx) + "px"));
                $(prevPageId).css("left", (dx + "px"));
            }
        }, 1);
        
    }
    
    /**
     * Return the div_page element id to compare or set the pages Map key.
     *
     * @return {String} the id value of the div_page, if present. Otherwise,
     * "" will return
     *
     * @example
     * verifyPageKey("<h1>Title</h1>  <div id=timer class =div_page><p>Content here</p></div>")
     *     Returns -->  "timer"
     *
     * if("somePageKey" != verifyPageKey("<html content goes here>")) { console.log("ERROR"); }
     *
     * @param {String} pageHtml the html content for the page
     */
    verifyPageKey(pageHtml) {
        // Find the id of the div to compare to page Map key
        let divIndex = pageHtml.indexOf("<div");
        let idIndex = pageHtml.indexOf("id=", divIndex);
        let divId = "";
        // Invalidate the index if it is outside of the <div ... > tag
        if(idIndex > pageHtml.indexOf(">", divIndex)) {
            idIndex = -1;
        }
        if((divIndex != -1) && (idIndex != -1)) {
            let endIdIndex = pageHtml.indexOf("\"", idIndex + 4); // +3 to remove quotes from id="
            // +3 to remove "id="
            divId = pageHtml.substring(idIndex + 3, endIdIndex);
            divId = divId.replace(/\"/g, "").replace("#", ""); // Remove all quotes and hashtags
            return divId;
        } else {
            console.log("[PageTransition][verifyPageKey()]: Div or id index was invalid");
            return "";
        }
        return "";
    }
    
}



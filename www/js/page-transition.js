

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
        if (firstPageHtml !== "") {
            this.addPage(firstPageKey, firstPageHtml, true);
        }
        
        // Used only for the duration delays (i.e. after pages finish sliding),
        // which will help detect in-progress animations, and stop animations
        // from finishing if PageSet is changing. TL;DR: Don't delete this!!!
        this.timeoutId = -1; // Value returned by setTimeout
        this.isAnimating = false;
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
        if ((pageKey !== "") && (pageHtml !== "")) {
            // This is the provided div_page id found in pageHtml
            // It needs to match pageKey to work correctly
            let rawPageId = this.verifyPageKey(pageHtml);
            pageKey = pageKey.replace("#", ""); // Remove any hashtags
            // If the div_page is missing, wrap the content in it
            if (!pageHtml.includes("div_page")) {
                pageHtml = "<div id=\"" + pageKey + "\" class=\"div_page\">" + pageHtml + "</div>";
                // If the div_page is missing an id, add one
            } else if (rawPageId == "") {
                let classIndex = pageHtml.indexOf("div_page");
                let divIndex = pageHtml.lastIndexOf("<div", classIndex) + 4;
                // + 4 to remove <div from processing
                pageHtml = pageHtml.substring(0, divIndex) + " id=\"" + pageKey + "\"" + pageHtml.substring(divIndex, pageHtml.length);
                // If the div_page id doesn't match the key, correct it
            } else if (pageKey != rawPageId) {
                let currentIdIndex = pageHtml.indexOf(rawPageId);
                let endIdIndex = currentIdIndex + rawPageId.length;
                pageHtml = pageHtml.substring(0, currentIdIndex) + pageKey + pageHtml.substring(endIdIndex, pageHtml.length);
            }
            this.pages.set(pageKey, pageHtml);

            // Don't add if the element already exists (i.e. #app versus individual pages)
            if(!$(this.sourceElement + " > #" + pageKey).length) {
                $(this.sourceElement).append(pageHtml);
            }
            if (!showPage) {
                // $(divId).addClass("page_right");
                $(this.sourceElement + " > #" + pageKey).addClass("hidden");
            } else {
                this.currentPage = pageKey;
            }
        } else if (pageHtml !== "") {
            if (this.verifyPageKey(pageHtml) !== "") {
                // Set the page with its id
                this.pages.set(this.verifyPageKey(pageHtml), pageHtml);
            }
            // Else don't set since the pageHtml isn't given
        } else {
            if(DO_LOG) {
                console.log("[PageTransition][addPage()]: Unable to add page due to missing parameters");
            }
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
     * Hides all of the pages contained in this page object.
     */
    hidePages() {
        // Have to loop through to prevent hiding of separate pageTransition instances
        this.pages.forEach((value, key) => {
            // If it isn't already hidden
            if (!$(this.sourceElement + " > #" + key).hasClass("hidden")) {
                $(this.sourceElement + " > #" + key).addClass("hidden");
            }
        });
    }

    /**
     * Shows the current page (only used after hiding all pages)
     */
    showCurrentPage() {
        $(this.sourceElement + " > #" + this.currentPage.replace("#", "")).removeClass("hidden");
    }

    getCurrentPage() {
        return this.currentPage;
    }
    setCurrentPage(pageId) {
        pageId = pageId.replace("#", "");
        // Make sure the page exists
        if($(this.sourceElement + " > #" + pageId).length) {
            this.currentPage = pageId;
            
        } else {
            if(DO_LOG) {
                console.log("[page-transition.js:setCurrentPage()]: Invalid page #" + pageId + " in element " + this.sourceElement);
            }
        }
    }
    
    /**
     * Should be used before calling slidePage functions to see if another
     * page is being animated or not
     */
    getIsAnimating() {
        return this.isAnimating;
    }
    
    /**
     * Halts any sliding timeouts. This function should be used with EXTREME CARE,
     * as mis-use can cause pages to remain visible enough after they have moved
     * off the viewport. This function's main purpose is to prevent a TAP Gesture
     * from triggering slidePageX(), and consequently hiding the page after a
     * 200 millisecond delay.
     * 
     * @example page.onChangePageSet(0); ... transitionObj.forceHaltSlide();
     * 
     * @returns
     * True, if a page was sliding and was stopped. False if there was no
     * sliding delay set
     */
    forceHaltSlide() {
        if(this.timeoutId != -1) {
            clearTimeout(this.timeoutId);
            $(this.sourceElement + " > .div_page").css("transition", "");
            return true;
        }
        return false;
    }
    
    /**
     * Gets size / length of pages map. Useful for checking if pages
     * have been added or linked yet
     */
    getPageCount() {
        return this.pages.size;
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
     * used instead of this function. It makes use of the isAnimating member boolean
     * to determine if it shuold animate or return.
     *
     * @param {String} targetPageKey the target page name (in pages Map) of
     * the new page
     * @param {Boolean} slideLeft should the page slide to the left? (i.e. right to left)
     * @param {Integer} duration the duration of the transition, in milliseconds
     */
    slidePage(targetPageKey, slideLeft, duration) {
        let prevPageId = "#" + this.currentPage.replace("#", "");
        let targetPageId = "#" + targetPageKey.replace("#", "");
        let prevGenericHeader = false;
        let targetGenericHeader = false;
        
        let prevLeftDestination = 0; // Slide left, -100%, slide right, +100%
        
        // Prevent the double clicking of the button
        if (this.isAnimating) {
            if(DO_LOG) {
                console.log("[PageTransition][slidePage()]: Still being transitioned!");
            }
            return false;
        }
        if (prevPageId == targetPageId) {
            if(DO_LOG) {
                console.log("[PageTransition][slidePage()]: Duplicate! New current page: " + this.currentPage);
            }
            return false;
        }
        
        // Check for a generic header (needs to also be slid)
        if($(this.sourceElement + " > " + prevPageId + " > .generic_header").length > 0) {
            prevGenericHeader = true;
        }
        if($(this.sourceElement + " > " + targetPageId + " > .generic_header").length > 0) {
            targetGenericHeader = true;
        }
        
        // Define where the target page will end up
        if(slideLeft) {
            prevLeftDestination = -$("#app").width();
        } else {
            prevLeftDestination = $("#app").width();
        }
        
        // Check to see if any sliding occured. If not, position pages
        let prevLeftCss = parseInt($(this.sourceElement + " > " + prevPageId).css("left").replace("px").replace("%"));
        if (Math.abs(prevLeftCss) == 0) {
            // Invert destination since we want the target OPPOSITE the sliding direction
            $(this.sourceElement + " > " + targetPageId).css("left", -prevLeftDestination + "px");
            $(this.sourceElement + " > " + targetPageId + " .generic_header").css("left", -prevLeftDestination + "px");
        }
        
        // Use these for promise resolution
        let targetAnimation = -1;
        let prevAnimation = -1;
        
        // Animate the pages!
        // Target page
        targetAnimation = $(this.sourceElement + " > " + targetPageId).animate({
            left: 0
        }, {
            duration: duration,
            start: () => {
                this.isAnimating = true;
                
                // Show the target page on animation start
                $(this.sourceElement + " > " + targetPageId).removeClass("hidden");
                if(targetGenericHeader) {
                    $(this.sourceElement + " > " + targetPageId + " > .generic_header").removeClass("hidden");
                }
            }
        });
        $(this.sourceElement + " > " + targetPageId + " .generic_header").animate({
            left: 0
        }, duration);
        
        // Previous page
        prevAnimation = $(this.sourceElement + " > " + prevPageId).animate({
            left: prevLeftDestination
        }, {
            duration: duration,
            complete: () => {
                // Hide this page, now that it's out of view
                $(this.sourceElement + " > " + prevPageId).addClass("hidden").css("left", "0px");
                $(this.sourceElement + " > " + prevPageId + " > .generic_header").addClass("hidden");
            }
        });
        $(this.sourceElement + " > " + prevPageId + " .generic_header").animate({
            left: prevLeftDestination
        }, duration);
        
        // Animation completion logic
        $.when(targetAnimation.promise(), prevAnimation.promise()).then(() => {
            if(DO_LOG) {
                console.log("[page-transition.js:slidePage()]: Animation complete");
            }
            this.isAnimating = false;
            this.currentPage = targetPageId.replace("#", "");
        });
    }
    
    
    /**
     * Internal method used to slide a page left or right, depending on the
     * second boolean parameter. slideLeft() and slideRight() should be
     * used instead of this function. Will return false if the pages
     * are still being transitioned
     *
     * @param {String} targetPageKey the target page name (in pages Map) of
     * the new page
     * @param {Boolean} slideLeft should the page slide to the left? (i.e. right to left)
     * @param {Integer} duration the duration of the transition, in milliseconds
     * 
     * @deprecated
     * Renamed to "slidePageOld" and replaced by new "slidePage" method above due to:
     *   1) A cleaner, more reliable and robust solution with jquery's animate()
     *   2) Inability of this function to easily animate page headers (.generic_header) on iOS
     */
    slidePageOld(targetPageKey, slideLeft, duration) {
        
        // Create ID's for previous and new page after removing any sneaky #'s
        let prevPageId = "#" + this.currentPage.replace("#", "");
        let targetPageId = "#" + targetPageKey.replace("#", "");
        // Prevent the double clicking of the button
        if (($(this.sourceElement + " > " + prevPageId).hasClass("page_left")) || 
                ($(this.sourceElement + " > " + prevPageId).hasClass("page_right"))) {
            if(DO_LOG) {
                console.log("[PageTransition][slidePageOld()]: Still being transitioned!");
            }
            return false;
        }
        if (prevPageId == targetPageId) {
            if(DO_LOG) {
                console.log("[PageTransition][slidePageOld()]: Duplicate! New current page: " + this.currentPage);
            }
            return false;
        }
        
        // Check to see if any sliding occured. If not, position pages
        let prevLeftCss = parseInt($(this.sourceElement + " > " + prevPageId).css("left").replace("px").replace("%"));
        if (Math.abs(prevLeftCss) == 0) {
            if (slideLeft) {
                $(this.sourceElement + " > " + targetPageId).addClass("page_right");
            } else {
                $(this.sourceElement + " > " + targetPageId).addClass("page_left");
            }
        }
        // Update transition time for all pages and convert duration to seconds
        // Have to use setTimeout to allow for the pages to get into position
        setTimeout(() => {
            $(this.sourceElement + " > .div_page").css("transition", "left " + (duration / 1000) + "s");
            $(this.sourceElement + " > " + targetPageId).css("left", ""); // Clear any slideX
            $(this.sourceElement + " > " + prevPageId).css("left", "");
        }, 1);

        // Use setTimeout to avoid instant appearance of new page
        // Kind of jimmy-rigged, but I don't know how to solve the root problem :(
        setTimeout(() => {
            if (slideLeft) {
                $(this.sourceElement + " > " + targetPageId).removeClass("hidden");
                $(this.sourceElement + " > " + targetPageId).removeClass("page_right");
                $(this.sourceElement + " > " + prevPageId).addClass("page_left");
            } else {
                $(this.sourceElement + " > " + targetPageId).removeClass("hidden");
                $(this.sourceElement + " > " + targetPageId).removeClass("page_left");
                $(this.sourceElement + " > " + prevPageId).addClass("page_right");
            }
        }, 2);

        // Hide old page once new page is in focus
        this.timeoutId = setTimeout(() => {
            $(this.sourceElement + " > " + prevPageId).addClass("hidden");
            
            // Remove transition time in order to set up page locations for next time
            $(this.sourceElement + " > .div_page").css("transition", "");
            $(this.sourceElement + " > " + prevPageId).removeClass("page_left");
            $(this.sourceElement + " > " + prevPageId).removeClass("page_right");
            
            this.currentPage = targetPageId.replace("#", "");
            this.timeoutId = -1; // Reset the value to signal completion
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
     * @param {Integer} duration [default = 1000] duration of delay in the event it's snapped back
    */
    slidePageX(targetPageKey, slideLeft, dx, duration = 1000) {
        
        // Find ID's for previous and new page
        let prevPageId = "#" + this.currentPage.replace("#", "");
        let targetPageId = "#" + targetPageKey.replace("#", "");
        // Prevent the double clicking of the button
        if (this.isAnimating) {
            if(DO_LOG) {
                console.log("[PageTransition][slidePageX()]: Still being transitioned!");
            }
            return;
        }

        // if(dx == 0) {
        //     console.log("[page-transition:slidePageX()]: Reset");
        //     $(".div_page").addClass("hidden");
        //     $(prevPageId).removeClass("hidden"); // Reset all styling
        //     $(targetPageId).css("left", "");
        //     $(prevPageId).css("left", "");
        //     return; // Clear the CSS transition so sliding works properly
        // }

        // Reset and snap back to the current page
        if (dx == 0) {
            // Configure delay...
            $(this.sourceElement + " > .div_page").css("transition", "left " + (duration / 1000) + "s");
            $(this.sourceElement + " > " + targetPageId).css("left", "");
            $(this.sourceElement + " > " + prevPageId).css("left", "");
            
            // Since slideLeft can't be given as parameter, use current page's left attribute
            let currentLeftPos = $(this.sourceElement + " > " + targetPageId).css("left").replace("px", "").replace("%", "");
            if (parseInt(currentLeftPos) < 0) {
                $(this.sourceElement + " > " + prevPageId).addClass("page_right");
            } else {
                $(this.sourceElement + " > " + prevPageId).addClass("page_left");
            }
            $(targetPageId).removeClass("page_left");
            $(targetPageId).removeClass("page_right");
            
            this.timeoutId = setTimeout(() => {
                // Remove CSS styling for normal activity next swipe
                // Hide all, then remove to avoid cross-sourceElement modification
                $(this.sourceElement + " > .div_page").addClass("hidden");
                $(this.sourceElement + " > " + targetPageId).removeClass("hidden");
                // $(this.sourceElement + " > .div_page").not(targetPageId).addClass("hidden");
                $(this.sourceElement + " > .div_page").removeClass("page_left");
                $(this.sourceElement + " > .div_page").removeClass("page_right");
                $(this.sourceElement + " > .div_page").css("transition", "");
                
                this.currentPage = targetPageId.replace("#", "");
                this.timeoutId = -1; // Reset to signal completion
            }, duration);
            return;
        }

        // NORMAL SLIDING (below this comment)
        $(this.sourceElement + " > " + targetPageId).css("left", "");
        $(this.sourceElement + " > " + prevPageId).css("left", "");
        // Set up location (opposite of direction of the slide)
        if (slideLeft) {
            $(this.sourceElement + " > " + targetPageId).addClass("page_right");
        } else {
            $(this.sourceElement + " > " + targetPageId).addClass("page_left");
        }
        
        // Show the new page
        $(this.sourceElement + " > " + targetPageId).removeClass("hidden");

        if (slideLeft) {
            $(this.sourceElement + " > " + targetPageId).css("left", (($(window).width() - dx) + "px"));
            $(this.sourceElement + " > " + prevPageId).css("left", (-1 * dx + "px"));
        } else {
            $(this.sourceElement + " > " + targetPageId).css("left", (((dx - $(window).width())) + "px"));
            $(this.sourceElement + " > " + prevPageId).css("left", (dx + "px"));
        }

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
        if (idIndex > pageHtml.indexOf(">", divIndex)) {
            idIndex = -1;
        }
        if ((divIndex != -1) && (idIndex != -1)) {
            let endIdIndex = pageHtml.indexOf("\"", idIndex + 4); // +3 to remove quotes from id="
            // +3 to remove "id="
            divId = pageHtml.substring(idIndex + 3, endIdIndex);
            divId = divId.replace(/\"/g, "").replace("#", ""); // Remove all quotes and hashtags
            return divId;
        } else {
            if(DO_LOG) {
                console.log("[PageTransition][verifyPageKey()]: Div or id index was invalid");
            }
            return "";
        }
        return "";
    }

}



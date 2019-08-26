

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
 * @param {String} firstPageHtml default = "". first / default page html content
 *  * @param {String} firstPageKey default = "".  first / default page displayed name

 */
function PageTransition(firstPageHtml = "", firstPageKey = "") {
    
    let pages = new Map();
    let currentPage = "";
    
    // Attempt to add the default page if given
    if(firstPageHtml !== "") {
        this.addPage(firstPageKey, firstPageHtml);
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
     */
    this.addPage = function(pageKey, pageHtml) {
        
        // Make sure these values were set
        if((pageKey !== "") && (pageHtml !== "")) {

            // This is the provided div_page id found in pageHtml
            // It needs to match pageKey to work correctly
            let rawPageId = this.verifyPageKey(pageHtml);

            // If the div_page is missing, wrap the content in it
            if(!pageHtml.includes("div_page")) {
                pageHtml = "<div id=\"" + pageKey + "\" class=\"div_page\">" + pageHtml + "</div>";

                // If the div_page id doesn't match the key, correct it
            } else if(pageKey != rawPageId) {
                let currentIdIndex = pageHtml.indexOf(rawPageId);
                let endIdIndex = currentIdIndex + rawPageId.length;
                pageHtml = pageHtml.substring(0, currentIdIndex) + pageKey + pageHtml.substring(endIdIndex, pageHtml.length);
            }

            pages.set(pageKey, pageHtml);
            currentPage = pageKey;

        } else if(pageHtml !== "") {
            if(this.verifyPageKey(pageHtml) !== "") {
                // Set the page with its id
                pages.set(this.verifyPageKey(pageHtml), pageHtml);
            }
            // Else don't set since the pageHtml isn't given
            
        } else {
            console.log("[PageTransition][addPage()]: Unable to add page due to missing parameters");
        }
    }
    
    
    this.slideRight = function(targetPageKey, duration = 1000) {
        
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
    this.verifyPageKey = function(pageHtml) {
        // Find the id of the div to compare to page Map key
        let divIndex = pageHtml.indexOf("<div");
        let idIndex = pageHtml.indexOf("id=", divIndex);
        let divId = "";
        
        if ((divIndex != -1) && (idIndex != -1)) {
            endIdIndex = content.indexOf(" ", idIndex);
            // +3 to remove "id="
            divId = content.substring(idIndex + 3, endIdIndex);
            divId = divId.replace(/\"/g, ""); // Remove all quotes
            return divId;
        } else {
            console.log("[PageTransition][verifyPageKey()]: Div or id index was invalid");
            return "";
        }
    }
    
}



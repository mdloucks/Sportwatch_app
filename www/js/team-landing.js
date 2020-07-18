/**
 * @classdesc Acts as the landing page to determine which page to show. See team-main.js for
 *            main team functionality.
 * @class
 */
class TeamLanding extends Page {
    
    /**
     * Used to handle switching between team pages and state.
     * 
     * @param {Integer} id page order / id in the supervising PageSet object
     * @param {PageSet} pageSetObject copy of the commanding PageSet object
     */
    constructor(id, pageSetObject) {
        super(id, "TeamLanding");
        
        this.pageController = pageSetObject;
        
        this.transitionObj = new PageTransition("#teamlandingPage");
        
        // ---- OBJECTS (not women!) ---- //
        this.createTeam = new CreateTeam(0, pageSetObject);
        this.joinTeam = new JoinTeam(1, pageSetObject);
        this.mainTeam = new Team(2, pageSetObject);
        
        // ---- PAGES ---- //
        
        this.landingPageHtml = (`
            <div id="landingPage" class="div_page">
                <br>
                <input id="joinTeam" class="imageButton" type="image" src="img/joinTeam.png"></input>
                <input id="createTeam" class="imageButton" type="image" src="img/createTeam.png"></input>
            </div>
        `);
        this.createPageHtml = this.createTeam.getHtml();
        this.joinPageHtml = this.joinTeam.getHtml();
        this.mainPageHtml = this.mainTeam.getHtml();
        
        // Start and stop to configure functionality
        this.createTeam.start();
        this.createTeam.stop();
        this.joinTeam.start();
        this.joinTeam.stop();
        this.mainTeam.start();
        this.mainTeam.stop();
        
    }
    
    getHtml() {
        return (`
            <div id="teamlandingPage" class="div_page">
                ${this.landingPageHtml}
                ${this.createPageHtml}
                ${this.joinPageHtml}
                ${this.mainPageHtml}
            </div>
        `);
    }
    
    start() {
        
        // Add pages
        if (this.transitionObj.getPageCount() == 0) {
            this.transitionObj.addPage("landingPage", this.landingPageHtml, true);
            this.transitionObj.addPage("createteamPage", this.createPageHtml);
            this.transitionObj.addPage("jointeamPage", this.joinPageHtml);
            this.transitionObj.addPage("teamPage", this.mainPageHtml);
        } else {
            // Hide other pages
            this.transitionObj.hidePages();
        }
        
        let storage = window.localStorage;
        
        // If not teamId is stored, show the landing page (Join / Create)
        if((storage.getItem("id_team") == null) || (storage.getItem("id_team") == undefined)) {
            
            // Start the Team Welcome / Landing page (this page's html)
            // $("#teamlandingPage").html(this.landingPageHtml);
            this.transitionObj.setCurrentPage("landingPage");
            this.transitionObj.showCurrentPage();
            
            // -- FUNCTIONALITY -- //
            $("#teamlandingPage").on("click", "#joinTeam", (e) => {
                e.preventDefault();
                $("#joinTeam").css("background-color", "gray");
                
                // Add delay so you can see the dramatic color change....
                setTimeout(() => {
                    // this.transitionObj.setCurrentPage("jointeamPage");
                    // this.transitionObj.showCurrentPage();
                    this.transitionObj.slideRight("jointeamPage");
                    this.joinTeam.start();
                }, 200);
            });
            
            $("#teamlandingPage").on("click", "#createTeam", (e) => {
                e.preventDefault();
                $("#createTeam").css("background-color", "gray");
                
                setTimeout(() => {
                    // this.transitionObj.setCurrentPage("createteamPage");
                    // this.transitionObj.showCurrentPage();
                    this.transitionObj.slideRight("createteamPage");
                    this.createTeam.start();
                }, 200);
            });
            
        } else {
            // Main Team page
            this.transitionObj.setCurrentPage("teamPage");
            this.transitionObj.showCurrentPage();
            this.mainTeam.start();
        }
    }
    
    stop() {
        this.createTeam.stop();
        this.joinTeam.stop();
        this.mainTeam.stop();
        // $("#teamlandingPage").unbind().off();
        // $("#teamlandingPage *").unbind().off();
        // Only unbind the landing page to avoid interefering with other team pages
        $("#teamlandingPage > #landingPage").unbind().off();
        $("#teamlandingPage > #landingPage *").unbind().off();
    }
    
    
}
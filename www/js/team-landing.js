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
        
        // ---- OBJECTS (not women!) ---- //
        this.createTeam = new CreateTeam(0, pageSetObject);
        // -- insert join team here -- //
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
        this.mainPageHtml = this.mainTeam.getHtml();
        
        // Start and stop to configure functionality
        this.createTeam.start();
        this.createTeam.stop();
        // -- insert join team here -- //
        this.mainTeam.start();
        this.mainTeam.stop();
        
    }
    
    getHtml() {
        return (`
            <div id="teamlandingPage" class="div_page">
                <h1>Team Page</h1>
            </div>
        `);
    }
    
    start() {
        let storage = window.localStorage;
        
        // If not teamId is stored, show the landing page (Join / Create)
        if((storage.getItem("id_team") == null) || (storage.getItem("id_team") == undefined)) {
            
            // Start the Team Welcome / Landing page (this page's html)
            $("#teamlandingPage").html(this.landingPageHtml);
            
            // -- FUNCTIONALITY -- //
            $("#teamlandingPage").on("click", "#joinTeam", (e) => {
                e.preventDefault();
                $("#joinTeam").css("background-color", "gray");
                
                // Add delay so you can see the dramatic color change....
                setTimeout(() => {
                    // TODO:
                    // $("#teamlandingPage").html(this.joinPageHtml);
                    // this.joinTeam.start();
                }, 200);
            });
            
            $("#teamlandingPage").on("click", "#createTeam", (e) => {
                e.preventDefault();
                $("#createTeam").css("background-color", "gray");
                
                setTimeout(() => {
                    $("#teamlandingPage").html(this.createPageHtml);
                    this.createTeam.start();
                }, 200);
            });
            
        } else {
            // Main Team page
            $("#teamlandingPage").html(this.mainPageHtml);
            this.mainTeam.start();
        }
    }
    
    stop() {
        this.createTeam.stop();
        // -- insert join team stoppage here as well -- //
        this.mainTeam.stop();
    }
    
    // CUSTOM FUNCTIONS
    
}


// function initTeamPage() {

//     CSSManager.resetStyling();
//     // No .css file since this page is so small
    
//     // ---- CALLBACK / STATE BIND FUNCTIONS ---- //

//     this.joinTeam = function () {
//         throw new Error("JOIN TEAM IS NOT SETUP");
//     }
//     this.onJoinTeam = (callback) => {
//         this.joinTeam = callback;
//     }

//     this.createTeam = function () {
//         throw new Error("CREATE TEAM IS NOT SETUP");
//     }
//     this.onCreateTeam = function (callback) {
//         this.createTeam = callback;
//     }
    
//     // ---- PAGES / FUNCTIONALITY ---- //
    
//     $("#app").html(`
//         <br>
//         <input id="join_team" type="image" src="img/joinTeam.png" 
//             style="width: 250px; height: 200px; margin: 5px; padding: 15px; border: solid 2px gray; border-radius: 15px; transition: background-color 0.25s;"></input>
//         <input id="create_team" type="image" src="img/createTeam.png" 
//             style="width: 250px; height: 200px; margin: 5px; padding: 15px; border: solid 2px gray; border-radius: 15px; transition: background-color 0.25s;"></input>
//     `);
    
//     // TODO Implement page changes here when the buttons are clicked
//     $("#app").on("click", "#join_team", (e) => {
//         e.preventDefault();
//         $("#join_team").css("background-color", "gray");
        
//         setTimeout(() => {
//             this.joinTeam();
//         }, 200);
//     });
    
//     $("#app").on("click", "#create_team", (e) => {
//         e.preventDefault();
//         $("#create_team").css("background-color", "gray");
        
//         setTimeout(() => {
//             this.createTeam();
//         }, 200);
//     });
    
// }